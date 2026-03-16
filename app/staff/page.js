'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, LogOut, CheckCircle2, AlertCircle, History, Maximize, Users } from 'lucide-react'

export default function StaffPage() {
  const [staff, setStaff] = useState(null)
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const html5QrRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    const s = localStorage.getItem('staff')
    if (s && rol === 'staff') { setStaff(JSON.parse(s)); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'staff') {
          localStorage.setItem('rol', 'staff')
          localStorage.setItem('staff', JSON.stringify(data.staff))
          setStaff(data.staff)
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
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
          () => {}
        )
      } catch (e) {
        setError('Error al acceder a la cámara')
      }
    }, 300)
  }

  const pararEscaner = async () => {
    try {
      if (html5QrRef.current) { await html5QrRef.current.stop(); html5QrRef.current = null }
    } catch (e) {}
    setEscaneando(false)
  }

  const verificarQR = async (clienteId) => {
    const res = await fetch('/api/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ clienteId })
    })

    const data = await res.json()
    if (!res.ok) { setError(data?.error || 'QR no válido o ya usado'); return }

    setResultado(data)
    setHistorial(prev => [{
      id: data.cliente.id,
      nombre: data.cliente.nombre,
      personas: data.cliente.numPersonas,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }, ...prev.slice(0, 9)])
  }

  const cardVars = {
    hidden: { opacity: 0, scale: 0.97 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.2 } }
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] pb-12">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
        <div>
          <p className="text-base font-semibold text-[#111111]">Escanear Código QR</p>
          <p className="text-xs text-[#6b7280]">{staff?.nombre} · {staff?.lugarNombre}</p>
        </div>
        <button
          onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
          className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
        >
          <LogOut size={15} />
          <span>Salir</span>
        </button>
      </nav>

      <main className="max-w-md mx-auto p-5 mt-6 flex flex-col items-center">
        <AnimatePresence mode="wait">

          {/* ESTADO INICIAL */}
          {!escaneando && !resultado && (
            <motion.div key="inicial" variants={cardVars} initial="hidden" animate="show" exit="hidden" className="w-full">
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 text-center shadow-sm">
                <div className="w-20 h-20 bg-[#f0f4f8] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Maximize size={36} className="text-[#1e3a5f]" />
                </div>
                <h2 className="text-lg font-bold text-[#111111] mb-2">Escanear Invitación</h2>
                <p className="text-[#6b7280] text-sm mb-7">Enfoca el código QR del cliente</p>

                <button
                  onClick={iniciarEscaner}
                  className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors"
                >
                  <Camera size={18} /> Abrir Escáner
                </button>
              </div>
            </motion.div>
          )}

          {/* CÁMARA ACTIVA */}
          {escaneando && (
            <motion.div key="escaneando" variants={cardVars} initial="hidden" animate="show" exit="hidden" className="w-full">
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-medium text-[#374151] flex items-center gap-2">
                    <Camera size={15} className="text-[#1e3a5f]" /> Escaneando...
                  </p>
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                </div>

                <div className="relative rounded-xl overflow-hidden border border-[#e5e7eb] bg-black aspect-square">
                  <div id="qr-reader" className="w-full h-full" />
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[#1e3a5f] opacity-60 rounded-xl" />
                  </div>
                </div>

                <button
                  onClick={pararEscaner}
                  className="w-full mt-4 border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6] font-medium py-3 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          )}

          {/* RESULTADO EXITOSO */}
          {resultado && (
            <motion.div key="resultado" variants={cardVars} initial="hidden" animate="show" exit="hidden" className="w-full">
              <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 text-center shadow-sm">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 size={32} className="text-green-600" />
                </motion.div>

                <h2 className="text-xl font-bold text-[#111111] mb-1">{resultado.cliente.nombre}</h2>
                <div className="inline-flex items-center gap-1.5 bg-[#f0f4f8] px-3 py-1.5 rounded-full text-[#1e3a5f] text-sm font-medium mb-7">
                  <Users size={14} /> {resultado.cliente.numPersonas} {resultado.cliente.numPersonas > 1 ? 'personas' : 'persona'}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push(`/valorar/${resultado.cliente.id}`)}
                    className="w-full bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    Registrar Consumo
                  </button>
                  <button
                    onClick={() => setResultado(null)}
                    className="w-full border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6] font-medium py-3 rounded-xl transition-colors text-sm"
                  >
                    Escanear otra persona
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ERROR */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full mt-5 bg-red-50 border border-red-200 rounded-xl p-4 text-center"
          >
            <AlertCircle className="text-red-400 mx-auto mb-2" size={20} />
            <p className="text-red-600 text-sm font-medium mb-2">{error}</p>
            <button onClick={() => setError('')} className="text-xs text-red-400 hover:text-red-500 underline">
              Intentar de nuevo
            </button>
          </motion.div>
        )}

        {/* HISTORIAL */}
        {historial.length > 0 && !escaneando && !resultado && (
          <div className="w-full mt-7">
            <h3 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3 flex items-center gap-2">
              <History size={13} /> Verificados hoy
            </h3>
            <div className="space-y-2">
              {historial.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-3 px-4 bg-white border border-[#e5e7eb] rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <CheckCircle2 size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#111111]">{h.nombre}</p>
                      <p className="text-xs text-[#9ca3af]">{h.personas} {h.personas > 1 ? 'personas' : 'persona'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-[#9ca3af] font-mono">{h.hora}</span>
                    <button onClick={() => router.push(`/valorar/${h.id}`)} className="text-xs text-[#1e3a5f] hover:underline">
                      Valorar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
