import { MEMBER_TYPES } from "@/lib/site";

export function MemberTypeSelect({ defaultValue = "" }: { defaultValue?: string }) {
  return <div>
    <label htmlFor="memberType" className="mb-1.5 block text-sm font-medium text-gray-700">Perfil profesional *</label>
    <select id="memberType" name="memberType" required defaultValue={defaultValue}
      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
      <option value="" disabled>Selecciona tu vínculo</option>
      {MEMBER_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
    </select>
  </div>;
}
