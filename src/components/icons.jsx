/**
 * Wynback SVG icon system.
 * All icons are stroke-based, 24x24 viewBox, currentColor.
 * No emojis, no text glyphs — pure SVG.
 */

function base(props, children) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconRadar(props) {
  return base(props, <>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 12 L19 5" />
    <path d="M7.5 7.5 a6.4 6.4 0 0 0 0 9" />
    <path d="M4.6 4.6 a10.5 10.5 0 0 0 0 14.8" />
    <circle cx="12" cy="12" r="10.5" strokeDasharray="2 3" opacity="0.45" />
  </>)
}

export function IconClock(props) {
  return base(props, <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7 v5 l3.5 2" />
  </>)
}

export function IconTrendUp(props) {
  return base(props, <>
    <path d="M3 17 l6-6 4 4 8-8" />
    <path d="M14 7 h7 v7" />
  </>)
}

export function IconCheck(props) {
  return base(props, <path d="M4 12.5 l5 5 L20 6.5" />)
}

export function IconArrowRight(props) {
  return base(props, <>
    <path d="M4 12 h15" />
    <path d="M13 6 l6 6-6 6" />
  </>)
}

export function IconArrowUpRight(props) {
  return base(props, <>
    <path d="M7 17 L17 7" />
    <path d="M8 7 h9 v9" />
  </>)
}

export function IconPhone(props) {
  return base(props, <>
    <path d="M5 4 h4 l2 5-2.5 1.5 a12 12 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1-2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2-2" />
  </>)
}

export function IconPhoneMissed(props) {
  return base(props, <>
    <path d="M5 4 h4 l2 5-2.5 1.5 a12 12 0 0 0 5 5 L15 13 l5 2 v4 a2 2 0 0 1-2 2 A16 16 0 0 1 3 6 a2 2 0 0 1 2-2" />
    <path d="M17 4 l5 5 M22 4 l-5 5" strokeWidth={2.4} />
  </>)
}

export function IconMessage(props) {
  return base(props, <>
    <path d="M21 12 a8 8 0 0 1-8 8 H4 l2-3 a8 8 0 1 1 15-5 z" />
  </>)
}

export function IconMic(props) {
  return base(props, <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11 a7 7 0 0 0 14 0" />
    <path d="M12 18 v3" />
  </>)
}

export function IconCalendar(props) {
  return base(props, <>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M8 3 v4 M16 3 v4 M4 10 h16" />
  </>)
}

export function IconUsers(props) {
  return base(props, <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20 a6 6 0 0 1 12 0" />
    <path d="M16 5 a3.5 3.5 0 0 1 0 7 M18.5 14.5 A6 6 0 0 1 21 20" />
  </>)
}

export function IconZap(props) {
  return base(props, <path d="M13 2 L4 14 h6 l-1 8 9-12 h-6 l1-8 z" />)
}

export function IconRepeat(props) {
  return base(props, <>
    <path d="M17 2 l4 4-4 4" />
    <path d="M3 11 v-1 a4 4 0 0 1 4-4 h14" />
    <path d="M7 22 l-4-4 4-4" />
    <path d="M21 13 v1 a4 4 0 0 1-4 4 H3" />
  </>)
}

export function IconStar(props) {
  return base(props, <path d="M12 3 l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1L3.2 9.5l6.1-.9 L12 3 z" />)
}

export function IconShield(props) {
  return base(props, <>
    <path d="M12 3 l8 3 v6 c0 5-3.5 8-8 9-4.5-1-8-4-8-9 V6 l8-3 z" />
    <path d="M9 12 l2 2 4-4" />
  </>)
}

/**
 * Wynback logo mark — a "W" whose final stroke rises into an
 * upward arrow: the visual metaphor of winning a customer back.
 */
export function LogoMark(props) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <rect width="40" height="40" rx="11" fill="#2457ff" />
      <path
        d="M9 27 L14 13 L19 24 L24 13"
        stroke="#fff"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 13 L31 13 M31 13 L31 20"
        stroke="#fff"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0"
      />
      <path
        d="M22 25 L31 16"
        stroke="#7df9c6"
        strokeWidth={3.4}
        strokeLinecap="round"
      />
      <path
        d="M25.5 16 h5.5 v5.5"
        stroke="#7df9c6"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
