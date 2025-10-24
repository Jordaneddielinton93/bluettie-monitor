#!/usr/bin/env python3

import re

def update_gmail_credentials():
    """Update .env file with Gmail credentials"""
    
    print("📧 Updating .env file with Gmail credentials...")
    
    # Read the .env file
    with open('.env', 'r') as f:
        content = f.read()
    
    # Get Gmail details from user
    print("\nPlease enter your Gmail details:")
    email_username = input("Gmail address (e.g., yourname@gmail.com): ").strip()
    email_from = email_username  # Use same email for from
    app_password = "bhkp bojd fbjy cwhz"  # The app password you provided
    
    # Update the .env file
    content = re.sub(r'^EMAIL_USERNAME=.*$', f'EMAIL_USERNAME={email_username}', content, flags=re.MULTILINE)
    content = re.sub(r'^EMAIL_PASSWORD=.*$', f'EMAIL_PASSWORD={app_password}', content, flags=re.MULTILINE)
    content = re.sub(r'^EMAIL_FROM=.*$', f'EMAIL_FROM={email_from}', content, flags=re.MULTILINE)
    
    # Write the updated content back
    with open('.env', 'w') as f:
        f.write(content)
    
    print(f"\n✅ Gmail credentials updated!")
    print(f"   Email: {email_username}")
    print(f"   App Password: {app_password}")
    print(f"   From: {email_from}")
    print("\n🎯 Ready to test email-to-SMS!")

if __name__ == "__main__":
    update_gmail_credentials()
