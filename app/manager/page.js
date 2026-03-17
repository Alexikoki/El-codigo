'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, BarChart3, TrendingDown, Building2, Receipt, Zap, Users, Download, Image, UserCheck, X, UserPlus, Shield, ToggleLeft, ToggleRight } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { createClient } from '@supabase/supabase-js'

export default function ManagerPage() {
  const [manager, setManager] = useState(null)
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, deudaAcumulada: 0 }, hoy: [] })
  const [cargando, setCargando] = useState(true)
  const [ultimaValidacion, setUltimaValidacion] = useState(null)
  const [segsDesde, setSegsDesde] = useState(null)
  const [filtroFecha, setFiltroFecha] = useState('todo')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [tickets, setTickets] = useState([])
  const [ticketAmpliado, setTicketAmpliado] = useState(null)
  const [tab, setTab] = useState('dashboard') // 'dashboard' | 'equipo'
  const [staffList, setStaffList] = useState([])
  const [cargandoStaff, setCargandoStaff] = useState(false)
  const [modalNuevoStaff, setModalNuevoStaff] = useState(false)
  const [formStaff, setFormStaff] = useState({ nombre: '', email: '', password: '' })
  const [guardandoStaff, setGuardandoStaff] = useState(false)
  const [errorStaff, setErrorStaff] = useState('')
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    const m = localStorage.getItem('manager')
    if (m && rol === 'manager') { setManager(JSON.parse(m)); cargarAnalytics('todo'); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'manager') {
          localStorage.setItem('rol', 'manager')
          localStorage.setItem('manager', JSON.stringify(data.manager))
          setManager(data.manager)
          cargarAnalytics('todo')
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

  const cargarAnalytics = async (preset, desde, hasta) => {
    try {
      const hoy = new Date()
      const fmt = d => d.toISOString().split('T')[0]
      let d = '', h = ''
      if (preset === 'hoy') { d = fmt(hoy); h = fmt(hoy) }
      else if (preset === 'semana') { const s = new Date(hoy); s.setDate(hoy.getDate() - 6); d = fmt(s); h = fmt(hoy) }
      else if (preset === 'mes') { const s = new Date(hoy); s.setDate(1); d = fmt(s); h = fmt(hoy) }
      else if (preset === 'año') { d = `${hoy.getFullYear()}-01-01`; h = fmt(hoy) }
      else if (preset === 'custom') { d = desde || ''; h = hasta || '' }
      const params = new URLSearchParams()
      if (d) params.set('desde', d)
      if (h) params.set('hasta', h)
      const url = `/api/analytics/manager${params.toString() ? '?' + params.toString() : ''}`
      const [resA, resT] = await Promise.all([
        fetch(url, { credentials: 'include' }),
        fetch('/api/manager/tickets', { credentials: 'include' })
      ])
      if (resA.ok) setAnalytics(await resA.json())
      if (resT.ok) { const dt = await resT.json(); setTickets(dt.tickets || []) }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const cargarStaff = async () => {
    setCargandoStaff(true)
    try {
      const res = await fetch('/api/manager/staff', { credentials: 'include' })
      if (res.ok) { const d = await res.json(); setStaffList(d.staff || []) }
    } finally { setCargandoStaff(false) }
  }

  const crearStaff = async () => {
    setErrorStaff('')
    if (!formStaff.nombre || !formStaff.email || !formStaff.password) { setErrorStaff('Rellena todos los campos'); return }
    if (formStaff.password.length < 6) { setErrorStaff('La contraseña debe tener al menos 6 caracteres'); return }
    setGuardandoStaff(true)
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formStaff)
      })
      const data = await res.json()
      if (!res.ok) { setErrorStaff(data.error || 'Error al crear'); return }
      setStaffList(prev => [data.staff, ...prev])
      setModalNuevoStaff(false)
      setFormStaff({ nombre: '', email: '', password: '' })
    } finally { setGuardandoStaff(false) }
  }

  const toggleStaff = async (id, activo) => {
    await fetch('/api/manager/staff', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, activo: !activo })
    })
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, activo: !activo } : s))
  }

  const exportarHoy = () => {
    const hoy = analytics.hoy || []
    if (hoy.length === 0) return
    const fecha = new Date().toLocaleDateString('es-ES')
    const cabecera = 'Hora,Cliente,Referidor,Personas,Gasto (€),Comisión (€)'
    const filas = hoy.map(r => `${r.hora},${r.cliente},${r.referidor},${r.personas},${r.gasto.toFixed(2)},${r.comision.toFixed(2)}`)
    const csv = [cabecera, ...filas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Clientes_${fecha.replace(/\//g, '-')}.csv`
    document.body.appendChild(a); a.click()
    URL.revokeObjectURL(url)
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

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-5 pt-5">
        <div className="flex gap-1 bg-[#f3f4f6] rounded-xl p-1">
          {[['dashboard', <BarChart3 size={14} />, 'Dashboard'], ['equipo', <Shield size={14} />, 'Mi Equipo']].map(([key, icon, label]) => (
            <button key={key}
              onClick={() => { setTab(key); if (key === 'equipo' && staffList.length === 0) cargarStaff() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'}`}
            >{icon}{label}</button>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-5 mt-4">
        {/* ── TAB EQUIPO ── */}
        {tab === 'equipo' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111111]">Camareros del local</h2>
              <button onClick={() => { setModalNuevoStaff(true); setErrorStaff('') }}
                className="flex items-center gap-1.5 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                <UserPlus size={15} /> Nuevo camarero
              </button>
            </div>

            {cargandoStaff ? (
              <div className="py-10 text-center text-sm text-[#9ca3af]">Cargando...</div>
            ) : staffList.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#e5e7eb] rounded-2xl bg-white">
                <Shield size={32} className="text-[#d1d5db] mx-auto mb-3" />
                <p className="text-[#6b7280] text-sm">Aún no hay camareros registrados</p>
                <p className="text-[#9ca3af] text-xs mt-1">Añade el primer camarero para que pueda escanear QRs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffList.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-white border border-[#e5e7eb] rounded-xl px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${s.activo ? 'bg-[#f0f4f8] text-[#1e3a5f]' : 'bg-[#f3f4f6] text-[#9ca3af]'}`}>
                        {s.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${s.activo ? 'text-[#111111]' : 'text-[#9ca3af]'}`}>{s.nombre}</p>
                        <p className="text-xs text-[#9ca3af]">{s.email}</p>
                      </div>
                    </div>
                    <button onClick={() => toggleStaff(s.id, s.activo)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${s.activo ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 'bg-[#f3f4f6] border-[#e5e7eb] text-[#9ca3af] hover:bg-green-50 hover:border-green-200 hover:text-green-700'}`}>
                      {s.activo ? <><ToggleRight size={14} /> Activo</> : <><ToggleLeft size={14} /> Inactivo</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'dashboard' && cargando && <SkeletonPanel />}
        {tab === 'dashboard' && !cargando && (
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
            <div className="glass-panel p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2 flex-shrink-0">
                  <TrendingDown size={15} className="text-red-400" /> Histórico de Comisiones
                </h3>
                <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                  {[['hoy','Hoy'],['semana','Semana'],['mes','Mes'],['año','Año'],['todo','Todo']].map(([key, label]) => (
                    <button key={key}
                      onClick={() => { setFiltroFecha(key); cargarAnalytics(key) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filtroFecha === key ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'}`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3 items-center">
                  <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                    className="text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
                  <span className="text-xs text-[#9ca3af]">→</span>
                  <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                    className="text-xs border border-[#e5e7eb] rounded-lg px-2.5 py-1.5 text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]" />
                  <button onClick={() => { setFiltroFecha('custom'); cargarAnalytics('custom', fechaDesde, fechaHasta) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e3a5f] text-white border border-[#1e3a5f] hover:bg-[#162d4a] transition-colors">
                    Aplicar
                  </button>
              </div>
              <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
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
            </div>

            {/* Clientes de Hoy */}
            <div className="glass-panel overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
                <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                  <Users size={15} className="text-[#1e3a5f]" />
                  Clientes de Hoy
                  {analytics.hoy?.length > 0 && (
                    <span className="text-xs font-medium bg-[#f0f4f8] text-[#1e3a5f] px-2 py-0.5 rounded-full">
                      {analytics.hoy.length}
                    </span>
                  )}
                </h3>
                {analytics.hoy?.length > 0 && (
                  <button onClick={exportarHoy}
                    className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#111111] border border-[#e5e7eb] px-3 py-1.5 rounded-lg bg-white hover:bg-[#f3f4f6] transition-colors">
                    <Download size={12} /> Exportar CSV
                  </button>
                )}
              </div>

              {!analytics.hoy?.length ? (
                <div className="py-10 text-center text-[#9ca3af] text-sm">
                  Aún no hay clientes validados hoy
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#9ca3af] text-xs border-b border-[#f3f4f6]">
                      <th className="text-left px-5 py-3 font-medium">Hora</th>
                      <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Cliente</th>
                      <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Referidor</th>
                      <th className="text-right px-5 py-3 font-medium">Pers.</th>
                      <th className="text-right px-5 py-3 font-medium">Gasto</th>
                      <th className="text-right px-5 py-3 font-medium">Comisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.hoy.map((r, i) => (
                      <tr key={i} className={`border-b border-[#f3f4f6] last:border-0 hover:bg-[#f9fafb] transition-colors ${i % 2 !== 0 ? 'bg-[#fafaf8]' : ''}`}>
                        <td className="px-5 py-3 text-[#6b7280] font-mono text-xs">{r.hora}</td>
                        <td className="px-5 py-3 font-medium text-[#111111] hidden sm:table-cell">{r.cliente}</td>
                        <td className="px-5 py-3 text-[#6b7280] hidden md:table-cell">{r.referidor}</td>
                        <td className="px-5 py-3 text-right text-[#6b7280]">{r.personas}</td>
                        <td className="px-5 py-3 text-right font-mono text-[#111111]">{r.gasto.toFixed(2)}€</td>
                        <td className="px-5 py-3 text-right font-mono text-red-500">{r.comision.toFixed(2)}€</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f3f4f6] text-xs font-semibold text-[#374151]">
                      <td colSpan={4} className="px-5 py-3 hidden md:table-cell">Total del día</td>
                      <td colSpan={2} className="px-5 py-3 md:hidden">Total</td>
                      <td className="px-5 py-3 text-right font-mono">
                        {analytics.hoy.reduce((s, r) => s + r.gasto, 0).toFixed(2)}€
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-red-500">
                        {analytics.hoy.reduce((s, r) => s + r.comision, 0).toFixed(2)}€
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* En Local Ahora */}
            {(() => {
              const enLocal = (analytics.hoy || []).filter(r => !r.confirmado)
              if (enLocal.length === 0) return null
              return (
                <div className="glass-panel overflow-hidden border-l-4 border-l-amber-400">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[#f3f4f6]">
                    <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                      <UserCheck size={15} className="text-amber-500" />
                      En Local Ahora
                      <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                        {enLocal.reduce((s, r) => s + (r.personas || 1), 0)} personas
                      </span>
                    </h3>
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                      Mesa abierta
                    </span>
                  </div>
                  <div className="divide-y divide-[#f3f4f6]">
                    {enLocal.map((r, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#111111]">{r.cliente}</p>
                          <p className="text-xs text-[#9ca3af]">{r.referidor} · {r.personas} {r.personas > 1 ? 'personas' : 'persona'}</p>
                        </div>
                        <span className="text-xs text-[#6b7280] font-mono">{r.hora}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Historial de Tickets */}
            {tickets.length > 0 && (
              <div className="glass-panel overflow-hidden">
                <div className="px-5 py-4 border-b border-[#f3f4f6]">
                  <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                    <Image size={15} className="text-[#1e3a5f]" />
                    Tickets Recientes
                    <span className="text-xs font-medium bg-[#f0f4f8] text-[#1e3a5f] px-2 py-0.5 rounded-full">{tickets.length}</span>
                  </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-4">
                  {tickets.map((t, i) => (
                    <button key={i} onClick={() => setTicketAmpliado(t)}
                      className="relative aspect-square rounded-lg overflow-hidden border border-[#e5e7eb] hover:border-[#1e3a5f] transition-colors group">
                      <img src={t.ticketUrl} alt="Ticket" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                        <p className="text-white text-[9px] truncate font-medium">{t.cliente}</p>
                        <p className="text-white/70 text-[9px]">{t.gasto?.toFixed(0)}€</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}
      </main>

      {/* Modal nuevo camarero */}
      <AnimatePresence>
        {modalNuevoStaff && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setModalNuevoStaff(false)} />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Nuevo camarero</h3>
                  <p className="text-sm text-[#6b7280]">Acceso al escáner QR del local</p>
                </div>
                <button onClick={() => setModalNuevoStaff(false)} className="text-[#9ca3af] hover:text-[#374151]">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {[['nombre', 'Nombre completo', 'text'], ['email', 'Email', 'email'], ['password', 'Contraseña (mín. 6 caracteres)', 'password']].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="text-xs text-[#6b7280] mb-1 block font-medium">{label}</label>
                    <input type={type} value={formStaff[key]}
                      onChange={e => setFormStaff(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-3 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 bg-white"
                    />
                  </div>
                ))}
                {errorStaff && <p className="text-xs text-red-500">{errorStaff}</p>}
              </div>
              <button onClick={crearStaff} disabled={guardandoStaff}
                className="w-full mt-5 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50">
                {guardandoStaff ? 'Creando...' : 'Crear camarero'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal ticket ampliado */}
      <AnimatePresence>
        {ticketAmpliado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setTicketAmpliado(null)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f3f4f6]">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{ticketAmpliado.cliente}</p>
                  <p className="text-xs text-[#9ca3af]">{ticketAmpliado.fecha} · {ticketAmpliado.hora} · {ticketAmpliado.gasto?.toFixed(2)}€</p>
                </div>
                <button onClick={() => setTicketAmpliado(null)} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                  <X size={20} />
                </button>
              </div>
              <img src={ticketAmpliado.ticketUrl} alt="Ticket" className="w-full object-contain max-h-[70vh]" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
