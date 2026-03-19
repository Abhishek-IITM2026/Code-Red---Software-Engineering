import { useEffect, useState } from "react";
import { FiCreditCard, FiDollarSign, FiSearch } from "react-icons/fi";
import { Search } from "../../../components/common";
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";

const ParentFees = function () {
  const { children, selectedChild, selectedChildId, setSelectedChildId, feeTransactions } = useParentChildren();
  const [filteredTransactions, setFilteredTransactions] = useState(feeTransactions);
  const pendingFee = filteredTransactions.find((item) => item.status === "Pending");

  useEffect(() => {
    setFilteredTransactions(feeTransactions);
  }, [feeTransactions]);

  const searchConfig = {
    fields: [
      { key: "month", label: "Month", type: "text" as const, placeholder: "Search by month..." },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "Paid", label: "Paid" },
          { value: "Pending", label: "Pending" },
          { value: "Overdue", label: "Overdue" },
        ],
      },
    ],
    placeholder: "Search fees...",
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = feeTransactions.filter((item) => {
        const matchesMonth = !values.month || item.month.toLowerCase().includes(values.month.toLowerCase());
        const matchesStatus = !values.status || item.status === values.status;
        return matchesMonth && matchesStatus;
      });
      setFilteredTransactions(filtered);
    },
  };

  const totalPaid = feeTransactions
    .filter((item) => item.status === "Paid")
    .reduce((sum, item) => sum + Number.parseInt(item.amount.replace(/[^\d]/g, ""), 10), 0);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Fees
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">{selectedChild.name} Fee Overview</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Track pending dues, review payment history, and keep fee records organized in one place.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiCreditCard className="h-5 w-5" />
            Pay Fee Online
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending amount</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingFee ? pendingFee.amount : "Rs. 0"}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Current status</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingFee?.status ?? "Paid"}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total paid</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">Rs. {totalPaid.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <FiDollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Current Fee Status</p>
                <p className="text-sm text-slate-500">
                  {pendingFee ? `${pendingFee.month} payment is still pending.` : "There are no pending payments right now."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search Payments</p>
                <p className="text-sm text-slate-500">Filter by month or payment status.</p>
              </div>
            </div>
            <Search config={searchConfig} />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-lg font-semibold text-slate-900">Payment History</p>
            <p className="text-sm text-slate-500">All recorded fee transactions for the current academic year.</p>
          </div>

          <div className="hidden md:block overflow-x-auto">
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
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : item.status === "Pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 md:hidden">
            {filteredTransactions.map((item) => (
              <div key={item.month} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.month}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "Paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold text-slate-900">{item.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ParentFees;
