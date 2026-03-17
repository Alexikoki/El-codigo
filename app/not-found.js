'use client'
import Link from 'next/link'
import { QrCode, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-6 text-center">

      <div className="w-16 h-16 bg-[#f0f4f8] rounded-2xl flex items-center justify-center mb-6">
        <QrCode className="w-8 h-8 text-[#1e3a5f]" />
      </div>

      <p className="text-7xl font-bold text-[#e5e7eb] mb-2">404</p>
      <h1 className="text-2xl font-bold text-[#111111] mb-3">Página no encontrada</h1>
      <p className="text-[#6b7280] text-sm max-w-xs mb-8 leading-relaxed">
        Este enlace no existe o ha sido movido. Si llegaste aquí desde un QR, pide uno nuevo a tu promotor.
      </p>

      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium rounded-lg transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>
    </div>
  )
}
