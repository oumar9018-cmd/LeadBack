import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
    return {
      customers: users.length,
    }
  }, [users])

  return (
    <div className="ceo-page">
      <div className="ceo-inner">

        <header className="ceo-header">
          <div>
            <span className="ceo-eyebrow">
              WYNBACK CONTROL
            </span>

            <h1>CEO Dashboard</h1>

            <p>
              Business overview, customers, revenue and platform operations.
            </p>
          </div>

          {/* The CEO page has no sidebar: without this link the owner
              lands here after sign-in with no way back to the app. */}
          <Link className="primary-button" to="/app">
            Back to dashboard
          </Link>
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
