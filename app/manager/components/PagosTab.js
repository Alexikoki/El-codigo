'use client'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle2, Download } from 'lucide-react'

export default function PagosTab({ cargandoPago, resumenPago, pagando, iniciarPago, exportarLiquidacionesPDF }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-[#111111]">Comisiones pendientes</h2>
        <p className="text-xs text-[#9ca3af] mt-0.5">Resumen de deuda acumulada con la plataforma</p>
      </div>

      {cargandoPago ? (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-3 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex justify-between py-2 border-b border-[#f3f4f6]">
              <div className="h-4 w-32 bg-[#f3f4f6] rounded" />
              <div className="h-4 w-16 bg-[#f3f4f6] rounded" />
            </div>
          ))}
        </div>
      ) : resumenPago ? (
        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-5 space-y-4">
          <div className="space-y-0">
            <div className="flex justify-between items-center py-3 border-b border-[#f3f4f6]">
              <span className="text-sm text-[#6b7280]">Volumen generado</span>
              <span className="text-sm font-semibold text-[#111111]">€{resumenPago.volumenTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#f3f4f6]">
              <div>
                <span className="text-sm text-[#6b7280]">Comisión plataforma</span>
                <p className="text-[11px] text-[#9ca3af]">Según el % acordado con itrustb2b</p>
              </div>
              <span className="text-sm font-medium text-[#1e3a5f]">€{resumenPago.comisionPlataforma?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#f3f4f6]">
              <div>
                <span className="text-sm text-[#6b7280]">Comisiones a referidores</span>
                <p className="text-[11px] text-[#9ca3af]">Se reparte entre los referidores y agencias</p>
              </div>
              <span className="text-sm font-medium text-[#374151]">€{resumenPago.comisionRepartir?.toFixed(2)}</span>
            </div>
            {resumenPago.totalYaPagado > 0 && (
              <div className="flex justify-between items-center py-3 border-b border-[#f3f4f6]">
                <span className="text-sm text-green-600 flex items-center gap-1.5"><CheckCircle2 size={13} /> Ya liquidado</span>
                <span className="text-sm font-medium text-green-600">−€{resumenPago.totalYaPagado?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3">
              <span className="text-base font-bold text-[#111111]">Total pendiente</span>
              <span className="text-2xl font-bold text-[#1e3a5f]">€{resumenPago.pendiente?.toFixed(2)}</span>
            </div>
          </div>

          {resumenPago.pendiente > 0 ? (
            <button onClick={iniciarPago} disabled={pagando}
              className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-50">
              <CreditCard size={16} />
              {pagando ? 'Redirigiendo...' : `Pagar €${resumenPago.pendiente?.toFixed(2)} con tarjeta`}
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
              <CheckCircle2 size={16} /> Este mes ya está liquidado.
            </div>
          )}

          <button onClick={exportarLiquidacionesPDF}
            className="w-full flex items-center justify-center gap-2 border border-[#e5e7eb] hover:border-[#d1d5db] bg-white text-[#374151] font-medium py-2.5 rounded-xl text-sm transition-colors">
            <Download size={15} /> Descargar PDF
          </button>
        </div>
      ) : null}

      <div className="bg-[#f0f4f8] rounded-xl p-4 text-xs text-[#6b7280] space-y-1.5">
        <p className="font-medium text-[#374151]">¿Cómo se calcula?</p>
        <p>· La comisión se aplica sobre el gasto total de los clientes referidos este mes.</p>
        <p>· Una parte va a itrustb2b y el resto se reparte entre referidores y agencias.</p>
        <p>· El pago se procesa de forma segura con Stripe.</p>
      </div>
    </motion.div>
  )
}
