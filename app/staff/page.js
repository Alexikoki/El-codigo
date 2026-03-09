'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const [camarero, setCamarero] = useState(null)
  const [token, setToken] = useState(null)
  const [escaneando, setEscaneando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')
  const [historial, setHistorial] = useState([])
  const scannerRef = useRef(null)
  const html5QrRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const c = localStorage.getItem('camarero')
    if (!t || rol !== 'camarero') { router.push('/login'); return }
    setToken(t)
    setCamarero(JSON.parse(c))
  }, [])

  const iniciarEscaner = async () => {
    setError('')
    setResultado(null)
    setEscaneando(true)

    // Esperamos a que el div esté en el DOM
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        const scanner = new Html5Qrcode('qr-reader')
        html5QrRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            // QR detectado
            await scanner.stop()
            setEscaneando(false)
            await verificarQR(decodedText)
          },
          () => {} // error silencioso mientras busca
        )
      } catch (e) {
        setEscaneando(false)
        setError('No se pudo acceder a la cámara. Asegúrate de dar permisos.')
      }
    }, 300)
  }

  const pararEscaner = async () => {
    try {
      if (html5QrRef.current) {
        await html5QrRef.current.stop()
        html5QrRef.current = null
      }
    } catch (e) {}
    setEscaneando(false)
  }

  const verificarQR = async (qrPersonal) => {
    // El QR contiene la URL completa: https://.../valorar/UUID
    // Extraemos el UUID del final
    const partes = qrPersonal.split('/')
    const clienteId = partes[partes.length - 1]

    const res = await fetch('/api/verificar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ qrPersonal: clienteId })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'QR no válido')
      return
    }

    setResultado(data)
    const entrada = {
      nombre: data.cliente.nombre,
      personas: data.cliente.numPersonas,
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
    setHistorial(prev => [entrada, ...prev.slice(0, 9)])
  }

  const cerrarSesion = () => {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Panel de verificación</h1>
          <p className="text-sm text-gray-400">{camarero?.nombre}</p>
        </div>
        <button onClick={cerrarSesion} className="text-sm text-gray-400 hover:text-red-500 transition">
          Salir
        </button>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">

        {/* ESCANER */}
        {!escaneando && !resultado && (
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <div className="text-5xl mb-4">📷</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Escanear QR del cliente</h2>
            <p className="text-sm text-gray-400 mb-6">El cliente debe mostrar el QR que recibió por email</p>
            <button
              onClick={iniciarEscaner}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition"
            >
              Abrir cámara
            </button>
          </div>
        )}

        {/* CÁMARA ACTIVA */}
        {escaneando && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-center text-sm text-gray-500 mb-3">Apunta al QR del cliente</p>
            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
            <button
              onClick={pararEscaner}
              className="w-full mt-4 border border-gray-200 text-gray-500 py-3 rounded-xl text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => { setError(''); setResultado(null) }}
              className="mt-3 text-sm text-red-400 hover:text-red-600"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* RESULTADO OK */}
        {resultado && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-green-800 mb-1">{resultado.cliente.nombre}</h2>
            <p className="text-green-600 text-sm mb-1">
              {resultado.cliente.numPersonas} persona{resultado.cliente.numPersonas > 1 ? 's' : ''}
            </p>
            <p className="text-green-500 text-xs">{resultado.cliente.email}</p>
            <p className="text-gray-400 text-xs mt-3">El cliente recibirá el formulario de valoración al salir</p>
            <button
              onClick={() => setResultado(null)}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
            >
              Siguiente cliente
            </button>
          </div>
        )}

        {/* HISTORIAL */}
        {historial.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Verificados hoy</h3>
            <div className="space-y-2">
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