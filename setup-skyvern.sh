#!/bin/bash

echo "Setting up Skyvern for TechScanIQ..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.11 or higher."
    exit 1
fi

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv-skyvern

# Activate virtual environment
source venv-skyvern/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install Skyvern and dependencies
echo "Installing Skyvern and dependencies..."
pip install skyvern
pip install anthropic
pip install supabase
pip install redis
pip install python-dotenv

# Install Playwright browsers (required by Skyvern)
echo "Installing Playwright browsers..."
playwright install chromium

# Create environment variable for the venv path
echo ""
echo "✅ Skyvern setup complete!"
echo ""
echo "Add this to your .env file:"
echo "SKYVERN_VENV_PATH=$(pwd)/venv-skyvern"
echo ""
echo "To use Skyvern manually:"
echo "  source venv-skyvern/bin/activate"
echo "  skyvern --help"
echo ""
echo "The workers will automatically use this virtual environment."