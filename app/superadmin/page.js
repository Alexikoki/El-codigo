'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, MapPin, Users, UserCheck, Plus, Shield, Search, CheckCircle2, XCircle, BarChart3, TrendingUp, HandCoins, FileText, Pencil, Download, CreditCard, Clock, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'

export default function SuperadminPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('lugares')
  const [lugares, setLugares] = useState([])
  const [referidores, setReferidores] = useState([])
  const [staff, setStaff] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, comisionGenerada: 0 } })
  const [agencias, setAgencias] = useState([])
  const [liquidaciones, setLiquidaciones] = useState([])
  const [modalLiq, setModalLiq] = useState(false)
  const [formLiq, setFormLiq] = useState({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
  const [confirmPago, setConfirmPago] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroReferidor, setFiltroReferidor] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [clientes, setClientes] = useState([])
  const [busquedaClientes, setBusquedaClientes] = useState('')
  const [clientesCargando, setClientesCargando] = useState(false)
  const [modalEditCliente, setModalEditCliente] = useState(null)
  const [formCliente, setFormCliente] = useState({})
  const [confirmBorrar, setConfirmBorrar] = useState(null)
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [form, setForm] = useState({})
  const router = useRouter()

  useEffect(() => {
    if (tab === 'clientes' && clientes.length === 0) cargarClientes()
  }, [tab])

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
    const [resL, resR, resS, resLiq, resAg] = await Promise.all([
      fetch('/api/lugares', { credentials: 'include' }),
      fetch('/api/referidores', { credentials: 'include' }),
      fetch('/api/staff', { credentials: 'include' }),
      fetch('/api/liquidaciones', { credentials: 'include' }),
      fetch('/api/agencias', { credentials: 'include' })
    ])
    const [dataL, dataR, dataS, dataLiq, dataAg] = await Promise.all([resL.json(), resR.json(), resS.json(), resLiq.json(), resAg.json()])
    setLugares(dataL.lugares || [])
    setReferidores(dataR.referidores || [])
    setStaff(dataS.staff || [])
    setLiquidaciones(dataLiq.liquidaciones || [])
    setAgencias(dataAg.agencias || [])
    setCargando(false)
    cargarAnalytics('mes')
  }

  const cargarAnalytics = async (preset, customDesde, customHasta) => {
    const hoy = new Date()
    let desde = '', hasta = ''
    if (preset === 'hoy') {
      desde = hoy.toISOString().split('T')[0]
      hasta = desde
    } else if (preset === 'semana') {
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
      desde = lunes.toISOString().split('T')[0]
      hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
      hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'año') {
      desde = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0]
      hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'custom') {
      desde = customDesde || fechaDesde
      hasta = customHasta || fechaHasta
    }
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const res = await fetch(`/api/analytics/superadmin?${params}`, { credentials: 'include' })
    if (res.ok) setAnalytics(await res.json())
  }

  const crearLiquidacion = async () => {
    if (!formLiq.referidor_id || !formLiq.importe || !formLiq.periodo_desde || !formLiq.periodo_hasta) {
      toast.error('Rellena todos los campos obligatorios.')
      return
    }
    const res = await fetch('/api/liquidaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...formLiq, importe: parseFloat(formLiq.importe) })
    })
    if (res.ok) {
      const data = await res.json()
      setLiquidaciones([data.liquidacion, ...liquidaciones])
      setModalLiq(false)
      setFormLiq({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
      toast.success('Liquidación creada.')
    } else {
      toast.error('Error al crear liquidación.')
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
      toast.success('Marcada como pagada.')
    }
  }

  const toggleActivoAgencia = async (id, activo) => {
    const res = await fetch('/api/agencias', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, activo: !activo })
    })
    if (res.ok) {
      setAgencias(agencias.map(a => a.id === id ? { ...a, activo: !activo } : a))
      toast.success(activo ? 'Agencia suspendida.' : 'Agencia reactivada.')
    }
  }

  const handleSubmit = async () => {
    const url = modal === 'lugar' ? '/api/lugares' : modal === 'referidor' ? '/api/referidores' : modal === 'agencia' ? '/api/agencias' : '/api/staff'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const label = modal === 'lugar' ? 'Local' : modal === 'referidor' ? 'Referidor' : modal === 'agencia' ? 'Agencia' : 'Staff'
      toast.success(`${label} creado correctamente.`)
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
      body: JSON.stringify({
        id: modalEditar.id,
        nombre: form.nombre || modalEditar.nombre,
        descuento: parseInt(form.descuento ?? modalEditar.descuento),
        porcentaje_plataforma: parseFloat(form.porcentaje_plataforma ?? modalEditar.porcentaje_plataforma ?? 20)
      })
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

  const cargarClientes = async (busqueda = '') => {
    setClientesCargando(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('busqueda', busqueda)
      const res = await fetch(`/api/admin/clientes${params.toString() ? '?' + params.toString() : ''}`, { credentials: 'include' })
      if (res.ok) { const data = await res.json(); setClientes(data.clientes || []) }
    } finally {
      setClientesCargando(false)
    }
  }

  const editarCliente = async () => {
    if (!modalEditCliente) return
    const body = { id: modalEditCliente.id }
    if (formCliente.nombre !== undefined) body.nombre = formCliente.nombre
    if (formCliente.num_personas !== undefined) body.num_personas = parseInt(formCliente.num_personas)
    const res = await fetch('/api/admin/clientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    })
    if (res.ok) {
      toast.success('Cliente actualizado.')
      setModalEditCliente(null); setFormCliente({})
      cargarClientes(busquedaClientes)
    } else { toast.error('Error al actualizar.') }
  }

  const borrarCliente = async (id) => {
    const res = await fetch('/api/admin/clientes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    })
    if (res.ok) {
      toast.success('Cliente eliminado.')
      setConfirmBorrar(null)
      setClientes(clientes.filter(c => c.id !== id))
    } else { toast.error('Error al eliminar.') }
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

  const exportarLiquidacionesPDF = async () => {
    toast.loading('Generando PDF...', { id: 'pdf-liq' })
    try {
      const res = await fetch('/api/export/pdf-liquidaciones', { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `liquidaciones_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a); a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado', { id: 'pdf-liq' })
    } catch (e) {
      toast.error(e.message, { id: 'pdf-liq' })
    }
  }

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
    { id: 'analytics', label: t('superadmin','metrics'), icon: <BarChart3 size={15} /> },
    { id: 'lugares', label: t('superadmin','places'), icon: <MapPin size={15} /> },
    { id: 'referidores', label: t('superadmin','referrers'), icon: <Users size={15} /> },
    { id: 'staff', label: t('superadmin','staff'), icon: <UserCheck size={15} /> },
    { id: 'agencias', label: t('superadmin','agencies'), icon: <Building2 size={15} /> },
    { id: 'liquidaciones', label: t('superadmin','payments'), icon: <CreditCard size={15} /> },
    { id: 'clientes', label: t('superadmin','clients'), icon: <Users size={15} /> }
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
        <div className="flex items-center gap-2">
          <LangSelector />
          <button
            onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
          >
            <LogOut size={15} /> <span className="hidden sm:inline">{t('common','logout')}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-5 mt-6">

        {/* Tabs */}
        <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setBusqueda('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Barra de acciones */}
        {tab !== 'analytics' && tab !== 'liquidaciones' && tab !== 'agencias' && tab !== 'clientes' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#9ca3af]" />
            </div>
            <button
              onClick={() => { setModal(tab === 'lugares' ? 'lugar' : tab === 'referidores' ? 'referidor' : 'staff'); setForm({ descuento: tab === 'lugares' ? 10 : undefined }) }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={15} /> Nuevo {tab === 'lugares' ? 'Local' : tab === 'referidores' ? 'Referidor' : 'Staff'}
            </button>
          </div>
        )}

        {tab === 'clientes' && (
          <div className="flex gap-2 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
              <input type="text" placeholder="Buscar cliente por nombre..." value={busquedaClientes}
                onChange={e => setBusquedaClientes(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && cargarClientes(busquedaClientes)}
                className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#9ca3af]" />
            </div>
            <button onClick={() => cargarClientes(busquedaClientes)}
              className="px-4 py-2.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#15294a] transition-colors">
              Buscar
            </button>
          </div>
        )}

        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

          {/* ANALYTICS */}
          {tab === 'analytics' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                {/* Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[['hoy','Hoy'],['semana','Semana'],['mes','Mes'],['año','Año'],['todo','Todo']].map(([key, label]) => (
                    <button key={key} onClick={() => { setFiltroFecha(key); cargarAnalytics(key) }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        filtroFecha === key
                          ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                          : 'bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6]'
                      }`}>{label}</button>
                  ))}
                  <div className="flex gap-1.5 items-center">
                    <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f]" />
                    <span className="text-xs text-[#9ca3af]">—</span>
                    <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-2 py-1.5 text-xs text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f]" />
                    <button onClick={() => { setFiltroFecha('custom'); cargarAnalytics('custom') }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-[#6b7280] border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
                      Aplicar
                    </button>
                  </div>
                </div>
                <button onClick={exportarExcel}
                  className="flex items-center gap-2 border border-[#e5e7eb] bg-white hover:bg-[#f3f4f6] text-[#374151] px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start">
                  <Download size={14} /> {t('superadmin','exportExcel')}
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
            {tab === 'lugares' && lugares.filter(l => !busqueda || l.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || l.tipo?.toLowerCase().includes(busqueda.toLowerCase())).map(l => (
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
                  <p className="text-sm text-[#6b7280] mb-3">{l.tipo}</p>
                  <div className="flex gap-2 mb-3">
                    <span className="text-xs bg-[#f0f4f8] text-[#1e3a5f] px-2 py-1 rounded-md font-medium">
                      {l.descuento ?? 10}% dto. turistas
                    </span>
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md font-medium">
                      {l.porcentaje_plataforma ?? 20}% comisión
                    </span>
                  </div>
                  {l.managers_locales?.[0] ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#e5e7eb] flex items-center justify-center text-xs font-bold text-[#374151]">
                        {l.managers_locales[0].nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#374151]">{l.managers_locales[0].nombre}</p>
                        <p className="text-[10px] text-[#9ca3af]">{l.managers_locales[0].email}</p>
                      </div>
                      <button onClick={() => { setModalEditar(l); setForm({ nombre: l.nombre, descuento: l.descuento, porcentaje_plataforma: l.porcentaje_plataforma ?? 20 }) }}
                        className="ml-auto text-[#9ca3af] hover:text-[#1e3a5f] transition-colors p-1">
                        <Pencil size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-red-400">Sin manager asignado</p>
                      <button onClick={() => { setModalEditar(l); setForm({ nombre: l.nombre, descuento: l.descuento, porcentaje_plataforma: l.porcentaje_plataforma ?? 20 }) }}
                        className="text-[#9ca3af] hover:text-[#1e3a5f] transition-colors p-1">
                        <Pencil size={13} />
                      </button>
                    </div>
                  )}
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
            {tab === 'referidores' && referidores.filter(r => !busqueda || r.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || r.email?.toLowerCase().includes(busqueda.toLowerCase())).map(r => (
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

            {/* AGENCIAS — tiene su propia sección, no usa el grid */}
            {tab === 'agencias' && null}

            {/* STAFF */}
            {tab === 'staff' && staff.filter(s => !busqueda || s.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || s.email?.toLowerCase().includes(busqueda.toLowerCase())).map(s => (
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
            {!cargando && (() => {
              const q = busqueda.toLowerCase()
              const lFiltered = lugares.filter(l => !q || l.nombre?.toLowerCase().includes(q) || l.tipo?.toLowerCase().includes(q))
              const rFiltered = referidores.filter(r => !q || r.nombre?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q))
              const sFiltered = staff.filter(s => !q || s.nombre?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q))
              const isEmpty =
                (tab === 'lugares' && lFiltered.length === 0) ||
                (tab === 'referidores' && rFiltered.length === 0) ||
                (tab === 'staff' && sFiltered.length === 0)
              if (tab === 'agencias') return null
              if (!isEmpty) return null
              const sinDatos =
                (tab === 'lugares' && lugares.length === 0) ||
                (tab === 'referidores' && referidores.length === 0) ||
                (tab === 'staff' && staff.length === 0)
              return (
                <div className="col-span-full py-12 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                  {sinDatos ? 'Aún no hay registros aquí.' : `Sin resultados para "${busqueda}".`}
                </div>
              )
            })()}
          </div>

          {/* AGENCIAS */}
          {tab === 'agencias' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-semibold text-[#111111]">Agencias</h2>
                <button
                  onClick={() => { setModal('agencia'); setForm({}) }}
                  className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={15} /> Nueva Agencia
                </button>
              </div>

              {cargando && <SkeletonPanel />}

              {!cargando && agencias.length === 0 && (
                <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                  No hay agencias registradas todavía.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {!cargando && agencias.map(a => (
                  <div key={a.id} className="glass-panel p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-[#f0f4f8] rounded-lg">
                          <Building2 size={16} className="text-[#1e3a5f]" />
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-medium border ${
                          a.activo ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {a.activo ? 'Activa' : 'Suspendida'}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[#111111] mb-0.5">{a.nombre}</h3>
                      <p className="text-sm text-[#6b7280]">{a.email}</p>
                      <p className="text-xs text-[#9ca3af] mt-2">
                        Alta: {new Date(a.creado_en).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-[#f3f4f6]">
                      <button onClick={() => toggleActivoAgencia(a.id, a.activo)}
                        className="text-xs text-[#6b7280] hover:text-[#111111] transition-colors">
                        {a.activo ? 'Suspender' : 'Reactivar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIQUIDACIONES */}
          {tab === 'liquidaciones' && (() => {
            const totalPendiente = liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + parseFloat(l.importe), 0)
            const totalPagado = liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + parseFloat(l.importe), 0)
            const numPendientes = liquidaciones.filter(l => l.estado === 'pendiente').length
            const filtradas = liquidaciones.filter(l => {
              if (filtroEstado && l.estado !== filtroEstado) return false
              if (filtroReferidor && l.referidor_id !== filtroReferidor) return false
              return true
            })
            return (
              <div className="space-y-4">
                {/* Cabecera */}
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-[#111111]">Historial de Liquidaciones</h2>
                  <div className="flex gap-2">
                    <button onClick={exportarLiquidacionesPDF}
                      className="flex items-center gap-2 border border-[#e5e7eb] hover:border-[#d1d5db] bg-white text-[#374151] px-3 py-2.5 rounded-lg text-sm font-medium transition-colors">
                      <Download size={14} /> PDF
                    </button>
                    <button onClick={() => setModalLiq(true)}
                      className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                      <Plus size={15} /> Nueva Liquidación
                    </button>
                  </div>
                </div>

                {/* Métricas resumen */}
                {!cargando && liquidaciones.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-panel p-4 border-t-2 border-t-amber-400">
                      <p className="text-xs text-[#6b7280] mb-1">Pendiente de pago</p>
                      <p className="text-2xl font-bold text-[#111111]">{totalPendiente.toFixed(2)}€</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{numPendientes} liquidación{numPendientes !== 1 ? 'es' : ''}</p>
                    </div>
                    <div className="glass-panel p-4 border-t-2 border-t-[#4a9070]">
                      <p className="text-xs text-[#6b7280] mb-1">Total pagado</p>
                      <p className="text-2xl font-bold text-[#111111]">{totalPagado.toFixed(2)}€</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pagado').length} pagos</p>
                    </div>
                    <div className="glass-panel p-4 border-t-2 border-t-[#1e3a5f]">
                      <p className="text-xs text-[#6b7280] mb-1">Total emitido</p>
                      <p className="text-2xl font-bold text-[#111111]">{(totalPendiente + totalPagado).toFixed(2)}€</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{liquidaciones.length} total</p>
                    </div>
                  </div>
                )}

                {/* Filtros */}
                {!cargando && liquidaciones.length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f] transition-colors appearance-none">
                      <option value="">Todos los estados</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="pagado">Pagado</option>
                    </select>
                    <select value={filtroReferidor} onChange={e => setFiltroReferidor(e.target.value)}
                      className="border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#374151] bg-white focus:outline-none focus:border-[#1e3a5f] transition-colors appearance-none flex-1">
                      <option value="">Todos los referidores</option>
                      {referidores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                    {(filtroEstado || filtroReferidor) && (
                      <button onClick={() => { setFiltroEstado(''); setFiltroReferidor('') }}
                        className="text-xs text-[#6b7280] hover:text-[#111111] px-3 py-2 border border-[#e5e7eb] rounded-lg bg-white transition-colors whitespace-nowrap">
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}

                {cargando && <SkeletonPanel />}

                {!cargando && filtradas.length === 0 && (
                  <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                    {liquidaciones.length === 0 ? 'No hay liquidaciones todavía.' : 'No hay resultados con los filtros aplicados.'}
                  </div>
                )}

                {!cargando && filtradas.map(liq => (
                  <div key={liq.id} className="glass-panel p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-[#111111]">
                          {liq.agencias?.nombre
                            ? `🏢 ${liq.agencias.nombre}`
                            : liq.referidores?.nombre || '—'}
                        </p>
                        {liq.origen === 'auto' && (
                          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#1e3a5f] font-medium border border-[#dce6f0]">Auto</span>
                        )}
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                          liq.estado === 'pagado'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {liq.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6b7280]">
                        {liq.agencias?.nombre ? 'Agencia' : liq.referidores?.email || ''}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs text-[#9ca3af] flex items-center gap-1">
                          <Clock size={11} /> {liq.periodo_desde} → {liq.periodo_hasta}
                        </span>
                        {liq.notas && (
                          <span className="text-xs text-[#9ca3af] italic truncate max-w-[200px]">
                            {liq.notas.replace(/\s*\[id:[^\]]+\]/, '')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:flex-col sm:items-end">
                      <p className="text-xl font-bold text-[#111111]">{parseFloat(liq.importe).toFixed(2)}€</p>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {liq.referidor_id && liq.referidores?.nombre && (
                          <button
                            onClick={() => descargarFactura(liq.referidor_id, liq.referidores.nombre)}
                            className="text-xs flex items-center gap-1.5 bg-[#f0f4f8] hover:bg-[#dce6f0] text-[#1e3a5f] border border-[#dce6f0] px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <FileText size={12} /> PDF
                          </button>
                        )}
                        {liq.estado === 'pendiente' && (
                          <button
                            onClick={() => setConfirmPago(liq)}
                            className="text-xs flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          >
                            <CheckCircle2 size={12} /> Marcar pagado
                          </button>
                        )}
                      </div>
                      {liq.estado === 'pagado' && liq.pagado_at && (
                        <p className="text-[10px] text-[#9ca3af]">
                          Pagado el {new Date(liq.pagado_at).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* CLIENTES */}
          {tab === 'clientes' && (
            <div className="space-y-3">
              {clientes.length === 0 && !clientesCargando && (
                <div className="py-14 text-center text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
                  {busquedaClientes ? `Sin resultados para "${busquedaClientes}".` : 'Introduce un nombre y pulsa Buscar.'}
                </div>
              )}
              {clientesCargando && <SkeletonPanel />}
              {!clientesCargando && clientes.map(c => (
                <div key={c.id} className="glass-panel p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-[#111111] truncate">{c.nombre}</p>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border flex-shrink-0 ${c.verificado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                        {c.verificado ? 'Visitó' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7280] truncate">
                      {c.lugares?.nombre || '—'} · {c.referidores?.nombre || 'Sin referidor'} · {c.num_personas} pers.
                    </p>
                    <p className="text-[10px] text-[#9ca3af] mt-0.5">
                      {new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => { setModalEditCliente(c); setFormCliente({ nombre: c.nombre, num_personas: c.num_personas }) }}
                      className="p-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] text-[#6b7280] hover:text-[#111111] transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmBorrar(c)}
                      className="p-2 rounded-lg border border-red-100 hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                      <XCircle size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </motion.div>
      </main>

      {/* MODAL EDITAR CLIENTE */}
      <AnimatePresence>
        {modalEditCliente && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30" onClick={() => { setModalEditCliente(null); setFormCliente({}) }} />
            <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-lg">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Pencil size={16} className="text-[#1e3a5f]" /> Editar Cliente
                </h2>
                <button onClick={() => { setModalEditCliente(null); setFormCliente({}) }} className="text-[#9ca3af] hover:text-[#374151]"><XCircle size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Nombre</label>
                  <input value={formCliente.nombre || ''} onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })}
                    className={inputClass} placeholder="Nombre del cliente" />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Personas</label>
                  <input type="number" min="1" max="50" value={formCliente.num_personas || 1}
                    onChange={e => setFormCliente({ ...formCliente, num_personas: e.target.value })}
                    className={inputClass} />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => { setModalEditCliente(null); setFormCliente({}) }}
                  className="flex-1 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={editarCliente}
                  className="flex-1 py-2.5 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#15294a] transition-colors">
                  Guardar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMAR BORRADO */}
      <AnimatePresence>
        {confirmBorrar && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30" onClick={() => setConfirmBorrar(null)} />
            <motion.div initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-lg">
              <h2 className="text-base font-bold text-[#111111] mb-2">¿Eliminar cliente?</h2>
              <p className="text-sm text-[#6b7280] mb-5">
                Se eliminará <strong>{confirmBorrar.nombre}</strong> y todas sus valoraciones. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmBorrar(null)}
                  className="flex-1 py-2.5 border border-[#e5e7eb] rounded-lg text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => borrarCliente(confirmBorrar.id)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  Nuevo {modal === 'lugar' ? 'Local' : modal === 'referidor' ? 'Referidor' : modal === 'agencia' ? 'Agencia' : 'Staff'}
                </h2>
                <button onClick={() => { setModal(null); setForm({}) }} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                  <XCircle size={22} />
                </button>
              </div>

              <div className="space-y-3">
                {modal === 'lugar' && <>
                  <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Datos del local</p>
                  <input placeholder="Nombre del local" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                  <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })} className={`${inputClass} appearance-none`}>
                    <option value="">Tipo de lugar</option>
                    {['Restaurante', 'Bar', 'Club', 'Hotel', 'Turismo', 'Experiencia'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Dirección física" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} className={inputClass} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">Descuento turistas (%)</label>
                      <input type="number" min="0" max="100" value={form.descuento ?? 10} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs text-[#6b7280] mb-1 block">Comisión plataforma (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={form.porcentaje_plataforma ?? 20} onChange={e => setForm({ ...form, porcentaje_plataforma: parseFloat(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider pt-1">Acceso Manager</p>
                  <input placeholder="Nombre del manager" value={form.manager_nombre || ''} onChange={e => setForm({ ...form, manager_nombre: e.target.value })} className={inputClass} />
                  <input placeholder="Email del manager" type="email" value={form.manager_email || ''} onChange={e => setForm({ ...form, manager_email: e.target.value })} className={inputClass} />
                  <input placeholder="Contraseña (mín. 6 caracteres)" type="password" value={form.manager_password || ''} onChange={e => setForm({ ...form, manager_password: e.target.value })} className={inputClass} />
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

                {modal === 'agencia' && <>
                  <input placeholder="Nombre de la agencia" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass} />
                  <input type="text" placeholder="Email de acceso" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} />
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

      {/* MODAL NUEVA LIQUIDACIÓN */}
      <AnimatePresence>
        {modalLiq && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setModalLiq(false)}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-md relative z-10 shadow-lg"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                  <CreditCard size={18} className="text-[#1e3a5f]" /> Nueva Liquidación
                </h2>
                <button onClick={() => setModalLiq(false)} className="text-[#9ca3af] hover:text-[#374151] transition-colors">
                  <XCircle size={22} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Referidor *</label>
                  <select value={formLiq.referidor_id} onChange={e => setFormLiq({ ...formLiq, referidor_id: e.target.value })} className={`${inputClass} appearance-none`}>
                    <option value="">Seleccionar referidor...</option>
                    {referidores.map(r => <option key={r.id} value={r.id}>{r.nombre} — {r.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Importe (€) *</label>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={formLiq.importe} onChange={e => setFormLiq({ ...formLiq, importe: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Período desde *</label>
                    <input type="date" value={formLiq.periodo_desde} onChange={e => setFormLiq({ ...formLiq, periodo_desde: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Período hasta *</label>
                    <input type="date" value={formLiq.periodo_hasta} onChange={e => setFormLiq({ ...formLiq, periodo_hasta: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">Notas (opcional)</label>
                  <textarea rows={2} placeholder="Comentarios..." value={formLiq.notas} onChange={e => setFormLiq({ ...formLiq, notas: e.target.value })} className={`${inputClass} resize-none`} />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalLiq(false)}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={crearLiquidacion}
                  className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Crear Liquidación
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMACIÓN MARCAR PAGADO */}
      <AnimatePresence>
        {confirmPago && (
          <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setConfirmPago(null)}
            />
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-sm relative z-10 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#111111]">Confirmar pago</h2>
                  <p className="text-xs text-[#6b7280]">Esta acción no se puede deshacer</p>
                </div>
              </div>
              <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 mb-5 space-y-1">
                <p className="text-sm font-semibold text-[#111111]">{confirmPago.referidores?.nombre}</p>
                <p className="text-xs text-[#6b7280]">{confirmPago.periodo_desde} → {confirmPago.periodo_hasta}</p>
                <p className="text-xl font-bold text-[#111111] mt-1">{parseFloat(confirmPago.importe).toFixed(2)}€</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmPago(null)}
                  className="flex-1 border border-[#e5e7eb] text-[#6b7280] py-2.5 rounded-lg text-sm font-medium hover:bg-[#f3f4f6] transition-colors">
                  Cancelar
                </button>
                <button onClick={() => marcarPagado(confirmPago.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Confirmar pago
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Descuento turistas (%)</label>
                    <input type="number" min="0" max="100" value={form.descuento ?? ''} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-[#6b7280] mb-1 block">Comisión plataforma (%)</label>
                    <input type="number" min="0" max="100" step="0.5" value={form.porcentaje_plataforma ?? ''} onChange={e => setForm({ ...form, porcentaje_plataforma: parseFloat(e.target.value) })} className={inputClass} />
                  </div>
                </div>
                {modalEditar?.managers_locales?.[0] && (
                  <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg px-3 py-2.5">
                    <p className="text-xs text-[#6b7280] mb-0.5">Manager actual</p>
                    <p className="text-sm font-medium text-[#111111]">{modalEditar.managers_locales[0].nombre}</p>
                    <p className="text-xs text-[#9ca3af]">{modalEditar.managers_locales[0].email}</p>
                  </div>
                )}
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
