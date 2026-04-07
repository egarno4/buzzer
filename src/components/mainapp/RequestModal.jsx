import { useState } from 'react'
import { FieldLabel, inputStyle, Sheet } from './shared'

export default function RequestModal({ onSubmit, onCancel }) {
  const [note, setNote] = useState('')

  return (
    <Sheet>
      <div style={{ fontSize: 11, color: '#D4773A', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Public · Building feed</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', fontFamily: "'Barlow', sans-serif" }}>Need Help?</h2>
      <p style={{ fontSize: 14, color: '#999', margin: '0 0 20px' }}>Neighbors volunteer — you choose who holds it.</p>
      <div style={{ marginBottom: 22 }}><FieldLabel>What&apos;s the situation?</FieldLabel><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={"e.g. UPS says delivered, won't be home until 8pm — can someone grab it?"} rows={3} style={{ ...inputStyle, fontSize: 14, color: '#111', resize: 'none', lineHeight: 1.5 }} /></div>
      <button type="button" onClick={() => note.trim() && onSubmit({ note })} disabled={!note.trim()} style={{ width: '100%', padding: 14, background: note.trim() ? '#D4773A' : '#e8e8e8', color: note.trim() ? '#fff' : '#aaa', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 16, cursor: note.trim() ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 10 }}>Post to Building</button>
      <button type="button" onClick={onCancel} style={{ width: '100%', padding: 12, background: 'transparent', color: '#999', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
    </Sheet>
  )
}
