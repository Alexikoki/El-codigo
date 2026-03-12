'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Shield, Briefcase, Building } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', tipo: 'staff' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cfToken, setCfToken] = useState('')

  // Estado para el modal de recuperación
  const [showRecuperar, setShowRecuperar] = useState(false)
  const [emailRecuperar, setEmailRecuperar] = useState('')
  const [msgRecuperar, setMsgRecuperar] = useState({ tipo: '', texto: '' })

  const router = useRouter()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.email || !form.password) { setError('Rellena todos los campos'); return }
    if (!cfToken) { setError('Por favor, verifica el escaneo humano.'); return }

    setCargando(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cfToken })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        setCargando(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('rol', data.rol)

      if (data.rol === 'superadmin') router.push('/superadmin')
      else if (data.rol === 'agencia') {
        localStorage.setItem('agencia', JSON.stringify(data.agencia))
        router.push('/agencia')
      }
      else if (data.rol === 'manager') {
        localStorage.setItem('manager', JSON.stringify(data.manager))
        router.push('/manager')
      }
      else if (data.rol === 'referidor') {
        localStorage.setItem('referidor', JSON.stringify(data.referidor))
        router.push('/referidor')
      } else {
        localStorage.setItem('staff', JSON.stringify(data.staff))
        router.push('/staff')
      }
    } catch (err) {
      setError('Error de conexión')
      setCargando(false)
    }
  }

  const handleRecuperar = async (e) => {
    e.preventDefault()
    if (!emailRecuperar) return setMsgRecuperar({ tipo: 'error', texto: 'Introduce tu correo' })

    setCargando(true)
    setMsgRecuperar({ tipo: '', texto: '' })

    try {
      const res = await fetch('/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailRecuperar })
      })
      const data = await res.json()

      if (res.ok) {
        setMsgRecuperar({ tipo: 'success', texto: 'Revisa tu bandeja de entrada.' })
        setTimeout(() => setShowRecuperar(false), 3000)
      } else {
        setMsgRecuperar({ tipo: 'error', texto: data.error || 'Correo no encontrado' })
      }
    } catch (error) {
      setMsgRecuperar({ tipo: 'error', texto: 'Error de conectividad' })
    } finally {
      setCargando(false)
    }
  }

  // Framer Motion Variants
  const containerVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  }

  const tabs = [
    { id: 'staff', label: 'Staff', icon: <UserCheck size={16} /> },
    { id: 'referidor', label: 'Referidor', icon: <Lock size={16} /> },
    { id: 'agencia', label: 'Agencia', icon: <Briefcase size={16} /> },
    { id: 'superadmin', label: 'Admin', icon: <Shield size={16} /> }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Orbs / Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="w-full max-w-md z-10 elevate-3d"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto border border-white/10 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
          >
            <Lock className="text-blue-400" size={32} />
          </motion.div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            El Código
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-light">Acceso seguro al sistema</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">

          {/* Tabs Neumorfismo Oscuro */}
          <div className="flex flex-wrap bg-black/40 p-1 rounded-xl mb-8 border border-white/5 relative z-10 gap-y-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setForm({ ...form, tipo: t.id }); setError('') }}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 text-xs font-medium rounded-lg transition-all relative z-10 ${form.tipo === t.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                {form.tipo === t.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 border border-white/10 rounded-lg shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-20 flex items-center gap-1.5">{t.icon} {t.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  name="email"
                  placeholder="Usuario o Correo electrónico"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 hover:border-white/20 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl flex items-center gap-2"
                >
                  <ShieldAlert size={16} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowRecuperar(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div className="flex justify-center my-4 overflow-hidden rounded-xl">
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setCfToken(token)}
                options={{ theme: 'dark' }}
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {cargando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                />
              ) : (
                <>Acceder al panel <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Modal de Recuperación */}
      <AnimatePresence>
        {showRecuperar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowRecuperar(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm glass-panel p-6 rounded-3xl"
            >
              <h3 className="text-xl font-semibold mb-2">Recuperar Acceso</h3>
              <p className="text-zinc-400 text-sm mb-6">Te enviaremos un enlace mágico seguro a tu correo para restablecer tu contraseña.</p>

              <form onSubmit={handleRecuperar} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    value={emailRecuperar}
                    onChange={(e) => setEmailRecuperar(e.target.value)}
                    placeholder="Tu email registrado"
                    className="w-full bg-black/20 border border-white/10 focus:border-blue-500 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none transition-all"
                  />
                </div>

                {msgRecuperar.texto && (
                  <p className={`text-sm ${msgRecuperar.tipo === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {msgRecuperar.texto}
                  </p>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowRecuperar(false)} className="px-4 py-3 text-sm text-zinc-400 hover:text-white transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={cargando} className="flex-1 bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-zinc-200 transition-colors">
                    {cargando ? 'Revisando...' : 'Enviar enlace'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}