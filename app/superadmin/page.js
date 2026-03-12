'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MapPin, Users, UserCheck, Plus, Shield, Search, CheckCircle2, XCircle, BarChart3, TrendingUp, HandCoins, FileText, Pencil } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SuperadminPage() {
  const [token, setToken] = useState(null)
  const [tab, setTab] = useState('lugares')
  const [lugares, setLugares] = useState([])
  const [referidores, setReferidores] = useState([])
  const [staff, setStaff] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, comisionGenerada: 0 } })
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null) // 'lugar' | 'referidor' | 'staff'
  const [modalEditar, setModalEditar] = useState(null) // lugar a editar
  const [form, setForm] = useState({})
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    if (rol !== 'superadmin') { router.push('/login'); return }
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setCargando(true)
    const [resL, resR, resS, resA] = await Promise.all([
      fetch('/api/lugares', { credentials: 'include' }),
      fetch('/api/referidores', { credentials: 'include' }),
      fetch('/api/staff', { credentials: 'include' }),
      fetch('/api/analytics/superadmin', { credentials: 'include' })
    ])
    const [dataL, dataR, dataS, dataA] = await Promise.all([resL.json(), resR.json(), resS.json(), resA.json()])
    setLugares(dataL.lugares || [])
    setReferidores(dataR.referidores || [])
    setStaff(dataS.staff || [])
    if (resA.ok) setAnalytics(dataA)
    setCargando(false)
  }

  const handleSubmit = async () => {
    let url, body
    if (modal === 'lugar') {
      url = '/api/lugares'
      body = form
    } else if (modal === 'referidor') {
      url = '/api/referidores'
      body = form
    } else if (modal === 'staff') {
      url = '/api/staff'
      body = form
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    })

    if (res.ok) {
      toast.success(`${modal === 'lugar' ? 'Local' : modal} creado correctamente.`)
      setModal(null)
      setForm({})
      cargarDatos()
    } else {
      const data = await res.json()
      toast.error(data.error || 'Error al crear el registro.')
    }
  }

  const handleEditar = async () => {
    if (!modalEditar) return
    const res = await fetch('/api/lugares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: modalEditar.id, descuento: parseInt(form.descuento || modalEditar.descuento), nombre: form.nombre || modalEditar.nombre })
    })
    if (res.ok) {
      toast.success('Local actualizado.')
      setModalEditar(null)
      setForm({})
      cargarDatos()
    } else {
      toast.error('Error al actualizar.')
    }
  }

  const toggleActivo = async (tipo, id, activo) => {
    const url = tipo === 'lugar' ? '/api/lugares' : '/api/referidores'
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, activo: !activo })
    })
    if (res.ok) {
      toast.success(activo ? `${tipo} pausado.` : `${tipo} reactivado.`)
      cargarDatos()
    } else {
      toast.error('No autorizado.')
    }
  }

  const descargarFactura = async (referidorId, nombreReferidor) => {
    toast.loading('Generando PDF...', { id: 'pdf' })
    try {
      const res = await fetch(`/api/facturas?referidorid=${referidorId}`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Fallo al generar el PDF')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Liquidacion_${nombreReferidor.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Factura descargada', { id: 'pdf' })
    } catch (e) {
      toast.error(e.message, { id: 'pdf' })
    }
  }

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  // Framer Motion Variants
  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVars = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } } }
  const modalVars = { hidden: { opacity: 0, scale: 0.95, y: 20 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }, exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } } }

  const tabs = [
    { id: 'analytics', label: 'Métricas', icon: <BarChart3 size={16} /> },
    { id: 'lugares', label: 'Locales', icon: <MapPin size={16} /> },
    { id: 'referidores', label: 'Referidores', icon: <Users size={16} /> },
    { id: 'staff', label: 'Staff (Camareros)', icon: <UserCheck size={16} /> }
  ]

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar Glass */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4 flex justify-between items-center"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Shield className="text-blue-400" size={16} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Centro de Mando
            </h1>
            <p className="text-xs text-blue-400 font-medium">Acceso Root</p>
          </div>
        </div>
        <button
          onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">Desconectar</span>
        </button>
      </motion.nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 mt-6 elevate-3d">

        {/* TOP TABS NEUMORFISMO */}
        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-8 border border-white/5 relative z-10 w-full md:w-fit mx-auto overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium rounded-xl transition-all relative z-10 whitespace-nowrap ${tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="activeAdminTab"
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-20 flex items-center gap-2">{t.icon} {t.label}</span>
            </button>
          ))}
        </div>

        {/* CONTAINER DINÁMICO */}
        <motion.div variants={containerVars} initial="hidden" animate="show" key={tab} className="space-y-6">

          {/* BARRA DE ACCIONES HERRAMIENTAS */}
          <motion.div variants={itemVars} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => { setModal(tab === 'lugares' ? 'lugar' : tab === 'referidores' ? 'referidor' : 'staff'); setForm({ descuento: tab === 'lugares' ? 10 : undefined }) }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all"
            >
              <Plus size={16} /> Nuevo {tab.slice(0, -1)}
            </button>
          </motion.div>

          {/* RENDER ANALYTICS (DASHBOARD) */}
          {tab === 'analytics' && (
            <motion.div variants={itemVars} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Operaciones</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.operaciones}</h3>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><TrendingUp size={24} /></div>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Volumen Traído</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.volumenEuros}€</h3>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><HandCoins size={24} /></div>
                  </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-400">Comisiones R.R.P.P</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.comisionGenerada.toFixed(2)}€</h3>
                    </div>
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><Users size={24} /></div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl h-[400px] w-full mt-6">
                <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><BarChart3 size={20} className="text-blue-400" /> Afluencia Histórica</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#e5e7eb' }}
                    />
                    <Area type="monotone" dataKey="gastoTotal" name="Volumen (€)" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorGasto)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* LISTADOS (CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* RENDER LUGARES */}
            {tab === 'lugares' && lugares.map(l => (
              <motion.div key={l.id} variants={itemVars} className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group">
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full pointer-events-none transition-opacity ${l.activo ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <MapPin size={20} className="text-gray-300" />
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${l.activo ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {l.activo ? 'Operativo' : 'Pausado'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{l.nombre}</h3>
                  <p className="text-sm text-gray-400 mb-1">{l.tipo}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold text-lg">{l.descuento}%</span>
                    <span className="text-xs text-gray-500">descuento turistas</span>
                    <button onClick={() => { setModalEditar(l); setForm({ descuento: l.descuento, nombre: l.nombre }) }}
                      className="ml-auto text-gray-500 hover:text-blue-400 transition-colors p-1 rounded-lg hover:bg-blue-500/10">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 truncate pr-4" title={l.direccion}>{l.direccion}</p>
                  <button onClick={() => toggleActivo('lugar', l.id, l.activo)} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                    {l.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </motion.div>
            ))}

            {/* RENDER REFERIDORES */}
            {tab === 'referidores' && referidores.map(r => (
              <motion.div key={r.id} variants={itemVars} className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between group">
                <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full pointer-events-none transition-opacity ${r.activo ? 'bg-blue-500/10' : 'bg-red-500/10'}`} />
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <Users size={20} className="text-gray-300" />
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border ${r.activo ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      {r.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{r.nombre}</h3>
                  <p className="text-sm text-gray-400 mb-3">{r.email}</p>
                  <p className="text-xs font-mono bg-black/30 p-2 rounded-lg text-blue-300/80 border border-white/5 truncate">
                    {appUrl}/r/{r.qr_token}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <button onClick={() => descargarFactura(r.id, r.nombre)} className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                    <FileText size={14} /> Liquidación
                  </button>
                  <button onClick={() => toggleActivo('referidor', r.id, r.activo)} className="text-xs font-medium text-gray-400 hover:text-white transition-colors">
                    {r.activo ? 'Suspender Guía' : 'Reactivar Guía'}
                  </button>
                </div>
              </motion.div>
            ))}

            {/* RENDER STAFF */}
            {tab === 'staff' && staff.map(s => (
              <motion.div key={s.id} variants={itemVars} className="glass-panel glass-panel-hover rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <UserCheck size={20} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold border bg-purple-500/10 text-purple-400 border-purple-500/20">
                      Staff Autorizado
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{s.nombre}</h3>
                  <p className="text-sm text-gray-400 mb-2">{s.email}</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-md text-xs text-gray-300 border border-white/5">
                    <MapPin size={10} /> {s.lugares?.nombre || 'Sin local asignado'}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* EMPTY STATES */}
            {!cargando && ((tab === 'lugares' && lugares.length === 0) || (tab === 'referidores' && referidores.length === 0) || (tab === 'staff' && staff.length === 0)) && (
              <div className="col-span-full py-12 text-center text-gray-500 glass-panel rounded-2xl border-dashed">
                Aún no hay registros aquí.
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* MODAL CREACIÓN */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setModal(null); setForm({}) }}
            />

            <motion.div
              variants={modalVars} initial="hidden" animate="show" exit="exit"
              className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white capitalize flex items-center gap-2">
                  <Plus size={20} className="text-blue-400" />
                  Nuevo {modal}
                </h2>
                <button onClick={() => { setModal(null); setForm({}) }} className="text-gray-500 hover:text-white transition-colors">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {modal === 'lugar' && <>
                  <input placeholder="Nombre del local" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors appearance-none">
                    <option className="bg-gray-900" value="">Tipo de lugar</option>
                    {['Restaurante', 'Bar', 'Hotel', 'Turismo', 'Experiencia'].map(t => <option className="bg-gray-900" key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Dirección física" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <div>
                    <label className="text-xs text-gray-400 ml-1 mb-1 block">Porcentaje de descuento para turistas (%)</label>
                    <input type="number" placeholder="Descuento %" value={form.descuento || 10} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })}
                      className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  </div>
                </>}

                {modal === 'referidor' && <>
                  <input placeholder="Nombre Comercial / Guía" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <input type="text" placeholder="Usuario o Email login" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <input type="password" placeholder="Contraseña asignada" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                </>}

                {modal === 'staff' && <>
                  <input placeholder="Nombre del empleado" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <input type="text" placeholder="Usuario o Email login" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <input type="password" placeholder="Contraseña de acceso" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                  <select value={form.lugar_id || ''} onChange={e => setForm({ ...form, lugar_id: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors appearance-none">
                    <option className="bg-gray-900" value="">Asignar al Local...</option>
                    {lugares.map(l => <option className="bg-gray-900" key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </>}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setModal(null); setForm({}) }}
                  className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  Guardar Perfil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* MODAL EDITAR LUGAR */}
      <AnimatePresence>
        {modalEditar && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setModalEditar(null); setForm({}) }}
            />
            <motion.div
              variants={modalVars} initial="hidden" animate="show" exit="exit"
              className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-sm relative z-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Pencil size={18} className="text-blue-400" /> Editar Local
                </h2>
                <button onClick={() => { setModalEditar(null); setForm({}) }} className="text-gray-500 hover:text-white transition-colors">
                  <XCircle size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 ml-1 mb-1 block">Nombre del local</label>
                  <input value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1 mb-1 block">Comisión / Descuento para turistas (%)</label>
                  <input type="number" min="1" max="100" value={form.descuento || ''}
                    onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })}
                    className="w-full bg-black/30 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => { setModalEditar(null); setForm({}) }}
                  className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleEditar}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 rounded-xl text-sm font-medium shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
                  Guardar Cambios
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
