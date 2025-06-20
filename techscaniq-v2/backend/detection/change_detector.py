"""
TechScanIQ Change Detection Engine
Sophisticated change detection for technology stacks, performance, security, and content
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
import json
import re
from difflib import SequenceMatcher
import hashlib

import asyncpg
import aioredis
from deepdiff import DeepDiff

from streaming.kafka_client import (
    KafkaClient, 
    create_change_detected_message,
    KafkaMessage
)

logger = logging.getLogger(__name__)

@dataclass
class ChangeDetection:
    """Result of change detection analysis"""
    has_changes: bool
    changes: List[Dict[str, Any]]
    confidence: float
    evidence: Dict[str, Any]
    processing_time_ms: float

@dataclass
class TechnologyChange:
    """Technology stack change"""
    change_type: str  # 'added', 'removed', 'updated', 'version_changed'
    technology_name: str
    technology_category: str
    old_version: Optional[str] = None
    new_version: Optional[str] = None
    confidence: float = 1.0
    evidence: Dict[str, Any] = None
    impact_assessment: str = 'unknown'  # 'low', 'medium', 'high', 'critical'

@dataclass
class PerformanceChange:
    """Performance metric change"""
    metric_name: str
    old_value: float
    new_value: float
    change_percent: float
    threshold_exceeded: bool
    severity: str  # 'info', 'warning', 'critical'
    evidence: Dict[str, Any] = None

@dataclass
class SecurityChange:
    """Security-related change"""
    change_type: str  # 'vulnerability_added', 'vulnerability_fixed', 'security_header_changed'
    vulnerability_type: Optional[str] = None
    severity: str = 'medium'  # 'low', 'medium', 'high', 'critical'
    description: str = ''
    evidence: Dict[str, Any] = None
    cve_ids: List[str] = None
    remediation_advice: str = ''

class ChangeDetector:
    """
    Advanced change detection engine that analyzes scan results
    to identify meaningful changes in technology, performance, and security
    """
    
    def __init__(self, 
                 db_url: str,
                 redis_url: str = "redis://localhost:6379",
                 kafka_servers: str = "localhost:29092"):
        self.db_url = db_url
        self.redis_url = redis_url
        self.kafka_servers = kafka_servers
        
        # Core components
        self.db_pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[aioredis.Redis] = None
        self.kafka: Optional[KafkaClient] = None
        
        # Configuration
        self.noise_filters = self._load_noise_filters()
        self.technology_importance = self._load_technology_importance()
        
        # Metrics
        self.metrics = {
            'changes_detected': 0,
            'technology_changes': 0,
            'performance_changes': 0,
            'security_changes': 0,
            'false_positives_filtered': 0,
            'processing_time_total_ms': 0,
            'last_error': None
        }
        
        self.running = False
    
    async def start(self):
        """Initialize the change detection engine"""
        try:
            logger.info("Starting Change Detection Engine...")
            
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
                client_id="change-detector"
            )
            await self.kafka.start()
            
            # Set up Kafka consumers
            await self._setup_consumers()
            
            self.running = True
            logger.info("Change Detection Engine started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start change detection engine: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the change detection engine"""
        logger.info("Stopping Change Detection Engine...")
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
            topics=['scan.completed'],
            group_id='change-detector',
            message_handler=self._handle_scan_completed
        )
        
        logger.info("Change detector consumers set up")
    
    async def _handle_scan_completed(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle scan completion events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            scan_id = data.get('scan_id')
            result_summary = data.get('result_summary', {})
            
            if not config_id or not result_summary:
                logger.warning("Invalid scan completed message")
                return
            
            # Get previous scan for comparison
            previous_scan = await self._get_previous_scan(config_id)
            
            if previous_scan:
                # Detect changes
                start_time = datetime.now()
                detection_result = await self.detect_changes(
                    previous_scan['result_summary'],
                    result_summary,
                    config_id
                )
                processing_time = (datetime.now() - start_time).total_seconds() * 1000
                
                self.metrics['processing_time_total_ms'] += processing_time
                
                if detection_result.has_changes:
                    await self._process_detected_changes(
                        config_id, scan_id, detection_result
                    )
                    
                    logger.info(f"Detected {len(detection_result.changes)} changes for config {config_id}")
                else:
                    logger.debug(f"No changes detected for config {config_id}")
            else:
                logger.debug(f"No previous scan found for config {config_id}, skipping change detection")
            
        except Exception as e:
            logger.error(f"Error handling scan completed: {e}")
            self.metrics['last_error'] = str(e)
    
    async def detect_changes(self, 
                           old_scan: Dict[str, Any], 
                           new_scan: Dict[str, Any],
                           config_id: str) -> ChangeDetection:
        """
        Comprehensive change detection between two scan results
        """
        start_time = datetime.now()
        all_changes = []
        
        try:
            # 1. Technology Stack Changes
            tech_changes = await self._detect_technology_changes(
                old_scan.get('technologies', {}),
                new_scan.get('technologies', {})
            )
            all_changes.extend(tech_changes)
            
            # 2. Performance Changes
            perf_changes = await self._detect_performance_changes(
                old_scan.get('performance', {}),
                new_scan.get('performance', {}),
                config_id
            )
            all_changes.extend(perf_changes)
            
            # 3. Security Changes
            security_changes = await self._detect_security_changes(
                old_scan.get('security', {}),
                new_scan.get('security', {})
            )
            all_changes.extend(security_changes)
            
            # 4. Content Changes
            content_changes = await self._detect_content_changes(
                old_scan.get('content', {}),
                new_scan.get('content', {})
            )
            all_changes.extend(content_changes)
            
            # 5. Infrastructure Changes
            infra_changes = await self._detect_infrastructure_changes(
                old_scan.get('infrastructure', {}),
                new_scan.get('infrastructure', {})
            )
            all_changes.extend(infra_changes)
            
            # Filter out noise and false positives
            meaningful_changes = await self._filter_noise(all_changes)
            
            # Calculate confidence score
            confidence = self._calculate_confidence(meaningful_changes)
            
            # Gather evidence
            evidence = self._gather_evidence(old_scan, new_scan, meaningful_changes)
            
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return ChangeDetection(
                has_changes=len(meaningful_changes) > 0,
                changes=meaningful_changes,
                confidence=confidence,
                evidence=evidence,
                processing_time_ms=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in change detection: {e}")
            raise
    
    async def _detect_technology_changes(self, 
                                       old_tech: Dict[str, Any], 
                                       new_tech: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect technology stack changes"""
        changes = []
        
        try:
            old_detected = {
                (t['name'], t.get('version', '')): t 
                for t in old_tech.get('detected', [])
            }
            new_detected = {
                (t['name'], t.get('version', '')): t 
                for t in new_tech.get('detected', [])
            }
            
            old_names = {name for name, version in old_detected.keys()}
            new_names = {name for name, version in new_detected.keys()}
            
            # Added technologies
            for name in new_names - old_names:
                tech_data = next(t for t in new_tech['detected'] if t['name'] == name)
                changes.append({
                    'type': 'technology_change',
                    'change_type': 'added',
                    'technology_name': name,
                    'technology_category': tech_data.get('category', 'unknown'),
                    'new_version': tech_data.get('version'),
                    'confidence': tech_data.get('confidence', 1.0),
                    'impact_assessment': self._assess_tech_impact(name),
                    'evidence': {
                        'detection_method': tech_data.get('detection_method'),
                        'indicators': tech_data.get('indicators', [])
                    }
                })
            
            # Removed technologies
            for name in old_names - new_names:
                tech_data = next(t for t in old_tech['detected'] if t['name'] == name)
                changes.append({
                    'type': 'technology_change',
                    'change_type': 'removed',
                    'technology_name': name,
                    'technology_category': tech_data.get('category', 'unknown'),
                    'old_version': tech_data.get('version'),
                    'confidence': 1.0,
                    'impact_assessment': self._assess_tech_impact(name),
                    'evidence': {
                        'last_seen': old_tech.get('scan_timestamp'),
                        'detection_method': tech_data.get('detection_method')
                    }
                })
            
            # Version changes for existing technologies
            for name in old_names & new_names:
                old_tech_data = next(t for t in old_tech['detected'] if t['name'] == name)
                new_tech_data = next(t for t in new_tech['detected'] if t['name'] == name)
                
                old_version = old_tech_data.get('version', '')
                new_version = new_tech_data.get('version', '')
                
                if old_version and new_version and old_version != new_version:
                    # Only report if it's a significant version change
                    if self._is_significant_version_change(old_version, new_version):
                        changes.append({
                            'type': 'technology_change',
                            'change_type': 'version_changed',
                            'technology_name': name,
                            'technology_category': new_tech_data.get('category', 'unknown'),
                            'old_version': old_version,
                            'new_version': new_version,
                            'confidence': min(old_tech_data.get('confidence', 1.0), 
                                            new_tech_data.get('confidence', 1.0)),
                            'impact_assessment': self._assess_version_impact(name, old_version, new_version),
                            'evidence': {
                                'version_comparison': {
                                    'old': old_version,
                                    'new': new_version,
                                    'is_upgrade': self._is_version_upgrade(old_version, new_version)
                                }
                            }
                        })
            
            self.metrics['technology_changes'] += len(changes)
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting technology changes: {e}")
            return []
    
    async def _detect_performance_changes(self, 
                                        old_perf: Dict[str, Any], 
                                        new_perf: Dict[str, Any],
                                        config_id: str) -> List[Dict[str, Any]]:
        """Detect performance metric changes"""
        changes = []
        
        try:
            # Get performance thresholds for this config
            thresholds = await self._get_performance_thresholds(config_id)
            
            # Standard performance metrics to monitor
            metrics_to_check = [
                ('load_time', 'Page Load Time', 'ms', 15),  # 15% threshold
                ('ttfb', 'Time to First Byte', 'ms', 20),
                ('fcp', 'First Contentful Paint', 'ms', 20),
                ('lcp', 'Largest Contentful Paint', 'ms', 20),
                ('cls', 'Cumulative Layout Shift', 'score', 25),
                ('fid', 'First Input Delay', 'ms', 30),
                ('lighthouse_score', 'Lighthouse Performance Score', 'score', 10)
            ]
            
            for metric_key, metric_name, unit, default_threshold in metrics_to_check:
                old_value = old_perf.get(metric_key)
                new_value = new_perf.get(metric_key)
                
                if old_value is not None and new_value is not None and old_value > 0:
                    change_percent = ((new_value - old_value) / old_value) * 100
                    threshold = thresholds.get(metric_key, default_threshold)
                    
                    if abs(change_percent) > threshold:
                        # Determine severity
                        severity = 'info'
                        if abs(change_percent) > threshold * 2:
                            severity = 'critical'
                        elif abs(change_percent) > threshold * 1.5:
                            severity = 'warning'
                        
                        # For metrics where lower is better (load times)
                        is_degradation = change_percent > 0 if metric_key != 'lighthouse_score' else change_percent < 0
                        
                        changes.append({
                            'type': 'performance_change',
                            'metric_name': metric_key,
                            'metric_display_name': metric_name,
                            'unit': unit,
                            'old_value': old_value,
                            'new_value': new_value,
                            'change_percent': change_percent,
                            'threshold_exceeded': True,
                            'severity': severity,
                            'is_degradation': is_degradation,
                            'evidence': {
                                'threshold_used': threshold,
                                'measurement_context': {
                                    'old_scan_time': old_perf.get('scan_timestamp'),
                                    'new_scan_time': new_perf.get('scan_timestamp')
                                }
                            }
                        })
            
            # Check for new performance issues
            old_issues = set(old_perf.get('issues', []))
            new_issues = set(new_perf.get('issues', []))
            
            added_issues = new_issues - old_issues
            resolved_issues = old_issues - new_issues
            
            for issue in added_issues:
                changes.append({
                    'type': 'performance_change',
                    'change_type': 'issue_added',
                    'issue': issue,
                    'severity': 'warning',
                    'evidence': {'issue_details': issue}
                })
            
            for issue in resolved_issues:
                changes.append({
                    'type': 'performance_change',
                    'change_type': 'issue_resolved',
                    'issue': issue,
                    'severity': 'info',
                    'evidence': {'issue_details': issue}
                })
            
            self.metrics['performance_changes'] += len(changes)
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting performance changes: {e}")
            return []
    
    async def _detect_security_changes(self, 
                                     old_security: Dict[str, Any], 
                                     new_security: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect security-related changes"""
        changes = []
        
        try:
            # Vulnerability changes
            old_vulns = {v.get('id', v.get('type', '')): v for v in old_security.get('vulnerabilities', [])}
            new_vulns = {v.get('id', v.get('type', '')): v for v in new_security.get('vulnerabilities', [])}
            
            # New vulnerabilities
            for vuln_id in set(new_vulns.keys()) - set(old_vulns.keys()):
                vuln = new_vulns[vuln_id]
                changes.append({
                    'type': 'security_change',
                    'change_type': 'vulnerability_added',
                    'vulnerability_type': vuln.get('type'),
                    'severity': vuln.get('severity', 'medium'),
                    'description': vuln.get('description', ''),
                    'evidence': {
                        'vulnerability_details': vuln,
                        'cve_ids': vuln.get('cve_ids', [])
                    },
                    'remediation_advice': vuln.get('remediation', '')
                })
            
            # Fixed vulnerabilities
            for vuln_id in set(old_vulns.keys()) - set(new_vulns.keys()):
                vuln = old_vulns[vuln_id]
                changes.append({
                    'type': 'security_change',
                    'change_type': 'vulnerability_fixed',
                    'vulnerability_type': vuln.get('type'),
                    'severity': 'info',
                    'description': f"Vulnerability fixed: {vuln.get('description', vuln_id)}",
                    'evidence': {'fixed_vulnerability': vuln}
                })
            
            # Security header changes
            old_headers = old_security.get('security_headers', {})
            new_headers = new_security.get('security_headers', {})
            
            for header, old_value in old_headers.items():
                new_value = new_headers.get(header)
                if new_value != old_value:
                    changes.append({
                        'type': 'security_change',
                        'change_type': 'security_header_changed',
                        'description': f"Security header '{header}' changed",
                        'severity': self._assess_header_change_severity(header, old_value, new_value),
                        'evidence': {
                            'header': header,
                            'old_value': old_value,
                            'new_value': new_value
                        }
                    })
            
            # SSL/TLS certificate changes
            old_ssl = old_security.get('ssl_info', {})
            new_ssl = new_security.get('ssl_info', {})
            
            if old_ssl.get('fingerprint') != new_ssl.get('fingerprint'):
                changes.append({
                    'type': 'security_change',
                    'change_type': 'ssl_certificate_changed',
                    'description': 'SSL certificate changed',
                    'severity': 'medium',
                    'evidence': {
                        'old_certificate': old_ssl,
                        'new_certificate': new_ssl
                    }
                })
            
            self.metrics['security_changes'] += len(changes)
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting security changes: {e}")
            return []
    
    async def _detect_content_changes(self, 
                                    old_content: Dict[str, Any], 
                                    new_content: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect significant content changes"""
        changes = []
        
        try:
            # Page title changes
            old_title = old_content.get('title', '').strip()
            new_title = new_content.get('title', '').strip()
            
            if old_title and new_title and old_title != new_title:
                similarity = SequenceMatcher(None, old_title, new_title).ratio()
                if similarity < 0.8:  # Significant change
                    changes.append({
                        'type': 'content_change',
                        'change_type': 'title_changed',
                        'description': 'Page title changed significantly',
                        'severity': 'info',
                        'evidence': {
                            'old_title': old_title,
                            'new_title': new_title,
                            'similarity_score': similarity
                        }
                    })
            
            # Meta description changes
            old_desc = old_content.get('meta_description', '').strip()
            new_desc = new_content.get('meta_description', '').strip()
            
            if old_desc and new_desc and old_desc != new_desc:
                similarity = SequenceMatcher(None, old_desc, new_desc).ratio()
                if similarity < 0.7:
                    changes.append({
                        'type': 'content_change',
                        'change_type': 'meta_description_changed',
                        'description': 'Meta description changed significantly',
                        'severity': 'info',
                        'evidence': {
                            'old_description': old_desc,
                            'new_description': new_desc,
                            'similarity_score': similarity
                        }
                    })
            
            # Content hash changes (if available)
            old_hash = old_content.get('content_hash')
            new_hash = new_content.get('content_hash')
            
            if old_hash and new_hash and old_hash != new_hash:
                changes.append({
                    'type': 'content_change',
                    'change_type': 'content_hash_changed',
                    'description': 'Page content changed',
                    'severity': 'info',
                    'evidence': {
                        'old_hash': old_hash,
                        'new_hash': new_hash
                    }
                })
            
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting content changes: {e}")
            return []
    
    async def _detect_infrastructure_changes(self, 
                                           old_infra: Dict[str, Any], 
                                           new_infra: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Detect infrastructure and hosting changes"""
        changes = []
        
        try:
            # Server software changes
            old_server = old_infra.get('server_software', '')
            new_server = new_infra.get('server_software', '')
            
            if old_server and new_server and old_server != new_server:
                changes.append({
                    'type': 'infrastructure_change',
                    'change_type': 'server_software_changed',
                    'description': 'Server software changed',
                    'severity': 'medium',
                    'evidence': {
                        'old_server': old_server,
                        'new_server': new_server
                    }
                })
            
            # IP address changes
            old_ip = old_infra.get('ip_address', '')
            new_ip = new_infra.get('ip_address', '')
            
            if old_ip and new_ip and old_ip != new_ip:
                changes.append({
                    'type': 'infrastructure_change',
                    'change_type': 'ip_address_changed',
                    'description': 'IP address changed',
                    'severity': 'medium',
                    'evidence': {
                        'old_ip': old_ip,
                        'new_ip': new_ip
                    }
                })
            
            # CDN changes
            old_cdn = set(old_infra.get('cdn_providers', []))
            new_cdn = set(new_infra.get('cdn_providers', []))
            
            if old_cdn != new_cdn:
                changes.append({
                    'type': 'infrastructure_change',
                    'change_type': 'cdn_changed',
                    'description': 'CDN configuration changed',
                    'severity': 'info',
                    'evidence': {
                        'old_cdn': list(old_cdn),
                        'new_cdn': list(new_cdn),
                        'added_cdns': list(new_cdn - old_cdn),
                        'removed_cdns': list(old_cdn - new_cdn)
                    }
                })
            
            return changes
            
        except Exception as e:
            logger.error(f"Error detecting infrastructure changes: {e}")
            return []
    
    async def _filter_noise(self, changes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out noisy or insignificant changes"""
        meaningful_changes = []
        
        for change in changes:
            # Skip if in noise filter
            if self._is_noise(change):
                self.metrics['false_positives_filtered'] += 1
                continue
            
            # Skip minor version bumps for certain technologies
            if (change.get('type') == 'technology_change' and 
                change.get('change_type') == 'version_changed'):
                
                tech_name = change.get('technology_name', '')
                if tech_name in self.noise_filters.get('ignore_minor_updates', []):
                    old_version = change.get('old_version', '')
                    new_version = change.get('new_version', '')
                    
                    if self._is_minor_version_change(old_version, new_version):
                        self.metrics['false_positives_filtered'] += 1
                        continue
            
            # Skip very small performance changes
            if (change.get('type') == 'performance_change' and 
                abs(change.get('change_percent', 0)) < 5):
                self.metrics['false_positives_filtered'] += 1
                continue
            
            meaningful_changes.append(change)
        
        return meaningful_changes
    
    def _is_noise(self, change: Dict[str, Any]) -> bool:
        """Check if a change is noise/false positive"""
        change_type = change.get('type')
        
        # Technology-specific noise filters
        if change_type == 'technology_change':
            tech_name = change.get('technology_name', '').lower()
            
            # Common noisy technologies
            noisy_techs = self.noise_filters.get('noisy_technologies', [])
            if any(noisy in tech_name for noisy in noisy_techs):
                return True
        
        # Performance noise filters
        elif change_type == 'performance_change':
            # Very small changes are usually noise
            change_percent = abs(change.get('change_percent', 0))
            if change_percent < 2:
                return True
        
        return False
    
    def _load_noise_filters(self) -> Dict[str, Any]:
        """Load noise filtering configuration"""
        return {
            'ignore_minor_updates': [
                'google-analytics', 'gtag', 'facebook-pixel', 
                'jquery', 'bootstrap', 'font-awesome'
            ],
            'noisy_technologies': [
                'google-analytics', 'gtag', 'googletagmanager',
                'facebook-pixel', 'hotjar', 'mixpanel'
            ]
        }
    
    def _load_technology_importance(self) -> Dict[str, str]:
        """Load technology importance mapping"""
        return {
            # Critical technologies
            'apache': 'critical',
            'nginx': 'critical',
            'mysql': 'critical',
            'postgresql': 'critical',
            'redis': 'critical',
            'mongodb': 'critical',
            
            # High importance
            'react': 'high',
            'vue': 'high',
            'angular': 'high',
            'node.js': 'high',
            'express': 'high',
            'django': 'high',
            'flask': 'high',
            'rails': 'high',
            
            # Medium importance
            'jquery': 'medium',
            'bootstrap': 'medium',
            'webpack': 'medium',
            
            # Low importance
            'google-analytics': 'low',
            'gtag': 'low',
            'facebook-pixel': 'low'
        }
    
    def _assess_tech_impact(self, tech_name: str) -> str:
        """Assess the impact of a technology change"""
        tech_lower = tech_name.lower()
        return self.technology_importance.get(tech_lower, 'medium')
    
    def _assess_version_impact(self, tech_name: str, old_version: str, new_version: str) -> str:
        """Assess the impact of a version change"""
        base_impact = self._assess_tech_impact(tech_name)
        
        # Check if it's a major version change
        if self._is_major_version_change(old_version, new_version):
            # Upgrade impact level for major changes
            impact_levels = ['low', 'medium', 'high', 'critical']
            current_idx = impact_levels.index(base_impact) if base_impact in impact_levels else 1
            return impact_levels[min(current_idx + 1, len(impact_levels) - 1)]
        
        return base_impact
    
    def _is_significant_version_change(self, old_version: str, new_version: str) -> bool:
        """Check if version change is significant enough to report"""
        # Simple semantic version check
        try:
            old_parts = [int(x) for x in old_version.split('.')]
            new_parts = [int(x) for x in new_version.split('.')]
            
            # Major version change
            if len(old_parts) > 0 and len(new_parts) > 0:
                return old_parts[0] != new_parts[0]
            
            # Minor version change for critical technologies
            if len(old_parts) > 1 and len(new_parts) > 1:
                return old_parts[1] != new_parts[1]
                
        except (ValueError, IndexError):
            # If we can't parse versions, consider it significant
            return True
        
        return True
    
    def _is_minor_version_change(self, old_version: str, new_version: str) -> bool:
        """Check if this is just a minor version change"""
        try:
            old_parts = [int(x) for x in old_version.split('.')]
            new_parts = [int(x) for x in new_version.split('.')]
            
            # Only patch version changed
            if (len(old_parts) >= 3 and len(new_parts) >= 3 and
                old_parts[0] == new_parts[0] and  # Major same
                old_parts[1] == new_parts[1] and  # Minor same
                old_parts[2] != new_parts[2]):    # Patch different
                return True
                
        except (ValueError, IndexError):
            pass
        
        return False
    
    def _is_major_version_change(self, old_version: str, new_version: str) -> bool:
        """Check if this is a major version change"""
        try:
            old_major = int(old_version.split('.')[0])
            new_major = int(new_version.split('.')[0])
            return old_major != new_major
        except (ValueError, IndexError):
            return False
    
    def _is_version_upgrade(self, old_version: str, new_version: str) -> bool:
        """Check if new version is an upgrade"""
        try:
            old_parts = [int(x) for x in old_version.split('.')]
            new_parts = [int(x) for x in new_version.split('.')]
            
            for i in range(min(len(old_parts), len(new_parts))):
                if new_parts[i] > old_parts[i]:
                    return True
                elif new_parts[i] < old_parts[i]:
                    return False
            
            # If all compared parts are equal, longer version is newer
            return len(new_parts) > len(old_parts)
            
        except (ValueError, IndexError):
            return True  # Assume upgrade if can't parse
    
    def _assess_header_change_severity(self, header: str, old_value: str, new_value: str) -> str:
        """Assess severity of security header change"""
        critical_headers = [
            'strict-transport-security',
            'content-security-policy',
            'x-frame-options'
        ]
        
        if header.lower() in critical_headers:
            # Check if security was weakened
            if old_value and not new_value:
                return 'critical'  # Header removed
            return 'medium'
        
        return 'low'
    
    def _calculate_confidence(self, changes: List[Dict[str, Any]]) -> float:
        """Calculate overall confidence score for detected changes"""
        if not changes:
            return 1.0
        
        total_confidence = 0.0
        for change in changes:
            confidence = change.get('confidence', 1.0)
            
            # Adjust confidence based on change type
            change_type = change.get('type')
            if change_type == 'technology_change':
                # Technology changes are usually reliable
                confidence *= 0.9
            elif change_type == 'performance_change':
                # Performance changes can be noisy
                confidence *= 0.7
            elif change_type == 'security_change':
                # Security changes are important but can be complex
                confidence *= 0.8
            
            total_confidence += confidence
        
        return total_confidence / len(changes)
    
    def _gather_evidence(self, 
                        old_scan: Dict[str, Any], 
                        new_scan: Dict[str, Any], 
                        changes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Gather supporting evidence for detected changes"""
        return {
            'scan_timestamps': {
                'old': old_scan.get('scan_timestamp'),
                'new': new_scan.get('scan_timestamp')
            },
            'scan_metadata': {
                'old_scan_id': old_scan.get('scan_id'),
                'new_scan_id': new_scan.get('scan_id')
            },
            'change_summary': {
                'total_changes': len(changes),
                'change_types': list(set(c.get('type') for c in changes)),
                'severities': list(set(c.get('severity') for c in changes if c.get('severity')))
            },
            'detection_metadata': {
                'detector_version': '1.0.0',
                'detection_time': datetime.now(timezone.utc).isoformat()
            }
        }
    
    async def _get_previous_scan(self, config_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent scan result for comparison"""
        try:
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT result_summary, scan_timestamp, id
                    FROM scan_results 
                    WHERE config_id = $1 AND status = 'completed'
                    ORDER BY scan_timestamp DESC 
                    LIMIT 2
                """, uuid.UUID(config_id))
                
                if row:
                    return {
                        'result_summary': row['result_summary'],
                        'scan_timestamp': row['scan_timestamp'].isoformat(),
                        'scan_id': str(row['id'])
                    }
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting previous scan: {e}")
            return None
    
    async def _get_performance_thresholds(self, config_id: str) -> Dict[str, float]:
        """Get performance change thresholds for a config"""
        try:
            # Get from Redis cache first
            cache_key = f"perf_thresholds:{config_id}"
            cached = await self.redis.get(cache_key)
            
            if cached:
                return json.loads(cached)
            
            # Get from database
            async with self.db_pool.acquire() as conn:
                row = await conn.fetchrow("""
                    SELECT scan_config
                    FROM monitoring_configs 
                    WHERE id = $1
                """, uuid.UUID(config_id))
                
                if row and row['scan_config']:
                    thresholds = row['scan_config'].get('performance_thresholds', {})
                    
                    # Cache for 1 hour
                    await self.redis.setex(cache_key, 3600, json.dumps(thresholds))
                    return thresholds
            
            return {}
            
        except Exception as e:
            logger.error(f"Error getting performance thresholds: {e}")
            return {}
    
    async def _process_detected_changes(self, 
                                      config_id: str, 
                                      scan_id: str, 
                                      detection_result: ChangeDetection):
        """Process and store detected changes"""
        try:
            async with self.db_pool.acquire() as conn:
                async with conn.transaction():
                    for change in detection_result.changes:
                        change_id = str(uuid.uuid4())
                        
                        # Store in appropriate table based on change type
                        change_type = change.get('type')
                        
                        if change_type == 'technology_change':
                            await conn.execute("""
                                INSERT INTO technology_changes 
                                (id, config_id, scan_id, detected_at, change_type, 
                                 technology_name, technology_category, old_version, 
                                 new_version, confidence_score, evidence, impact_assessment)
                                VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10, $11)
                            """, 
                            uuid.UUID(change_id), uuid.UUID(config_id), uuid.UUID(scan_id),
                            change.get('change_type'), change.get('technology_name'),
                            change.get('technology_category'), change.get('old_version'),
                            change.get('new_version'), change.get('confidence', 1.0),
                            json.dumps(change.get('evidence', {})), 
                            change.get('impact_assessment', 'unknown')
                            )
                        
                        elif change_type == 'performance_change':
                            await conn.execute("""
                                INSERT INTO performance_changes 
                                (id, config_id, scan_id, detected_at, metric_name, 
                                 old_value, new_value, change_percent, threshold_exceeded, 
                                 severity, evidence)
                                VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10)
                            """, 
                            uuid.UUID(change_id), uuid.UUID(config_id), uuid.UUID(scan_id),
                            change.get('metric_name'), change.get('old_value'),
                            change.get('new_value'), change.get('change_percent'),
                            change.get('threshold_exceeded', False),
                            change.get('severity', 'info'),
                            json.dumps(change.get('evidence', {}))
                            )
                        
                        elif change_type == 'security_change':
                            await conn.execute("""
                                INSERT INTO security_changes 
                                (id, config_id, scan_id, detected_at, change_type, 
                                 vulnerability_type, severity, description, evidence, 
                                 cve_ids, remediation_advice)
                                VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10)
                            """, 
                            uuid.UUID(change_id), uuid.UUID(config_id), uuid.UUID(scan_id),
                            change.get('change_type'), change.get('vulnerability_type'),
                            change.get('severity', 'medium'), change.get('description', ''),
                            json.dumps(change.get('evidence', {})),
                            change.get('cve_ids', []), change.get('remediation_advice', '')
                            )
                        
                        # Send change detected message to Kafka
                        message = await create_change_detected_message(
                            config_id=config_id,
                            change_type=change_type,
                            change_details=change
                        )
                        
                        await self.kafka.produce_message(
                            topic='change.detected',
                            message=message,
                            key=config_id
                        )
            
            self.metrics['changes_detected'] += len(detection_result.changes)
            logger.info(f"Processed {len(detection_result.changes)} changes for config {config_id}")
            
        except Exception as e:
            logger.error(f"Error processing detected changes: {e}")
            raise