import Link from 'next/link'
import { QrCode } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad — El Código',
}

export default function PrivacidadPage() {
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
        <h1 className="text-3xl font-bold text-[#111111] mb-2">Política de Privacidad</h1>
        <p className="text-sm text-[#9ca3af] mb-10">Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#374151] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">1. Responsable del tratamiento</h2>
            <p>El responsable del tratamiento de los datos personales recabados a través de esta plataforma es:</p>
            <ul className="mt-2 space-y-1 pl-4 text-sm">
              <li><strong>Razón social:</strong> El Código S.L.</li>
              <li><strong>NIF/CIF:</strong> [COMPLETAR]</li>
              <li><strong>Domicilio:</strong> [COMPLETAR DIRECCIÓN]</li>
              <li><strong>Correo de contacto:</strong> privacidad@[COMPLETAR DOMINIO]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">2. Datos que recogemos</h2>
            <p>Recabamos únicamente los datos mínimos necesarios para la prestación del servicio:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-sm">
              <li><strong>Nombre</strong> y <strong>dirección de correo electrónico</strong>: facilitados voluntariamente al registrarse en la plataforma a través del enlace de un promotor.</li>
              <li><strong>Número de personas</strong>: indicado en el formulario de registro para gestionar el descuento aplicable.</li>
              <li><strong>Dirección IP</strong>: registrada de forma temporal con fines de seguridad y prevención de fraude (protección anti-bots mediante Cloudflare Turnstile).</li>
            </ul>
            <p className="mt-3">No recabamos datos especialmente protegidos ni datos de menores de 14 años. Si eres menor de esa edad, no debes registrarte en la plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">3. Finalidad y base legal</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse mt-2">
                <thead>
                  <tr className="bg-[#f3f4f6]">
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Finalidad</th>
                    <th className="text-left px-3 py-2 border border-[#e5e7eb] font-semibold text-[#111111]">Base legal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Gestionar el registro y enviar el código de confirmación</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Ejecución de un contrato (Art. 6.1.b RGPD)</td>
                  </tr>
                  <tr className="bg-[#f9fafb]">
                    <td className="px-3 py-2 border border-[#e5e7eb]">Enviar el QR personal con el descuento</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Ejecución de un contrato (Art. 6.1.b RGPD)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Prevención de fraude y seguridad del sistema</td>
                    <td className="px-3 py-2 border border-[#e5e7eb]">Interés legítimo (Art. 6.1.f RGPD)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm">No cedemos tus datos a terceros con fines comerciales ni los usamos para elaborar perfiles publicitarios.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">4. Conservación de los datos</h2>
            <p>Conservamos tus datos durante el tiempo estrictamente necesario para cumplir con la finalidad para la que fueron recogidos y, posteriormente, durante los plazos legales de prescripción aplicables (generalmente 3 años para reclamaciones civiles). Una vez transcurridos dichos plazos, los datos serán suprimidos de forma segura.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">5. Proveedores de servicios (encargados del tratamiento)</h2>
            <p>Para la prestación del servicio contamos con los siguientes terceros que actúan como encargados del tratamiento bajo contrato:</p>
            <ul className="mt-2 space-y-1 pl-4 list-disc text-sm">
              <li><strong>Supabase Inc.</strong> — base de datos en la nube (servidores en la UE)</li>
              <li><strong>Vercel Inc.</strong> — alojamiento y despliegue de la aplicación</li>
              <li><strong>Resend Inc.</strong> — envío de correos electrónicos transaccionales</li>
              <li><strong>Cloudflare Inc.</strong> — protección anti-bots (Turnstile)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">6. Tus derechos</h2>
            <p>En cualquier momento puedes ejercer tus derechos de <strong>acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad</strong> enviando un correo a privacidad@[COMPLETAR DOMINIO] con el asunto <em>"Ejercicio de derechos RGPD"</em> y una copia de tu documento de identidad.</p>
            <p className="mt-2">También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" className="text-[#1e3a5f] underline">www.aepd.es</a>).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">7. Seguridad</h2>
            <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos frente a accesos no autorizados, pérdida o destrucción, incluyendo cifrado en tránsito (HTTPS), autenticación mediante tokens JWT almacenados exclusivamente en cookies httpOnly, y validación de todas las entradas del usuario.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">8. Cambios en esta política</h2>
            <p>Podemos actualizar esta política en cualquier momento. Los cambios serán notificados mediante la actualización de la fecha en la cabecera de este documento. El uso continuado de la plataforma tras la publicación de cambios implica su aceptación.</p>
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
