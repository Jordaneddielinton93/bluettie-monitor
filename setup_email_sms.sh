#!/bin/bash

echo "🚀 Setting up Email-to-SMS (FREE) for Bluetti Monitor..."

# Check if .env file exists, if not, create it from example
if [ ! -f .env ]; then
    echo "Creating .env file from env.example..."
    cp env.example .env
fi

echo ""
echo "📱 Email-to-SMS Setup (FREE)"
echo "=============================="
echo ""
echo "Your phone number: +447871094214"
echo ""
echo "Please select your mobile carrier:"
echo "1) EE"
echo "2) Vodafone"
echo "3) O2"
echo "4) Three"
echo "5) Other (I'll enter manually)"
echo ""
read -p "Enter your choice (1-5): " carrier_choice

case $carrier_choice in
    1)
        EMAIL_TO="+447871094214@mms.ee.co.uk"
        echo "✅ Configured for EE"
        ;;
    2)
        EMAIL_TO="+447871094214@vodafone.net"
        echo "✅ Configured for Vodafone"
        ;;
    3)
        EMAIL_TO="+447871094214@o2.co.uk"
        echo "✅ Configured for O2"
        ;;
    4)
        EMAIL_TO="+447871094214@three.co.uk"
        echo "✅ Configured for Three"
        ;;
    5)
        echo "Please enter your carrier's email gateway (e.g., @mms.ee.co.uk):"
        read -r carrier_gateway
        EMAIL_TO="+447871094214@$carrier_gateway"
        echo "✅ Configured for custom carrier: $carrier_gateway"
        ;;
    *)
        echo "❌ Invalid choice. Using EE as default."
        EMAIL_TO="+447871094214@mms.ee.co.uk"
        ;;
esac

# Update .env file with email-to-SMS configuration
echo ""
echo "📝 Updating .env file with email-to-SMS configuration..."

# Enable SMS and set provider to email_sms
sed -i "s/^SMS_ENABLED=.*$/SMS_ENABLED=true/" .env
sed -i "s/^SMS_PROVIDER=.*$/SMS_PROVIDER=email_sms/" .env

# Set the email-to-SMS address
sed -i "s/^EMAIL_TO=.*$/EMAIL_TO=$EMAIL_TO/" .env

# Clear Twilio settings (not needed for email-to-SMS)
sed -i "s/^TWILIO_ACCOUNT_SID=.*$/TWILIO_ACCOUNT_SID=/" .env
sed -i "s/^TWILIO_AUTH_TOKEN=.*$/TWILIO_AUTH_TOKEN=/" .env
sed -i "s/^TWILIO_PHONE_NUMBER=.*$/TWILIO_PHONE_NUMBER=/" .env

echo ""
echo "✅ Email-to-SMS configuration complete!"
echo ""
echo "📋 Configuration Summary:"
echo "   Phone Number: +447871094214"
echo "   Carrier Gateway: $EMAIL_TO"
echo "   Provider: Email-to-SMS (FREE)"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test the notification system"
echo "   2. Monitor your phone for SMS alerts"
echo "   3. Enjoy free SMS notifications!"
echo ""
echo "💡 Note: SMS messages will be sent to: $EMAIL_TO"
echo "   This will appear as an email in your carrier's system and be delivered as SMS to your phone."
