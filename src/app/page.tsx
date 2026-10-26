import { POST_TYPES } from "@/lib/site";
import Link from "next/link";
import { db } from "@/db";
import { graduates, adminPosts, userPosts } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { AdminPostCard } from "@/components/AdminPostCard";
import { CreatePost } from "@/components/CreatePost";
import { UserPostCard } from "@/components/UserPostCard";
import { LoginForm } from "@/components/LoginForm";
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
  
  const isLoggedIn = !!session;
  if (session?.status === "approved") await checkAndSendEventNotifications();

  const approvedProfiles = sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved')`;
  const stats = db.select({ count: sql<number>`count(*)`, institutions: sql<number>`count(distinct ${graduates.university})` })
    .from(graduates).where(approvedProfiles).get();
  const totalMembers = stats?.count || 0;
  const totalInstitutions = stats?.institutions || 0;

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

  // ============================================
  // HOME PARA USUARIOS LOGUEADOS
  // ============================================
  if (isLoggedIn) {
    const pinned = adminPostsData.filter((p) => {
      if (!p.pinnedUntil) return false;
      return p.pinnedUntil >= nowSec;
    });
    const regular = adminPostsData.filter((p) => {
      if (!p.pinnedUntil) return true;
      return p.pinnedUntil < nowSec;
    });

    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="lg:w-72 shrink-0 space-y-6">
              {/* Welcome Card */}
              <div className="bg-[#003f8f] rounded-xl p-6 text-white">
                <h2 className="text-lg font-bold mb-1">¡Hola, {session?.username}!</h2>
                <p className="text-sm text-blue-200">Red MES</p>
              </div>

              {/* Stats */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Miembros</span>
                    <span className="text-xl font-bold text-[#003f8f]">{totalMembers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Instituciones</span>
                    <span className="text-xl font-bold text-[#003f8f]">{totalInstitutions}</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Accesos Rápidos</h3>
                <div className="space-y-1">
                  <Link href="/directorio" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">📋 Directorio</Link>
                  <Link href="/conexiones" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">🤝 Conexiones</Link>
                  {userGraduateId && (
                    <Link href={`/miembros/${userGraduateId}`} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">👤 Mi Perfil</Link>
                  )}
                  <Link href="/eventos" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">📅 Eventos</Link>
                  <Link href="/comunidades" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">👥 Comunidades</Link>
                  {session?.role === 'admin' && (
                    <Link href="/admin" className="block px-3 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-lg transition-colors">🛡️ Panel Admin</Link>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Create Post */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                {userGraduateId ? <CreatePost /> : <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Completa tu perfil profesional</h2>
                  <p className="mt-2 text-sm text-gray-600">Indica tu institución y actividad laboral para compartir resultados y participar en conversaciones profesionales.</p>
                  <Link href="/miembros/registro" className="mt-4 inline-block font-semibold text-blue-800 underline">Crear mi perfil</Link>
                </div>}
              </div>

              {/* Pinned News */}
              {pinned.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Noticias Destacadas
                  </h2>
                  <div className="space-y-4">
                    {pinned.map((post) => (
                      <div key={post.id} className="border-2 border-red-200 bg-red-50/30 rounded-xl overflow-hidden">
                        <AdminPostCard
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          content={post.content}
                          imageUrl={post.imageUrl}
                          authorName={post.authorName}
                          createdAt={post.createdAt}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity Feed */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad profesional y académica</h2>
                <div className="mb-5 flex flex-wrap gap-2" aria-label="Tipos de aportes">
                  <Link href="/" aria-current={!selectedType ? "page" : undefined} className={`rounded-full border px-3 py-1.5 text-sm ${!selectedType ? "border-blue-800 bg-blue-800 text-white" : "border-gray-200 bg-white text-gray-700"}`}>Todos</Link>
                  {POST_TYPES.map((type) => <Link key={type.value} href={`/?type=${type.value}`} aria-current={selectedType === type.value ? "page" : undefined}
                    className={`rounded-full border px-3 py-1.5 text-sm ${selectedType === type.value ? "border-blue-800 bg-blue-800 text-white" : "border-gray-200 bg-white text-gray-700"}`}>{type.label}</Link>)}
                </div>
                {userPostsData.length > 0 ? (
                  <div className="space-y-4">
                    {userPostsData.map((post) => (
                      <UserPostCard
                        key={post.id}
                        id={post.id}
                        content={post.content}
                        imageUrl={post.imageUrl}
                        postType={post.postType}
                        referenceUrl={post.referenceUrl}
                        likes={post.likes}
                        commentsCount={post.commentsCount}
                        createdAt={post.createdAt}
                        graduateId={post.graduateId}
                        graduateName={post.graduateName}
                        graduatePhoto={post.graduatePhoto}
                        graduateProfession={post.graduateProfession}
                        graduateCountry={post.graduateCountry}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-gray-500">Aún no hay aportes en esta sección. Comparte un resultado, un proyecto o una oportunidad de colaboración.</p>
                  </div>
                )}
              </div>

              {/* Regular News */}
              {regular.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Noticias</h2>
                    {session?.role === 'admin' && (
                      <Link href="/admin/posts/new" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                        + Nueva Noticia
                      </Link>
                    )}
                  </div>
                  <div className="grid gap-6">
                    {regular.map((post) => (
                      <AdminPostCard
                        key={post.id}
                        id={post.id}
                        title={post.title}
                        content={post.content}
                        imageUrl={post.imageUrl}
                        authorName={post.authorName}
                        createdAt={post.createdAt}
                      />
                    ))}
                  </div>
                  <div className="text-center mt-4">
                    <Link href="/noticias" className="text-[#003f8f] hover:underline text-sm font-medium">
                      Ver todas las noticias →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // HOME PÚBLICO - Rediseñado
  // ============================================
  return (
    <main className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Contenido dividido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Izquierda: Info de la red - Fondo azul */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#003f8f] flex-col justify-center px-16 xl:px-24 text-white">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight">
            Red MES
            <span className="block mt-2 text-2xl xl:text-3xl font-normal text-blue-200">
              del Ministerio de Educación Superior
            </span>
          </h1>
          <p className="text-blue-100 text-lg max-w-md mt-8 leading-relaxed">
            Conecta con profesionales del MES y sus instituciones. Comparte resultados científicos, participa en proyectos y encuentra oportunidades de colaboración.
          </p>
          <div className="mt-10 flex gap-6 text-sm">
            <Link href="/estatutos" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
              <span className="text-lg">📖</span>
              <span className="underline">Estatutos</span>
            </Link>
            <Link href="/terminos" className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors">
              <span className="text-lg">📄</span>
              <span className="underline">Términos</span>
            </Link>
          </div>
        </div>

        {/* Derecha: Login + Registro - Fondo blanco */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center items-center px-8 sm:px-12 overflow-y-auto">
          <div className="w-full max-w-sm">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-2xl font-bold text-[#003f8f]">Red MES</h1>
              <p className="text-[#003f8f]/70 text-sm mt-1">Educación Superior Cubana</p>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">o</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Registro */}
            <div className="text-center">
              <p className="text-base text-gray-700 mb-4">¿No tienes cuenta?</p>
              <Link href="/register" className="block w-full py-3 border-2 border-[#003f8f] text-[#003f8f] text-center rounded-lg font-semibold hover:bg-[#003f8f] hover:text-white transition-colors">
                Regístrate
              </Link>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Tu cuenta será revisada por tu institución o por la administración de la red.
              </p>
            </div>

            {/* Mobile links */}
            <div className="lg:hidden flex justify-center gap-6 text-sm text-gray-500 pt-6 mt-4 border-t border-gray-200">
              <Link href="/estatutos" className="flex items-center gap-1 text-[#003f8f] hover:underline">
                📖 Estatutos
              </Link>
              <Link href="/terminos" className="flex items-center gap-1 text-[#003f8f] hover:underline">
                📄 Términos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer full-width */}
      <footer className="bg-[#002860] py-3 text-center text-sm text-blue-300 shrink-0">
        © 2026 Red MES · Ministerio de Educación Superior
      </footer>
    </main>
  );
}
