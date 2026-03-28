'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, MapPin, Users, UserCheck, Plus, Shield, Search, BarChart3, CreditCard, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'

// Componentes divididos
import AnalyticsTab from './components/AnalyticsTab'
import LugaresTab from './components/LugaresTab'
import ReferidoresTab from './components/ReferidoresTab'
import StaffTab from './components/StaffTab'
import AgenciasTab from './components/AgenciasTab'
import LiquidacionesTab from './components/LiquidacionesTab'
import ClientesTab from './components/ClientesTab'
import {
  ModalCrear, ModalEditarLugar, ModalLiquidacion,
  ModalConfirmPago, ModalEditCliente, ModalConfirmEliminar, ModalConfirmBorrar
} from './components/Modals'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function SuperadminPage() {
  const { t } = useLanguage()
  const router = useRouter()

  // ── State ──────────────────────────────────────────────
  const [tab, setTab] = useState('lugares')
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  // Data
  const [lugares, setLugares] = useState([])
  const [referidores, setReferidores] = useState([])
  const [staff, setStaff] = useState([])
  const [agencias, setAgencias] = useState([])
  const [liquidaciones, setLiquidaciones] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { operaciones: 0, volumenEuros: 0, comisionGenerada: 0 } })
  const [discrepancias, setDiscrepancias] = useState({ resumen: { total: 0, amarillas: 0, naranjas: 0, rojas: 0, diferencia_total: 0 }, porMes: [], porLocal: [] })

  // Clientes
  const [clientes, setClientes] = useState([])
  const [busquedaClientes, setBusquedaClientes] = useState('')
  const [clientesCargando, setClientesCargando] = useState(false)
  const [lugarFiltroClientes, setLugarFiltroClientes] = useState('')
  const [barrioFiltro, setBarrioFiltro] = useState('')
  const [paginacion, setPaginacion] = useState({ pagina: 1, total: 0, totalPaginas: 1 })

  // Filtros analytics
  const [filtroFecha, setFiltroFecha] = useState('mes')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Filtros liquidaciones
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroReferidor, setFiltroReferidor] = useState('')
  const [filtroLugarPagos, setFiltroLugarPagos] = useState('')

  // Modals
  const [modal, setModal] = useState(null)
  const [modalEditar, setModalEditar] = useState(null)
  const [modalLiq, setModalLiq] = useState(false)
  const [formLiq, setFormLiq] = useState({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
  const [confirmPago, setConfirmPago] = useState(null)
  const [modalEditCliente, setModalEditCliente] = useState(null)
  const [formCliente, setFormCliente] = useState({})
  const [confirmBorrar, setConfirmBorrar] = useState(null)
  const [confirmEliminarLugar, setConfirmEliminarLugar] = useState(null)
  const [form, setForm] = useState({})

  // ── Effects ────────────────────────────────────────────
  useEffect(() => {
    if (tab === 'clientes' && lugarFiltroClientes) cargarClientes('', lugarFiltroClientes)
  }, [tab])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'superadmin') cargarDatos()
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [])

  // ── Data loading ───────────────────────────────────────
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
      desde = hoy.toISOString().split('T')[0]; hasta = desde
    } else if (preset === 'semana') {
      const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
      desde = lunes.toISOString().split('T')[0]; hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'mes') {
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]; hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'año') {
      desde = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0]; hasta = hoy.toISOString().split('T')[0]
    } else if (preset === 'custom') {
      desde = customDesde || fechaDesde; hasta = customHasta || fechaHasta
    }
    const params = new URLSearchParams()
    if (desde) params.set('desde', desde)
    if (hasta) params.set('hasta', hasta)
    const [resAn, resDisc] = await Promise.all([
      fetch(`/api/analytics/superadmin?${params}`, { credentials: 'include' }),
      fetch(`/api/admin/discrepancias?${params}`, { credentials: 'include' })
    ])
    if (resAn.ok) setAnalytics(await resAn.json())
    if (resDisc.ok) setDiscrepancias(await resDisc.json())
  }

  const cargarClientes = async (busqueda = '', lugarId = '', pagina = 1) => {
    setClientesCargando(true)
    try {
      const params = new URLSearchParams()
      if (busqueda) params.set('busqueda', busqueda)
      if (lugarId) params.set('lugarId', lugarId)
      params.set('pagina', pagina.toString())
      params.set('porPagina', '50')
      const res = await fetch(`/api/admin/clientes?${params.toString()}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setClientes(data.clientes || [])
        if (data.paginacion) setPaginacion(data.paginacion)
      }
    } finally {
      setClientesCargando(false)
    }
  }

  // ── Actions ────────────────────────────────────────────
  const handleSubmit = async () => {
    const url = modal === 'lugar' ? '/api/lugares' : modal === 'referidor' ? '/api/referidores' : modal === 'agencia' ? '/api/agencias' : '/api/staff'
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) })
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ id: modalEditar.id, nombre: form.nombre || modalEditar.nombre, descuento: parseInt(form.descuento ?? modalEditar.descuento), porcentaje_plataforma: parseFloat(form.porcentaje_plataforma ?? modalEditar.porcentaje_plataforma ?? 20), barrio: form.barrio ?? modalEditar.barrio ?? '' })
    })
    if (res.ok) { toast.success('Local actualizado.'); setModalEditar(null); setForm({}); cargarDatos() }
    else toast.error('Error al actualizar.')
  }

  const toggleActivo = async (tipo, id, activo) => {
    const url = tipo === 'lugar' ? '/api/lugares' : '/api/referidores'
    const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, activo: !activo }) })
    if (res.ok) { toast.success(activo ? `${tipo} pausado.` : `${tipo} reactivado.`); cargarDatos() }
    else toast.error('No autorizado.')
  }

  const toggleActivoAgencia = async (id, activo) => {
    const res = await fetch('/api/agencias', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, activo: !activo }) })
    if (res.ok) { setAgencias(agencias.map(a => a.id === id ? { ...a, activo: !activo } : a)); toast.success(activo ? 'Agencia suspendida.' : 'Agencia reactivada.') }
  }

  const crearLiquidacion = async () => {
    if (!formLiq.referidor_id || !formLiq.importe || !formLiq.periodo_desde || !formLiq.periodo_hasta) { toast.error('Rellena todos los campos obligatorios.'); return }
    const res = await fetch('/api/liquidaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...formLiq, importe: parseFloat(formLiq.importe) }) })
    if (res.ok) {
      const data = await res.json()
      setLiquidaciones([data.liquidacion, ...liquidaciones])
      setModalLiq(false); setFormLiq({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
      toast.success('Liquidación creada.')
    } else toast.error('Error al crear liquidación.')
  }

  const marcarPagado = async (id) => {
    const res = await fetch('/api/liquidaciones', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, estado: 'pagado' }) })
    if (res.ok) { setLiquidaciones(liquidaciones.map(l => l.id === id ? { ...l, estado: 'pagado', pagado_at: new Date().toISOString() } : l)); setConfirmPago(null); toast.success('Marcada como pagada.') }
  }

  const eliminarLugar = async (id) => {
    const res = await fetch('/api/lugares', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Local eliminado.'); setConfirmEliminarLugar(null); setLugares(lugares.filter(l => l.id !== id)) }
    else toast.error('Error al eliminar el local.')
  }

  const editarCliente = async () => {
    if (!modalEditCliente) return
    const body = { id: modalEditCliente.id }
    if (formCliente.nombre !== undefined) body.nombre = formCliente.nombre
    if (formCliente.num_personas !== undefined) body.num_personas = parseInt(formCliente.num_personas)
    const res = await fetch('/api/admin/clientes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) })
    if (res.ok) { toast.success('Cliente actualizado.'); setModalEditCliente(null); setFormCliente({}); cargarClientes(busquedaClientes) }
    else toast.error('Error al actualizar.')
  }

  const borrarCliente = async (id) => {
    const res = await fetch('/api/admin/clientes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Cliente eliminado.'); setConfirmBorrar(null); setClientes(clientes.filter(c => c.id !== id)) }
    else toast.error('Error al eliminar.')
  }

  const descargarFactura = async (referidorId, nombreReferidor) => {
    toast.loading('Generando PDF...', { id: 'pdf' })
    try {
      const res = await fetch(`/api/facturas?referidorid=${referidorId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `Liquidacion_${nombreReferidor.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url)
      toast.success('Factura descargada', { id: 'pdf' })
    } catch (e) { toast.error(e.message, { id: 'pdf' }) }
  }

  const exportarLiquidacionesPDF = async () => {
    toast.loading('Generando PDF...', { id: 'pdf-liq' })
    try {
      const res = await fetch('/api/export/pdf-liquidaciones', { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `liquidaciones_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url)
      toast.success('PDF descargado', { id: 'pdf-liq' })
    } catch (e) { toast.error(e.message, { id: 'pdf-liq' }) }
  }

  const exportarExcel = async () => {
    toast.loading('Generando Excel...', { id: 'xlsx' })
    try {
      const res = await fetch('/api/export/xlsx', { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el Excel')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `ElCodigo_Export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url)
      toast.success('Excel descargado', { id: 'xlsx' })
    } catch (e) { toast.error(e.message, { id: 'xlsx' }) }
  }

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  const tabs = [
    { id: 'analytics', label: t('superadmin','metrics'), icon: <BarChart3 size={15} /> },
    { id: 'lugares', label: t('superadmin','places'), icon: <MapPin size={15} /> },
    { id: 'referidores', label: t('superadmin','referrers'), icon: <Users size={15} /> },
    { id: 'staff', label: t('superadmin','staff'), icon: <UserCheck size={15} /> },
    { id: 'agencias', label: t('superadmin','agencies'), icon: <Building2 size={15} /> },
    { id: 'liquidaciones', label: t('superadmin','payments'), icon: <CreditCard size={15} /> },
    { id: 'clientes', label: t('superadmin','clients'), icon: <Users size={15} /> }
  ]

  // ── Render ─────────────────────────────────────────────
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
          <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors">
            <LogOut size={15} /> <span className="hidden sm:inline">{t('common','logout')}</span>
          </button>
        </div>
      </nav>

      <ErrorBoundary>
        <main className="max-w-5xl mx-auto p-5 mt-6">
          {/* Tabs */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1 overflow-x-auto" role="tablist">
            {tabs.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id}
                onClick={() => { setTab(t.id); setBusqueda('') }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  tab === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
                }`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Barra de acciones para tabs con búsqueda */}
          {['lugares', 'referidores', 'staff'].includes(tab) && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={15} />
                <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
                  className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors bg-white placeholder:text-[#9ca3af]" />
              </div>
              <button
                onClick={() => { setModal(tab === 'lugares' ? 'lugar' : tab === 'referidores' ? 'referidor' : 'staff'); setForm({ descuento: tab === 'lugares' ? 10 : undefined }) }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                <Plus size={15} /> Nuevo {tab === 'lugares' ? 'Local' : tab === 'referidores' ? 'Referidor' : 'Staff'}
              </button>
            </div>
          )}

          {cargando && tab !== 'analytics' ? <SkeletonPanel /> : (
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'analytics' && (
                <AnalyticsTab analytics={analytics} discrepancias={discrepancias}
                  filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha}
                  fechaDesde={fechaDesde} setFechaDesde={setFechaDesde}
                  fechaHasta={fechaHasta} setFechaHasta={setFechaHasta}
                  cargarAnalytics={cargarAnalytics} exportarExcel={exportarExcel} t={t} />
              )}

              {tab === 'clientes' && (
                <ClientesTab clientes={clientes} lugares={lugares}
                  lugarFiltroClientes={lugarFiltroClientes} setLugarFiltroClientes={setLugarFiltroClientes}
                  barrioFiltro={barrioFiltro} setBarrioFiltro={setBarrioFiltro}
                  busquedaClientes={busquedaClientes} setBusquedaClientes={setBusquedaClientes}
                  clientesCargando={clientesCargando} cargarClientes={cargarClientes}
                  paginacion={paginacion}
                  setModalEditCliente={setModalEditCliente} setFormCliente={setFormCliente}
                  setConfirmBorrar={setConfirmBorrar} setClientes={setClientes} />
              )}

              {tab === 'agencias' && (
                <AgenciasTab agencias={agencias} cargando={cargando}
                  toggleActivoAgencia={toggleActivoAgencia} setModal={setModal} setForm={setForm} />
              )}

              {tab === 'liquidaciones' && (
                <LiquidacionesTab liquidaciones={liquidaciones} cargando={cargando}
                  referidores={referidores} lugares={lugares}
                  filtroEstado={filtroEstado} setFiltroEstado={setFiltroEstado}
                  filtroReferidor={filtroReferidor} setFiltroReferidor={setFiltroReferidor}
                  filtroLugarPagos={filtroLugarPagos} setFiltroLugarPagos={setFiltroLugarPagos}
                  setModalLiq={setModalLiq} setConfirmPago={setConfirmPago}
                  descargarFactura={descargarFactura} exportarLiquidacionesPDF={exportarLiquidacionesPDF} />
              )}

              {/* Grid tabs: lugares, referidores, staff */}
              {['lugares', 'referidores', 'staff'].includes(tab) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tab === 'lugares' && <LugaresTab lugares={lugares} busqueda={busqueda} toggleActivo={toggleActivo} setModalEditar={setModalEditar} setForm={setForm} setConfirmEliminarLugar={setConfirmEliminarLugar} appUrl={appUrl} />}
                  {tab === 'referidores' && <ReferidoresTab referidores={referidores} busqueda={busqueda} appUrl={appUrl} descargarFactura={descargarFactura} toggleActivo={toggleActivo} />}
                  {tab === 'staff' && <StaffTab staff={staff} busqueda={busqueda} />}
                </div>
              )}
            </motion.div>
          )}
        </main>
      </ErrorBoundary>

      {/* Modals */}
      <ModalCrear modal={modal} setModal={setModal} form={form} setForm={setForm} handleSubmit={handleSubmit} lugares={lugares} />
      <ModalEditarLugar modalEditar={modalEditar} setModalEditar={setModalEditar} form={form} setForm={setForm} handleEditar={handleEditar} />
      <ModalLiquidacion modalLiq={modalLiq} setModalLiq={setModalLiq} formLiq={formLiq} setFormLiq={setFormLiq} crearLiquidacion={crearLiquidacion} referidores={referidores} />
      <ModalConfirmPago confirmPago={confirmPago} setConfirmPago={setConfirmPago} marcarPagado={marcarPagado} />
      <ModalEditCliente modalEditCliente={modalEditCliente} setModalEditCliente={setModalEditCliente} formCliente={formCliente} setFormCliente={setFormCliente} editarCliente={editarCliente} />
      <ModalConfirmEliminar confirmEliminarLugar={confirmEliminarLugar} setConfirmEliminarLugar={setConfirmEliminarLugar} eliminarLugar={eliminarLugar} />
      <ModalConfirmBorrar confirmBorrar={confirmBorrar} setConfirmBorrar={setConfirmBorrar} borrarCliente={borrarCliente} />
    </div>
  )
}
