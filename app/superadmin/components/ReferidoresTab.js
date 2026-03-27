'use client'
import { Users, FileText } from 'lucide-react'

export default function ReferidoresTab({ referidores, busqueda, appUrl, descargarFactura, toggleActivo }) {
  const filtered = referidores.filter(r => !busqueda || r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || r.email?.toLowerCase().includes(busqueda.toLowerCase()))

  if (filtered.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
        {referidores.length === 0 ? 'Aún no hay registros aquí.' : `Sin resultados para "${busqueda}".`}
      </div>
    )
  }

  return filtered.map(r => (
    <div key={r.id} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 bg-[#f0f4f8] rounded-lg">
            <Users size={16} className="text-[#1e3a5f]" />
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
            r.activo ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-500 border-red-200'
          }`}>
            {r.activo ? 'Activo' : 'Suspendido'}
          </span>
        </div>
        <h3 className="text-base font-semibold text-[#111111] mb-0.5">{r.nombre}</h3>
        <p className="text-sm text-[#6b7280] mb-3">{r.email}</p>
        <p className="text-xs font-mono bg-[#f3f4f6] px-2 py-1.5 rounded-lg text-[#6b7280] border border-[#e5e7eb] truncate">
          {appUrl}/r/{r.qr_token}
        </p>
      </div>
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#f3f4f6]">
        <button onClick={() => descargarFactura(r.id, r.nombre)}
          className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
          <FileText size={13} /> Liquidación
        </button>
        <button onClick={() => toggleActivo('referidor', r.id, r.activo)}
          className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors">
          {r.activo ? 'Suspender' : 'Reactivar'}
        </button>
      </div>
    </div>
  ))
}
