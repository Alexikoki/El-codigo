'use client'
import { Users, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardTab({ analytics }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-[#1e3a5f]">
          <p className="text-xs text-[#6b7280] mb-1">Volumen Traído por Promotores</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.volumenEurosGlobal.toFixed(2)}€</p>
          <p className="text-xs text-[#6b7280] mt-2">{analytics.stats.operacionesTotales} turistas validados</p>
          <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit"><Users size={16} className="text-[#1e3a5f]" /></div>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-[#4a9070]">
          <p className="text-xs text-[#6b7280] mb-1">Ingreso Agencia (Mi Split)</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.comisionesAgencia.toFixed(2)}€</p>
          <p className="text-xs text-[#9ca3af] mt-2">Deduciendo la parte del Código</p>
          <div className="mt-3 p-2 bg-[#f0f7f4] rounded-lg w-fit"><TrendingUp size={16} className="text-[#4a9070]" /></div>
        </div>
      </div>

      <div className="glass-panel p-5 h-[320px]">
        <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
          <TrendingUp size={15} className="text-[#4a9070]" /> Beneficio Neto
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4a9070" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#4a9070" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }} />
            <Area type="monotone" dataKey="miComision" name="Comisión / Día" stroke="#4a9070" strokeWidth={2} fillOpacity={1} fill="url(#colorAg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
