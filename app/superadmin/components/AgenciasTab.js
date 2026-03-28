'use client'
import { Building2, Plus } from 'lucide-react'
import { SkeletonPanel } from '../../../components/Skeleton'

export default function AgenciasTab({ agencias, cargando, toggleActivoAgencia, setModal, setForm }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-[#111111]">Agencias</h2>
        <button
          onClick={() => { setModal('agencia'); setForm({}) }}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Nueva Agencia
        </button>
      </div>

      {cargando && <SkeletonPanel />}

      {!cargando && agencias.length === 0 && (
        <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
          No hay agencias registradas todavía.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!cargando && agencias.map(a => (
          <div key={a.id} className="glass-panel p-5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-[#f0f4f8] rounded-lg">
                  <Building2 size={16} className="text-[#1e3a5f]" />
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
                  a.activo ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-500 border-red-200'
                }`}>
                  {a.activo ? 'Activa' : 'Suspendida'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#111111] mb-0.5">{a.nombre}</h3>
              <p className="text-sm text-[#6b7280]">{a.email}</p>
              <p className="text-xs text-[#9ca3af] mt-2">
                Alta: {new Date(a.creado_en).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-[#f3f4f6]">
              <button onClick={() => toggleActivoAgencia(a.id, a.activo)}
                className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors">
                {a.activo ? 'Suspender' : 'Reactivar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
