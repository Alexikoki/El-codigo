'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '', tipo: 'staff' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const router = useRouter()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Rellena todos los campos'); return }
    setCargando(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()
    setCargando(false)

    if (!res.ok) { setError(data.error || 'Error al iniciar sesión'); return }

    localStorage.setItem('token', data.token)
    localStorage.setItem('rol', data.rol)

    if (data.rol === 'superadmin') router.push('/superadmin')
    else if (data.rol === 'referidor') {
      localStorage.setItem('referidor', JSON.stringify(data.referidor))
      router.push('/referidor')
    } else {
      localStorage.setItem('staff', JSON.stringify(data.staff))
      router.push('/staff')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">El Código</h1>

        <div className="space-y-4">
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {['staff', 'referidor', 'superadmin'].map(t => (
              <button
                key={t}
                onClick={() => setForm({ ...form, tipo: t })}
                className={`flex-1 py-2 text-sm font-medium transition ${form.tipo === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {t === 'staff' ? 'Staff' : t === 'referidor' ? 'Referidor' : 'Admin'}
              </button>
            ))}
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={cargando}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}