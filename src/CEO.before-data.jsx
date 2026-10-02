import React, { useEffect, useMemo, useState } from 'react'
import './CEO.css'

export default function CEO() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) {
      setError('Firebase is not available.')
      setLoading(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setError('CEO session not found.')
        setLoading(false)
        return
      }

      try {
        const snapshot = await db
          .collection('users')
          .get()

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        setUsers(data)
      } catch (err) {
        console.error('CEO users load failed:', err)
        setError('Unable to load business data.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const stats = useMemo(() => {
    const customers = users.filter(user => user.role !== 'ceo')

    const trials = customers.filter(
      user => user.subscriptionStatus === 'trialing'
    )

    const subscriptions = customers.filter(
      user =>
        user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'subscribed'
    )

    return {
      customers: customers.length,
      trials: trials.length,
      subscriptions: subscriptions.length,
    }
  }, [users])

  return (
    <div className="ceo-page">
      <div className="ceo-inner">
        <header className="ceo-header">
          <div>
            <span className="ceo-eyebrow">LEADBACK CONTROL</span>
            <h1>CEO Dashboard</h1>
            <p>
              Business overview, customers, revenue and platform operations.
            </p>
          </div>
        </header>

        {error && (
          <div className="ceo-error">
            {error}
          </div>
        )}

        <section className="ceo-grid">
          <div className="ceo-card">
            <span>Customers</span>
            <strong>
              {loading ? '…' : stats.customers}
            </strong>
            <small>Registered customer accounts</small>
          </div>

          <div className="ceo-card">
            <span>Revenue</span>
            <strong>₹—</strong>
            <small>Billing integration pending</small>
          </div>

          <div className="ceo-card">
            <span>Trials</span>
            <strong>
              {loading ? '…' : stats.trials}
            </strong>
            <small>Active trials</small>
          </div>

          <div className="ceo-card">
            <span>Subscriptions</span>
            <strong>
              {loading ? '…' : stats.subscriptions}
            </strong>
            <small>Active subscriptions</small>
          </div>
        </section>

        <section className="ceo-panel">
          <span className="ceo-eyebrow">CUSTOMERS</span>
          <h2>Recent accounts</h2>

          {loading ? (
            <p>Loading customer data…</p>
          ) : users.filter(user => user.role !== 'ceo').length === 0 ? (
            <div className="ceo-empty">
              <strong>No customers yet</strong>
              <span>
                Customer accounts will appear here after signup.
              </span>
            </div>
          ) : (
            <div className="ceo-users">
              {users
                .filter(user => user.role !== 'ceo')
                .slice(0, 10)
                .map(user => (
                  <div className="ceo-user-row" key={user.id}>
                    <div className="ceo-user-main">
                      <strong>
                        {user.name || 'Unnamed customer'}
                      </strong>
                      <span>
                        {user.email || 'No email'}
                      </span>
                    </div>

                    <span className="ceo-user-role">
                      {user.role || 'customer'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
