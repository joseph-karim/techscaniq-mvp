"""
TechScanIQ Alert Engine
Flexible alerting system with rule evaluation and multi-channel notifications
"""

import asyncio
import logging
import uuid
import json
import smtplib
import aiohttp
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import jinja2
from pathlib import Path

import asyncpg
import aioredis
from twilio.rest import Client as TwilioClient

from streaming.kafka_client import (
    KafkaClient, 
    create_alert_triggered_message,
    KafkaMessage
)

logger = logging.getLogger(__name__)

@dataclass
class AlertRule:
    """Alert rule configuration"""
    id: str
    name: str
    conditions: Dict[str, Any]
    severity: str
    notification_channels: List[Dict[str, Any]]
    enabled: bool = True
    throttle_minutes: int = 60
    escalation_rules: Optional[List[Dict[str, Any]]] = None

@dataclass
class Alert:
    """Alert instance"""
    id: str
    config_id: str
    rule_name: str
    alert_type: str
    severity: str
    title: str
    description: str
    details: Dict[str, Any]
    change_reference_id: Optional[str] = None
    change_reference_type: Optional[str] = None
    triggered_at: datetime = None
    
    def __post_init__(self):
        if self.triggered_at is None:
            self.triggered_at = datetime.now(timezone.utc)

class NotificationChannel:
    """Base class for notification channels"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.channel_type = config.get('type')
    
    async def send_notification(self, alert: Alert) -> Dict[str, Any]:
        """Send notification for alert"""
        raise NotImplementedError
    
    async def test_connection(self) -> bool:
        """Test if the notification channel is properly configured"""
        return True

class EmailChannel(NotificationChannel):
    """Email notification channel"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.smtp_host = config.get('smtp_host', 'localhost')
        self.smtp_port = config.get('smtp_port', 587)
        self.smtp_username = config.get('smtp_username')
        self.smtp_password = config.get('smtp_password')
        self.use_tls = config.get('use_tls', True)
        self.from_address = config.get('from_address')
        self.recipients = config.get('recipients', [])
    
    async def send_notification(self, alert: Alert) -> Dict[str, Any]:
        """Send email notification"""
        try:
            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[{alert.severity.upper()}] {alert.title}"
            msg['From'] = self.from_address
            msg['To'] = ', '.join(self.recipients)
            
            # Create HTML and text content
            html_content = await self._generate_html_content(alert)
            text_content = await self._generate_text_content(alert)
            
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                if self.smtp_username and self.smtp_password:
                    server.login(self.smtp_username, self.smtp_password)
                
                server.send_message(msg)
            
            return {
                'status': 'sent',
                'recipients': self.recipients,
                'message_id': msg.get('Message-ID')
            }
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    async def _generate_html_content(self, alert: Alert) -> str:
        """Generate HTML email content"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background-color: {{ severity_color }}; color: white; padding: 20px; border-radius: 5px; }
                .content { margin: 20px 0; }
                .details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
                .severity-{{ alert.severity }} { border-left: 4px solid {{ severity_color }}; }
            </style>
        </head>
        <body>
            <div class="header severity-{{ alert.severity }}">
                <h2>{{ alert.title }}</h2>
                <p><strong>Severity:</strong> {{ alert.severity.upper() }}</p>
                <p><strong>Time:</strong> {{ alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC') }}</p>
            </div>
            
            <div class="content">
                <p>{{ alert.description }}</p>
                
                {% if alert.details %}
                <div class="details">
                    <h3>Details</h3>
                    {% for key, value in alert.details.items() %}
                    <p><strong>{{ key.replace('_', ' ').title() }}:</strong> {{ value }}</p>
                    {% endfor %}
                </div>
                {% endif %}
            </div>
            
            <div class="footer">
                <p>This alert was generated by TechScanIQ Monitoring System.</p>
                <p>Alert ID: {{ alert.id }}</p>
            </div>
        </body>
        </html>
        """
        
        severity_colors = {
            'low': '#28a745',
            'medium': '#ffc107', 
            'high': '#fd7e14',
            'critical': '#dc3545'
        }
        
        template_obj = jinja2.Template(template)
        return template_obj.render(
            alert=alert,
            severity_color=severity_colors.get(alert.severity, '#6c757d')
        )
    
    async def _generate_text_content(self, alert: Alert) -> str:
        """Generate plain text email content"""
        content = f"""
TechScanIQ Alert: {alert.title}

Severity: {alert.severity.upper()}
Time: {alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

Description:
{alert.description}

Details:
"""
        for key, value in alert.details.items():
            content += f"- {key.replace('_', ' ').title()}: {value}\n"
        
        content += f"\nAlert ID: {alert.id}"
        content += "\n\nThis alert was generated by TechScanIQ Monitoring System."
        
        return content

