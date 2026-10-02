import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Home.jsx'
import './App.css'

const inquiries = [
  { id: 1, name: 'Rahul Sharma', service: 'Full Car Detailing', value: 4500, status: 'followup', date: 'Today', phone: '+91 98765 43210' },
  { id: 2, name: 'Aman Khan', service: 'Ceramic Coating', value: 8000, status: 'replied', date: 'Today', phone: '+91 98111 22334' },
  { id: 3, name: 'Sameer Ali', service: 'Interior Detailing', value: 2500, status: 'followup', date: 'Yesterday', phone: '+91 99001 11223' },
  { id: 4, name: 'Arjun Mehta', service: 'Paint Protection Film', value: 15000, status: 'recovered', date: 'Yesterday', phone: '+91 98222 33445' },
  { id: 5, name: 'Zoya Mir', service: 'Basic Wash', value: 1200, status: 'new', date: 'Yesterday', phone: '+91 97979 44556' },
  { id: 6, name: 'Kabir Singh', service: 'Ceramic Coating', value: 9000, status: 'recovered', date: '2 days ago', phone: '+91 97666 77889' },
  { id: 7, name: 'Rohan Verma', service: 'Full Car Detailing', value: 5000, status: 'lost', date: '2 days ago', phone: '+91 98888 99111' },
  { id: 8, name: 'Aisha Khan', service: 'Interior Detailing', value: 2800, status: 'followup', date: '3 days ago', phone: '+91 97777 66554' },
  { id: 9, name: 'Vikram Joshi', service: 'Paint Correction', value: 6500, status: 'replied', date: '3 days ago', phone: '+91 96666 55443' },
  { id: 10, name: 'Faizan Dar', service: 'Full Car Detailing', value: 4200, status: 'new', date: '4 days ago', phone: '+91 95555 44332' },
  { id: 11, name: 'Neha Kapoor', service: 'Ceramic Coating', value: 8500, status: 'recovered', date: '5 days ago', phone: '+91 94444 33221' },
  { id: 12, name: 'Adil Khan', service: 'Basic Wash', value: 1000, status: 'lost', date: '5 days ago', phone: '+91 93333 22110' },
  { id: 13, name: 'Sahil Bhat', service: 'Interior Detailing', value: 3200, status: 'followup', date: '6 days ago', phone: '+91 92222 11009' },
  { id: 14, name: 'Mehak Sharma', service: 'Paint Correction', value: 6000, status: 'replied', date: '6 days ago', phone: '+91 91111 00998' },
  { id: 15, name: 'Irfan Malik', service: 'Full Car Detailing', value: 4800, status: 'followup', date: '7 days ago', phone: '+91 90000 12345' },
  { id: 16, name: 'Sana Mir', service: 'Ceramic Coating', value: 7500, status: 'recovered', date: '8 days ago', phone: '+91 90000 23456' },
  { id: 17, name: 'Danish Shah', service: 'Basic Wash', value: 1500, status: 'new', date: '9 days ago', phone: '+91 90000 34567' },
  { id: 18, name: 'Areeba Khan', service: 'Interior Detailing', value: 3000, status: 'followup', date: '10 days ago', phone: '+91 90000 45678' },
  { id: 19, name: 'Yasir Bhat', service: 'Paint Protection Film', value: 18000, status: 'lost', date: '11 days ago', phone: '+91 90000 56789' },
  { id: 20, name: 'Hina Dar', service: 'Ceramic Coating', value: 8500, status: 'replied', date: '12 days ago', phone: '+91 90000 67890' },
  { id: 21, name: 'Owais Lone', service: 'Full Car Detailing', value: 5200, status: 'followup', date: '14 days ago', phone: '+91 90000 78901' },
  { id: 22, name: 'Rizwan Ahmad', service: 'Paint Correction', value: 6500, status: 'recovered', date: '16 days ago', phone: '+91 90000 89012' },
  { id: 23, name: 'Maryam Khan', service: 'Basic Wash', value: 1200, status: 'new', date: '18 days ago', phone: '+91 90000 90123' },
  { id: 24, name: 'Bilal Sheikh', service: 'Interior Detailing', value: 2800, status: 'lost', date: '21 days ago', phone: '+91 90000 01234' },
  { id: 25, name: 'Tariq Mir', service: 'Ceramic Coating', value: 9000, status: 'replied', date: '24 days ago', phone: '+91 90000 11223' },
]

