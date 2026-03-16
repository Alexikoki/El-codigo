'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MapPin, Users, UserCheck, Plus, Shield, Search, CheckCircle2, XCircle, BarChart3, TrendingUp, HandCoins, FileText, Pencil, Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SuperadminPage() {
  const [tab, setTab] = useState('lugares')
  const [lugares, setLugares] = useState([])
  const [referidores, setReferidores] = useState([])
  const [staff, setStaff] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, comisionGenerada: 0 } })
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [form, setForm] = useState({})
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    if (rol === 'superadmin') { cargarDatos(); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'superadmin') {
          localStorage.setItem('rol', 'superadmin')
          cargarDatos()
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
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
    const url = modal === 'lugar' ? '/api/lugares' : modal === 'referidor' ? '/api/referidores' : '/api/staff'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    })
    if (res.ok) {
      toast.success(`${modal === 'lugar' ? 'Local' : modal} creado correctamente.`)
      setModal(null); setForm({}); cargarDatos()
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
      setModalEditar(null); setForm({}); cargarDatos()
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
      const res = await fetch(`/api/facturas?referidorid=${referidorId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Liquidacion_${nombreReferidor.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Factura descargada', { id: 'pdf' })
    } catch (e) {
      toast.error(e.message, { id: 'pdf' })
    }
  }

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  const exportarExcel = async () => {
    toast.loading('Generando Excel...', { id: 'xlsx' })
    try {
      const res = await fetch('/api/export/xlsx', { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el Excel')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ElCodigo_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Excel descargado', { id: 'xlsx' })
    } catch (e) {
      toast.error(e.message, { id: 'xlsx' })
    }
  }

  const tabs = [
    { id: 'analytics', label: 'Métricas', icon: <BarChart3 size={15} /> },
    { id: 'lugares', label: 'Locales', icon: <MapPin size={15} /> },
    { id: 'referidores', label: 'Referidores', icon: <Users size={15} /> },
    { id: 'staff', label: 'Staff', icon: <UserCheck size={15} /> }
  ]

  const inputClass = "w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f0f4f8] rounded-lg flex items-center justify-center">
            <Shield size={15} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#111111]">Centro de Mando</h1>
            <p className="text-xs text-[#1e3a5f] font-medium">Acceso Root</p>
          </div>
        </div>
        <button
          onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
          className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
        >
          <LogOut size={15} /> <span className="hidden sm:inline">Desconectar</span>
        </button>
      </nav>

      <main className="max-w-5xl mx-auto p-5 mt-6">

        {/* Tabs */}
        <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Barra de acciones */}
        {tab !== 'analytics' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input type="text" placeholder="Buscar..." className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#9ca3af]" />
            </div>
            <button
              onClick={() => { setModal(tab === 'lugares' ? 'lugar' : tab === 'referidores' ? 'referidor' : 'staff'); setForm({ descuento: tab === 'lugares' ? 10 : undefined }) }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} /> Nuevo {tab === 'lugares' ? 'Local' : tab === 'referidores' ? 'Referidor' : 'Staff'}
            </button>
          </div>
        )}

        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {/* ANALYTICS */}
          {tab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex justify-end">
                <button onClick={exportarExcel}
                  className="flex items-center gap-2 border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] text-[#374151] px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Download size={14} /> Exportar Excel
                </button>
              </div>
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
            </div>
          )}

          {/* CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* LUGARES */}
            {tab === 'lugares' && lugares.map(l => (
              <div key={l.id} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-[#f0f4f8] rounded-lg">
                      <MapPin size={16} className="text-[#1e3a5f]" />
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
                      l.activo ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {l.activo ? 'Operativo' : 'Pausado'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111111] mb-0.5">{l.nombre}</h3>
                  <p className="text-sm text-[#6b7280] mb-2">{l.tipo}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[#1e3a5f] font-bold">{l.descuento}%</span>
                    <span className="text-xs text-[#9ca3af]">descuento turistas</span>
                    <button onClick={() => { setModalEditar(l); setForm({ descuento: l.descuento, nombre: l.nombre }) }}
                      className="ml-auto text-[#9ca3af] hover:text-[#1e3a5f] transition-colors p-1">
                      <Pencil size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f3f4f6]">
                  <p className="text-xs text-[#9ca3af] truncate pr-4">{l.direccion}</p>
                  <button onClick={() => toggleActivo('lugar', l.id, l.activo)} className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors whitespace-nowrap">
                    {l.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}

            {/* REFERIDORES */}
            {tab === 'referidores' && referidores.map(r => (
              <div key={r.id} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-[#f0f4f8] rounded-lg">
                      <Users size={16} className="text-[#1e3a5f]" />
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
                      r.activo ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {r.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111111] mb-0.5">{r.nombre}</h3>
                  <p className="text-sm text-[#6b7280] mb-3">{r.email}</p>
                  <p className="text-xs font-mono bg-[#f3f4f6] px-2 py-1.5 rounded-lg text-[#6b7280] border border-[#e5e7eb] truncate">
                    {appUrl}/r/{r.qr_token}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#f3f4f6]">
                  <button onClick={() => descargarFactura(r.id, r.nombre)}
                    className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                    <FileText size={13} /> Liquidación
                  </button>
                  <button onClick={() => toggleActivo('referidor', r.id, r.activo)}
                    className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors">
                    {r.activo ? 'Suspender' : 'Reactivar'}
                  </button>
                </div>
              </div>
            ))}

            {/* STAFF */}
            {tab === 'staff' && staff.map(s => (
              <div key={s.id} className="glass-panel p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-[#f0f4f8] rounded-lg">
                      <UserCheck size={16} className="text-[#1e3a5f]" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border bg-[#f0f4f8] text-[#1e3a5f] border-[#dce7f3]">
                      Staff
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111111] mb-0.5">{s.nombre}</h3>
                  <p className="text-sm text-[#6b7280] mb-2">{s.email}</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#f3f4f6] rounded-md text-xs text-[#6b7280] border border-[#e5e7eb]">
                    <MapPin size={10} /> {s.lugares?.nombre || 'Sin local asignado'}
                  </div>
                </div>
              </div>
            ))}

            {/* EMPTY STATE */}
            {!cargando && (
              (tab === 'lugares' && lugares.length === 0) ||
              (tab === 'referidores' && referidores.length === 0) ||
              (tab === 'staff' && staff.length === 0)
            ) && (
              <div className="col-span-full py-12 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => { setModal(null); setForm({}) }}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-md relative z-10 shadow-lg"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                  <Plus size={18} className="text-[#1e3a5f]" />
                  Nuevo {modal === 'lugar' ? 'Local' : modal === 'referidor' ? 'Referidor' : 'Staff'}
                </h2>
                <button onClick={() => { setModal(null); setForm({}) }} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="space-y-3">
                {modal === 'lugar' && <>
                  <input placeholder="Nombre del local" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                  <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })} className={`${inputClass} appearance-none`}>
                    <option value="">Tipo de lugar</option>
                    {['Restaurante', 'Bar', 'Hotel', 'Turismo', 'Experiencia'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Dirección física" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} className={inputClass} />
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Descuento para turistas (%)</label>
                    <input type="number" value={form.descuento || 10} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                  </div>
                </>}

                {modal === 'referidor' && <>
                  <input placeholder="Nombre / Alias" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Usuario o email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
                </>}

                {modal === 'staff' && <>
                  <input placeholder="Nombre del empleado" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Usuario o email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
                  <select value={form.lugar_id || ''} onChange={e => setForm({ ...form, lugar_id: e.target.value })} className={`${inputClass} appearance-none`}>
                    <option value="">Asignar al Local...</option>
                    {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                  </select>
                </>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => { setModal(null); setForm({}) }}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Guardar
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => { setModalEditar(null); setForm({}) }}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-lg"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                  <Pencil size={16} className="text-[#1e3a5f]" /> Editar Local
                </h2>
                <button onClick={() => { setModalEditar(null); setForm({}) }} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                  <XCircle size={22} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Nombre del local</label>
                  <input value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Descuento / Comisión (%)</label>
                  <input type="number" min="1" max="100" value={form.descuento || ''} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setModalEditar(null); setForm({}) }}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={handleEditar}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
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
