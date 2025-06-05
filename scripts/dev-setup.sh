#!/bin/bash

# TechScanIQ Development Setup Script
# This script helps set up the development environment with proper CORS configuration

echo "🔧 TechScanIQ Development Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env.local from .env.example..."
        cp .env.example .env.local
        echo "✅ .env.local created. Please update it with your Supabase credentials."
    else
        echo "⚠️  .env.example not found. You'll need to create .env.local manually."
    fi
else
    echo "✅ .env.local already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

# Check if we can reach Supabase
echo "🔗 Testing Supabase connection..."
if [ -f ".env.local" ]; then
    SUPABASE_URL=$(grep VITE_SUPABASE_URL .env.local | cut -d'=' -f2)
    if [ -n "$SUPABASE_URL" ]; then
        if curl -s --head --request GET "$SUPABASE_URL" | grep "200 OK" > /dev/null; then
            echo "✅ Supabase connection successful"
        else
            echo "⚠️  Could not reach Supabase. Please check your VITE_SUPABASE_URL in .env.local"
        fi
    else
        echo "⚠️  VITE_SUPABASE_URL not found in .env.local"
    fi
fi

echo ""
echo "🚀 Setup Complete!"
echo ""
echo "To start development:"
echo "  npm run dev          # Start on port 5173 (recommended)"
echo "  npm run dev -- --port 3000  # Start on port 3000 (alternative)"
echo ""
echo "📖 Documentation:"
echo "  docs/development-setup.md     # Complete setup guide"
echo "  docs/cors-troubleshooting.md  # CORS issue help"
echo ""
echo "🔧 Configured localhost ports (CORS-ready):"
echo "  ✅ http://localhost:5173"
echo "  ✅ http://localhost:3000"
echo ""
echo "⚠️  Using other ports? See docs/development-setup.md for CORS configuration."
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI installed: $(supabase --version)"
else
    echo "📥 Optional: Install Supabase CLI for edge function management:"
    echo "   npm install -g supabase"
fi

echo ""
echo "Happy coding! 🎉"