import { useMemo, useState } from "react";
import {
  useExportFinancialTransactionsMutation,
  useListFinancialTransactionsQuery,
  useListSalaryAccountApprovalRequestsQuery,
  useReviewSalaryAccountApprovalRequestMutation,
} from "../api/adminApi";

const FinanceOperations = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const { data: transactions = [] } = useListFinancialTransactionsQuery(statusFilter ? { status: statusFilter } : undefined);
  const { data: approvalRequests = [] } = useListSalaryAccountApprovalRequestsQuery();
  const [exportTransactions] = useExportFinancialTransactionsMutation();
  const [reviewRequest] = useReviewSalaryAccountApprovalRequestMutation();

  const totalInflow = useMemo(
    () => transactions.filter((item) => item.direction === "inflow").reduce((sum, item) => sum + item.amount, 0),
    [transactions],
  );
  const totalOutflow = useMemo(
    () => transactions.filter((item) => item.direction === "outflow").reduce((sum, item) => sum + item.amount, 0),
    [transactions],
  );

  const downloadExport = async (format: "csv" | "pdf" | "xlsx") => {
    const blob = await exportTransactions({ format, status: statusFilter || undefined }).unwrap();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financial-transactions.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Finance Ops</p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Transactions & Payroll Approvals</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Review income and expense transactions, export finance reports, and approve employee salary-account change requests.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Recorded Transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{transactions.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Total Inflow</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">Rs. {totalInflow.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Total Outflow</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">Rs. {totalOutflow.toLocaleString()}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Transaction Ledger</p>
              <p className="text-sm text-slate-500">Course receipts, payroll disbursements, and inventory expenses in one view.</p>
            </div>
            <div className="flex gap-3">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
              <button onClick={() => void downloadExport("xlsx")} className="rounded-2xl border border-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-700">Export Excel</button>
              <button onClick={() => void downloadExport("csv")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">Export CSV</button>
              <button onClick={() => void downloadExport("pdf")} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">Export PDF</button>
            </div>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Counterparty</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">{transaction.transactionCode}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{transaction.transactionType}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{transaction.counterpartyName || "-"}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">Rs. {transaction.amount.toLocaleString()}</td>
                      <td className="px-4 py-4 text-sm text-slate-700">{transaction.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold text-slate-900">Salary Account Approval Queue</p>
          <p className="mt-1 text-sm text-slate-500">Employees can update payout details only after proof-backed review.</p>
          <div className="mt-4 space-y-4">
            {approvalRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">{request.requestedData.bankName || "Bank update request"}</p>
                <p className="mt-1 text-sm text-slate-500">{request.proofDocumentName || "No proof file"} • {request.status}</p>
                <p className="mt-2 text-sm text-slate-600">Account holder: {request.requestedData.accountHolderName || "Unknown"}</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => void reviewRequest({ id: request.id, status: "approved", reviewNotes: "Approved by finance." })} className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve</button>
                  <button onClick={() => void reviewRequest({ id: request.id, status: "rejected", reviewNotes: "Please upload a clearer bank proof." })} className="rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">Reject</button>
                </div>
              </div>
            ))}
            {approvalRequests.length === 0 ? <p className="text-sm text-slate-500">No salary-account approvals are pending right now.</p> : null}
          </div>
        </article>
      </section>
    </div>
  );
};

export default FinanceOperations;
