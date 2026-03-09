'use client'
import { useState, useEffect } from 'react'

export default function FormularioClientePage() {
  const [qrToken, setQrToken] = useState('')
  const [referidor, setReferidor] = useState(null)
  const [lugares, setLugares] = useState([])
  const [form, setForm] = useState({ nombre: '', email: '', numPersonas: 1, lugarId: '' })
  const [estado, setEstado] = useState('cargando')
  const [clienteId, setClienteId] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const segmentos = window.location.pathname.split('/')
    const token = segmentos[segmentos.length - 1]
    setQrToken(token)
    cargarDatos(token)
  }, [])

  const cargarDatos = async (token) => {
    const [resRef, resLug] = await Promise.all([
      fetch(`/api/referidores/publico?token=${token}`),
      fetch('/api/lugares')
    ])
    if (resRef.ok) setReferidor(await resRef.json())
    if (resLug.ok) {
      const data = await resLug.json()
      setLugares(data.lugares || [])
    }
    setEstado('formulario')
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.nombre || !form.email || !form.lugarId) {
      setError('Rellena todos los campos y selecciona un lugar')
      return
    }
    if (!form.email.includes('@')) { setError('Email no válido'); return }
    setError('')
    setEstado('enviando')

    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        numPersonas: parseInt(form.numPersonas),
        qrToken,
        lugarId: form.lugarId
      })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error'); setEstado('formulario'); return }

    setClienteId(data.clienteId)
    setEstado('confirmar')
  }

  const handleConfirmar = async () => {
    if (!codigo || codigo.length !== 5) { setError('Introduce el código de 5 dígitos'); return }
    setError('')
    setEstado('enviando')

    const res = await fetch('/api/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, codigo })
    })

    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Código incorrecto'); setEstado('confirmar'); return }

    setEstado('exito')
  }

  if (estado === 'cargando') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  if (estado === 'exito') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Todo listo!</h2>
        <p className="text-gray-500">Te hemos enviado el QR de descuento por email.</p>
        <p className="text-gray-400 text-sm mt-2">Muéstralo al llegar al local.</p>
      </div>
    </div>
  )

  if (estado === 'confirmar') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📧</div>
          <h2 className="text-xl font-bold text-gray-800">Confirma tu email</h2>
          <p className="text-gray-400 text-sm mt-2">Te hemos enviado un código de 5 dígitos</p>
        </div>

        <input
          type="text"
          placeholder="Código de 5 dígitos"
          value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 5))}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-center text-2xl font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={5}
        />

        {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}

        <button
          onClick={handleConfirmar}
          disabled={estado === 'enviando'}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Verificando...' : 'Confirmar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {referidor && (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-400">Reserva con</p>
            <h2 className="text-2xl font-bold text-blue-600">{referidor.nombre}</h2>
          </div>
        )}

        <h1 className="text-xl font-bold text-center text-gray-800 mb-1">Bienvenido</h1>
        <p className="text-center text-gray-400 text-sm mb-6">Rellena tus datos para recibir tu descuento</p>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Tu email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Número de personas</label>
            <select
              name="numPersonas"
              value={form.numPersonas}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">¿A qué lugar vas?</label>
            <select
              name="lugarId"
              value={form.lugarId}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un lugar</option>
              {lugares.map(l => (
                <option key={l.id} value={l.id}>{l.nombre} — {l.tipo} ({l.descuento}% dto)</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={estado === 'enviando'}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {estado === 'enviando' ? 'Enviando...' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}