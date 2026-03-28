'use client'
import { PlusCircle, Link as LinkIcon } from 'lucide-react'

export default function EquipoTab({ equipo, ranking, toggleActivo, setShowAddModal }) {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-[#111111]">Equipo de Promotores</h2>
          <p className="text-sm text-[#6b7280]">RRPPs inscritos en tu red.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <PlusCircle size={15} /> <span className="hidden sm:inline">Nuevo Promotor</span>
        </button>
      </div>

      <div className="space-y-3">
        {equipo.map((r) => {
          const stats = ranking.find(p => p.id === r.id)
          return (
            <div key={r.id} className="glass-panel p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#111111] flex items-center gap-2">
                    {r.nombre}
                    {!r.activo && <span className="text-[10px] bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactivo</span>}
                  </p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{r.email}</p>
                  <div className="flex gap-3 mt-2 text-xs flex-wrap">
                    <span className="text-[#4a9070] bg-[#f0f7f4] border border-[#c8e6d8] px-2 py-1 rounded-md">
                      Split: {r.porcentaje_split}%
                    </span>
                    <span className="text-[#6b7280] flex items-center gap-1 font-mono">
                      <LinkIcon size={11} /> {r.qr_token}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleActivo(r.id, r.activo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex-shrink-0 ${
                    r.activo ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {r.activo ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>

              {stats && (
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#f3f4f6]">
                  <div className="text-center">
                    <p className="text-base font-bold text-[#111111]">{stats.operaciones}</p>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">operaciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-[#111111]">{stats.volumen.toFixed(2)}€</p>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">volumen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-[#4a9070]">{stats.comisionAgencia.toFixed(2)}€</p>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">para agencia</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {equipo.length === 0 && (
          <div className="text-center py-12 text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
            Ficha a tu primer promotor pulsando el botón superior.
          </div>
        )}
      </div>
    </div>
  )
}
