"""
TechScanIQ Real-time WebSocket Server
Provides real-time updates for monitoring dashboard and live events
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Optional, Any, List
import uuid
import weakref

import websockets
import aioredis
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed, WebSocketException

from streaming.kafka_client import KafkaClient, KafkaMessage

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections and subscriptions"""
    
    def __init__(self):
        # Store connections by user/organization
        self.connections: Dict[str, Set[WebSocketServerProtocol]] = {}
        
        # Store subscriptions by config_id
        self.subscriptions: Dict[str, Set[WebSocketServerProtocol]] = {}
        
        # Store connection metadata
        self.connection_metadata: weakref.WeakKeyDictionary = weakref.WeakKeyDictionary()
    
    def add_connection(self, websocket: WebSocketServerProtocol, user_id: str, organization_id: str):
        """Add a new WebSocket connection"""
        # Add to user connections
        if user_id not in self.connections:
            self.connections[user_id] = set()
        self.connections[user_id].add(websocket)
        
        # Store metadata
        self.connection_metadata[websocket] = {
            'user_id': user_id,
            'organization_id': organization_id,
            'connected_at': datetime.now(timezone.utc),
            'subscriptions': set()
        }
        
        logger.info(f"Added connection for user {user_id}")
    
    def remove_connection(self, websocket: WebSocketServerProtocol):
        """Remove a WebSocket connection"""
        metadata = self.connection_metadata.get(websocket)
        if not metadata:
            return
        
        user_id = metadata['user_id']
        
        # Remove from user connections
        if user_id in self.connections:
            self.connections[user_id].discard(websocket)
            if not self.connections[user_id]:
                del self.connections[user_id]
        
        # Remove from subscriptions
        for config_id in metadata['subscriptions']:
            if config_id in self.subscriptions:
                self.subscriptions[config_id].discard(websocket)
                if not self.subscriptions[config_id]:
                    del self.subscriptions[config_id]
        
        logger.info(f"Removed connection for user {user_id}")
    
    def subscribe_to_config(self, websocket: WebSocketServerProtocol, config_id: str):
        """Subscribe a connection to config updates"""
        metadata = self.connection_metadata.get(websocket)
        if not metadata:
            return False
        
        # Add to subscriptions
        if config_id not in self.subscriptions:
            self.subscriptions[config_id] = set()
        self.subscriptions[config_id].add(websocket)
        
        # Update metadata
        metadata['subscriptions'].add(config_id)
        
        logger.debug(f"Subscribed connection to config {config_id}")
        return True
    
    def unsubscribe_from_config(self, websocket: WebSocketServerProtocol, config_id: str):
        """Unsubscribe a connection from config updates"""
        metadata = self.connection_metadata.get(websocket)
        if not metadata:
            return False
        
        # Remove from subscriptions
        if config_id in self.subscriptions:
            self.subscriptions[config_id].discard(websocket)
            if not self.subscriptions[config_id]:
                del self.subscriptions[config_id]
        
        # Update metadata
        metadata['subscriptions'].discard(config_id)
        
        logger.debug(f"Unsubscribed connection from config {config_id}")
        return True
    
    async def broadcast_to_config(self, config_id: str, message: Dict[str, Any]):
        """Broadcast a message to all connections subscribed to a config"""
        if config_id not in self.subscriptions:
            return
        
        message_json = json.dumps(message)
        connections_to_remove = []
        
        for websocket in self.subscriptions[config_id].copy():
            try:
                await websocket.send(message_json)
            except (ConnectionClosed, WebSocketException):
                connections_to_remove.append(websocket)
        
        # Clean up closed connections
        for websocket in connections_to_remove:
            self.remove_connection(websocket)
    
    async def broadcast_to_user(self, user_id: str, message: Dict[str, Any]):
        """Broadcast a message to all connections for a user"""
        if user_id not in self.connections:
            return
        
        message_json = json.dumps(message)
        connections_to_remove = []
        
        for websocket in self.connections[user_id].copy():
            try:
                await websocket.send(message_json)
            except (ConnectionClosed, WebSocketException):
                connections_to_remove.append(websocket)
        
        # Clean up closed connections
        for websocket in connections_to_remove:
            self.remove_connection(websocket)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        total_connections = sum(len(conns) for conns in self.connections.values())
        return {
            'total_connections': total_connections,
            'unique_users': len(self.connections),
            'total_subscriptions': sum(len(subs) for subs in self.subscriptions.values()),
            'unique_configs': len(self.subscriptions)
        }

