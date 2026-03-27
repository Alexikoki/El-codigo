'use client'
import { BarChart3, TrendingUp, HandCoins, Users, Download } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AnalyticsTab({
  analytics, discrepancias, filtroFecha, setFiltroFecha,
  fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
  cargarAnalytics, exportarExcel, t
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[['hoy', t('common','today')], ['semana', t('common','week')], ['mes', t('common','month')], ['año', t('common','year')], ['todo', t('common','total')]].map(([key, label]) => (
            <button key={key} onClick={() => { setFiltroFecha(key); cargarAnalytics(key) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filtroFecha === key
                  ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                  : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'
              }`}>{label}</button>
          ))}
          <div className="flex gap-1.5 items-center">
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f]" />
            <span className="text-xs text-[#9ca3af]">—</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f]" />
            <button onClick={() => { setFiltroFecha('custom'); cargarAnalytics('custom') }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
              {t('common','confirm')}
            </button>
          </div>
        </div>
        <button onClick={exportarExcel}
          className="flex items-center gap-2 border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] text-[#374151] px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start">
          <Download size={14} /> {t('superadmin','exportExcel')}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border-t-2 border-t-[#1e3a5f]">
          <p className="text-xs text-[#6b7280] mb-1">Total Operaciones</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.operaciones}</p>
          <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit"><TrendingUp size={16} className="text-[#1e3a5f]" /></div>
        </div>
        <div className="glass-panel p-5 border-t-2 border-t-[#6b7280]">
          <p className="text-xs text-[#6b7280] mb-1">Volumen Traído</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.volumenEuros}€</p>
          <div className="mt-3 p-2 bg-[#f3f4f6] rounded-lg w-fit"><HandCoins size={16} className="text-[#6b7280]" /></div>
        </div>
        <div className="glass-panel p-5 border-t-2 border-t-[#4a9070]">
          <p className="text-xs text-[#6b7280] mb-1">Comisiones R.R.P.P</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.comisionGenerada.toFixed(2)}€</p>
          <div className="mt-3 p-2 bg-[#f0f7f4] rounded-lg w-fit"><Users size={16} className="text-[#4a9070]" /></div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="glass-panel p-5 h-[350px]">
        <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-[#1e3a5f]" /> Afluencia Histórica
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }} />
            <Area type="monotone" dataKey="gastoTotal" name="Volumen (€)" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#colorGasto)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Discrepancias */}
      <DiscrepanciasPanel discrepancias={discrepancias} />
    </div>
  )
}

function DiscrepanciasPanel({ discrepancias }) {
  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
        ⚠ Discrepancias de consumo
        {discrepancias.resumen.total > 0 && (
          <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{discrepancias.resumen.total} casos</span>
        )}
      </h3>

      {discrepancias.resumen.total === 0 ? (
        <p className="text-sm text-[#9ca3af] text-center py-4">Sin discrepancias en el período seleccionado.</p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-600 mb-1">Leves (1-5%)</p>
              <p className="text-2xl font-bold text-amber-700">{discrepancias.resumen.amarillas}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <p className="text-xs text-orange-600 mb-1">Moderadas (5-15%)</p>
              <p className="text-2xl font-bold text-orange-700">{discrepancias.resumen.naranjas}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-xs text-red-600 mb-1">Graves (&gt;15%)</p>
              <p className="text-2xl font-bold text-red-700">{discrepancias.resumen.rojas}</p>
            </div>
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-3 text-center">
              <p className="text-xs text-[#6b7280] mb-1">Diferencia total</p>
              <p className="text-2xl font-bold text-[#111111]">{discrepancias.resumen.diferencia_total.toFixed(2)}€</p>
            </div>
          </div>

          {discrepancias.porMes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Por mes</p>
              <div className="space-y-1">
                {discrepancias.porMes.map(m => (
                  <div key={m.mes} className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-0">
                    <span className="text-sm font-medium text-[#374151]">
                      {new Date(m.mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      {m.amarillas > 0 && <span className="text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">⚠ {m.amarillas}</span>}
                      {m.naranjas > 0 && <span className="text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">⚠ {m.naranjas}</span>}
                      {m.rojas > 0 && <span className="text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">⚠ {m.rojas}</span>}
                      <span className="text-[#6b7280] font-mono ml-1">{m.diferencia_total.toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {discrepancias.porLocal.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2">Por local</p>
              <div className="space-y-1">
                {discrepancias.porLocal.map(l => (
                  <div key={l.lugarId} className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-0">
                    <span className="text-sm font-medium text-[#374151]">{l.lugarNombre}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {l.amarillas > 0 && <span className="text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">⚠ {l.amarillas}</span>}
                      {l.naranjas > 0 && <span className="text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">⚠ {l.naranjas}</span>}
                      {l.rojas > 0 && <span className="text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">⚠ {l.rojas}</span>}
                      <span className="text-[#6b7280] font-mono ml-1">{l.diferencia_total.toFixed(2)}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
