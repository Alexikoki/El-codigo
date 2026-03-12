'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Euro, CheckCircle2, HeartHandshake, MapPin } from 'lucide-react'
export default function ValorarPage({ params }) {
  const [info, setInfo] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando, formulario, enviando, exito, yaValorado
  const [gasto, setGasto] = useState('')
  const [valoracion, setValoracion] = useState(0)
  const [error, setError] = useState('')

  async function cargarInfo() {
    const typeofWindow = typeof window !== 'undefined'
    if (!typeofWindow) return;

    // Fallback if params.id is empty depending on NextJS version
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    cargarInfo()
  }, [])

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

  // Framer Motion Variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  }

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-white/10 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 elevate-3d">
      <AnimatePresence mode="wait">

        {/* PANTALLA YA VALORADO */}
        {estado === 'yaValorado' && (
          <motion.div
            key="yaValorado"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />
            <div className="w-24 h-24 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ya valorado</h2>
            <p className="text-gray-400 font-light">Esta visita ya ha sido registrada y valorada anteriormente.</p>
          </motion.div>
        )}

        {/* PANTALLA ÉXITO */}
        {estado === 'exito' && (
          <motion.div
            key="exito"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
              className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]"
            >
              <HeartHandshake size={48} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Mil gracias!</h2>
            <p className="text-gray-400 font-light">Tu valoración ayuda a mejorar la experiencia de todos.</p>
          </motion.div>
        )}

        {/* PANTALLA FORMULARIO */}
        {estado === 'formulario' && (
          <motion.div
            key="formulario"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md relative overflow-hidden"
          >
            <div className="text-center mb-8 pb-6 border-b border-white/5">
              <motion.div
                initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30"
              >
                <Star size={32} />
              </motion.div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-1">
                Valorar Experiencia
              </h1>
              {info && (
                <p className="text-sm font-medium text-gray-400 flex items-center justify-center gap-1.5 mt-2">
                  <MapPin size={14} /> {info.lugar?.nombre}
                </p>
              )}
            </div>

            <div className="space-y-6">

              {/* Bloque Gasto */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Gasto Estimado (€)</label>
                <div className="relative">
                  <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="number"
                    placeholder="25.50"
                    value={gasto}
                    onChange={e => setGasto(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 hover:border-white/20 focus:border-purple-500 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono text-lg placeholder:text-gray-600 placeholder:font-sans"
                  />
                </div>
              </div>

              {/* Bloque Estrellas */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-3 block text-center">Valoración (1-5 Estrellas)</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <motion.button
                      key={n}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setValoracion(n)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${n <= valoracion
                        ? 'bg-purple-500/20 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-black/30 border-white/10 text-gray-600 hover:border-white/30'
                        }`}
                    >
                      <Star size={20} fill={n <= valoracion ? "currentColor" : "none"} />
                    </motion.button>
                  ))}
                </div>
              </div>

            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm mt-6 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                {error}
              </motion.div>
            )}

            <button
              onClick={handleSubmit}
              disabled={estado === 'enviando'}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] disabled:opacity-50"
            >
              {estado === 'enviando' ? '...' : 'Confirmar'}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}