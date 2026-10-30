import { useState } from 'react'
import { TEMPLATES } from '../utils/whatsapp.js'
import { IconRepeat, IconMessage, IconCheck, IconClock } from './icons.jsx'
import './DripSequences.css'

const DEFAULT_STEPS = [
  { day: 1, templateId: 'firstFollowup', enabled: true },
  { day: 3, templateId: 'bookingNudge', enabled: true },
  { day: 7, templateId: 'winBack', enabled: true },
]

/**
 * Drip sequence builder — the owner defines a Day 1/3/7 follow-up
 * sequence. Each step becomes a scheduled reminder with the
 * WhatsApp message ready to send in one tap.
 *
 * Props:
 * - inquiry: the inquiry this sequence is for
 * - businessName: string
 * - initialSteps: previously saved steps (with dueDate/sent attached) —
 *   reopening the builder shows the saved days/templates, not defaults
 * - onSave: (steps) => void
 */
export default function DripSequences({ inquiry, businessName, initialSteps, onSave }) {
  const [steps, setSteps] = useState(() =>
    Array.isArray(initialSteps) && initialSteps.length
      ? initialSteps.map(s => ({ day: s.day, templateId: s.templateId, enabled: true }))
      : DEFAULT_STEPS
  )
  const [saved, setSaved] = useState(false)

  function toggleStep(index) {
    setSteps(current =>
      current.map((s, i) => (i === index ? { ...s, enabled: !s.enabled } : s))
    )
    setSaved(false)
  }

  function changeTemplate(index, templateId) {
    setSteps(current =>
      current.map((s, i) => (i === index ? { ...s, templateId } : s))
    )
    setSaved(false)
  }

  function changeDay(index, day) {
    const d = Math.max(1, Math.min(30, Number(day) || 1))
    setSteps(current =>
      current.map((s, i) => (i === index ? { ...s, day: d } : s))
    )
    setSaved(false)
  }

  function handleSave() {
    const active = steps.filter(s => s.enabled).sort((a, b) => a.day - b.day)
    onSave?.(active)
    setSaved(true)
  }

  const activeCount = steps.filter(s => s.enabled).length

  return (
    <div className="drip-builder">
      <div className="drip-heading">
        <span className="app-eyebrow">AUTOMATION</span>
        <h3><IconRepeat width={18} height={18} /> Follow-up drip sequence</h3>
        <p>
          Wynback reminds you on each day with the message ready to send.
          Set it once — never forget a follow-up again.
        </p>
      </div>

      <div className="drip-steps">
        {steps.map((step, i) => (
          <div key={i} className={step.enabled ? 'drip-step' : 'drip-step disabled'}>
            <label className="drip-toggle">
              <input
                type="checkbox"
                checked={step.enabled}
                onChange={() => toggleStep(i)}
              />
              <span className="drip-day">
                <IconClock width={14} height={14} />
                Day
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={step.day}
                  disabled={!step.enabled}
                  onChange={(e) => changeDay(i, e.target.value)}
                  className="drip-day-input"
                />
              </span>
            </label>

            <select
              value={step.templateId}
              disabled={!step.enabled}
              onChange={(e) => changeTemplate(i, e.target.value)}
              className="drip-template-select"
            >
              {Object.values(TEMPLATES)
                .filter(t => t.id !== 'voiceNotePrompt')
                .map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
            </select>
          </div>
        ))}
      </div>

      <div className="drip-actions">
        <button type="button" className="save-button" onClick={handleSave}>
          {saved ? <><IconCheck width={16} height={16} /> Sequence saved</> : `Save ${activeCount}-step sequence`}
        </button>
      </div>

      {saved && (
        <p className="drip-saved-note">
          <IconMessage width={14} height={14} />
          {inquiry?.name?.split(' ')[0] || 'Customer'} will appear in your follow-up
          queue on each scheduled day with the message ready in one tap.
        </p>
      )}
    </div>
  )
}
