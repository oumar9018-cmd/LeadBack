/**
 * Custom field inputs for the inquiry add form. Renders one labelled
 * input per defined field, using the form's own label/input styling.
 * Returns nothing when no fields are defined, so workspaces without
 * custom fields see no change at all.
 */
export default function CustomFieldInputs({ fields, values, onChange }) {
  if (!Array.isArray(fields) || fields.length === 0) return null

  return (
    <>
      {fields.map(field => (
        <label key={field.id}>
          {field.label}
          {field.type === 'select' ? (
            <select
              value={values[field.id] ?? ''}
              onChange={e => onChange(field.id, e.target.value)}
            >
              <option value="">—</option>
              {field.options.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={
                field.type === 'number'
                  ? 'number'
                  : field.type === 'date'
                    ? 'date'
                    : 'text'
              }
              value={values[field.id] ?? ''}
              onChange={e => onChange(field.id, e.target.value)}
            />
          )}
        </label>
      ))}
    </>
  )
}
