#!/bin/bash

# TechScanIQ Monitoring System Startup Script

set -e

echo "🚀 Starting TechScanIQ Monitoring System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in development or production mode
MODE=${1:-development}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+ first."
        exit 1
    fi
    
    # Check Python version
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    REQUIRED_VERSION="3.11"
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Python 3.11+ is required. Current version: $PYTHON_VERSION"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_warning ".env file not found. Copying from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before proceeding."
        echo "Press Enter to continue after editing .env..."
        read
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install/upgrade pip
    pip install --upgrade pip
    
    # Install requirements
    print_status "Installing Python dependencies..."
    pip install -r requirements-monitoring.txt
    
    print_success "Environment setup completed"
}

# Start infrastructure services
start_infrastructure() {
    print_status "Starting infrastructure services..."
    
    # Choose docker-compose file based on mode
    if [ "$MODE" = "production" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        COMPOSE_FILE="docker-compose.monitoring.yml"
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "Docker compose file $COMPOSE_FILE not found!"
        exit 1
    fi
    
    # Start services
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    print_status "Waiting for PostgreSQL..."
    until docker-compose -f $COMPOSE_FILE exec -T postgres pg_isready -U techscaniq -d techscaniq_monitoring; do
        echo "PostgreSQL is unavailable - sleeping"
        sleep 2
    done
    print_success "PostgreSQL is ready"
    
    # Wait for TimescaleDB
    print_status "Waiting for TimescaleDB..."
    until docker-compose -f $COMPOSE_FILE exec -T timescaledb pg_isready -U techscaniq -d techscaniq_metrics; do
        echo "TimescaleDB is unavailable - sleeping"
        sleep 2
    done
    print_success "TimescaleDB is ready"
    
    # Wait for Redis
    print_status "Waiting for Redis..."
    until docker-compose -f $COMPOSE_FILE exec -T redis redis-cli ping; do
        echo "Redis is unavailable - sleeping"
        sleep 2
    done
    print_success "Redis is ready"
    
    # Wait for Kafka
    print_status "Waiting for Kafka..."
    sleep 30  # Kafka takes longer to start
    until docker-compose -f $COMPOSE_FILE exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list; do
        echo "Kafka is unavailable - sleeping"
        sleep 5
    done
    print_success "Kafka is ready"
    
    # Wait for Elasticsearch
    print_status "Waiting for Elasticsearch..."
    until curl -s http://localhost:9200/_cluster/health; do
        echo "Elasticsearch is unavailable - sleeping"
        sleep 5
    done
    print_success "Elasticsearch is ready"
    
    print_success "All infrastructure services are ready"
}

# Initialize databases
initialize_databases() {
    print_status "Initializing databases..."
    
    # Source environment variables
    source .env
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Apply database migrations
    python3 << EOF
import asyncio
import asyncpg
import os
import sys

async def apply_migrations():
    try:
        print("Applying PostgreSQL migrations...")
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        
        # Apply core schema
        with open('database/migrations/001_monitoring_core_schema.sql', 'r') as f:
            await conn.execute(f.read())
        
        await conn.close()
        print("PostgreSQL migrations applied successfully")
        
        print("Applying TimescaleDB migrations...")
        conn = await asyncpg.connect(os.getenv('METRICS_DATABASE_URL'))
        
        with open('database/migrations/002_timescale_metrics.sql', 'r') as f:
            await conn.execute(f.read())
        
        await conn.close()
        print("TimescaleDB migrations applied successfully")
        
    except Exception as e:
        print(f"Error applying migrations: {e}")
        sys.exit(1)

asyncio.run(apply_migrations())
EOF
    
    print_success "Database initialization completed"
}

# Start monitoring system
start_monitoring_system() {
    print_status "Starting TechScanIQ Monitoring System..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Source environment variables
    source .env
    
    # Add current directory to Python path
    export PYTHONPATH="${PYTHONPATH}:$(pwd)"
    
    # Start the monitoring system
    python start_monitoring_system.py
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Check if services are running
    if ! docker-compose -f docker-compose.monitoring.yml ps | grep -q "Up"; then
        print_error "Some infrastructure services are not running"
        return 1
    fi
    
    # Check if monitoring system is responding
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Monitoring system is healthy"
    else
        print_warning "Monitoring system health check failed (may still be starting)"
    fi
    
    # Check WebSocket server
    if curl -s http://localhost:8765/stats > /dev/null 2>&1; then
        print_success "WebSocket server is healthy"
    else
        print_warning "WebSocket server health check failed (may still be starting)"
    fi
}

# Stop services
stop_services() {
    print_status "Stopping TechScanIQ Monitoring System..."
    
    # Stop monitoring system (if running in background)
    pkill -f "start_monitoring_system.py" || true
    
    # Stop Docker services
    if [ "$MODE" = "production" ]; then
        docker-compose -f docker-compose.prod.yml down
    else
        docker-compose -f docker-compose.monitoring.yml down
    fi
    
    print_success "Services stopped"
}

# Show usage
show_usage() {
    echo "Usage: $0 [command] [mode]"
    echo "Commands:"
    echo "  start       Start the monitoring system (default)"
    echo "  stop        Stop the monitoring system"
    echo "  restart     Restart the monitoring system"
    echo "  status      Check system status"
    echo "  logs        Show logs"
    echo "  health      Perform health check"
    echo ""
    echo "Modes:"
    echo "  development Development mode (default)"
    echo "  production  Production mode"
    echo ""
    echo "Examples:"
    echo "  $0 start development"
    echo "  $0 stop"
    echo "  $0 restart production"
    echo "  $0 status"
}

# Show logs
show_logs() {
    print_status "Showing logs..."
    
    if [ "$MODE" = "production" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        docker-compose -f docker-compose.monitoring.yml logs -f
    fi
}

# Show status
show_status() {
    print_status "System Status:"
    
    # Check Docker services
    if [ "$MODE" = "production" ]; then
        docker-compose -f docker-compose.prod.yml ps
    else
        docker-compose -f docker-compose.monitoring.yml ps
    fi
    
    echo ""
    print_status "Port Status:"
    echo "PostgreSQL: $(nc -z localhost 5432 && echo 'Open' || echo 'Closed')"
    echo "TimescaleDB: $(nc -z localhost 5433 && echo 'Open' || echo 'Closed')"
    echo "Redis: $(nc -z localhost 6379 && echo 'Open' || echo 'Closed')"
    echo "Kafka: $(nc -z localhost 29092 && echo 'Open' || echo 'Closed')"
    echo "Elasticsearch: $(nc -z localhost 9200 && echo 'Open' || echo 'Closed')"
    echo "WebSocket: $(nc -z localhost 8765 && echo 'Open' || echo 'Closed')"
}

# Main script logic
COMMAND=${1:-start}
MODE=${2:-development}

case $COMMAND in
    "start")
        check_prerequisites
        setup_environment
        start_infrastructure
        initialize_databases
        print_success "Infrastructure is ready!"
        print_status "You can now start the monitoring system with:"
        print_status "source venv/bin/activate && python start_monitoring_system.py"
        print_status "Or use: $0 run"
        ;;
    "run")
        start_monitoring_system
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 5
        $0 start $MODE
        ;;
    "status")
        show_status
        ;;
    "health")
        health_check
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        show_usage
        exit 1
        ;;
esac