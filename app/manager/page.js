'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Building2, BarChart3, Shield, CreditCard } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { toast } from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'
import DashboardTab from './components/DashboardTab'
import EquipoTab from './components/EquipoTab'
import PagosTab from './components/PagosTab'
import { ModalNuevoStaff, ModalTicketAmpliado } from './components/Modals'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function ManagerPage() {
  const { t } = useLanguage()
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
  const [tab, setTab] = useState('dashboard')
  const [resumenPago, setResumenPago] = useState(null)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [pagando, setPagando] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [cargandoStaff, setCargandoStaff] = useState(false)
  const [modalNuevoStaff, setModalNuevoStaff] = useState(false)
  const [formStaff, setFormStaff] = useState({ nombre: '', email: '', password: '' })
  const [guardandoStaff, setGuardandoStaff] = useState(false)
  const [errorStaff, setErrorStaff] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'manager') { setManager(data.manager); cargarAnalytics('todo') }
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!manager) return
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const canal = supabase
      .channel('validaciones-manager')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'valoraciones',
        filter: `lugar_id=eq.${manager.lugarId || '00000000-0000-0000-0000-000000000000'}`
      }, () => { setUltimaValidacion(true); setSegsDesde(0); cargarAnalytics() })
      .subscribe()
    const intervalo = setInterval(() => { setSegsDesde(prev => prev !== null ? prev + 1 : null) }, 1000)
    return () => { supabase.removeChannel(canal); clearInterval(intervalo) }
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
    } catch (e) { toast.error('Error cargando datos. Intenta de nuevo.') }
    finally { setCargando(false) }
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
    try {
      const res = await fetch('/api/manager/staff', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activo: !activo })
      })
      if (res.ok) setStaffList(prev => prev.map(s => s.id === id ? { ...s, activo: !activo } : s))
      else toast.error('Error actualizando estado del staff.')
    } catch (e) { toast.error('Error de conexión.') }
  }

  const cargarResumenPago = async () => {
    setCargandoPago(true); setResumenPago(null)
    try {
      const res = await fetch('/api/stripe/pago-manager', { credentials: 'include' })
      if (res.ok) setResumenPago(await res.json())
    } finally { setCargandoPago(false) }
  }

  const iniciarPago = async () => {
    setPagando(true)
    try {
      const res = await fetch('/api/stripe/pago-manager', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
      })
      const data = await res.json()
      if (res.ok && data.checkoutUrl) window.location.href = data.checkoutUrl
    } finally { setPagando(false) }
  }

  const exportarLiquidacionesPDF = async () => {
    toast.loading('Generando PDF...', { id: 'pdf-liq' })
    try {
      const res = await fetch('/api/export/pdf-liquidaciones', { credentials: 'include' })
      if (!res.ok) throw new Error('Fallo al generar el PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `liquidaciones_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url)
      toast.success('PDF descargado', { id: 'pdf-liq' })
    } catch (e) { toast.error(e.message, { id: 'pdf-liq' }) }
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
    const a = document.createElement('a'); a.href = url
    a.download = `Clientes_${fecha.replace(/\//g, '-')}.csv`
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(url)
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
        <div className="flex items-center gap-2">
          <LangSelector />
          <button
            onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
            aria-label={t('common','logout')}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">{t('common','logout')}</span>
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-5 pt-5">
        <div className="flex gap-1 bg-[#f3f4f6] rounded-xl p-1" role="tablist">
          {[['dashboard', <BarChart3 size={14} />, t('manager','dashboard')], ['equipo', <Shield size={14} />, t('manager','team')], ['pagos', <CreditCard size={14} />, t('manager','payments')]].map(([key, icon, label]) => (
            <button key={key} role="tab" aria-selected={tab === key}
              onClick={() => { setTab(key); if (key === 'equipo' && staffList.length === 0) cargarStaff(); if (key === 'pagos') cargarResumenPago() }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'}`}
            >{icon}{label}</button>
          ))}
        </div>
      </div>

      <ErrorBoundary>
        <main className="max-w-3xl mx-auto p-5 mt-4">
          {tab === 'pagos' && (
            <PagosTab cargandoPago={cargandoPago} resumenPago={resumenPago} pagando={pagando}
              iniciarPago={iniciarPago} exportarLiquidacionesPDF={exportarLiquidacionesPDF} />
          )}

          {tab === 'equipo' && (
            <EquipoTab t={t} staffList={staffList} cargandoStaff={cargandoStaff}
              toggleStaff={toggleStaff} setModalNuevoStaff={setModalNuevoStaff} setErrorStaff={setErrorStaff} />
          )}

          {tab === 'dashboard' && cargando && <SkeletonPanel />}
          {tab === 'dashboard' && !cargando && (
            <DashboardTab t={t} analytics={analytics} cargando={cargando}
              ultimaValidacion={ultimaValidacion} segsDesde={segsDesde}
              filtroFecha={filtroFecha} setFiltroFecha={setFiltroFecha}
              fechaDesde={fechaDesde} setFechaDesde={setFechaDesde}
              fechaHasta={fechaHasta} setFechaHasta={setFechaHasta}
              cargarAnalytics={cargarAnalytics} exportarHoy={exportarHoy}
              tickets={tickets} setTicketAmpliado={setTicketAmpliado} />
          )}
        </main>
      </ErrorBoundary>

      <ModalNuevoStaff t={t} show={modalNuevoStaff} onClose={() => setModalNuevoStaff(false)}
        formStaff={formStaff} setFormStaff={setFormStaff}
        crearStaff={crearStaff} guardandoStaff={guardandoStaff} errorStaff={errorStaff} />
      <ModalTicketAmpliado ticketAmpliado={ticketAmpliado} onClose={() => setTicketAmpliado(null)} />
    </div>
  )
}
