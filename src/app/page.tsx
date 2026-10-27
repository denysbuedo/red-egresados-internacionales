import { ProfileAvatar } from "@/components/ProfileAvatar";
import { EcosystemMosaic } from "@/components/EcosystemMosaic";
import { POST_TYPES } from "@/lib/site";
import Link from "next/link";
import { db } from "@/db";
import { graduates, adminPosts, userPosts, events } from "@/db/schema";
import { sql, desc, eq, asc, gte } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { CreatePost } from "@/components/CreatePost";
import { UserPostCard } from "@/components/UserPostCard";
import { PublicLanding } from "@/components/PublicLanding";
import { checkAndSendEventNotifications } from "@/lib/event-notifications";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const selectedType = POST_TYPES.find((type) => type.value === params.type)?.value;
  const session = await getSession({ allowPending: true });
  
  // Redirigir usuarios pendientes a la página de espera
  if (session?.status === "pending") {
    redirect("/pendiente");
  }
  
  if (!session) return <PublicLanding />;
  const isLoggedIn = !!session;
  if (session?.status === "approved") await checkAndSendEventNotifications();

  const approvedProfiles = sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved')`;

  // Get posts for logged-in users
  let adminPostsData: any[] = [];
  let userPostsData: any[] = [];
  let userGraduateId: number | null = null;

  if (isLoggedIn) {
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);
    userGraduateId = userGraduate[0]?.graduateId || null;

    adminPostsData = await db
      .select({
        id: adminPosts.id,
        title: adminPosts.title,
        content: adminPosts.content,
        imageUrl: adminPosts.imageUrl,
        authorName: adminPosts.authorName,
        createdAt: adminPosts.createdAt,
        pinnedUntil: adminPosts.pinnedUntil,
      })
      .from(adminPosts)
      .orderBy(desc(adminPosts.createdAt))
      .limit(10);

    userPostsData = await db
      .select({
        id: userPosts.id,
        content: userPosts.content,
        imageUrl: userPosts.imageUrl,
        postType: userPosts.postType,
        referenceUrl: userPosts.referenceUrl,
        likes: userPosts.likes,
        commentsCount: userPosts.commentsCount,
        createdAt: userPosts.createdAt,
        graduateId: graduates.id,
        graduateName: graduates.name,
        graduatePhoto: graduates.photoUrl,
        graduateProfession: graduates.currentProfession,
        graduateCountry: graduates.country,
      })
      .from(userPosts)
      .leftJoin(graduates, eq(userPosts.graduateId, graduates.id))
      .where(sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved') ${selectedType ? sql`AND ${userPosts.postType} = ${selectedType}` : sql``}`)
      .orderBy(desc(userPosts.createdAt))
      .limit(20);
  }

  // eslint-disable-next-line react-hooks/purity
  const nowSec = Math.floor(Date.now() / 1000);

  const profile = db.select({ id: graduates.id, name: graduates.name, photo: graduates.photoUrl, profession: graduates.currentProfession, institution: graduates.university, employmentConfirmed: graduates.employmentConfirmed }).from(graduates).where(eq(graduates.userId, session.id)).get();
  const people = db.select({ id: graduates.id, name: graduates.name, profession: graduates.currentProfession, institution: graduates.university }).from(graduates).where(sql`${approvedProfiles} AND ${graduates.userId} != ${session.id}`).orderBy(desc(graduates.createdAt)).limit(3).all();
  const agenda = db.select({ id: events.id, title: events.title, date: events.date, type: events.type }).from(events).where(gte(events.date, new Date(nowSec * 1000))).orderBy(asc(events.date)).limit(3).all();

  // ============================================
  // HOME PARA USUARIOS LOGUEADOS
  // ============================================
  if (isLoggedIn) {
    const pinned = adminPostsData.filter((p) => {
      if (!p.pinnedUntil) return false;
      return p.pinnedUntil >= nowSec;
    });

    const news = [...pinned, ...adminPostsData.filter((post) => !pinned.includes(post))].slice(0, 3);
    const spaces = [
      { symbol: "◎", name: "Directorio", description: "Encuentra talento y afinidades", href: "/directorio", type: undefined },
      { symbol: "◇", name: "Ciencia", description: "Resultados que abren conversaciones", href: "/?type=publication", type: "publication" },
      { symbol: "▦", name: "Proyectos", description: "Ideas para construir en conjunto", href: "/?type=project", type: "project" },
      { symbol: "↗", name: "Oportunidades", description: "Convocatorias y colaboración", href: "/?type=call", type: "call" },
    ];
    return <main className="conecta-workspace">
      <div className="workspace-wrap">
        <header className="workspace-welcome">
          <div className="workspace-welcome-copy">
            <p className="conecta-eyebrow">TU ESPACIO EN CONECTA</p>
            <div className="workspace-personal-identity"><Link href={userGraduateId ? `/miembros/${userGraduateId}` : "/miembros/registro"} aria-label="Mi perfil"><ProfileAvatar name={profile?.name || session.username} src={profile?.photo || null} /></Link><div><h1>Hola, {profile?.name.split(" ")[0] || session.username}.</h1><p className="workspace-identity-role">{profile?.profession || "Tu espacio profesional"}</p>{profile?.institution && <p className="workspace-identity-institution">{profile.institution}</p>}<Link href={userGraduateId ? `/miembros/${userGraduateId}` : "/miembros/registro"} className="workspace-identity-link">Mi perfil ↗</Link></div></div>
            <h2 className="workspace-welcome-tagline">El conocimiento nos conecta.</h2>
            <p>Una conversación puede ser el inicio de tu próxima colaboración. Comparte lo que haces y descubre lo que nos une.</p>
            <div className="workspace-welcome-actions"><a href="#compartir" className="conecta-cta">Compartir un aporte <span aria-hidden="true">↗</span></a><Link href="/directorio" className="workspace-quiet-link">Explorar la comunidad <span aria-hidden="true">→</span></Link>{session.role==="admin" && <Link href="/admin" className="workspace-quiet-link">Administración ↗</Link>}{session.role==="institution" && <Link href="/institucion" className="workspace-quiet-link">Mi institución ↗</Link>}{session.role==="editor" && <Link href="/admin/posts" className="workspace-quiet-link">Gestionar noticias ↗</Link>}</div>
          </div>
          <EcosystemMosaic />
        </header>
        <nav className="workspace-spaces" aria-label="Explora el ecosistema">{spaces.map((space) => <Link key={space.name} href={space.href} className={selectedType && selectedType === space.type ? "workspace-space workspace-space-active" : "workspace-space"}><span className="workspace-space-symbol" aria-hidden="true">{space.symbol}</span><span><strong>{space.name}</strong><small>{space.description}</small></span><span className="workspace-space-arrow" aria-hidden="true">↗</span></Link>)}</nav>
        <div className="workspace-grid">
          <div className="workspace-center">
            {profile && !profile.employmentConfirmed && <section className="workspace-affiliation"><p>Completa tu vínculo institucional para que tu perfil refleje tu actividad en la red.</p><Link href="/completar-perfil">Actualizar mi vínculo →</Link></section>}
            {profile && (!profile.profession || !profile.institution) && <section className="workspace-affiliation"><p>Tu acceso está aprobado. Añade tu cargo, formación y presentación para que puedan encontrarte.</p><Link href={`/miembros/${profile.id}/editar`}>Completar mi perfil →</Link></section>}
            <section id="compartir" className="workspace-composer" aria-label="Compartir conocimiento">{userGraduateId ? <details><summary><span className="workspace-composer-icon" aria-hidden="true">＋</span><span><strong>¿En qué estás trabajando?</strong><small>Comparte un resultado, una idea o una pregunta.</small></span><span className="workspace-compose-action">Crear aporte <span aria-hidden="true">↗</span></span></summary><CreatePost /></details> : <div className="workspace-create-profile"><h2>Tu experiencia suma a la red</h2><p>Crea tu perfil profesional para compartir resultados y participar en las conversaciones.</p><Link href="/miembros/registro" className="workspace-inline-link">Crear mi perfil →</Link></div>}</section>
            <section id="actividad" className="workspace-activity"><div className="workspace-section-heading"><div><p className="workspace-kicker">CONOCIMIENTO EN MOVIMIENTO</p><h2>Actividad profesional y académica</h2></div><span className="workspace-live-dot">Reciente</span></div><nav className="workspace-filters" aria-label="Tipos de aportes"><Link href="/#actividad" aria-current={!selectedType ? "page" : undefined}>Todos</Link>{POST_TYPES.map((type) => <Link key={type.value} href={`/?type=${type.value}#actividad`} aria-current={selectedType === type.value ? "page" : undefined}>{type.label}</Link>)}</nav>
              {userPostsData.length ? <div className="workspace-posts">{userPostsData.map((post) => <UserPostCard key={post.id} {...post} />)}</div> : <div className="workspace-empty"><span aria-hidden="true">◇</span><h3>La próxima conversación puede empezar contigo.</h3><p>{selectedType ? "Todavía no hay aportes de este tipo. Comparte un resultado o explora el resto de la actividad." : "Comparte un resultado, plantea una consulta o presenta una iniciativa. Tu experiencia puede conectar con la de alguien más."}</p><a href="#compartir" className="workspace-inline-link">Compartir conocimiento →</a>{selectedType && <Link href="/#actividad">Ver todos los aportes</Link>}</div>}
            </section>
          </div>
          <aside className="workspace-right" aria-label="Descubre la comunidad">
            <section className="workspace-panel workspace-discover"><div className="workspace-panel-heading"><span className="workspace-kicker">AMPLÍA TU RED</span><h2>Personas de la comunidad</h2></div>{people.length ? people.map((person) => <Link href={`/miembros/${person.id}`} className="workspace-person" key={person.id}><span className="workspace-person-avatar" aria-hidden="true">{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{person.name}</strong><small>{person.profession || person.institution}</small></span><span aria-hidden="true">↗</span></Link>) : <p className="workspace-panel-empty">A medida que se incorporen miembros, podrás descubrir sus perfiles aquí.</p>}<Link href="/directorio" className="workspace-panel-footer">Explorar personas <span aria-hidden="true">→</span></Link></section>
            <section className="workspace-panel workspace-agenda"><div className="workspace-panel-heading"><span className="workspace-kicker">NOS ENCONTRAMOS</span><h2>En agenda</h2></div>{agenda.length ? agenda.map((event) => <Link href={`/eventos/${event.id}`} className="workspace-event" key={event.id}><time dateTime={event.date.toISOString()}><strong>{event.date.toLocaleDateString("es-CU", { day: "2-digit", timeZone: "America/Havana" })}</strong><span>{event.date.toLocaleDateString("es-CU", { month: "short", timeZone: "America/Havana" })}</span></time><span><strong>{event.title}</strong><small>{event.type === "virtual" ? "Encuentro virtual" : "Encuentro presencial"}</small></span></Link>) : <p className="workspace-panel-empty">No hay próximos eventos publicados. Consulta los encuentros de la comunidad.</p>}<Link href="/eventos" className="workspace-panel-footer">Ver eventos <span aria-hidden="true">→</span></Link></section>
            <section className="workspace-panel workspace-news"><div className="workspace-panel-heading"><span className="workspace-kicker">ACTUALIDAD INSTITUCIONAL</span><h2>En la red</h2></div>{news.length ? news.map((post) => <Link href="/noticias" className="workspace-news-item" key={post.id}>{pinned.includes(post) && <span className="workspace-news-pinned">Destacado</span>}<h3>{post.title}</h3><p>{post.content.slice(0, 100)}{post.content.length > 100 ? "…" : ""}</p></Link>) : <p className="workspace-panel-empty">Las novedades institucionales aparecerán aquí cuando se publiquen.</p>}<Link href="/noticias" className="workspace-panel-footer">Todas las noticias <span aria-hidden="true">→</span></Link></section>
          </aside>
        </div>
      </div>
    </main>;
  }

  // ============================================
  return <PublicLanding />;
}
