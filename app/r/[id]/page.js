'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronRight, Mail, MapPin, Users, TicketPercent } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'

export default function FormularioClientePage() {
  const [qrToken, setQrToken] = useState('')
  const [referidor, setReferidor] = useState(null)
  const [lugares, setLugares] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', numPersonas: 1, lugarId: '' })
  const [estado, setEstado] = useState('cargando') // cargando, formulario, enviando, confirmar, exito
  const [clienteId, setClienteId] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')
  const [cfToken, setCfToken] = useState('')
  const params = useParams()

  useEffect(() => {
    let token = params?.id || ''
    if (Array.isArray(token)) token = token[0]
    setQrToken(token)
    cargarDatos(token)
  }, [params])

  const cargarDatos = async (token) => {
    const [resRef, resLug] = await Promise.all([
      fetch(`/api/referidores/publico?token=${token}`),
      fetch('/api/lugares')
    ])
    if (resRef.ok) {
      setReferidor(await resRef.json())
      if (resLug.ok) {
        const data = await resLug.json()
        setLugares(data.lugares || [])
      }
      setEstado('formulario')
    } else {
      setEstado('error_qr')
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.lugarId) {
      setError('Por favor rellena el local al que asistes');
      return
    }
    if (!form.email.includes('@')) { setError('Email no válido'); return }
    if (!cfToken) { setError('Por favor, completa el Captcha'); return }

    setError('')
    setEstado('enviando')

    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        numPersonas: parseInt(form.numPersonas),
        qrToken,
        lugarId: form.lugarId,
        cfToken
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setEstado('formulario'); return }

    setClienteId(data.clienteId)
    setEstado('confirmar')
  }

  const handleConfirmar = async () => {
    if (!codigo || codigo.length !== 5) { setError('Introduce el código de 5 dígitos'); return }
    setError('')
    setEstado('enviando')

    const res = await fetch('/api/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, codigo })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Código incorrecto'); setEstado('confirmar'); return }

    setEstado('exito')
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
          className="w-12 h-12 border-4 border-white/10 border-t-blue-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 elevate-3d">
      <AnimatePresence mode="wait">

        {/* PANTALLA ÉXITO */}
        {estado === 'exito' && (
          <motion.div
            key="exito"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(74,222,128,0.3)]"
            >
              <CheckCircle2 size={48} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">¡Todo listo!</h2>
            <p className="text-gray-400 mb-6 font-light">
              Te hemos enviado tu código QR secreto de descuento por email.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-sm text-center text-blue-300">Muéstralo a un camarero al llegar al local.</p>
            </div>
          </motion.div>
        )}

        {/* PANTALLA ERROR QR */}
        {estado === 'error_qr' && (
          <motion.div
            key="error_qr"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none" />
            <div className="w-24 h-24 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="rotate-45" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400 mb-2">QR Inválido</h2>
            <p className="text-gray-400 font-light mb-6">
              Este código QR no parece estar enlazado a ningún guía activo.
            </p>
          </motion.div>
        )}

        {/* PANTALLA CONFIRMAR EMAIL */}
        {estado === 'confirmar' && (
          <motion.div
            key="confirmar"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30 text-blue-400">
                <Mail size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Confirma tu email</h2>
              <p className="text-gray-400 text-sm mt-2 font-light">Te hemos enviado un código de 5 dígitos para verificar tu identidad.</p>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                placeholder="00000"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[1em] pl-[1em] text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                maxLength={5}
              />

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                onClick={handleConfirmar}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
              >
                Verificar código <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* PANTALLA FORMULARIO INICIAL */}
        {estado === 'formulario' && (
          <motion.div
            key="formulario"
            variants={cardVariants} initial="hidden" animate="visible" exit="exit"
            className="glass-panel rounded-3xl p-8 w-full max-w-md relative overflow-hidden"
          >

            {referidor && (
              <div className="text-center mb-8 pb-6 border-b border-white/5">
                <p className="text-xs tracking-widest text-gray-500 uppercase mb-2">Pase VIP de Invitado</p>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  Lista de - {referidor.nombre}
                </h2>
              </div>
            )}

            <div className="space-y-5">
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu Nombre y Apellidos"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="Tu Correo Electrónico"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    name="numPersonas"
                    value={form.numPersonas}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option className="bg-gray-900" key={n} value={n}>{n} pax</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select
                    name="lugarId"
                    value={form.lugarId}
                    onChange={handleChange}
                    className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option className="bg-gray-900" value="">Selecciona el Local / Discoteca</option>
                    {lugares.map(l => (
                      <option className="bg-gray-900" key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {form.lugarId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                  <TicketPercent size={20} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Recibirás un {lugares.find(l => l.id === form.lugarId)?.descuento}% de descuento</p>
                  <p className="text-gray-400 text-xs mt-0.5">Válido para todo tu grupo.</p>
                </div>
              </motion.div>
            )}

            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}

            <div className="mt-6 flex justify-center">
              <Turnstile
                siteKey="0x4AAAAAAA2T__3S_7WjL-m7" // Test Dummy Key. En produccion debe usar una variable de entorno.
                onSuccess={(token) => setCfToken(token)}
                options={{ theme: 'dark' }}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            >
              Generar mi Código <ChevronRight size={18} />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}