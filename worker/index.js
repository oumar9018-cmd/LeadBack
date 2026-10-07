/**
 * Cloudflare Worker for LeadBack Razorpay Payment Backend
 * 
 * Endpoints:
 *   POST /create-order
 *   POST /verify-payment
 *   POST /start-trial
 * 
 * Authentication: Firebase ID Token in Authorization header
 *   Authorization: Bearer <Firebase ID token>
 */

// Firebase configuration
const firebaseProjectId = 'leadback-3345f';
let firebaseApiKey = '';

// Razorpay configuration
let RAZORPAY_KEY_ID = '';
let RAZORPAY_KEY_SECRET = '';

const PLANS = Object.freeze({
  monthly: { amount: 49900, months: 1 },
  yearly: { amount: 499000, months: 12 },
});

/**
 * Base64 encode a string for Basic auth header
 */
function b64encode(str) {
  // btoa works on ASCII/UTF-8 strings in JS
  return btoa(str);
}

/**
 * Create Basic auth header for Razorpay
 */
function getRazorpayAuthHeader() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay server credentials are not configured.');
  }
  return `Basic ${b64encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`;
}

/**
 * Verify Firebase ID token by decoding JWT and checking essential claims.
 * For production, proper JWT signature verification should be implemented
 * using Firebase's public keys from https://www.googleapis.com/identitytoolkit/v3/relyingparty/jwks.json
 */
async function verifyFirebaseToken(token) {
  try {
    // Split the JWT into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part of JWT)
    let payload;
    try {
      // JWT payload is base64url encoded
      const payloadBase64 = parts[1].replace(/-/g, '').replace(/_/g, '');
      payload = JSON.parse(atob(payloadBase64));
    } catch (e) {
      return null;
    }

    // Check essential claims
    if (!payload.uid || typeof payload.uid !== 'string') {
      return null;
    }

    // Check expiry (exp claim is seconds from epoch)
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null; // Token expired
    }

    // Check issuer (iss should be firebase project)
    const validIssuers = [
      `https://securetoken.google.com/${firebaseProjectId}`,
      `https://firebase.google.com/projects/${firebaseProjectId}`,
    ];
    if (payload.iss && !validIssuers.includes(payload.iss)) {
      return null;
    }

    // Check subject (uid should exist)
    if (!payload.sub) {
      return null;
    }

    return payload.uid;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return null;
  }
}

/**
 * Razorpay API request helper
 */
async function razorpayRequest(path, options = {}) {
  const { method = 'GET', body } = options;
  const url = `https://api.razorpay.com/v1${path}`;

  const fetchOptions = {
    method,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay API request failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * HMAC-SHA256 signature verification for Razorpay
 * Uses Web Crypto API available in Cloudflare Workers
 */
async function verifyRazorpaySignature(signature, orderId, paymentId) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const message = encoder.encode(`${orderId}|${paymentId}`);

    // Import HMAC key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      'HMAC',
      false,
      ['sign']
    );

    // Compute expected signature
    const expectedBuffer = await crypto.subtle.sign('HMAC', key, message);

    // Decode the supplied signature (hex string)
    const supplied = Uint8Array.from(Buffer.from ? Buffer.from(signature, 'hex') : 
      atob(signature).split('').map(char => char.charCodeAt(0)));

    // Compare lengths
    if (supplied.length !== expectedBuffer.length) {
      return false;
    }

    // Timing-safe comparison
    let result = 0;
    for (let i = 0; i < supplied.length; i++) {
      result |= supplied[i] ^ expectedBuffer[i];
    }
    return result === 0;
  } catch (e) {
    // Fallback: if Web Crypto not available, use basic check
    // This is a simplified fallback - proper implementation needed
    const expectedHex = cryptoSubtleFallback(orderId, paymentId);
    return Buffer.from(signature, 'hex').toString() === expectedHex;
  }
}

/**
 * Fallback signature verification using crypto module (for Node.js environments)
 * This won't run in Cloudflare Workers but kept for reference
 */
function cryptoSubtleFallback(orderId, paymentId) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

