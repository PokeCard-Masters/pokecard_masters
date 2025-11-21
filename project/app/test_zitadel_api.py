#!/usr/bin/env python3
"""
Test script for Zitadel JWT authentication with Django API.

This script demonstrates how to:
1. Obtain an access token from Zitadel
2. Use that token to call protected Django API endpoints

Usage:
    python test_zitadel_jwt.py
"""

import os
import requests
import json
import time
from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import jwt

# Load environment variables
load_dotenv("project/.env")

ZITADEL_SERVER_URL = os.getenv("ZITADEL_SERVER_URL", "http://localhost:8080")
DJANGO_API_URL = "http://localhost:6000"


def get_token_with_jwt_profile(key_file_path: str) -> dict:
    """
    Get access token using JWT Profile (service account key file).

    Args:
        key_file_path: Path to the Zitadel service account key JSON file

    Returns:
        dict: Token response with access_token, token_type, expires_in
    """
    # Load the key file
    with open(key_file_path, "r") as f:
        key_data = json.load(f)

    user_id = key_data["userId"]
    key_id = key_data["keyId"]
    private_key_pem = key_data["key"]

    # Load the private key
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode(), password=None, backend=default_backend()
    )

    # Create JWT assertion
    now = int(time.time())
    token_url = f"{ZITADEL_SERVER_URL}/oauth/v2/token"

    jwt_payload = {
        "iss": user_id,
        "sub": user_id,
        "aud": ZITADEL_SERVER_URL,
        "iat": now,
        "exp": now + 3600,
    }

    # Sign the JWT with the private key
    assertion = jwt.encode(
        jwt_payload, private_key, algorithm="RS256", headers={"kid": key_id}
    )

    # Exchange JWT for access token
    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion,
        "scope": "openid profile email urn:zitadel:iam:org:project:id:zitadel:aud",
    }

    print(f"Requesting token from: {token_url}")
    print(f"Using JWT Profile for user: {user_id}")
    response = requests.post(token_url, data=data)

    if response.status_code == 200:
        token_data = response.json()
        print("✓ Token obtained successfully!")
        print(f"  Token type: {token_data.get('token_type')}")
        print(f"  Expires in: {token_data.get('expires_in')} seconds")
        return token_data
    else:
        print(f"✗ Failed to get token: {response.status_code}")
        print(f"  Response: {response.text}")
        raise Exception(f"Failed to obtain token: {response.text}")


def get_token_with_client_credentials(client_id: str, client_secret: str) -> dict:
    """
    Get access token using client credentials grant (for service users).

    Args:
        client_id: Service user client ID from Zitadel
        client_secret: Service user client secret from Zitadel

    Returns:
        dict: Token response with access_token, token_type, expires_in
    """
    token_url = f"{ZITADEL_SERVER_URL}/oauth/v2/token"

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": "openid profile email",
    }

    print(f"Requesting token from: {token_url}")
    response = requests.post(token_url, data=data)

    if response.status_code == 200:
        token_data = response.json()
        print("✓ Token obtained successfully!")
        print(f"  Token type: {token_data.get('token_type')}")
        print(f"  Expires in: {token_data.get('expires_in')} seconds")
        return token_data
    else:
        print(f"✗ Failed to get token: {response.status_code}")
        print(f"  Response: {response.text}")
        raise Exception(f"Failed to obtain token: {response.text}")


def test_api_endpoint(endpoint: str, access_token: str) -> None:
    """
    Test a Django API endpoint with JWT authentication.

    Args:
        endpoint: API endpoint path (e.g., "/api/cards")
        access_token: JWT access token from Zitadel
    """
    url = f"{DJANGO_API_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {access_token}",
    }

    print(f"\nTesting endpoint: {url}")
    response = requests.get(url, headers=headers)

    print(f"Status code: {response.status_code}")

    if response.status_code == 200:
        print("✓ Success!")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
        except:
            print(f"Response: {response.text}")
    else:
        print(f"✗ Failed!")
        print(f"Response: {response.text}")


def main():
    """Main test function."""
    print("=" * 60)
    print("Zitadel JWT Authentication Test")
    print("=" * 60)

    # Check for service account key file
    key_file = os.getenv("ZITADEL_SERVICE_KEY_FILE", "zitadel_service_key.json")

    if not os.path.exists(key_file):
        print(f"\n⚠ Service account key file not found: {key_file}")
        print("\nTo use this script, you need to:")
        print("1. Create a service user in Zitadel console")
        print("2. Generate a key (JWT type) for the service user")
        print("3. Download the JSON key file")
        print("4. Save it as 'zitadel_service_key.json' in this directory")
        print("   OR set ZITADEL_SERVICE_KEY_FILE env variable to the path")
        return

    try:
        # Step 1: Get access token using JWT Profile
        print("\n1. Obtaining access token from Zitadel...")
        token_response = get_token_with_jwt_profile(key_file)
        access_token = token_response["access_token"]
        print(f"########### Access Token: {access_token}###############")

        # Step 2: Test public endpoint (should work without token)
        print("\n2. Testing public endpoint (no auth required)...")
        test_api_endpoint("/api/hello", "")

        # Step 3: Test protected endpoint without token (should fail)
        print("\n3. Testing protected endpoint WITHOUT token (should fail)...")
        test_api_endpoint("/api/cards", "")

        # Step 4: Test protected endpoint with token (should succeed)
        print("\n4. Testing protected endpoint WITH token (should succeed)...")
        test_api_endpoint("/api/cards", access_token)

        # Step 5: Test user info endpoint with token
        print("\n5. Testing /me endpoint to see decoded JWT claims...")
        test_api_endpoint("/api/me", access_token)

        print("\n" + "=" * 60)
        print("Test completed!")
        print("=" * 60)

    except Exception as e:
        print(f"\n✗ Error: {e}")
        return


if __name__ == "__main__":
    main()
