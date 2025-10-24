#!/usr/bin/env python3

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

def test_email_sms():
    """Test email-to-SMS functionality"""
    
    print("🧪 Testing Email-to-SMS Configuration...")
    print()
    
    # Load environment variables
    load_dotenv()
    
    # Get configuration
    email_to = os.getenv('EMAIL_TO', '')
    smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    email_username = os.getenv('EMAIL_USERNAME', '')
    email_password = os.getenv('EMAIL_PASSWORD', '')
    email_from = os.getenv('EMAIL_FROM', '')
    
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
