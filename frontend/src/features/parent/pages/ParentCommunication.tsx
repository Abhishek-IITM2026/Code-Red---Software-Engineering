import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";

const ParentCommunication = function() {
  const { children, selectedChild, selectedChildId, setSelectedChildId, facultyContacts } = useParentChildren();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Communication
        </p>
        <h2 className="mt-2 text-3xl font-bold">{selectedChild.name} Faculty Contacts</h2>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {facultyContacts.map((contact) => (
          <div key={contact.subject} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              {contact.subject}
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{contact.faculty}</h3>
            <p className="mt-2 text-sm text-slate-600">{contact.phone}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentCommunication;
