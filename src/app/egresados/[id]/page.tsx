import { memberTypeLabel } from "@/lib/site";
import { db } from "@/db";
import { graduates, connections, users, userPosts } from "@/db/schema";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { eq, and, or, desc } from "drizzle-orm";
import Link from "next/link";
import { UserPostCard } from "@/components/UserPostCard";
import { ConnectButton } from "@/components/ConnectButton";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

function Section({ id, label, title, editHref, children }: { id: string; label: string; title: string; editHref?: string; children: ReactNode }) {
  return <section id={id} className="member-section"><div className="member-section-heading"><div><p className="workspace-kicker">{label}</p><h2>{title}</h2></div>{editHref && <Link href={editHref} className="member-edit-link" aria-label={`Editar ${title.toLowerCase()}`}>Editar <span aria-hidden="true">↗</span></Link>}</div>{children}</section>;
}
const splitTags = (value: string | null) => value?.split(",").map(tag => tag.trim()).filter(Boolean) || [];
function Tags({ value, empty }: { value: string | null; empty: string }) {
  const tags = splitTags(value);
  return tags.length ? <ul className="member-tags">{tags.map((tag, index) => <li key={index}>{tag}</li>)}</ul> : <p className="member-empty-copy">{empty}</p>;
}
function safeLink(value: string | null) {
  try { const url = new URL(value || ""); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.toString() : null; }
  catch { return null; }
}

