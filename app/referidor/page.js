'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LogOut, Copy, ExternalLink, Users, Calendar, CheckCircle2, Clock, QrCode, BarChart3, TrendingUp } from 'lucide-react'
import QRCode from 'qrcode'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function ReferidorPage() {
  const [referidor, setReferidor] = useState(null)
  const [token, setToken] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [clientes, setClientes] = useState([])
  const [analytics, setAnalytics] = useState({ chartData: [], stats: { exitosMios: 0, comisionesLiquidadas: 0 } })
  const [copiado, setCargando] = useState(true)
  const [copiadoMsj, setCopiado] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState('')
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const r = localStorage.getItem('referidor')
    if (!t || rol !== 'referidor') { router.push('/login'); return }
    const referidorObj = JSON.parse(r)
    setToken(t)
    setReferidor(referidorObj)
    cargarClientes(t)

    // Generar el QR
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const urlReferido = `${appUrl}/r/${referidorObj.qr_token}`
    QRCode.toDataURL(urlReferido, {
      width: 300, margin: 2,
      color: { dark: '#1e3a8a', light: '#ffffff' }
    }).then(setQrImageUrl).catch(console.error)

  }, [])

  const cargarClientes = async (t) => {
    try {
      const headers = { Authorization: `Bearer ${t}` }
      const [resC, resA] = await Promise.all([
        fetch('/api/referidor/clientes', { headers }),
        fetch('/api/analytics/referidor', { headers })
      ])

      if (resC.ok) {
        const data = await resC.json()
        setClientes(data.clientes || [])
      }

      if (resA.ok) {
        setAnalytics(await resA.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }

  const handleCopiarUrl = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    navigator.clipboard.writeText(`${appUrl}/r/${referidor?.qr_token}`)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const tabs = [
    { id: 'dashboard', label: 'Rendimiento', icon: <BarChart3 size={16} /> },
    { id: 'qr', label: 'Mi Tarjeta QR', icon: <QrCode size={16} /> },
    { id: 'clientes', label: 'Invitados', icon: <Users size={16} /> }
  ]

  const appUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin) : ''

  // Animaciones Framer Motion
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar Glass */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 glass-panel border-b-0 border-white/5 px-6 py-4 flex justify-between items-center"
      >
        <div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Hub de Referidor
          </h1>
          <p className="text-sm text-gray-400 font-light">{referidor?.nombre}</p>
        </div>
        <button
          onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </motion.nav>

      <main className="max-w-4xl mx-auto p-6 mt-8 elevate-3d">
        <motion.div
          variants={containerVars}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* TOP TABS NEUMORFISMO */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10 w-full overflow-x-auto mx-auto mb-4">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center justify-center py-3 text-xs md:text-sm font-medium rounded-xl transition-all relative z-10 ${tab === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {tab === t.id && (
                  <motion.div
                    layoutId="activeRefTab"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-20 flex flex-col md:flex-row items-center gap-1.5">{t.icon} {t.label}</span>
              </button>
            ))}
          </div>

          <motion.div variants={itemVars} key={tab}>

            {/* RENDER DASHBOARD/ANALYTICS */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-emerald-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Tickets de Grupos</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.exitosMios}</h3>
                      </div>
                      <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><CheckCircle2 size={24} /></div>
                    </div>
                  </div>
                  <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Comisión Base Acumulada</p>
                        <h3 className="text-3xl font-bold text-white mt-1">{analytics.stats.comisionesLiquidadas.toFixed(2)}€</h3>
                      </div>
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><TrendingUp size={24} /></div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl h-[350px] w-full mt-6">
                  <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2"><BarChart3 size={20} className="text-blue-400" /> Afluencia Histórica Tuya</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRef" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `€${val}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#e5e7eb' }}
                      />
                      <Area type="monotone" dataKey="miComision" name="Comisión / Día" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRef)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* RENDER QR PANTALLA */}
            {tab === 'qr' && (
              <div className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden group flex flex-col items-center">

                {/* Tarjeta Enlace */}
                <motion.div variants={itemVars} className="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden group flex flex-col items-center">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <QrCode size={64} />
                  </div>

                  <h2 className="text-sm font-semibold text-blue-300 mb-4 flex items-center gap-2 self-start">
                    <QrCode size={16} /> Tu QR Personal
                  </h2>

                  {/* Contenedor del QR Visual */}
                  <div className="bg-white p-3 rounded-2xl mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] group-hover:scale-105 transition-transform duration-300">
                    {qrImageUrl ? (
                      <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 rounded-md" />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
                        <QrCode size={32} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  <p className="text-gray-300 text-xs break-all font-mono bg-black/20 p-2 rounded-lg border border-white/5 mb-4 w-full text-center">
                    {appUrl}/r/{referidor?.qr_token || '...'}
                  </p>

                  <button
                    onClick={handleCopiarUrl}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-3 rounded-xl text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all"
                  >
                    {copiadoMsj ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                    {copiadoMsj ? '¡Copiado!' : 'Copiar enlace'}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Lista de Clientes Tab */}
            {tab === 'clientes' && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-300 mb-6 flex items-center gap-2">
                  <Calendar size={16} /> Historial de Clientes
                </h2>

                {clientes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Clock size={48} className="mb-4 opacity-20" />
                    <p>Aún no hay clientes referidos</p>
                    <p className="text-xs mt-2">Comparte tu enlace para empezar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientes.map((c, i) => (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + (i * 0.05) }}
                        key={c.id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors"
                      >
                        <div className="mb-2 sm:mb-0">
                          <p className="font-medium text-white text-sm flex items-center gap-2">
                            {c.nombre}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="text-blue-400">{c.lugares?.nombre}</span> · {c.num_personas} {c.num_personas > 1 ? 'personas' : 'persona'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-3 py-1.5 rounded-full font-medium tracking-wide flex items-center gap-1.5 ${c.verificado
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                            : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            }`}
                        >
                          {c.verificado ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {c.verificado ? 'Visitó' : 'Pendiente'}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
