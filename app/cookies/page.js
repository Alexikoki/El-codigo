import Link from 'next/link'
import { QrCode } from 'lucide-react'

export const metadata = {
  title: 'Política de Cookies — El Código',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-[#e5e7eb] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#1e3a5f]" />
          <span className="text-base font-semibold text-[#111111]">El Código</span>
        </Link>
        <Link href="/" className="text-sm text-[#6b7280] hover:text-[#111111] transition-colors">← Volver</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#111111] mb-2">Política de Cookies</h1>
        <p className="text-sm text-[#9ca3af] mb-10">En cumplimiento del artículo 22.2 de la LSSI-CE y la Guía sobre el uso de las cookies de la AEPD</p>

        <div className="space-y-8 text-[#374151] leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">1. ¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños ficheros de texto que un sitio web deposita en el dispositivo del usuario cuando este lo visita. Permiten que el sitio recuerde determinada información sobre la visita para facilitar el uso del servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">2. Cookies que utilizamos</h2>
            <p>Esta plataforma utiliza <strong>exclusivamente una cookie técnica estrictamente necesaria</strong>:</p>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Nombre</th>
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Tipo</th>
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Finalidad</th>
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-[#e5e7eb] font-mono text-xs">auth_token</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Técnica / Sesión</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Mantener la sesión autenticada del operador (promotor, staff, manager, etc.). Cookie httpOnly: no accesible desde JavaScript.</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">8 horas</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-[#f0f4f8] rounded-xl border border-[#dce7f3]">
              <p className="text-[#1e3a5f] font-medium mb-1">Sin cookies de seguimiento ni publicidad</p>
              <p className="text-[#374151]">No utilizamos cookies analíticas, publicitarias ni de rastreo de ningún tipo. No compartimos datos de navegación con terceros para fines de marketing.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">3. Cookies de terceros</h2>
            <p>Durante el proceso de registro de clientes se utiliza el servicio de protección anti-bots <strong>Cloudflare Turnstile</strong>. Este servicio puede establecer sus propias cookies técnicas estrictamente necesarias para su funcionamiento. Consulta la <a href="https://www.cloudflare.com/privacypolicy/" className="text-[#1e3a5f] underline" target="_blank" rel="noopener noreferrer">política de privacidad de Cloudflare</a> para más información.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">4. ¿Necesito aceptar las cookies?</h2>
            <p>La única cookie que utilizamos (<code className="bg-[#f3f4f6] px-1 py-0.5 rounded text-xs font-mono">auth_token</code>) es técnicamente necesaria para el funcionamiento de la plataforma. De acuerdo con la normativa vigente, las cookies estrictamente técnicas <strong>no requieren consentimiento previo</strong> del usuario.</p>
            <p className="mt-2">Los visitantes del área pública (landing page) no reciben ninguna cookie mientras no inicien sesión.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">5. Cómo eliminar las cookies</h2>
            <p>Puedes eliminar o bloquear las cookies desde la configuración de tu navegador. Ten en cuenta que bloquear la cookie de sesión impedirá el acceso a los paneles de operadores de la plataforma. Aquí tienes los enlaces a las instrucciones de los navegadores más comunes:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc">
              <li><a href="https://support.google.com/chrome/answer/95647" className="text-[#1e3a5f] underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/Borrar%20cookies" className="text-[#1e3a5f] underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" className="text-[#1e3a5f] underline" target="_blank" rel="noopener noreferrer">Safari</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">6. Actualizaciones</h2>
            <p>Podemos actualizar esta política cuando cambie el uso de cookies en la plataforma. Publicaremos la versión actualizada en esta misma página.</p>
          </section>

        </div>
      </main>

      <footer className="border-t border-[#e5e7eb] bg-white py-6 px-6 text-center text-sm text-[#9ca3af]">
        <div className="flex justify-center gap-5">
          <Link href="/aviso-legal" className="hover:text-[#111111] transition-colors">Aviso Legal</Link>
          <Link href="/privacidad" className="hover:text-[#111111] transition-colors">Privacidad</Link>
          <Link href="/cookies" className="hover:text-[#111111] transition-colors">Cookies</Link>
        </div>
      </footer>
    </div>
  )
}
