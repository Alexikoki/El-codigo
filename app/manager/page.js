'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, BarChart3, TrendingDown, Building2, Receipt, Activity, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@supabase/supabase-js'

export default function ManagerPage() {
    const [manager, setManager] = useState(null)
    const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, deudaAcumulada: 0 } })
    const [cargando, setCargando] = useState(true)
    const [ultimaValidacion, setUltimaValidacion] = useState(null) // Ticker realtime
    const [segsDesde, setSegsDesde] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const rol = localStorage.getItem('rol')
        const m = localStorage.getItem('manager')

        if (!m || rol !== 'manager') {
            router.push('/login')
            return
        }

        const managerObj = JSON.parse(m)
        setManager(managerObj)
        cargarAnalytics()

        // === SUPABASE REALTIME ===
        // Crear cliente solo con la clave pública (no necesita service role)
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
                filter: `lugar_id=eq.${managerObj.lugarId || '00000000-0000-0000-0000-000000000000'}`
            }, (payload) => {
                setUltimaValidacion(payload.new)
                setSegsDesde(0)
                // Recargar las estadísticas para actualizar los contadores
                cargarAnalytics()
            })
            .subscribe()

        // Actualizar el ticker de "hace X segundos" cada segundo
        const intervalo = setInterval(() => {
            setSegsDesde(prev => prev !== null ? prev + 1 : null)
        }, 1000)

        return () => {
            supabase.removeChannel(canal)
            clearInterval(intervalo)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router])

    const cargarAnalytics = async () => {
        try {
            const resA = await fetch('/api/analytics/manager', { credentials: 'include' })
            if (resA.ok) { setAnalytics(await resA.json()) }
        } catch (e) {
            console.error(e)
        } finally {
            setCargando(false)
        }
    }

    // Animaciones Framer Motion
    const containerVars = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVars = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Navbar Glass */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-400" />
                        Panel del Local
                    </h1>
                    <p className="text-sm text-gray-400 font-light">{manager?.lugarNombre} ({manager?.nombre})</p>
                </div>
                <button
                    onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
            </motion.nav>

            <main className="max-w-4xl mx-auto p-6 mt-8 elevate-3d">
                <motion.div
                    variants={containerVars}
                    initial="hidden"
                    animate="show"
                    className="space-y-8"
                >
                    {cargando ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <motion.div variants={itemVars} className="space-y-6">

                            {/* Ticker Realtime */}
                            <AnimatePresence>
                                {ultimaValidacion && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3.5 text-sm"
                                    >
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                                        <Zap size={14} className="text-green-400 flex-shrink-0" />
                                        <span className="text-green-300 font-medium">
                                            Validación en tiempo real
                                        </span>
                                        <span className="text-gray-400 text-xs ml-auto">
                                            {segsDesde !== null ? `Hace ${segsDesde}s` : 'Ahora'}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Tarjetas Superiores */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Volumen Traído por El Código</p>
                                            <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.volumenEuros.toFixed(2)}€</h3>
                                            <p className="text-xs text-emerald-400 mt-2">{analytics.stats.operaciones} clientes validados</p>
                                        </div>
                                        <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><BarChart3 size={24} /></div>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500 relative overflow-hidden">
                                    <div className="absolute -right-4 -bottom-4 opacity-10 text-red-500"><Receipt size={100} /></div>
                                    <div className="flex justify-between items-start relative z-10">
                                        <div>
                                            <p className="text-sm font-medium text-gray-400">Deuda Plataforma (Comisión)</p>
                                            <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.deudaAcumulada.toFixed(2)}€</h3>
                                            <p className="text-xs text-gray-500 mt-2">Facturación correspondiente a este periodo</p>
                                        </div>
                                        <div className="p-3 bg-red-500/20 rounded-xl text-red-400"><TrendingDown size={24} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Gráfica de Deuda/Volumen */}
                            <div className="glass-panel p-6 rounded-2xl h-[350px] w-full mt-6">
                                <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><TrendingDown size={20} className="text-red-400" /> Histórico de Comisiones</h3>
                                <ResponsiveContainer width="100%" height="85%">
                                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorDeuda" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                            itemStyle={{ color: '#e5e7eb' }}
                                        />
                                        <Area type="monotone" dataKey="deudaTotal" name="Comisión al Código" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDeuda)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    )
}

