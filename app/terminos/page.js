import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Términos de Uso — El Código',
  description: 'Términos y condiciones de uso de la plataforma El Código.',
}

const s = 'text-base font-semibold text-[#111111] mb-3'
const p = 'text-sm text-[#374151] leading-relaxed'
const li = 'text-sm text-[#374151]'

export default function TerminosPage() {
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
        <h1 className="text-2xl font-bold text-[#111111] mb-2">Términos de Uso</h1>
        <p className="text-sm text-[#9ca3af] mb-10">Última actualización: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        <div className="space-y-8">

          <section>
            <h2 className={s}>1. Objeto y aceptación</h2>
            <p className={p}>Los presentes Términos de Uso regulan el acceso y la utilización de la plataforma El Código ("la Plataforma"), un servicio de gestión de referidos, comisiones y validación de clientes para el sector hostelero. El uso de la Plataforma implica la aceptación plena de estos términos. Si no estás de acuerdo, no debes usar el servicio.</p>
          </section>

          <section>
            <h2 className={s}>2. Descripción del servicio</h2>
            <p className={`${p} mb-3`}>El Código es una plataforma B2B2C que conecta:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}><strong>Locales hosteleros (Managers):</strong> restaurantes, bares, clubs, hoteles y experiencias que ofrecen descuentos a turistas referidos.</li>
              <li className={li}><strong>Referidores y Agencias:</strong> personas o empresas que refieren clientes a los locales y reciben una comisión por ello.</li>
              <li className={li}><strong>Staff:</strong> empleados de los locales que validan la llegada de los clientes mediante QR.</li>
              <li className={li}><strong>Clientes/Turistas:</strong> personas que acceden a los descuentos mediante el enlace o QR de un referidor.</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>3. Registro y acceso</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}>El acceso a la Plataforma está restringido a usuarios registrados con credenciales válidas.</li>
              <li className={li}>Eres responsable de mantener la confidencialidad de tu contraseña. Notifica cualquier acceso no autorizado a <strong>privacidad@itrustb2b.com</strong>.</li>
              <li className={li}>Está prohibido compartir credenciales de acceso entre distintos usuarios.</li>
              <li className={li}>La Plataforma se reserva el derecho de suspender cuentas que incumplan estos términos.</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>4. Comisiones y pagos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}>El porcentaje de comisión aplicable a cada local se acuerda individualmente en el contrato de alta.</li>
              <li className={li}>La Plataforma retiene un <strong>5% sobre el total de comisión generada</strong> como tarifa de servicio.</li>
              <li className={li}>El resto de la comisión se distribuye entre los referidores y agencias implicados según los porcentajes acordados.</li>
              <li className={li}>Los pagos se procesan a través de <strong>Stripe</strong>. El Código no almacena datos de tarjeta.</li>
              <li className={li}>Los managers deben liquidar las comisiones dentro del período acordado. El impago puede resultar en la suspensión del servicio.</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>5. Uso aceptable</h2>
            <p className={`${p} mb-3`}>Queda expresamente prohibido:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className={li}>Falsificar datos de clientes, visitas o consumos.</li>
              <li className={li}>Intentar acceder a cuentas ajenas o manipular el sistema de comisiones.</li>
              <li className={li}>Usar la Plataforma para actividades ilegales o contrarias a la normativa aplicable.</li>
              <li className={li}>Realizar ingeniería inversa, scraping automatizado o ataques al sistema.</li>
              <li className={li}>Crear múltiples cuentas para eludir restricciones o acumular beneficios de forma fraudulenta.</li>
            </ul>
          </section>

          <section>
            <h2 className={s}>6. Propiedad intelectual</h2>
            <p className={p}>Todo el contenido de la Plataforma (código, diseño, marca, textos) es propiedad exclusiva de El Código y está protegido por la legislación de propiedad intelectual aplicable. Queda prohibida su reproducción, distribución o modificación sin autorización expresa.</p>
          </section>

          <section>
            <h2 className={s}>7. Disponibilidad del servicio</h2>
            <p className={p}>El Código se esfuerza por mantener la Plataforma disponible de forma continua, pero no garantiza una disponibilidad del 100%. Podemos realizar mantenimientos programados notificándolo con antelación razonable. No somos responsables de interrupciones causadas por terceros (Supabase, Vercel, Stripe, Cloudflare).</p>
          </section>

          <section>
            <h2 className={s}>8. Limitación de responsabilidad</h2>
            <p className={p}>El Código no será responsable de pérdidas indirectas, lucro cesante o daños derivados del uso o la imposibilidad de uso de la Plataforma, incluyendo pérdidas de datos o ingresos. La responsabilidad máxima frente a cualquier usuario se limita a los importes abonados en los 3 meses anteriores al incidente.</p>
          </section>

          <section>
            <h2 className={s}>9. Cancelación y baja</h2>
            <p className={p}>Puedes solicitar la baja de tu cuenta en cualquier momento contactando con nosotros. Las liquidaciones pendientes deberán resolverse antes de procesar la baja. La Plataforma puede cancelar cuentas que incumplan estos términos sin previo aviso en casos graves.</p>
          </section>

          <section>
            <h2 className={s}>10. Ley aplicable y jurisdicción</h2>
            <p className={p}>Estos Términos se rigen por la legislación de la Unión Europea y, supletoriamente, por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales competentes según la normativa aplicable. Los consumidores de la UE pueden recurrir a la plataforma de resolución de litigios en línea de la Comisión Europea.</p>
          </section>

          <section>
            <h2 className={s}>11. Modificaciones</h2>
            <p className={p}>Podemos modificar estos Términos en cualquier momento. Notificaremos los cambios relevantes por email o mediante aviso en la Plataforma con al menos 15 días de antelación. El uso continuado tras la notificación implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className={s}>12. Contacto</h2>
            <p className={p}>Para cualquier duda o consulta sobre estos Términos de Uso contacta en <strong>hola@itrustb2b.com</strong>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-[#e5e7eb] flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <p className="text-xs text-[#9ca3af]">© {new Date().getFullYear()} El Código. Todos los derechos reservados.</p>
          <div className="flex gap-4 text-xs">
            <Link href="/privacidad" className="text-[#1e3a5f] hover:underline">Política de Privacidad</Link>
            <Link href="/login" className="text-[#6b7280] hover:text-[#374151]">Volver al login</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
