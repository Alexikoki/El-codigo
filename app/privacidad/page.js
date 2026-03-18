import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad — El Código',
  description: 'Política de privacidad y protección de datos de El Código conforme al RGPD.',
}

const s = 'text-base font-semibold text-[#111111] mb-3'
const p = 'text-sm text-[#374151] leading-relaxed'
const li = 'text-sm text-[#374151]'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <nav className="bg-white border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-[#111111]">El Código</span>
        </Link>
        <Link href="/login" className="text-xs text-[#6b7280] hover:text-[#374151] transition-colors">← Volver</Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#111111] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-[#9ca3af] mb-10">Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8">

          <section>
            <h2 className={s}>1. Responsable del tratamiento</h2>
            <p className={p}>El Código es una plataforma de gestión de referidos y comisiones para el sector hostelero, operada en el ámbito de la Unión Europea. Para cualquier consulta sobre privacidad contacta en <strong>privacidad@elcodigo.app</strong>.</p>
          </section>

          <section>
            <h2 className={s}>2. Datos que recogemos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}><strong>Datos de cuenta:</strong> nombre y correo electrónico. Las contraseñas se almacenan cifradas con bcrypt — nunca en texto plano.</li>
              <li className={li}><strong>Datos de actividad:</strong> visitas de clientes, importes de consumo, comisiones y liquidaciones generadas.</li>
              <li className={li}><strong>Datos de pago:</strong> procesados por Stripe. No almacenamos números de tarjeta ni datos bancarios completos.</li>
              <li className={li}><strong>Datos técnicos:</strong> dirección IP (para protección antifraude y rate limiting), tipo de dispositivo y registros de acceso.</li>
              <li className={li}><strong>Cookies:</strong> cookie de sesión httpOnly (esencial) y, con tu consentimiento, cookies analíticas.</li>
            </ul>
            <p className="text-sm text-[#6b7280] mt-3">No recogemos datos de menores de 16 años. Si eres menor, no uses esta plataforma.</p>
          </section>

          <section>
            <h2 className={s}>3. Base legal del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}><strong>Ejecución de contrato (art. 6.1.b RGPD):</strong> para prestarte el servicio.</li>
              <li className={li}><strong>Interés legítimo (art. 6.1.f RGPD):</strong> seguridad, prevención del fraude y mejora del servicio.</li>
              <li className={li}><strong>Consentimiento (art. 6.1.a RGPD):</strong> para cookies analíticas no esenciales.</li>
              <li className={li}><strong>Obligación legal (art. 6.1.c RGPD):</strong> conservación de registros contables (7 años).</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>4. Cómo usamos tus datos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}>Gestionar tu acceso y cuenta en la plataforma.</li>
              <li className={li}>Calcular y distribuir comisiones entre locales, referidores y agencias.</li>
              <li className={li}>Procesar pagos a través de Stripe Connect.</li>
              <li className={li}>Enviarte notificaciones de actividad (liquidaciones, pagos).</li>
              <li className={li}>Detectar y prevenir fraude o usos indebidos.</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>5. Proveedores (encargados del tratamiento)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}><strong>Supabase:</strong> base de datos (servidores en la UE).</li>
              <li className={li}><strong>Stripe:</strong> procesamiento de pagos. Ver política en stripe.com/privacy.</li>
              <li className={li}><strong>Cloudflare:</strong> protección antibots (Turnstile) y CDN.</li>
              <li className={li}><strong>Vercel:</strong> infraestructura de hosting (UE/EEA).</li>
              <li className={li}><strong>Resend:</strong> envío de emails transaccionales.</li>
            </ul>
            <p className="text-sm text-[#6b7280] mt-3">No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className={s}>6. Retención de datos</h2>
            <p className={p}>Conservamos tus datos mientras tu cuenta esté activa. Tras la cancelación, los datos se eliminan en máximo 90 días, salvo obligación legal de conservación (registros contables: 7 años).</p>
          </section>

          <section>
            <h2 className={s}>7. Tus derechos (RGPD)</h2>
            <p className={`${p} mb-3`}>Tienes derecho a acceso, rectificación, supresión, portabilidad, oposición y limitación del tratamiento. Escríbenos a <strong>privacidad@elcodigo.app</strong> — respondemos en máximo 30 días. También puedes reclamar ante la autoridad de protección de datos de tu país.</p>
          </section>

          <section>
            <h2 className={s}>8. Cookies</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#e5e7eb] rounded-lg overflow-hidden">
                <thead className="bg-[#f3f4f6]">
                  <tr>
                    {['Cookie','Tipo','Finalidad','Duración'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-[#374151]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  <tr><td className="px-3 py-2 font-mono">auth_token</td><td className="px-3 py-2">Esencial</td><td className="px-3 py-2">Sesión autenticada</td><td className="px-3 py-2">8 horas</td></tr>
                  <tr><td className="px-3 py-2 font-mono">cookie_consent</td><td className="px-3 py-2">Esencial</td><td className="px-3 py-2">Preferencia de cookies</td><td className="px-3 py-2">1 año</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-[#6b7280] mt-3">No usamos cookies de seguimiento publicitario de terceros.</p>
          </section>

          <section>
            <h2 className={s}>9. Seguridad</h2>
            <p className={p}>Implementamos cifrado HTTPS/TLS, cookies httpOnly, contraseñas con bcrypt, control de acceso por roles, Row Level Security en base de datos y auditorías de seguridad periódicas.</p>
          </section>

          <section>
            <h2 className={s}>10. Cambios en esta política</h2>
            <p className={p}>Notificaremos cambios relevantes por email o mediante aviso en la plataforma.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#e5e7eb] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <p className="text-xs text-[#9ca3af]">© {new Date().getFullYear()} El Código. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-xs">
            <Link href="/terminos" className="text-[#1e3a5f] hover:underline">Términos de Uso</Link>
            <Link href="/login" className="text-[#6b7280] hover:text-[#374151]">Volver al login</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
