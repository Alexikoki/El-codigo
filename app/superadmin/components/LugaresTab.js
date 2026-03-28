'use client'
import { MapPin, Pencil, Trash2 } from 'lucide-react'

export default function LugaresTab({ lugares, busqueda, toggleActivo, setModalEditar, setForm, setConfirmEliminarLugar, appUrl }) {
  const filtered = lugares.filter(l => !busqueda || l.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || l.tipo?.toLowerCase().includes(busqueda.toLowerCase()))

  if (filtered.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
        {lugares.length === 0 ? 'Aún no hay registros aquí.' : `Sin resultados para "${busqueda}".`}
      </div>
    )
  }

  return filtered.map(l => (
    <div key={l.id} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="p-2 bg-[#f0f4f8] rounded-lg">
            <MapPin size={16} className="text-[#1e3a5f]" />
          </div>
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
            l.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
          }`}>
            {l.activo ? 'Operativo' : 'Pausado'}
          </span>
        </div>
        <h3 className="text-base font-semibold text-[#111111] mb-0.5">{l.nombre}</h3>
        <p className="text-sm text-[#6b7280] mb-3">{l.tipo}</p>
        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-[#f0f4f8] text-[#1e3a5f] px-2 py-1 rounded-md font-medium">
            {l.descuento ?? 10}% dto. turistas
          </span>
          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md font-medium">
            {l.porcentaje_plataforma ?? 20}% comisión
          </span>
        </div>
        {l.managers_locales?.[0] ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#e5e7eb] flex items-center justify-center text-xs font-bold text-[#374151]">
              {l.managers_locales[0].nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-medium text-[#374151]">{l.managers_locales[0].nombre}</p>
              <p className="text-[10px] text-[#9ca3af]">{l.managers_locales[0].email}</p>
            </div>
            <button onClick={() => { setModalEditar(l); setForm({ nombre: l.nombre, descuento: l.descuento, porcentaje_plataforma: l.porcentaje_plataforma ?? 20, barrio: l.barrio || '' }) }}
              className="ml-auto text-[#9ca3af] hover:text-[#1e3a5f] transition-colors p-1">
              <Pencil size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-400">Sin manager asignado</p>
            <button onClick={() => { setModalEditar(l); setForm({ nombre: l.nombre, descuento: l.descuento, porcentaje_plataforma: l.porcentaje_plataforma ?? 20, barrio: l.barrio || '' }) }}
              className="text-[#9ca3af] hover:text-[#1e3a5f] transition-colors p-1">
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f3f4f6]">
        <p className="text-xs text-[#9ca3af] truncate pr-4">{l.direccion}</p>
        <div className="flex items-center gap-3">
          <button onClick={() => toggleActivo('lugar', l.id, l.activo)} className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors whitespace-nowrap">
            {l.activo ? 'Desactivar' : 'Activar'}
          </button>
          <button onClick={() => setConfirmEliminarLugar(l)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar local">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  ))
}
