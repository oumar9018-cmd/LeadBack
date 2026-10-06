const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
const FUNCTIONS_REGION = import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'asia-south1'

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

function getFirebaseFunctions() {
  const firebase = window.firebase

  if (!firebase?.functions || !firebase?.auth) {
    throw new Error('Firebase payment services are not available.')
  }

  return firebase.app().functions(FUNCTIONS_REGION)
}

function cancellationError() {
  const error = new Error('Payment was cancelled. No subscription changes were made.')
  error.code = 'payment/cancelled'
  return error
}

/**
 * Starts a server-created Razorpay order, opens Checkout, and only resolves
 * after the Firebase callable has verified the payment with Razorpay.
 */
export async function launchRazorpayCheckout({ plan, user, purpose = 'purchase' }) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID

  if (!keyId) {
    throw new Error('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in the environment.')
  }

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

  const functions = getFirebaseFunctions()
  const createOrder = functions.httpsCallable('createRazorpayOrder')
  const verifyPayment = functions.httpsCallable('verifyRazorpayPayment')
  const { data: order } = await createOrder({ plan, purpose })

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
          const { data } = await verifyPayment({
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

  const activateTrial = getFirebaseFunctions().httpsCallable('startFreeTrial')
  const { data } = await activateTrial({})

  if (!data?.trialStarted) {
    throw new Error('The free trial could not be activated.')
  }

  return data
}
