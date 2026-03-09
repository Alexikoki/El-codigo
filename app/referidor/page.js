'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ReferidorPage() {
  const [referidor, setReferidor] = useState(null)
  const [token, setToken] = useState(null)
  const [clientes, setClientes] = useState([])
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    const r = localStorage.getItem('referidor')
    if (!t || rol !== 'referidor') { router.push('/login'); return }
    setToken(t)
    setReferidor(JSON.parse(r))
    cargarClientes(t)
  }, [])

  const cargarClientes = async (t) => {
    const res = await fetch('/api/referidor/clientes', {
      headers: { Authorization: `Bearer ${t}` }
    })
    if (res.ok) {
      const data = await res.json()
      setClientes(data.clientes || [])
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Mi panel</h1>
          <p className="text-sm text-gray-400">{referidor?.nombre}</p>
        </div>
        <button onClick={() => { localStorage.clear(); router.push('/login') }} className="text-sm text-gray-400 hover:text-red-500">Salir</button>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">Tu enlace de referido</h2>
          <p className="text-blue-600 text-sm break-all">{appUrl}/r/{referidor?.qr_token}</p>
          <button
            onClick={() => navigator.clipboard.writeText(`${appUrl}/r/${referidor?.qr_token}`)}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            Copiar enlace
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 mb-4">Clientes referidos ({clientes.length})</h2>
          {clientes.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aún no hay clientes</p>}
          {clientes.map(c => (
            <div key={c.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="font-medium text-gray-800 text-sm">{c.nombre}</p>
                <p className="text-xs text-gray-400">{c.lugares?.nombre} · {c.num_personas} persona{c.num_personas > 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-300">{new Date(c.created_at).toLocaleDateString('es-ES')}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.verificado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.verificado ? 'Visitó' : 'Pendiente'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}