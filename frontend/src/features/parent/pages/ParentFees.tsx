import { useState } from "react";
import { Search } from "../../../components/common";
import { feeTransactions } from "../data.ts";

const ParentFees = function() {
  const [filteredTransactions, setFilteredTransactions] = useState(feeTransactions);
  const pendingFee = filteredTransactions.find((item) => item.status === "Pending");

  const searchConfig = {
    fields: [
      { key: 'month', label: 'Month', type: 'text' as const, placeholder: 'Search by month...' },
      { key: 'status', label: 'Status', type: 'select' as const,
        options: [
          { value: 'Paid', label: 'Paid' },
          { value: 'Pending', label: 'Pending' },
          { value: 'Overdue', label: 'Overdue' }
        ]
      }
    ],
    placeholder: 'Search fees...',
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = feeTransactions.filter(item => {
        const matchesMonth = !values.month || 
          item.month.toLowerCase().includes(values.month.toLowerCase());
        const matchesStatus = !values.status || item.status === values.status;
        return matchesMonth && matchesStatus;
      });
      setFilteredTransactions(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Fee Status
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            {pendingFee ? pendingFee.amount : "All fees cleared"}
          </h2>
          <p className="mt-3 text-[var(--text)]/75">
            {pendingFee ? `${pendingFee.month} payment is still pending.` : "There are no pending payments right now."}
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Pay Fee Through Online
          </button>
        </div>

        {/* Search */}
        <Search config={searchConfig} />

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Month</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((item) => (
                  <tr key={item.month}>
                    <td className="px-6 py-4 text-slate-700">{item.month}</td>
                    <td className="px-6 py-4 text-slate-700">{item.amount}</td>
                    <td className="px-6 py-4 text-slate-700">{item.status}</td>
                    <td className="px-6 py-4 text-slate-700">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default  ParentFees;