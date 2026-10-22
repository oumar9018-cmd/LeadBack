import React from 'react'

/**
 * ErrorBoundary — catches any render-time crash in the React tree and shows
 * a friendly fallback instead of a blank white page.
 *
 * Without this, a single uncaught exception anywhere in the logged-in
 * workspace (Dashboard, sub-pages, header widgets) unmounts the entire app
 * and the user sees pure white with no way to recover except clearing
 * site data. With it, the user gets a clear message and a one-tap reload.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Keep the crash visible in the console for diagnostics.
    console.error('Wynback crashed:', error, info)
    // TEMP DIAGNOSTIC: surface the error on the fallback page so a headless
    // test can read the exact message + component stack. Remove after fix.
    this.setState({ info })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, info: null })
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/LeadBack/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: '#2563EB',
              color: '#fff',
              fontWeight: 700,
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            W
          </div>
          <h1 style={{ fontSize: 20, color: '#0f172a', margin: '0 0 8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px' }}>
            Wynback hit an unexpected error. Your data is safe — reloading
            usually fixes it.
          </p>
          {this.state.error && (
            <pre
              data-testid="crash-diagnostic"
              style={{
                fontSize: 11,
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 8,
                padding: 12,
                margin: '0 0 20px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: 260,
                overflow: 'auto',
              }}
            >
              {String(this.state.error.message || this.state.error)}
              {this.state.info ? '\n--- component stack ---' + this.state.info.componentStack : ''}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                background: '#2563EB',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload Wynback
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to homepage
            </button>
          </div>
        </div>
      </div>
    )
  }
}
