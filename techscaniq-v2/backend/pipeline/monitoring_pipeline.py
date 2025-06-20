"""
TechScanIQ Monitoring Pipeline Core
Manages the continuous monitoring system with scheduling, rate limiting, and message processing
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

import asyncpg
import aioredis
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from croniter import croniter

from streaming.kafka_client import (
    KafkaClient, 
    create_scan_scheduled_message,
    create_scan_completed_message,
    KafkaMessage
)

logger = logging.getLogger(__name__)

@dataclass
class MonitoringConfig:
    """Monitoring configuration data structure"""
    id: str
    organization_id: str
    name: str
    url: str
    schedule: Dict[str, Any]
    scan_config: Dict[str, Any]
    alert_rules: List[Dict[str, Any]]
    enabled: bool
    last_scan_at: Optional[datetime] = None
    next_scan_at: Optional[datetime] = None

@dataclass
class ScanJob:
    """Scan job data structure"""
    job_id: str
    config_id: str
    url: str
    scan_config: Dict[str, Any]
    scheduled_time: datetime
    priority: str = 'normal'

class RateLimiter:
    """Rate limiter for managing scan frequency per domain"""
    
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
    
    async def is_allowed(self, url: str, min_interval_minutes: int = 5) -> bool:
        """Check if a scan is allowed for the given URL"""
        domain = self._extract_domain(url)
        rate_limit_key = f"scan_rate:{domain}"
        
        last_scan = await self.redis.get(rate_limit_key)
        if last_scan:
            last_scan_time = datetime.fromisoformat(last_scan.decode())
            if datetime.now(timezone.utc) - last_scan_time < timedelta(minutes=min_interval_minutes):
                return False
        
        return True
    
    async def record_scan(self, url: str, ttl_minutes: int = 5):
        """Record that a scan was performed for rate limiting"""
        domain = self._extract_domain(url)
        rate_limit_key = f"scan_rate:{domain}"
        
        await self.redis.setex(
            rate_limit_key,
            ttl_minutes * 60,
            datetime.now(timezone.utc).isoformat()
        )
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL for rate limiting"""
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc.lower()

