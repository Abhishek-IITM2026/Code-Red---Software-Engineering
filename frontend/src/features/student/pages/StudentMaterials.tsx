import { useState } from "react";
import { Search } from "../../../components/common";

const allMaterials = [
  { name: "Chapter 1 Notes", subject: "Mathematics" },
  { name: "Previous Paper", subject: "Physics" },
  { name: "Chapter 2 Notes", subject: "Mathematics" },
  { name: "Formula Sheet", subject: "Chemistry" },
  { name: "Lab Manual", subject: "Physics" },
  { name: "Sample Questions", subject: "English" },
];

const StudentMaterials = function() {
  const [materials, setMaterials] = useState(allMaterials);

  const searchConfig = {
    fields: [
      { key: 'name', label: 'Material Name', type: 'text' as const, placeholder: 'Search materials...' }
    ],
    placeholder: 'Search materials...',
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = allMaterials.filter(material => {
        const matchesName = !values.name || 
          material.name.toLowerCase().includes(values.name.toLowerCase());
        return matchesName;
      });
      setMaterials(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Materials
        </p>
        <h2 className="mt-2 text-3xl font-bold">Study Materials</h2>
      </div>

      {/* Search */}
      <Search config={searchConfig} />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Material</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.map((item) => (
                <tr key={item.name}>
                  <td className="px-6 py-4 text-slate-700">{item.name}</td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default  StudentMaterials;