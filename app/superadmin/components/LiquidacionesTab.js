'use client'
import { Plus, Download, Clock, FileText, CheckCircle2, CreditCard } from 'lucide-react'
import { SkeletonPanel } from '../../../components/Skeleton'

export default function LiquidacionesTab({
  liquidaciones, cargando, referidores, lugares,
  filtroEstado, setFiltroEstado, filtroReferidor, setFiltroReferidor,
  filtroLugarPagos, setFiltroLugarPagos,
  setModalLiq, setConfirmPago, descargarFactura, exportarLiquidacionesPDF
}) {
  const totalPendiente = liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + parseFloat(l.importe), 0)
  const totalPagado = liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + parseFloat(l.importe), 0)
  const numPendientes = liquidaciones.filter(l => l.estado === 'pendiente').length

  const filtradas = liquidaciones.filter(l => {
    if (filtroEstado && l.estado !== filtroEstado) return false
    if (filtroReferidor && l.referidor_id !== filtroReferidor) return false
    if (filtroLugarPagos && l.referidores?.lugar_id !== filtroLugarPagos) return false
    return true
  })

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-[#111111]">Historial de Liquidaciones</h2>
        <div className="flex gap-2">
          <button onClick={exportarLiquidacionesPDF}
            className="flex items-center gap-2 border border-[#e5e7eb] hover:border-[#d1d5db] bg-white text-[#374151] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Download size={14} /> PDF
          </button>
          <button onClick={() => setModalLiq(true)}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={15} /> Nueva Liquidación
          </button>
        </div>
      </div>

      {/* Métricas resumen */}
      {!cargando && liquidaciones.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel p-4 border-t-2 border-t-amber-400">
            <p className="text-xs text-[#6b7280] mb-1">Pendiente de pago</p>
            <p className="text-2xl font-bold text-[#111111]">{totalPendiente.toFixed(2)}€</p>
            <p className="text-[10px] text-[#9ca3af] mt-1">{numPendientes} liquidación{numPendientes !== 1 ? 'es' : ''}</p>
          </div>
          <div className="glass-panel p-4 border-t-2 border-t-[#4a9070]">
            <p className="text-xs text-[#6b7280] mb-1">Total pagado</p>
            <p className="text-2xl font-bold text-[#111111]">{totalPagado.toFixed(2)}€</p>
            <p className="text-[10px] text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pagado').length} pagos</p>
          </div>
          <div className="glass-panel p-4 border-t-2 border-t-[#1e3a5f]">
            <p className="text-xs text-[#6b7280] mb-1">Total emitido</p>
            <p className="text-2xl font-bold text-[#111111]">{(totalPendiente + totalPagado).toFixed(2)}€</p>
            <p className="text-[10px] text-[#9ca3af] mt-1">{liquidaciones.length} total</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      {!cargando && liquidaciones.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f] transition-colors appearance-none">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
          <select value={filtroReferidor} onChange={e => setFiltroReferidor(e.target.value)}
            className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f] transition-colors appearance-none flex-1">
            <option value="">Todos los referidores</option>
            {referidores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <select value={filtroLugarPagos} onChange={e => setFiltroLugarPagos(e.target.value)}
            className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f] transition-colors appearance-none flex-1">
            <option value="">Todos los locales</option>
            {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          {(filtroEstado || filtroReferidor || filtroLugarPagos) && (
            <button onClick={() => { setFiltroEstado(''); setFiltroReferidor(''); setFiltroLugarPagos('') }}
              className="text-xs text-[#6b7280] hover:text-[#111111] px-3 py-2 border border-[#e5e7eb] rounded-lg bg-white transition-colors whitespace-nowrap">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {cargando && <SkeletonPanel />}

      {!cargando && filtradas.length === 0 && (
        <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
          {liquidaciones.length === 0 ? 'No hay liquidaciones todavía.' : 'No hay resultados con los filtros aplicados.'}
        </div>
      )}

      {!cargando && filtradas.map(liq => (
        <div key={liq.id} className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-semibold text-[#111111]">
                {liq.agencias?.nombre
                  ? `🏢 ${liq.agencias.nombre}`
                  : liq.referidores?.nombre || '—'}
              </p>
              {liq.origen === 'auto' && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#1e3a5f] font-medium border border-[#dce6f0]">Auto</span>
              )}
              <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                liq.estado === 'pagado'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {liq.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
              </span>
            </div>
            <p className="text-xs text-[#6b7280]">
              {liq.agencias?.nombre ? 'Agencia' : liq.referidores?.email || ''}
            </p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                <Clock size={11} /> {liq.periodo_desde} → {liq.periodo_hasta}
              </span>
              {liq.notas && (
                <span className="text-xs text-[#9ca3af] italic truncate max-w-[200px]">
                  {liq.notas.replace(/\s*\[id:[^\]]+\]/, '')}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 sm:flex-col sm:items-end">
            <p className="text-xl font-bold text-[#111111]">{parseFloat(liq.importe).toFixed(2)}€</p>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {liq.referidor_id && liq.referidores?.nombre && (
                <button
                  onClick={() => descargarFactura(liq.referidor_id, liq.referidores.nombre)}
                  className="text-xs flex items-center gap-1.5 bg-[#f0f4f8] hover:bg-[#dce6f0] text-[#1e3a5f] border border-[#dce6f0] px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <FileText size={12} /> PDF
                </button>
              )}
              {liq.estado === 'pendiente' && (
                <button
                  onClick={() => setConfirmPago(liq)}
                  className="text-xs flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <CheckCircle2 size={12} /> Marcar pagado
                </button>
              )}
            </div>
            {liq.estado === 'pagado' && liq.pagado_at && (
              <p className="text-[10px] text-[#9ca3af]">
                Pagado el {new Date(liq.pagado_at).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
