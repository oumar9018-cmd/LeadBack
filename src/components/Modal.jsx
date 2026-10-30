import React, { useEffect, useState } from 'react'

/**
 * Frosted modal shell with buttery open/close animation.
 * Purely visual: delays unmount by the close animation, calls onClose
 * on backdrop click exactly like the previous inline markup did.
 *
 * Extracted from App.jsx (batch 2, 2026-10-30) so the Inquiries page can
 * reuse the same shell for its Add-inquiry modal after the Overview
 * dashboard page was removed — the modal itself is unchanged.
 */
export default function Modal({ open, onClose, wide = false, children }) {
  const [rendered, setRendered] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      setClosing(false)
      return undefined
    }
    if (!rendered) return undefined
    setClosing(true)
    const timer = setTimeout(() => {
      setRendered(false)
      setClosing(false)
    }, 260)
    return () => clearTimeout(timer)
  }, [open, rendered])

  if (!rendered) return null

  return (
    <div
      className={`modal-backdrop${closing ? ' is-closing' : ''}`}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`inquiry-modal${wide ? ' detail-modal' : ''}${closing ? ' is-closing' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
