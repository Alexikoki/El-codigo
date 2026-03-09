'use client'
import { useState, useEffect } from 'react'

export default function ValorarPage({ params }) {
  const [info, setInfo] = useState(null)
  const [estado, setEstado] = useState('cargando')
  const [gasto, setGasto] = useState('')
  const [valoracion, setValoracion] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarInfo()
  }, [])

  const cargarInfo = async () => {
    const id = window.location.pathname.split('/').pop()
    const res = await fetch(`/api/valorar/${id}`)
    const data = await res.json()
    if (data.yaValorado) { setEstado('yaValorado'); return }
    setInfo({ ...data, id })
    setEstado('formulario')
  }

  const handleSubmit = async () => {
    if (!gasto || !valoracion) { setError('Rellena todos los campos'); return }
    setError('')
    setEstado('enviando')

    const res = await fetch(`/api/valorar/${info.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gasto: parseFloat(gasto), valoracion })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setEstado('formulario'); return }
    setEstado('exito')
  }

  if (estado === 'cargando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (estado === 'yaValorado') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800">Ya has valorado esta visita</h2>
      </div>
    </div>
  )

  if (estado === 'exito') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">🙏</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">¡Gracias!</h2>
        <p className="text-gray-500">Tu valoración ha sido registrada.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-1 text-center">¿Cómo fue tu visita?</h1>
        {info && <p className="text-center text-gray-400 text-sm mb-6">{info.lugar?.nombre}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">¿Cuánto gastaste? (€)</label>
            <input
              type="number"
              placeholder="Ej: 45.50"
              value={gasto}
              onChange={e => setGasto(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Valoración</label>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setValoracion(n)}
                  className={`text-3xl transition ${n <= valoracion ? 'opacity-100' : 'opacity-30'}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

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