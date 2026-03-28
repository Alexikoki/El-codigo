'use client'
import { Trophy, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const medalColor = (i) => i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-[#9ca3af]'
const medalBg = (i) => i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-gray-50 border-gray-200' : i === 2 ? 'bg-amber-50 border-amber-200' : 'bg-[#f3f4f6] border-[#e5e7eb]'

export default function RankingTab({ ranking }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-[#111111]">Ranking de Promotores</h2>
        <p className="text-sm text-[#6b7280]">Rendimiento individual de tu equipo.</p>
      </div>

      {ranking.length > 0 && (
        <div className="glass-panel p-5 h-[260px]">
          <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-4">Volumen por promotor (€)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={ranking.slice(0, 8)} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="nombre" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false}
                tickFormatter={v => v.split(' ')[0]} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `€${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }}
                formatter={(v) => [`${v}€`, 'Volumen']} />
              <Bar dataKey="volumen" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-3">
        {ranking.map((p, i) => (
          <div key={p.id} className="glass-panel p-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${medalBg(i)}`}>
              <span className={medalColor(i)}>#{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-[#111111] text-sm">{p.nombre}</p>
                {!p.activo && <span className="text-[10px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full">Inactivo</span>}
              </div>
              <div className="flex gap-3 mt-1.5 flex-wrap">
                <span className="text-xs text-[#6b7280]">{p.operaciones} operaciones</span>
                <span className="text-xs text-[#4a9070] font-medium">{p.comisionAgencia.toFixed(2)}€ para agencia</span>
                {p.ultimaActividad && (
                  <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                    <Clock size={10} /> {new Date(p.ultimaActividad).toLocaleDateString('es-ES')}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-[#111111]">{p.volumen.toFixed(2)}€</p>
              <p className="text-[10px] text-[#9ca3af]">volumen</p>
            </div>
          </div>
        ))}
        {ranking.length === 0 && (
          <div className="text-center py-12 text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
            Aún no hay operaciones registradas en tu red.
          </div>
        )}
      </div>
    </div>
  )
}
