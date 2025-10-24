#!/usr/bin/env python3

import os
import re

def configure_email_sms():
    """Configure .env file for email-to-SMS"""
    
    print("🚀 Configuring Email-to-SMS (FREE) for Bluetti Monitor...")
    print()
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("❌ .env file not found. Creating from env.example...")
        os.system('cp env.example .env')
    
    # Read the .env file
    with open('.env', 'r') as f:
        content = f.read()
    
    # Update SMS configuration
    content = re.sub(r'^SMS_ENABLED=.*$', 'SMS_ENABLED=true', content, flags=re.MULTILINE)
    content = re.sub(r'^SMS_PROVIDER=.*$', 'SMS_PROVIDER=email_sms', content, flags=re.MULTILINE)
    content = re.sub(r'^EMAIL_TO=.*$', 'EMAIL_TO=+447871094214@mms.ee.co.uk', content, flags=re.MULTILINE)
    
    # Clear Twilio settings (not needed for email-to-SMS)
    content = re.sub(r'^TWILIO_ACCOUNT_SID=.*$', 'TWILIO_ACCOUNT_SID=', content, flags=re.MULTILINE)
    content = re.sub(r'^TWILIO_AUTH_TOKEN=.*$', 'TWILIO_AUTH_TOKEN=', content, flags=re.MULTILINE)
    content = re.sub(r'^TWILIO_PHONE_NUMBER=.*$', 'TWILIO_PHONE_NUMBER=', content, flags=re.MULTILINE)
    
    # Write the updated content back
    with open('.env', 'w') as f:
        f.write(content)
    
    print("✅ Email-to-SMS configuration complete!")
    print()
    print("📋 Configuration Summary:")
    print("   Phone Number: +447871094214")
    print("   Carrier Gateway: +447871094214@mms.ee.co.uk")
    print("   Provider: Email-to-SMS (FREE)")
    print()
    print("🎯 Next Steps:")
    print("   1. Test the notification system")
    print("   2. Monitor your phone for SMS alerts")
    print("   3. Enjoy free SMS notifications!")
    print()
    print("💡 Note: SMS messages will be sent to: +447871094214@mms.ee.co.uk")
    print("   This will appear as an email in your carrier's system and be delivered as SMS to your phone.")

if __name__ == "__main__":
    configure_email_sms()
