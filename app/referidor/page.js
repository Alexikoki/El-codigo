'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Copy, Users, Calendar, CheckCircle2, Clock, QrCode, BarChart3, TrendingUp, Receipt, Euro, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'
import { SkeletonPanel } from '../../components/Skeleton'
import LangSelector from '../../components/LangSelector'
import QRCode from 'qrcode'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ReferidorPage() {
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
    const rol = localStorage.getItem('rol')
    const r = localStorage.getItem('referidor')
    if (r && rol === 'referidor') { iniciarSesion(JSON.parse(r)); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'referidor') {
          localStorage.setItem('rol', 'referidor')
          localStorage.setItem('referidor', JSON.stringify(data.referidor))
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
    { id: 'dashboard', label: 'Rendimiento', icon: <BarChart3 size={15} /> },
    { id: 'qr', label: 'Mi QR', icon: <QrCode size={15} /> },
    { id: 'clientes', label: 'Invitados', icon: <Users size={15} /> },
    { id: 'historial', label: 'Pagos', icon: <Receipt size={15} />, onSelect: () => { cargarHistorial(1); comprobarStripe() } }
  ]

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-[#111111]">Hub de Referidor</h1>
          <p className="text-sm text-[#6b7280]">{referidor?.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <LangSelector />
          <button
            onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto p-5 mt-6">

        {/* Tabs */}
        <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-6 gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); t.onSelect?.() }}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
                tab === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {t.icon}
              {t.label}
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

          {/* DASHBOARD */}
          {tab === 'dashboard' && (() => {
            const cobrado = liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + parseFloat(l.importe), 0)
            const pendiente = liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + parseFloat(l.importe), 0)
            return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-panel p-5 border-l-4 border-l-[#1e3a5f]">
                  <p className="text-xs text-[#6b7280] mb-1">Tickets de Grupos</p>
                  <p className="text-3xl font-bold text-[#111111]">{analytics.stats.exitosMios}</p>
                  <div className="mt-3 p-2 bg-[#f0f4f8] rounded-lg w-fit">
                    <CheckCircle2 size={18} className="text-[#1e3a5f]" />
                  </div>
                </div>
                <div className="glass-panel p-5 border-l-4 border-l-[#4a9070]">
                  <p className="text-xs text-[#6b7280] mb-1">Comisión Acumulada</p>
                  <p className="text-3xl font-bold text-[#111111]">{analytics.stats.comisionesLiquidadas.toFixed(2)}€</p>
                  <div className="mt-3 p-2 bg-[#f0f7f4] rounded-lg w-fit">
                    <TrendingUp size={18} className="text-[#4a9070]" />
                  </div>
                </div>
              </div>

              {(cobrado > 0 || pendiente > 0) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-panel p-4 border-t-2 border-t-amber-400">
                    <p className="text-xs text-[#6b7280] mb-1">Pendiente de cobro</p>
                    <p className="text-2xl font-bold text-[#111111]">{pendiente.toFixed(2)}€</p>
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">En proceso</p>
                  </div>
                  <div className="glass-panel p-4 border-t-2 border-t-[#4a9070]">
                    <p className="text-xs text-[#6b7280] mb-1">Ya cobrado</p>
                    <p className="text-2xl font-bold text-[#111111]">{cobrado.toFixed(2)}€</p>
                    <p className="text-[10px] text-[#4a9070] mt-1 font-medium">Liquidado</p>
                  </div>
                </div>
              )}

              <div className="glass-panel p-5 h-[320px]">
                <h3 className="text-sm font-semibold text-[#111111] mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#1e3a5f]" /> Afluencia Histórica
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="miComision" name="Comisión / Día" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#colorRef)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            )
          })()}

          {/* QR */}
          {tab === 'qr' && (
            <div className="glass-panel p-7 flex flex-col items-center">
              <h2 className="text-sm font-semibold text-[#374151] mb-5 flex items-center gap-2 self-start">
                <QrCode size={15} className="text-[#1e3a5f]" /> Tu QR Personal
              </h2>
              <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] mb-5 shadow-sm">
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 rounded" />
                ) : (
                  <div className="w-48 h-48 bg-[#f3f4f6] animate-pulse rounded flex items-center justify-center">
                    <QrCode size={32} className="text-[#d1d5db]" />
                  </div>
                )}
              </div>
              <p className="text-[#6b7280] text-xs break-all font-mono bg-[#f3f4f6] px-3 py-2 rounded-lg mb-5 w-full text-center border border-[#e5e7eb]">
                {appUrl}/r/{referidor?.qr_token || '...'}
              </p>
              <button
                onClick={handleCopiarUrl}
                className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              >
                {copiadoMsj ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                {copiadoMsj ? '¡Copiado!' : 'Copiar enlace'}
              </button>
            </div>
          )}

          {/* CLIENTES */}
          {tab === 'clientes' && (
            <div className="glass-panel p-5">
              <h2 className="text-sm font-semibold text-[#374151] mb-5 flex items-center gap-2">
                <Calendar size={15} /> Historial de Clientes
              </h2>
              {clientes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
                  <Clock size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">Aún no hay clientes referidos</p>
                  <p className="text-xs mt-1">Comparte tu enlace para empezar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientes.map((c) => (
                    <div key={c.id} className="p-4 border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-colors">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="font-medium text-[#111111] text-sm">{c.nombre}</p>
                          <p className="text-xs text-[#6b7280] mt-0.5">
                            <span className="text-[#1e3a5f]">{c.lugares?.nombre}</span> · {c.num_personas} {c.num_personas > 1 ? 'personas' : 'persona'}
                          </p>
                          <p className="text-xs text-[#9ca3af] mt-0.5">
                            {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 flex-shrink-0 ${
                          c.verificado ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'
                        }`}>
                          {c.verificado ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {c.verificado ? 'Visitó' : 'Pendiente'}
                        </span>
                      </div>
                      {c.gasto !== null && (
                        <div className="flex gap-4 mt-3 pt-3 border-t border-[#f3f4f6]">
                          <div>
                            <p className="text-[10px] text-[#9ca3af]">Gasto registrado</p>
                            <p className="text-sm font-bold text-[#111111]">{c.gasto.toFixed(2)}€</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#9ca3af]">Tu comisión</p>
                            <p className="text-sm font-bold text-[#4a9070]">+{c.comision?.toFixed(2) || '0.00'}€</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HISTORIAL / PAGOS */}
          {tab === 'historial' && (
            <div className="space-y-5">

              {/* Banner Stripe Connect */}
              {!stripeOnboarded ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">Conecta tu cuenta bancaria</p>
                    <p className="text-xs text-amber-700 mt-1">Para recibir tus comisiones automáticamente necesitas verificar tu identidad y añadir tu IBAN a través de Stripe.</p>
                  </div>
                  <button onClick={conectarStripe} disabled={stripeConectando}
                    className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50">
                    <CreditCard size={15} /> {stripeConectando ? 'Redirigiendo...' : 'Conectar cuenta'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-green-700">
                  <CheckCircle2 size={16} /> Cuenta bancaria conectada — recibirás pagos automáticamente.
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="glass-panel p-4 text-center border-t-2 border-t-[#1e3a5f]">
                  <p className="text-xs text-[#6b7280] mb-1">Conversiones</p>
                  <p className="text-2xl font-bold text-[#111111]">{historialStats.totalConversiones}</p>
                </div>
                <div className="glass-panel p-4 text-center border-t-2 border-t-[#6b7280]">
                  <p className="text-xs text-[#6b7280] mb-1">Volumen</p>
                  <p className="text-2xl font-bold text-[#111111]">{historialStats.totalGasto.toFixed(0)}€</p>
                </div>
                <div className="glass-panel p-4 text-center border-t-2 border-t-[#4a9070]">
                  <p className="text-xs text-[#6b7280] mb-1">Comisión Total</p>
                  <p className="text-2xl font-bold text-[#4a9070]">{historialStats.totalComision.toFixed(2)}€</p>
                </div>
              </div>

              <div className="glass-panel overflow-hidden">
                {historialCargando ? (
                  <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin" /></div>
                ) : historial.length === 0 ? (
                  <div className="text-center py-12 text-[#9ca3af]">
                    <Receipt size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aún no hay conversiones registradas</p>
                  </div>
                ) : (
                  <>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#f3f4f6] text-[#9ca3af] text-xs">
                          <th className="text-left p-4 font-medium">Cliente</th>
                          <th className="text-right p-4 font-medium hidden sm:table-cell">Fecha</th>
                          <th className="text-right p-4 font-medium">Gasto</th>
                          <th className="text-right p-4 font-medium">Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((v, i) => (
                          <tr key={v.id} className={`border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors ${i % 2 !== 0 ? 'bg-[#fafaf8]' : ''}`}>
                            <td className="p-4">
                              <p className="font-medium text-[#111111]">{v.clientes?.nombre || 'Anónimo'}</p>
                              <p className="text-xs text-[#9ca3af]">{v.clientes?.num_personas} pers.</p>
                            </td>
                            <td className="p-4 text-right text-[#6b7280] hidden sm:table-cell">
                              {new Date(v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="p-4 text-right text-[#111111] font-mono">{v.gasto?.toFixed(2)}€</td>
                            <td className="p-4 text-right">
                              <span className="text-[#4a9070] font-bold font-mono">+{(v.comision_referidor || 0).toFixed(2)}€</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {historialTotalPag > 1 && (
                      <div className="flex justify-center items-center gap-4 p-4 border-t border-[#f3f4f6]">
                        <button onClick={() => cargarHistorial(historialPagina - 1)} disabled={historialPagina <= 1}
                          className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                          <ChevronLeft size={15} />
                        </button>
                        <span className="text-sm text-[#6b7280]">{historialPagina} / {historialTotalPag}</span>
                        <button onClick={() => cargarHistorial(historialPagina + 1)} disabled={historialPagina >= historialTotalPag}
                          className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                          <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* LIQUIDACIONES OFICIALES */}
              <div>
                <h3 className="text-sm font-semibold text-[#111111] mb-3 flex items-center gap-2">
                  <CreditCard size={14} className="text-[#1e3a5f]" /> Liquidaciones Oficiales
                </h3>
                {liquidaciones.length === 0 ? (
                  <div className="glass-panel py-8 text-center text-[#9ca3af] text-sm">
                    <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
                    No hay liquidaciones pendientes
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liquidaciones.map(liq => (
                      <div key={liq.id} className="glass-panel p-4 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-[#111111]">{liq.periodo_desde} — {liq.periodo_hasta}</p>
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                              liq.estado === 'pagado'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {liq.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </div>
                          {liq.notas && <p className="text-xs text-[#9ca3af] italic">{liq.notas}</p>}
                          {liq.pagado_at && (
                            <p className="text-xs text-[#9ca3af]">
                              Abonado el {new Date(liq.pagado_at).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                        <p className="text-xl font-bold text-[#111111] whitespace-nowrap">{parseFloat(liq.importe).toFixed(2)}€</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </main>
    </div>
  )
}
