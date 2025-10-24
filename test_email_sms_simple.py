#!/usr/bin/env python3

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_email_sms():
    """Test email-to-SMS functionality"""
    
    print("🧪 Testing Email-to-SMS Configuration...")
    print()
    
    # Load .env file manually
    env_vars = {}
    try:
        with open('.env', 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env file not found!")
        return False
    
    # Get configuration from .env file
    email_to = env_vars.get('EMAIL_TO', '+447871094214@mms.ee.co.uk')
    smtp_server = env_vars.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(env_vars.get('SMTP_PORT', '587'))
    email_username = env_vars.get('EMAIL_USERNAME', '')
    email_password = env_vars.get('EMAIL_PASSWORD', '')
    email_from = env_vars.get('EMAIL_FROM', '')
    
    print(f"📧 Email-to-SMS Address: {email_to}")
    print(f"📧 SMTP Server: {smtp_server}:{smtp_port}")
    print(f"📧 From: {email_from}")
    print()
    
    if not email_username or not email_password:
        print("⚠️  Email credentials not configured.")
        print("   To test email-to-SMS, you need to configure:")
        print("   - EMAIL_USERNAME")
        print("   - EMAIL_PASSWORD")
        print("   - EMAIL_FROM")
        print()
        print("💡 For Gmail, use an App Password:")
        print("   1. Go to Google Account settings")
        print("   2. Enable 2-factor authentication")
        print("   3. Generate an App Password")
        print("   4. Use that password in EMAIL_PASSWORD")
        print()
        print("🔧 To configure, edit your .env file with:")
        print("   EMAIL_USERNAME=your_email@gmail.com")
        print("   EMAIL_PASSWORD=your_app_password")
        print("   EMAIL_FROM=your_email@gmail.com")
        print()
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = email_from
        msg['To'] = email_to
        msg['Subject'] = "Bluetti Test Alert"
        
        body = """
🔋 Bluetti Monitor Test Alert

This is a test message from your Bluetti monitoring system.

If you receive this as an SMS, your email-to-SMS configuration is working correctly!

Battery Status: Test Mode
Power Input: 0W
Power Output: 0W

Time: Test Message
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        print("📤 Sending test email-to-SMS...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(email_username, email_password)
        text = msg.as_string()
        server.sendmail(email_from, email_to, text)
        server.quit()
        
        print("✅ Test email-to-SMS sent successfully!")
        print()
        print("📱 Check your phone for the SMS message.")
        print("   It should arrive within a few minutes.")
        print()
        print("🎯 If you receive the SMS, your configuration is working!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error sending test email-to-SMS: {e}")
        print()
        print("🔧 Troubleshooting:")
        print("   1. Check your email credentials")
        print("   2. Ensure 2-factor authentication is enabled")
        print("   3. Use an App Password for Gmail")
        print("   4. Check your carrier's email gateway")
        return False

if __name__ == "__main__":
    test_email_sms()
