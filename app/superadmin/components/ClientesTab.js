'use client'
import { useState } from 'react'
import { MapPin, Search, CheckCircle2, Clock, ChevronDown, ChevronLeft, ChevronRight, Pencil, XCircle } from 'lucide-react'
import { SkeletonPanel } from '../../../components/Skeleton'

export default function ClientesTab({
  clientes, lugares, lugarFiltroClientes, setLugarFiltroClientes,
  barrioFiltro, setBarrioFiltro, busquedaClientes, setBusquedaClientes,
  clientesCargando, cargarClientes, paginacion = { pagina: 1, total: 0, totalPaginas: 1 },
  setModalEditCliente, setFormCliente, setConfirmBorrar, setClientes
}) {
  const barrios = [...new Set(lugares.map(l => l.barrio).filter(Boolean))].sort()
  const lugaresDelBarrio = barrioFiltro ? lugares.filter(l => l.barrio === barrioFiltro) : lugares

  return (
    <>
      {/* Filtros barrio + local */}
      <div className="mb-5 space-y-3">
        {barrios.length > 0 && (
          <div>
            <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1.5 font-medium">Barrio</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setBarrioFiltro(''); setLugarFiltroClientes(''); setClientes([]) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !barrioFiltro ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                }`}
              >Todos</button>
              {barrios.map(b => (
                <button key={b}
                  onClick={() => { setBarrioFiltro(b); setLugarFiltroClientes(''); setClientes([]) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    barrioFiltro === b ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                  }`}
                >{b}</button>
              ))}
            </div>
          </div>
        )}
        <div>
          {barrios.length > 0 && <p className="text-[10px] text-[#9ca3af] uppercase tracking-wider mb-1.5 font-medium">Local</p>}
          <div className="flex flex-wrap gap-2">
            {lugaresDelBarrio.map(l => (
              <button key={l.id}
                onClick={() => { setLugarFiltroClientes(l.id); setClientes([]); cargarClientes('', l.id) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  lugarFiltroClientes === l.id
                    ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                    : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                }`}
              >
                <MapPin size={10} className="inline mr-1" />{l.nombre}
              </button>
            ))}
          </div>
        </div>
        {lugarFiltroClientes && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={14} />
            <input type="text" placeholder="Buscar por nombre..." value={busquedaClientes}
              onChange={e => { setBusquedaClientes(e.target.value); cargarClientes(e.target.value, lugarFiltroClientes) }}
              className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#9ca3af]" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <ClientesList
        clientes={clientes}
        lugarFiltroClientes={lugarFiltroClientes}
        clientesCargando={clientesCargando}
        setModalEditCliente={setModalEditCliente}
        setFormCliente={setFormCliente}
        setConfirmBorrar={setConfirmBorrar}
      />

      {/* Paginación */}
      {lugarFiltroClientes && paginacion.totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-[#f3f4f6]">
          <button
            onClick={() => cargarClientes(busquedaClientes, lugarFiltroClientes, paginacion.pagina - 1)}
            disabled={paginacion.pagina <= 1}
            className="p-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[#6b7280]">
            {paginacion.pagina} / {paginacion.totalPaginas}
            <span className="text-xs text-[#9ca3af] ml-2">({paginacion.total} clientes)</span>
          </span>
          <button
            onClick={() => cargarClientes(busquedaClientes, lugarFiltroClientes, paginacion.pagina + 1)}
            disabled={paginacion.pagina >= paginacion.totalPaginas}
            className="p-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  )
}

function ClientesList({ clientes, lugarFiltroClientes, clientesCargando, setModalEditCliente, setFormCliente, setConfirmBorrar }) {
  if (!lugarFiltroClientes) return (
    <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
      Selecciona un local para ver sus clientes.
    </div>
  )
  if (clientesCargando) return <SkeletonPanel />
  if (clientes.length === 0) return (
    <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
      Sin clientes en este local.
    </div>
  )

  const visitaron = clientes.filter(c => c.verificado)
  const pendientes = clientes.filter(c => !c.verificado)

  return (
    <div className="space-y-4">
      {visitaron.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-[#111111]">Visitaron</span>
            <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">{visitaron.length}</span>
          </div>
          <div className="px-5">{visitaron.map(c => <ClienteRow key={c.id} c={c} setModalEditCliente={setModalEditCliente} setFormCliente={setFormCliente} setConfirmBorrar={setConfirmBorrar} />)}</div>
        </div>
      )}
      {pendientes.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f3f4f6] flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            <span className="text-xs font-semibold text-[#111111]">Pendientes</span>
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-medium">{pendientes.length}</span>
          </div>
          <div className="px-5">{pendientes.map(c => <ClienteRow key={c.id} c={c} setModalEditCliente={setModalEditCliente} setFormCliente={setFormCliente} setConfirmBorrar={setConfirmBorrar} />)}</div>
        </div>
      )}
    </div>
  )
}

function ClienteRow({ c, setModalEditCliente, setFormCliente, setConfirmBorrar }) {
  const [open, setOpen] = useState(false)
  const val = c.valoraciones?.[0]
  const gasto = val?.gasto_confirmado || 0
  const comLugar = val?.comision_lugar || 0
  const comAgencia = val?.comision_agencia || 0
  const comReferidor = val?.comision_referidor || 0
  const comPlataforma = comLugar - comAgencia - comReferidor
  const pctLugar = c.lugares?.porcentaje_plataforma ?? 20
  const hasVal = gasto > 0
  const disc = val?.discrepancia_pct

  const DiscBadge = disc == null ? null : disc < 1 ? null
    : disc < 5 ? <span title={`Discrepancia: ${disc.toFixed(1)}%`} className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">⚠ {disc.toFixed(1)}%</span>
    : disc < 15 ? <span title={`Discrepancia: ${disc.toFixed(1)}%`} className="text-[10px] text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">⚠ {disc.toFixed(1)}%</span>
    : <span title={`Discrepancia: ${disc.toFixed(1)}%`} className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">⚠ {disc.toFixed(1)}%</span>

  return (
    <div className="border-b border-[#f3f4f6] last:border-0">
      <div className="flex items-center justify-between gap-4 py-3">
        <button className="flex-1 min-w-0 text-left" onClick={() => hasVal && setOpen(o => !o)}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#111111] truncate">{c.nombre}</p>
            <span className="text-[10px] text-[#9ca3af]">{c.num_personas} pers. · {c.referidores?.nombre || '—'}</span>
            {hasVal && <span className="text-[10px] font-mono text-[#1e3a5f] bg-[#f0f4f8] px-1.5 py-0.5 rounded">{gasto.toFixed(2)}€</span>}
            {val?.valoracion && (
              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                {'★'.repeat(val.valoracion)}{'☆'.repeat(5 - val.valoracion)}
              </span>
            )}
            {DiscBadge}
            {hasVal && <ChevronDown size={12} className={`text-[#9ca3af] transition-transform ${open ? 'rotate-180' : ''}`} />}
          </div>
          <p className="text-[10px] text-[#9ca3af] mt-0.5">
            {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => { setModalEditCliente(c); setFormCliente({ nombre: c.nombre, num_personas: c.num_personas }) }}
            className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={() => setConfirmBorrar(c)}
            className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
            <XCircle size={12} />
          </button>
        </div>
      </div>
      {open && hasVal && (
        <div className="mb-3 bg-[#fafaf8] border border-[#e5e7eb] rounded-xl p-4 space-y-2">
          <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">Desglose de comisiones</p>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#6b7280]">Consumo (registrado por local)</span>
            <span className="text-xs font-semibold text-[#111111]">{gasto.toFixed(2)}€</span>
          </div>
          {val?.gasto_cliente != null && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#6b7280]">Consumo (según el cliente)</span>
              <span className={`text-xs font-semibold ${disc >= 15 ? 'text-red-600' : disc >= 5 ? 'text-orange-600' : disc >= 1 ? 'text-amber-600' : 'text-[#111111]'}`}>
                {parseFloat(val.gasto_cliente).toFixed(2)}€
                {disc != null && disc >= 1 && <span className="ml-1 font-normal opacity-70">({disc.toFixed(1)}% dif.)</span>}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center py-1.5 border-t border-[#f3f4f6]">
            <span className="text-xs text-[#6b7280]">Comisión total del local <span className="text-[#9ca3af]">({pctLugar}%)</span></span>
            <span className="text-xs font-medium text-[#111111]">{comLugar.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-center pl-3">
            <span className="text-xs text-[#1e3a5f]">→ itrustb2b</span>
            <span className="text-xs font-semibold text-[#1e3a5f]">{comPlataforma.toFixed(2)}€</span>
          </div>
          {comAgencia > 0 && (
            <div className="flex justify-between items-center pl-3">
              <span className="text-xs text-[#6b7280]">→ Agencia <span className="text-[#9ca3af]">({c.referidores?.agencias?.nombre || ''})</span></span>
              <span className="text-xs font-medium text-[#374151]">{comAgencia.toFixed(2)}€</span>
            </div>
          )}
          <div className="flex justify-between items-center pl-3">
            <span className="text-xs text-[#6b7280]">→ Referidor <span className="text-[#9ca3af]">({c.referidores?.nombre || '—'})</span></span>
            <span className="text-xs font-medium text-[#374151]">{comReferidor.toFixed(2)}€</span>
          </div>
          {val?.ticket_url && (
            <div className="pt-2 border-t border-[#f3f4f6]">
              <p className="text-[10px] text-[#9ca3af] mb-2">Foto del ticket</p>
              <img src={val.ticket_url} alt="Ticket" className="w-full max-h-48 object-contain rounded-lg border border-[#e5e7eb]" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
