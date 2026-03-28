'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldAlert, X } from 'lucide-react'

const inputClass = "w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"

export function ModalCrearPromotor({ show, onClose, nuevoRef, setNuevoRef, handleCrearPromotor, addCargando, addError }) {
  if (!show) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30" onClick={onClose} />
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
          className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-[#111111] mb-5">Añadir Promotor</h3>
          <form onSubmit={handleCrearPromotor} className="space-y-4">
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Nombre / Alias</label>
              <input type="text" value={nuevoRef.nombre} onChange={e => setNuevoRef({ ...nuevoRef, nombre: e.target.value })} className={inputClass} placeholder="Nombre del promotor" />
            </div>
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Correo electrónico</label>
              <input type="email" value={nuevoRef.email} onChange={e => setNuevoRef({ ...nuevoRef, email: e.target.value })} className={inputClass} placeholder="email@ejemplo.com" />
            </div>
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Contraseña de acceso</label>
              <input type="password" value={nuevoRef.password} onChange={e => setNuevoRef({ ...nuevoRef, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-xs text-[#374151] mb-2 flex justify-between">
                <span>División de comisión</span>
                <span className="font-semibold text-[#4a9070]">{nuevoRef.split}% Promotor / {100 - nuevoRef.split}% Agencia</span>
              </label>
              <input type="range" min="1" max="99" step="1" value={nuevoRef.split}
                onChange={e => setNuevoRef({ ...nuevoRef, split: e.target.value })}
                className="w-full accent-[#1e3a5f]" />
              <p className="text-[10px] text-[#9ca3af] mt-1">% de comisiones que ingresará este promotor. La agencia se queda el resto.</p>
            </div>
            {addError && <p className="text-xs text-red-500 flex items-center gap-1" role="alert"><ShieldAlert size={12} />{addError}</p>}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 text-sm text-[#6b7280] hover:text-[#374151] transition-colors border border-[#e5e7eb] rounded-lg">
                Cancelar
              </button>
              <button type="submit" disabled={addCargando}
                className="flex-1 py-2.5 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">
                {addCargando ? 'Guardando...' : 'Fichar Promotor'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function ModalNuevaLiquidacion({ show, onClose, formLiq, setFormLiq, equipo, crearLiquidacion, liqCargando }) {
  if (!show) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30" onClick={onClose} />
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
          className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-[#111111]">Nueva Liquidación</h3>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]" aria-label="Cerrar"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Promotor</label>
              <select value={formLiq.referidor_id} onChange={e => setFormLiq({ ...formLiq, referidor_id: e.target.value })}
                className={inputClass + ' appearance-none'}>
                <option value="">Seleccionar promotor...</option>
                {equipo.filter(r => r.activo).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Importe (€)</label>
              <input type="number" step="0.01" min="0" placeholder="0.00" value={formLiq.importe}
                onChange={e => setFormLiq({ ...formLiq, importe: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Desde</label>
                <input type="date" value={formLiq.periodo_desde}
                  onChange={e => setFormLiq({ ...formLiq, periodo_desde: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[#6b7280] mb-1 block">Hasta</label>
                <input type="date" value={formLiq.periodo_hasta}
                  onChange={e => setFormLiq({ ...formLiq, periodo_hasta: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b7280] mb-1 block">Notas (opcional)</label>
              <input placeholder="Periodo mensual, bonificación..." value={formLiq.notas}
                onChange={e => setFormLiq({ ...formLiq, notas: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose}
              className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
              Cancelar
            </button>
            <button onClick={crearLiquidacion} disabled={liqCargando}
              className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {liqCargando ? 'Guardando...' : 'Crear Liquidación'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function ModalConfirmPago({ confirmPago, onClose, marcarPagado }) {
  if (!confirmPago) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30" onClick={onClose} />
        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
          className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-[#111111] mb-2">¿Confirmar pago?</h3>
          <p className="text-sm text-[#6b7280] mb-1">
            Vas a marcar como pagada la liquidación de <span className="font-medium text-[#111111]">{confirmPago.agencia_id ? 'mi agencia' : confirmPago.referidores?.nombre}</span>.
          </p>
          <p className="text-2xl font-bold text-[#111111] mb-5">{confirmPago.importe.toFixed(2)}€</p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
              Cancelar
            </button>
            <button onClick={() => marcarPagado(confirmPago.id)}
              className="flex-1 bg-[#4a9070] hover:bg-[#3d7a5e] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
              Confirmar pago
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
