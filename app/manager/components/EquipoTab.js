'use client'
import { motion } from 'framer-motion'
import { Shield, UserPlus, ToggleLeft, ToggleRight } from 'lucide-react'

export default function EquipoTab({ t, staffList, cargandoStaff, toggleStaff, setModalNuevoStaff, setErrorStaff }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#111111]">{t('manager','staffTitle')}</h2>
        <button onClick={() => { setModalNuevoStaff(true); setErrorStaff('') }}
          className="flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <UserPlus size={15} /> {t('manager','addStaff')}
        </button>
      </div>

      {cargandoStaff ? (
        <div className="py-10 text-center text-sm text-[#9ca3af]">{t('common','loading')}</div>
      ) : staffList.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-[#e5e7eb] rounded-2xl bg-white">
          <Shield size={32} className="text-[#d1d5db] mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">Aún no hay camareros registrados</p>
          <p className="text-[#9ca3af] text-xs mt-1">Añade el primer camarero para que pueda escanear QRs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staffList.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s.activo ? 'bg-[#f0f4f8] text-[#1e3a5f]' : 'bg-[#f3f4f6] text-[#9ca3af]'}`}>
                  {s.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-sm font-medium ${s.activo ? 'text-[#111111]' : 'text-[#9ca3af]'}`}>{s.nombre}</p>
                  <p className="text-xs text-[#9ca3af]">{s.email}</p>
                </div>
              </div>
              <button onClick={() => toggleStaff(s.id, s.activo)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${s.activo ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 'bg-[#f3f4f6] border-[#e5e7eb] text-[#9ca3af] hover:bg-green-50 hover:border-green-200 hover:text-green-700'}`}>
                {s.activo ? <><ToggleRight size={14} /> {t('common','active')}</> : <><ToggleLeft size={14} /> {t('common','inactive')}</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
