'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Turnstile } from '@marsidev/react-turnstile'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)
  const [cfToken, setCfToken] = useState('')

  useEffect(() => {
    if (!token) router.push('/login')
  }, [token, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || !confirm) return setError('Rellena ambos campos')
    if (password.length < 6) return setError('La contraseña debe tener mínimo 6 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')
    if (!cfToken) return setError('Completa el CAPTCHA')

    setCargando(true)
    setError('')

    try {
      const res = await fetch('/api/auth/recuperar/cambiar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaPass: password })
      })
      const data = await res.json()
      if (res.ok) {
        setExito(true)
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setError(data.error || 'Error al restablecer contraseña')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        {exito ? (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-2">Contraseña actualizada</h2>
            <p className="text-[#6b7280] text-sm mb-5">Tu nueva clave ha sido guardada correctamente.</p>
            <div className="w-5 h-5 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#9ca3af] mt-3">Redirigiendo al login...</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm">
            <div className="w-11 h-11 bg-[#f0f4f8] rounded-xl flex items-center justify-center mb-5">
              <KeyRound size={20} className="text-[#1e3a5f]" />
            </div>
            <h2 className="text-lg font-bold text-[#111111] mb-1">Nueva contraseña</h2>
            <p className="text-[#6b7280] text-sm mb-6">Introduce una nueva clave de acceso para tu cuenta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#e5e7eb] hover:border-[#d1d5db] focus:border-[#1e3a5f] rounded-lg px-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"
              />
              <input
                type="password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-[#e5e7eb] hover:border-[#d1d5db] focus:border-[#1e3a5f] rounded-lg px-4 py-3 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all placeholder:text-[#9ca3af] bg-white"
              />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 text-red-600 text-sm py-2 px-3 rounded-lg flex items-center gap-2"
                  >
                    <ShieldAlert size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center py-1">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCfToken(token)}
                  options={{ theme: 'light' }}
                />
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium rounded-lg py-3 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {cargando ? 'Guardando...' : <>Cambiar contraseña <ArrowRight size={15} /></>}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  )
}
