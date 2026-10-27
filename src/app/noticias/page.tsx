
import { PageHeader } from "@/components/PageHeader";
import { db } from "@/db";
import { adminPosts } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { AdminPostCard } from "@/components/AdminPostCard";

export const dynamic = "force-dynamic";

function isPinned(pinnedUntil: number | null): boolean {
  if (!pinnedUntil) return false;
  return pinnedUntil >= Math.floor(Date.now() / 1000);
}

export default async function NoticiasPage() {
  const allPosts = await db
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
    .orderBy(
      sql`CASE WHEN ${adminPosts.pinnedUntil} >= strftime('%s', 'now') THEN 0 ELSE 1 END`,
      desc(adminPosts.createdAt)
    );

  const pinnedPosts = allPosts.filter((p) => isPinned(p.pinnedUntil));
  const regularPosts = allPosts.filter((p) => !isPinned(p.pinnedUntil));

  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <PageHeader title="Noticias" description="Comunicados, iniciativas y novedades de la educación superior cubana." eyebrow="ACTUALIDAD INSTITUCIONAL" />

        {/* Noticias fijadas */}
        {pinnedPosts.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Noticias Destacadas
            </h2>
            <div className="space-y-4">
              {pinnedPosts.map((post) => (
                <div key={post.id} className="border-2 border-red-200 bg-red-50/30 rounded-xl overflow-hidden">
                  <AdminPostCard
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
          </section>
        )}

        {/* Todas las noticias */}
        <section>
          {regularPosts.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Todas las Noticias
            </h2>
          )}
          <div className="space-y-4">
            {regularPosts.map((post) => (
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
        </section>

        {allPosts.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-9-3h10m0 0a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Sin noticias por el momento
            </h3>
            <p className="text-gray-500">
              La administración publicará aquí las noticias oficiales
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
