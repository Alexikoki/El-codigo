'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LangSelector from '../../components/LangSelector'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { Camera, LogOut, CheckCircle2, AlertCircle, History, Maximize, Users, Receipt, Upload, X, Euro } from 'lucide-react'

export default function StaffPage() {
  const { t } = useLanguage()
  const [staff, setStaff] = useState(null)
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [verificadosHoy, setVerificadosHoy] = useState([])
  const [modalConfirmar, setModalConfirmar] = useState(null) // cliente a confirmar
  const [formConfirmar, setFormConfirmar] = useState({ importe: '', foto: null, preview: null })
  const [confirmando, setConfirmando] = useState(false)
  const html5QrRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const rol = localStorage.getItem('rol')
    const s = localStorage.getItem('staff')
    if (s && rol === 'staff') { setStaff(JSON.parse(s)); cargarVerificadosHoy(); return }

    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.rol === 'staff') {
          localStorage.setItem('rol', 'staff')
          localStorage.setItem('staff', JSON.stringify(data.staff))
          setStaff(data.staff)
          cargarVerificadosHoy()
        } else { router.push('/login') }
      })
      .catch(() => router.push('/login'))
  }, [])

  const cargarVerificadosHoy = async () => {
    try {
      const res = await fetch('/api/valoraciones/confirmar', { credentials: 'include' })
      if (res.ok) { const d = await res.json(); setVerificadosHoy(d.clientes || []) }
    } catch (e) { console.error(e) }
  }

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
        setError(t('staff','errorCamera'))
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
    cargarVerificadosHoy()
  }

  const abrirConfirmar = (cliente) => {
    setFormConfirmar({ importe: cliente.gastoEstimado || '', foto: null, preview: null })
    setModalConfirmar(cliente)
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFormConfirmar(prev => ({
      ...prev,
      foto: file,
      preview: URL.createObjectURL(file)
    }))
  }

  const handleConfirmar = async () => {
    if (!formConfirmar.importe || parseFloat(formConfirmar.importe) <= 0) return
    setConfirmando(true)
    try {
      const fd = new FormData()
      fd.append('clienteId', modalConfirmar.id)
      fd.append('gastoConfirmado', formConfirmar.importe)
      if (formConfirmar.foto) fd.append('foto', formConfirmar.foto)

      const res = await fetch('/api/valoraciones/confirmar', {
        method: 'POST',
        credentials: 'include',
        body: fd
      })
      if (res.ok) {
        setModalConfirmar(null)
        setFormConfirmar({ importe: '', foto: null, preview: null })
        cargarVerificadosHoy()
      }
    } finally {
      setConfirmando(false)
    }
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
          <p className="text-base font-semibold text-[#111111]">{t('staff','title')}</p>
          <p className="text-xs text-[#6b7280]">{staff?.nombre} · {staff?.lugarNombre}</p>
        </div>
        <div className="flex items-center gap-2">
          <LangSelector />
          <button
            onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).finally(() => { localStorage.clear(); router.push('/login') }) }}
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            <span>{t('common','logout')}</span>
          </button>
        </div>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-1">{t('staff','clientVerified')}</p>
                <h2 className="text-2xl font-bold text-[#111111] mb-2">{resultado.cliente.nombre}</h2>
                <div className="inline-flex items-center gap-1.5 bg-[#f0f4f8] px-3 py-1.5 rounded-full text-[#1e3a5f] text-sm font-medium mb-6">
                  <Users size={14} /> {resultado.cliente.numPersonas} {resultado.cliente.numPersonas > 1 ? 'personas' : 'persona'}
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setResultado(null)}
                    className="w-full bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors"
                  >
                    {t('staff','scanAnother')}
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

        {/* CLIENTES DE HOY */}
        {!escaneando && !resultado && (
          <div className="w-full mt-7">
            <h3 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3 flex items-center gap-2">
              <History size={13} /> Verificados hoy ({verificadosHoy.length})
            </h3>
            {verificadosHoy.length === 0 ? (
              <p className="text-center text-sm text-[#9ca3af] py-6 border border-dashed border-[#e5e7eb] rounded-xl bg-white">
                Aún no hay clientes verificados hoy
              </p>
            ) : (
              <div className="space-y-2">
                {verificadosHoy.map((c) => (
                  <div key={c.id} className="flex justify-between items-center py-3 px-4 bg-white border border-[#e5e7eb] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        c.confirmado
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-[#f0f4f8] border border-[#e5e7eb]'
                      }`}>
                        {c.confirmado
                          ? <CheckCircle2 size={14} className="text-green-600" />
                          : <Users size={13} className="text-[#9ca3af]" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111111]">{c.nombre}</p>
                        <p className="text-xs text-[#9ca3af]">{c.personas} {c.personas > 1 ? 'pers.' : 'pers.'} · {c.referidor}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-[#9ca3af] font-mono">{c.hora}</span>
                      {c.confirmado ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-green-600">{c.gastoConfirmado?.toFixed(2)}€</span>
                          {c.ticketUrl && (
                            <a href={c.ticketUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[#1e3a5f] hover:opacity-70">
                              <Receipt size={12} />
                            </a>
                          )}
                        </div>
                      ) : (
                        <button onClick={() => abrirConfirmar(c)}
                          className="text-xs text-[#1e3a5f] hover:underline font-medium">
                          Cerrar mesa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* MODAL CONFIRMAR CONSUMO */}
      <AnimatePresence>
        {modalConfirmar && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setModalConfirmar(null)} />
            <motion.div
              initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-[#111111]">Cerrar mesa</h3>
                  <p className="text-sm text-[#6b7280]">{modalConfirmar.nombre} · {modalConfirmar.personas} pers.</p>
                </div>
                <button onClick={() => setModalConfirmar(null)} className="text-[#9ca3af] hover:text-[#374151]">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Importe */}
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block font-medium">Consumo total (€)</label>
                  <div className="relative">
                    <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formConfirmar.importe}
                      onChange={e => setFormConfirmar(prev => ({ ...prev, importe: e.target.value }))}
                      className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 font-mono text-lg placeholder:text-[#d1d5db] placeholder:font-sans bg-white"
                      autoFocus
                    />
                  </div>
                  {modalConfirmar.gastoEstimado && (
                    <p className="text-xs text-[#9ca3af] mt-1">
                      Estimado por el cliente: {modalConfirmar.gastoEstimado}€
                    </p>
                  )}
                </div>

                {/* Foto del ticket */}
                <div>
                  <label className="text-xs text-[#6b7280] mb-1.5 block font-medium">Foto del ticket (opcional)</label>
                  {formConfirmar.preview ? (
                    <div className="relative">
                      <img src={formConfirmar.preview} alt="Ticket" className="w-full h-40 object-cover rounded-lg border border-[#e5e7eb]" />
                      <button
                        onClick={() => setFormConfirmar(prev => ({ ...prev, foto: null, preview: null }))}
                        className="absolute top-2 right-2 bg-white border border-[#e5e7eb] rounded-full p-1 shadow-sm"
                      >
                        <X size={14} className="text-[#6b7280]" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#e5e7eb] rounded-lg py-6 cursor-pointer hover:border-[#1e3a5f] hover:bg-[#f9fafb] transition-colors">
                      <Upload size={20} className="text-[#9ca3af]" />
                      <span className="text-sm text-[#6b7280]">Toca para adjuntar foto</span>
                      <span className="text-xs text-[#9ca3af]">JPG, PNG o HEIC · máx. 5MB</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
                    </label>
                  )}
                </div>
              </div>

              <button
                onClick={handleConfirmar}
                disabled={confirmando || !formConfirmar.importe || parseFloat(formConfirmar.importe) <= 0}
                className="w-full mt-6 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {confirmando ? 'Guardando...' : 'Confirmar consumo'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
