'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { QrCode, TrendingUp, Users, ShieldCheck, ChevronRight, Zap } from 'lucide-react'



export default function LandingPage() {

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden">

      {/* Fondo Antigravity (Spatial Depth) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-emerald-600/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>
      </div>

      {/* Navbar Minimalista */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12 border-b border-white/5 bg-[#0A0A0A]/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <QrCode className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-bold tracking-tight">El Código</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Iniciar Sesión
          </Link>
          <Link href="/login" className="px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            Acceso Panel
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-32 text-center md:pt-36">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-blue-400">
          <Zap className="w-3 h-3" />
          <span>Fase 5 Desplegada: Ya disponible el nuevo Motor de Comisiones</span>
        </div>

        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tighter mb-8 leading-[1.1]">
          El retorno a tu local, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            automatizado e inteligente.
          </span>
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
          Sustituye a los anticuados relaciones públicas de calle con un sistema de Referidos basado en QR. Traquea qué comerciales te traen más clientes, evita fraudes y paga comisiones automáticamente sólo por cliente que consume.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-8">
          <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 group">
            Empezar ahora
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="#como-funciona" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-full transition-colors flex items-center justify-center">
            Cómo funciona
          </Link>
        </div>

        {/* Feature Cards Grid (Glassmorphism) */}
        <div id="como-funciona" className="grid md:grid-cols-3 gap-6 max-w-5xl w-full mt-32 text-left pt-16">

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <QrCode className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 mb-2">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Tecnología QR</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Cada relaciones públicas tiene un código QR único. El turista escanea, deja su email y listo. Olvídate de flyers de papel que acaban en la basura.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Anti-Fraude Total</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Códigos de verificación dinámicos de 5 dígitos al email del turista. El staff escanea el código en la puerta para validar. Nadie cobra sin visita real validada.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Métricas al Instante</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Dashboards para ver qué relaciones públicas rinde mejor, cuántos tickets se generaron por local y facturación automática de comisiones.
            </p>
          </div>

        </div>
      </main>

      {/* Footer Simple */}
      <footer className="relative z-10 border-t border-white/5 bg-black py-8 px-6 text-center text-sm text-zinc-500">
        <p>© {new Date().getFullYear()} El Código. Todos los derechos reservados.</p>
        <p className="mt-2 text-xs opacity-50">Desarrollado para la revolución del ocio inteligente.</p>
      </footer>
    </div>
  )
}
