'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Users, QrCode, BarChart3, Receipt } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import QRCode from 'qrcode'
import DashboardTab from './components/DashboardTab'
import QRTab from './components/QRTab'
import ClientesTab from './components/ClientesTab'
import PagosTab from './components/PagosTab'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function ReferidorPage() {
  const { t } = useLanguage()
  const [referidor, setReferidor] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [clientes, setClientes] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { exitosMios: 0, comisionesLiquidadas: 0 } })
  const [cargando, setCargando] = useState(true)
  const [copiadoMsj, setCopiado] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState('')
  const [historial, setHistorial] = useState([])
  const [historialStats, setHistorialStats] = useState({ totalConversiones: 0, totalGasto: 0, totalComision: 0 })
  const [historialPagina, setHistorialPagina] = useState(1)
  const [historialTotalPag, setHistorialTotalPag] = useState(1)
  const [historialCargando, setHistorialCargando] = useState(false)
  const [liquidaciones, setLiquidaciones] = useState([])
  const [stripeOnboarded, setStripeOnboarded] = useState(false)
  const [stripeConectando, setStripeConectando] = useState(false)
  const router = useRouter()

  const iniciarSesion = (referidorObj) => {
    setReferidor(referidorObj)
    cargarClientes()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const urlReferido = `${appUrl}/r/${referidorObj.qr_token}`
    QRCode.toDataURL(urlReferido, {
      width: 300, margin: 2,
      color: { dark: '#1e3a5f', light: '#ffffff' }
    }).then(setQrImageUrl).catch(console.error)
  }

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'referidor') {
          iniciarSesion(data.referidor)
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
  }, [])

  const cargarClientes = async () => {
    try {
      const [resC, resA, resL] = await Promise.all([
        fetch('/api/referidor/clientes', { credentials: 'include' }),
        fetch('/api/analytics/referidor', { credentials: 'include' }),
        fetch('/api/liquidaciones', { credentials: 'include' })
      ])
      if (resC.ok) { const data = await resC.json(); setClientes(data.clientes || []) }
      if (resA.ok) { setAnalytics(await resA.json()) }
      if (resL.ok) { const dataL = await resL.json(); setLiquidaciones(dataL.liquidaciones || []) }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const cargarHistorial = async (pagina = 1) => {
    setHistorialCargando(true)
    try {
      const [resH, resL] = await Promise.all([
        fetch(`/api/referidor/historial?pagina=${pagina}`, { credentials: 'include' }),
        fetch('/api/liquidaciones', { credentials: 'include' })
      ])
      if (resH.ok) {
        const data = await resH.json()
        setHistorial(data.historial || [])
        setHistorialTotalPag(data.totalPaginas || 1)
        setHistorialPagina(data.paginaActual || 1)
        setHistorialStats({ totalConversiones: data.totalConversiones, totalGasto: data.totalGasto, totalComision: data.totalComision })
      }
      if (resL.ok) {
        const dataL = await resL.json()
        setLiquidaciones(dataL.liquidaciones || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setHistorialCargando(false)
    }
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

  const handleCopiarUrl = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    navigator.clipboard.writeText(`${appUrl}/r/${referidor?.qr_token}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const tabs = [
    { id: 'dashboard', label: t('referidor', 'performance'), icon: <BarChart3 size={15} /> },
    { id: 'qr', label: t('referidor', 'myQR'), icon: <QrCode size={15} /> },
    { id: 'clientes', label: t('referidor', 'guests'), icon: <Users size={15} /> },
    { id: 'historial', label: t('referidor', 'payments'), icon: <Receipt size={15} />, onSelect: () => { cargarHistorial(1); comprobarStripe() } }
  ]

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-[#111111]">{t('referidor', 'title')}</h1>
          <p className="text-sm text-[#6b7280]">{referidor?.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <LangSelector />
          <button
            onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
            aria-label={t('common', 'logout')}
          >
            <LogOut size={15} />
            <span>{t('common', 'logout')}</span>
          </button>
        </div>
      </nav>

      <ErrorBoundary>
        <main className="max-w-3xl mx-auto p-5 mt-6">
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1" role="tablist">
            {tabs.map(tb => (
              <button
                key={tb.id}
                role="tab"
                aria-selected={tab === tb.id}
                onClick={() => { setTab(tb.id); tb.onSelect?.() }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
                  tab === tb.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
                }`}
              >
                {tb.icon}
                {tb.label}
              </button>
            ))}
          </div>

          {cargando && tab === 'dashboard' && <SkeletonPanel />}

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'dashboard' && !cargando && <DashboardTab analytics={analytics} liquidaciones={liquidaciones} />}
            {tab === 'qr' && <QRTab referidor={referidor} qrImageUrl={qrImageUrl} appUrl={appUrl} handleCopiarUrl={handleCopiarUrl} copiadoMsj={copiadoMsj} />}
            {tab === 'clientes' && <ClientesTab clientes={clientes} />}
            {tab === 'historial' && (
              <PagosTab
                stripeOnboarded={stripeOnboarded} stripeConectando={stripeConectando} conectarStripe={conectarStripe}
                historial={historial} historialCargando={historialCargando} historialStats={historialStats}
                historialPagina={historialPagina} historialTotalPag={historialTotalPag} cargarHistorial={cargarHistorial}
                liquidaciones={liquidaciones}
              />
            )}
          </motion.div>
        </main>
      </ErrorBoundary>
    </div>
  )
}
