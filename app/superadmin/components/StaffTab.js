'use client'
import { UserCheck, MapPin } from 'lucide-react'

export default function StaffTab({ staff, busqueda }) {
  const filtered = staff.filter(s => !busqueda || s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || s.email?.toLowerCase().includes(busqueda.toLowerCase()))

  if (filtered.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
        {staff.length === 0 ? 'Aún no hay registros aquí.' : `Sin resultados para "${busqueda}".`}
      </div>
    )
  }

  return filtered.map(s => (
    <div key={s.id} className="glass-panel p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 bg-[#f0f4f8] rounded-lg">
            <UserCheck size={16} className="text-[#1e3a5f]" />
          </div>
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border bg-[#f0f4f8] text-[#1e3a5f] border-[#dce7f3]">
            Staff
          </span>
        </div>
        <h3 className="text-base font-semibold text-[#111111] mb-0.5">{s.nombre}</h3>
        <p className="text-sm text-[#6b7280] mb-2">{s.email}</p>
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#f3f4f6] rounded-md text-xs text-[#6b7280] border border-[#e5e7eb]">
          <MapPin size={10} /> {s.lugares?.nombre || 'Sin local asignado'}
        </div>
      </div>
    </div>
  ))
}
