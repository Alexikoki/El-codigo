'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tab, setTab] = useState('empresas')
  const [empresas, setEmpresas] = useState([])
  const [camareros, setCamareros] = useState([])
  const [token, setToken] = useState(null)

  // Nuevo camarero
  const [nuevoCamarero, setNuevoCamarero] = useState({ nombre: '', email: '', password: '', empresa_id: '' })
  const router = useRouter()

  const handleLogin = async () => {
    setError('')
    setCargando(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tipo: email })
    })
    const data = await res.json()
    if (!res.ok || data.rol !== 'admin') {
      setError('Credenciales incorrectas')
      setCargando(false)
      return
    }
    setToken(data.token)
    setAutenticado(true)
    cargarDatos(data.token)
  }

  const cargarDatos = async (t) => {
    setCargando(true)
    const [resE, resC] = await Promise.all([
      fetch('/api/admin/empresas', { headers: { Authorization: `Bearer ${t}` } }),
      fetch('/api/admin/camareros', { headers: { Authorization: `Bearer ${t}` } })
    ])
    const dataE = await resE.json()
    const dataC = await resC.json()
    setEmpresas(dataE.empresas || [])
    setCamareros(dataC.camareros || [])
    setCargando(false)
  }

  const toggleEmpresa = async (id, activo) => {
    await fetch('/api/admin/empresas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, activo: !activo })
    })
    setEmpresas(empresas.map(e => e.id === id ? { ...e, activo: !activo } : e))
  }

  const crearCamarero = async () => {
    if (!nuevoCamarero.nombre || !nuevoCamarero.email || !nuevoCamarero.password || !nuevoCamarero.empresa_id) return
    const res = await fetch('/api/admin/camareros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(nuevoCamarero)
    })
    const data = await res.json()
    if (res.ok) {
      setCamareros([data.camarero, ...camareros])
      setNuevoCamarero({ nombre: '', email: '', password: '', empresa_id: '' })
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-6">Panel Admin</h2>
          <div className="space-y-3">
            <input
              placeholder="Usuario"
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
            className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">Panel Admin</h1>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {['empresas', 'camareros'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'empresas' ? `Empresas (${empresas.length})` : `Camareros (${camareros.length})`}
            </button>
          ))}
        </div>

        {tab === 'empresas' && (
          <div className="space-y-2">
            {empresas.map(e => (
              <div key={e.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{e.nombre}</p>
                  <p className="text-sm text-gray-400">{e.email} · <span className="capitalize">{e.tipo}</span></p>
                </div>
                <button
                  onClick={() => toggleEmpresa(e.id, e.activo)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    e.activo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {e.activo ? 'Activa' : 'Inactiva'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'camareros' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-700 mb-3">Nuevo camarero</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Nombre"
                  value={nuevoCamarero.nombre}
                  onChange={e => setNuevoCamarero({ ...nuevoCamarero, nombre: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  placeholder="Email"
                  value={nuevoCamarero.email}
                  onChange={e => setNuevoCamarero({ ...nuevoCamarero, email: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={nuevoCamarero.password}
                  onChange={e => setNuevoCamarero({ ...nuevoCamarero, password: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={nuevoCamarero.empresa_id}
                  onChange={e => setNuevoCamarero({ ...nuevoCamarero, empresa_id: e.target.value })}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona empresa...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={crearCamarero}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Crear camarero
              </button>
            </div>
            <div className="space-y-2">
              {camareros.map(c => (
                <div key={c.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{c.nombre}</p>
                    <p className="text-sm text-gray-400">{c.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{c.empresas?.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}