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

        const customerUsers = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(item => item.role !== 'ceo')

        setUsers(customerUsers)
      } catch (err) {
        console.error('CEO customer load failed:', err)
        setError('Unable to load customer data.')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const stats = useMemo(() => {
    const trials = users.filter(
      user => user.subscriptionStatus === 'trialing'
    ).length

    const subscriptions = users.filter(
      user =>
        user.subscriptionStatus === 'active' ||
        user.subscriptionStatus === 'subscribed'
    ).length

    return {
      customers: users.length,
      trials,
      subscriptions,
    }
  }, [users])

  return (
    <div className="ceo-page">
      <div className="ceo-inner">

        <header className="ceo-header">
          <div>
            <span className="ceo-eyebrow">
              LEADBACK CONTROL
            </span>

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

            <small>
              Registered customer accounts
            </small>
          </div>

          <div className="ceo-card">
            <span>Revenue</span>

            <strong>₹—</strong>

            <small>
              Awaiting billing integration
            </small>
          </div>

          <div className="ceo-card">
            <span>Trials</span>

            <strong>
              {loading ? '…' : stats.trials}
            </strong>

            <small>
              Active trials
            </small>
          </div>

          <div className="ceo-card">
            <span>Subscriptions</span>

            <strong>
              {loading ? '…' : stats.subscriptions}
            </strong>

            <small>
              Active subscriptions
            </small>
          </div>

        </section>

        <section className="ceo-panel">

          <span className="ceo-eyebrow">
            CUSTOMERS
          </span>

          <h2>Customer accounts</h2>

          {loading ? (
            <p>Loading customer data…</p>
          ) : users.length === 0 ? (
            <div className="ceo-empty">
              <strong>No customers yet</strong>

              <span>
                Customer accounts will appear here after signup.
              </span>
            </div>
          ) : (
            <div className="ceo-users">

              {users.slice(0, 10).map(user => (
                <div
                  className="ceo-user-row"
                  key={user.id}
                >
                  <div className="ceo-user-main">

                    <strong>
                      {user.name || 'Unnamed customer'}
                    </strong>

                    <span>
                      {user.email || 'No email'}
                    </span>

                  </div>

                  <span className="ceo-user-role">
                    {user.subscriptionStatus || 'customer'}
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