const statusLabels = {
  new: 'New',
  followup: 'Follow up',
  replied: 'Replied',
  recovered: 'Recovered',
  lost: 'Lost',
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function Dashboard() {
  const [items, setItems] = useState(inquiries)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddInquiry, setShowAddInquiry] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    service: '',
    value: '',
    status: 'new',
  })

  const [formError, setFormError] = useState('')

  const recovered = items.filter(item => item.status === 'recovered')
  const pending = items.filter(item => item.status === 'followup')
  const replied = items.filter(item => item.status === 'replied')

  const recoveredRevenue = recovered.reduce(
    (sum, item) => sum + item.value,
    0
  )

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter
    const query = search.toLowerCase()

    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.service.toLowerCase().includes(query)

    return matchesFilter && matchesSearch
  })

  function updateStatus(id, status) {
    setItems(current =>
      current.map(item =>
        item.id === id ? { ...item, status } : item
      )
    )
  }

  function handleAddInquiry(event) {
    event.preventDefault()

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.service.trim() ||
      !form.value
    ) {
      setFormError('Please complete all required fields.')
      return
    }

    const newInquiry = {
      id: Date.now(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      service: form.service.trim(),
      value: Number(form.value),
      status: form.status,
      date: 'Just now',
    }

    setItems(current => [newInquiry, ...current])

    setForm({
      name: '',
      phone: '',
      service: '',
      value: '',
      status: 'new',
    })

    setFormError('')
    setShowAddInquiry(false)
    setFilter('all')
    setSearch('')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">L</div>
          <span>LeadBack</span>
        </div>

        <div className="workspace">
          <span className="workspace-label">WORKSPACE</span>
          <strong>AutoDetail Pro</strong>
        </div>

        <nav className="side-nav">
          <a className="active" href="/app">Overview</a>
          <a href="/app">Inquiries</a>
          <a href="/app">Follow-ups</a>
          <a href="/app">Revenue</a>
        </nav>

        <div className="sidebar-bottom">
          <a href="/">← Back to website</a>
          <span>Local demo mode</span>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <span className="app-eyebrow">OVERVIEW</span>
            <h1>Good afternoon, AutoDetail Pro.</h1>
            <p>Here's what is happening with your customer inquiries.</p>
          </div>

          <div className="header-actions">
            <button className="date-button">Last 30 days⌄</button>

            <button
              className="primary-action"
              onClick={() => setShowAddInquiry(true)}
            >
              + Add inquiry
            </button>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Recovered revenue</span>
            <strong>{money(recoveredRevenue)}</strong>
            <small>Revenue from recovered inquiries</small>
          </div>

          <div className="stat-card">
            <span>Pending follow-ups</span>
            <strong>{pending.length}</strong>
            <small>Customers waiting for follow-up</small>
          </div>

          <div className="stat-card">
            <span>Replies</span>
            <strong>{replied.length}</strong>
            <small>Customers who replied</small>
          </div>

          <div className="stat-card">
            <span>Recovery rate</span>
            <strong>
              {items.length
                ? Math.round((recovered.length / items.length) * 100)
                : 0}%
            </strong>
            <small>Inquiries converted to revenue</small>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Customer inquiries</h2>
              <p>Track every opportunity from first contact to recovery.</p>
            </div>

            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search customers..."
            />
          </div>

          <div className="filter-row">
            {['all', 'new', 'followup', 'replied', 'recovered', 'lost'].map(
              status => (
                <button
                  key={status}
                  className={filter === status ? 'filter active' : 'filter'}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'All' : statusLabels[status]}
                </button>
              )
            )}
          </div>

          <div className="inquiry-list">
            {filteredItems.map(item => (
              <div className="inquiry-row" key={item.id}>
                <div className="customer-info">
                  <div className="customer-avatar">
                    {item.name.charAt(0)}
                  </div>

                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.phone}</span>
                  </div>
                </div>

                <div className="inquiry-service">
                  <strong>{item.service}</strong>
                  <span>{item.date}</span>
                </div>

                <div className="inquiry-value">
                  {money(item.value)}
                </div>

                <div>
                  <span className={`status status-${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>

                <div className="row-action">
                  {item.status === 'followup' && (
                    <button onClick={() => updateStatus(item.id, 'replied')}>
                      Mark replied
                    </button>
                  )}

                  {item.status === 'replied' && (
                    <button onClick={() => updateStatus(item.id, 'recovered')}>
                      Mark recovered
                    </button>
                  )}

                  {(item.status === 'new' || item.status === 'lost') && (
                    <button onClick={() => updateStatus(item.id, 'followup')}>
                      Follow up
                    </button>
                  )}

                  {item.status === 'recovered' && (
                    <span className="completed">Completed</span>
                  )}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="empty-state">
                No inquiries found.
              </div>
            )}
          </div>
        </section>

        <section className="bottom-grid">
          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div>
                <h2>Follow-up queue</h2>
                <p>Customers who need attention.</p>
              </div>
            </div>

            {pending.slice(0, 5).map(item => (
              <div className="queue-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.service}</span>
                </div>
                <strong>{money(item.value)}</strong>
              </div>
            ))}
          </div>

          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div>
                <h2>Revenue summary</h2>
                <p>Recovered customer value.</p>
              </div>
            </div>

            <div className="revenue-highlight">
              <span>Total recovered</span>
              <strong>{money(recoveredRevenue)}</strong>
            </div>

            <div className="revenue-line">
              <span>Recovered inquiries</span>
              <strong>{recovered.length}</strong>
            </div>

            <div className="revenue-line">
              <span>Average recovery</span>
              <strong>
                {recovered.length
                  ? money(Math.round(recoveredRevenue / recovered.length))
                  : money(0)}
              </strong>
            </div>
          </div>
        </section>

        {showAddInquiry && (
          <div
            className="modal-backdrop"
            onMouseDown={event => {
              if (event.target === event.currentTarget) {
                setShowAddInquiry(false)
              }
            }}
          >
            <div className="inquiry-modal">
              <div className="modal-header">
                <div>
                  <span className="app-eyebrow">NEW CUSTOMER</span>
                  <h2>Add inquiry</h2>
                  <p>Capture a customer before the opportunity disappears.</p>
                </div>

                <button
                  className="modal-close"
                  onClick={() => setShowAddInquiry(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddInquiry}>
                <div className="form-grid">
                  <label>
                    Customer name
                    <input
                      value={form.name}
                      onChange={e =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="e.g. Rahul Sharma"
                    />
                  </label>

                  <label>
                    Phone
                    <input
                      value={form.phone}
                      onChange={e =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                    />
                  </label>

                  <label className="full-field">
                    Service
                    <input
                      value={form.service}
                      onChange={e =>
                        setForm({ ...form, service: e.target.value })
                      }
                      placeholder="e.g. Ceramic Coating"
                    />
                  </label>

                  <label>
                    Estimated value
                    <div className="money-input">
                      <span>₹</span>
                      <input
                        type="number"
                        min="0"
                        value={form.value}
                        onChange={e =>
                          setForm({ ...form, value: e.target.value })
                        }
                        placeholder="5000"
                      />
                    </div>
                  </label>

                  <label>
                    Initial status
                    <select
                      value={form.status}
                      onChange={e =>
                        setForm({ ...form, status: e.target.value })
                      }
                    >
                      <option value="new">New</option>
                      <option value="followup">Follow up</option>
                      <option value="replied">Replied</option>
                    </select>
                  </label>
                </div>

                {formError && (
                  <div className="form-error">{formError}</div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setShowAddInquiry(false)}
                  >
                    Cancel
                  </button>

                  <button type="submit" className="save-button">
                    Add inquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer className="app-footer">
          LeadBack local demo · Firebase is not connected yet.
        </footer>
      </main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
