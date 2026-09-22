import { useState } from 'react';
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const money = value => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

async function adminRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, ...options });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.message || 'Admin action failed');
  return body;
}

export default function AdminPanel({ bows, token, onBowsChange, onNotice }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', description: '', price: '', level: 'All levels' });
  const isEditing = Boolean(editing);
  const reset = () => { setEditing(null); setForm({ id: '', name: '', description: '', price: '', level: 'All levels' }); };
  const submit = async event => {
    event.preventDefault();
    try {
      const result = await adminRequest(isEditing ? `/bows/${editing}` : '/bows', token, { method: isEditing ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      onBowsChange(isEditing ? bows.map(bow => bow.id === editing ? result : bow) : [...bows, result]);
      reset(); onNotice({ type: 'success', text: isEditing ? 'Bow updated.' : 'Bow added to the catalog.' });
    } catch (error) { onNotice({ type: 'error', text: error.message }); }
  };
  const remove = async id => { try { await adminRequest(`/bows/${id}`, token, { method: 'DELETE' }); onBowsChange(bows.filter(bow => bow.id !== id)); onNotice({ type: 'success', text: 'Bow removed from the catalog.' }); } catch (error) { onNotice({ type: 'error', text: error.message }); } };
  return <div className="admin-catalog"><div className="catalog-heading"><div><p className="eyebrow">SERVICE MANAGEMENT</p><h2>Bow rental catalog</h2></div><button className="outline-button" onClick={reset}><Plus size={15} /> Add bow</button></div><form className="catalog-form" onSubmit={submit}><div className="catalog-fields"><label>ID<input required disabled={isEditing} value={form.id} onChange={event => setForm({ ...form, id: event.target.value })} /></label><label>Name<input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Price<input required type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} /></label><label>Level<input value={form.level} onChange={event => setForm({ ...form, level: event.target.value })} /></label><label className="wide">Description<input required value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></label></div><div className="catalog-actions"><button className="primary-button" type="submit"><Check size={15} /> {isEditing ? 'Save changes' : 'Create bow'}</button>{isEditing && <button className="icon-button" type="button" onClick={reset}><X size={16} /></button>}</div></form><div className="catalog-list">{bows.map(bow => <div className="catalog-row" key={bow.id}><div><strong>{bow.name}</strong><small>{bow.description}</small></div><span>{money(bow.price)}</span><span>{bow.level}</span><button className="icon-button" onClick={() => { setEditing(bow.id); setForm(bow); }}><Edit3 size={15} /></button><button className="icon-button danger" onClick={() => remove(bow.id)}><Trash2 size={15} /></button></div>)}</div></div>;
}
