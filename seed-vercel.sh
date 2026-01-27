#!/bin/bash

# Vercel Seed Script
# Run this after deploying to Vercel

echo "=================================="
echo "TruckFlow - Vercel Seed Script"
echo "=================================="
echo ""

# Check if required variables are set
if [ -z "$VERCEL_URL" ]; then
    read -p "Enter your Vercel backend URL (e.g., https://your-backend.vercel.app): " VERCEL_URL
fi

if [ -z "$SEED_SECRET" ]; then
    read -p "Enter your SEED_SECRET (from Vercel env vars): " SEED_SECRET
fi

echo ""
echo "Calling seed endpoint..."
echo "URL: $VERCEL_URL/api/seed"
echo ""

# Call the seed endpoint
response=$(curl -s -X POST "$VERCEL_URL/api/seed" \
  -H "Content-Type: application/json" \
  -d "{\"secret\":\"$SEED_SECRET\"}")

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

echo ""
echo "=================================="
echo "Done!"
echo "=================================="
echo ""
echo "If successful, you can now login with:"
echo "Email: manager@truckflow.com"
echo "Password: manager123"
echo ""
echo "⚠️  Remember to change the password after first login!"
