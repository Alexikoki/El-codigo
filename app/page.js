'use client'
import Link from 'next/link'
import { QrCode, TrendingUp, ShieldCheck, ChevronRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#111111] flex flex-col font-sans overflow-x-hidden">

      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-[#e5e7eb] bg-white">
        <div className="flex items-center gap-2">
          <QrCode className="w-6 h-6 text-[#1e3a5f]" />
          <span className="text-lg font-semibold tracking-tight text-[#111111]">El Código</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-[#6b7280] hover:text-[#111111] transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/login" className="px-4 py-2 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#15294a] transition-colors">
            Acceso Panel
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center md:pt-36">

        <h1 className="max-w-3xl text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.1] text-[#111111]">
          El retorno a tu local,{' '}
          <span className="text-[#1e3a5f]">automatizado e inteligente.</span>
        </h1>

        <p className="max-w-xl text-base md:text-lg text-[#6b7280] mb-10 leading-relaxed">
          Sustituye a los anticuados relaciones públicas de calle con un sistema de Referidos basado en QR. Traquea qué comerciales te traen más clientes, evita fraudes y paga comisiones automáticamente sólo por cliente que consume.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link href="/login" className="w-full sm:w-auto px-7 py-3 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 group">
            Empezar ahora
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="#como-funciona" className="w-full sm:w-auto px-7 py-3 border border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db] font-medium rounded-lg transition-colors flex items-center justify-center">
            Cómo funciona
          </Link>
        </div>

        {/* Feature Cards */}
        <div id="como-funciona" className="grid md:grid-cols-3 gap-5 max-w-4xl w-full mt-28 text-left pt-16">

          <div className="glass-panel glass-panel-hover p-7 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#1e3a5f] mb-1">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#111111]">Tecnología QR</h3>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Cada relaciones públicas tiene un código QR único. El turista escanea, deja su email y listo. Olvídate de flyers de papel que acaban en la basura.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-7 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#1e3a5f] mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#111111]">Anti-Fraude Total</h3>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Códigos de verificación dinámicos de 5 dígitos al email del turista. El staff escanea el código en la puerta para validar. Nadie cobra sin visita real validada.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-7 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#f0f4f8] flex items-center justify-center text-[#1e3a5f] mb-1">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#111111]">Métricas al Instante</h3>
            <p className="text-[#6b7280] text-sm leading-relaxed">
              Dashboards para ver qué relaciones públicas rinde mejor, cuántos tickets se generaron por local y facturación automática de comisiones.
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb] bg-white py-7 px-6 text-center text-sm text-[#9ca3af]">
        <p className="mb-3">© {new Date().getFullYear()} El Código. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-5">
          <Link href="/aviso-legal" className="hover:text-[#111111] transition-colors">Aviso Legal</Link>
          <Link href="/privacidad" className="hover:text-[#111111] transition-colors">Privacidad</Link>
          <Link href="/cookies" className="hover:text-[#111111] transition-colors">Cookies</Link>
        </div>
      </footer>
    </div>
  )
}
