'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, LogIn } from 'lucide-react'

const WARN_MS = 5 * 60 * 1000 // avisar 5 min antes

export default function SessionWarning() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [minutosRestantes, setMinutosRestantes] = useState(5)

  useEffect(() => {
    let warningTimer = null
    let countdownInterval = null

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.exp) return
        const expMs = data.exp * 1000
        const now = Date.now()
        const msHastaExp = expMs - now
        if (msHastaExp <= 0) return

        const msHastaAviso = msHastaExp - WARN_MS

        const mostrarAviso = () => {
          setVisible(true)
          // Countdown cada 30s
          countdownInterval = setInterval(() => {
            const restantes = Math.max(0, Math.ceil((expMs - Date.now()) / 60000))
            setMinutosRestantes(restantes)
            if (restantes === 0) clearInterval(countdownInterval)
          }, 30000)
          setMinutosRestantes(Math.ceil((expMs - Date.now()) / 60000))
        }

        if (msHastaAviso <= 0) {
          mostrarAviso()
        } else {
          warningTimer = setTimeout(mostrarAviso, msHastaAviso)
        }
      })
      .catch(() => {})

    return () => {
      clearTimeout(warningTimer)
      clearInterval(countdownInterval)
    }
  }, [])

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
      >
        <div className="bg-white border border-amber-200 rounded-xl shadow-lg p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#111111]">Sesión a punto de expirar</p>
            <p className="text-xs text-[#6b7280] mt-0.5">
              Tu sesión expirará en {minutosRestantes} {minutosRestantes === 1 ? 'minuto' : 'minutos'}.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="mt-2 text-xs font-medium text-[#1e3a5f] flex items-center gap-1 hover:underline"
            >
              <LogIn size={12} /> Volver a iniciar sesión
            </button>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-[#9ca3af] hover:text-[#6b7280] text-lg leading-none mt-0.5"
          >
            ×
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
