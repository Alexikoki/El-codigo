'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, BarChart3, TrendingDown, Building2, Receipt, Zap } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@supabase/supabase-js'

export default function ManagerPage() {
  const [manager, setManager] = useState(null)
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, deudaAcumulada: 0 } })
  const [cargando, setCargando] = useState(true)
  const [ultimaValidacion, setUltimaValidacion] = useState(null)
  const [segsDesde, setSegsDesde] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    const m = localStorage.getItem('manager')
    if (m && rol === 'manager') { setManager(JSON.parse(m)); cargarAnalytics(); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'manager') {
          localStorage.setItem('rol', 'manager')
          localStorage.setItem('manager', JSON.stringify(data.manager))
          setManager(data.manager)
          cargarAnalytics()
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!manager) return

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const canal = supabase
      .channel('validaciones-manager')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'valoraciones',
        filter: `lugar_id=eq.${manager.lugarId || '00000000-0000-0000-0000-000000000000'}`
      }, (payload) => {
        setUltimaValidacion(payload.new)
        setSegsDesde(0)
        cargarAnalytics()
      })
      .subscribe()

    const intervalo = setInterval(() => {
      setSegsDesde(prev => prev !== null ? prev + 1 : null)
    }, 1000)

    return () => {
      supabase.removeChannel(canal)
      clearInterval(intervalo)
    }
  }, [manager])

  const cargarAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/manager', { credentials: 'include' })
      if (res.ok) setAnalytics(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f0f4f8] rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#111111]">Panel del Local</h1>
            <p className="text-xs text-[#6b7280]">{manager?.lugarNombre} · {manager?.nombre}</p>
          </div>
        </div>
        <button
          onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
          className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </nav>

      <main className="max-w-3xl mx-auto p-5 mt-6">
        {cargando ? <SkeletonPanel /> : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >

            {/* Ticker Realtime */}
            <AnimatePresence>
              {ultimaValidacion && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3.5 text-sm"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                  <Zap size={14} className="text-green-600 flex-shrink-0" />
                  <span className="text-green-700 font-medium">Nueva validación en tiempo real</span>
                  <span className="text-[#9ca3af] text-xs ml-auto">
                    {segsDesde !== null ? `Hace ${segsDesde}s` : 'Ahora'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tarjetas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-panel p-5 border-l-4 border-l-[#1e3a5f]">
                <p className="text-xs text-[#6b7280] mb-1">Volumen Traído por El Código</p>
                <p className="text-3xl font-bold text-[#111111]">{analytics.stats.volumenEuros.toFixed(2)}€</p>
                <p className="text-xs text-[#6b7280] mt-2">{analytics.stats.operaciones} clientes validados</p>
                <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit">
                  <BarChart3 size={16} className="text-[#1e3a5f]" />
                </div>
              </div>

              <div className="glass-panel p-5 border-l-4 border-l-red-400">
                <p className="text-xs text-[#6b7280] mb-1">Deuda Plataforma (Comisión)</p>
                <p className="text-3xl font-bold text-[#111111]">{analytics.stats.deudaAcumulada.toFixed(2)}€</p>
                <p className="text-xs text-[#9ca3af] mt-2">Facturación correspondiente al periodo</p>
                <div className="mt-3 p-2 bg-red-50 rounded-lg w-fit">
                  <Receipt size={16} className="text-red-400" />
                </div>
              </div>
            </div>

            {/* Gráfica */}
            <div className="glass-panel p-5 h-[320px]">
              <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
                <TrendingDown size={15} className="text-red-400" /> Histórico de Comisiones
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeuda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="deudaTotal" name="Comisión al Código" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDeuda)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  )
}
