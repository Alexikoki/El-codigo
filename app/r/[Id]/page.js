'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function FormularioClientePage() {
  const { id } = useParams()
  const [form, setForm] = useState({ nombre: '', email: '', numPersonas: 1 })
  const [estado, setEstado] = useState('formulario')
  const [error, setError] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.nombre || !form.email) {
      setError('Rellena todos los campos')
      return
    }
    if (!form.email.includes('@')) {
      setError('Email no válido')
      return
    }
    setError('')
    setEstado('enviando')

    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        email: form.email,
        numPersonas: parseInt(form.numPersonas),
        qrToken: id
      })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
      setEstado('formulario')
      return
    }

    setEstado('exito')
  }

  if (estado === 'exito') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro completado!</h2>
          <p className="text-gray-500">Te hemos enviado un email con tu QR personal de descuento.</p>
          <p className="text-gray-400 text-sm mt-2">Muéstralo al camarero cuando llegues.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Bienvenido</h1>
        <p className="text-center text-gray-400 text-sm mb-8">Rellena tus datos para recibir tu descuento</p>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Tu nombre"
            value={form.nombre}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Tu email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Número de personas</label>
            <select
              name="numPersonas"
              value={form.numPersonas}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
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
          {estado === 'enviando' ? 'Enviando...' : 'Confirmar registro'}
        </button>
      </div>
    </div>
  )
}