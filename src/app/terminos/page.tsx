export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>
          <p className="text-sm text-gray-500 mb-8">Última actualización: Octubre 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los Términos</h2>
              <p>Al registrarse y utilizar la Red del Ministerio de Educación Superior, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del Servicio</h2>
              <p>La plataforma es una red institucional de colaboración para la comunidad del Ministerio de Educación Superior. Permite crear perfiles profesionales, conectar con otros miembros, participar en grupos temáticos, asistir a eventos y compartir contenido académico y científico.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Registro y Aprobación</h2>
              <p>En esta primera etapa, el registro está dirigido a trabajadores del MES y de sus instituciones; no está habilitado el registro como estudiante. El acceso está sujeto a la declaración y verificación del vínculo laboral, y a aprobación por parte de la institución correspondiente o de la administración de la red. Los usuarios deben proporcionar información veraz y completa. La cuenta permanecerá en estado &quot;pendiente&quot; hasta ser aprobada por una institución autorizada.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Uso Aceptable</h2>
              <p>Los usuarios se comprometen a:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Utilizar la plataforma con fines profesionales, académicos y científicos</li>
                <li>No publicar contenido ofensivo, discriminatorio o ilegal</li>
                <li>Respetar la privacidad de otros usuarios</li>
                <li>No compartir información falsa o engañosa</li>
                <li>No utilizar la plataforma para spam o publicidad no autorizada</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Privacidad y Datos</h2>
              <p>La plataforma recopila y almacena datos de los usuarios con el fin de facilitar la conexión entre miembros. La información del perfil es visible para otros usuarios aprobados de la red. Los datos no serán compartidos con terceros sin consentimiento del usuario.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Propiedad del Contenido</h2>
              <p>Los usuarios conservan los derechos sobre el contenido que publican. Al publicar en la plataforma, otorgan una licencia no exclusiva para que dicho contenido sea visible dentro de la red.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Suspensión y Cancelación</h2>
              <p>La administración se reserva el derecho de suspender o cancelar cuentas que violen estos términos, publiquen contenido inapropiado o realicen un uso indebido de la plataforma.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitación de Responsabilidad</h2>
              <p>La plataforma no se hace responsable por el contenido publicado por los usuarios, ni por las interacciones entre los mismos. El uso del servicio es bajo la responsabilidad exclusiva del usuario.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
              <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor desde su publicación en la plataforma.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contacto</h2>
              <p>Para consultas sobre estos términos, puede contactar a la administración de la plataforma a través de los canales oficiales del Ministerio de Educación Superior.</p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-[#003f8f] hover:underline">← Volver al inicio</a>
        </div>
      </div>
    </main>
  );
}
