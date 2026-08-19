'use client'

import { useState } from 'react'
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react'
import { mockPacientes, type Paciente } from '@/lib/mock-data'
import ConfirmActionDialog from './confirm-action-dialog'

const empty: Omit<Paciente, 'id'> = { nombre: '', dni: '', edad: 18, obraSocial: '', historial: [] }

export default function PacientesList() {
  const [items, setItems] = useState<Paciente[]>(mockPacientes)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const filtered = items.filter(p => `${p.nombre} ${p.dni}`.toLowerCase().includes(search.toLowerCase()))

  const showForm = (item?: Paciente) => { setEditing(item?.id ?? null); setForm(item ? { nombre: item.nombre, dni: item.dni, edad: item.edad, obraSocial: item.obraSocial, historial: item.historial } : empty); setOpen(true); setMessage('') }
  const save = () => {
    if (items.some(p => p.id !== editing && p.dni === form.dni.trim())) return setMessage('Ya existe un paciente con ese DNI.')
    setItems(editing ? items.map(p => p.id === editing ? { ...p, ...form } : p) : [...items, { id: `pac${Date.now()}`, ...form }])
    setOpen(false); setMessage(editing ? 'Paciente actualizado correctamente.' : 'Paciente registrado exitosamente.')
  }
  const remove = () => { if (deleteId) { setItems(items.filter(p => p.id !== deleteId)); setMessage('Paciente dado de baja correctamente.'); setDeleteId(null) } }

  return <div className="space-y-6">
    {message && <div className={`rounded-lg border px-4 py-3 text-sm ${message.startsWith('Ya') ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{message}</div>}
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Pacientes</h1><p className="mt-1 text-sm text-muted-foreground">Gestión de pacientes y antecedentes relevantes</p></div><button onClick={() => showForm()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"><Plus size={18}/>Nuevo Paciente</button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o DNI..." className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4"/></div>
    <div className="overflow-hidden rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted"><tr>{['Nombre','DNI','Edad','Obra social','Historial','Acciones'].map(h => <th scope="col" key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead><tbody>{filtered.map((p,i)=><tr key={p.id} className={i%2?'bg-muted/30':'bg-card'}><td className="px-4 py-3 font-medium">{p.nombre}</td><td className="px-4 py-3 font-mono text-xs">{p.dni}</td><td className="px-4 py-3">{p.edad}</td><td className="px-4 py-3">{p.obraSocial || 'Sin cobertura'}</td><td className="max-w-xs truncate px-4 py-3">{p.historial.join(', ') || 'Sin antecedentes'}</td><td className="px-4 py-3"><div className="flex gap-1"><button aria-label={`Editar ${p.nombre}`} title="Editar paciente" onClick={()=>showForm(p)} className="p-2 text-blue-600"><Edit2 size={16}/></button><button aria-label={`Dar de baja ${p.nombre}`} title="Dar de baja" onClick={()=>setDeleteId(p.id)} className="p-2 text-red-600"><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl bg-card shadow-2xl"><div className="flex items-center justify-between border-b p-6"><h2 className="text-xl font-bold">{editing?'Editar paciente':'Nuevo paciente'}</h2><button aria-label="Cerrar" onClick={()=>setOpen(false)}><X/></button></div><div className="space-y-4 p-6">{message.startsWith('Ya')&&<p className="text-sm text-red-600">{message}</p>}<label className="block text-sm">Nombre completo *<input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-2 w-full rounded-lg border p-2.5"/></label><div className="grid grid-cols-2 gap-4"><label className="text-sm">DNI *<input value={form.dni} onChange={e=>setForm({...form,dni:e.target.value})} className="mt-2 w-full rounded-lg border p-2.5"/></label><label className="text-sm">Edad *<input type="number" min="0" value={form.edad} onChange={e=>setForm({...form,edad:Number(e.target.value)})} className="mt-2 w-full rounded-lg border p-2.5"/></label></div><label className="block text-sm">Obra social<input value={form.obraSocial} onChange={e=>setForm({...form,obraSocial:e.target.value})} className="mt-2 w-full rounded-lg border p-2.5"/></label><label className="block text-sm">Historial (separado por comas)<textarea value={form.historial.join(', ')} onChange={e=>setForm({...form,historial:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})} className="mt-2 w-full rounded-lg border p-2.5"/></label><div className="flex justify-end gap-3"><button onClick={()=>setOpen(false)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button disabled={!form.nombre||!form.dni} onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-300">Guardar</button></div></div></div></div>}
    <ConfirmActionDialog open={Boolean(deleteId)} onOpenChange={open => { if (!open) setDeleteId(null) }} title="Dar de baja al paciente" description="Se quitará de la lista." confirmLabel="Dar de baja" onConfirm={remove}/>
  </div>
}
