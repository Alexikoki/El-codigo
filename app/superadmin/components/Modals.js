'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, XCircle, CreditCard, CheckCircle2, Trash2, MapPin } from 'lucide-react'

const inputClass = "w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"

const overlay = "absolute inset-0 bg-black/30"
const panel = "bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full relative z-10 shadow-lg"

export function ModalCrear({ modal, setModal, form, setForm, handleSubmit, lugares }) {
  return (
    <AnimatePresence>
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => { setModal(null); setForm({}) }} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-md`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                <Plus size={18} className="text-[#1e3a5f]" />
                Nuevo {modal === 'lugar' ? 'Local' : modal === 'referidor' ? 'Referidor' : modal === 'agencia' ? 'Agencia' : 'Staff'}
              </h2>
              <button onClick={() => { setModal(null); setForm({}) }} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <div className="space-y-3">
              {modal === 'lugar' && <>
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Datos del local</p>
                <input placeholder="Nombre del local" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })} className={`${inputClass} appearance-none`}>
                  <option value="">Tipo de lugar</option>
                  {['Restaurante', 'Bar', 'Club', 'Hotel', 'Turismo', 'Experiencia'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Dirección física" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} className={inputClass} />
                  <input placeholder="Barrio / Zona" value={form.barrio || ''} onChange={e => setForm({ ...form, barrio: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Descuento turistas (%)</label>
                    <input type="number" min="0" max="100" value={form.descuento ?? 10} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Comisión plataforma (%)</label>
                    <input type="number" min="0" max="100" step="0.5" value={form.porcentaje_plataforma ?? 20} onChange={e => setForm({ ...form, porcentaje_plataforma: parseFloat(e.target.value) })} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider pt-1">Acceso Manager</p>
                <input placeholder="Nombre del manager" value={form.manager_nombre || ''} onChange={e => setForm({ ...form, manager_nombre: e.target.value })} className={inputClass} />
                <input placeholder="Email del manager" type="email" value={form.manager_email || ''} onChange={e => setForm({ ...form, manager_email: e.target.value })} className={inputClass} />
                <input placeholder="Contraseña (mín. 6 caracteres)" type="password" value={form.manager_password || ''} onChange={e => setForm({ ...form, manager_password: e.target.value })} className={inputClass} />
              </>}
              {modal === 'referidor' && <>
                <input placeholder="Nombre / Alias" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                <input type="text" placeholder="Usuario o email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
              </>}
              {modal === 'staff' && <>
                <input placeholder="Nombre del empleado" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                <input type="text" placeholder="Usuario o email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
                <select value={form.lugar_id || ''} onChange={e => setForm({ ...form, lugar_id: e.target.value })} className={`${inputClass} appearance-none`}>
                  <option value="">Asignar al Local...</option>
                  {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </>}
              {modal === 'agencia' && <>
                <input placeholder="Nombre de la agencia" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                <input type="text" placeholder="Email de acceso" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
              </>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModal(null); setForm({}) }}
                className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={handleSubmit}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalEditarLugar({ modalEditar, setModalEditar, form, setForm, handleEditar }) {
  return (
    <AnimatePresence>
      {modalEditar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => { setModalEditar(null); setForm({}) }} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-sm`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                <Pencil size={16} className="text-[#1e3a5f]" /> Editar Local
              </h2>
              <button onClick={() => { setModalEditar(null); setForm({}) }} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Nombre del local</label>
                <input value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Barrio / Zona</label>
                <input value={form.barrio || ''} onChange={e => setForm({ ...form, barrio: e.target.value })} className={inputClass} placeholder="Ej. Centro, Gràcia, Eixample..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Descuento turistas (%)</label>
                  <input type="number" min="0" max="100" value={form.descuento ?? ''} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Comisión plataforma (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={form.porcentaje_plataforma ?? ''} onChange={e => setForm({ ...form, porcentaje_plataforma: parseFloat(e.target.value) })} className={inputClass} />
                </div>
              </div>
              {modalEditar?.managers_locales?.[0] && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5">
                  <p className="text-xs text-[#6b7280] mb-0.5">Manager actual</p>
                  <p className="text-sm font-medium text-[#111111]">{modalEditar.managers_locales[0].nombre}</p>
                  <p className="text-xs text-[#9ca3af]">{modalEditar.managers_locales[0].email}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalEditar(null); setForm({}) }}
                className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={handleEditar}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Guardar Cambios
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalLiquidacion({ modalLiq, setModalLiq, formLiq, setFormLiq, crearLiquidacion, referidores }) {
  return (
    <AnimatePresence>
      {modalLiq && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => setModalLiq(false)} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-md`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                <CreditCard size={18} className="text-[#1e3a5f]" /> Nueva Liquidación
              </h2>
              <button onClick={() => setModalLiq(false)} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                <XCircle size={22} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Referidor *</label>
                <select value={formLiq.referidor_id} onChange={e => setFormLiq({ ...formLiq, referidor_id: e.target.value })} className={`${inputClass} appearance-none`}>
                  <option value="">Seleccionar referidor...</option>
                  {referidores.map(r => <option key={r.id} value={r.id}>{r.nombre} — {r.email}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Importe (€) *</label>
                <input type="number" step="0.01" min="0" placeholder="0.00" value={formLiq.importe} onChange={e => setFormLiq({ ...formLiq, importe: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Período desde *</label>
                  <input type="date" value={formLiq.periodo_desde} onChange={e => setFormLiq({ ...formLiq, periodo_desde: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Período hasta *</label>
                  <input type="date" value={formLiq.periodo_hasta} onChange={e => setFormLiq({ ...formLiq, periodo_hasta: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Notas (opcional)</label>
                <textarea rows={2} placeholder="Comentarios..." value={formLiq.notas} onChange={e => setFormLiq({ ...formLiq, notas: e.target.value })} className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalLiq(false)}
                className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={crearLiquidacion}
                className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Crear Liquidación
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalConfirmPago({ confirmPago, setConfirmPago, marcarPagado }) {
  return (
    <AnimatePresence>
      {confirmPago && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => setConfirmPago(null)} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-sm`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#111111]">Confirmar pago</h2>
                <p className="text-xs text-[#6b7280]">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 mb-5 space-y-1">
              <p className="text-sm font-semibold text-[#111111]">{confirmPago.referidores?.nombre}</p>
              <p className="text-xs text-[#6b7280]">{confirmPago.periodo_desde} → {confirmPago.periodo_hasta}</p>
              <p className="text-xl font-bold text-[#111111] mt-1">{parseFloat(confirmPago.importe).toFixed(2)}€</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmPago(null)}
                className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={() => marcarPagado(confirmPago.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Confirmar pago
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalEditCliente({ modalEditCliente, setModalEditCliente, formCliente, setFormCliente, editarCliente }) {
  return (
    <AnimatePresence>
      {modalEditCliente && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => { setModalEditCliente(null); setFormCliente({}) }} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-sm`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Pencil size={16} className="text-[#1e3a5f]" /> Editar Cliente
              </h2>
              <button onClick={() => { setModalEditCliente(null); setFormCliente({}) }} className="text-[#9ca3af] hover:text-[#374151]"><XCircle size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Nombre</label>
                <input value={formCliente.nombre || ''} onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })}
                  className={inputClass} placeholder="Nombre del cliente" />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Personas</label>
                <input type="number" min="1" max="50" value={formCliente.num_personas || 1}
                  onChange={e => setFormCliente({ ...formCliente, num_personas: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setModalEditCliente(null); setFormCliente({}) }}
                className="flex-1 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={editarCliente}
                className="flex-1 py-2.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#15294a] transition-colors">
                Guardar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalConfirmEliminar({ confirmEliminarLugar, setConfirmEliminarLugar, eliminarLugar }) {
  return (
    <AnimatePresence>
      {confirmEliminarLugar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => setConfirmEliminarLugar(null)} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-sm`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <h2 className="text-base font-bold text-[#111111]">Eliminar «{confirmEliminarLugar.nombre}»</h2>
            </div>
            <p className="text-sm text-[#6b7280] mb-2">Esta acción eliminará permanentemente:</p>
            <ul className="text-sm text-[#6b7280] mb-5 space-y-1 pl-4 list-disc">
              <li>El local y su manager</li>
              <li>Todo el staff asignado</li>
              <li>Todos los clientes y sus valoraciones</li>
            </ul>
            <p className="text-xs text-red-500 font-medium mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminarLugar(null)}
                className="flex-1 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={() => eliminarLugar(confirmEliminarLugar.id)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                Eliminar todo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ModalConfirmBorrar({ confirmBorrar, setConfirmBorrar, borrarCliente }) {
  return (
    <AnimatePresence>
      {confirmBorrar && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={overlay} onClick={() => setConfirmBorrar(null)} />
          <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
            className={`${panel} max-w-sm`}>
            <h2 className="text-base font-bold text-[#111111] mb-2">¿Eliminar cliente?</h2>
            <p className="text-sm text-[#6b7280] mb-5">
              Se eliminará <strong>{confirmBorrar.nombre}</strong> y todas sus valoraciones. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBorrar(null)}
                className="flex-1 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                Cancelar
              </button>
              <button onClick={() => borrarCliente(confirmBorrar.id)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
