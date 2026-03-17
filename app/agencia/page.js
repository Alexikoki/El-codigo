'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, BarChart3, TrendingUp, Briefcase, PlusCircle, Users, Link as LinkIcon, ShieldAlert, Trophy, Clock, CreditCard, CheckCircle2, X } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AgenciaPage() {
  const [agencia, setAgencia] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operacionesTotales: 0, volumenEurosGlobal: 0, comisionesAgencia: 0 } })
  const [equipo, setEquipo] = useState([])
  const [ranking, setRanking] = useState([])
  const [cargando, setCargando] = useState(true)

  const [showAddModal, setShowAddModal] = useState(false)
  const [nuevoRef, setNuevoRef] = useState({ nombre: '', email: '', password: '', split: 50 })
  const [addCargando, setAddCargando] = useState(false)
  const [addError, setAddError] = useState('')

  const [liquidaciones, setLiquidaciones] = useState([])
  const [modalLiq, setModalLiq] = useState(false)
  const [confirmPago, setConfirmPago] = useState(null)
  const [formLiq, setFormLiq] = useState({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
  const [liqCargando, setLiqCargando] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    const a = localStorage.getItem('agencia')
    if (a && rol === 'agencia') { setAgencia(JSON.parse(a)); cargarDatosGenerales(); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'agencia') {
          localStorage.setItem('rol', 'agencia')
          localStorage.setItem('agencia', JSON.stringify(data.agencia))
          setAgencia(data.agencia)
          cargarDatosGenerales()
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const cargarDatosGenerales = async () => {
    try {
      const [resA, resE, resR, resL] = await Promise.all([
        fetch('/api/analytics/agencia', { credentials: 'include' }),
        fetch('/api/agencias/promotores', { credentials: 'include' }),
        fetch('/api/analytics/agencia/promotores', { credentials: 'include' }),
        fetch('/api/liquidaciones', { credentials: 'include' })
      ])
      if (resA.ok) setAnalytics(await resA.json())
      if (resE.ok) { const d = await resE.json(); setEquipo(d.promotores || []) }
      if (resR.ok) { const d = await resR.json(); setRanking(d.promotores || []) }
      if (resL.ok) { const d = await resL.json(); setLiquidaciones(d.liquidaciones || []) }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const crearLiquidacion = async () => {
    if (!formLiq.referidor_id || !formLiq.importe || !formLiq.periodo_desde || !formLiq.periodo_hasta) return
    setLiqCargando(true)
    try {
      const res = await fetch('/api/liquidaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formLiq, importe: parseFloat(formLiq.importe) })
      })
      if (res.ok) {
        const d = await res.json()
        setLiquidaciones([d.liquidacion, ...liquidaciones])
        setModalLiq(false)
        setFormLiq({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
      }
    } finally {
      setLiqCargando(false)
    }
  }

  const marcarPagado = async (id) => {
    const res = await fetch('/api/liquidaciones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, estado: 'pagado' })
    })
    if (res.ok) {
      setLiquidaciones(liquidaciones.map(l => l.id === id ? { ...l, estado: 'pagado', pagado_at: new Date().toISOString() } : l))
      setConfirmPago(null)
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...nuevoRef, porcentaje_split: nuevoRef.split })
      })
      const data = await res.json()
      if (res.ok) {
        setEquipo([data.promotor, ...equipo])
        setShowAddModal(false)
        setNuevoRef({ nombre: '', email: '', password: '', split: 50 })
        cargarDatosGenerales()
      } else {
        setAddError(data.error || 'Error al crear promotor')
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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, activo: !currentStatus })
      })
      if (res.ok) setEquipo(equipo.map(r => r.id === id ? { ...r, activo: !currentStatus } : r))
    } catch (e) { console.error(e) }
  }

  const medalColor = (i) => i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-[#9ca3af]'
  const medalBg = (i) => i === 0 ? 'bg-yellow-50 border-yellow-200' : i === 1 ? 'bg-gray-50 border-gray-200' : i === 2 ? 'bg-amber-50 border-amber-200' : 'bg-[#f3f4f6] border-[#e5e7eb]'

  const tabs = [
    { id: 'dashboard', label: 'Rendimiento', icon: <BarChart3 size={15} /> },
    { id: 'ranking', label: 'Ranking', icon: <Trophy size={15} /> },
    { id: 'equipo', label: 'Promotores', icon: <Users size={15} /> },
    { id: 'pagos', label: 'Pagos', icon: <CreditCard size={15} /> }
  ]

  const inputClass = "w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f0f4f8] rounded-lg flex items-center justify-center">
            <Briefcase size={15} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#111111]">Panel de Agencia</h1>
            <p className="text-xs text-[#6b7280]">{agencia?.nombre}</p>
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

        {/* Tabs */}
        <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                tab === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {cargando ? <SkeletonPanel /> : (
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 border-l-4 border-l-[#1e3a5f]">
                    <p className="text-xs text-[#6b7280] mb-1">Volumen Traído por Promotores</p>
                    <p className="text-3xl font-bold text-[#111111]">{analytics.stats.volumenEurosGlobal.toFixed(2)}€</p>
                    <p className="text-xs text-[#6b7280] mt-2">{analytics.stats.operacionesTotales} turistas validados</p>
                    <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit">
                      <Users size={16} className="text-[#1e3a5f]" />
                    </div>
                  </div>
                  <div className="glass-panel p-5 border-l-4 border-l-[#4a9070]">
                    <p className="text-xs text-[#6b7280] mb-1">Ingreso Agencia (Mi Split)</p>
                    <p className="text-3xl font-bold text-[#111111]">{analytics.stats.comisionesAgencia.toFixed(2)}€</p>
                    <p className="text-xs text-[#9ca3af] mt-2">Deduciendo la parte del Código</p>
                    <div className="mt-3 p-2 bg-[#f0f7f4] rounded-lg w-fit">
                      <TrendingUp size={16} className="text-[#4a9070]" />
                    </div>
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
            )}

            {/* RANKING */}
            {tab === 'ranking' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-[#111111]">Ranking de Promotores</h2>
                  <p className="text-sm text-[#6b7280]">Rendimiento individual de tu equipo.</p>
                </div>

                {/* Gráfica comparativa */}
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

                {/* Lista ranking */}
                <div className="space-y-3">
                  {ranking.map((p, i) => (
                    <div key={p.id} className={`glass-panel p-4 flex items-center gap-4`}>
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
            )}

            {/* EQUIPO */}
            {tab === 'equipo' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-semibold text-[#111111]">Equipo de Promotores</h2>
                    <p className="text-sm text-[#6b7280]">RRPPs inscritos en tu red.</p>
                  </div>
                  <button onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <PlusCircle size={15} /> <span className="hidden sm:inline">Nuevo Promotor</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {equipo.map((r) => {
                    const stats = ranking.find(p => p.id === r.id)
                    return (
                      <div key={r.id} className="glass-panel p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#111111] flex items-center gap-2">
                              {r.nombre}
                              {!r.activo && <span className="text-[10px] bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Inactivo</span>}
                            </p>
                            <p className="text-xs text-[#6b7280] mt-0.5">{r.email}</p>
                            <div className="flex gap-3 mt-2 text-xs flex-wrap">
                              <span className="text-[#4a9070] bg-[#f0f7f4] border border-[#c8e6d8] px-2 py-1 rounded-md">
                                Split: {r.porcentaje_split}%
                              </span>
                              <span className="text-[#6b7280] flex items-center gap-1 font-mono">
                                <LinkIcon size={11} /> {r.qr_token}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleActivo(r.id, r.activo)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex-shrink-0 ${
                              r.activo
                                ? 'border-red-200 text-red-500 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {r.activo ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </div>

                        {/* Stats del promotor */}
                        {stats && (
                          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#f3f4f6]">
                            <div className="text-center">
                              <p className="text-base font-bold text-[#111111]">{stats.operaciones}</p>
                              <p className="text-[10px] text-[#9ca3af] mt-0.5">operaciones</p>
                            </div>
                            <div className="text-center">
                              <p className="text-base font-bold text-[#111111]">{stats.volumen.toFixed(2)}€</p>
                              <p className="text-[10px] text-[#9ca3af] mt-0.5">volumen</p>
                            </div>
                            <div className="text-center">
                              <p className="text-base font-bold text-[#4a9070]">{stats.comisionAgencia.toFixed(2)}€</p>
                              <p className="text-[10px] text-[#9ca3af] mt-0.5">para agencia</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {equipo.length === 0 && (
                    <div className="text-center py-12 text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                      Ficha a tu primer promotor pulsando el botón superior.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PAGOS */}
            {tab === 'pagos' && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-semibold text-[#111111]">Historial de Pagos</h2>
                    <p className="text-sm text-[#6b7280]">Liquidaciones a tus promotores.</p>
                  </div>
                  <button onClick={() => setModalLiq(true)}
                    className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <PlusCircle size={15} /> <span className="hidden sm:inline">Nueva Liquidación</span>
                  </button>
                </div>

                {/* Métricas resumen */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4">
                    <p className="text-xs text-[#6b7280] mb-1">Pendiente de pago</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + l.importe, 0).toFixed(2)}€
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pendiente').length} liquidaciones</p>
                  </div>
                  <div className="glass-panel p-4">
                    <p className="text-xs text-[#6b7280] mb-1">Total pagado</p>
                    <p className="text-2xl font-bold text-[#4a9070]">
                      {liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + l.importe, 0).toFixed(2)}€
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pagado').length} liquidaciones</p>
                  </div>
                </div>

                {/* Lista */}
                {liquidaciones.length === 0 ? (
                  <div className="text-center py-12 text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                    Aún no hay liquidaciones registradas.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liquidaciones.map(l => (
                      <div key={l.id} className="glass-panel p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-[#111111] text-sm">{l.referidores?.nombre}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                                l.estado === 'pagado'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{l.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span>
                            </div>
                            <p className="text-xs text-[#9ca3af] mt-1">
                              {new Date(l.periodo_desde).toLocaleDateString('es-ES')} — {new Date(l.periodo_hasta).toLocaleDateString('es-ES')}
                            </p>
                            {l.notas && <p className="text-xs text-[#6b7280] mt-1 italic">{l.notas}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-[#111111]">{l.importe.toFixed(2)}€</p>
                            {l.estado === 'pendiente' && (
                              <button onClick={() => setConfirmPago(l)}
                                className="mt-1 text-xs text-[#4a9070] hover:underline flex items-center gap-1">
                                <CheckCircle2 size={11} /> Marcar pagado
                              </button>
                            )}
                            {l.estado === 'pagado' && l.pagado_at && (
                              <p className="text-[10px] text-[#9ca3af] mt-1">{new Date(l.pagado_at).toLocaleDateString('es-ES')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        )}
      </main>

      {/* MODAL CREAR PROMOTOR */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-[#111111] mb-5">Añadir Promotor</h3>
              <form onSubmit={handleCrearPromotor} className="space-y-4">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Nombre / Alias</label>
                  <input type="text" value={nuevoRef.nombre} onChange={e => setNuevoRef({ ...nuevoRef, nombre: e.target.value })} className={inputClass} placeholder="Nombre del promotor" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Correo electrónico</label>
                  <input type="email" value={nuevoRef.email} onChange={e => setNuevoRef({ ...nuevoRef, email: e.target.value })} className={inputClass} placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Contraseña de acceso</label>
                  <input type="password" value={nuevoRef.password} onChange={e => setNuevoRef({ ...nuevoRef, password: e.target.value })} className={inputClass} placeholder="Mínimo 6 caracteres" />
                </div>
                <div>
                  <label className="text-xs text-[#374151] mb-2 flex justify-between">
                    <span>División de comisión</span>
                    <span className="font-semibold text-[#4a9070]">{nuevoRef.split}% Promotor / {100 - nuevoRef.split}% Agencia</span>
                  </label>
                  <input type="range" min="1" max="99" step="1" value={nuevoRef.split}
                    onChange={e => setNuevoRef({ ...nuevoRef, split: e.target.value })}
                    className="w-full accent-[#1e3a5f]" />
                  <p className="text-[10px] text-[#9ca3af] mt-1">% de comisiones que ingresará este promotor. La agencia se queda el resto.</p>
                </div>
                {addError && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><ShieldAlert size={12} />{addError}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 text-sm text-[#6b7280] hover:text-[#374151] transition-colors border border-[#e5e7eb] rounded-lg">
                    Cancelar
                  </button>
                  <button type="submit" disabled={addCargando}
                    className="flex-1 py-2.5 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50">
                    {addCargando ? 'Guardando...' : 'Fichar Promotor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NUEVA LIQUIDACIÓN */}
      <AnimatePresence>
        {modalLiq && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30" onClick={() => setModalLiq(false)} />
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-md bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[#111111]">Nueva Liquidación</h3>
                <button onClick={() => setModalLiq(false)} className="text-[#9ca3af] hover:text-[#374151]"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Promotor</label>
                  <select value={formLiq.referidor_id} onChange={e => setFormLiq({ ...formLiq, referidor_id: e.target.value })}
                    className={inputClass + ' appearance-none'}>
                    <option value="">Seleccionar promotor...</option>
                    {equipo.filter(r => r.activo).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Importe (€)</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={formLiq.importe}
                    onChange={e => setFormLiq({ ...formLiq, importe: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Desde</label>
                    <input type="date" value={formLiq.periodo_desde}
                      onChange={e => setFormLiq({ ...formLiq, periodo_desde: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Hasta</label>
                    <input type="date" value={formLiq.periodo_hasta}
                      onChange={e => setFormLiq({ ...formLiq, periodo_hasta: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Notas (opcional)</label>
                  <input placeholder="Periodo mensual, bonificación..." value={formLiq.notas}
                    onChange={e => setFormLiq({ ...formLiq, notas: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalLiq(false)}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={crearLiquidacion} disabled={liqCargando}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {liqCargando ? 'Guardando...' : 'Crear Liquidación'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMAR PAGO */}
      <AnimatePresence>
        {confirmPago && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30" onClick={() => setConfirmPago(null)} />
            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
              className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg">
              <h3 className="text-base font-bold text-[#111111] mb-2">¿Confirmar pago?</h3>
              <p className="text-sm text-[#6b7280] mb-1">
                Vas a marcar como pagada la liquidación de <span className="font-medium text-[#111111]">{confirmPago.referidores?.nombre}</span>.
              </p>
              <p className="text-2xl font-bold text-[#111111] mb-5">{confirmPago.importe.toFixed(2)}€</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmPago(null)}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => marcarPagado(confirmPago.id)}
                  className="flex-1 bg-[#4a9070] hover:bg-[#3d7a5e] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Confirmar pago
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
