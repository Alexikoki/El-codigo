'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, BarChart3, TrendingUp, Briefcase, PlusCircle, Users, Link as LinkIcon, Trash2, ShieldAlert } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AgenciaPage() {
    const [agencia, setAgencia] = useState(null)
    const [token, setToken] = useState(null)
    const [tab, setTab] = useState('dashboard') // dashboard o equipo
    const [analytics, setAnalytics] = useState({ chartData: [], stats: { operacionesTotales: 0, volumenEurosGlobal: 0, comisionesAgencia: 0 } })
    const [equipo, setEquipo] = useState([])
    const [cargando, setCargando] = useState(true)

    // Nuevo Promotor Form
    const [showAddModal, setShowAddModal] = useState(false)
    const [nuevoRef, setNuevoRef] = useState({ nombre: '', email: '', password: '', split: 50 })
    const [addCargando, setAddCargando] = useState(false)
    const [addError, setAddError] = useState('')

    const router = useRouter()

    useEffect(() => {
        const t = localStorage.getItem('token')
        const rol = localStorage.getItem('rol')
        const a = localStorage.getItem('agencia')

        if (!t || rol !== 'agencia') {
            router.push('/login')
            return
        }

        const agenciaObj = JSON.parse(a)
        setToken(t)
        setAgencia(agenciaObj)
        cargarDatosGenerales(t)
    }, [router])

    const cargarDatosGenerales = async (t) => {
        try {
            const headers = { Authorization: `Bearer ${t}` }
            const [resA, resE] = await Promise.all([
                fetch('/api/analytics/agencia', { headers }),
                fetch('/api/agencias/promotores', { headers })
            ])

            if (resA.ok) setAnalytics(await resA.json())
            if (resE.ok) {
                const dataE = await resE.json()
                setEquipo(dataE.promotores || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setCargando(false)
        }
    }

    const handleCrearPromotor = async (e) => {
        e.preventDefault()
        if (!nuevoRef.nombre || !nuevoRef.email || !nuevoRef.password) {
            setAddError('Rellena todos los campos.')
            return
        }
        setAddCargando(true)
        setAddError('')

        try {
            const res = await fetch('/api/agencias/promotores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...nuevoRef, porcentaje_split: nuevoRef.split })
            })
            const data = await res.json()

            if (res.ok) {
                setEquipo([data.promotor, ...equipo])
                setShowAddModal(false)
                setNuevoRef({ nombre: '', email: '', password: '', split: 50 })
            } else {
                setAddError(data.error || 'Fallo desconocido al crear rpp')
            }
        } catch (err) {
            setAddError('Fallo de conexión')
        } finally {
            setAddCargando(false)
        }
    }

    const toggleActivo = async (id, currentStatus) => {
        try {
            const res = await fetch('/api/agencias/promotores', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, activo: !currentStatus })
            })
            if (res.ok) {
                setEquipo(equipo.map(r => r.id === id ? { ...r, activo: !currentStatus } : r))
            }
        } catch (e) { console.error('Error parcheando promotor', e) }
    }

    const tabs = [
        { id: 'dashboard', label: 'Rendimiento Global', icon: <BarChart3 size={16} /> },
        { id: 'equipo', label: 'Mis Promotores', icon: <Users size={16} /> }
    ]

    // Animaciones Framer Motion
    const containerVars = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    }

    const itemVars = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    }

    return (
        <div className="min-h-screen pb-12">
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4 flex justify-between items-center"
            >
                <div>
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
                        <Briefcase size={20} className="text-blue-400" />
                        Panel de Agencia
                    </h1>
                    <p className="text-sm text-gray-400 font-light">{agencia?.nombre}</p>
                </div>
                <button
                    onClick={() => { localStorage.clear(); router.push('/login') }}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                </button>
            </motion.nav>

            <main className="max-w-4xl mx-auto p-6 mt-8 elevate-3d">
                <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8">

                    {/* TOP TABS NEUMORFISMO */}
                    <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10 w-full overflow-x-auto mx-auto mb-4">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 flex flex-col items-center justify-center py-3 text-xs md:text-sm font-medium rounded-xl transition-all relative z-10 ${tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tab === t.id && (
                                    <motion.div
                                        layoutId="activeAgTab"
                                        className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-sm"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-20 flex items-center gap-1.5">{t.icon} {t.label}</span>
                            </button>
                        ))}
                    </div>

                    {cargando ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <motion.div variants={itemVars} key={tab}>

                            {/* VISTA DASHBOARD ESTADISTICO */}
                            {tab === 'dashboard' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-400">Volumen Traído por Promotores</p>
                                                    <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.volumenEurosGlobal.toFixed(2)}€</h3>
                                                    <p className="text-xs text-blue-400 mt-2">{analytics.stats.operacionesTotales} turistas validados</p>
                                                </div>
                                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Users size={24} /></div>
                                            </div>
                                        </div>

                                        <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 relative overflow-hidden">
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-400">Ingreso Agencia (Mi Split)</p>
                                                    <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.comisionesAgencia.toFixed(2)}€</h3>
                                                    <p className="text-xs text-emerald-400 mt-2">Deduciendo la parte del Código</p>
                                                </div>
                                                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><TrendingUp size={24} /></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-panel p-6 rounded-2xl h-[350px] w-full mt-6">
                                        <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><TrendingUp size={20} className="text-emerald-400" /> Beneficio Neto Tour Operator</h3>
                                        <ResponsiveContainer width="100%" height="85%">
                                            <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorSplitAg" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                    itemStyle={{ color: '#e5e7eb' }}
                                                />
                                                <Area type="monotone" dataKey="miComision" name="Comisión / Día" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSplitAg)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* VISTA EQUIPO PROMOTORES */}
                            {tab === 'equipo' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-lg font-semibold text-white">Administración de Equipo</h2>
                                            <p className="text-sm text-gray-400">RRPPs inscritos de tu red matriz.</p>
                                        </div>
                                        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                                            <PlusCircle size={16} /> <span className="hidden sm:inline">Nuevo Referidor</span>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {equipo.map((r, i) => (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={r.id} className="glass-panel p-5 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <p className="font-semibold text-white flex items-center gap-2">
                                                        {r.nombre}
                                                        {!r.activo && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactivo</span>}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{r.email}</p>
                                                    <div className="flex gap-4 mt-2 text-xs">
                                                        <p className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                                                            Split: {r.porcentaje_split}% <span className="text-gray-500">del total Agencia</span>
                                                        </p>
                                                        <p className="text-blue-400 flex items-center gap-1 font-mono">
                                                            <LinkIcon size={12} /> {r.qr_token}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleActivo(r.id, r.activo)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${r.activo ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                                                        }`}
                                                >
                                                    {r.activo ? 'Desactivar Acceso' : 'Reactivar'}
                                                </button>
                                            </motion.div>
                                        ))}
                                        {equipo.length === 0 && (
                                            <div className="text-center py-12 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                                Ficha a tu primer promotor pulsando en el botón superior.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* MODAL CREAR PROMOTOR */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md glass-panel p-6 rounded-3xl">
                            <h3 className="text-xl font-bold mb-4">Añadir Promotor</h3>
                            <form onSubmit={handleCrearPromotor} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Nombre/Alias</label>
                                    <input type="text" value={nuevoRef.nombre} onChange={e => setNuevoRef({ ...nuevoRef, nombre: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Correo Electrónico</label>
                                    <input type="email" value={nuevoRef.email} onChange={e => setNuevoRef({ ...nuevoRef, email: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Contraseña de acceso</label>
                                    <input type="password" value={nuevoRef.password} onChange={e => setNuevoRef({ ...nuevoRef, password: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-emerald-400 mb-1 flex justify-between">
                                        <span>División de tu Comisión (%)</span>
                                        <span className="font-bold">{nuevoRef.split}% Promotor / {100 - nuevoRef.split}% Agencia</span>
                                    </label>
                                    <input type="range" min="10" max="90" step="5" value={nuevoRef.split} onChange={e => setNuevoRef({ ...nuevoRef, split: e.target.value })} className="w-full accent-emerald-500" />
                                    <p className="text-[10px] text-gray-500 mt-1">Este es el % de comisiones que el Sistema ingresará a este promotor. La Agencia se queda el resto.</p>
                                </div>
                                {addError && <p className="text-xs text-red-400 flex items-center gap-1"><ShieldAlert size={12} />{addError}</p>}
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
                                    <button type="submit" disabled={addCargando} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-sm transition-colors">{addCargando ? 'Guardando...' : 'Fichar Promotor'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
