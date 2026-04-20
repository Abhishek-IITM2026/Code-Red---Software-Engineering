import { FiMail, FiPhone, FiMessageSquare } from "react-icons/fi";
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";
import { useGetChildFacultyContactsQuery } from "../api/parentApi";

interface ContactDisplay {
  id?: string;
  subject: string;
  faculty: string;
  phone?: string;
  email?: string;
}

const ParentCommunication = function() {
  const { children, selectedChild, selectedChildId, setSelectedChildId, facultyContacts, isLoading } = useParentChildren();
  const { data: backendContacts = [], isLoading: isContactsLoading } = useGetChildFacultyContactsQuery(selectedChildId, { skip: !selectedChildId });

  // Convert workspace contacts to display format if needed
  const workspaceContactsConverted: ContactDisplay[] = facultyContacts.map((c: any) => ({
    subject: c.subject,
    faculty: c.faculty,
    phone: c.phone,
  }));

  // Use backend contacts if available, fallback to workspace contacts
  const contactsToDisplay = backendContacts.length > 0 ? backendContacts : workspaceContactsConverted;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Communication
        </p>
        <h2 className="mt-2 text-3xl font-bold">{selectedChild.name} Faculty Contacts</h2>
        <p className="mt-3 text-[var(--text)]/75">
          Reach out to your child's teachers for updates, queries, or scheduling meetings.
        </p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <div className="grid gap-5 md:grid-cols-2">
        {contactsToDisplay.map((contact: ContactDisplay) => (
          <div key={contact.id || contact.subject} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition hover:shadow-lg">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              {contact.subject}
            </p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{contact.faculty}</h3>
            
            <div className="mt-4 space-y-3">
              {contact.phone && contact.phone !== "N/A" && (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <FiPhone className="h-4 w-4 text-slate-600" />
                  <a href={`tel:${contact.phone}`} className="text-sm font-semibold text-slate-700 hover:text-[var(--primary)]">
                    {contact.phone}
                  </a>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <FiMail className="h-4 w-4 text-slate-600" />
                  <a href={`mailto:${contact.email}`} className="text-sm font-semibold text-slate-700 hover:text-[var(--primary)] truncate">
                    {contact.email}
                  </a>
                </div>
              )}
            </div>

            <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
              <FiMessageSquare className="h-4 w-4" />
              Send Message
            </button>
          </div>
        ))}
        {!contactsToDisplay.length && !isLoading && !isContactsLoading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 col-span-full">
            Faculty contact information will be available once your child is enrolled in classes.
          </div>
        ) : null}
      </div>

      {/* Communication Tips */}
      <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Communication Best Practices</h3>
        <div className="mt-4 space-y-2 text-sm text-slate-700">
          <p>✓ Use email for detailed queries that need documentation</p>
          <p>✓ Call during school hours for urgent matters</p>
          <p>✓ Schedule parent-teacher meetings through the communication portal</p>
          <p>✓ Keep discussions focused on your child's academic progress</p>
        </div>
      </div>
    </div>
  );
};

export default ParentCommunication;
