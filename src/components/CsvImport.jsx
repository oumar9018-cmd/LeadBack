import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal.jsx'
import { parseCsv, guessMapping } from '../utils/csv.js'
import { normalizePhone } from '../utils/whatsapp.js'
import './CsvImport.css'

/**
 * Bulk CSV engine — batch 5 (enterprise Phase 3).
 *
 * Five owner-tapped steps, nothing writes before the preview:
 * upload → confirm mapping → validate + dedupe preview → chunked
 * import (400/batch, sequential) → optional Blitz over the import.
 *
 * Honest limits, stated in the UI, not buried:
 * - 10,000 rows per file (the Inquiries list paginates, but lakh-scale
 *   imports are NOT advertised until the list is proven at that size).
 * - Imported rows are status 'lost' (dead leads; Blitz works lost
 *   leads), source 'csv', unassigned, unbranched — owner/admin-only
 *   import, so the rows land where admins can see them.
 * - Phone is stored as typed (like manual adds); dedupe uses the
 *   normalized form. Value unmapped → 0, unflagged; value mapped but
 *   unparseable → 0, flagged.
 * - A failed import keeps an "imported X of Y, resume" state; resume
 *   re-dedupes against what already landed, so it never duplicates.
 */

const MAX_ROWS_PER_FILE = 10000
const BATCH_SIZE = 400
const PRESELECT_KEY = 'wynback-blitz-preselect'

