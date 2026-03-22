import Link from 'next/link'
import { QrCode } from 'lucide-react'

export const metadata = {
  title: 'Aviso Legal — itrustb2b',
}

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="flex items-center justify-between px-6 py-4 md:px-12 border-b border-[#e5e7eb] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-[#1e3a5f]" />
          <span className="text-base font-semibold text-[#111111]">itrustb2b</span>
        </Link>
        <Link href="/" className="text-sm text-[#6b7280] hover:text-[#111111] transition-colors">← Volver</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-3xl font-bold text-[#111111] mb-2">Aviso Legal</h1>
        <p className="text-sm text-[#9ca3af] mb-10">En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)</p>

        <div className="space-y-8 text-[#374151] leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">1. Datos identificativos del titular</h2>
            <ul className="space-y-1 pl-4">
              <li><strong>Razón social:</strong> itrustb2b</li>
              <li><strong>NIF/CIF:</strong> [COMPLETAR]</li>
              <li><strong>Domicilio social:</strong> [COMPLETAR DIRECCIÓN COMPLETA]</li>
              <li><strong>Correo electrónico:</strong> hola@itrustb2b.com</li>
              <li><strong>Inscripción en el Registro Mercantil:</strong> [COMPLETAR]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">2. Objeto y ámbito de aplicación</h2>
            <p>El presente aviso legal regula el acceso y el uso de la plataforma web <strong>itrustb2b</strong> (en adelante, "la Plataforma"), cuya actividad consiste en la gestión digital de sistemas de referidos mediante códigos QR para establecimientos turísticos y de hostelería.</p>
            <p className="mt-2">El acceso y uso de la Plataforma implica la aceptación plena y sin reservas del presente aviso legal. Si no estás de acuerdo con alguno de los términos aquí expuestos, debes abstenerte de usar la Plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">3. Propiedad intelectual e industrial</h2>
            <p>Todos los contenidos de la Plataforma — incluyendo, sin limitación, textos, imágenes, logotipos, iconos, código fuente y diseño — son propiedad de itrustb2b o de sus licenciantes, y están protegidos por las leyes españolas e internacionales de propiedad intelectual e industrial.</p>
            <p className="mt-2">Queda expresamente prohibida cualquier reproducción, distribución, comunicación pública o transformación de dichos contenidos sin autorización escrita del titular.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">4. Exclusión de garantías y responsabilidad</h2>
            <p>itrustb2b no garantiza la disponibilidad ininterrumpida de la Plataforma ni la ausencia de errores. En ningún caso será responsable de los daños o pérdidas, directos o indirectos, que pudieran derivarse del uso o de la imposibilidad de uso de la Plataforma, salvo en los supuestos en que dicha responsabilidad no pueda excluirse conforme a la legislación aplicable.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">5. Ley aplicable y jurisdicción</h2>
            <p>El presente aviso legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso de la Plataforma, las partes se someten a la jurisdicción de los Juzgados y Tribunales del domicilio del usuario, salvo que la normativa aplicable establezca otro fuero.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#111111] mb-3">6. Modificaciones</h2>
            <p>itrustb2b se reserva el derecho de modificar en cualquier momento el contenido del presente aviso legal. Los cambios entrarán en vigor desde su publicación en la Plataforma.</p>
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
