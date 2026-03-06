'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function ValorarPage() {
  const { id } = useParams()
  const [cliente, setCliente] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [gasto, setGasto] = useState('')
  const [valoracion, setValoracion] = useState(0)
  const [estado, setEstado] = useState('cargando') // cargando | formulario | enviando | exito | error | yaValorado
  const [error, setError] = useState('')

  useEffect(() => {
    cargarCliente()
  }, [])

  const cargarCliente = async () => {
    const res = await fetch(`/api/valorar/${id}`)
    const data = await res.json()
    if (!res.ok) {
      setEstado('error')
      return
    }
    if (data.yaValorado) {
      setEstado('yaValorado')
      return
    }
    setCliente(data.cliente)
    setEmpresa(data.empresa)
    setEstado('formulario')
  }

  const handleSubmit = async () => {
    if (!gasto || valoracion === 0) {
      setError('Rellena todos los campos')
      return
    }
    setError('')
    setEstado('enviando')

    const res = await fetch(`/api/valorar/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gasto: parseFloat(gasto), valoracion })
    })

    if (!res.ok) {
      setError('Error al enviar')
      setEstado('formulario')
      return
    }

    setEstado('exito')
  }

  if (estado === 'cargando') return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (estado === 'error') return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">❌</div>
        <p className="text-gray-600">QR no válido o expirado</p>
      </div>
    </div>
  )

  if (estado === 'yaValorado') return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <p className="text-gray-600">Ya has enviado tu valoración. ¡Gracias!</p>
      </div>
    </div>
  )

  if (estado === 'exito') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">🌟</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu valoración!</h2>
        <p className="text-gray-500">Esperamos verte pronto.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{empresa?.nombre}</h1>
          <p className="text-gray-400 text-sm mt-1">Hola {cliente?.nombre}, ¿cómo fue tu experiencia?</p>
          {empresa?.descuento && (
            <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
              {empresa.descuento}% de descuento aplicado
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* Gasto */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              ¿Cuánto gastaste con el descuento? (€)
            </label>
            <input
              type="number"
              placeholder="Ej: 45.50"
              value={gasto}
              onChange={e => setGasto(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Valoración */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-3">
              ¿Cómo valorarías tu experiencia?
            </label>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setValoracion(n)}
                  className={`text-4xl transition-transform hover:scale-110 ${
                    valoracion >= n ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
            {valoracion > 0 && (
              <p className="text-center text-sm text-gray-400 mt-2">
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', '¡Excelente!'][valoracion]}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={estado === 'enviando'}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Enviar valoración'}
        </button>
      </div>
    </div>
  )
}