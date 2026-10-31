/**
 * #140 — CSV export (the import side lives in parseCsv/guessMapping).
 * Pure except downloadCsv, which needs the DOM. Exported rows are
 * whatever the caller passes — the Inquiries page passes its filtered,
 * already-scoped list, so an export never contains rows the user
 * cannot already see.
 */
function csvCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(columns, rows) {
  const head = columns.map(column => csvCell(column.label)).join(',')
  const body = (rows || []).map(row =>
    columns
      .map(column =>
        csvCell(
          typeof column.get === 'function' ? column.get(row) : row[column.key]
        )
      )
      .join(',')
  )
  // BOM first so spreadsheet apps read non-ASCII (₹, names) correctly.
  return [`\ufeff${head}`, ...body].join('\n')
}

export function downloadCsv(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Hand-rolled CSV parser (batch 5, bulk CSV engine).
 *
 * package.json is React-only, so no csv library is added. Handles:
 * quoted fields, embedded commas and newlines, escaped double quotes
 * (""), \r\n and \n line endings, a leading BOM, and a header row.
 * Fully-empty rows are dropped. Nothing here guesses types — the
 * importer validates after parsing.
 */

/** Parse CSV text into an array of rows (each row = array of strings). */
export function parseCsv(text) {
  const src = String(text || '').replace(/^\uFEFF/, '')
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\r') {
      // \r\n is handled by the \n branch; a lone \r is ignored.
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter(r => r.some(c => String(c).trim() !== ''))
}

/**
 * Guess the column mapping from headers, case-insensitively.
 * Returns column indexes (-1 = not found). The owner confirms the
 * mapping in the UI before anything imports, so a wrong guess is
 * correctable, never silent.
 */
export function guessMapping(headers) {
  const find = re => headers.findIndex(h => re.test(h || ''))
  return {
    name: find(/name|client|customer/i),
    phone: find(/phone|mobile|number/i),
    service: find(/service|treatment|product/i),
    value: find(/value|amount|price/i),
    lastContact: find(/last|contact/i),
  }
}