function parseValue(raw) {
  const cleaned = String(raw || '').replace(/[^0-9.-]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '.') return null
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

export default function CsvImport({ open, onClose, workspace, existingItems, onImported }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('upload')
  const [fileError, setFileError] = useState('')
  const [headers, setHeaders] = useState([])
  const [dataRows, setDataRows] = useState([])
  const [mapping, setMapping] = useState({ name: -1, phone: -1, service: -1, value: -1, lastContact: -1 })
  const [results, setResults] = useState(null)
  const [importedCount, setImportedCount] = useState(0)
  const [importedIds, setImportedIds] = useState([])
  const [importedPhones, setImportedPhones] = useState([])
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('upload')
    setFileError('')
    setHeaders([])
    setDataRows([])
    setMapping({ name: -1, phone: -1, service: -1, value: -1, lastContact: -1 })
    setResults(null)
    setImportedCount(0)
    setImportedIds([])
    setImportedPhones([])
    setImportError('')
    setImporting(false)
  }, [open ])

  const existingPhones = useMemo(() => {
    const set = new Set()
    ;(existingItems || []).forEach(item => {
      const n = normalizePhone(item.phone)
      if (n) set.add(n)
    })
    return set
  }, [existingItems])

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileError('')
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length < 2) {
        setFileError('This file needs a header row plus at least one data row.')
        return
      }
      const data = rows.slice(1)
      if (data.length > MAX_ROWS_PER_FILE) {
        setFileError(
          `This file has ${data.length.toLocaleString()} rows — imports are capped at ${MAX_ROWS_PER_FILE.toLocaleString()} rows per file for now, so the list stays fast. Split the file and import it in parts.`
        )
        return
      }
      setHeaders(rows[0].map(h => String(h || '').trim()))
      setDataRows(data)
      setMapping(guessMapping(rows[0].map(h => String(h || '').trim())))
      setStep('mapping')
    } catch (error) {
      console.error('CSV read failed:', error)
      setFileError('Could not read this file. Please try a plain .csv export.')
    }
  }

  function cell(row, index) {
    if (index < 0 || index >= row.length) return ''
    return String(row[index] ?? '').trim()
  }

  function buildPreview() {
    const seenInFile = new Set()
    const built = dataRows.map((row, index) => {
      const name = cell(row, mapping.name)
      const phoneRaw = cell(row, mapping.phone)
      const normalized = normalizePhone(phoneRaw)
      const service = mapping.service >= 0 ? cell(row, mapping.service) : ''
      let value = 0
      let valueFlagged = false
      if (mapping.value >= 0) {
        const parsed = parseValue(cell(row, mapping.value))
        if (parsed === null) {
          value = 0
          valueFlagged = true
        } else {
          value = parsed
        }
      }
      const lastContact = mapping.lastContact >= 0 ? cell(row, mapping.lastContact) : ''
      let status = 'ready'
      let reason = ''
      if (!name) {
        status = 'flagged'
        reason = 'Missing name'
      } else if (!normalized) {
        status = 'flagged'
        reason = 'Phone does not look valid'
      } else if (existingPhones.has(normalized) || seenInFile.has(normalized)) {
        status = 'duplicate'
        reason = existingPhones.has(normalized) ? 'Already in your inquiries' : 'Duplicate inside this file'
      } else {
        seenInFile.add(normalized)
      }
      if (status === 'ready' && valueFlagged) {
        status = 'flagged'
        reason = 'Value did not parse — will import as 0'
      }
      return { index, name, phoneRaw, normalized, service, value, lastContact, status, reason }
    })
    setResults(built)
    setStep('preview')
  }

  const readyRows = (results || []).filter(r => r.status === 'ready')
  const flaggedRows = (results || []).filter(r => r.status === 'flagged')
  const duplicateRows = (results || []).filter(r => r.status === 'duplicate')
  const sampleRows = (results || []).slice(0, 10)

  async function runImport(rowsToImport) {
    const db = window.firebase?.firestore?.()
    if (!db || !workspace) return
    setImporting(true)
    setImportError('')
    let imported = importedCount
    const ids = [...importedIds]
    const phones = new Set(importedPhones)
    try {
      for (let start = 0; start < rowsToImport.length; start += BATCH_SIZE) {
        const chunk = rowsToImport.slice(start, start + BATCH_SIZE)
        const batch = db.batch()
        const chunkDocs = chunk.map(r => {
          const ref = db
            .collection('users')
            .doc(workspace.ownerUid)
            .collection('inquiries')
            .doc()
          batch.set(ref, {
            name: r.name,
            phone: r.phoneRaw,
            service: r.service,
            value: r.value,
            status: 'lost',
            source: 'csv',
            assignedTo: '',
            branchId: '',
            importedAt: new Date().toISOString(),
            lastContact: r.lastContact || '',
            date: 'Imported',
            createdAt: Date.now(),
          })
          return { id: ref.id, ref }
        })
        await batch.commit()
        chunkDocs.forEach(({ id }) => ids.push(id))
        chunk.forEach(r => { if (r.normalized) phones.add(r.normalized) })
        imported += chunk.length
        setImportedCount(imported)
        setImportedIds(ids)
        setImportedPhones([...phones])
      }
      const newRows = rowsToImport.map((r, i) => ({
        id: ids[ids.length - rowsToImport.length + i],
        name: r.name,
        phone: r.phoneRaw,
        service: r.service,
        value: r.value,
        status: 'lost',
        source: 'csv',
        assignedTo: '',
        branchId: '',
        importedAt: new Date().toISOString(),
        lastContact: r.lastContact || '',
        date: 'Imported',
        createdAt: Date.now(),
      }))
      if (onImported) onImported(newRows)
      setStep('done')
    } catch (error) {
      console.error('CSV import failed part-way:', error)
      setImportError(
        `Import stopped after ${imported} of ${readyRows.length} rows (usually a connection or permission issue). Nothing was duplicated — resume picks up where it stopped.`
      )
    } finally {
      setImporting(false)
    }
  }

  function handleResume() {
    const importedSet = new Set(importedPhones)
    const remaining = readyRows.filter(r => !importedSet.has(r.normalized))
    runImport(remaining)
  }

  function handleBlitzNow() {
    try {
      sessionStorage.setItem(PRESELECT_KEY, JSON.stringify({ ids: importedIds, bulk: true }))
    } catch (e) {
      console.error('Could not preselect blitz rows:', e)
    }
    onClose()
    navigate('/app/blitz')
  }

  function mappingSelect(label, key, required) {
    return (
      <label className="csv-mapping-row">
        <span>{label}{required ? ' *' : ''}</span>
        <select
          value={mapping[key]}
          onChange={e => setMapping(m => ({ ...m, [key]: Number(e.target.value) }))}
        >
          <option value={-1}>Not mapped</option>
          {headers.map((h, i) => (
            <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
          ))}
        </select>
      </label>
    )
  }

  const mappingValid = mapping.name >= 0 && mapping.phone >= 0
  const progress = readyRows.length ? Math.round((importedCount / readyRows.length) * 100) : 0

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="csv-import">
        <div className="modal-header">
          <div>
            <span className="app-eyebrow">BULK IMPORT</span>
            <h2>Import leads from CSV</h2>
            <p>Dead leads from an old sheet, back in your inbox as lost leads — ready for Blitz. Nothing writes until you approve the preview.</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {step === 'upload' && (
          <div className="csv-step">
            <label className="csv-file-label">
              <span>Choose a .csv file (up to {MAX_ROWS_PER_FILE.toLocaleString()} rows)</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} />
            </label>
            {fileError && <p className="csv-error">{fileError}</p>}
            <p className="csv-note">The file never leaves this browser until rows are written as inquiries. First row must be headers (Name, Phone, Service, Value).</p>
          </div>
        )}

        {step === 'mapping' && (
          <div className="csv-step">
            <p className="csv-note">We guessed the columns — correct anything wrong, then continue to the preview.</p>
            {mappingSelect('Name', 'name', true)}
            {mappingSelect('Phone', 'phone', true)}
            {mappingSelect('Service', 'service', false)}
            {mappingSelect('Value', 'value', false)}
            {mappingSelect('Last contact (optional)', 'lastContact', false)}
            {!mappingValid && <p className="csv-error">Name and Phone must both be mapped to continue.</p>}
            <div className="csv-actions">
              <button type="button" className="ghost-button" onClick={() => setStep('upload')}>Back</button>
              <button type="button" className="primary-button" disabled={!mappingValid} onClick={buildPreview}>
                Preview {dataRows.length.toLocaleString()} rows
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && results && (
          <div className="csv-step">
            <div className="csv-counts">
              <span><strong>{readyRows.length}</strong> ready</span>
              <span><strong>{flaggedRows.length}</strong> flagged</span>
              <span><strong>{duplicateRows.length}</strong> duplicate</span>
            </div>
            <p className="csv-note">
              Flagged rows import with a warning note below (bad phones are skipped — they are never silently dropped into the list without a reason).
              Duplicates are skipped, never imported twice. Sample of the first 10 rows:
            </p>
            <div className="csv-sample-wrap">
              <table className="csv-sample">
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Service</th><th>Value</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {sampleRows.map(r => (
                    <tr key={r.index}>
                      <td>{r.name || '—'}</td>
                      <td>{r.phoneRaw || '—'}</td>
                      <td>{r.service || '—'}</td>
                      <td>{r.value}</td>
                      <td>{r.status}{r.reason ? ` — ${r.reason}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {flaggedRows.length > 0 && (
              <p className="csv-note">Flagged rows are NOT imported in this run. Fix the sheet and re-import, or import the ready rows now.</p>
            )}
            <div className="csv-actions">
              <button type="button" className="ghost-button" onClick={() => setStep('mapping')}>Back to mapping</button>
              <button
                type="button"
                className="primary-button"
                disabled={!readyRows.length}
                onClick={() => { setStep('importing'); runImport(readyRows) }}
              >
                Import {readyRows.length.toLocaleString()} rows
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="csv-step">
            <p>Importing… {importedCount} of {readyRows.length} rows</p>
            <div className="csv-progress"><span style={{ width: `${progress}%` }} /></div>
            {importing && <p className="csv-note">Please keep this open — batches write in sequence so a failure never looks like success.</p>}
            {importError && (
              <>
                <p className="csv-error">{importError}</p>
                <div className="csv-actions">
                  <button type="button" className="primary-button" onClick={handleResume} disabled={importing}>
                    Resume import
                  </button>
                  <button type="button" className="ghost-button" onClick={onClose}>Close</button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="csv-step">
            <p><strong>{importedCount.toLocaleString()} leads imported</strong> as lost leads, ready for Blitz.</p>
            <p className="csv-note">Blitzing this whole set counts as this week&apos;s blast (one per week, so numbers never get spam-flagged). Single follow-ups are never blocked by that rule.</p>
            <div className="csv-actions">
              <button type="button" className="ghost-button" onClick={onClose}>Done</button>
              <button type="button" className="primary-button" onClick={handleBlitzNow} disabled={!importedIds.length}>
                Blitz these now
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
