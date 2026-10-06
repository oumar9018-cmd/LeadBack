const crypto = require('node:crypto')
const { getApps, initializeApp } = require('firebase-admin/app')
const { FieldValue, Timestamp, getFirestore } = require('firebase-admin/firestore')
const { defineSecret, defineString } = require('firebase-functions/params')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const logger = require('firebase-functions/logger')

if (!getApps().length) {
  initializeApp()
}

const db = getFirestore()
const REGION = 'asia-south1'
const RAZORPAY_API = 'https://api.razorpay.com/v1'
const RAZORPAY_KEY_ID = defineString('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')

// Never accept an amount from the browser. The plan-to-price mapping is the
// source of truth for every order created by this function.
const PLANS = Object.freeze({
  monthly: { amount: 49900, months: 1 },
  yearly: { amount: 499000, months: 12 },
})

function requireAuthenticatedUid(request) {
  const uid = request.auth?.uid

  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in before starting checkout.')
  }

  return uid
}

function getRazorpayAuthHeader() {
  const keyId = RAZORPAY_KEY_ID.value()
  const keySecret = RAZORPAY_KEY_SECRET.value()

  if (!keyId || !keySecret) {
    throw new Error('Razorpay server credentials are not configured.')
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}

async function razorpayRequest(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    method,
    headers: {
      Authorization: getRazorpayAuthHeader(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    logger.error('Razorpay API request failed', {
      path,
      status: response.status,
      code: result?.error?.code,
    })
    throw new Error('Razorpay API request failed.')
  }

  return result
}

function isValidSignature(signature, orderId, paymentId) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false
  }

  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
    .update(`${orderId}|${paymentId}`)
    .digest()
  const supplied = Buffer.from(signature, 'hex')

  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected)
}

