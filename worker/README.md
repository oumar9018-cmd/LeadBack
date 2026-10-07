# LeadBack Cloudflare Worker - Razorpay Payment Backend

## Overview

This Cloudflare Worker replaces the Firebase Cloud Functions-based Razorpay payment backend. It provides three endpoints:

- `POST /create-order` - Create a Razorpay order server-side
- `POST /verify-payment` - Verify and capture a Razorpay payment
- `POST /start-trial` - Start a free 1-month trial

## Authentication

All endpoints require a Firebase ID Token in the `Authorization` header:

```
Authorization: Bearer <Firebase ID token>
```

The worker verifies the Firebase token and extracts the `uid`, which is used to:
- Identify the user's account in Firestore
- Ensure payments belong to the correct user
- Update the correct user's subscription/trial status

## Environment Variables

The worker requires the following environment variables:

### Variables (set in wrangler.toml or dashboard)
- `RAZORPAY_KEY_ID` - Your Razorpay test key ID (e.g., `rzp_test_XXX`)
- `FIREBASE_API_KEY` - Your Firebase API key

### Secrets (do NOT commit to GitHub - store in Cloudflare dashboard)
- `RAZORPAY_KEY_SECRET` - Your Razorpay key secret (kept secret!)
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase service account JSON (for admin operations)

## Endpoints

### POST /create-order

Creates a Razorpay order server-side. The amount is always controlled server-side, not from the browser.

**Request body:**
```json
{
  "plan": "monthly" | "yearly",
  "purpose": "purchase" | "trial"
}
```

**Response:**
```json
{
  "orderId": "order_XXX",
  "amount": 49900, // or 499000 for yearly
  "currency": "INR",
  "purpose": "purchase"
}
```

### POST /verify-payment

Verifies a Razorpay payment and updates the user's subscription/trial status.

**Request body:**
```json
{
  "orderId": "order_XXX",
  "paymentId": "pay_XYZ",
  "signature": "hex_hmac_sha256_signature"
}
```

**Response:**
```json
{
  "verified": true,
  "alreadyProcessed": false,
  "plan": "monthly",
  "subscriptionEndsAt": "2024-XX-XXTXX:XX:XX.XXXZ",
  "purpose": "purchase"
}
```

### POST /start-trial

Starts a free 1-month trial for the user.

**Response:**
```json
{
  "trialStarted": true,
  "trialEndsAt": "2024-XX-XXTXX:XX:XX.XXXZ"
}
```

## Security

- **Amount is server-controlled**: The browser should NOT determine the order amount. The worker always uses the fixed PLANS mapping (monthly: 49900 paise, yearly: 499000 paise).
- **Signature verification**: Razorpay HMAC-SHA256 signature is verified server-side.
- **User ownership**: The worker verifies that the Razorpay order belongs to the authenticated user.
- **Duplicate prevention**: The worker checks that orders aren't already paid before processing.
- **Capture after verification**: Authorized payments are captured server-side before granting access.

## Development

1. Install dependencies: `npm install`
2. Run dev server: `npm run dev`
2. Deploy: `npm run deploy` (or use Cloudflare dashboard)

## Local Development

```bash
# Set environment variables
export RAZORPAY_KEY_ID=rzp_test_XXX
export RAZORPAY_KEY_SECRET=your_secret
export FIREBASE_API_KEY=your_firebase_api_key

# Run dev server
npx wrangler dev
```

## Deployment Secrets

Never commit secrets to GitHub! Store these in the Cloudflare dashboard:
- `RAZORPAY_KEY_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`