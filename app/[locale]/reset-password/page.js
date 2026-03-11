'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
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
        if (!token) {
            toast.error('Enlace de recuperación inválido o expirado.', { style: { background: '#1A1A1B', color: '#fff' } })
            router.push('/login')
        }
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
                setTimeout(() => router.push('/login'), 4000)
            } else {
                setError(data.error || 'Error al restablecer contraseña')
            }
        } catch (err) {
            setError('Error de conexión a la base de datos')
        } finally {
            setCargando(false)
        }
    }

    // Framer var
    const boxAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

    if (!token) return null

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A] text-white font-sans overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div variants={boxAnim} initial="hidden" animate="show" className="w-full max-w-sm z-10">

                {exito ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel p-8 rounded-3xl text-center">
                        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Contraseña Actualizada</h2>
                        <p className="text-zinc-400 text-sm mb-6">Tu nueva clave ha sido guardada en la Bóveda de El Código correctamente.</p>
                        <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-zinc-500 mt-4">Redirigiendo al Login...</p>
                    </motion.div>
                ) : (
                    <div className="glass-panel p-8 rounded-3xl">
                        <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                            <KeyRound size={24} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Nueva Contraseña</h2>
                        <p className="text-zinc-400 text-sm mb-6">Introduce una nueva clave de acceso para tu cuenta. Protégela bien.</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="password"
                                placeholder="Nueva Contraseña (min. 6 car)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                            />
                            <input
                                type="password"
                                placeholder="Repite la Contraseña"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                            />

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm py-2 px-3 rounded-xl flex items-center gap-2">
                                        <ShieldAlert size={14} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-center my-4">
                                <Turnstile
                                    siteKey="0x4AAAAAAA2T__3S_7WjL-m7" // Test Dummy Key. En produccion debe usar variable .env
                                    onSuccess={(token) => setCfToken(token)}
                                    options={{ theme: 'dark' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full bg-white text-black font-semibold rounded-xl py-3.5 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2 mt-4"
                            >
                                {cargando ? 'Guardando...' : <>Cambiar Acceso <ArrowRight size={16} /></>}
                            </button>
                        </form>
                    </div>
                )}

            </motion.div>
            <Toaster />
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="animate-spin text-blue-500">Cargando Bóveda...</div></div>}>
            <ResetForm />
        </Suspense>
    )
}
