'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Rellena todos los campos')
      return
    }
    setError('')
    setCargando(true)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Credenciales incorrectas')
      setCargando(false)
      return
    }

    // Guardar token
    localStorage.setItem('token', data.token)
    localStorage.setItem('rol', data.rol)

    if (data.rol === 'empresa') {
      localStorage.setItem('empresa', JSON.stringify(data.empresa))
      router.push('/dashboard')
    } else if (data.rol === 'camarero') {
      localStorage.setItem('camarero', JSON.stringify(data.camarero))
      router.push('/staff')
    } else if (data.rol === 'admin') {
      router.push('/admin')
    } else if (data.rol === 'superadmin') {
      router.push('/superadmin')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">El Código</h1>
        <p className="text-center text-gray-400 text-sm mb-8">Iniciar sesión</p>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Email o usuario"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={cargando}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-6">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="text-blue-600 hover:underline">Crear cuenta</a>
        </p>
      </div>
    </div>
  )
}