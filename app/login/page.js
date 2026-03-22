'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Mail, ShieldAlert, ArrowRight, UserCheck, Shield, Briefcase, Building2 } from 'lucide-react'
import Link from 'next/link'
import { Turnstile } from '@marsidev/react-turnstile'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import LangSelector from '../../components/LangSelector'

export default function LoginPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '', tipo: 'staff' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [cfToken, setCfToken] = useState('')

  const [failedAttempts, setFailedAttempts] = useState(0)
  const turnstileRef = useRef(null)

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
        setFailedAttempts(f => f + 1)
        setError(data.error || 'Error al iniciar sesión')
        // El token Turnstile es de un solo uso: resetear siempre para regenerar uno nuevo
        turnstileRef.current?.reset()
        setCfToken('')
        setCargando(false)
        return
      }

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

  const tabs = [
    { id: 'staff',      label: 'Staff',     icon: <UserCheck size={15} /> },
    { id: 'manager',    label: 'Manager',   icon: <Building2 size={15} /> },
    { id: 'referidor',  label: 'Referidor', icon: <Lock size={15} /> },
    { id: 'agencia',    label: 'Agencia',   icon: <Briefcase size={15} /> },
    { id: 'superadmin', label: 'Admin',     icon: <Shield size={15} /> },
  ]

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-4 overflow-x-hidden w-full max-w-full">

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1e3a5f] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-bold text-[#111111]">itrustb2b</h1>
          <p className="text-[#6b7280] text-sm mt-1">{t('login', 'title')}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm">

          {/* Tabs */}
          <div className="flex bg-[#f3f4f6] p-1 rounded-xl mb-7 gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setForm({ ...form, tipo: t.id }); setError('') }}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium rounded-lg transition-all relative ${
                  form.tipo === t.id ? 'bg-white text-[#111111] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:text-[#374151]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <input
                type="text"
                name="email"
                placeholder={t('login', 'userOrEmail')}
                value={form.email}
                onChange={handleChange}
                className="w-full border border-[#e5e7eb] hover:border-[#d1d5db] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
              <input
                type="password"
                name="password"
                placeholder={t('login', 'password')}
                value={form.password}
                onChange={handleChange}
                className="w-full border border-[#e5e7eb] hover:border-[#d1d5db] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"
                >
                  <ShieldAlert size={15} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowRecuperar(true)}
                className="text-xs text-[#1e3a5f] hover:text-[#15294a] font-medium transition-colors"
              >
                {t('login', 'forgot')}
              </button>
            </div>

            <div className="flex justify-center py-2 overflow-hidden w-full">
              <div className="scale-[0.85] sm:scale-100 origin-center">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCfToken(token)}
                  onExpire={() => setCfToken('')}
                  options={{ theme: 'light' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {cargando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{t('login', 'access')} <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer legal */}
        <div className="text-center mt-5 flex justify-center items-center gap-4 text-xs text-[#9ca3af]">
          <LangSelector />
          <Link href="/privacidad" className="hover:text-[#374151] transition-colors">{t('landing', 'privacy')}</Link>
          <Link href="/terminos" className="hover:text-[#374151] transition-colors">{t('legal', 'termsTitle')}</Link>
        </div>
      </motion.div>

      {/* Modal Recuperación */}
      <AnimatePresence>
        {showRecuperar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowRecuperar(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="relative w-full max-w-sm bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-[#111111] mb-1">Recuperar Acceso</h3>
              <p className="text-[#6b7280] text-sm mb-5">Te enviaremos un enlace seguro a tu correo para restablecer tu contraseña.</p>

              <form onSubmit={handleRecuperar} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                  <input
                    type="email"
                    value={emailRecuperar}
                    onChange={(e) => setEmailRecuperar(e.target.value)}
                    placeholder="Tu email registrado"
                    className="w-full border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg pl-10 pr-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"
                  />
                </div>

                {msgRecuperar.texto && (
                  <p className={`text-sm ${msgRecuperar.tipo === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                    {msgRecuperar.texto}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowRecuperar(false)} className="px-4 py-2.5 text-sm text-[#6b7280] hover:text-[#374151] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={cargando} className="flex-1 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50">
                    {cargando ? 'Enviando...' : 'Enviar enlace'}
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
