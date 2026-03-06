'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', tipo: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegistro = async () => {
    if (!form.nombre || !form.email || !form.password || !form.tipo) {
      setError('Rellena todos los campos')
      return
    }
    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setError('')
    setCargando(true)

    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Error al registrarse')
      setCargando(false)
      return
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('rol', 'empresa')
    localStorage.setItem('empresa', JSON.stringify(data.empresa))
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">El Código</h1>
        <p className="text-center text-gray-400 text-sm mb-8">Crear cuenta</p>

        <div className="space-y-4">
          <input
            type="text"
            name="nombre"
            placeholder="Nombre de tu empresa"
            value={form.nombre}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={form.password}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-500"
          >
            <option value="">Tipo de empresa...</option>
            <option value="restaurante">Restaurante / Bar</option>
            <option value="hotel">Hotel / Alojamiento</option>
            <option value="agencia">Agencia / Guía turístico</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleRegistro}
          disabled={cargando}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:underline">Iniciar sesión</a>
        </p>
      </div>
    </div>
  )
}