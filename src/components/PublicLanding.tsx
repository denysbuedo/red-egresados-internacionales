import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { EcosystemMosaic } from "./EcosystemMosaic";

const modules = [
  { id: "personas", symbol: "◎", title: "Personas", text: "Descubre perfiles profesionales, áreas de conocimiento y capacidades de nuestra comunidad.", href: "/directorio", action: "Descubrir personas" },
  { id: "ciencia", symbol: "◇", title: "Ciencia", text: "Comparte resultados y enlaces a publicaciones científicas. Abre nuevas conversaciones alrededor del conocimiento.", href: "/login?redirect=%2F%3Ftype%3Dpublication", action: "Ver aportes científicos" },
  { id: "proyectos", symbol: "▦", title: "Proyectos", text: "Presenta iniciativas, comparte avances y encuentra personas con intereses de colaboración.", href: "/login?redirect=%2F%3Ftype%3Dproject", action: "Explorar iniciativas" },
  { id: "codigo", symbol: "{ }", title: "Código", text: "La integración con repositorios de desarrollo forma parte de nuestra evolución. Esta función todavía no está disponible.", future: true },
  { id: "comunidades", symbol: "◉", title: "Comunidades", text: "Participa en grupos de interés académico, científico y tecnológico de las instituciones.", href: "/comunidades", action: "Explorar comunidades" },
  { id: "oportunidades", symbol: "↗", title: "Oportunidades", text: "Descubre convocatorias y comparte propuestas para trabajar y crear en colaboración.", href: "/login?redirect=%2F%3Ftype%3Dcall", action: "Ver convocatorias" },
];

export function PublicLanding() {
  return <div className="conecta-public">
    <header className="reduniv-header">
    <div className="reduniv-header-container conecta-public-header reduniv-header-row">
      <Link href="/" aria-label="CONECTA, inicio"><BrandLogo header priority /></Link>
      <nav aria-label="Navegación principal">
        <a href="#ecosistema">Ecosistema</a><a href="#comunidad">Comunidad</a><a href="#proyectos">Proyectos</a>
        <Link href="/login" className="conecta-header-login">Iniciar sesión <span aria-hidden="true">↗</span></Link>
      </nav>
    </div>
    </header>
    <main>
      <section className="conecta-hero" aria-labelledby="hero-title">
        <div className="conecta-hero-inner">
          <div className="conecta-hero-copy">
            <p className="conecta-eyebrow">CIENCIA · TECNOLOGÍA · COLABORACIÓN</p>
            <h1 id="hero-title">Donde la ciencia y la tecnología se encuentran.</h1>
            <p className="conecta-intro">El ecosistema digital que reúne talento, conocimiento e innovación de la educación superior cubana. Descubre profesionales, comparte resultados científicos y construye nuevas oportunidades de colaboración.</p>
            <div className="conecta-hero-actions"><a href="#ecosistema" className="conecta-cta">Explorar CONECTA <span aria-hidden="true">↗</span></a><Link href="/register" className="conecta-cta conecta-cta-outline">Solicitar acceso</Link></div>
            <p className="conecta-access-note"><span aria-hidden="true">◈</span> Acceso sujeto a validación institucional.</p>
          </div>
          <EcosystemMosaic />
        </div>
      </section>
      <section id="ecosistema" className="conecta-ecosystem" aria-labelledby="ecosystem-title">
        <div className="conecta-section-heading"><div><p className="conecta-eyebrow">EL ECOSISTEMA</p><h2 id="ecosystem-title">Un lugar para encontrar,<br className="hidden sm:block" /> colaborar y crear.</h2></div><p>El conocimiento crece cuando se comparte. Conectamos personas, resultados e iniciativas en un mismo espacio institucional.</p></div>
        <div className="conecta-module-grid">{modules.map((module) => <article key={module.id} id={module.id} className={`conecta-module-card ${module.future ? "conecta-module-future" : ""}`}>
          <div className="conecta-module-top"><span className="conecta-module-symbol" aria-hidden="true">{module.symbol}</span>{module.future && <span className="conecta-future-label">Próximamente</span>}</div>
          <h3>{module.title}</h3><p>{module.text}</p>
          {module.href && <Link href={module.href}>{module.action} <span aria-hidden="true">↗</span></Link>}
        </article>)}</div>
      </section>
      <section id="comunidad" className="conecta-community" aria-labelledby="community-title"><div className="conecta-community-inner">
        <div><p className="conecta-eyebrow">UNA COMUNIDAD, MUCHAS POSIBILIDADES</p><h2 id="community-title">Conecta conocimiento.<br /><span>Impulsa innovación.</span></h2></div>
        <div><p>Un espacio de encuentro para docentes, investigadores, especialistas, técnicos, directivos y demás trabajadores del MES y sus instituciones.</p><p className="conecta-community-note">En esta primera etapa el acceso está dirigido a trabajadores, con revisión de su vínculo laboral. La integración de estudiantes se contempla para una etapa posterior.</p><Link href="/register" className="conecta-cta">Solicitar acceso <span aria-hidden="true">↗</span></Link></div>
      </div></section>
    </main>
    <footer className="conecta-footer"><div className="conecta-footer-inner"><div><BrandLogo /><p>Ecosistema digital de la educación superior cubana.</p><p>Ministerio de Educación Superior de Cuba · RedUniv</p></div><nav aria-label="Información institucional"><Link href="/estatutos">Estatutos</Link><Link href="/terminos">Términos y condiciones</Link><Link href="/privacidad">Privacidad</Link><Link href="/ayuda">Ayuda</Link></nav></div><div className="conecta-footer-bottom"><span>© 2026 CONECTA · RedUniv</span><span>Conocimiento que conecta. Innovación que avanza.</span></div></footer>
  </div>;
}
