
import { PageHeader } from "@/components/PageHeader";
import { MEMBER_TYPES } from "@/lib/site";
import { db } from "@/db";
import { graduates } from "@/db/schema";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { GraduateCard } from "@/components/GraduateCard";

export const dynamic = "force-dynamic";

export default async function DirectorioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Verificar autenticación
  const session = await getSession();

  if (!session) {
    redirect("/login?redirect=/directorio");
  }

  // Redirigir usuarios pendientes a la página de espera
  if (session.status === "pending") {
    redirect("/pendiente");
  }

  const params = await searchParams;
  const search = params.search || "";
  const country = params.country || "";
  const university = params.institution || params.university || "";
  const memberType = params.memberType || "";
  const career = params.career || "";
  const yearFrom = params.yearFrom || "";
  const yearTo = params.yearTo || "";

  let query = db.select().from(graduates);
  const conditions = [sql`EXISTS (SELECT 1 FROM users WHERE users.id = ${graduates.userId} AND users.status = 'approved')`];

  if (search) {
    conditions.push(
      sql`(${graduates.name} LIKE ${"%" + search + "%"} OR ${graduates.currentProfession} LIKE ${"%" + search + "%"} OR ${graduates.bio} LIKE ${"%" + search + "%"})`
    );
  }
  if (country) conditions.push(sql`${graduates.country} = ${country}`);
  if (university)
    conditions.push(sql`${graduates.university} = ${university}`);
  if (memberType && MEMBER_TYPES.some((type) => type.value === memberType)) conditions.push(sql`${graduates.memberType} = ${memberType}`);
  if (career) conditions.push(sql`${graduates.career} = ${career}`);
  if (yearFrom)
    conditions.push(
      sql`${graduates.graduationYear} >= ${parseInt(yearFrom)}`
    );
  if (yearTo)
    conditions.push(
      sql`${graduates.graduationYear} <= ${parseInt(yearTo)}`
    );

  const allGraduates =
    conditions.length > 0
      ? await query.where(sql.join(conditions, sql` AND `)).orderBy(graduates.name)
      : await query.orderBy(graduates.name);

  const countriesResult = await db
    .selectDistinct({ country: graduates.country })
    .from(graduates)
    .orderBy(graduates.country);

  const universitiesResult = await db
    .selectDistinct({ university: graduates.university })
    .from(graduates)
    .orderBy(graduates.university);

  const careersResult = await db
    .selectDistinct({ career: graduates.career })
    .from(graduates)
    .orderBy(graduates.career);

  return (
    <main className="ui-page min-h-screen bg-gray-50">
      <div className="ui-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Directorio" description="Descubre personas, capacidades y afinidades para tu próxima colaboración." eyebrow="PERSONAS · COMUNIDAD CONECTA" />

        <form className="ui-filter-panel mb-8 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Buscar por nombre, profesión o biografía..."
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Buscar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <select
              name="country"
              defaultValue={country}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="">Todos los países</option>
              {countriesResult.map((c) => (
                <option key={c.country} value={c.country}>
                  {c.country}
                </option>
              ))}
            </select>

            <select
              name="institution"
              defaultValue={university}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="">Todas las instituciones</option>
              {universitiesResult.map((u) => (
                <option key={u.university} value={u.university}>
                  {u.university}
                </option>
              ))}
            </select>

            <select name="memberType" defaultValue={memberType}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm">
              <option value="">Todos los vínculos</option>
              {MEMBER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <select
              name="career"
              defaultValue={career}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="">Todas las áreas de conocimiento</option>
              {careersResult.filter((c) => c.career).map((c) => (
                <option key={c.career} value={c.career}>
                  {c.career}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="yearFrom"
              defaultValue={yearFrom}
              placeholder="Año desde"
              min={1960}
              max={2030}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />

            <input
              type="number"
              name="yearTo"
              defaultValue={yearTo}
              placeholder="Año hasta"
              min={1960}
              max={2030}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          {(search || country || university || career || memberType || yearFrom || yearTo) && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">
                {allGraduates.length} resultado{allGraduates.length !== 1 && "s"}
              </span>
              <a
                href="/directorio"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Limpiar filtros
              </a>
            </div>
          )}
        </form>

        {allGraduates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGraduates.map((g) => (
              <GraduateCard
                key={g.id}
                isOwn={g.userId === session.id}
                id={g.id}
                name={g.name}
                country={g.country}
                university={g.university}
                career={g.career}
                graduationYear={g.graduationYear || null}
                memberType={g.memberType}
                currentProfession={g.currentProfession}
                currentCompany={g.currentCompany}
                photoUrl={g.photoUrl}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600 mb-6">
              Intenta ajustar los filtros de búsqueda
            </p>
            <a
              href="/directorio"
              className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              Ver todos los miembros
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
