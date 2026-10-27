import { memberTypeLabel } from "@/lib/site";
import { db } from "@/db";
import { graduates, connections, users, userPosts } from "@/db/schema";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import { eq, and, or, sql, desc } from "drizzle-orm";
import Link from "next/link";
import { UserPostCard } from "@/components/UserPostCard";
import { ConnectButton } from "@/components/ConnectButton";

export const dynamic = "force-dynamic";

export default async function GraduateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const graduateId = parseInt(id);
  const session = await getSession({ allowPending: true });
  if (!session) redirect("/login");
  if (session.status !== "approved") redirect("/pendiente");

  // Obtener datos del miembro
  const graduateData = await db
    .select()
    .from(graduates)
    .where(eq(graduates.id, graduateId))
    .limit(1);

  if (graduateData.length === 0) {
    notFound();
  }

  const graduate = graduateData[0];
  const targetUser = db.select({ status: users.status }).from(users).where(eq(users.id, graduate.userId ?? -1)).get();
  if (session.role !== "admin" && graduate.userId !== session.id && targetUser?.status !== "approved") notFound();

  // Verificar permisos
  let canViewProfile = false;
  let isFriend = false;
  let pendingRequest = false;

  if (session) {
    // Obtener el graduateId del usuario logueado
    const userGraduate = await db
      .select({ graduateId: graduates.id })
      .from(graduates)
      .where(eq(graduates.userId, session.id))
      .limit(1);

    if (userGraduate.length > 0) {
      const myGraduateId = userGraduate[0].graduateId;

      // Verificar si es el propio perfil
      if (myGraduateId === graduateId) {
        canViewProfile = true;
        isFriend = true; // Es su propio perfil
      } else {
        // Verificar si son amigos
        const connection = await db
          .select()
          .from(connections)
          .where(
            and(
              or(
                and(
                  eq(connections.senderId, myGraduateId),
                  eq(connections.receiverId, graduateId)
                ),
                and(
                  eq(connections.senderId, graduateId),
                  eq(connections.receiverId, myGraduateId)
                )
              ),
              eq(connections.status, "accepted")
            )
          )
          .limit(1);

        if (connection.length > 0) {
          canViewProfile = true;
          isFriend = true;
        } else {
          // Verificar si hay solicitud pendiente
          const pendingConnection = await db
            .select()
            .from(connections)
            .where(
              and(
                or(
                  and(
                    eq(connections.senderId, myGraduateId),
                    eq(connections.receiverId, graduateId)
                  ),
                  and(
                    eq(connections.senderId, graduateId),
                    eq(connections.receiverId, myGraduateId)
                  )
                ),
                eq(connections.status, "pending")
              )
            )
            .limit(1);

          if (pendingConnection.length > 0) {
            pendingRequest = true;
          }
        }
      }
    }
  }

  // Si no puede ver el perfil, mostrar mensaje
  if (!canViewProfile) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Perfil Privado
            </h1>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {session
                ? "Solo los contactos profesionales conectados pueden ver este perfil. Envía una solicitud para ver la información completa."
                : "Debes iniciar sesión y conectar con este miembro para ver su perfil."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {session ? (
                pendingRequest ? (
                  <span className="px-6 py-3 bg-yellow-50 text-yellow-700 rounded-lg font-medium">
                    Solicitud pendiente
                  </span>
                ) : (
                  <ConnectButton graduateId={graduateId} graduateName={graduate.name} />
                )
              ) : (
                <Link
                  href={`/login?redirect=/miembros/${graduateId}`}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
              <Link
                href="/directorio"
                className="px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Volver al Directorio
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Obtener posts del miembro
  const graduatePosts = await db
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
    .where(eq(userPosts.graduateId, graduateId))
    .orderBy(desc(userPosts.createdAt))
    .limit(20);

  // Mostrar perfil completo
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {graduate.userId === session.id && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm text-gray-700">{graduate.employmentConfirmed ? "Mantén actualizada tu institución y actividad profesional." : "Completa tu vínculo laboral para la nueva etapa de CONECTA."}</p>
          <Link href="/completar-perfil" className="text-sm font-semibold text-blue-800 underline">Actualizar vínculo laboral</Link>
        </div>}
        {/* Header del perfil */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-32 sm:h-48 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700"></div>
          
          {/* Info principal */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end -mt-12 sm:-mt-16 gap-4">
              {/* Foto */}
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-3xl shrink-0 overflow-hidden shadow-lg">
                {graduate.photoUrl ? (
                  <img
                    src={graduate.photoUrl}
                    alt={graduate.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  graduate.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                )}
              </div>
              
              {/* Nombre y profesión */}
              <div className="flex-1 pt-12 sm:pt-16">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {graduate.name}
                </h1>
                <p className="text-gray-600 text-lg">
                  {graduate.currentProfession}
                  {graduate.currentCompany && ` en ${graduate.currentCompany}`}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {graduate.country}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                    {graduate.university}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda - Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Sobre mí */}
            {graduate.bio && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Sobre mí</h2>
                <p className="text-gray-600 leading-relaxed">{graduate.bio}</p>
              </div>
            )}

            {/* Formación */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Vinculación institucional y formación</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Institución</p>
                  <p className="text-gray-600">{graduate.university}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Vínculo con la comunidad</p>
                  <p className="text-gray-600">{memberTypeLabel(graduate.memberType)}</p>
                </div>
                {graduate.career && <div>
                  <p className="text-sm font-medium text-gray-700">Área de conocimiento o formación</p>
                  <p className="text-gray-600">{graduate.career}</p>
                </div>}
                {graduate.graduationYear > 0 && <div>
                  <p className="text-sm font-medium text-gray-700">Año de graduación</p>
                  <p className="text-gray-600">{graduate.graduationYear}</p>
                </div>}
              </div>
            </div>

            {/* Habilidades, Idiomas e Intereses */}
            {(graduate.skills || graduate.languages || graduate.interests) && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Perfil Profesional</h2>
                {graduate.skills && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Habilidades</p>
                    <div className="flex flex-wrap gap-2">
                      {graduate.skills.split(",").map((skill, idx) => (
                        <span key={idx} className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {graduate.languages && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Idiomas</p>
                    <div className="flex flex-wrap gap-2">
                      {graduate.languages.split(",").map((lang, idx) => (
                        <span key={idx} className="text-sm bg-[#102B46]/10 text-[#102B46] px-3 py-1.5 rounded-full">
                          {lang.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {graduate.interests && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Intereses</p>
                    <div className="flex flex-wrap gap-2">
                      {graduate.interests.split(",").map((interest, idx) => (
                        <span key={idx} className="text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
                          {interest.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Columna derecha - Contacto y amigos */}
          <div className="space-y-6">
            {/* Contacto */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contacto</h2>
              <div className="space-y-3">
                {graduate.email && (
                  <a href={`mailto:${graduate.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">{graduate.email}</span>
                  </a>
                )}
                {graduate.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">{graduate.phone}</span>
                  </div>
                )}
                {graduate.linkedin && (
                  <a href={graduate.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                {graduate.website && (
                  <a href={graduate.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-sm">Sitio Web</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts del Egresado */}
        {graduatePosts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Publicaciones de {graduate.name}
            </h2>
            <div className="space-y-4">
              {graduatePosts.map((post) => (
                <UserPostCard
                  key={post.id}
                  id={post.id}
                  content={post.content}
                  imageUrl={post.imageUrl}
                  postType={post.postType}
                  referenceUrl={post.referenceUrl}
                  likes={post.likes ?? 0}
                  commentsCount={post.commentsCount ?? 0}
                  createdAt={post.createdAt}
                  graduateId={post.graduateId ?? 0}
                  graduateName={post.graduateName || "Desconocido"}
                  graduatePhoto={post.graduatePhoto}
                  graduateProfession={post.graduateProfession ?? ""}
                  graduateCountry={post.graduateCountry ?? ""}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
