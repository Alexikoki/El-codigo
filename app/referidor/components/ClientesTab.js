'use client'
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function ClientesTab({ clientes }) {
  const { t } = useLanguage()
  return (
    <div className="glass-panel p-5">
      <h2 className="text-sm font-semibold text-[#374151] mb-5 flex items-center gap-2">
        <Calendar size={15} /> {t('referidor', 'clientHistory')}
      </h2>
      {clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#9ca3af]">
          <Clock size={36} className="mb-3 opacity-40" />
          <p className="text-sm">{t('referidor', 'noClientsYet')}</p>
          <p className="text-xs mt-1">{t('referidor', 'shareToStart')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <div key={c.id} className="p-4 border border-[#e5e7eb] rounded-xl hover:bg-[#f9fafb] transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium text-[#111111] text-sm">{c.nombre}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">
                    <span className="text-[#1e3a5f]">{c.lugares?.nombre}</span> · {c.num_personas} {c.num_personas > 1 ? 'personas' : 'persona'}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 flex-shrink-0 ${
                  c.verificado ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-orange-50 text-orange-600 border border-orange-200'
                }`}>
                  {c.verificado ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                  {c.verificado ? t('referidor', 'visited') : t('referidor', 'pendingStatus')}
                </span>
              </div>
              {c.gasto !== null && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-[#f3f4f6]">
                  <div>
                    <p className="text-[10px] text-[#9ca3af]">{t('referidor', 'registeredSpend')}</p>
                    <p className="text-sm font-bold text-[#111111]">{c.gasto.toFixed(2)}&euro;</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9ca3af]">{t('referidor', 'yourCommission')}</p>
                    <p className="text-sm font-bold text-[#4a9070]">+{c.comision?.toFixed(2) || '0.00'}&euro;</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
