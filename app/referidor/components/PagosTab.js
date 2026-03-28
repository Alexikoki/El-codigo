'use client'
import { CreditCard, CheckCircle2, Receipt, ChevronLeft, ChevronRight } from 'lucide-react'

export default function PagosTab({
  stripeOnboarded, stripeConectando, conectarStripe,
  historial, historialCargando, historialStats,
  historialPagina, historialTotalPag, cargarHistorial,
  liquidaciones
}) {
  return (
    <div className="space-y-5">
      {/* Banner Stripe Connect */}
      {!stripeOnboarded ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Conecta tu cuenta bancaria</p>
            <p className="text-xs text-amber-700 mt-1">Para recibir tus comisiones automaticamente necesitas verificar tu identidad y anadir tu IBAN a traves de Stripe.</p>
          </div>
          <button onClick={conectarStripe} disabled={stripeConectando}
            className="flex items-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap disabled:opacity-50">
            <CreditCard size={15} /> {stripeConectando ? 'Redirigiendo...' : 'Conectar cuenta'}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-green-700">
          <CheckCircle2 size={16} /> Cuenta bancaria conectada — recibiras pagos automaticamente.
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-4 text-center border-t-2 border-t-[#1e3a5f]">
          <p className="text-xs text-[#6b7280] mb-1">Conversiones</p>
          <p className="text-2xl font-bold text-[#111111]">{historialStats.totalConversiones}</p>
        </div>
        <div className="glass-panel p-4 text-center border-t-2 border-t-[#6b7280]">
          <p className="text-xs text-[#6b7280] mb-1">Volumen</p>
          <p className="text-2xl font-bold text-[#111111]">{historialStats.totalGasto.toFixed(0)}&euro;</p>
        </div>
        <div className="glass-panel p-4 text-center border-t-2 border-t-[#4a9070]">
          <p className="text-xs text-[#6b7280] mb-1">Comision Total</p>
          <p className="text-2xl font-bold text-[#4a9070]">{historialStats.totalComision.toFixed(2)}&euro;</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {historialCargando ? (
          <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-[#e5e7eb] border-t-[#1e3a5f] rounded-full animate-spin" /></div>
        ) : historial.length === 0 ? (
          <div className="text-center py-12 text-[#9ca3af]">
            <Receipt size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aun no hay conversiones registradas</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f3f4f6] text-[#9ca3af] text-xs">
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-right p-4 font-medium hidden sm:table-cell">Fecha</th>
                  <th className="text-right p-4 font-medium">Gasto</th>
                  <th className="text-right p-4 font-medium">Comision</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((v, i) => (
                  <tr key={v.id} className={`border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors ${i % 2 !== 0 ? 'bg-[#fafaf8]' : ''}`}>
                    <td className="p-4">
                      <p className="font-medium text-[#111111]">{v.clientes?.nombre || 'Anonimo'}</p>
                      <p className="text-xs text-[#9ca3af]">{v.clientes?.num_personas} pers.</p>
                    </td>
                    <td className="p-4 text-right text-[#6b7280] hidden sm:table-cell">
                      {new Date(v.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-4 text-right text-[#111111] font-mono">{v.gasto?.toFixed(2)}&euro;</td>
                    <td className="p-4 text-right">
                      <span className="text-[#4a9070] font-bold font-mono">+{(v.comision_referidor || 0).toFixed(2)}&euro;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historialTotalPag > 1 && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-[#f3f4f6]">
                <button onClick={() => cargarHistorial(historialPagina - 1)} disabled={historialPagina <= 1}
                  className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm text-[#6b7280]">{historialPagina} / {historialTotalPag}</span>
                <button onClick={() => cargarHistorial(historialPagina + 1)} disabled={historialPagina >= historialTotalPag}
                  className="p-1.5 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-30 transition-colors">
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Liquidaciones Oficiales */}
      <div>
        <h3 className="text-sm font-semibold text-[#111111] mb-3 flex items-center gap-2">
          <CreditCard size={14} className="text-[#1e3a5f]" /> Liquidaciones Oficiales
        </h3>
        {liquidaciones.length === 0 ? (
          <div className="glass-panel py-8 text-center text-[#9ca3af] text-sm">
            <CreditCard size={28} className="mx-auto mb-2 opacity-30" />
            No hay liquidaciones pendientes
          </div>
        ) : (
          <div className="space-y-3">
            {liquidaciones.map(liq => (
              <div key={liq.id} className="glass-panel p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#111111]">{liq.periodo_desde} — {liq.periodo_hasta}</p>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium border ${
                      liq.estado === 'pagado'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {liq.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                  {liq.notas && <p className="text-xs text-[#9ca3af] italic">{liq.notas}</p>}
                  {liq.pagado_at && (
                    <p className="text-xs text-[#9ca3af]">
                      Abonado el {new Date(liq.pagado_at).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
                <p className="text-xl font-bold text-[#111111] whitespace-nowrap">{parseFloat(liq.importe).toFixed(2)}&euro;</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
