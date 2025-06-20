"""
Kafka client for TechScanIQ monitoring pipeline
Handles message production and consumption with error handling and monitoring
"""

import asyncio
import json
import logging
import time
from typing import Any, Dict, List, Optional, Callable
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager

import aiokafka
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from aiokafka.errors import KafkaError
import aioredis

logger = logging.getLogger(__name__)

@dataclass
class KafkaMessage:
    """Standard message format for monitoring pipeline"""
    id: str
    timestamp: str
    type: str
    source: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class KafkaClient:
    """
    High-level Kafka client for monitoring pipeline
    Provides producers and consumers with built-in error handling, retries, and monitoring
    """
    
    def __init__(self, 
                 bootstrap_servers: str = "localhost:29092",
                 redis_url: str = "redis://localhost:6379",
                 client_id: str = "techscaniq-monitoring"):
        self.bootstrap_servers = bootstrap_servers
        self.redis_url = redis_url
        self.client_id = client_id
        self.producer: Optional[AIOKafkaProducer] = None
        self.consumers: Dict[str, AIOKafkaConsumer] = {}
        self.redis: Optional[aioredis.Redis] = None
        self.running = False
        
        # Monitoring metrics
        self.metrics = {
            'messages_produced': 0,
            'messages_consumed': 0,
            'production_errors': 0,
            'consumption_errors': 0,
            'last_error': None
        }
    
    async def start(self):
        """Initialize Kafka producer and Redis connection"""
        try:
            # Initialize Redis for metrics and state tracking
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            logger.info("Redis connection established")
            
            # Initialize Kafka producer
            self.producer = AIOKafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                client_id=f"{self.client_id}-producer",
                value_serializer=lambda v: json.dumps(v, default=str).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                acks='all',  # Wait for all replicas
                retries=3,
                max_in_flight_requests_per_connection=5,
                enable_idempotence=True,
                batch_size=16384,
                linger_ms=10  # Small delay to batch messages
            )
            
            await self.producer.start()
            logger.info("Kafka producer started")
            
            self.running = True
            
            # Start metrics reporting
            asyncio.create_task(self._report_metrics())
            
        except Exception as e:
            logger.error(f"Failed to start Kafka client: {e}")
            raise
    
    async def stop(self):
        """Gracefully shutdown Kafka connections"""
        self.running = False
        
        try:
            if self.producer:
                await self.producer.stop()
                logger.info("Kafka producer stopped")
            
            for topic, consumer in self.consumers.items():
                await consumer.stop()
                logger.info(f"Consumer for topic {topic} stopped")
            
            if self.redis:
                await self.redis.close()
                logger.info("Redis connection closed")
                
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    async def produce_message(self, 
                            topic: str, 
                            message: KafkaMessage, 
                            key: Optional[str] = None,
                            headers: Optional[Dict[str, str]] = None) -> bool:
        """
        Produce a message to Kafka topic
        
        Args:
            topic: Kafka topic name
            message: Message to send
            key: Optional message key for partitioning
            headers: Optional message headers
            
        Returns:
            bool: True if message was sent successfully
        """
        if not self.producer:
            logger.error("Producer not initialized")
            return False
        
        try:
            # Convert message to dict
            message_dict = asdict(message)
            
            # Prepare headers
            kafka_headers = []
            if headers:
                kafka_headers.extend([(k, v.encode('utf-8')) for k, v in headers.items()])
            
            # Add default headers
            kafka_headers.extend([
                ('source', message.source.encode('utf-8')),
                ('type', message.type.encode('utf-8')),
                ('timestamp', message.timestamp.encode('utf-8'))
            ])
            
            # Send message
            record_metadata = await self.producer.send_and_wait(
                topic=topic,
                value=message_dict,
                key=key,
                headers=kafka_headers
            )
            
            self.metrics['messages_produced'] += 1
            
            logger.debug(f"Message sent to {topic} partition {record_metadata.partition} "
                        f"offset {record_metadata.offset}")
            
            # Update Redis metrics
            if self.redis:
                await self.redis.incr(f"kafka:produced:{topic}")
                await self.redis.set(f"kafka:last_produced:{topic}", time.time())
            
            return True
            
        except KafkaError as e:
            self.metrics['production_errors'] += 1
            self.metrics['last_error'] = str(e)
            logger.error(f"Failed to produce message to {topic}: {e}")
            
            # Try to send to DLQ
            if topic != 'dlq.failed-messages':
                await self._send_to_dlq(message_dict, topic, str(e))
            
            return False
        
        except Exception as e:
            self.metrics['production_errors'] += 1
            self.metrics['last_error'] = str(e)
            logger.error(f"Unexpected error producing message to {topic}: {e}")
            return False
    
    async def create_consumer(self, 
                            topics: List[str], 
                            group_id: str,
                            message_handler: Callable[[KafkaMessage, Dict[str, Any]], Any],
                            auto_offset_reset: str = 'latest',
                            enable_auto_commit: bool = True) -> str:
        """
        Create and start a Kafka consumer
        
        Args:
            topics: List of topics to subscribe to
            group_id: Consumer group ID
            message_handler: Async function to handle messages
            auto_offset_reset: Where to start reading ('earliest' or 'latest')
            enable_auto_commit: Whether to auto-commit offsets
            
        Returns:
            str: Consumer ID for tracking
        """
        consumer_id = f"{group_id}-{len(self.consumers)}"
        
        try:
            consumer = AIOKafkaConsumer(
                *topics,
                bootstrap_servers=self.bootstrap_servers,
                client_id=f"{self.client_id}-consumer-{consumer_id}",
                group_id=group_id,
                auto_offset_reset=auto_offset_reset,
                enable_auto_commit=enable_auto_commit,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')) if m else None,
                key_deserializer=lambda k: k.decode('utf-8') if k else None,
                max_poll_records=100,
                session_timeout_ms=30000,
                heartbeat_interval_ms=3000
            )
            
            await consumer.start()
            self.consumers[consumer_id] = consumer
            
            # Start message processing task
            asyncio.create_task(
                self._consume_messages(consumer, consumer_id, message_handler)
            )
            
            logger.info(f"Consumer {consumer_id} started for topics {topics}")
            return consumer_id
            
        except Exception as e:
            logger.error(f"Failed to create consumer {consumer_id}: {e}")
            raise
    
    async def _consume_messages(self, 
                              consumer: AIOKafkaConsumer, 
                              consumer_id: str,
                              message_handler: Callable) -> None:
        """Internal method to consume messages"""
        try:
            async for msg in consumer:
                try:
                    # Parse message
                    if not msg.value:
                        continue
                    
                    # Extract headers
                    headers = {}
                    if msg.headers:
                        headers = {k: v.decode('utf-8') for k, v in msg.headers}
                    
                    # Create KafkaMessage object
                    kafka_message = KafkaMessage(
                        id=msg.value.get('id', ''),
                        timestamp=msg.value.get('timestamp', ''),
                        type=msg.value.get('type', ''),
                        source=msg.value.get('source', ''),
                        data=msg.value.get('data', {}),
                        metadata=msg.value.get('metadata', {})
                    )
                    
                    # Call message handler
                    await message_handler(kafka_message, {
                        'topic': msg.topic,
                        'partition': msg.partition,
                        'offset': msg.offset,
                        'key': msg.key,
                        'headers': headers,
                        'timestamp': msg.timestamp
                    })
                    
                    self.metrics['messages_consumed'] += 1
                    
                    # Update Redis metrics
                    if self.redis:
                        await self.redis.incr(f"kafka:consumed:{msg.topic}")
                        await self.redis.set(f"kafka:last_consumed:{msg.topic}", time.time())
                    
                except Exception as e:
                    self.metrics['consumption_errors'] += 1
                    self.metrics['last_error'] = str(e)
                    logger.error(f"Error processing message in consumer {consumer_id}: {e}")
                    
                    # Send to DLQ if not already a DLQ message
                    if msg.topic != 'dlq.failed-messages':
                        await self._send_to_dlq(msg.value, msg.topic, str(e))
                    
        except Exception as e:
            logger.error(f"Consumer {consumer_id} error: {e}")
        finally:
            logger.info(f"Consumer {consumer_id} stopped")
    
    async def _send_to_dlq(self, message_data: Dict[str, Any], original_topic: str, error: str):
        """Send failed message to Dead Letter Queue"""
        try:
            dlq_message = KafkaMessage(
                id=f"dlq-{time.time()}",
                timestamp=datetime.now(timezone.utc).isoformat(),
                type="dlq_message",
                source="kafka_client",
                data={
                    'original_message': message_data,
                    'original_topic': original_topic,
                    'error': error,
                    'failed_at': datetime.now(timezone.utc).isoformat()
                }
            )
            
            await self.produce_message('dlq.failed-messages', dlq_message)
            
        except Exception as e:
            logger.error(f"Failed to send message to DLQ: {e}")
    
    async def _report_metrics(self):
        """Periodically report metrics to Redis and logs"""
        while self.running:
            try:
                await asyncio.sleep(60)  # Report every minute
                
                if self.redis:
                    # Store current metrics in Redis
                    metrics_key = f"kafka:metrics:{int(time.time())}"
                    await self.redis.hset(metrics_key, mapping=self.metrics)
                    await self.redis.expire(metrics_key, 3600)  # Keep for 1 hour
                
                logger.info(f"Kafka metrics: {self.metrics}")
                
            except Exception as e:
                logger.error(f"Error reporting metrics: {e}")
    
    async def get_topic_metadata(self, topic: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific topic"""
        if not self.producer:
            return None
        
        try:
            metadata = await self.producer.client.fetch_metadata()
            topic_metadata = metadata.topics.get(topic)
            
            if topic_metadata:
                return {
                    'topic': topic,
                    'partitions': len(topic_metadata.partitions),
                    'partition_metadata': [
                        {
                            'partition': p.partition,
                            'leader': p.leader,
                            'replicas': p.replicas,
                            'isr': p.isr
                        }
                        for p in topic_metadata.partitions.values()
                    ]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching topic metadata for {topic}: {e}")
            return None
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform health check on Kafka connections"""
        health = {
            'status': 'healthy',
            'producer_connected': bool(self.producer and not self.producer._closed),
            'consumers_count': len(self.consumers),
            'redis_connected': False,
            'metrics': self.metrics.copy()
        }
        
        # Check Redis connection
        if self.redis:
            try:
                await self.redis.ping()
                health['redis_connected'] = True
            except Exception:
                health['redis_connected'] = False
        
        # Check if we have recent errors
        if self.metrics['production_errors'] > 10 or self.metrics['consumption_errors'] > 10:
            health['status'] = 'degraded'
        
        if not health['producer_connected'] or not health['redis_connected']:
            health['status'] = 'unhealthy'
        
        return health

# Convenience functions for common operations

async def create_scan_scheduled_message(config_id: str, url: str, scan_config: Dict[str, Any]) -> KafkaMessage:
    """Create a scan.scheduled message"""
    return KafkaMessage(
        id=f"scan-{config_id}-{int(time.time())}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        type="scan_scheduled",
        source="scheduler",
        data={
            'config_id': config_id,
            'url': url,
            'scan_config': scan_config,
            'scheduled_at': datetime.now(timezone.utc).isoformat()
        }
    )

async def create_scan_completed_message(config_id: str, scan_id: str, result_summary: Dict[str, Any], 
                                      full_result_url: Optional[str] = None) -> KafkaMessage:
    """Create a scan.completed message"""
    return KafkaMessage(
        id=scan_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        type="scan_completed",
        source="scanner",
        data={
            'config_id': config_id,
            'scan_id': scan_id,
            'result_summary': result_summary,
            'full_result_url': full_result_url,
            'completed_at': datetime.now(timezone.utc).isoformat()
        }
    )

async def create_change_detected_message(config_id: str, change_type: str, 
                                       change_details: Dict[str, Any]) -> KafkaMessage:
    """Create a change.detected message"""
    return KafkaMessage(
        id=f"change-{config_id}-{int(time.time())}",
        timestamp=datetime.now(timezone.utc).isoformat(),
        type="change_detected",
        source="change_detector",
        data={
            'config_id': config_id,
            'change_type': change_type,
            'change_details': change_details,
            'detected_at': datetime.now(timezone.utc).isoformat()
        }
    )

async def create_alert_triggered_message(alert_id: str, config_id: str, alert_type: str, 
                                       severity: str, details: Dict[str, Any]) -> KafkaMessage:
    """Create an alert.triggered message"""
    return KafkaMessage(
        id=alert_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        type="alert_triggered",
        source="alert_engine",
        data={
            'alert_id': alert_id,
            'config_id': config_id,
            'alert_type': alert_type,
            'severity': severity,
            'details': details,
            'triggered_at': datetime.now(timezone.utc).isoformat()
        }
    )