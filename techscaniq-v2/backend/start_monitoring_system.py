"""
TechScanIQ Monitoring System Main Application
Orchestrates all monitoring components: pipeline, change detection, alerts, and real-time updates
"""

import asyncio
import logging
import signal
import sys
from typing import Optional
import os
from datetime import datetime, timezone

from pipeline.monitoring_pipeline import MonitoringPipeline
from detection.change_detector import ChangeDetector
from alerting.alert_engine import AlertEngine
from realtime.websocket_server import WebSocketServer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('monitoring_system.log')
    ]
)

logger = logging.getLogger(__name__)

class MonitoringSystem:
    """
    Main orchestrator for the TechScanIQ monitoring system
    Manages all core components and provides unified lifecycle management
    """
    
    def __init__(self):
        # Configuration from environment variables
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://techscaniq:techscaniq_dev@localhost:5432/techscaniq_monitoring')
        self.metrics_db_url = os.getenv('METRICS_DATABASE_URL', 'postgresql://techscaniq:timescale_dev@localhost:5433/techscaniq_metrics')
        self.redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.kafka_servers = os.getenv('KAFKA_SERVERS', 'localhost:29092')
        
        # WebSocket configuration
        self.ws_host = os.getenv('WEBSOCKET_HOST', '0.0.0.0')
        self.ws_port = int(os.getenv('WEBSOCKET_PORT', '8765'))
        
        # SMTP configuration for alerts
        self.smtp_config = {
            'smtp_host': os.getenv('SMTP_HOST', 'localhost'),
            'smtp_port': int(os.getenv('SMTP_PORT', '587')),
            'smtp_username': os.getenv('SMTP_USERNAME'),
            'smtp_password': os.getenv('SMTP_PASSWORD'),
            'use_tls': os.getenv('SMTP_USE_TLS', 'true').lower() == 'true',
            'from_address': os.getenv('SMTP_FROM_ADDRESS', 'noreply@techscaniq.com')
        }
        
        # Component instances
        self.monitoring_pipeline: Optional[MonitoringPipeline] = None
        self.change_detector: Optional[ChangeDetector] = None
        self.alert_engine: Optional[AlertEngine] = None
        self.websocket_server: Optional[WebSocketServer] = None
        
        # State
        self.running = False
        self.startup_time = None
        
        # System metrics
        self.system_metrics = {
            'startup_time': None,
            'uptime_seconds': 0,
            'components_running': 0,
            'last_health_check': None
        }
    
    async def start(self):
        """Start all monitoring system components"""
        try:
            logger.info("Starting TechScanIQ Monitoring System...")
            self.startup_time = datetime.now(timezone.utc)
            self.system_metrics['startup_time'] = self.startup_time.isoformat()
            
            # Initialize components
            await self._initialize_components()
            
            # Start components in order
            await self._start_components()
            
            # Set up health monitoring
            self._setup_health_monitoring()
            
            # Set up signal handlers for graceful shutdown
            self._setup_signal_handlers()
            
            self.running = True
            logger.info("TechScanIQ Monitoring System started successfully")
            
            # Run main loop
            await self._run_main_loop()
            
        except Exception as e:
            logger.error(f"Failed to start monitoring system: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop all monitoring system components"""
        if not self.running:
            return
        
        logger.info("Stopping TechScanIQ Monitoring System...")
        self.running = False
        
        # Stop components in reverse order
        components = [
            ('WebSocket Server', self.websocket_server),
            ('Alert Engine', self.alert_engine),
            ('Change Detector', self.change_detector),
            ('Monitoring Pipeline', self.monitoring_pipeline)
        ]
        
        for name, component in components:
            if component:
                try:
                    logger.info(f"Stopping {name}...")
                    await component.stop()
                    logger.info(f"{name} stopped successfully")
                except Exception as e:
                    logger.error(f"Error stopping {name}: {e}")
        
        logger.info("TechScanIQ Monitoring System stopped")
    
    async def _initialize_components(self):
        """Initialize all system components"""
        logger.info("Initializing components...")
        
        # Initialize monitoring pipeline
        self.monitoring_pipeline = MonitoringPipeline(
            db_url=self.db_url,
            redis_url=self.redis_url,
            kafka_servers=self.kafka_servers
        )
        
        # Initialize change detector
        self.change_detector = ChangeDetector(
            db_url=self.db_url,
            redis_url=self.redis_url,
            kafka_servers=self.kafka_servers
        )
        
        # Initialize alert engine
        self.alert_engine = AlertEngine(
            db_url=self.db_url,
            redis_url=self.redis_url,
            kafka_servers=self.kafka_servers,
            smtp_config=self.smtp_config
        )
        
        # Initialize WebSocket server
        self.websocket_server = WebSocketServer(
            host=self.ws_host,
            port=self.ws_port,
            redis_url=self.redis_url,
            kafka_servers=self.kafka_servers
        )
        
        logger.info("Components initialized")
    
    async def _start_components(self):
        """Start all components in the correct order"""
        components = [
            ('Monitoring Pipeline', self.monitoring_pipeline),
            ('Change Detector', self.change_detector),
            ('Alert Engine', self.alert_engine),
            ('WebSocket Server', self.websocket_server)
        ]
        
        for name, component in components:
            try:
                logger.info(f"Starting {name}...")
                await component.start()
                self.system_metrics['components_running'] += 1
                logger.info(f"{name} started successfully")
            except Exception as e:
                logger.error(f"Failed to start {name}: {e}")
                raise
    
    def _setup_health_monitoring(self):
        """Set up periodic health monitoring"""
        async def health_check():
            while self.running:
                try:
                    await self._perform_health_check()
                    await asyncio.sleep(60)  # Check every minute
                except Exception as e:
                    logger.error(f"Health check error: {e}")
                    await asyncio.sleep(60)
        
        asyncio.create_task(health_check())
    
    async def _perform_health_check(self):
        """Perform system health check"""
        try:
            self.system_metrics['last_health_check'] = datetime.now(timezone.utc).isoformat()
            
            if self.startup_time:
                uptime = datetime.now(timezone.utc) - self.startup_time
                self.system_metrics['uptime_seconds'] = int(uptime.total_seconds())
            
            # Check component health
            components_health = {}
            
            if self.monitoring_pipeline:
                components_health['monitoring_pipeline'] = await self.monitoring_pipeline.get_pipeline_status()
            
            if self.change_detector and hasattr(self.change_detector, 'get_detector_status'):
                components_health['change_detector'] = {'running': self.change_detector.running}
            
            if self.alert_engine:
                components_health['alert_engine'] = await self.alert_engine.get_engine_status()
            
            if self.websocket_server:
                components_health['websocket_server'] = self.websocket_server.get_server_stats()
            
            # Log overall health
            healthy_components = sum(1 for health in components_health.values() 
                                   if health.get('running', False))
            
            logger.info(f"Health check: {healthy_components}/{len(components_health)} components healthy")
            
            # Store health metrics in Redis if available
            if self.monitoring_pipeline and self.monitoring_pipeline.redis:
                health_data = {
                    'timestamp': self.system_metrics['last_health_check'],
                    'uptime_seconds': self.system_metrics['uptime_seconds'],
                    'components_running': healthy_components,
                    'total_components': len(components_health),
                    'component_details': components_health
                }
                
                await self.monitoring_pipeline.redis.setex(
                    'system:health',
                    300,  # 5 minutes TTL
                    str(health_data)
                )
            
        except Exception as e:
            logger.error(f"Error performing health check: {e}")
    
    def _setup_signal_handlers(self):
        """Set up signal handlers for graceful shutdown"""
        def signal_handler(sig, frame):
            logger.info(f"Received signal {sig}, initiating graceful shutdown...")
            asyncio.create_task(self.stop())
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def _run_main_loop(self):
        """Main event loop"""
        try:
            while self.running:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            await self.stop()
    
    async def get_system_status(self) -> dict:
        """Get comprehensive system status"""
        status = {
            'running': self.running,
            'system_metrics': self.system_metrics.copy(),
            'components': {}
        }
        
        if self.monitoring_pipeline:
            status['components']['monitoring_pipeline'] = await self.monitoring_pipeline.get_pipeline_status()
        
        if self.change_detector:
            status['components']['change_detector'] = {
                'running': self.change_detector.running,
                'metrics': self.change_detector.metrics.copy()
            }
        
        if self.alert_engine:
            status['components']['alert_engine'] = await self.alert_engine.get_engine_status()
        
        if self.websocket_server:
            status['components']['websocket_server'] = self.websocket_server.get_server_stats()
        
        return status
    
    async def add_monitoring_config(self, config_data: dict) -> str:
        """Add a new monitoring configuration"""
        if not self.monitoring_pipeline:
            raise RuntimeError("Monitoring pipeline not initialized")
        
        return await self.monitoring_pipeline.add_monitoring_config(config_data)
    
    async def update_monitoring_config(self, config_id: str, updates: dict) -> bool:
        """Update an existing monitoring configuration"""
        if not self.monitoring_pipeline:
            raise RuntimeError("Monitoring pipeline not initialized")
        
        return await self.monitoring_pipeline.update_monitoring_config(config_id, updates)
    
    async def delete_monitoring_config(self, config_id: str) -> bool:
        """Delete a monitoring configuration"""
        if not self.monitoring_pipeline:
            raise RuntimeError("Monitoring pipeline not initialized")
        
        return await self.monitoring_pipeline.delete_monitoring_config(config_id)

# CLI interface
async def main():
    """Main function for CLI startup"""
    import argparse
    
    parser = argparse.ArgumentParser(description='TechScanIQ Monitoring System')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--log-level', default='INFO', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    
    args = parser.parse_args()
    
    # Set log level
    logging.getLogger().setLevel(getattr(logging, args.log_level))
    
    # Create and start monitoring system
    monitoring_system = MonitoringSystem()
    
    try:
        await monitoring_system.start()
    except KeyboardInterrupt:
        logger.info("Shutdown requested by user")
    except Exception as e:
        logger.error(f"System error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Print startup banner
    print("""
    ████████╗███████╗ ██████╗██╗  ██╗███████╗ ██████╗ █████╗ ███╗   ██╗██╗ ██████╗ 
    ╚══██╔══╝██╔════╝██╔════╝██║  ██║██╔════╝██╔════╝██╔══██╗████╗  ██║██║██╔═══██╗
       ██║   █████╗  ██║     ███████║███████╗██║     ███████║██╔██╗ ██║██║██║   ██║
       ██║   ██╔══╝  ██║     ██╔══██║╚════██║██║     ██╔══██║██║╚██╗██║██║██║▄▄ ██║
       ██║   ███████╗╚██████╗██║  ██║███████║╚██████╗██║  ██║██║ ╚████║██║╚██████╔╝
       ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝ ╚══▀▀═╝ 
                                                                                     
                        Continuous Monitoring System v1.0.0
    """)
    
    asyncio.run(main())