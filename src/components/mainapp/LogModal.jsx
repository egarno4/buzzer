import { useState } from 'react'
import { FieldLabel, inputStyle, Sheet } from './shared'

export default function LogModal({ onSubmit, onCancel, neighbors }) {
  const [unit, setUnit] = useState('')
  const [note, setNote] = useState('')
  const hasNeighbors = neighbors.length > 0

  return (
    <Sheet>
      <div style={{ fontSize: 11, color: '#D4773A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Private · Neighbor only</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>Spotted a Package?</h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>Only the recipient is notified. Nothing posts to the feed.</p>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Which neighbor?</FieldLabel>
        <select style={inputStyle} value={unit} onChange={(e) => setUnit(e.target.value)} disabled={!hasNeighbors}>
          <option value="">{hasNeighbors ? 'Select neighbor' : 'No approved neighbors available'}</option>
          {neighbors.map((n) => (
            <option key={n.id} value={n.unit}>
              {`Unit ${n.unit} — ${n.name}`}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 22 }}><FieldLabel>Note (optional)</FieldLabel><input style={inputStyle} placeholder="e.g. Left by the mailboxes, small brown box" value={note} onChange={(e) => setNote(e.target.value)} /></div>
      <button type="button" onClick={() => unit.trim() && onSubmit({ unit: unit.trim(), note })} disabled={!unit.trim() || !hasNeighbors} style={{ width: '100%', padding: 14, background: unit.trim() && hasNeighbors ? '#D4773A' : '#e8e8e8', color: unit.trim() && hasNeighbors ? '#fff' : '#aaa', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: unit.trim() && hasNeighbors ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 10 }}>Notify Neighbor Privately</button>
      <button type="button" onClick={onCancel} style={{ width: '100%', padding: 12, background: 'transparent', color: '#999', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
    </Sheet>
  )
}
