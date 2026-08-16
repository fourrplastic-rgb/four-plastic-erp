#!/bin/bash

echo "=========================================================="
echo "    FOUR (R) PLASTIC - Secure Remote Access Tunnel        "
echo "=========================================================="
echo ""
echo "This script will securely expose your local ERP to the"
echo "internet using Cloudflare Tunnels."
echo ""
echo "Nobody can access your data without your username & password."
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null
then
    echo "📦 'cloudflared' could not be found."
    echo "Installing via Homebrew..."
    
    if ! command -v brew &> /dev/null
    then
        echo "❌ Homebrew is not installed. Please install Homebrew first:"
        echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
        exit 1
    fi
    
    brew install cloudflare/cloudflare/cloudflared
    echo "✅ cloudflared installed successfully."
fi

echo "🚀 Starting Secure Tunnel..."
echo ""
echo "👉 Look for the link ending in '.trycloudflare.com' below."
echo "👉 Copy that link and paste it into your phone or laptop browser."
echo "👉 Keep this terminal open while you want remote access."
echo "=========================================================="
echo ""

# Run the tunnel on port 3000 (Next.js frontend port)
cloudflared tunnel --url http://localhost:3000
