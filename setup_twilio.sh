#!/bin/bash

# Twilio Setup Script for Bluetti Monitor
# This script helps you set up Twilio SMS notifications

echo "🚀 Setting up Twilio SMS notifications for Bluetti Monitor..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your Twilio credentials."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "📋 Next steps:"
echo "1. Go to https://console.twilio.com"
echo "2. Get your Account SID and Auth Token"
echo "3. Purchase a phone number"
echo "4. Edit the .env file with your credentials:"
echo ""
echo "   SMS_ENABLED=true"
echo "   SMS_PROVIDER=twilio"
echo "   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "   TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo "   TWILIO_PHONE_NUMBER=+1234567890"
echo "   TO_PHONE_NUMBER=+1234567890"
echo ""
echo "5. Test your setup:"
echo "   curl -X POST http://localhost:8083/api/notifications/test \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"battery_level\": 50}'"
echo ""
echo "📖 For detailed setup instructions, see TWILIO_SETUP.md"
echo ""
echo "🔒 Remember: Never commit your .env file to version control!"
