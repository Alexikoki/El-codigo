'use client'
import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TotpSetup() {
  const [configured, setConfigured] = useState(null) // null = loading, true/false
  const [setup, setSetup] = useState(null) // { secret, uri }
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/auth/totp', { credentials: 'include' })
      const data = await res.json()
      setConfigured(data.configured ?? false)
      if (!data.configured && data.secret) {
        setSetup({ secret: data.secret, uri: data.uri })
      }
    } catch {
      setConfigured(false)
    }
  }

  const startSetup = async () => {
    setShowSetup(true)
    if (setup) return
    try {
      const res = await fetch('/api/auth/totp', { credentials: 'include' })
      const data = await res.json()
      if (data.secret) setSetup({ secret: data.secret, uri: data.uri })
    } catch {
      toast.error('Error al generar 2FA')
    }
  }

  const confirmSetup = async () => {
    if (code.length !== 6) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup', code, secret: setup.secret })
      })
      const data = await res.json()
      if (data.ok) {
        setConfigured(true)
        setShowSetup(false)
        setCode('')
        toast.success('2FA activado correctamente')
      } else {
        toast.error(data.error || 'Código incorrecto')
      }
    } catch {
      toast.error('Error al configurar 2FA')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (!confirm('¿Desactivar 2FA? Tu cuenta será menos segura.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/totp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' })
      })
      const data = await res.json()
      if (data.ok) {
        setConfigured(false)
        setSetup(null)
        toast.success('2FA desactivado')
      }
    } catch {
      toast.error('Error al desactivar 2FA')
    } finally {
      setLoading(false)
    }
  }

  if (configured === null) return null

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {configured ? (
            <ShieldCheck size={20} className="text-green-600" />
          ) : (
            <Shield size={20} className="text-[#9ca3af]" />
          )}
          <div>
            <p className="text-sm font-medium text-[#111111]">
              Autenticación 2FA {configured ? '(Activa)' : '(Desactivada)'}
            </p>
            <p className="text-xs text-[#6b7280]">
              {configured ? 'Protegido con Google Authenticator' : 'Activa 2FA para mayor seguridad'}
            </p>
          </div>
        </div>
        {configured ? (
          <button
            onClick={disable2FA}
            disabled={loading}
            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
          >
            <ShieldOff size={14} /> Desactivar
          </button>
        ) : (
          <button
            onClick={startSetup}
            className="text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-lg hover:bg-[#15294a] transition-colors font-medium"
          >
            Activar 2FA
          </button>
        )}
      </div>

      {showSetup && setup && !configured && (
        <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
          <p className="text-sm text-[#374151] mb-3">
            Escanea este código con Google Authenticator o Authy:
          </p>

          {/* QR as text URI fallback — user can copy it */}
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 mb-3">
            <p className="text-xs text-[#6b7280] mb-1">Clave manual (si no puedes escanear):</p>
            <code className="text-sm font-mono text-[#111111] break-all select-all">{setup.secret}</code>
          </div>

          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4 mb-3">
            <p className="text-xs text-[#6b7280] mb-1">URI completa (copiar en la app):</p>
            <code className="text-xs font-mono text-[#6b7280] break-all select-all">{setup.uri}</code>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Código de 6 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="flex-1 border border-[#e5e7eb] focus:border-[#1e3a5f] rounded-lg px-4 py-2.5 text-sm text-center tracking-[0.2em] font-mono focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
            />
            <button
              onClick={confirmSetup}
              disabled={loading || code.length < 6}
              className="bg-[#1e3a5f] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#15294a] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Verificar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
