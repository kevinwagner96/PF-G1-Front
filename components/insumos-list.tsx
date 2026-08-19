'use client'

import { useState } from 'react'
import { Edit2, Package, Plus, Search, Trash2, X } from 'lucide-react'
import { mockInsumos, type Insumo } from '@/lib/mock-data'
import ConfirmActionDialog from './confirm-action-dialog'

const empty: Omit<Insumo, 'id'> = { nombre: '', stock: 0, estado: true }

export default function InsumosList() {
  const [items, setItems] = useState<Insumo[]>(mockInsumos)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const filtered = items.filter(i => i.nombre.toLowerCase().includes(search.toLowerCase()))
  const showForm = (i?: Insumo) => { setEditing(i?.id ?? null); setForm(i ? { nombre:i.nombre,stock:i.stock,estado:i.estado } : empty); setOpen(true); setMessage('') }
  const save = () => { if(items.some(i=>i.id!==editing&&i.nombre.trim().toLowerCase()===form.nombre.trim().toLowerCase())) return setMessage('Ya existe un insumo con ese nombre.'); setItems(editing?items.map(i=>i.id===editing?{...i,...form}:i):[...items,{id:`ins${Date.now()}`,...form}]); setOpen(false); setMessage(editing?'Insumo actualizado correctamente.':'Insumo registrado exitosamente.') }
  const deactivate = () => { if(deactivateId) { setItems(items.map(i=>i.id===deactivateId?{...i,estado:false}:i)); setMessage('Insumo inactivado correctamente.'); setDeactivateId(null) } }
  return <div className="space-y-6">
    {message&&!open&&<div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
    <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Insumos</h1><p className="mt-1 text-sm text-muted-foreground">Inventario de recursos materiales quirúrgicos</p></div><button onClick={()=>showForm()} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white"><Plus size={18}/>Nuevo Insumo</button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar insumo..." className="w-full rounded-lg border py-2.5 pl-10 pr-4"/></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(i=><div key={i.id} className="rounded-xl border bg-card p-5"><div className="flex justify-between"><div className="flex gap-3"><div className="rounded-lg bg-blue-100 p-3 text-blue-600"><Package/></div><div><h3 className="font-semibold">{i.nombre}</h3><p className="text-sm text-muted-foreground">Stock disponible</p></div></div><span className={`h-fit rounded-full px-2.5 py-1 text-xs ${i.estado?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{i.estado?'Activo':'Inactivo'}</span></div><p className={`my-5 text-3xl font-bold ${i.stock<10?'text-red-600':'text-foreground'}`}>{i.stock}<span className="ml-2 text-sm font-normal text-muted-foreground">unidades</span></p><div className="flex justify-end gap-1 border-t pt-3"><button aria-label={`Editar ${i.nombre}`} title="Editar insumo" onClick={()=>showForm(i)} className="p-2 text-blue-600"><Edit2 size={16}/></button>{i.estado&&<button aria-label={`Inactivar ${i.nombre}`} title="Inactivar insumo" onClick={()=>setDeactivateId(i.id)} className="p-2 text-red-600"><Trash2 size={16}/></button>}</div></div>)}</div>
    {open&&<div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl bg-card"><div className="flex justify-between border-b p-6"><h2 className="text-xl font-bold">{editing?'Editar insumo':'Nuevo insumo'}</h2><button aria-label="Cerrar" onClick={()=>setOpen(false)}><X/></button></div><div className="space-y-4 p-6">{message.startsWith('Ya')&&<p className="text-sm text-red-600">{message}</p>}<label className="block text-sm">Nombre *<input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="mt-2 w-full rounded-lg border p-2.5"/></label><label className="block text-sm">Stock *<input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})} className="mt-2 w-full rounded-lg border p-2.5"/></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.estado} onChange={e=>setForm({...form,estado:e.target.checked})}/>Insumo activo</label><div className="flex justify-end gap-3"><button onClick={()=>setOpen(false)} className="rounded-lg bg-muted px-4 py-2">Cancelar</button><button disabled={!form.nombre} onClick={save} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-300">Guardar</button></div></div></div></div>}
    <ConfirmActionDialog open={Boolean(deactivateId)} onOpenChange={open => { if (!open) setDeactivateId(null) }} title="Inactivar insumo" description="El recurso quedará inactivo." confirmLabel="Inactivar" onConfirm={deactivate}/>
  </div>
}
