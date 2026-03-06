'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [empresa, setEmpresa] = useState(null)
  const [token, setToken] = useState(null)
  const [tab, setTab] = useState('stats')
  const [referidores, setReferidores] = useState([])
  const [clientes, setClientes] = useState([])
  const [nuevoReferidor, setNuevoReferidor] = useState('')
  const [cargando, setCargando] = useState(true)
  const [qrVisible, setQrVisible] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const e = localStorage.getItem('empresa')
    if (!t || rol !== 'empresa') { router.push('/login'); return }
    setToken(t)
    setEmpresa(JSON.parse(e))
    cargarDatos(t)
  }, [])

  const cargarDatos = async (t) => {
    setCargando(true)
    const [resRef, resCli] = await Promise.all([
      fetch('/api/referidores', { headers: { Authorization: `Bearer ${t}` } }),
      fetch('/api/clientes-empresa', { headers: { Authorization: `Bearer ${t}` } })
    ])
    const dataRef = await resRef.json()
    const dataCli = await resCli.json()
    setReferidores(dataRef.referidores || [])
    setClientes(dataCli.clientes || [])
    setCargando(false)
  }

  const crearReferidor = async () => {
    if (!nuevoReferidor.trim()) return
    const res = await fetch('/api/referidores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: nuevoReferidor })
    })
    const data = await res.json()
    if (res.ok) {
      setReferidores([data.referidor, ...referidores])
      setNuevoReferidor('')
      setQrVisible({ id: data.referidor.id, url: data.qrUrl, imagen: data.qrImage })
    }
  }

  const eliminarReferidor = async (id) => {
    await fetch('/api/referidores', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id })
    })
    setReferidores(referidores.filter(r => r.id !== id))
  }

  const cerrarSesion = () => {
    localStorage.clear()
    router.push('/login')
  }

  const exportarCSV = () => {
    const headers = 'Nombre,Email,Personas,Verificado,Fecha\n'
    const rows = clientes.map(c =>
      `${c.nombre},${c.email},${c.num_personas},${c.verificado ? 'Sí' : 'No'},${new Date(c.created_at).toLocaleDateString('es-ES')}`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clientes.csv'
    a.click()
  }

  if (cargando) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  const verificados = clientes.filter(c => c.verificado).length
  const totalPersonas = clientes.reduce((sum, c) => sum + (c.num_personas || 1), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{empresa?.nombre}</h1>
          <p className="text-sm text-gray-400 capitalize">{empresa?.tipo}</p>
        </div>
        <button onClick={cerrarSesion} className="text-sm text-gray-400 hover:text-red-500 transition">
          Cerrar sesión
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {['stats', 'referidores', 'clientes'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t === 'stats' ? 'Estadísticas' : t === 'referidores' ? 'Referidores' : 'Clientes'}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Clientes totales', value: clientes.length, color: 'blue' },
              { label: 'Verificados', value: verificados, color: 'green' },
              { label: 'Total personas', value: totalPersonas, color: 'purple' },
              { label: 'Referidores activos', value: referidores.length, color: 'orange' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl p-5 shadow-sm text-center">
                <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
                <p className="text-sm text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'referidores' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm flex gap-2">
              <input
                type="text"
                placeholder="Nombre del referidor"
                value={nuevoReferidor}
                onChange={e => setNuevoReferidor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && crearReferidor()}
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={crearReferidor}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Crear QR
              </button>
            </div>

            {qrVisible && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-sm font-medium text-blue-800 mb-4">QR listo para compartir</p>
                {qrVisible.imagen && (
                  <img src={qrVisible.imagen} alt="QR" className="w-48 h-48 mx-auto mb-4 rounded-lg" />
                )}
                <p className="text-xs text-blue-600 break-all mb-4">{qrVisible.url}</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(qrVisible.url)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Copiar enlace
                  </button>
                  <button onClick={() => setQrVisible(null)} className="text-sm text-gray-400 hover:text-gray-600 px-4 py-2">
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {referidores.map(r => (
                <div key={r.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-xs text-gray-400">Creado {new Date(r.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                  <button
                    onClick={() => eliminarReferidor(r.id)}
                    className="text-sm text-red-400 hover:text-red-600 transition"
                  >
                    Desactivar
                  </button>
                </div>
              ))}
              {referidores.length === 0 && (
                <p className="text-center text-gray-400 py-8">No hay referidores aún</p>
              )}
            </div>
          </div>
        )}

        {tab === 'clientes' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={exportarCSV}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              >
                Exportar CSV
              </button>
            </div>
            <div className="space-y-2">
              {clientes.map(c => (
                <div key={c.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{c.nombre}</p>
                    <p className="text-sm text-gray-400">{c.email} · {c.num_personas} persona{c.num_personas > 1 ? 's' : ''}</p>
                    {c.gasto && <p className="text-sm text-green-600 font-medium">{c.gasto}€ · {'⭐'.repeat(c.valoracion)}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    c.verificado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.verificado ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              ))}
              {clientes.length === 0 && (
                <p className="text-center text-gray-400 py-8">No hay clientes aún</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}