function dateFromFirestore(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addMonths(date, months) {
  const result = new Date(date)
  const originalDay = result.getDate()

  result.setMonth(result.getMonth() + months)
  if (result.getDate() !== originalDay) {
    result.setDate(0)
  }

  return result
}

exports.startFreeTrial = onCall(
  { region: REGION },
  async request => {
    const uid = requireAuthenticatedUid(request)
    const userRef = db.collection('users').doc(uid)

    try {
      return await db.runTransaction(async transaction => {
        const snapshot = await transaction.get(userRef)
        const account = snapshot.exists ? snapshot.data() : {}

        if (
          account.trialRedeemed ||
          account.trialStartedAt ||
          account.trialEndsAt ||
          account.subscriptionStatus === 'active' ||
          account.subscriptionStatus === 'subscribed'
        ) {
          throw new HttpsError('failed-precondition', 'This account has already used its free trial.')
        }

        const startedAt = new Date()
        const endsAt = addMonths(startedAt, 1)
        const startedTimestamp = Timestamp.fromDate(startedAt)
        const endsTimestamp = Timestamp.fromDate(endsAt)

        transaction.set(userRef, {
          uid,
          subscriptionStatus: 'trialing',
          plan: 'trial',
          trialRedeemed: true,
          trialStartedAt: startedTimestamp,
          trialEndsAt: endsTimestamp,
          ...(snapshot.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })

        return {
          trialStarted: true,
          trialEndsAt: endsAt.toISOString(),
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) throw error

      logger.error('Free trial activation failed', { uid, error })
      throw new HttpsError('internal', 'Unable to activate the free trial. Please try again.')
    }
  }
)

exports.createRazorpayOrder = onCall(
  {
    region: REGION,
    secrets: [RAZORPAY_KEY_SECRET],
  },
  async request => {
    const uid = requireAuthenticatedUid(request)
    const plan = request.data?.plan
    const purpose = request.data?.purpose || 'purchase'
    const selectedPlan = Object.hasOwn(PLANS, plan) ? PLANS[plan] : null

    if (!selectedPlan || !['purchase', 'trial'].includes(purpose)) {
      throw new HttpsError('invalid-argument', 'Select a valid plan.')
    }

    if (purpose === 'trial') {
      if (plan !== 'monthly' || !RAZORPAY_KEY_ID.value().startsWith('rzp_test_')) {
        throw new HttpsError('failed-precondition', 'Trial checkout is only enabled with a Razorpay test key.')
      }

      const accountSnapshot = await db.collection('users').doc(uid).get()
      const account = accountSnapshot.exists ? accountSnapshot.data() : {}

      if (
        account.trialRedeemed ||
        account.trialStartedAt ||
        account.trialEndsAt ||
        account.subscriptionStatus === 'active' ||
        account.subscriptionStatus === 'subscribed'
      ) {
        throw new HttpsError('failed-precondition', 'This account has already used its free trial.')
      }
    }

    const receipt = `lb_${uid.slice(0, 12)}_${Date.now()}`
    let order

    try {
      order = await razorpayRequest('/orders', {
        method: 'POST',
        body: {
          amount: selectedPlan.amount,
          currency: 'INR',
          receipt,
          notes: { uid, plan, purpose },
        },
      })
    } catch (error) {
      logger.error('Razorpay order creation failed', { uid, plan, error })
      throw new HttpsError('unavailable', 'Unable to start Razorpay checkout. Please try again.')
    }

    if (!order?.id || order.amount !== selectedPlan.amount || order.currency !== 'INR') {
      logger.error('Razorpay returned an unexpected order', { uid, plan, orderId: order?.id })
      throw new HttpsError('internal', 'Unable to start Razorpay checkout. Please try again.')
    }

    try {
      await db.collection('razorpayOrders').doc(order.id).create({
        uid,
        plan,
        purpose,
        amount: selectedPlan.amount,
        currency: 'INR',
        status: 'created',
        createdAt: FieldValue.serverTimestamp(),
      })
    } catch (error) {
      logger.error('Razorpay order record could not be saved', { uid, orderId: order.id, error })
      throw new HttpsError('internal', 'Unable to prepare checkout. Please try again.')
    }

    return {
      orderId: order.id,
      amount: selectedPlan.amount,
      currency: 'INR',
      purpose,
    }
  }
)

exports.verifyRazorpayPayment = onCall(
  {
    region: REGION,
    secrets: [RAZORPAY_KEY_SECRET],
  },
  async request => {
    const uid = requireAuthenticatedUid(request)
    const { orderId, paymentId, signature } = request.data || {}

    if (
      typeof orderId !== 'string' ||
      typeof paymentId !== 'string' ||
      typeof signature !== 'string' ||
      orderId.length > 100 ||
      paymentId.length > 100
    ) {
      throw new HttpsError('invalid-argument', 'The payment details are incomplete.')
    }

    let orderSnapshot

    try {
      orderSnapshot = await db.collection('razorpayOrders').doc(orderId).get()
    } catch (error) {
      logger.error('Razorpay order lookup failed', { uid, orderId, error })
      throw new HttpsError('unavailable', 'Unable to verify this payment right now.')
    }

    if (!orderSnapshot.exists) {
      throw new HttpsError('not-found', 'This Razorpay order was not found.')
    }

    const savedOrder = orderSnapshot.data()

    if (savedOrder.uid !== uid) {
      throw new HttpsError('permission-denied', 'This payment does not belong to your account.')
    }

    const isTrialOrder = savedOrder.purpose === 'trial'
    const validPurpose = savedOrder.purpose === 'purchase' || isTrialOrder
    const validTrialOrder =
      !isTrialOrder ||
      (savedOrder.plan === 'monthly' && RAZORPAY_KEY_ID.value().startsWith('rzp_test_'))
    const expectedAmount = Object.hasOwn(PLANS, savedOrder.plan)
      ? PLANS[savedOrder.plan].amount
      : null

    if (
      !validPurpose ||
      !validTrialOrder ||
      expectedAmount === null ||
      savedOrder.amount !== expectedAmount
    ) {
      logger.error('Stored Razorpay order has invalid plan details', { uid, orderId })
      throw new HttpsError('failed-precondition', 'This payment order is invalid.')
    }

    if (!isValidSignature(signature, orderId, paymentId)) {
      throw new HttpsError('permission-denied', 'Razorpay could not verify this payment.')
    }

    let payment

    try {
      payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`)

      if (
        payment.order_id !== orderId ||
        payment.amount !== savedOrder.amount ||
        payment.currency !== 'INR'
      ) {
        throw new Error('Payment details do not match the stored order.')
      }

      // Capture authorized payments server-side before granting account access.
      if (payment.status === 'authorized') {
        payment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}/capture`, {
          method: 'POST',
          body: { amount: savedOrder.amount, currency: 'INR' },
        })
      }

      if (payment.status !== 'captured') {
        throw new Error('Payment has not been captured.')
      }
    } catch (error) {
      logger.error('Razorpay payment verification failed', { uid, orderId, paymentId, error })
      throw new HttpsError('failed-precondition', 'Payment is not confirmed yet. No subscription changes were made.')
    }

    const orderRef = db.collection('razorpayOrders').doc(orderId)
    const userRef = db.collection('users').doc(uid)

    try {
      return await db.runTransaction(async transaction => {
        const currentOrderSnapshot = await transaction.get(orderRef)

        if (!currentOrderSnapshot.exists) {
          throw new HttpsError('not-found', 'This Razorpay order was not found.')
        }

        const currentOrder = currentOrderSnapshot.data()

        if (currentOrder.uid !== uid) {
          throw new HttpsError('permission-denied', 'This payment does not belong to your account.')
        }

        if (currentOrder.status === 'paid') {
          if (currentOrder.paymentId !== paymentId) {
            throw new HttpsError('already-exists', 'This order has already been used.')
          }

          const currentUserSnapshot = await transaction.get(userRef)
          const currentUserData = currentUserSnapshot.data() || {}
          const accessEndsAt = dateFromFirestore(
            currentOrder.purpose === 'trial'
              ? currentUserData.trialEndsAt
              : currentUserData.subscriptionEndsAt
          )

          return {
            verified: true,
            alreadyProcessed: true,
            plan: currentOrder.purpose === 'trial' ? 'trial' : currentOrder.plan,
            purpose: currentOrder.purpose,
            subscriptionEndsAt: accessEndsAt?.toISOString() || null,
          }
        }

        if (currentOrder.status !== 'created') {
          throw new HttpsError('failed-precondition', 'This Razorpay order cannot be processed.')
        }

        const userSnapshot = await transaction.get(userRef)
        const userData = userSnapshot.exists ? userSnapshot.data() : {}

        if (currentOrder.purpose === 'trial') {
          if (
            userData.trialRedeemed ||
            userData.trialStartedAt ||
            userData.trialEndsAt ||
            userData.subscriptionStatus === 'active' ||
            userData.subscriptionStatus === 'subscribed'
          ) {
            throw new HttpsError('failed-precondition', 'This account has already used its free trial.')
          }

          const trialStartedAt = new Date()
          const trialEndsAt = addMonths(trialStartedAt, 1)
          const trialStartedTimestamp = Timestamp.fromDate(trialStartedAt)
          const trialEndsTimestamp = Timestamp.fromDate(trialEndsAt)

          transaction.set(userRef, {
            uid,
            subscriptionStatus: 'trialing',
            plan: 'trial',
            trialRedeemed: true,
            trialStartedAt: trialStartedTimestamp,
            trialEndsAt: trialEndsTimestamp,
            ...(userSnapshot.exists
              ? {}
              : { createdAt: FieldValue.serverTimestamp() }),
            updatedAt: FieldValue.serverTimestamp(),
          }, { merge: true })

          transaction.update(orderRef, {
            status: 'paid',
            paymentId,
            paidAt: FieldValue.serverTimestamp(),
          })

          return {
            verified: true,
            alreadyProcessed: false,
            purpose: 'trial',
            plan: 'trial',
            trialEndsAt: trialEndsAt.toISOString(),
          }
        }

        const now = new Date()
        const previousEnd = dateFromFirestore(userData.subscriptionEndsAt)
        const periodStart = previousEnd && previousEnd > now ? previousEnd : now
        const periodEnd = addMonths(periodStart, PLANS[currentOrder.plan].months)
        const periodStartTimestamp = Timestamp.fromDate(periodStart)
        const periodEndTimestamp = Timestamp.fromDate(periodEnd)

        transaction.set(userRef, {
          uid,
          subscriptionStatus: 'active',
          plan: currentOrder.plan,
          trialRedeemed: true,
          subscriptionStartedAt: userData.subscriptionStartedAt || Timestamp.fromDate(now),
          subscriptionPeriodStartedAt: periodStartTimestamp,
          subscriptionEndsAt: periodEndTimestamp,
          lastPaymentAt: Timestamp.fromDate(now),
          lastPaymentAmount: currentOrder.amount,
          lastPaymentCurrency: currentOrder.currency,
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          ...(userSnapshot.exists
            ? {}
            : { createdAt: FieldValue.serverTimestamp() }),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true })

        transaction.update(orderRef, {
          status: 'paid',
          paymentId,
          paidAt: FieldValue.serverTimestamp(),
        })

        return {
          verified: true,
          alreadyProcessed: false,
          plan: currentOrder.plan,
          subscriptionEndsAt: periodEnd.toISOString(),
        }
      })
    } catch (error) {
      if (error instanceof HttpsError) throw error

      logger.error('Verified payment could not update Firestore', { uid, orderId, paymentId, error })
      throw new HttpsError('internal', 'Payment was verified, but the subscription update failed. Please contact support.')
    }
  }
)