class MonitoringPipeline:
    """
    Core monitoring pipeline that manages:
    - Scheduled scanning
    - Rate limiting
    - Message production/consumption
    - Database operations
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
        self.scheduler: Optional[AsyncIOScheduler] = None
        self.rate_limiter: Optional[RateLimiter] = None
        
        # State
        self.running = False
        self.active_configs: Dict[str, MonitoringConfig] = {}
        
        # Metrics
        self.metrics = {
            'scans_scheduled': 0,
            'scans_rate_limited': 0,
            'scans_completed': 0,
            'scans_failed': 0,
            'configs_loaded': 0,
            'last_error': None
        }
    
    async def start(self):
        """Initialize and start the monitoring pipeline"""
        try:
            logger.info("Starting TechScanIQ Monitoring Pipeline...")
            
            # Initialize database connection pool
            self.db_pool = await asyncpg.create_pool(
                self.db_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("Database connection pool created")
            
            # Initialize Redis
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            self.rate_limiter = RateLimiter(self.redis)
            logger.info("Redis connection established")
            
            # Initialize Kafka client
            self.kafka = KafkaClient(
                bootstrap_servers=self.kafka_servers,
                redis_url=self.redis_url,
                client_id="monitoring-pipeline"
            )
            await self.kafka.start()
            logger.info("Kafka client started")
            
            # Initialize scheduler
            self.scheduler = AsyncIOScheduler(timezone='UTC')
            self.scheduler.start()
            logger.info("Scheduler started")
            
            # Set up Kafka consumers
            await self._setup_consumers()
            
            # Load monitoring configurations
            await self._load_monitoring_configs()
            
            # Start periodic tasks
            self._start_periodic_tasks()
            
            self.running = True
            logger.info("Monitoring Pipeline started successfully")
            
        except Exception as e:
            logger.error(f"Failed to start monitoring pipeline: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Gracefully shutdown the monitoring pipeline"""
        logger.info("Stopping monitoring pipeline...")
        self.running = False
        
        try:
            if self.scheduler:
                self.scheduler.shutdown(wait=True)
                logger.info("Scheduler stopped")
            
            if self.kafka:
                await self.kafka.stop()
                logger.info("Kafka client stopped")
            
            if self.redis:
                await self.redis.close()
                logger.info("Redis connection closed")
            
            if self.db_pool:
                await self.db_pool.close()
                logger.info("Database pool closed")
                
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    async def _setup_consumers(self):
        """Set up Kafka consumers for pipeline messages"""
        # Consumer for scan completion events
        await self.kafka.create_consumer(
            topics=['scan.completed'],
            group_id='monitoring-pipeline-scan-processor',
            message_handler=self._handle_scan_completed
        )
        
        # Consumer for system health events
        await self.kafka.create_consumer(
            topics=['system.health'],
            group_id='monitoring-pipeline-health',
            message_handler=self._handle_system_health
        )
        
        logger.info("Kafka consumers set up")
    
    async def _load_monitoring_configs(self):
        """Load all active monitoring configurations from database"""
        try:
            async with self.db_pool.acquire() as conn:
                rows = await conn.fetch("""
                    SELECT id, organization_id, name, url, schedule, scan_config, 
                           alert_rules, enabled, last_scan_at, next_scan_at
                    FROM monitoring_configs 
                    WHERE enabled = true
                """)
                
                self.active_configs.clear()
                
                for row in rows:
                    config = MonitoringConfig(
                        id=str(row['id']),
                        organization_id=str(row['organization_id']),
                        name=row['name'],
                        url=row['url'],
                        schedule=row['schedule'],
                        scan_config=row['scan_config'],
                        alert_rules=row['alert_rules'],
                        enabled=row['enabled'],
                        last_scan_at=row['last_scan_at'],
                        next_scan_at=row['next_scan_at']
                    )
                    
                    self.active_configs[config.id] = config
                    await self._schedule_config(config)
                
                self.metrics['configs_loaded'] = len(self.active_configs)
                logger.info(f"Loaded {len(self.active_configs)} monitoring configurations")
                
        except Exception as e:
            logger.error(f"Failed to load monitoring configurations: {e}")
            raise
    
    async def _schedule_config(self, config: MonitoringConfig):
        """Schedule a monitoring configuration"""
        try:
            job_id = f"scan_{config.id}"
            
            # Remove existing job if it exists
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
            
            schedule = config.schedule
            if schedule['type'] == 'cron':
                # Parse cron expression
                trigger = CronTrigger.from_crontab(
                    schedule['expression'],
                    timezone=schedule.get('timezone', 'UTC')
                )
                
            elif schedule['type'] == 'interval':
                # Parse interval
                minutes = schedule.get('minutes', 60)
                trigger = IntervalTrigger(minutes=minutes)
                
            else:
                logger.error(f"Unknown schedule type: {schedule['type']}")
                return
            
            # Add job to scheduler
            self.scheduler.add_job(
                func=self._trigger_scan,
                trigger=trigger,
                id=job_id,
                args=[config],
                max_instances=1,  # Prevent overlapping scans
                coalesce=True,    # Coalesce missed runs
                misfire_grace_time=300  # 5 minutes grace time
            )
            
            logger.debug(f"Scheduled monitoring config: {config.name} ({config.id})")
            
        except Exception as e:
            logger.error(f"Failed to schedule config {config.id}: {e}")
    
    async def _trigger_scan(self, config: MonitoringConfig):
        """Trigger a scheduled scan"""
        try:
            # Check rate limiting
            if not await self.rate_limiter.is_allowed(config.url):
                self.metrics['scans_rate_limited'] += 1
                logger.info(f"Scan rate limited for {config.url}")
                return
            
            # Create scan job
            job_id = str(uuid.uuid4())
            scan_job = ScanJob(
                job_id=job_id,
                config_id=config.id,
                url=config.url,
                scan_config=config.scan_config,
                scheduled_time=datetime.now(timezone.utc),
                priority=config.scan_config.get('priority', 'normal')
            )
            
            # Create Kafka message
            message = await create_scan_scheduled_message(
                config_id=config.id,
                url=config.url,
                scan_config=config.scan_config
            )
            
            # Send to Kafka
            success = await self.kafka.produce_message(
                topic='scan.scheduled',
                message=message,
                key=config.url  # Use URL as key for consistent partitioning
            )
            
            if success:
                # Record rate limiting
                await self.rate_limiter.record_scan(config.url)
                
                # Update metrics
                self.metrics['scans_scheduled'] += 1
                
                # Update database
                await self._update_scan_scheduled(config.id, scan_job)
                
                logger.info(f"Scan scheduled for {config.name}: {job_id}")
            else:
                logger.error(f"Failed to schedule scan for {config.name}")
                
        except Exception as e:
            logger.error(f"Error triggering scan for config {config.id}: {e}")
            self.metrics['last_error'] = str(e)
    
    async def _update_scan_scheduled(self, config_id: str, scan_job: ScanJob):
        """Update database when scan is scheduled"""
        try:
            async with self.db_pool.acquire() as conn:
                # Calculate next scan time
                config = self.active_configs[config_id]
                next_scan_time = self._calculate_next_scan_time(config)
                
                await conn.execute("""
                    UPDATE monitoring_configs 
                    SET next_scan_at = $1, updated_at = NOW()
                    WHERE id = $2
                """, next_scan_time, uuid.UUID(config_id))
                
        except Exception as e:
            logger.error(f"Failed to update scan scheduled for config {config_id}: {e}")
    
    def _calculate_next_scan_time(self, config: MonitoringConfig) -> datetime:
        """Calculate the next scan time based on schedule"""
        schedule = config.schedule
        now = datetime.now(timezone.utc)
        
        if schedule['type'] == 'cron':
            # Use croniter to calculate next run
            cron = croniter(schedule['expression'], now)
            return cron.get_next(datetime)
            
        elif schedule['type'] == 'interval':
            minutes = schedule.get('minutes', 60)
            return now + timedelta(minutes=minutes)
        
        else:
            # Default to 1 hour
            return now + timedelta(hours=1)
    
    async def _handle_scan_completed(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle scan completion events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            scan_id = data.get('scan_id')
            
            if not config_id or not scan_id:
                logger.error("Invalid scan completed message: missing config_id or scan_id")
                return
            
            # Update metrics
            self.metrics['scans_completed'] += 1
            
            # Update database
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    UPDATE monitoring_configs 
                    SET last_scan_at = NOW()
                    WHERE id = $1
                """, uuid.UUID(config_id))
            
            logger.info(f"Scan completed for config {config_id}: {scan_id}")
            
        except Exception as e:
            logger.error(f"Error handling scan completed: {e}")
            self.metrics['scans_failed'] += 1
    
    async def _handle_system_health(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle system health events"""
        try:
            data = message.data
            component = data.get('component')
            status = data.get('status')
            
            logger.debug(f"System health update: {component} is {status}")
            
            # Store health metrics in Redis
            if self.redis:
                health_key = f"health:{component}"
                await self.redis.hset(health_key, mapping={
                    'status': status,
                    'last_update': datetime.now(timezone.utc).isoformat(),
                    'data': json.dumps(data.get('metrics', {}))
                })
                await self.redis.expire(health_key, 300)  # 5 minutes TTL
            
        except Exception as e:
            logger.error(f"Error handling system health: {e}")
    
    def _start_periodic_tasks(self):
        """Start periodic maintenance tasks"""
        # Health check every minute
        self.scheduler.add_job(
            func=self._health_check,
            trigger=IntervalTrigger(minutes=1),
            id='health_check',
            max_instances=1
        )
        
        # Metrics reporting every 5 minutes
        self.scheduler.add_job(
            func=self._report_metrics,
            trigger=IntervalTrigger(minutes=5),
            id='metrics_reporting',
            max_instances=1
        )
        
        # Config reload every hour
        self.scheduler.add_job(
            func=self._reload_configs,
            trigger=IntervalTrigger(hours=1),
            id='config_reload',
            max_instances=1
        )
        
        logger.info("Periodic tasks started")
    
    async def _health_check(self):
        """Perform health check and report status"""
        try:
            health_data = {
                'component': 'monitoring-pipeline',
                'status': 'healthy',
                'metrics': self.metrics.copy(),
                'active_configs': len(self.active_configs),
                'scheduler_jobs': len(self.scheduler.get_jobs()),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # Check component health
            if self.kafka:
                kafka_health = await self.kafka.health_check()
                if kafka_health['status'] != 'healthy':
                    health_data['status'] = 'degraded'
            
            # Send health status
            if self.kafka and health_data['status'] != 'unhealthy':
                health_message = KafkaMessage(
                    id=f"health-{int(datetime.now(timezone.utc).timestamp())}",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    type="health_check",
                    source="monitoring-pipeline",
                    data=health_data
                )
                
                await self.kafka.produce_message('system.health', health_message)
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
    
    async def _report_metrics(self):
        """Report metrics to monitoring systems"""
        try:
            if self.redis:
                # Store metrics in Redis with timestamp
                metrics_key = f"pipeline:metrics:{int(datetime.now(timezone.utc).timestamp())}"
                await self.redis.hset(metrics_key, mapping={
                    k: str(v) for k, v in self.metrics.items()
                })
                await self.redis.expire(metrics_key, 3600)  # 1 hour TTL
            
            logger.info(f"Pipeline metrics: {self.metrics}")
            
        except Exception as e:
            logger.error(f"Failed to report metrics: {e}")
    
    async def _reload_configs(self):
        """Reload monitoring configurations from database"""
        try:
            logger.info("Reloading monitoring configurations...")
            await self._load_monitoring_configs()
            logger.info("Monitoring configurations reloaded")
            
        except Exception as e:
            logger.error(f"Failed to reload configurations: {e}")
    
    async def add_monitoring_config(self, config_data: Dict[str, Any]) -> str:
        """Add a new monitoring configuration"""
        try:
            config_id = str(uuid.uuid4())
            
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO monitoring_configs 
                    (id, organization_id, name, url, schedule, scan_config, alert_rules, enabled)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, 
                uuid.UUID(config_id),
                uuid.UUID(config_data['organization_id']),
                config_data['name'],
                config_data['url'],
                json.dumps(config_data['schedule']),
                json.dumps(config_data['scan_config']),
                json.dumps(config_data.get('alert_rules', [])),
                config_data.get('enabled', True)
                )
            
            # Reload configurations to pick up the new one
            await self._load_monitoring_configs()
            
            logger.info(f"Added monitoring configuration: {config_data['name']} ({config_id})")
            return config_id
            
        except Exception as e:
            logger.error(f"Failed to add monitoring configuration: {e}")
            raise
    
    async def update_monitoring_config(self, config_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing monitoring configuration"""
        try:
            async with self.db_pool.acquire() as conn:
                # Build dynamic update query
                set_clauses = []
                values = []
                param_idx = 1
                
                for key, value in updates.items():
                    if key in ['schedule', 'scan_config', 'alert_rules']:
                        value = json.dumps(value)
                    set_clauses.append(f"{key} = ${param_idx}")
                    values.append(value)
                    param_idx += 1
                
                set_clauses.append(f"updated_at = NOW()")
                values.append(uuid.UUID(config_id))
                
                query = f"""
                    UPDATE monitoring_configs 
                    SET {', '.join(set_clauses)}
                    WHERE id = ${param_idx}
                """
                
                result = await conn.execute(query, *values)
                
                if result == "UPDATE 1":
                    # Reload configurations to pick up changes
                    await self._load_monitoring_configs()
                    logger.info(f"Updated monitoring configuration: {config_id}")
                    return True
                else:
                    logger.warning(f"No configuration found with ID: {config_id}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to update monitoring configuration: {e}")
            raise
    
    async def delete_monitoring_config(self, config_id: str) -> bool:
        """Delete a monitoring configuration"""
        try:
            # Remove from scheduler first
            job_id = f"scan_{config_id}"
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
            
            async with self.db_pool.acquire() as conn:
                result = await conn.execute("""
                    DELETE FROM monitoring_configs WHERE id = $1
                """, uuid.UUID(config_id))
                
                if result == "DELETE 1":
                    # Remove from active configs
                    self.active_configs.pop(config_id, None)
                    logger.info(f"Deleted monitoring configuration: {config_id}")
                    return True
                else:
                    logger.warning(f"No configuration found with ID: {config_id}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to delete monitoring configuration: {e}")
            raise
    
    async def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status and metrics"""
        return {
            'running': self.running,
            'active_configs': len(self.active_configs),
            'scheduled_jobs': len(self.scheduler.get_jobs()) if self.scheduler else 0,
            'metrics': self.metrics.copy(),
            'kafka_health': await self.kafka.health_check() if self.kafka else None,
            'redis_connected': bool(self.redis),
            'db_connected': bool(self.db_pool)
        }