class WebSocketServer:
    """
    Real-time WebSocket server for monitoring events
    """
    
    def __init__(self, 
                 host: str = "localhost",
                 port: int = 8765,
                 redis_url: str = "redis://localhost:6379",
                 kafka_servers: str = "localhost:29092"):
        self.host = host
        self.port = port
        self.redis_url = redis_url
        self.kafka_servers = kafka_servers
        
        # Core components
        self.redis: Optional[aioredis.Redis] = None
        self.kafka: Optional[KafkaClient] = None
        self.connection_manager = ConnectionManager()
        
        # WebSocket server
        self.server = None
        self.running = False
        
        # Metrics
        self.metrics = {
            'connections_total': 0,
            'messages_sent': 0,
            'messages_received': 0,
            'errors': 0,
            'last_error': None
        }
    
    async def start(self):
        """Start the WebSocket server"""
        try:
            logger.info("Starting WebSocket Server...")
            
            # Initialize Redis
            self.redis = aioredis.from_url(self.redis_url)
            await self.redis.ping()
            
            # Initialize Kafka client
            self.kafka = KafkaClient(
                bootstrap_servers=self.kafka_servers,
                redis_url=self.redis_url,
                client_id="websocket-server"
            )
            await self.kafka.start()
            
            # Set up Kafka consumers for real-time events
            await self._setup_kafka_consumers()
            
            # Start WebSocket server
            self.server = await websockets.serve(
                self._handle_connection,
                self.host,
                self.port,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10
            )
            
            self.running = True
            logger.info(f"WebSocket server started on ws://{self.host}:{self.port}")
            
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the WebSocket server"""
        logger.info("Stopping WebSocket Server...")
        self.running = False
        
        try:
            if self.server:
                self.server.close()
                await self.server.wait_closed()
            
            if self.kafka:
                await self.kafka.stop()
            
            if self.redis:
                await self.redis.close()
                
        except Exception as e:
            logger.error(f"Error during shutdown: {e}")
    
    async def _setup_kafka_consumers(self):
        """Set up Kafka consumers for real-time events"""
        # Consumer for scan completion events
        await self.kafka.create_consumer(
            topics=['scan.completed'],
            group_id='websocket-scan-events',
            message_handler=self._handle_scan_completed
        )
        
        # Consumer for change detection events
        await self.kafka.create_consumer(
            topics=['change.detected'],
            group_id='websocket-change-events',
            message_handler=self._handle_change_detected
        )
        
        # Consumer for alert events
        await self.kafka.create_consumer(
            topics=['alert.triggered'],
            group_id='websocket-alert-events',
            message_handler=self._handle_alert_triggered
        )
        
        # Consumer for system health events
        await self.kafka.create_consumer(
            topics=['system.health'],
            group_id='websocket-health-events',
            message_handler=self._handle_system_health
        )
        
        logger.info("WebSocket Kafka consumers set up")
    
    async def _handle_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket connection"""
        try:
            self.metrics['connections_total'] += 1
            logger.info(f"New WebSocket connection from {websocket.remote_address}")
            
            # Wait for authentication message
            auth_message = await websocket.recv()
            auth_data = json.loads(auth_message)
            
            # Validate authentication (simplified for demo)
            user_id = auth_data.get('user_id')
            organization_id = auth_data.get('organization_id')
            token = auth_data.get('token')
            
            if not await self._authenticate_connection(user_id, organization_id, token):
                await websocket.send(json.dumps({
                    'type': 'auth_error',
                    'message': 'Authentication failed'
                }))
                await websocket.close()
                return
            
            # Add connection to manager
            self.connection_manager.add_connection(websocket, user_id, organization_id)
            
            # Send authentication success
            await websocket.send(json.dumps({
                'type': 'auth_success',
                'message': 'Connected successfully',
                'user_id': user_id
            }))
            
            # Handle messages
            async for message in websocket:
                await self._handle_message(websocket, message)
                
        except ConnectionClosed:
            logger.debug("WebSocket connection closed")
        except WebSocketException as e:
            logger.error(f"WebSocket error: {e}")
            self.metrics['errors'] += 1
            self.metrics['last_error'] = str(e)
        except Exception as e:
            logger.error(f"Error handling WebSocket connection: {e}")
            self.metrics['errors'] += 1
            self.metrics['last_error'] = str(e)
        finally:
            self.connection_manager.remove_connection(websocket)
    
    async def _authenticate_connection(self, user_id: str, organization_id: str, token: str) -> bool:
        """Authenticate WebSocket connection"""
        # In a real implementation, validate the JWT token
        # For demo purposes, we'll do basic validation
        return user_id and organization_id and token
    
    async def _handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming WebSocket message"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            self.metrics['messages_received'] += 1
            
            if message_type == 'subscribe':
                config_id = data.get('config_id')
                if config_id:
                    success = self.connection_manager.subscribe_to_config(websocket, config_id)
                    await websocket.send(json.dumps({
                        'type': 'subscription_response',
                        'config_id': config_id,
                        'success': success
                    }))
            
            elif message_type == 'unsubscribe':
                config_id = data.get('config_id')
                if config_id:
                    success = self.connection_manager.unsubscribe_from_config(websocket, config_id)
                    await websocket.send(json.dumps({
                        'type': 'unsubscription_response',
                        'config_id': config_id,
                        'success': success
                    }))
            
            elif message_type == 'ping':
                await websocket.send(json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }))
            
            elif message_type == 'get_stats':
                stats = self.connection_manager.get_connection_stats()
                await websocket.send(json.dumps({
                    'type': 'stats_response',
                    'stats': stats
                }))
            
            else:
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
            
        except json.JSONDecodeError:
            await websocket.send(json.dumps({
                'type': 'error',
                'message': 'Invalid JSON message'
            }))
        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await websocket.send(json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def _handle_scan_completed(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle scan completion events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            
            if config_id:
                websocket_message = {
                    'type': 'scan_completed',
                    'config_id': config_id,
                    'scan_id': data.get('scan_id'),
                    'timestamp': message.timestamp,
                    'result_summary': data.get('result_summary', {}),
                    'full_result_url': data.get('full_result_url')
                }
                
                await self.connection_manager.broadcast_to_config(config_id, websocket_message)
                self.metrics['messages_sent'] += 1
            
        except Exception as e:
            logger.error(f"Error handling scan completed event: {e}")
    
    async def _handle_change_detected(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle change detection events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            
            if config_id:
                websocket_message = {
                    'type': 'change_detected',
                    'config_id': config_id,
                    'change_type': data.get('change_type'),
                    'timestamp': message.timestamp,
                    'change_details': data.get('change_details', {}),
                    'detected_at': data.get('detected_at')
                }
                
                await self.connection_manager.broadcast_to_config(config_id, websocket_message)
                self.metrics['messages_sent'] += 1
            
        except Exception as e:
            logger.error(f"Error handling change detected event: {e}")
    
    async def _handle_alert_triggered(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle alert triggered events"""
        try:
            data = message.data
            config_id = data.get('config_id')
            
            if config_id:
                websocket_message = {
                    'type': 'alert_triggered',
                    'config_id': config_id,
                    'alert_id': data.get('alert_id'),
                    'alert_type': data.get('alert_type'),
                    'severity': data.get('severity'),
                    'timestamp': message.timestamp,
                    'details': data.get('details', {})
                }
                
                await self.connection_manager.broadcast_to_config(config_id, websocket_message)
                self.metrics['messages_sent'] += 1
            
        except Exception as e:
            logger.error(f"Error handling alert triggered event: {e}")
    
    async def _handle_system_health(self, message: KafkaMessage, context: Dict[str, Any]):
        """Handle system health events"""
        try:
            data = message.data
            
            # Broadcast system health to all connected users
            websocket_message = {
                'type': 'system_health',
                'component': data.get('component'),
                'status': data.get('status'),
                'timestamp': message.timestamp,
                'metrics': data.get('metrics', {})
            }
            
            # Broadcast to all connections (system-wide event)
            for user_id in self.connection_manager.connections:
                await self.connection_manager.broadcast_to_user(user_id, websocket_message)
            
            self.metrics['messages_sent'] += len(self.connection_manager.connections)
            
        except Exception as e:
            logger.error(f"Error handling system health event: {e}")
    
    async def send_custom_message(self, config_id: str, message: Dict[str, Any]):
        """Send a custom message to all subscribers of a config"""
        await self.connection_manager.broadcast_to_config(config_id, message)
        self.metrics['messages_sent'] += 1
    
    async def send_user_message(self, user_id: str, message: Dict[str, Any]):
        """Send a message to all connections for a specific user"""
        await self.connection_manager.broadcast_to_user(user_id, message)
        self.metrics['messages_sent'] += 1
    
    def get_server_stats(self) -> Dict[str, Any]:
        """Get server statistics"""
        connection_stats = self.connection_manager.get_connection_stats()
        return {
            'running': self.running,
            'host': self.host,
            'port': self.port,
            'metrics': self.metrics.copy(),
            'connections': connection_stats
        }

# WebSocket client example for testing
class WebSocketClient:
    """Simple WebSocket client for testing"""
    
    def __init__(self, uri: str, user_id: str, organization_id: str, token: str):
        self.uri = uri
        self.user_id = user_id
        self.organization_id = organization_id
        self.token = token
        self.websocket = None
    
    async def connect(self):
        """Connect to WebSocket server"""
        self.websocket = await websockets.connect(self.uri)
        
        # Send authentication
        auth_message = {
            'user_id': self.user_id,
            'organization_id': self.organization_id,
            'token': self.token
        }
        await self.websocket.send(json.dumps(auth_message))
        
        # Wait for auth response
        response = await self.websocket.recv()
        auth_response = json.loads(response)
        
        if auth_response.get('type') != 'auth_success':
            raise Exception(f"Authentication failed: {auth_response}")
        
        print(f"Connected successfully as {self.user_id}")
    
    async def subscribe(self, config_id: str):
        """Subscribe to config updates"""
        message = {
            'type': 'subscribe',
            'config_id': config_id
        }
        await self.websocket.send(json.dumps(message))
        
        response = await self.websocket.recv()
        response_data = json.loads(response)
        print(f"Subscription response: {response_data}")
    
    async def listen(self):
        """Listen for messages"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                print(f"Received: {data}")
        except ConnectionClosed:
            print("Connection closed")
    
    async def disconnect(self):
        """Disconnect from server"""
        if self.websocket:
            await self.websocket.close()

# Main server startup function
async def main():
    """Main function to start the WebSocket server"""
    server = WebSocketServer(
        host="0.0.0.0",
        port=8765,
        redis_url="redis://localhost:6379",
        kafka_servers="localhost:29092"
    )
    
    try:
        await server.start()
        
        # Keep server running
        while server.running:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        await server.stop()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())