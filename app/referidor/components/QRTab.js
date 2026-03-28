'use client'
import { QrCode, Copy, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../../lib/i18n/LanguageContext'

export default function QRTab({ referidor, qrImageUrl, appUrl, handleCopiarUrl, copiadoMsj }) {
  const { t } = useLanguage()

  return (
    <div className="glass-panel p-7 flex flex-col items-center">
      <h2 className="text-sm font-semibold text-[#374151] mb-5 flex items-center gap-2 self-start">
        <QrCode size={15} className="text-[#1e3a5f]" /> {t('referidor', 'yourPersonalQR')}
      </h2>
      <div className="bg-white p-4 rounded-xl border border-[#e5e7eb] mb-5 shadow-sm">
        {qrImageUrl ? (
          <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 rounded" />
        ) : (
          <div className="w-48 h-48 bg-[#f3f4f6] animate-pulse rounded flex items-center justify-center">
            <QrCode size={32} className="text-[#d1d5db]" />
          </div>
        )}
      </div>
      <p className="text-[#6b7280] text-xs break-all font-mono bg-[#f3f4f6] px-3 py-2 rounded-lg mb-5 w-full text-center border border-[#e5e7eb]">
        {appUrl}/r/{referidor?.qr_token || '...'}
      </p>
      <button
        onClick={handleCopiarUrl}
        className="w-full flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#15294a] text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
      >
        {copiadoMsj ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        {copiadoMsj ? '¡Copiado!' : t('referidor', 'copyLink')}
      </button>
    </div>
  )
}
