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
  const [barrios, setBarrios] = useState([])
  const [barrioSeleccionado, setBarrioSeleccionado] = useState('')
  const [form, setForm] = useState({ nombre: '', email: '', numPersonas: 1, lugarId: '' })
  const [estado, setEstado] = useState('cargando')
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
        const lugs = data.lugares || []
        setLugares(lugs)
        // Extraer barrios únicos
        const barriosUnicos = [...new Set(lugs.map(l => l.barrio).filter(Boolean))].sort()
        setBarrios(barriosUnicos)
      }
      setEstado('formulario')
    } else {
      setEstado('error_qr')
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.lugarId) {
      setError('Por favor rellena el local al que asistes')
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

  const cardVars = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
  }

  const inputClass = "w-full border border-[#e5e7eb] hover:border-[#d1d5db] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"

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

        {/* ÉXITO */}
        {estado === 'exito' && (
          <motion.div key="exito" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-md text-center shadow-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5"
            >
              <CheckCircle2 size={32} className="text-green-600" />
            </motion.div>
            <h2 className="text-xl font-bold text-[#111111] mb-2">¡Todo listo!</h2>
            <p className="text-[#6b7280] text-sm mb-5 leading-relaxed">
              Te hemos enviado tu código QR de acceso por email.
            </p>
            <div className="bg-[#f0f4f8] rounded-xl p-4 border border-[#e5e7eb]">
              <p className="text-sm text-[#1e3a5f] font-medium">Muéstralo a un camarero al llegar al local.</p>
            </div>
          </motion.div>
        )}

        {/* ERROR QR */}
        {estado === 'error_qr' && (
          <motion.div key="error_qr" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-md text-center shadow-sm"
          >
            <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={32} className="text-red-400 rotate-45" />
            </div>
            <h2 className="text-xl font-bold text-[#111111] mb-2">QR Inválido</h2>
            <p className="text-[#6b7280] text-sm">Este código QR no está enlazado a ningún guía activo.</p>
          </motion.div>
        )}

        {/* CONFIRMAR EMAIL */}
        {estado === 'confirmar' && (
          <motion.div key="confirmar" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-md shadow-sm"
          >
            <div className="text-center mb-7">
              <div className="w-12 h-12 bg-[#f0f4f8] rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-[#1e3a5f]" />
              </div>
              <h2 className="text-lg font-bold text-[#111111]">Confirma tu email</h2>
              <p className="text-[#6b7280] text-sm mt-1">Te hemos enviado un código de 5 dígitos.</p>
            </div>

            <div className="space-y-5">
              <input
                type="text"
                placeholder="00000"
                value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-4 text-center text-3xl font-bold tracking-[0.5em] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#d1d5db] bg-white"
                maxLength={5}
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleConfirmar}
                className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3 rounded-lg transition-colors"
              >
                Verificar código <ChevronRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* FORMULARIO */}
        {estado === 'formulario' && (
          <motion.div key="formulario" variants={cardVars} initial="hidden" animate="visible" exit="exit"
            className="bg-white border border-[#e5e7eb] rounded-2xl p-8 w-full max-w-md shadow-sm"
          >
            {referidor && (
              <div className="text-center mb-7 pb-6 border-b border-[#f3f4f6]">
                <p className="text-xs text-[#9ca3af] uppercase tracking-widest mb-1">Invitación de</p>
                <h2 className="text-xl font-bold text-[#111111]">{referidor.nombre}</h2>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                <input type="text" name="nombre" placeholder="Tu nombre y apellidos"
                  value={form.nombre} onChange={handleChange} className={inputClass} />
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                <input type="email" name="email" placeholder="Tu correo electrónico"
                  value={form.email} onChange={handleChange} className={inputClass} />
              </div>

              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                <select name="numPersonas" value={form.numPersonas} onChange={handleChange}
                  className={`${inputClass} appearance-none`}>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                  ))}
                </select>
              </div>

              {barrios.length > 0 && (
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                  <select value={barrioSeleccionado}
                    onChange={e => { setBarrioSeleccionado(e.target.value); setForm({ ...form, lugarId: '' }) }}
                    className={`${inputClass} appearance-none`}>
                    <option value="">Selecciona la zona</option>
                    {barrios.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                <select name="lugarId" value={form.lugarId} onChange={handleChange}
                  className={`${inputClass} appearance-none`}
                  disabled={barrios.length > 0 && !barrioSeleccionado}>
                  <option value="">{barrios.length > 0 && !barrioSeleccionado ? 'Selecciona primero una zona' : 'Selecciona el local'}</option>
                  {lugares
                    .filter(l => !barrioSeleccionado || l.barrio === barrioSeleccionado)
                    .map(l => (
                      <option key={l.id} value={l.id}>{l.nombre}</option>
                    ))}
                </select>
              </div>
            </div>

            {form.lugarId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 bg-[#f0f4f8] border border-[#dce7f3] rounded-xl p-4 flex items-center gap-3"
              >
                <TicketPercent size={18} className="text-[#1e3a5f] flex-shrink-0" />
                <div>
                  <p className="text-[#111111] text-sm font-medium">
                    {lugares.find(l => l.id === form.lugarId)?.descuento}% de descuento para tu grupo
                  </p>
                  <p className="text-[#6b7280] text-xs mt-0.5">Válido para todos los del grupo.</p>
                </div>
              </motion.div>
            )}

            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

            <div className="mt-5 flex justify-center">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCfToken(token)}
                options={{ theme: 'light' }}
              />
            </div>

            <button
              onClick={handleSubmit}
              className="w-full mt-5 flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3 rounded-lg transition-colors"
            >
              Generar mi código <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {/* ENVIANDO */}
        {estado === 'enviando' && (
          <motion.div key="enviando" variants={cardVars} initial="hidden" animate="visible"
            className="flex items-center justify-center py-20"
          >
            <div className="w-8 h-8 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin" />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
