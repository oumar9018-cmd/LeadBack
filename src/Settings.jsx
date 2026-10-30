import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TeamMembers from './components/TeamMembers.jsx'
import { CURRENCIES, defaultCurrencyForBrowser } from './utils/money.js'

const defaultSettings = {
  businessName: '',
  phone: '',
  email: '',
  // New workspaces default to the browser-timezone currency; a saved
  // currency always wins when the settings doc loads.
  currency: defaultCurrencyForBrowser(),
  timezone: 'Asia/Kolkata',
  followupReminder: '1',
  services: '',
  hours: '',
  googleReviewLink: '',
}

/** Same slug algorithm as the dashboard's businessSlug. */
function slugify(name) {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

      // Publish the public booking page record. The booking page reads
      // `businesses` by slug; nothing else in the app creates this doc,
      // which is why every booking link used to land on "not found".
      // This write needs the matching firestore.rules entry (deployed by
      // the owner via Firebase Console); if the rules are not live yet
      // this fails quietly and settings still save.
      const slug = slugify(settings.businessName)
      if (slug) {
        try {
          await db.collection('businesses').doc(user.uid).set({
            ownerUid: user.uid,
            slug,
            name: settings.businessName.trim(),
            services: (settings.services || '').trim(),
            hours: (settings.hours || '').trim(),
            updatedAt: new Date().toISOString(),
          }, { merge: true })
        } catch (businessError) {
          console.error('Booking page publish failed (rules may not be deployed yet):', businessError)
        }
      }

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
            <p>Manage your business details and Wynback preferences.</p>
          </div>

          <button
            className="primary-button"
            onClick={() => navigate('/app/inquiries')}
          >
            Back to inquiries
          </button>
        </header>

        <form onSubmit={saveSettings}>

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <span className="settings-label">BUSINESS</span>
                <h2>Business profile</h2>
                <p>These details identify your Wynback workspace.</p>
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
                <span className="settings-label">BOOKING PAGE</span>
                <h2>Public booking link</h2>
                <p>Customers open this link from your WhatsApp messages and request a preferred day and time. Saving publishes it — the business confirms each request on WhatsApp.</p>
              </div>
            </div>

            <div className="settings-grid">

              <label className="settings-full">
                <span>Services (shown on the booking page)</span>
                <input
                  value={settings.services}
                  onChange={e =>
                    update('services', e.target.value)
                  }
                  placeholder="e.g. Haircut, Colour, Facial"
                />
              </label>

              <label className="settings-full">
                <span>Working hours (shown on the booking page)</span>
                <input
                  value={settings.hours}
                  onChange={e =>
                    update('hours', e.target.value)
                  }
                  placeholder="e.g. Tue–Sun, 10 AM – 8 PM"
                />
              </label>

              {slugify(settings.businessName) ? (
                <p className="settings-full">
                  Your booking link: <strong>{`${typeof window !== 'undefined' ? window.location.origin : ''}/b/${slugify(settings.businessName)}`}</strong>
                </p>
              ) : (
                <p className="settings-full">Add a business name above to get your booking link.</p>
              )}

            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div>
                <span className="settings-label">REVIEWS</span>
                <h2>Google review link</h2>
                <p>Paste your Google review link here — it is used in the one-tap review message. Leave it blank and the button stays hidden.</p>
              </div>
            </div>

            <div className="settings-grid">

              <label className="settings-full">
                <span>Google review link</span>
                <input
                  value={settings.googleReviewLink}
                  onChange={e =>
                    update('googleReviewLink', e.target.value)
                  }
                  placeholder="https://g.page/r/.../review"
                />
              </label>

              <p className="settings-full">Recovered customers get a one-tap "Ask for Google review" button in their inquiry details. Lost customers never get a review ask — they get a private recovery draft instead.</p>

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
                  {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
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
              <h2>Account</h2>
              <p>Manage your Wynback account.</p>
            </div>
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

        {/* Team seats (batch 3): managed outside the settings form
            because invites write to their own collections. */}
        <TeamMembers />

      </div>
    </div>
  )
}
