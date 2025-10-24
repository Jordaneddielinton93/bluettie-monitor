#!/usr/bin/env python3

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def test_both_emails():
    """Test email notifications to both Gmail and Hotmail"""
    
    print("🧪 Testing Notifications to Both Email Addresses...")
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
    email_to = env_vars.get('EMAIL_TO', '')
    
    # Split the email addresses
    email_addresses = [email.strip() for email in email_to.split(',')]
    
    print(f"📧 Sending notifications to:")
    for email in email_addresses:
        print(f"   - {email}")
    print(f"📧 From: {email_from}")
    print()
    
    try:
        # Send to each email address separately
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(email_username, email_password)
        
        for email_address in email_addresses:
            # Create message for each recipient
            msg = MIMEMultipart()
            msg['From'] = email_from
            msg['To'] = email_address
            msg['Subject'] = "🔋 Bluetti Monitor - Dual Email Alert Test"
            
            body = f"""
🔋 BLUETTI AC200M MONITOR ALERT

Battery Level: 47% (Test Alert)
Power Input: 0W (Not Charging)
Power Output: 29W (DC Output Active)
Status: Connected and Monitoring

⚠️  LOW BATTERY WARNING
Your Bluetti power station battery is at 47%.
Consider charging soon to maintain power availability.

📊 Current Status:
- Total Battery: 47%
- Total Voltage: 53.18V
- AC Output: OFF
- DC Output: ON (29W)
- Power Generation: 0W

🔔 This is a test notification to confirm your dual email alert system is working correctly.
This message was sent to: {email_address}

Time: Dual Email Test Notification
            """
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email to this recipient
            print(f"📤 Sending notification to {email_address}...")
            text = msg.as_string()
            server.sendmail(email_from, email_address, text)
            print(f"✅ Sent to {email_address}")
        
        server.quit()
        
        print()
        print("✅ Test notifications sent successfully to both addresses!")
        print()
        print("📧 Check both email inboxes:")
        for email in email_addresses:
            print(f"   - {email}")
        print()
        print("🎯 Your Bluetti monitor is now configured for dual email notifications!")
        print("   You'll receive alerts on both accounts when battery levels reach:")
        print("   100%, 50%, 30%, 15%, 10%, or 5%")
        
        return True
        
    except Exception as e:
        print(f"❌ Error sending test notifications: {e}")
        return False

if __name__ == "__main__":
    test_both_emails()
