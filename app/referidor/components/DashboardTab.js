'use client'
import { CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardTab({ analytics, liquidaciones }) {
  const cobrado = liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + parseFloat(l.importe), 0)
  const pendiente = liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + parseFloat(l.importe), 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-[#1e3a5f]">
          <p className="text-xs text-[#6b7280] mb-1">Tickets de Grupos</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.exitosMios}</p>
          <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit">
            <CheckCircle2 size={18} className="text-[#1e3a5f]" />
          </div>
        </div>
        <div className="glass-panel p-5 border-l-4 border-l-[#4a9070]">
          <p className="text-xs text-[#6b7280] mb-1">Comision Acumulada</p>
          <p className="text-3xl font-bold text-[#111111]">{analytics.stats.comisionesLiquidadas.toFixed(2)}&euro;</p>
          <div className="mt-3 p-2 bg-[#f0f7f4] rounded-lg w-fit">
            <TrendingUp size={18} className="text-[#4a9070]" />
          </div>
        </div>
      </div>

      {(cobrado > 0 || pendiente > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 border-t-2 border-t-amber-400">
            <p className="text-xs text-[#6b7280] mb-1">Pendiente de cobro</p>
            <p className="text-2xl font-bold text-[#111111]">{pendiente.toFixed(2)}&euro;</p>
            <p className="text-[10px] text-amber-600 mt-1 font-medium">En proceso</p>
          </div>
          <div className="glass-panel p-4 border-t-2 border-t-[#4a9070]">
            <p className="text-xs text-[#6b7280] mb-1">Ya cobrado</p>
            <p className="text-2xl font-bold text-[#111111]">{cobrado.toFixed(2)}&euro;</p>
            <p className="text-[10px] text-[#4a9070] mt-1 font-medium">Liquidado</p>
          </div>
        </div>
      )}

      <div className="glass-panel p-5 h-[320px]">
        <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#1e3a5f]" /> Afluencia Historica
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `\u20AC${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="miComision" name="Comision / Dia" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#colorRef)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
