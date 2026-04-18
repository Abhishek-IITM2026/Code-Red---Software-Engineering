import { useMemo, useState } from "react";
import { useListFinancialTransactionsQuery } from "../api/adminApi";

const paymentTypes = ["course_payment", "salary_payment", "inventory_procurement"];

const PaymentDetails = () => {
  const [selectedType, setSelectedType] = useState<string>("");
  const { data: transactions = [] } = useListFinancialTransactionsQuery(
    selectedType ? { transactionType: selectedType } : undefined,
  );

  const totals = useMemo(
    () => ({
      count: transactions.length,
      inflow: transactions.filter((item) => item.direction === "inflow").reduce((sum, item) => sum + item.amount, 0),
      outflow: transactions.filter((item) => item.direction === "outflow").reduce((sum, item) => sum + item.amount, 0),
    }),
    [transactions],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Payments</p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Payment Details</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Review course fee receipts, salary disbursements, and procurement payments in one dedicated payment ledger.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.count}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Incoming Payments</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">Rs. {totals.inflow.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Outgoing Payments</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">Rs. {totals.outflow.toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setSelectedType("")} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${selectedType === "" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}>All</button>
          {paymentTypes.map((type) => (
            <button key={type} onClick={() => setSelectedType(type)} className={`rounded-2xl px-4 py-2 text-sm font-semibold ${selectedType === type ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}>
              {type.replaceAll("_", " ")}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Counterparty</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Method</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">{transaction.transactionCode}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{transaction.transactionType.replaceAll("_", " ")}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{transaction.counterpartyName || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{transaction.paymentMethod}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">Rs. {transaction.amount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{transaction.status}</td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No payment transactions found for the selected filter.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentDetails;
