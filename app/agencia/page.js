'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, BarChart3, Briefcase, Users, Trophy, CreditCard } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import DashboardTab from './components/DashboardTab'
import RankingTab from './components/RankingTab'
import EquipoTab from './components/EquipoTab'
import PagosTab from './components/PagosTab'
import { ModalCrearPromotor, ModalNuevaLiquidacion, ModalConfirmPago } from './components/Modals'
import ErrorBoundary from '../../components/ErrorBoundary'
import { toast } from 'react-hot-toast'

export default function AgenciaPage() {
  const { t } = useLanguage()
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
  const [stripeOnboarded, setStripeOnboarded] = useState(false)
  const [stripeConectando, setStripeConectando] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'agencia') { setAgencia(data.agencia); cargarDatosGenerales() }
        else router.push('/login')
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
    } catch (e) { toast.error('Error cargando datos. Intenta de nuevo.') }
    finally { setCargando(false) }
  }

  const crearLiquidacion = async () => {
    if (!formLiq.referidor_id || !formLiq.importe || !formLiq.periodo_desde || !formLiq.periodo_hasta) return
    setLiqCargando(true)
    try {
      const res = await fetch('/api/liquidaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...formLiq, importe: parseFloat(formLiq.importe) })
      })
      if (res.ok) {
        const d = await res.json()
        setLiquidaciones([d.liquidacion, ...liquidaciones])
        setModalLiq(false)
        setFormLiq({ referidor_id: '', importe: '', periodo_desde: '', periodo_hasta: '', notas: '' })
      }
    } finally { setLiqCargando(false) }
  }

  const marcarPagado = async (id) => {
    const res = await fetch('/api/liquidaciones', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ id, estado: 'pagado' })
    })
    if (res.ok) {
      setLiquidaciones(liquidaciones.map(l => l.id === id ? { ...l, estado: 'pagado', pagado_at: new Date().toISOString() } : l))
      setConfirmPago(null)
    }
  }

  const handleCrearPromotor = async (e) => {
    e.preventDefault()
    if (!nuevoRef.nombre || !nuevoRef.email || !nuevoRef.password) { setAddError('Rellena todos los campos.'); return }
    setAddCargando(true); setAddError('')
    try {
      const res = await fetch('/api/agencias/promotores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...nuevoRef, porcentaje_split: nuevoRef.split })
      })
      const data = await res.json()
      if (res.ok) {
        setEquipo([data.promotor, ...equipo])
        setShowAddModal(false)
        setNuevoRef({ nombre: '', email: '', password: '', split: 50 })
        cargarDatosGenerales()
      } else { setAddError(data.error || 'Error al crear promotor') }
    } catch (err) { setAddError('Fallo de conexión') }
    finally { setAddCargando(false) }
  }

  const toggleActivo = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/agencias/promotores', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ id, activo: !currentStatus })
      })
      if (res.ok) setEquipo(equipo.map(r => r.id === id ? { ...r, activo: !currentStatus } : r))
    } catch (e) { toast.error('Error actualizando estado del promotor.') }
  }

  const comprobarStripe = async () => {
    const res = await fetch('/api/stripe/connect', { credentials: 'include' })
    if (res.ok) { const d = await res.json(); setStripeOnboarded(d.onboarded) }
  }

  const conectarStripe = async () => {
    setStripeConectando(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (res.ok && data.url) window.location.href = data.url
    } finally { setStripeConectando(false) }
  }

  const tabs = [
    { id: 'dashboard', label: t('agencia', 'performance'), icon: <BarChart3 size={15} /> },
    { id: 'ranking', label: t('agencia', 'ranking'), icon: <Trophy size={15} /> },
    { id: 'equipo', label: t('agencia', 'promoters'), icon: <Users size={15} /> },
    { id: 'pagos', label: t('agencia', 'payments'), icon: <CreditCard size={15} /> }
  ]

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#f0f4f8] rounded-lg flex items-center justify-center">
            <Briefcase size={15} className="text-[#1e3a5f]" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-[#111111]">{t('agencia', 'agencyPanel')}</h1>
            <p className="text-xs text-[#6b7280]">{agencia?.nombre}</p>
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

      <ErrorBoundary>
        <main className="max-w-3xl mx-auto p-5 mt-6">
          {/* Tabs */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1" role="tablist">
            {tabs.map(tb => (
              <button key={tb.id} role="tab" aria-selected={tab === tb.id}
                onClick={() => { setTab(tb.id); if (tb.id === 'pagos') comprobarStripe() }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  tab === tb.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
                }`}
              >
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>

          {cargando ? <SkeletonPanel /> : (
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {tab === 'dashboard' && <DashboardTab analytics={analytics} />}
              {tab === 'ranking' && <RankingTab ranking={ranking} />}
              {tab === 'equipo' && <EquipoTab equipo={equipo} ranking={ranking} toggleActivo={toggleActivo} setShowAddModal={setShowAddModal} />}
              {tab === 'pagos' && <PagosTab stripeOnboarded={stripeOnboarded} stripeConectando={stripeConectando}
                conectarStripe={conectarStripe} liquidaciones={liquidaciones} setModalLiq={setModalLiq} setConfirmPago={setConfirmPago} />}
            </motion.div>
          )}
        </main>
      </ErrorBoundary>

      <ModalCrearPromotor show={showAddModal} onClose={() => setShowAddModal(false)}
        nuevoRef={nuevoRef} setNuevoRef={setNuevoRef}
        handleCrearPromotor={handleCrearPromotor} addCargando={addCargando} addError={addError} />
      <ModalNuevaLiquidacion show={modalLiq} onClose={() => setModalLiq(false)}
        formLiq={formLiq} setFormLiq={setFormLiq} equipo={equipo}
        crearLiquidacion={crearLiquidacion} liqCargando={liqCargando} />
      <ModalConfirmPago confirmPago={confirmPago} onClose={() => setConfirmPago(null)} marcarPagado={marcarPagado} />
    </div>
  )
}
