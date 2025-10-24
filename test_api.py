#!/usr/bin/env python3
"""
Test script for Bluetti Monitor API
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8083"

def test_api_endpoint(endpoint, description):
    """Test a specific API endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}{endpoint}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {description}")
            print(f"   Status: {response.status_code}")
            print(f"   Data: {json.dumps(data, indent=2)[:200]}...")
            return True
        else:
            print(f"❌ {description}")
            print(f"   Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ {description}")
        print(f"   Error: {e}")
        return False

def test_notification_endpoint():
    """Test the notification endpoint"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/notifications/test",
            json={"battery_level": 50},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test Notifications")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Test Notifications")
            print(f"   Status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Test Notifications")
        print(f"   Error: {e}")
        return False

def main():
    """Run all API tests"""
    print("🧪 Testing Bluetti Monitor API...")
    print("=" * 50)
    
    # Test basic endpoints
    test_api_endpoint("/api/health", "Health Check")
    test_api_endpoint("/api/bluetti", "Get All Data")
    test_api_endpoint("/api/bluetti/battery", "Get Battery Status")
    test_api_endpoint("/api/bluetti/power", "Get Power Status")
    test_api_endpoint("/api/bluetti/status", "Get Device Status")
    
    # Test notification endpoint
    test_notification_endpoint()
    
    print("=" * 50)
    print("🏁 API testing complete!")
    print("\n📱 Mobile Dashboard: http://localhost:8083/mobile_dashboard.html")

if __name__ == "__main__":
    main()