/**
 * Create a Razorpay order server-side
 */
async function createRazorpayOrder(amount, currency, receipt, notes) {
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: getRazorpayAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt,
      ...notes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.status} - ${errorData}`);
  }

  return response.json();
}

/**
 * Fetch payment details from Razorpay API
 */
async function fetchRazorpayPayment(paymentId) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: getRazorpayAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Razorpay payment fetch failed: ${response.status} - ${errorData}`);
  }

  return response.json();
}

/**
 * Capture an authorized payment
 */
async function captureRazorpayPayment(paymentId, amount, currency) {
  const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: getRazorpayAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Razorpay capture failed: ${response.status} - ${errorData}`);
  }

  return response.json();
}

/**
 * Parse Firestore document data from REST API response
 */
function parseFirestoreData(firestoreData) {
  if (!firestoreData || !firestoreData.document) return {};

  const fields = firestoreData.document.fields || {};
  const result = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue, 10);
    } else if (value.doubleValue !== undefined) {
      result[key] = parseFloat(value.doubleValue);
    } else if (value.timestampValue !== undefined) {
      const date = new Date(value.timestampValue);
      result[key] = isNaN(date.getTime()) ? null : date.toISOString();
    } else if (value.arrayValue !== undefined) {
      result[key] = value.arrayValue.values.map(v => {
        if (v.stringValue) return v.stringValue;
        if (v.integerValue) return parseInt(v.integerValue, 10);
        if (v.doubleValue) return parseFloat(v.doubleValue);
        return null;
      });
    } else if (value.mapValue !== undefined) {
      const mapFields = value.mapValue.fields || {};
      result[key] = Object.fromEntries(Object.entries(mapFields));
    }
  }

  return result;
}

/**
 * Get a Firestore document via REST API
 */
async function getFirestoreDoc(collectionPath, docId) {
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collectionPath}/${docId}?key=${firebaseApiKey}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firestore read failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return { exists: true, data: parseFirestoreData(data) };
  } catch (error) {
    console.error('Firestore doc read error:', error);
    return { exists: false, data: {} };
  }
}

/**
 * Set a Firestore document via REST API (PATCH)
 */
async function setFirestoreDoc(collectionPath, docId, data, merge = false) {
  // Convert data to Firestore format
  const body = { fields: {} };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      body.fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        body.fields[key] = { integerValue: String(value) };
      } else {
        body.fields[key] = { doubleValue: String(value) };
      }
    } else if (value instanceof Date) {
      body.fields[key] = { timestampValue: value.toISOString() };
    } else if (value === true) {
      body.fields[key] = { booleanValue: 'true' };
    } else if (value === false) {
      body.fields[key] = { booleanValue: 'false' };
    }
  }

  const mergeParam = merge ? '?updateMask=*' : '';
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collectionPath}/${docId}${mergeParam}?key=${firebaseApiKey}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firestore write failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Helper: Add months to a date
 */
function addMonths(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }
  return result;
}

/**
 * GET / - Health check
 */
async function handleHealth(request) {
  return new Response(
    JSON.stringify({ status: 'ok', service: 'leadback-payment' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * POST /create-order - Create a Razorpay order
 */
async function handleCreateOrder(request) {
  try {
    // Get and verify Firebase auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring('Bearer '.length);
    const uid = await verifyFirebaseToken(token);

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'Unauthenticated: Invalid Firebase token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { plan, purpose } = body;

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Valid plan is required (monthly or yearly)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['purchase', 'trial'].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: 'Valid purpose is required (purchase or trial)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const planInfo = PLANS[plan];
    if (!planInfo) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan specified' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing trial/subscription
    const userDoc = await getFirestoreDoc('users', uid);
    const account = userDoc.exists ? userDoc.data : {};

    // If purpose is trial, check if trial already used
    if (purpose === 'trial') {
      if (
        account.trialRedeemed ||
        account.trialStartedAt ||
        account.trialEndsAt ||
        account.subscriptionStatus === 'active' ||
        account.subscriptionStatus === 'subscribed'
      ) {
        return new Response(
          JSON.stringify({ error: 'This account has already used its free trial.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create receipt ID
    const receipt = `lb_${uid.slice(0, 12)}_${Date.now()}`;

    // Create Razorpay order server-side (amount is always server-controlled)
    let order;
    try {
      order = await createRazorpayOrder(
        planInfo.amount,
        'INR',
        receipt,
        { uid, plan, purpose }
      );
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      return new Response(
        JSON.stringify({ error: 'Unable to start Razorpay checkout. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!order?.id || order.amount !== planInfo.amount || order.currency !== 'INR') {
      return new Response(
        JSON.stringify({ error: 'Razorpay returned an unexpected order' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save order record to Firestore
    try {
      await setFirestoreDoc('razorpayOrders', order.id, {
        uid,
        plan,
        purpose,
        amount: planInfo.amount,
        currency: 'INR',
        status: 'created',
        createdAt: new Date().toISOString(),
      }, true);
    } catch (error) {
      console.error('Firestore order save error:', error);
    }

    return new Response(
      JSON.stringify({
        orderId: order.id,
        amount: planInfo.amount,
        currency: 'INR',
        purpose,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('create-order error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /verify-payment - Verify and capture Razorpay payment
 */
async function handleVerifyPayment(request) {
  try {
    // Get and verify Firebase auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring('Bearer '.length);
    const uid = await verifyFirebaseToken(token);

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'Unauthenticated: Invalid Firebase token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { orderId, paymentId, signature } = body || {};

    if (
      typeof orderId !== 'string' ||
      typeof paymentId !== 'string' ||
      typeof signature !== 'string' ||
      orderId.length > 100 ||
      paymentId.length > 100
    ) {
      return new Response(
        JSON.stringify({ error: 'Payment details are incomplete.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check the Razorpay order in Firestore
    const orderDoc = await getFirestoreDoc('razorpayOrders', orderId);

    if (!orderDoc.exists) {
      return new Response(
        JSON.stringify({ error: 'Razorpay order not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const savedOrder = orderDoc.data;

    // Verify the order belongs to this user
    if (savedOrder.uid !== uid) {
      return new Response(
        JSON.stringify({ error: 'This payment does not belong to your account.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate plan details match
    const planInfo = PLANS[savedOrder.plan];
    if (!planInfo || savedOrder.amount !== planInfo.amount || savedOrder.currency !== 'INR') {
      return new Response(
        JSON.stringify({ error: 'Stored Razorpay order has invalid plan details.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify Razorpay signature
    const isValid = await verifyRazorpaySignature(signature, orderId, paymentId);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Razorpay could not verify this payment.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch payment details from Razorpay
    let payment;
    try {
      payment = await fetchRazorpayPayment(paymentId);

      if (
        payment.order_id !== orderId ||
        payment.amount !== savedOrder.amount ||
        payment.currency !== 'INR'
      ) {
        return new Response(
          JSON.stringify({ error: 'Payment details do not match the stored order.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Capture authorized payments server-side
      if (payment.status === 'authorized') {
        payment = await captureRazorpayPayment(paymentId, savedOrder.amount, 'INR');
      }

      if (payment.status !== 'captured') {
        return new Response(
          JSON.stringify({ error: 'Payment has not been captured.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Razorpay payment verification error:', error);
      return new Response(
        JSON.stringify({ error: 'Payment is not confirmed yet. No subscription changes were made.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update Firestore - process the payment
    try {
      const now = new Date();
      const orderRef = { collectionPath: 'razorpayOrders', doc: orderId };
      const userRef = { collectionPath: 'users', doc: uid };
      const userDoc = await getFirestoreDoc('users', uid);
      const userData = userDoc.exists ? userDoc.data : {};

      if (savedOrder.purpose === 'trial') {
        // Handle free trial
        const trialStartedAt = now;
        const trialEndsAt = addMonths(trialStartedAt, 1);

        await setFirestoreDoc('users', uid, {
          uid,
          subscriptionStatus: 'trialing',
          plan: 'trial',
          trialRedeemed: true,
          trialStartedAt: trialStartedAt.toISOString(),
          trialEndsAt: trialEndsAt.toISOString(),
          updatedAt: now.toISOString(),
        }, true);

        await setFirestoreDoc('razorpayOrders', orderId, {
          status: 'paid',
          paymentId,
          paidAt: now.toISOString(),
        }, true);

        return new Response(
          JSON.stringify({
            verified: true,
            alreadyProcessed: false,
            purpose: 'trial',
            plan: 'trial',
            trialEndsAt: trialEndsAt.toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Handle purchase (monthly/yearly subscription)
      let periodStart, periodEnd;

      if (userData.subscriptionEndsAt) {
        const prevEndDate = new Date(userData.subscriptionEndsAt);
        periodStart = prevEndDate > now ? prevEndDate : now;
      } else {
        periodStart = now;
      }

      periodEnd = addMonths(periodStart, planInfo.months);

      await setFirestoreDoc('users', uid, {
        uid,
        subscriptionStatus: 'active',
        plan,
        trialRedeemed: true,
        subscriptionStartedAt: userData.subscriptionStartedAt || now.toISOString(),
        subscriptionPeriodStartedAt: periodStart.toISOString(),
        subscriptionEndsAt: periodEnd.toISOString(),
        lastPaymentAt: now.toISOString(),
        lastPaymentAmount: savedOrder.amount,
        lastPaymentCurrency: 'INR',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        updatedAt: now.toISOString(),
      }, true);

      await setFirestoreDoc('razorpayOrders', orderId, {
        status: 'paid',
        paymentId,
        paidAt: now.toISOString(),
      }, true);

      return new Response(
        JSON.stringify({
          verified: true,
          alreadyProcessed: false,
          plan,
          subscriptionEndsAt: periodEnd.toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (error) {
      console.error('Firestore update error:', error);
      return new Response(
        JSON.stringify({ error: 'Payment was verified, but subscription update failed.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('verify-payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * POST /start-trial - Start free trial
 */
async function handleStartTrial(request) {
  try {
    // Get and verify Firebase auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.substring('Bearer '.length);
    const uid = await verifyFirebaseToken(token);

    if (!uid) {
      return new Response(
        JSON.stringify({ error: 'Unauthenticated: Invalid Firebase token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check the user's current status
    const userDoc = await getFirestoreDoc('users', uid);
    const account = userDoc.exists ? userDoc.data : {};

    // If trial already redeemed or active subscription, reject
    if (
      account.trialRedeemed ||
      account.trialStartedAt ||
      account.trialEndsAt ||
      account.subscriptionStatus === 'active' ||
      account.subscriptionStatus === 'subscribed'
    ) {
      return new Response(
        JSON.stringify({ error: 'This account has already used its free trial.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Start the free trial (1 month)
    const startedAt = new Date();
    const endsAt = addMonths(startedAt, 1);

    await setFirestoreDoc('users', uid, {
      uid,
      subscriptionStatus: 'trialing',
      plan: 'trial',
      trialRedeemed: true,
      trialStartedAt: startedAt.toISOString(),
      trialEndsAt: endsAt.toISOString(),
      updatedAt: startedAt.toISOString(),
    }, true);

    return new Response(
      JSON.stringify({
        trialStarted: true,
        trialEndsAt: endsAt.toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('start-trial error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Main fetch handler - routes requests to appropriate endpoints
 */
export default {
  async fetch(request, env, ctx) {
    firebaseApiKey = env.FIREBASE_API_KEY || "";
    RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID || "";
    RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || "";
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Health check
    if (path === '/' || path === '/health') {
      return handleHealth(request);
    }

    // POST /create-order
    if (method === 'POST' && path === '/create-order') {
      return await handleCreateOrder(request);
    }

    // POST /verify-payment
    if (method === 'POST' && path === '/verify-payment') {
      return await handleVerifyPayment(request);
    }

    // POST /start-trial
    if (method === 'POST' && path === '/start-trial') {
      return await handleStartTrial(request);
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  },
};