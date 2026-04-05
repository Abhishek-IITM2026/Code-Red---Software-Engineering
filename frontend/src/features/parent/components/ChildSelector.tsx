import type { ParentChildProfile } from "../data";

interface ChildSelectorProps {
  children: ParentChildProfile[];
  selectedChildId: string;
  onChange: (childId: string) => void;
}

const ChildSelector = ({ children, selectedChildId, onChange }: ChildSelectorProps) => {
  const selectedChild = children.find((child) => child.id === selectedChildId) || children[0];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            Child Selector
          </p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            Viewing details for {selectedChild?.name ?? "Student"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {children.length} children linked to this parent account.
          </p>
        </div>

        <div className="w-full lg:max-w-sm">
          <label className="text-sm font-medium text-slate-700">Choose Child</label>
          <select
            value={selectedChildId}
            onChange={(event) => onChange(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name} - {child.className} {child.section}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ChildSelector;