class SlackChannel(NotificationChannel):
    """Slack notification channel"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.webhook_url = config.get('webhook_url')
        self.channel = config.get('channel')
        self.username = config.get('username', 'TechScanIQ')
        self.icon_emoji = config.get('icon_emoji', ':warning:')
    
    async def send_notification(self, alert: Alert) -> Dict[str, Any]:
        """Send Slack notification"""
        try:
            # Create Slack message
            color_map = {
                'low': 'good',
                'medium': 'warning',
                'high': 'warning', 
                'critical': 'danger'
            }
            
            payload = {
                'username': self.username,
                'icon_emoji': self.icon_emoji,
                'attachments': [
                    {
                        'color': color_map.get(alert.severity, 'warning'),
                        'title': alert.title,
                        'text': alert.description,
                        'fields': [
                            {
                                'title': 'Severity',
                                'value': alert.severity.upper(),
                                'short': True
                            },
                            {
                                'title': 'Time',
                                'value': alert.triggered_at.strftime('%Y-%m-%d %H:%M:%S UTC'),
                                'short': True
                            }
                        ],
                        'footer': 'TechScanIQ Monitoring',
                        'footer_icon': 'https://techscaniq.com/icon.png',
                        'ts': int(alert.triggered_at.timestamp())
                    }
                ]
            }
            
            # Add details as fields
            for key, value in list(alert.details.items())[:5]:  # Limit to 5 fields
                payload['attachments'][0]['fields'].append({
                    'title': key.replace('_', ' ').title(),
                    'value': str(value),
                    'short': True
                })
            
            if self.channel:
                payload['channel'] = self.channel
            
            # Send to Slack
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status == 200:
                        return {
                            'status': 'sent',
                            'channel': self.channel,
                            'response': await response.text()
                        }
                    else:
                        return {
                            'status': 'failed',
                            'error': f"HTTP {response.status}: {await response.text()}"
                        }
            
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }

class WebhookChannel(NotificationChannel):
    """Generic webhook notification channel"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.url = config.get('url')
        self.method = config.get('method', 'POST').upper()
        self.headers = config.get('headers', {})
        self.auth = config.get('auth')
    
    async def send_notification(self, alert: Alert) -> Dict[str, Any]:
        """Send webhook notification"""
        try:
            # Prepare payload
            payload = {
                'alert_id': alert.id,
                'config_id': alert.config_id,
                'rule_name': alert.rule_name,
                'alert_type': alert.alert_type,
                'severity': alert.severity,
                'title': alert.title,
                'description': alert.description,
                'details': alert.details,
                'triggered_at': alert.triggered_at.isoformat(),
                'change_reference_id': alert.change_reference_id,
                'change_reference_type': alert.change_reference_type
            }
            
            # Prepare headers
            headers = {'Content-Type': 'application/json'}
            headers.update(self.headers)
            
            # Prepare auth
            auth = None
            if self.auth and self.auth.get('type') == 'basic':
                auth = aiohttp.BasicAuth(
                    self.auth.get('username'),
                    self.auth.get('password')
                )
            
            # Send webhook
            async with aiohttp.ClientSession() as session:
                if self.method == 'POST':
                    async with session.post(
                        self.url, 
                        json=payload, 
                        headers=headers, 
                        auth=auth,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        return {
                            'status': 'sent' if response.status < 400 else 'failed',
                            'http_status': response.status,
                            'response': await response.text()
                        }
                else:
                    # For GET requests, send as query parameters
                    async with session.get(
                        self.url,
                        params=payload,
                        headers=headers,
                        auth=auth,
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as response:
                        return {
                            'status': 'sent' if response.status < 400 else 'failed',
                            'http_status': response.status,
                            'response': await response.text()
                        }
            
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }

class SMSChannel(NotificationChannel):
    """SMS notification channel using Twilio"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.account_sid = config.get('account_sid')
        self.auth_token = config.get('auth_token')
        self.from_number = config.get('from_number')
        self.to_numbers = config.get('to_numbers', [])
        
        if self.account_sid and self.auth_token:
            self.client = TwilioClient(self.account_sid, self.auth_token)
        else:
            self.client = None
    
    async def send_notification(self, alert: Alert) -> Dict[str, Any]:
        """Send SMS notification"""
        if not self.client:
            return {
                'status': 'failed',
                'error': 'Twilio client not configured'
            }
        
        try:
            # Create SMS message
            message_text = f"[{alert.severity.upper()}] {alert.title}\n{alert.description}"
            if len(message_text) > 160:
                message_text = message_text[:157] + "..."
            
            results = []
            for to_number in self.to_numbers:
                try:
                    message = self.client.messages.create(
                        body=message_text,
                        from_=self.from_number,
                        to=to_number
                    )
                    results.append({
                        'to': to_number,
                        'status': 'sent',
                        'message_sid': message.sid
                    })
                except Exception as e:
                    results.append({
                        'to': to_number,
                        'status': 'failed',
                        'error': str(e)
                    })
            
            return {
                'status': 'sent' if any(r['status'] == 'sent' for r in results) else 'failed',
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS notification: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }

class AlertEngine:
    """
    Alert engine that processes change events and triggers notifications
    """
    
    def __init__(self, 
                 db_url: str,
                 redis_url: str = "redis://localhost:6379",
                 kafka_servers: str = "localhost:29092",
                 smtp_config: Optional[Dict[str, Any]] = None):
        self.db_url = db_url
        self.redis_url = redis_url
        self.kafka_servers = kafka_servers
        self.smtp_config = smtp_config or {}
        
        # Core components
        self.db_pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[aioredis.Redis] = None
        self.kafka: Optional[KafkaClient] = None
        
        # Channel handlers
        self.channel_handlers = {
            'email': EmailChannel,
            'slack': SlackChannel,
            'webhook': WebhookChannel,
            'sms': SMSChannel
        }
        
        # Metrics
        self.metrics = {
            'alerts_triggered': 0,
            'alerts_sent': 0,
            'alerts_failed': 0,
            'notifications_sent': 0,
            'notifications_failed': 0,
            'rules_evaluated': 0,
            'last_error': None
        }
        
        self.running = False
    
    async def start(self):
        """Initialize the alert engine"""
        try:
            logger.info("Starting Alert Engine...")
            
            # Initialize database connection
            self.db_pool = await asyncpg.create_pool(
                self.db_url,
                min_size=3,
                max_size=10,
                command_timeout=60
            )
            
            # Initialize Redis
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            
            # Initialize Kafka
            self.kafka = KafkaClient(
                bootstrap_servers=self.kafka_servers,
                redis_url=self.redis_url,
                client_id="alert-engine"
            )
            await self.kafka.start()
            
            # Set up Kafka consumers
            await self._setup_consumers()
            
            self.running = True
            logger.info("Alert Engine started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start alert engine: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the alert engine"""
        logger.info("Stopping Alert Engine...")
        self.running = False
        
        try:
            if self.kafka:
                await self.kafka.stop()
            if self.redis:
                await self.redis.close()
            if self.db_pool:
                await self.db_pool.close()
                
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    async def _setup_consumers(self):
        """Set up Kafka consumers"""
        await self.kafka.create_consumer(
            topics=['change.detected'],
            group_id='alert-engine-changes',
            message_handler=self._handle_change_detected
        )
        
        await self.kafka.create_consumer(
            topics=['alert.triggered'],
            group_id='alert-engine-notifications',
            message_handler=self._handle_alert_triggered
        )
        
        logger.info("Alert engine consumers set up")
    
    async def _handle_change_detected(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle change detection events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            change_type = data.get('change_type')
            change_details = data.get('change_details', {})
            
            if not config_id or not change_type:
                logger.warning("Invalid change detected message")
                return
            
            # Get alert rules for this config
            alert_rules = await self._get_alert_rules(config_id)
            
            # Evaluate each rule
            for rule in alert_rules:
                if await self._evaluate_rule(rule, change_details):
                    alert = await self._create_alert(config_id, rule, change_details)
                    if alert:
                        await self._trigger_alert(alert)
            
        except Exception as e:
            logger.error(f"Error handling change detected: {e}")
            self.metrics['last_error'] = str(e)
    
    async def _handle_alert_triggered(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle alert triggered events for notifications"""
        try:
            data = message.data
            alert_id = data.get('alert_id')
            
            if not alert_id:
                logger.warning("Invalid alert triggered message")
                return
            
            # Get alert details
            alert = await self._get_alert_by_id(alert_id)
            if not alert:
                logger.warning(f"Alert not found: {alert_id}")
                return
            
            # Send notifications
            await self._send_notifications(alert)
            
        except Exception as e:
            logger.error(f"Error handling alert triggered: {e}")
            self.metrics['last_error'] = str(e)
    
    async def _get_alert_rules(self, config_id: str) -> List[AlertRule]:
        """Get alert rules for a monitoring configuration"""
        try:
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT alert_rules FROM monitoring_configs WHERE id = $1
                """, uuid.UUID(config_id))
                
                if row and row['alert_rules']:
                    rules = []
                    for rule_data in row['alert_rules']:
                        rule = AlertRule(
                            id=rule_data.get('id', str(uuid.uuid4())),
                            name=rule_data.get('name', ''),
                            conditions=rule_data.get('conditions', {}),
                            severity=rule_data.get('severity', 'medium'),
                            notification_channels=rule_data.get('notification_channels', []),
                            enabled=rule_data.get('enabled', True),
                            throttle_minutes=rule_data.get('throttle_minutes', 60),
                            escalation_rules=rule_data.get('escalation_rules')
                        )
                        rules.append(rule)
                    return rules
                
                return []
                
        except Exception as e:
            logger.error(f"Error getting alert rules: {e}")
            return []
    
    async def _evaluate_rule(self, rule: AlertRule, change_details: Dict[str, Any]) -> bool:
        """Evaluate if a rule matches the change"""
        try:
            if not rule.enabled:
                return False
            
            conditions = rule.conditions
            self.metrics['rules_evaluated'] += 1
            
            # Simple condition matching
            if conditions.get('type') == 'simple':
                return self._match_simple_condition(conditions, change_details)
            
            # Complex condition with expressions
            elif conditions.get('type') == 'expression':
                return self._evaluate_expression(conditions.get('expression', ''), change_details)
            
            # Technology-specific conditions
            elif conditions.get('type') == 'technology':
                return self._match_technology_condition(conditions, change_details)
            
            # Performance-specific conditions
            elif conditions.get('type') == 'performance':
                return self._match_performance_condition(conditions, change_details)
            
            # Security-specific conditions
            elif conditions.get('type') == 'security':
                return self._match_security_condition(conditions, change_details)
            
            return False
            
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.name}: {e}")
            return False
    
    def _match_simple_condition(self, conditions: Dict[str, Any], change_details: Dict[str, Any]) -> bool:
        """Match simple field-based conditions"""
        for field, expected_value in conditions.get('matches', {}).items():
            actual_value = change_details.get(field)
            
            if isinstance(expected_value, list):
                if actual_value not in expected_value:
                    return False
            else:
                if actual_value != expected_value:
                    return False
        
        return True
    
    def _match_technology_condition(self, conditions: Dict[str, Any], change_details: Dict[str, Any]) -> bool:
        """Match technology-specific conditions"""
        if change_details.get('type') != 'technology_change':
            return False
        
        # Match specific technologies
        if 'technologies' in conditions:
            tech_name = change_details.get('technology_name', '').lower()
            if not any(tech.lower() in tech_name for tech in conditions['technologies']):
                return False
        
        # Match change types
        if 'change_types' in conditions:
            if change_details.get('change_type') not in conditions['change_types']:
                return False
        
        # Match severity/impact
        if 'min_impact' in conditions:
            impact_levels = ['low', 'medium', 'high', 'critical']
            min_impact_idx = impact_levels.index(conditions['min_impact'])
            actual_impact_idx = impact_levels.index(change_details.get('impact_assessment', 'low'))
            if actual_impact_idx < min_impact_idx:
                return False
        
        return True
    
    def _match_performance_condition(self, conditions: Dict[str, Any], change_details: Dict[str, Any]) -> bool:
        """Match performance-specific conditions"""
        if change_details.get('type') != 'performance_change':
            return False
        
        # Match specific metrics
        if 'metrics' in conditions:
            if change_details.get('metric_name') not in conditions['metrics']:
                return False
        
        # Match change threshold
        if 'min_change_percent' in conditions:
            change_percent = abs(change_details.get('change_percent', 0))
            if change_percent < conditions['min_change_percent']:
                return False
        
        # Match degradation only
        if conditions.get('degradation_only'):
            if not change_details.get('is_degradation', False):
                return False
        
        return True
    
    def _match_security_condition(self, conditions: Dict[str, Any], change_details: Dict[str, Any]) -> bool:
        """Match security-specific conditions"""
        if change_details.get('type') != 'security_change':
            return False
        
        # Match severity levels
        if 'min_severity' in conditions:
            severity_levels = ['low', 'medium', 'high', 'critical']
            min_severity_idx = severity_levels.index(conditions['min_severity'])
            actual_severity_idx = severity_levels.index(change_details.get('severity', 'low'))
            if actual_severity_idx < min_severity_idx:
                return False
        
        # Match vulnerability types
        if 'vulnerability_types' in conditions:
            vuln_type = change_details.get('vulnerability_type')
            if vuln_type not in conditions['vulnerability_types']:
                return False
        
        return True
    
    def _evaluate_expression(self, expression: str, change_details: Dict[str, Any]) -> bool:
        """Evaluate complex expressions (basic implementation)"""
        # This is a simplified expression evaluator
        # In production, you'd want a more robust expression engine
        try:
            # Replace field references with actual values
            for key, value in change_details.items():
                if isinstance(value, (int, float)):
                    expression = expression.replace(f"${key}", str(value))
                elif isinstance(value, str):
                    expression = expression.replace(f"${key}", f"'{value}'")
            
            # Evaluate basic expressions
            return eval(expression)
            
        except Exception as e:
            logger.error(f"Error evaluating expression '{expression}': {e}")
            return False
    
    async def _create_alert(self, config_id: str, rule: AlertRule, change_details: Dict[str, Any]) -> Optional[Alert]:
        """Create an alert instance"""
        try:
            # Check throttling
            if await self._is_throttled(config_id, rule.id):
                return None
            
            alert_id = str(uuid.uuid4())
            
            # Generate alert title and description
            title = await self._generate_alert_title(rule, change_details)
            description = await self._generate_alert_description(rule, change_details)
            
            alert = Alert(
                id=alert_id,
                config_id=config_id,
                rule_name=rule.name,
                alert_type=change_details.get('type', 'unknown'),
                severity=rule.severity,
                title=title,
                description=description,
                details=change_details,
                change_reference_id=change_details.get('id'),
                change_reference_type=change_details.get('type')
            )
            
            # Store alert in database
            await self._store_alert(alert, rule.notification_channels)
            
            # Set throttling
            await self._set_throttle(config_id, rule.id, rule.throttle_minutes)
            
            return alert
            
        except Exception as e:
            logger.error(f"Error creating alert: {e}")
            return None
    
    async def _generate_alert_title(self, rule: AlertRule, change_details: Dict[str, Any]) -> str:
        """Generate alert title"""
        change_type = change_details.get('type', 'unknown')
        
        if change_type == 'technology_change':
            tech_name = change_details.get('technology_name', 'Unknown')
            change_subtype = change_details.get('change_type', 'changed')
            return f"Technology {change_subtype}: {tech_name}"
        
        elif change_type == 'performance_change':
            metric_name = change_details.get('metric_display_name', 
                                          change_details.get('metric_name', 'Performance'))
            change_percent = change_details.get('change_percent', 0)
            direction = 'degraded' if change_percent > 0 else 'improved'
            return f"{metric_name} {direction} by {abs(change_percent):.1f}%"
        
        elif change_type == 'security_change':
            change_subtype = change_details.get('change_type', 'Security issue')
            return f"Security: {change_subtype.replace('_', ' ').title()}"
        
        else:
            return f"{rule.name}: {change_type.replace('_', ' ').title()}"
    
    async def _generate_alert_description(self, rule: AlertRule, change_details: Dict[str, Any]) -> str:
        """Generate alert description"""
        change_type = change_details.get('type', 'unknown')
        
        if change_type == 'technology_change':
            tech_name = change_details.get('technology_name', 'Unknown')
            change_subtype = change_details.get('change_type', 'changed')
            old_version = change_details.get('old_version')
            new_version = change_details.get('new_version')
            
            if change_subtype == 'version_changed' and old_version and new_version:
                return f"{tech_name} was updated from version {old_version} to {new_version}"
            elif change_subtype == 'added':
                return f"{tech_name} was detected on the website"
            elif change_subtype == 'removed':
                return f"{tech_name} is no longer detected on the website"
            else:
                return f"{tech_name} has changed"
        
        elif change_type == 'performance_change':
            metric_name = change_details.get('metric_display_name', 
                                          change_details.get('metric_name', 'Performance metric'))
            old_value = change_details.get('old_value')
            new_value = change_details.get('new_value')
            unit = change_details.get('unit', '')
            
            return f"{metric_name} changed from {old_value}{unit} to {new_value}{unit}"
        
        elif change_type == 'security_change':
            return change_details.get('description', 'Security-related change detected')
        
        else:
            return f"Change detected: {change_type.replace('_', ' ')}"
    
    async def _is_throttled(self, config_id: str, rule_id: str) -> bool:
        """Check if alert is throttled"""
        try:
            throttle_key = f"alert_throttle:{config_id}:{rule_id}"
            return await self.redis.exists(throttle_key)
        except Exception:
            return False
    
    async def _set_throttle(self, config_id: str, rule_id: str, throttle_minutes: int):
        """Set alert throttling"""
        try:
            throttle_key = f"alert_throttle:{config_id}:{rule_id}"
            await self.redis.setex(throttle_key, throttle_minutes * 60, '1')
        except Exception as e:
            logger.error(f"Error setting throttle: {e}")
    
    async def _store_alert(self, alert: Alert, notification_channels: List[Dict[str, Any]]):
        """Store alert in database"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO monitoring_alerts 
                    (id, config_id, rule_name, alert_type, severity, title, description, 
                     details, change_reference_id, change_reference_type, triggered_at, 
                     notification_channels)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                """, 
                uuid.UUID(alert.id), uuid.UUID(alert.config_id), alert.rule_name,
                alert.alert_type, alert.severity, alert.title, alert.description,
                json.dumps(alert.details), 
                uuid.UUID(alert.change_reference_id) if alert.change_reference_id else None,
                alert.change_reference_type, alert.triggered_at,
                json.dumps(notification_channels)
                )
                
        except Exception as e:
            logger.error(f"Error storing alert: {e}")
            raise
    
    async def _trigger_alert(self, alert: Alert):
        """Trigger an alert by sending to Kafka"""
        try:
            message = await create_alert_triggered_message(
                alert_id=alert.id,
                config_id=alert.config_id,
                alert_type=alert.alert_type,
                severity=alert.severity,
                details=alert.details
            )
            
            await self.kafka.produce_message(
                topic='alert.triggered',
                message=message,
                key=alert.config_id
            )
            
            self.metrics['alerts_triggered'] += 1
            logger.info(f"Alert triggered: {alert.title} ({alert.id})")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {e}")
            self.metrics['alerts_failed'] += 1
    
    async def _get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        """Get alert by ID from database"""
        try:
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT id, config_id, rule_name, alert_type, severity, title, 
                           description, details, change_reference_id, change_reference_type, 
                           triggered_at, notification_channels
                    FROM monitoring_alerts 
                    WHERE id = $1
                """, uuid.UUID(alert_id))
                
                if row:
                    return Alert(
                        id=str(row['id']),
                        config_id=str(row['config_id']),
                        rule_name=row['rule_name'],
                        alert_type=row['alert_type'],
                        severity=row['severity'],
                        title=row['title'],
                        description=row['description'],
                        details=row['details'],
                        change_reference_id=str(row['change_reference_id']) if row['change_reference_id'] else None,
                        change_reference_type=row['change_reference_type'],
                        triggered_at=row['triggered_at']
                    ), row['notification_channels']
                
                return None, []
                
        except Exception as e:
            logger.error(f"Error getting alert by ID: {e}")
            return None, []
    
    async def _send_notifications(self, alert_data: tuple):
        """Send notifications for an alert"""
        alert, notification_channels = alert_data
        if not alert:
            return
        
        try:
            results = []
            
            for channel_config in notification_channels:
                channel_type = channel_config.get('type')
                
                if channel_type not in self.channel_handlers:
                    logger.warning(f"Unknown notification channel type: {channel_type}")
                    continue
                
                # Create channel handler
                handler_class = self.channel_handlers[channel_type]
                
                # Merge with default SMTP config for email channels
                if channel_type == 'email':
                    merged_config = {**self.smtp_config, **channel_config}
                    channel = handler_class(merged_config)
                else:
                    channel = handler_class(channel_config)
                
                # Send notification
                result = await channel.send_notification(alert)
                results.append({
                    'channel_type': channel_type,
                    'channel_config': channel_config.get('name', 'unnamed'),
                    **result
                })
                
                # Log notification attempt
                await self._log_notification_attempt(alert.id, channel_type, channel_config, result)
                
                if result['status'] == 'sent':
                    self.metrics['notifications_sent'] += 1
                else:
                    self.metrics['notifications_failed'] += 1
            
            # Update alert status
            await self._update_alert_notification_status(alert.id, results)
            
            if any(r['status'] == 'sent' for r in results):
                self.metrics['alerts_sent'] += 1
                logger.info(f"Notifications sent for alert {alert.id}")
            else:
                self.metrics['alerts_failed'] += 1
                logger.error(f"All notifications failed for alert {alert.id}")
            
        except Exception as e:
            logger.error(f"Error sending notifications: {e}")
            self.metrics['notifications_failed'] += 1
    
    async def _log_notification_attempt(self, alert_id: str, channel_type: str, 
                                      channel_config: Dict[str, Any], result: Dict[str, Any]):
        """Log notification attempt to database"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO alert_notifications 
                    (id, alert_id, channel_type, channel_config, status, error_message, response_data)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """, 
                uuid.uuid4(), uuid.UUID(alert_id), channel_type,
                json.dumps(channel_config), result['status'],
                result.get('error'), json.dumps(result)
                )
                
        except Exception as e:
            logger.error(f"Error logging notification attempt: {e}")
    
    async def _update_alert_notification_status(self, alert_id: str, results: List[Dict[str, Any]]):
        """Update alert notification status"""
        try:
            notification_sent = any(r['status'] == 'sent' for r in results)
            
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE monitoring_alerts 
                    SET notification_sent = $1, notification_attempts = notification_attempts + 1,
                        last_notification_attempt = NOW()
                    WHERE id = $2
                """, notification_sent, uuid.UUID(alert_id))
                
        except Exception as e:
            logger.error(f"Error updating alert notification status: {e}")
    
    async def get_engine_status(self) -> Dict[str, Any]:
        """Get current engine status and metrics"""
        return {
            'running': self.running,
            'metrics': self.metrics.copy(),
            'kafka_health': await self.kafka.health_check() if self.kafka else None,
            'redis_connected': bool(self.redis),
            'db_connected': bool(self.db_pool),
            'supported_channels': list(self.channel_handlers.keys())
        }