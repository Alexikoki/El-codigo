'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function ModalNuevoStaff({ t, show, onClose, formStaff, setFormStaff, crearStaff, guardandoStaff, errorStaff }) {
  if (!show) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40" onClick={onClose} />
        <motion.div
          initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base font-bold text-[#111111]">{t('manager','addStaff')}</h3>
              <p className="text-sm text-[#6b7280]">Acceso al escáner QR del local</p>
            </div>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151]" aria-label={t('common','close')}>
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3">
            {[['nombre', 'Nombre completo', 'text'], ['email', 'Email', 'email'], ['password', 'Contraseña (mín. 6 caracteres)', 'password']].map(([key, label, type]) => (
              <div key={key}>
                <label className="text-xs text-[#6b7280] mb-1 block font-medium">{label}</label>
                <input type={type} value={formStaff[key]}
                  onChange={e => setFormStaff(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 bg-white"
                />
              </div>
            ))}
            {errorStaff && <p className="text-xs text-red-500" role="alert">{errorStaff}</p>}
          </div>
          <button onClick={crearStaff} disabled={guardandoStaff}
            className="w-full mt-5 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50">
            {guardandoStaff ? 'Creando...' : 'Crear camarero'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export function ModalTicketAmpliado({ ticketAmpliado, onClose }) {
  if (!ticketAmpliado) return null
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70" />
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-xl"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
            <div>
              <p className="text-sm font-semibold text-[#111111]">{ticketAmpliado.cliente}</p>
              <p className="text-xs text-[#9ca3af]">{ticketAmpliado.fecha} · {ticketAmpliado.hora} · {ticketAmpliado.gasto?.toFixed(2)}€</p>
            </div>
            <button onClick={onClose} className="text-[#9ca3af] hover:text-[#374151] transition-colors" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>
          <img src={ticketAmpliado.ticketUrl} alt="Ticket" className="w-full object-contain max-h-[70vh]" />
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
