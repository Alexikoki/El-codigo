'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperAdminPage() {
  const [autenticado, setAutenticado] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tab, setTab] = useState('empresas')
  const [empresas, setEmpresas] = useState([])
  const [clientes, setClientes] = useState([])
  const [token, setToken] = useState(null)

  const handleLogin = async () => {
    setError('')
    setCargando(true)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, tipo: email })
    })
    const data = await res.json()
    if (!res.ok || data.rol !== 'superadmin') {
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
      fetch('/api/superadmin/empresas', { headers: { Authorization: `Bearer ${t}` } }),
      fetch('/api/superadmin/clientes', { headers: { Authorization: `Bearer ${t}` } })
    ])
    const dataE = await resE.json()
    const dataC = await resC.json()
    setEmpresas(dataE.empresas || [])
    setClientes(dataC.clientes || [])
    setCargando(false)
  }

  const toggleEmpresa = async (id, activo) => {
    await fetch('/api/superadmin/empresas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, activo: !activo })
    })
    setEmpresas(empresas.map(e => e.id === id ? { ...e, activo: !activo } : e))
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center text-white mb-6">Super Admin</h2>
          <div className="space-y-3">
            <input
              placeholder="Usuario"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={cargando}
            className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
          >
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  const totalVerificados = clientes.filter(c => c.verificado).length
  const totalPersonas = clientes.reduce((sum, c) => sum + (c.num_personas || 1), 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-bold">⚡ Super Admin</h1>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Empresas', value: empresas.length, color: 'purple' },
            { label: 'Clientes totales', value: clientes.length, color: 'blue' },
            { label: 'Verificados', value: totalVerificados, color: 'green' },
            { label: 'Total personas', value: totalPersonas, color: 'yellow' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-800 rounded-xl p-5 text-center border border-gray-700">
              <p className={`text-3xl font-bold text-${color}-400`}>{value}</p>
              <p className="text-sm text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['empresas', 'comisiones'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t === 'empresas' ? 'Empresas' : 'Comisiones'}
            </button>
          ))}
        </div>

        {tab === 'empresas' && (
          <div className="space-y-2">
            {empresas.map(e => {
              const clientesEmpresa = clientes.filter(c => c.empresa_id === e.id)
              const verificados = clientesEmpresa.filter(c => c.verificado).length
              return (
                <div key={e.id} className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{e.nombre}</p>
                    <p className="text-sm text-gray-400">{e.email} · <span className="capitalize">{e.tipo}</span> · {verificados} verificados</p>
                  </div>
                  <button
                    onClick={() => toggleEmpresa(e.id, e.activo)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                      e.activo ? 'bg-green-900 text-green-400 hover:bg-green-800' : 'bg-red-900 text-red-400 hover:bg-red-800'
                    }`}
                  >
                    {e.activo ? 'Activa' : 'Inactiva'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'comisiones' && (
          <div className="space-y-2">
            {empresas.map(e => {
              const clientesEmpresa = clientes.filter(c => c.empresa_id === e.id)
              const verificados = clientesEmpresa.filter(c => c.verificado).length
              const personas = clientesEmpresa.reduce((sum, c) => sum + (c.num_personas || 1), 0)
              return (
                <div key={e.id} className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-white">{e.nombre}</p>
                    <span className="text-xs text-gray-400 capitalize">{e.tipo}</span>
                  </div>
                  <div className="flex gap-6 mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Registrados</p>
                      <p className="text-lg font-bold text-blue-400">{clientesEmpresa.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Verificados</p>
                      <p className="text-lg font-bold text-green-400">{verificados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Personas</p>
                      <p className="text-lg font-bold text-purple-400">{personas}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}