export default async function GraduateProfilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const graduateId = Number(id);
  if (!Number.isSafeInteger(graduateId) || graduateId < 1) notFound();
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status !== "approved") redirect("/pendiente");
  const graduate = db.select().from(graduates).where(eq(graduates.id, graduateId)).get();
  if (!graduate) notFound();
  const isOwner = graduate.userId === session.id;
  const updated = isOwner && (await searchParams).actualizado === "1";
  const targetUser = db.select({ status: users.status }).from(users).where(eq(users.id, graduate.userId ?? -1)).get();
  if (session.role !== "admin" && !isOwner && targetUser?.status !== "approved") notFound();
  const mine = db.select({ id: graduates.id }).from(graduates).where(eq(graduates.userId, session.id)).get();
  const relation = mine && !isOwner ? db.select({ status: connections.status }).from(connections).where(or(
    and(eq(connections.senderId, mine.id), eq(connections.receiverId, graduateId)),
    and(eq(connections.receiverId, mine.id), eq(connections.senderId, graduateId)),
  )).all() : [];
  const connected = relation.some(item => item.status === "accepted");
  const canView = isOwner || session.role === "admin" || connected;
  const editUrl = `/miembros/${graduateId}/editar`;
  const graduatePosts = canView ? db.select().from(userPosts).where(eq(userPosts.graduateId, graduateId)).orderBy(desc(userPosts.createdAt)).limit(20).all() : [];
  const website = safeLink(graduate.website), linkedin = safeLink(graduate.linkedin);

  return <main className="member-page"><div className="member-wrap">
    <nav className="member-breadcrumb" aria-label="Ubicación"><Link href="/directorio">Directorio</Link><span aria-hidden="true">/</span><span>{isOwner ? "Mi perfil" : "Perfil profesional"}</span></nav>
    {updated && <p role="status" className="member-success">Tu perfil se actualizó correctamente.</p>}
    <header className="member-hero"><div className="member-cover"><span className="workspace-kicker">CONECTA · PERFIL PROFESIONAL</span><span>Conecta conocimiento. <em>Impulsa innovación.</em></span></div><div className="member-identity"><ProfileAvatar name={graduate.name} src={graduate.photoUrl} /><div className="member-identity-copy"><span className="member-type">{memberTypeLabel(graduate.memberType)}</span><h1>{graduate.name}</h1><p>{graduate.currentProfession || "Profesional de la educación superior"}{graduate.currentCompany ? ` · ${graduate.currentCompany}` : ""}</p><div className="member-location"><span>{graduate.university}</span><span aria-hidden="true">·</span><span>{[graduate.city, graduate.country].filter(Boolean).join(", ")}</span></div></div><div className="member-hero-actions">{isOwner ? <Link href={editUrl} className="conecta-cta">Editar perfil <span aria-hidden="true">↗</span></Link> : <ConnectButton graduateId={graduateId} graduateName={graduate.name} />}</div></div></header>
    {!canView ? <section className="member-section member-private"><span className="member-private-symbol" aria-hidden="true">◎</span><h2>Una conexión abre nuevas conversaciones</h2><p>La información completa y los datos de contacto de este perfil están disponibles para sus conexiones profesionales.</p><Link href="/directorio" className="member-edit-link">Volver al Directorio →</Link></section> : <>
      <nav className="member-section-nav" aria-label="Secciones del perfil"><a href="#presentacion">Presentación</a><a href="#trayectoria">Trayectoria</a><a href="#conocimientos">Conocimientos</a><a href="#actividad">Actividad</a><a href="#contacto">Contacto</a></nav>
      {isOwner && !graduate.employmentConfirmed && <div className="member-affiliation-note"><div><strong>Tu vínculo laboral está por actualizar</strong><p>Completa tu institución y actividad para solicitar su validación.</p></div><Link href="/completar-perfil">Actualizar vínculo →</Link></div>}
      <div className="member-grid"><div className="member-main">
        <Section id="presentacion" label="01 / TU VOZ EN LA COMUNIDAD" title="Sobre mí" editHref={isOwner ? `${editUrl}#presentacion` : undefined}>{graduate.bio ? <p className="member-bio">{graduate.bio}</p> : <div className="member-empty"><p>{isOwner ? "Tu experiencia merece una buena presentación." : "Este miembro todavía no ha añadido una presentación."}</p>{isOwner && <><span>Cuenta en qué trabajas, qué te mueve y cómo te gustaría colaborar.</span><Link href={`${editUrl}#presentacion`}>Escribir mi presentación →</Link></>}</div>}</Section>
        <Section id="trayectoria" label="02 / EXPERIENCIA Y FORMACIÓN" title="Trayectoria profesional" editHref={isOwner ? `${editUrl}#trayectoria` : undefined}><div className="member-timeline"><div><span className="member-timeline-dot" /><p className="member-field-label">ACTIVIDAD ACTUAL</p><h3>{graduate.currentProfession || "Actividad por completar"}</h3>{graduate.currentCompany && <p>{graduate.currentCompany}</p>}<span className="member-detail">{graduate.university}</span></div><div><span className="member-timeline-dot" /><p className="member-field-label">FORMACIÓN Y ÁREA DE CONOCIMIENTO</p>{graduate.career ? <h3>{graduate.career}</h3> : <p className="member-empty-copy">{isOwner ? "Añade tu formación o área de especialidad." : "Formación no indicada."}</p>}{graduate.graduationYear > 0 && <span className="member-detail">Graduación · {graduate.graduationYear}</span>}</div></div></Section>
        <Section id="conocimientos" label="03 / CAPACIDADES QUE CONECTAN" title="Conocimientos y habilidades" editHref={isOwner ? `${editUrl}#conocimientos` : undefined}><Tags value={graduate.skills} empty={isOwner ? "Añade tus conocimientos, métodos y herramientas para que otras personas conozcan tus capacidades." : "Este miembro todavía no ha indicado sus habilidades."} /></Section>
        <Section id="intereses" label="04 / POSIBILIDADES EN COMÚN" title="Intereses de colaboración" editHref={isOwner ? `${editUrl}#conocimientos` : undefined}><Tags value={graduate.interests} empty={isOwner ? "¿Qué temas o iniciativas te gustaría explorar con otras personas de la red?" : "Intereses de colaboración por completar."} /></Section>
        <Section id="actividad" label="05 / CONOCIMIENTO COMPARTIDO" title={isOwner ? "Mis aportes" : "Aportes a la comunidad"}>{graduatePosts.length ? <div className="member-posts">{graduatePosts.map(post => <UserPostCard key={post.id} {...post} graduateId={graduate.id} graduateName={graduate.name} graduatePhoto={graduate.photoUrl} graduateProfession={graduate.currentProfession} graduateCountry={graduate.country} />)}</div> : <div className="member-empty"><p>{isOwner ? "Tu próxima idea puede iniciar una colaboración." : "Todavía no hay aportes publicados."}</p>{isOwner && <><span>Comparte un resultado, un proyecto o una consulta con la comunidad.</span><Link href="/#compartir">Compartir mi primer aporte →</Link></>}</div>}</Section>
      </div><aside className="member-aside">
        <Section id="vinculo" label="MIEMBRO DE LA COMUNIDAD" title="Vínculo institucional"><div className="member-institution-icon" aria-hidden="true">▦</div><h3 className="member-institution-name">{graduate.university}</h3><p className="member-detail">{memberTypeLabel(graduate.memberType)}</p><span className="member-declaration">{graduate.employmentConfirmed ? "Vínculo laboral declarado" : "Vínculo por actualizar"}</span>{isOwner && <Link href="/completar-perfil" className="member-section-footer">Actualizar vínculo laboral <span aria-hidden="true">↗</span></Link>}</Section>
        <Section id="idiomas" label="PARA ENTENDERNOS MEJOR" title="Idiomas" editHref={isOwner ? `${editUrl}#conocimientos` : undefined}><Tags value={graduate.languages} empty={isOwner ? "Indica los idiomas en los que puedes colaborar." : "Idiomas no indicados."} /></Section>
        <Section id="contacto" label="CONTINUEMOS LA CONVERSACIÓN" title="Contacto" editHref={isOwner ? `${editUrl}#contacto` : undefined}><dl className="member-contact">{graduate.email && <div><dt>Correo de contacto</dt><dd><a href={`mailto:${graduate.email}`}>{graduate.email}</a></dd></div>}{graduate.phone && <div><dt>Teléfono</dt><dd>{graduate.phone}</dd></div>}{website && <div><dt>Sitio web</dt><dd><a href={website} target="_blank" rel="noopener noreferrer">Visitar sitio <span aria-hidden="true">↗</span></a></dd></div>}{linkedin && <div><dt>Red profesional</dt><dd><a href={linkedin} target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></dd></div>}</dl><p className="member-privacy-note">El perfil completo se comparte con tus conexiones y la administración de la red.</p></Section>
        {isOwner && <div className="member-profile-tip"><span aria-hidden="true">◇</span><h2>Haz visible lo que puedes aportar</h2><p>Una presentación clara y tus intereses ayudan a encontrar afinidades profesionales.</p><Link href={editUrl}>Completar mi perfil →</Link></div>}
      </aside></div>
    </>}
  </div></main>;
}
