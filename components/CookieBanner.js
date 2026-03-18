'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Cookie, X, Check } from 'lucide-react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const aceptar = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const rechazar = () => {
    localStorage.setItem('cookie_consent', 'rejected')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] max-w-xl mx-auto"
        >
          <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#f0f4f8] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cookie size={16} className="text-[#1e3a5f]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111111] mb-1">Usamos cookies</p>
                <p className="text-xs text-[#6b7280] leading-relaxed">
                  Utilizamos cookies esenciales para el funcionamiento de la plataforma (sesión, autenticación) y cookies analíticas para mejorar el servicio. Consulta nuestra{' '}
                  <Link href="/privacidad" className="text-[#1e3a5f] underline hover:text-[#15294a]">
                    política de privacidad
                  </Link>.
                </p>
              </div>
              <button onClick={rechazar} className="text-[#9ca3af] hover:text-[#374151] transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={rechazar}
                className="flex-1 py-2 px-4 text-xs font-medium text-[#6b7280] hover:text-[#374151] border border-[#e5e7eb] rounded-lg transition-colors"
              >
                Solo esenciales
              </button>
              <button
                onClick={aceptar}
                className="flex-1 py-2 px-4 text-xs font-medium text-white bg-[#1e3a5f] hover:bg-[#15294a] rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={13} /> Aceptar todo
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
