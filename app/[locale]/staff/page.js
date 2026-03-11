'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, LogOut, CheckCircle2, AlertCircle, History, Maximize } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function StaffPage() {
  const [staff, setStaff] = useState(null)
  const [token, setToken] = useState(null)
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const html5QrRef = useRef(null)
  const router = useRouter()
  const t = useTranslations('Scanner')

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const s = localStorage.getItem('staff')
    if (!t || rol !== 'staff') { router.push('/login'); return }
    setToken(t)
    setStaff(JSON.parse(s))
  }, [])

  const iniciarEscaner = async () => {
    setError('')
    setResultado(null)
    setEscaneando(true)

    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-reader')
        html5QrRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            await scanner.stop()
            setEscaneando(false)
            const partes = decodedText.split('/')
            const clienteId = partes[partes.length - 1]
            await verificarQR(clienteId)
          },
          () => { } // Ignorar advertencias de escaneo
        )
      } catch (e) {
        setEscaneando(false)
        setError(t('cameraError'))
      }
    }, 300)
  }

  const pararEscaner = async () => {
    try {
      if (html5QrRef.current) { await html5QrRef.current.stop(); html5QrRef.current = null }
    } catch (e) { }
    setEscaneando(false)
  }

  const verificarQR = async (clienteId) => {
    const res = await fetch('/api/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ clienteId })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || t('invalid')); return }

    setResultado(data)
    setHistorial(prev => [{
      id: data.cliente.id,
      nombre: data.cliente.nombre,
      personas: data.cliente.numPersonas,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }, ...prev.slice(0, 9)])
  }

  // Framer Motion Variants
  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
  }

  const itemVars = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            {t('title')}
          </h1>
          <p className="text-xs text-gray-400 font-light">{staff?.nombre} · {staff?.lugarNombre}</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); router.push('/login') }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </motion.nav>

      <main className="max-w-xl mx-auto p-6 mt-6 elevate-3d flex flex-col items-center">

        <AnimatePresence mode="wait">

          {/* ESTADO 1: INICIAL (Botón escanear) */}
          {!escaneando && !resultado && (
            <motion.div
              key="inicial"
              variants={itemVars} initial="hidden" animate="show" exit="hidden"
              className="w-full"
            >
              <div className="glass-panel glass-panel-hover rounded-3xl p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Maximize size={40} className="text-blue-400" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">{t('title')}</h2>
                <p className="text-gray-400 text-sm mb-8 font-light">{t('subtitle')}</p>

                <button
                  onClick={iniciarEscaner}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all"
                >
                  <Camera size={20} /> {t('scanQr')}
                </button>
              </div>
            </motion.div>
          )}

          {/* ESTADO 2: CÁMARA ACTIVA */}
          {escaneando && (
            <motion.div
              key="escaneando"
              variants={itemVars} initial="hidden" animate="show" exit="hidden"
              className="w-full glass-panel rounded-3xl p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-blue-400 flex items-center gap-2">
                  <Camera size={16} /> Escaneando QR...
                </p>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black aspect-square">
                {/* El div donde html5-qrcode inyecta el video */}
                <div id="qr-reader" className="w-full h-full object-cover" />

                {/* Overlay visual para apuntar */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-blue-500 opacity-50 rounded-xl rounded-tl-[2rem] rounded-br-[2rem]" />
                </div>
              </div>

              <button
                onClick={pararEscaner}
                className="w-full mt-6 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-3 rounded-xl border border-white/10 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          )}

          {/* ESTADO 3: RESULTADO EXITOSO */}
          {resultado && (
            <motion.div
              key="resultado"
              variants={itemVars} initial="hidden" animate="show" exit="hidden"
              className="w-full glass-panel rounded-3xl p-8 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(52,211,153,0.3)]"
              >
                <CheckCircle2 size={48} className="text-white" />
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-1">{resultado.cliente.nombre}</h2>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-emerald-400 text-sm font-medium mb-8 mt-2">
                <Users size={16} /> {resultado.cliente.numPersonas} {resultado.cliente.numPersonas > 1 ? 'personas' : 'persona'}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/valorar/${resultado.cliente.id}`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {t('successValoration')}
                </button>
                <button
                  onClick={() => setResultado(null)}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-all"
                >
                  {t('scanQr')}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ERROR FLOTANTE */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center"
          >
            <AlertCircle className="text-red-400 mx-auto mb-2" size={24} />
            <p className="text-red-300 font-medium text-sm mb-2">{error}</p>
            <button onClick={() => setError('')} className="text-xs text-red-400 hover:text-red-300 underline">
              Intentar de nuevo
            </button>
          </motion.div>
        )}

        {/* HISTORIAL (Solo si hay) */}
        {historial.length > 0 && !escaneando && !resultado && (
          <motion.div
            variants={containerVars} initial="hidden" animate="show"
            className="w-full mt-8"
          >
            <h3 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2">
              <History size={16} /> Verificados últimamente
            </h3>
            <div className="space-y-3">
              {historial.map((h, i) => (
                <motion.div
                  key={i} variants={itemVars}
                  className="flex justify-between items-center py-3 px-4 bg-white/5 border border-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{h.nombre}</p>
                      <p className="text-xs text-gray-400">{h.personas} {h.personas > 1 ? 'personas' : 'persona'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-gray-500 font-mono">{h.hora}</span>
                    <button onClick={() => router.push(`/valorar/${h.id}`)} className="text-xs text-blue-400 hover:text-blue-300 underline">
                      Valorar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}