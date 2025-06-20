# TechScanIQ Continuous Monitoring System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the TechScanIQ Continuous Monitoring System, which transforms the platform from request-based scanning to comprehensive real-time monitoring.

## Architecture Overview

The system consists of several interconnected components:

- **Monitoring Pipeline**: Schedules and orchestrates scans
- **Change Detection Engine**: Analyzes scan results for meaningful changes
- **Alert Engine**: Evaluates rules and sends notifications
- **WebSocket Server**: Provides real-time updates to dashboards
- **Infrastructure**: Kafka, PostgreSQL, TimescaleDB, Redis, Elasticsearch

## Prerequisites

### System Requirements

- **CPU**: Minimum 4 cores, recommended 8+ cores
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 100GB+ SSD storage
- **Network**: Stable internet connection with sufficient bandwidth

### Software Requirements

- Docker & Docker Compose 20.10+
- Python 3.11+
- PostgreSQL 16+
- Redis 7+
- Apache Kafka 2.8+

## Quick Start (Development)

### 1. Clone and Setup

```bash
cd techscaniq-v2/backend

# Copy environment configuration
cp .env.example .env

# Edit configuration as needed
nano .env
```

### 2. Start Infrastructure Services

```bash
# Start all infrastructure services
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready (30-60 seconds)
docker-compose -f docker-compose.monitoring.yml logs -f
```

### 3. Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-monitoring.txt
```

### 4. Initialize Databases

```bash
# Apply database migrations
python -c "
import asyncio
import asyncpg
import os

async def apply_migrations():
    conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
    
    # Apply core schema
    with open('database/migrations/001_monitoring_core_schema.sql', 'r') as f:
        await conn.execute(f.read())
    
    await conn.close()
    
    # Apply TimescaleDB schema
    conn = await asyncpg.connect(os.getenv('METRICS_DATABASE_URL'))
    
    with open('database/migrations/002_timescale_metrics.sql', 'r') as f:
        await conn.execute(f.read())
    
    await conn.close()

asyncio.run(apply_migrations())
"
```

### 5. Start Monitoring System

```bash
# Start the monitoring system
python start_monitoring_system.py
```

You should see the startup banner and all components starting successfully.

## Production Deployment

### 1. Infrastructure Setup

#### Docker Compose Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  # Production PostgreSQL with persistent volumes
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: techscaniq_monitoring
      POSTGRES_USER: techscaniq
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  # Production TimescaleDB
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: techscaniq_metrics
      POSTGRES_USER: techscaniq
      POSTGRES_PASSWORD: ${TIMESCALE_PASSWORD}
    volumes:
      - timescale_prod_data:/var/lib/postgresql/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  # Production Redis with persistence
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_prod_data:/data
    restart: unless-stopped

  # Production Kafka cluster
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_NUM_PARTITIONS: 6
      KAFKA_LOG_RETENTION_HOURS: 168
    volumes:
      - kafka_prod_data:/var/lib/kafka/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  # Production Elasticsearch
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
    volumes:
      - elasticsearch_prod_data:/usr/share/elasticsearch/data
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  # Monitoring system application
  techscaniq-monitoring:
    build:
      context: .
      dockerfile: Dockerfile.monitoring
    environment:
      DATABASE_URL: postgresql://techscaniq:${POSTGRES_PASSWORD}@postgres:5432/techscaniq_monitoring
      METRICS_DATABASE_URL: postgresql://techscaniq:${TIMESCALE_PASSWORD}@timescaledb:5432/techscaniq_metrics
      REDIS_URL: redis://redis:6379
      KAFKA_SERVERS: kafka:9092
    depends_on:
      - postgres
      - timescaledb
      - redis
      - kafka
      - elasticsearch
    restart: unless-stopped
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

volumes:
  postgres_prod_data:
  timescale_prod_data:
  redis_prod_data:
  kafka_prod_data:
  elasticsearch_prod_data:
```

#### Kubernetes Deployment

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: techscaniq-monitoring
---
# k8s/monitoring-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: techscaniq-monitoring
  namespace: techscaniq-monitoring
spec:
  replicas: 3
  selector:
    matchLabels:
      app: techscaniq-monitoring
  template:
    metadata:
      labels:
        app: techscaniq-monitoring
    spec:
      containers:
      - name: monitoring-system
        image: techscaniq/monitoring:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        - name: KAFKA_SERVERS
          value: "kafka-service:9092"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 2. Security Configuration

#### SSL/TLS Setup

```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure reverse proxy (nginx)
server {
    listen 443 ssl;
    server_name monitoring.techscaniq.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Environment Security

```bash
# Production environment variables
export DATABASE_URL="postgresql://user:$(openssl rand -hex 32)@db:5432/monitoring"
export JWT_SECRET_KEY="$(openssl rand -hex 64)"
export REDIS_PASSWORD="$(openssl rand -hex 32)"

