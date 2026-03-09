'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SuperadminPage() {
  const [token, setToken] = useState(null)
  const [tab, setTab] = useState('lugares')
  const [lugares, setLugares] = useState([])
  const [referidores, setReferidores] = useState([])
  const [staff, setStaff] = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const router = useRouter()

  useEffect(() => {
    const t = localStorage.getItem('token')
    const rol = localStorage.getItem('rol')
    if (!t || rol !== 'superadmin') { router.push('/login'); return }
    setToken(t)
    cargarDatos(t)
  }, [])

  const cargarDatos = async (t) => {
    setCargando(true)
    const headers = { Authorization: `Bearer ${t}` }
    const [resL, resR, resS] = await Promise.all([
      fetch('/api/lugares', { headers }),
      fetch('/api/referidores', { headers }),
      fetch('/api/staff', { headers })
    ])
    const [dataL, dataR, dataS] = await Promise.all([resL.json(), resR.json(), resS.json()])
    setLugares(dataL.lugares || [])
    setReferidores(dataR.referidores || [])
    setStaff(dataS.staff || [])
    setCargando(false)
  }

  const handleSubmit = async () => {
    let url, body
    if (modal === 'lugar') {
      url = '/api/lugares'
      body = form
    } else if (modal === 'referidor') {
      url = '/api/referidores'
      body = form
    } else if (modal === 'staff') {
      url = '/api/staff'
      body = form
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      setModal(null)
      setForm({})
      cargarDatos(token)
    }
  }

  const toggleActivo = async (tipo, id, activo) => {
    const url = tipo === 'lugar' ? '/api/lugares' : '/api/referidores'
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, activo: !activo })
    })
    cargarDatos(token)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">El Código — Admin</h1>
        <button onClick={() => { localStorage.clear(); router.push('/login') }} className="text-sm text-gray-400 hover:text-red-500">Salir</button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="flex gap-2 mb-6">
          {['lugares', 'referidores', 'staff'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* LUGARES */}
        {tab === 'lugares' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setModal('lugar'); setForm({ descuento: 10 }) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Nuevo lugar
              </button>
            </div>
            {lugares.map(l => (
              <div key={l.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{l.nombre}</p>
                  <p className="text-sm text-gray-400">{l.tipo} · {l.descuento}% descuento · {l.direccion}</p>
                </div>
                <button onClick={() => toggleActivo('lugar', l.id, l.activo)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${l.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {l.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* REFERIDORES */}
        {tab === 'referidores' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setModal('referidor'); setForm({}) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Nuevo referidor
              </button>
            </div>
            {referidores.map(r => (
              <div key={r.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{r.nombre}</p>
                  <p className="text-sm text-gray-400">{r.email}</p>
                  <p className="text-xs text-blue-500 mt-1">{`${process.env.NEXT_PUBLIC_APP_URL || ''}/r/${r.qr_token}`}</p>
                </div>
                <button onClick={() => toggleActivo('referidor', r.id, r.activo)}
                  className={`text-xs px-3 py-1 rounded-full font-medium ${r.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {r.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* STAFF */}
        {tab === 'staff' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => { setModal('staff'); setForm({}) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                + Nuevo staff
              </button>
            </div>
            {staff.map(s => (
              <div key={s.id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{s.nombre}</p>
                  <p className="text-sm text-gray-400">{s.email} · {s.lugares?.nombre}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">Activo</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {modal === 'lugar' ? 'Nuevo lugar' : modal === 'referidor' ? 'Nuevo referidor' : 'Nuevo staff'}
            </h2>

            <div className="space-y-3">
              {modal === 'lugar' && <>
                <input placeholder="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tipo de lugar</option>
                  {['Restaurante', 'Bar', 'Hotel', 'Museo', 'Tienda', 'Spa', 'Experiencia'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input placeholder="Dirección" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Descuento %" value={form.descuento || 10} onChange={e => setForm({ ...form, descuento: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </>}

              {modal === 'referidor' && <>
                <input placeholder="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </>}

              {modal === 'staff' && <>
                <input placeholder="Nombre" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" placeholder="Email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="password" placeholder="Contraseña" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={form.lugar_id || ''} onChange={e => setForm({ ...form, lugar_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecciona lugar</option>
                  {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                </select>
              </>}
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setModal(null); setForm({}) }}
                className="flex-1 border border-gray-200 text-gray-500 py-2 rounded-lg text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}