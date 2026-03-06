'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const [camarero, setCamarero] = useState(null)
  const [token, setToken] = useState(null)
  const [qrInput, setQrInput] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [historial, setHistorial] = useState([])
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const c = localStorage.getItem('camarero')
    if (!t || rol !== 'camarero') { router.push('/login'); return }
    setToken(t)
    setCamarero(JSON.parse(c))
    const h = localStorage.getItem('historial_verificaciones')
    if (h) setHistorial(JSON.parse(h))
  }, [])

  const verificar = async (qrPersonal) => {
    if (!qrPersonal?.trim()) return
    setCargando(true)
    setResultado(null)

    const res = await fetch('/api/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ qrPersonal: qrPersonal.trim() })
    })

    const data = await res.json()
    setCargando(false)

    if (!res.ok) {
      setResultado({ ok: false, mensaje: data.error || 'Error al verificar' })
      return
    }

    const entrada = {
      nombre: data.cliente.nombre,
      personas: data.cliente.num_personas,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    const nuevoHistorial = [entrada, ...historial].slice(0, 50)
    setHistorial(nuevoHistorial)
    localStorage.setItem('historial_verificaciones', JSON.stringify(nuevoHistorial))
    setResultado({ ok: true, cliente: data.cliente })
    setQrInput('')
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rol')
    localStorage.removeItem('camarero')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Panel de verificación</h1>
          <p className="text-sm text-gray-400">{camarero?.nombre}</p>
        </div>
        <button onClick={cerrarSesion} className="text-sm text-gray-400 hover:text-red-500 transition">
          Salir
        </button>
      </div>

      <div className="max-w-lg mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Escanear QR del cliente</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Escanea el QR del cliente aquí"
              value={qrInput}
              onChange={e => setQrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && verificar(qrInput)}
              autoFocus
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => verificar(qrInput)}
              disabled={cargando}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {cargando ? '...' : 'Verificar'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            El cliente debe mostrar el QR que recibió por email
          </p>
        </div>

        {resultado && (
          <div className={`rounded-2xl p-6 text-center ${resultado.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {resultado.ok ? (
              <>
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-green-800">{resultado.cliente.nombre}</h3>
                <p className="text-green-600 mt-1">{resultado.cliente.num_personas} persona{resultado.cliente.num_personas > 1 ? 's' : ''}</p>
                <p className="text-sm text-green-500 mt-1">{resultado.cliente.email}</p>
                <p className="text-xs text-green-400 mt-2">El cliente recibirá el formulario de valoración al salir</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">❌</div>
                <p className="text-red-700 font-medium">{resultado.mensaje}</p>
              </>
            )}
          </div>
        )}

        {historial.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Verificados hoy</h2>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                {historial.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {historial.map((h, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{h.nombre}</p>
                    <p className="text-xs text-gray-400">{h.personas} persona{h.personas > 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-xs text-gray-400">{h.hora}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}