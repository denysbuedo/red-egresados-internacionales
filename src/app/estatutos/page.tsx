
import { PageHeader } from "@/components/PageHeader";
export default function EstatutosPage() {
  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          <PageHeader title="Estatutos de la Red" description="Los principios que orientan nuestra comunidad profesional." eyebrow="CONECTA · MARCO INSTITUCIONAL" compact />
          <p className="text-sm text-gray-500 mb-8">CONECTA</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Capítulo I: Disposiciones Generales</h2>
              <p><strong>Artículo 1.</strong> La CONECTA es una plataforma digital creada para conectar a docentes, investigadores, especialistas, técnicos, directivos y demás trabajadores del Ministerio de Educación Superior y sus instituciones.</p>
              <p className="mt-2"><strong>Artículo 2.</strong> La Red tiene como fines principales:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Fomentar la colaboración académica y científica entre miembros</li>
                <li>Facilitar el intercambio de conocimientos y experiencias</li>
                <li>Fortalecer los lazos entre las personas y las instituciones de la educación superior</li>
                <li>Promover proyectos de investigación conjuntos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Capítulo II: De los Miembros</h2>
              <p><strong>Artículo 3.</strong> Pueden ser miembros de la Red los trabajadores del MES y de sus instituciones que cumplan con el proceso de registro y sean aprobados por su institución de vinculación o la administración de la red.</p>
              <p className="mt-2"><strong>Artículo 4.</strong> Los miembros tienen los siguientes derechos:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Crear y mantener un perfil profesional</li>
                <li>Conectar con otros miembros</li>
                <li>Participar en grupos temáticos y eventos</li>
                <li>Publicar contenido académico y científico</li>
                <li>Acceder al directorio de miembros</li>
              </ul>
              <p className="mt-2"><strong>Artículo 5.</strong> Los miembros tienen las siguientes obligaciones:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Proporcionar información veraz en su perfil</li>
                <li>Respetar los Términos y Condiciones de la plataforma</li>
                <li>Mantener una conducta profesional y respetuosa</li>
                <li>No utilizar la plataforma con fines comerciales no autorizados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Capítulo III: De la Administración</h2>
              <p><strong>Artículo 6.</strong> La Red es administrada por el Ministerio de Educación Superior de la República de Cuba, a través de un equipo designado.</p>
              <p className="mt-2"><strong>Artículo 7.</strong> Las funciones de la administración incluyen:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Gestionar las aprobaciones de nuevos registros</li>
                <li>Publicar noticias, convocatorias y eventos oficiales</li>
                <li>Velar por el cumplimiento de los estatutos</li>
                <li>Moderar el contenido de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Capítulo IV: Del Contenido</h2>
              <p><strong>Artículo 8.</strong> Todo contenido publicado en la plataforma debe tener carácter profesional, académico o científico. No se permite la publicación de contenido político, religioso o comercial sin autorización previa.</p>
              <p className="mt-2"><strong>Artículo 9.</strong> Los usuarios conservan los derechos sobre su contenido, pero autorizan su visualización dentro de la Red.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Capítulo V: Disposiciones Finales</h2>
              <p><strong>Artículo 10.</strong> Los presentes estatutos entrarán en vigor a partir de su publicación y podrán ser modificados por la administración de la Red con previo aviso a sus miembros.</p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-[#102B46] hover:underline">← Volver al inicio</a>
        </div>
      </div>
    </main>
  );
}
