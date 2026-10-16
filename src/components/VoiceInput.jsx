import { useEffect, useRef, useState } from 'react'
import { IconMic } from './icons.jsx'
import './VoiceInput.css'

/**
 * VoiceInput — hold-to-talk / tap-to-talk voice input using the free
 * Web Speech API (built into Chrome & Android, no keys, no backend).
 *
 * The transcript is parsed with simple heuristics into name / service /
 * value fields; whatever can't be parsed stays as the raw note so
 * nothing the owner said is ever lost.
 *
 * Props:
 * - onResult({ name, service, value, note }) — parsed fields
 * - lang: recognition language, default 'en-IN' (owner can switch to 'hi-IN')
 */
export function speechSupported() {
  return typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Parse "Rohan Sharma haircut 500 rupees" style utterances.
 * Heuristics: trailing number + currency word = value; known service
 * words matched loosely; remainder = name.
 */
export function parseUtterance(text) {
  const raw = String(text || '').trim()
  if (!raw) return { name: '', service: '', value: '', note: '' }

  let rest = raw
  let value = ''

  // value: "500 rupees" / "rs 500" / "₹500" / "5000"
  const valueMatch = rest.match(/(?:rs\.?|rupees?|₹)\s*([\d,]+)|([\d,]+)\s*(?:rs\.?|rupees?|₹)/i)
  if (valueMatch) {
    value = (valueMatch[1] || valueMatch[2]).replace(/,/g, '')
    rest = rest.replace(valueMatch[0], ' ').trim()
  }

  // service: match against a broad keyword list (salon/spa/garage/clinic/coaching + generic)
  const SERVICE_KEYWORDS = [
    'haircut', 'hair cut', 'hair color', 'hair colour', 'facial', 'manicure', 'pedicure',
    'massage', 'spa', 'waxing', 'threading', 'bleach', 'cleanup', 'clean up', 'bridal',
    'makeup', 'make up', 'hair spa', 'keratin', 'smoothening', 'rebonding',
    'car service', 'bike service', 'oil change', 'denting', 'painting', 'washing', 'wash',
    'repair', 'ac repair', 'plumbing', 'electrician',
    'consultation', 'checkup', 'check up', 'appointment', 'therapy', 'physio',
    'tuition', 'coaching', 'admission', 'demo class', 'trial class',
    'photography', 'photoshoot', 'photo shoot', 'wedding shoot',
    'website', 'logo', 'design', 'marketing',
  ]
  let service = ''
  const lower = rest.toLowerCase()
  // longest keyword first so "hair spa" wins over "spa"
  const sorted = [...SERVICE_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sorted) {
    if (lower.includes(kw)) {
      service = kw.replace(/\b\w/g, c => c.toUpperCase())
      rest = rest.replace(new RegExp(kw, 'i'), ' ').trim()
      break
    }
  }

  // name: strip filler words, keep the rest
  const fillers = /\b(my name is|this is|name|for|called|please|wants?|needs?|interested in|enquiry|inquiry|about|ka|ke|ki|hai|chahiye)\b/gi
  let name = rest.replace(fillers, ' ').replace(/\s{2,}/g, ' ').trim()
  name = name.replace(/\b\w/g, c => c.toUpperCase())

  // If nothing parsed cleanly, keep everything as a note
  const note = (!name && !service && !value) ? raw : ''

  return { name, service, value, note }
}

export default function VoiceInput({ onResult, lang = 'en-IN' }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [language, setLanguage] = useState(lang)
  const recogRef = useRef(null)

  useEffect(() => {
    return () => {
      try { recogRef.current?.stop() } catch { /* noop */ }
    }
  }, [])

  if (!speechSupported()) return null

  function toggle() {
    if (listening) {
      try { recogRef.current?.stop() } catch { /* noop */ }
      return
    }

    setError('')
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recog = new SR()
    recogRef.current = recog
    recog.lang = language
    recog.interimResults = false
    recog.maxAlternatives = 1

    recog.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (transcript) onResult?.(parseUtterance(transcript))
    }
    recog.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone blocked — allow access and try again.')
      } else if (event.error !== 'aborted') {
        setError('Could not hear you — try again.')
      }
      setListening(false)
    }
    recog.onend = () => setListening(false)

    try {
      recog.start()
      setListening(true)
    } catch {
      setError('Voice input failed to start.')
    }
  }

  return (
    <span className="voice-input-wrap">
      <button
        type="button"
        className={listening ? 'voice-btn listening' : 'voice-btn'}
        onClick={toggle}
        title={listening ? 'Tap to stop' : 'Tap and speak the inquiry'}
        aria-label="Voice input for inquiry"
      >
        <IconMic width={18} height={18} />
        <span className="voice-pulse" aria-hidden="true" />
      </button>
      <select
        className="voice-lang"
        value={language}
        onChange={e => setLanguage(e.target.value)}
        aria-label="Voice language"
      >
        <option value="en-IN">EN</option>
        <option value="hi-IN">HI</option>
      </select>
      {listening && <span className="voice-hint">Listening… speak now</span>}
      {error && <span className="voice-error">{error}</span>}
    </span>
  )
}
