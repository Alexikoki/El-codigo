'use client'
import { CreditCard, CheckCircle2, PlusCircle } from 'lucide-react'

export default function PagosTab({ stripeOnboarded, stripeConectando, conectarStripe, liquidaciones, setModalLiq, setConfirmPago }) {
  return (
    <div className="space-y-5">
      {/* Stripe Connect Banner */}
      {!stripeOnboarded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Conecta tu cuenta bancaria</p>
            <p className="text-xs text-amber-700 mt-1">Para recibir pagos automáticos de la plataforma necesitas verificar tu identidad y añadir tu IBAN a través de Stripe.</p>
          </div>
          <button onClick={conectarStripe} disabled={stripeConectando}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50">
            <CreditCard size={15} /> {stripeConectando ? 'Redirigiendo...' : 'Conectar cuenta'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-green-700">
          <CheckCircle2 size={16} /> Cuenta bancaria conectada — recibirás pagos automáticamente.
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-semibold text-[#111111]">Historial de Pagos</h2>
          <p className="text-sm text-[#6b7280]">Liquidaciones a tus promotores.</p>
        </div>
        <button onClick={() => setModalLiq(true)}
          className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle size={15} /> <span className="hidden sm:inline">Nueva Liquidación</span>
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <p className="text-xs text-[#6b7280] mb-1">Pendiente de pago</p>
          <p className="text-2xl font-bold text-amber-600">
            {liquidaciones.filter(l => l.estado === 'pendiente').reduce((s, l) => s + l.importe, 0).toFixed(2)}€
          </p>
          <p className="text-xs text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pendiente').length} liquidaciones</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-[#6b7280] mb-1">Total pagado</p>
          <p className="text-2xl font-bold text-[#4a9070]">
            {liquidaciones.filter(l => l.estado === 'pagado').reduce((s, l) => s + l.importe, 0).toFixed(2)}€
          </p>
          <p className="text-xs text-[#9ca3af] mt-1">{liquidaciones.filter(l => l.estado === 'pagado').length} liquidaciones</p>
        </div>
      </div>

      {/* List */}
      {liquidaciones.length === 0 ? (
        <div className="text-center py-12 text-[#9ca3af] border border-dashed border-[#e5e7eb] rounded-xl bg-white text-sm">
          Aún no hay liquidaciones registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {liquidaciones.map(l => (
            <div key={l.id} className="glass-panel p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-[#111111] text-sm">
                      {l.agencia_id ? 'Mi agencia' : l.referidores?.nombre || '—'}
                    </p>
                    {l.origen === 'auto' && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#f0f4f8] text-[#1e3a5f] font-medium border border-[#dce6f0]">Auto</span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      l.estado === 'pagado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>{l.estado === 'pagado' ? 'Pagado' : 'Pendiente'}</span>
                  </div>
                  <p className="text-xs text-[#9ca3af] mt-1">
                    {new Date(l.periodo_desde).toLocaleDateString('es-ES')} — {new Date(l.periodo_hasta).toLocaleDateString('es-ES')}
                  </p>
                  {l.notas && <p className="text-xs text-[#6b7280] mt-1 italic">{l.notas.replace(/\s*\[id:[^\]]+\]/, '')}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-[#111111]">{l.importe.toFixed(2)}€</p>
                  {l.estado === 'pendiente' && (
                    <button onClick={() => setConfirmPago(l)}
                      className="mt-1 text-xs text-[#4a9070] hover:underline flex items-center gap-1">
                      <CheckCircle2 size={11} /> Marcar pagado
                    </button>
                  )}
                  {l.estado === 'pagado' && l.pagado_at && (
                    <p className="text-[10px] text-[#9ca3af] mt-1">{new Date(l.pagado_at).toLocaleDateString('es-ES')}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
