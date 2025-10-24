#!/usr/bin/env python3

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_regular_email():
    """Test sending a regular email to Gmail"""
    
    print("🧪 Testing Regular Email (not SMS)...")
    print()
    
    # Load .env file
    env_vars = {}
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
    
    # Get configuration
    email_username = env_vars.get('EMAIL_USERNAME', '')
    email_password = env_vars.get('EMAIL_PASSWORD', '')
    email_from = env_vars.get('EMAIL_FROM', '')
    
    # Send to the same Gmail address (regular email)
    email_to = email_username  # Send to yourself
    
    print(f"📧 Sending test email to: {email_to}")
    print(f"📧 From: {email_from}")
    print()
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = email_from
        msg['To'] = email_to
        msg['Subject'] = "Bluetti Monitor Test - Regular Email"
        
        body = """
🔋 Bluetti Monitor Test Email

This is a test email to verify that the email system is working correctly.

If you receive this email, the Gmail configuration is working properly.

The issue with SMS might be:
1. Wrong carrier gateway
2. Email-to-SMS disabled on your account
3. Carrier blocking automated emails

Next steps:
- Check your Gmail inbox for this message
- Let me know what carrier you're with
- We can try different email-to-SMS gateways

Time: Test Email
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        print("📤 Sending test email...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_username, email_password)
        text = msg.as_string()
        server.sendmail(email_from, email_to, text)
        server.quit()
        
        print("✅ Test email sent successfully!")
        print()
        print("📧 Check your Gmail inbox for the test message.")
        print("   If you receive it, the email system is working.")
        print("   The SMS issue is likely with the carrier gateway.")
        
        return True
        
    except Exception as e:
        print(f"❌ Error sending test email: {e}")
        return False

if __name__ == "__main__":
    test_regular_email()
