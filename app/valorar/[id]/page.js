'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Euro, CheckCircle2, HeartHandshake, MapPin } from 'lucide-react'

export default function ValorarPage({ params }) {
  const [info, setInfo] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [gasto, setGasto] = useState('')
  const [valoracion, setValoracion] = useState(0)
  const [error, setError] = useState('')

  async function cargarInfo() {
    if (typeof window === 'undefined') return
    const id = window.location.pathname.split('/').pop()
    try {
      const res = await fetch(`/api/valorar/${id}`)
      const data = await res.json()
      if (data.yaValorado) { setEstado('yaValorado'); return }
      setInfo({ ...data, id })
      setEstado('formulario')
    } catch (e) {
      setEstado('error')
    }
  }

  useEffect(() => { cargarInfo() }, [])

  const handleSubmit = async () => {
    if (!gasto || !valoracion) { setError('Introduce tu gasto y valoración'); return }
    setError('')
    setEstado('enviando')
    try {
      const res = await fetch(`/api/valorar/${info.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gasto: parseFloat(gasto), valoracion })
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

        {estado === 'yaValorado' && (
          <motion.div key="yaValorado" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-sm text-center shadow-sm"
          >
            <div className="w-14 h-14 bg-[#f0f4f8] rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={28} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">Ya valorado</h2>
            <p className="text-[#6b7280] text-sm">Esta visita ya ha sido registrada anteriormente.</p>
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
            <h2 className="text-lg font-bold text-[#111111] mb-2">¡Mil gracias!</h2>
            <p className="text-[#6b7280] text-sm">Tu valoración ayuda a mejorar la experiencia de todos.</p>
          </motion.div>
        )}

        {estado === 'formulario' && (
          <motion.div key="formulario" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-sm shadow-sm"
          >
            <div className="text-center mb-7 pb-6 border-b border-[#f3f4f6]">
              <div className="w-12 h-12 bg-[#f0f4f8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star size={22} className="text-[#1e3a5f]" />
              </div>
              <h1 className="text-lg font-bold text-[#111111]">Valorar Experiencia</h1>
              {info?.lugar?.nombre && (
                <p className="text-sm text-[#6b7280] flex items-center justify-center gap-1 mt-1">
                  <MapPin size={13} /> {info.lugar.nombre}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-[#374151] mb-2 block">Gasto estimado (€)</label>
                <div className="relative">
                  <Euro className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                  <input
                    type="number"
                    placeholder="25.50"
                    value={gasto}
                    onChange={e => setGasto(e.target.value)}
                    className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all font-mono text-lg placeholder:text-[#d1d5db] placeholder:font-sans bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#374151] mb-3 block text-center">Valoración</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setValoracion(n)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                        n <= valoracion
                          ? 'bg-[#f0f4f8] border-[#1e3a5f] text-[#1e3a5f]'
                          : 'border-[#e5e7eb] text-[#d1d5db] hover:border-[#d1d5db]'
                      }`}
                    >
                      <Star size={18} fill={n <= valoracion ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-5 text-center bg-red-50 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={estado === 'enviando'}
              className="w-full mt-7 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {estado === 'enviando' ? 'Guardando...' : 'Confirmar valoración'}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