# Restrict file permissions
chmod 600 .env
chmod 700 logs/
```

### 3. Monitoring and Alerting

#### Prometheus Configuration

```yaml
# monitoring/prometheus/alerts.yml
groups:
- name: techscaniq_monitoring
  rules:
  - alert: MonitoringSystemDown
    expr: up{job="techscaniq-monitoring"} == 0
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "TechScanIQ monitoring system is down"
      
  - alert: HighScanFailureRate
    expr: rate(scans_failed_total[5m]) > 0.1
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High scan failure rate detected"
```

#### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "TechScanIQ Monitoring Overview",
    "panels": [
      {
        "title": "Active Monitoring Configs",
        "type": "stat",
        "targets": [
          {
            "expr": "techscaniq_active_configs"
          }
        ]
      },
      {
        "title": "Scans per Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(techscaniq_scans_total[1h])"
          }
        ]
      }
    ]
  }
}
```

## Configuration

### 1. Monitoring Configuration Example

```python
# Example: Add monitoring configuration via API
import asyncio
from start_monitoring_system import MonitoringSystem

async def add_config():
    system = MonitoringSystem()
    await system.start()
    
    config = {
        'organization_id': 'org-123',
        'name': 'Example Website Monitoring',
        'url': 'https://example.com',
        'schedule': {
            'type': 'cron',
            'expression': '0 */6 * * *',  # Every 6 hours
            'timezone': 'UTC'
        },
        'scan_config': {
            'technologies': True,
            'performance': True,
            'security': True,
            'performance_thresholds': {
                'load_time': 20,  # 20% change threshold
                'ttfb': 25
            }
        },
        'alert_rules': [
            {
                'id': 'tech-change-alert',
                'name': 'Technology Change Alert',
                'conditions': {
                    'type': 'technology',
                    'change_types': ['added', 'removed'],
                    'min_impact': 'medium'
                },
                'severity': 'medium',
                'notification_channels': [
                    {
                        'type': 'email',
                        'recipients': ['admin@company.com']
                    },
                    {
                        'type': 'slack',
                        'webhook_url': 'https://hooks.slack.com/...',
                        'channel': '#tech-alerts'
                    }
                ],
                'throttle_minutes': 60
            }
        ]
    }
    
    config_id = await system.add_monitoring_config(config)
    print(f"Added monitoring config: {config_id}")

# Run the configuration
# asyncio.run(add_config())
```

### 2. Alert Channel Configuration

#### Email Configuration

```python
{
    'type': 'email',
    'smtp_host': 'smtp.gmail.com',
    'smtp_port': 587,
    'smtp_username': 'alerts@company.com',
    'smtp_password': 'app-password',
    'use_tls': True,
    'from_address': 'noreply@company.com',
    'recipients': ['admin@company.com', 'team@company.com']
}
```

#### Slack Configuration

```python
{
    'type': 'slack',
    'webhook_url': 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
    'channel': '#monitoring-alerts',
    'username': 'TechScanIQ',
    'icon_emoji': ':warning:'
}
```

#### Webhook Configuration

```python
{
    'type': 'webhook',
    'url': 'https://api.company.com/webhooks/monitoring',
    'method': 'POST',
    'headers': {
        'Authorization': 'Bearer your-api-token',
        'Content-Type': 'application/json'
    },
    'auth': {
        'type': 'basic',
        'username': 'webhook-user',
        'password': 'webhook-password'
    }
}
```

## Operations

### 1. System Management

#### Start System

```bash
# Development
python start_monitoring_system.py

# Production with Docker
docker-compose -f docker-compose.prod.yml up -d

# Production with systemd
sudo systemctl start techscaniq-monitoring
```

#### Monitor System Health

```bash
# Check component status
curl http://localhost:8000/health

# View real-time metrics
curl http://localhost:8000/metrics

# Check WebSocket connections
curl http://localhost:8765/stats
```

#### Scale Components

```bash
# Scale with Docker Compose
docker-compose -f docker-compose.prod.yml up -d --scale techscaniq-monitoring=3

# Scale with Kubernetes
kubectl scale deployment techscaniq-monitoring --replicas=5 -n techscaniq-monitoring
```

### 2. Database Management

#### Backup

```bash
# PostgreSQL backup
pg_dump -h localhost -U techscaniq techscaniq_monitoring > backup_$(date +%Y%m%d).sql

# TimescaleDB backup
pg_dump -h localhost -p 5433 -U techscaniq techscaniq_metrics > metrics_backup_$(date +%Y%m%d).sql
```

#### Maintenance

