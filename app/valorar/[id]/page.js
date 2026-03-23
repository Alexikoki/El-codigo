'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, CheckCircle2, HeartHandshake, Clock, Upload, X, MapPin } from 'lucide-react'

export default function ValorarPage({ params }) {
  const [info, setInfo] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [valoracion, setValoracion] = useState(0)
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  async function cargarInfo() {
    if (typeof window === 'undefined') return
    const id = window.location.pathname.split('/').pop()
    try {
      const res = await fetch(`/api/valorar/${id}`)
      const data = await res.json()
      if (data.pendiente) { setEstado('pendiente'); return }
      if (data.yaValorado) { setEstado('yaValorado'); return }
      setInfo({ ...data, id })
      setEstado('formulario')
    } catch (e) {
      setEstado('error')
    }
  }

  useEffect(() => { cargarInfo() }, [])

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!valoracion) { setError('Selecciona una valoración'); return }
    setError('')
    setEstado('enviando')
    try {
      const fd = new FormData()
      fd.append('valoracion', valoracion)
      if (foto) fd.append('foto', foto)

      const res = await fetch(`/api/valorar/${info.id}`, {
        method: 'POST',
        body: fd
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar valoración'); setEstado('formulario'); return }
      setEstado('exito')
    } catch (e) {
      setError('Error de conexión')
      setEstado('formulario')
    }
  }

  const cardVars = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  }

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">

        {estado === 'pendiente' && (
          <motion.div key="pendiente" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-sm text-center shadow-sm"
          >
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock size={28} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">Visita pendiente</h2>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Tu visita está pendiente de ser confirmada por el local. Vuelve a escanear al finalizar tu visita.
            </p>
          </motion.div>
        )}

        {estado === 'yaValorado' && (
          <motion.div key="yaValorado" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-sm text-center shadow-sm"
          >
            <div className="w-14 h-14 bg-[#f0f4f8] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={28} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">Ya enviaste tu valoración</h2>
            <p className="text-[#6b7280] text-sm">¡Gracias! Tu opinión ya ha sido registrada.</p>
          </motion.div>
        )}

        {estado === 'exito' && (
          <motion.div key="exito" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-sm text-center shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5"
            >
              <HeartHandshake size={28} className="text-green-600" />
            </motion.div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">¡Mil gracias por tu valoración!</h2>
            <p className="text-[#6b7280] text-sm">Tu opinión ayuda a mejorar la experiencia de todos.</p>
          </motion.div>
        )}

        {(estado === 'formulario' || estado === 'enviando') && (
          <motion.div key="formulario" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-6 w-full max-w-sm shadow-sm"
          >
            {/* Header */}
            <div className="text-center mb-6 pb-5 border-b border-[#f3f4f6]">
              <div className="w-12 h-12 bg-[#f0f4f8] rounded-xl flex items-center justify-center mx-auto mb-3">
                <Star size={22} className="text-[#1e3a5f]" />
              </div>
              {info?.lugar?.nombre && (
                <h1 className="text-base font-bold text-[#111111] flex items-center justify-center gap-1.5">
                  <MapPin size={14} className="text-[#1e3a5f] flex-shrink-0" />
                  {info.lugar.nombre}
                </h1>
              )}
              {info?.lugar?.descuento != null && (
                <p className="text-sm text-green-700 font-medium mt-1">Tu descuento: {info.lugar.descuento}%</p>
              )}
            </div>

            <div className="space-y-5">
              {/* Gasto confirmado (read-only) */}
              {info?.gasto != null && (
                <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">Consumo registrado</span>
                  <span className="text-sm font-bold text-[#111111] font-mono">{parseFloat(info.gasto).toFixed(2)}€</span>
                </div>
              )}

              {/* Star rating */}
              <div>
                <label className="text-sm font-medium text-[#374151] mb-3 block text-center">¿Cómo fue tu experiencia?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setValoracion(n)}
                      className={`w-13 h-13 rounded-full flex items-center justify-center border-2 transition-all ${
                        n <= valoracion
                          ? 'bg-amber-50 border-amber-400 text-amber-500'
                          : 'border-[#e5e7eb] text-[#d1d5db] hover:border-[#d1d5db]'
                      }`}
                      style={{ width: '52px', height: '52px' }}
                    >
                      <Star size={24} fill={n <= valoracion ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo upload (optional) */}
              <div>
                <label className="text-xs text-[#6b7280] mb-1.5 block font-medium">Foto del ticket (opcional)</label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Ticket" className="w-full h-40 object-cover rounded-lg border border-[#e5e7eb]" />
                    <button
                      onClick={() => { setFoto(null); setPreview(null) }}
                      className="absolute top-2 right-2 bg-white border border-[#e5e7eb] rounded-full p-1 shadow-sm"
                    >
                      <X size={14} className="text-[#6b7280]" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#e5e7eb] rounded-lg py-5 cursor-pointer hover:border-[#1e3a5f] hover:bg-[#f9fafb] transition-colors">
                    <Upload size={18} className="text-[#9ca3af]" />
                    <span className="text-sm text-[#6b7280]">Adjuntar foto del ticket</span>
                    <span className="text-xs text-[#9ca3af]">JPG, PNG o HEIC · máx. 5MB</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFoto} />
                  </label>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-4 text-center bg-red-50 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={estado === 'enviando' || !valoracion}
              className="w-full mt-6 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {estado === 'enviando' ? 'Enviando...' : 'Enviar valoración'}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
