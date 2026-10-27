import Link from "next/link";
import { db } from "@/db";
import { graduates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { ProfileEditor } from "@/components/ProfileEditor";
export const dynamic = "force-dynamic";
export const metadata = { title: "Editar mi perfil" };
export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status !== "approved") redirect("/pendiente");
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const profile = db.select().from(graduates).where(eq(graduates.id, id)).get();
  if (!profile || profile.userId !== session.id) notFound();
  const { name, email, country, city, currentProfession, currentCompany, career, graduationYear, bio, phone, linkedin, website, skills, interests, languages, photoUrl, university, memberType } = profile;
  return <main className="member-page"><div className="member-edit-wrap"><nav className="member-breadcrumb" aria-label="Ubicación"><Link href={`/miembros/${id}`}>Mi perfil</Link><span aria-hidden="true">/</span><span>Editar</span></nav><header className="member-edit-heading"><p className="workspace-kicker">TU ESPACIO PROFESIONAL EN CONECTA</p><h1>Un perfil que hable de ti.</h1><p>Actualiza tu trayectoria, comparte tus capacidades y abre nuevas posibilidades de colaboración.</p></header><nav className="member-section-nav" aria-label="Secciones de edición"><a href="#presentacion">Presentación</a><a href="#trayectoria">Trayectoria</a><a href="#conocimientos">Conocimientos</a><a href="#contacto">Contacto</a><a href="#foto">Foto</a></nav><ProfileEditor initial={{ id, name, email, country, city, currentProfession, currentCompany, career, graduationYear, bio, phone, linkedin, website, skills, interests, languages, photoUrl, university, memberType }} /></div></main>;
}