```bash
# Clean old partitions (TimescaleDB)
psql -h localhost -p 5433 -U techscaniq -d techscaniq_metrics -c "
SELECT drop_chunks('performance_metrics', INTERVAL '90 days');
SELECT drop_chunks('system_metrics', INTERVAL '30 days');
"

# Vacuum PostgreSQL
psql -h localhost -U techscaniq -d techscaniq_monitoring -c "VACUUM ANALYZE;"
```

### 3. Log Management

#### Log Locations

```bash
# Application logs
tail -f monitoring_system.log

# Component-specific logs
tail -f logs/pipeline.log
tail -f logs/change_detector.log
tail -f logs/alert_engine.log
tail -f logs/websocket.log

# Docker logs
docker-compose logs -f techscaniq-monitoring
```

#### Log Rotation

```bash
# Configure logrotate
cat > /etc/logrotate.d/techscaniq << EOF
/path/to/techscaniq/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
```

## Troubleshooting

### Common Issues

#### 1. Connection Issues

```bash
# Check service connectivity
docker-compose ps
docker-compose logs kafka
docker-compose logs postgres

# Test database connections
psql -h localhost -U techscaniq -d techscaniq_monitoring -c "SELECT 1;"

# Test Redis connection
redis-cli ping

# Test Kafka topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092
```

#### 2. Memory Issues

```bash
# Monitor memory usage
docker stats

# Adjust memory limits
# Edit docker-compose.yml to increase memory limits

# Check for memory leaks
docker-compose exec techscaniq-monitoring python -c "
import psutil
process = psutil.Process()
print(f'Memory usage: {process.memory_info().rss / 1024 / 1024:.1f} MB')
"
```

#### 3. Performance Issues

```bash
# Check queue depths
curl http://localhost:8000/metrics | grep queue_depth

# Monitor scan performance
curl http://localhost:8000/metrics | grep scan_duration

# Check database performance
psql -h localhost -U techscaniq -d techscaniq_monitoring -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

### Recovery Procedures

#### 1. Component Recovery

```bash
# Restart individual components
docker-compose restart techscaniq-monitoring
docker-compose restart kafka
docker-compose restart postgres

# Check component health after restart
curl http://localhost:8000/health
```

#### 2. Data Recovery

```bash
# Restore from backup
psql -h localhost -U techscaniq -d techscaniq_monitoring < backup_20241220.sql

# Rebuild search indexes
curl -X POST http://localhost:9200/_reindex -H 'Content-Type: application/json' -d '{
  "source": { "index": "old_index" },
  "dest": { "index": "new_index" }
}'
```

## Monitoring and Metrics

### Key Metrics to Monitor

1. **System Health**
   - Component uptime
   - Memory and CPU usage
   - Database connection pool status

2. **Pipeline Performance**
   - Scans per hour
   - Scan success rate
   - Average scan duration
   - Queue depths

3. **Change Detection**
   - Changes detected per hour
   - False positive rate
   - Processing latency

4. **Alerting**
   - Alerts triggered
   - Notification success rate
   - Alert resolution time

### Alerts to Configure

1. **Critical Alerts**
   - System component down
   - Database connection lost
   - Queue overflow
   - High scan failure rate (>10%)

2. **Warning Alerts**
   - High memory usage (>80%)
   - Slow scan performance (>5min average)
   - Queue backlog (>1000 messages)

## Security Considerations

### 1. Network Security

- Use VPC/private networks in cloud deployments
- Configure security groups to restrict access
- Enable TLS for all inter-service communication
- Use secrets management for credentials

### 2. Data Security

- Encrypt databases at rest
- Rotate secrets regularly
- Implement audit logging
- Use least privilege access principles

### 3. Application Security

- Validate all inputs
- Use secure JWT tokens
- Implement rate limiting
- Regular security updates

## Performance Tuning

### 1. Database Optimization

```sql
-- PostgreSQL optimizations
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_segments = 32;
SELECT pg_reload_conf();

-- TimescaleDB optimizations
ALTER SYSTEM SET timescaledb.max_background_workers = 8;
SELECT pg_reload_conf();
```

### 2. Kafka Optimization

```bash
# Kafka broker configuration
cat >> /opt/kafka/config/server.properties << EOF
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
EOF
```

### 3. Application Optimization

```python
# Connection pool optimization
DATABASE_POOL_MIN_SIZE=10
DATABASE_POOL_MAX_SIZE=50
REDIS_POOL_MAX_CONNECTIONS=100
KAFKA_BATCH_SIZE=16384
KAFKA_LINGER_MS=10
```

## Conclusion

This deployment guide provides a comprehensive foundation for running the TechScanIQ Continuous Monitoring System. The system is designed to be scalable, reliable, and maintainable.

For additional support:
- Check the troubleshooting section
- Review component logs
- Monitor system metrics
- Contact the development team

Remember to regularly update the system, monitor performance, and maintain backups for optimal operation.