export function InstitutionField() {
  return <div className="sm:col-span-2">
    <label htmlFor="institution" className="mb-1.5 block text-sm font-medium text-gray-700">Institución donde trabajas *</label>
    <input id="institution" name="institution" required maxLength={200} list="institution-suggestions"
      placeholder="Ministerio, universidad, centro o entidad del MES"
      className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
    <datalist id="institution-suggestions">
      {["Ministerio de Educación Superior", "Universidad de La Habana", "Universidad de Oriente", "Universidad de Camagüey", "Universidad de Holguín", "Universidad de Pinar del Río"].map((name) => <option key={name} value={name} />)}
    </datalist>
    <p className="mt-2 text-xs text-gray-500">Escribe el nombre completo de tu institución. La solicitud será revisada por sus responsables o por la administración de la red.</p>
  </div>;
}
