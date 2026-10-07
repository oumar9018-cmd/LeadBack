const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'

let checkoutScriptPromise

function loadRazorpayCheckout() {
  if (typeof window.Razorpay === 'function') {
    return Promise.resolve()
  }

  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = CHECKOUT_SCRIPT_URL
      script.async = true
      script.dataset.razorpayCheckout = 'true'
      script.onload = () => {
        if (typeof window.Razorpay === 'function') {
          resolve()
        } else {
          checkoutScriptPromise = null
          reject(new Error('Razorpay Checkout could not be initialized.'))
        }
      }
      script.onerror = () => {
        checkoutScriptPromise = null
        reject(new Error('Unable to load Razorpay Checkout. Check your internet connection.'))
      }
      document.head.appendChild(script)
    })
  }

  return checkoutScriptPromise
}

/**
 * Fetches from the Cloudflare Worker Razorpay backend.
 * The worker expects Authorization: Bearer <Firebase ID token> header.
 */
async function callWorkerEndpoint(path, data = {}) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!keyId) {
    throw new Error('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in the environment.')
  }

  // Get the authenticated user - try Firebase Auth first
  let uid = null
  const firebase = window.firebase
  if (firebase?.auth?.()) {
    const user = firebase.auth().currentUser
    if (user?.uid) {
      uid = user.uid
    }
  }
  // If no current user, we'll rely on the worker to verify the token

  const url = `https://leadback-payment.mohiqbal6864.workers.dev/${path}`

  // Prepare the request with the user's Firebase token
  const token = firebase?.auth?.()?.currentUser?.getIdToken ? await firebase.auth().currentUser.getIdToken() : null

  console.log('[LeadBack Auth]', {
    hasToken: Boolean(token),
    tokenLength: token ? token.length : 0,
    uid,
    hasCurrentUser: Boolean(firebase?.auth?.()?.currentUser)
  })

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // TEMP DEBUG: ask Worker to verify the current Firebase ID token.
  if (path === 'start-trial') {
    try {
      const debugResponse = await fetch(
        'https://leadback-payment.mohiqbal6864.workers.dev/debug-auth',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      )

      const debugData = await debugResponse.json()
      console.log('[LeadBack Firebase Debug]', debugData)
      alert(`Firebase Debug: ${JSON.stringify(debugData)}`)
    } catch (debugError) {
      console.error('[LeadBack Firebase Debug Error]', debugError)
      alert(`Firebase Debug Error: ${debugError.message}`)
    }
  }


  const body = JSON.stringify({ ...data, uid })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Worker error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/** Same as before: load the Razorpay checkout script */
function cancellationError() {
  const error = new Error('Payment was cancelled. No subscription changes were made.')
  error.code = 'payment/cancelled'
  return error
}

/**
 * Starts a server-created Razorpay order, opens Checkout, and only resolves
 * after the Cloudflare Worker verifies the payment with Razorpay.
 */
export async function launchRazorpayCheckout({ plan, user, purpose = 'purchase' }) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID

  if (!keyId) {
    throw new Error('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in the environment.')
  }

  // Get the authenticated user
  const firebase = window.firebase
  const authenticatedUser = user || firebase?.auth?.()?.currentUser

  if (!authenticatedUser?.uid) {
    throw new Error('Please sign in before starting checkout.')
  }

  if (!['monthly', 'yearly'].includes(plan)) {
    throw new Error('Please select a valid subscription plan.')
  }

  if (!['purchase', 'trial'].includes(purpose)) {
    throw new Error('Please select a valid checkout purpose.')
  }

  // Call the worker to create the order
  const { data: order } = await callWorkerEndpoint('create-order', { plan, purpose })

  if (!order?.orderId || !Number.isInteger(Number(order.amount)) || order.currency !== 'INR') {
    throw new Error('The server returned an invalid Razorpay order.')
  }

  await loadRazorpayCheckout()

  return new Promise((resolve, reject) => {
    let settled = false
    let verificationStarted = false

    const settle = (callback, value) => {
      if (settled) return
      settled = true
      callback(value)
    }

    const checkout = new window.Razorpay({
      key: keyId,
      order_id: order.orderId,
      amount: Number(order.amount),
      currency: order.currency,
      name: 'LeadBack',
      description: purpose === 'trial'
        ? 'LeadBack trial checkout test'
        : plan === 'yearly'
          ? 'LeadBack Pro — annual plan'
          : 'LeadBack Pro — monthly plan',
      prefill: {
        name: authenticatedUser.displayName || '',
        email: authenticatedUser.email || '',
      },
      notes: { plan },
      handler: async response => {
        verificationStarted = true

        try {
          const { data } = await callWorkerEndpoint('verify-payment', {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          })

          if (!data?.verified) {
            throw new Error('Payment could not be verified. No subscription changes were made.')
          }

          settle(resolve, data)
        } catch (error) {
          settle(reject, error)
        }
      },
      modal: {
        ondismiss: () => {
          if (!verificationStarted) {
            settle(reject, cancellationError())
          }
        },
      },
    })

    checkout.on('payment.failed', response => {
      const message = response?.error?.description || 'Razorpay could not complete the payment.'
      settle(reject, new Error(message))
    })

    try {
      checkout.open()
    } catch (error) {
      settle(reject, error)
    }
  })
}

export async function activateFreeTrial(user) {
  const authenticatedUser = user || window.firebase?.auth?.()?.currentUser

  if (!authenticatedUser?.uid) {
    throw new Error('Please sign in before activating your trial.')
  }

  const { data } = await callWorkerEndpoint('start-trial', {})

  if (!data?.trialStarted) {
    throw new Error('The free trial could not be activated.')
  }

  return data
}