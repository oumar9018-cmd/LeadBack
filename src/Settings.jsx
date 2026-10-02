import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const defaultSettings = {
  businessName: 'AutoDetail Pro',
  phone: '',
  email: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  followupReminder: '1',
}

export default function Settings() {
  const navigate = useNavigate()

  const [settings, setSettings] = useState(defaultSettings)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()

    if (!auth || !db) return

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        setSettings(defaultSettings)
        setSettingsLoaded(false)
        return
      }

      try {
        const snapshot = await db
          .collection('users')
          .doc(user.uid)
          .collection('settings')
          .doc('workspace')
          .get()

        if (snapshot.exists) {
          setSettings({
            ...defaultSettings,
            ...snapshot.data(),
          })
        } else {
          setSettings(defaultSettings)
        }
      } catch (error) {
        console.error('Settings load failed:', error)
        setSettings(defaultSettings)
      } finally {
        setSettingsLoaded(true)
      }
    })

    return unsubscribe
  }, [])

  const [saved, setSaved] = useState(false)

  function update(field, value) {
    setSettings(current => ({
      ...current,
      [field]: value,
    }))
    setSaved(false)
  }

  async function saveSettings(event) {
    event.preventDefault()

    const auth = window.firebase?.auth?.()
    const db = window.firebase?.firestore?.()
    const user = auth?.currentUser

    if (!user || !db || !settingsLoaded) {
      return
    }

    try {
      await db
        .collection('users')
        .doc(user.uid)
        .collection('settings')
        .doc('workspace')
        .set(settings, { merge: true })

      setSaved(true)
    } catch (error) {
      console.error('Settings save failed:', error)
    }
  }

  return (
    <div className="settings-page">
      <div className="settings-inner">

        <header className="settings-header">
          <div>
            <span className="app-eyebrow">SETTINGS</span>
            <h1>Business settings</h1>
            <p>Manage your business details and LeadBack preferences.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app')}
          >
            Back to dashboard
          </button>
        </header>

        <form onSubmit={saveSettings}>

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <span className="settings-label">BUSINESS</span>
                <h2>Business profile</h2>
                <p>These details identify your LeadBack workspace.</p>
              </div>
            </div>

            <div className="settings-grid">

              <label>
                <span>Business name</span>
                <input
                  value={settings.businessName}
                  onChange={e =>
                    update('businessName', e.target.value)
                  }
                  placeholder="Your business name"
                />
              </label>

              <label>
                <span>Phone</span>
                <input
                  value={settings.phone}
                  onChange={e =>
                    update('phone', e.target.value)
                  }
                  placeholder="+91 98765 43210"
                />
              </label>

              <label className="settings-full">
                <span>Business email</span>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e =>
                    update('email', e.target.value)
                  }
                  placeholder="business@example.com"
                />
              </label>

            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <span className="settings-label">PREFERENCES</span>
                <h2>Workspace preferences</h2>
                <p>Set the defaults used by your workspace.</p>
              </div>
            </div>

            <div className="settings-grid">

              <label>
                <span>Currency</span>
                <select
                  value={settings.currency}
                  onChange={e =>
                    update('currency', e.target.value)
                  }
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </label>

              <label>
                <span>Timezone</span>
                <select
                  value={settings.timezone}
                  onChange={e =>
                    update('timezone', e.target.value)
                  }
                >
                  <option value="Asia/Kolkata">India — Kolkata</option>
                  <option value="Asia/Dubai">UAE — Dubai</option>
                  <option value="Europe/London">UK — London</option>
                  <option value="America/New_York">US — New York</option>
                </select>
              </label>

              <label>
                <span>Follow-up reminder</span>
                <select
                  value={settings.followupReminder}
                  onChange={e =>
                    update('followupReminder', e.target.value)
                  }
                >
                  <option value="0">At scheduled time</option>
                  <option value="1">1 hour before</option>
                  <option value="24">1 day before</option>
                </select>
              </label>

            </div>
          </section>

          <section className="settings-card settings-account-card">
            <div>
              <span className="settings-label">ACCOUNT</span>
              <h2>Account & subscription</h2>
              <p>Manage your LeadBack account and current license.</p>
            </div>

            <button
              type="button"
              className="settings-link-button"
              onClick={() => navigate('/app/billing')}
            >
              Open billing →
            </button>
          </section>

          <div className="settings-save-row">
            {saved && (
              <span className="settings-saved">
                ✓ Settings saved
              </span>
            )}

            <button
              type="submit"
              className="settings-save-button"
            >
              Save settings
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
