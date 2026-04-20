import { useEffect, useState } from "react";
import { FiCreditCard, FiDollarSign, FiDownload, FiSearch } from "react-icons/fi";
import { Search } from "../../../components/common";
import ChildSelector from "../components/ChildSelector";
import {
  useDownloadFeeInvoiceMutation,
  useGetStudentFeeInvoicesQuery,
  useRecordFeePaymentMutation,
  type FeeInvoice,
} from "../api/parentApi";
import { useParentChildren } from "../useParentChildren";

const formatCurrency = (amount: number) =>
  `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const statusClasses: Record<FeeInvoice["status"], string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partially_paid: "bg-sky-100 text-sky-700",
  pending: "bg-amber-100 text-amber-700",
  overdue: "bg-rose-100 text-rose-700",
};

const statusLabel = (status: FeeInvoice["status"]) => status.replaceAll("_", " ");

const ParentFees = function () {
  const { children, selectedChild, selectedChildId, setSelectedChildId, isLoading } = useParentChildren();
  const { data: invoices = [], isLoading: isInvoicesLoading } = useGetStudentFeeInvoicesQuery(selectedChildId, {
    skip: !selectedChildId,
  });
  const [recordFeePayment, { isLoading: isPaying }] = useRecordFeePaymentMutation();
  const [downloadFeeInvoice, { isLoading: isDownloading }] = useDownloadFeeInvoiceMutation();
  const [filteredInvoices, setFilteredInvoices] = useState<FeeInvoice[]>([]);
  const pendingInvoice = invoices.find((item) => item.pendingAmount > 0) || null;
  const totalPaid = invoices.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalPending = invoices.reduce((sum, item) => sum + item.pendingAmount, 0);

  useEffect(() => {
    setFilteredInvoices(invoices);
  }, [invoices]);

  const handlePayInvoice = async (invoice: FeeInvoice | null) => {
    if (!invoice || invoice.pendingAmount <= 0) {
      return;
    }

    try {
      const response = await recordFeePayment({
        invoiceId: invoice.id,
        amountPaid: invoice.pendingAmount,
        paymentMethod: "online",
      }).unwrap();
      window.alert(`Payment recorded successfully. Receipt ${response.payment.receiptNumber} was emailed to the parent.`);
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to record this payment.");
    }
  };

  const handleDownloadInvoice = async (invoice: FeeInvoice) => {
    try {
      const response = await downloadFeeInvoice({
        invoiceId: invoice.id,
        format: "pdf",
      }).unwrap();
      
      // Response is already a Blob from RTK Query
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_CRS${invoice.id.toString().padStart(5, '0')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return;
      }
      
      window.alert("Unable to process invoice download.");
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to download this invoice.");
    }
  };

  const searchConfig = {
    fields: [
      { key: "invoiceNumber", label: "Invoice", type: "text" as const, placeholder: "Search by invoice or course..." },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "paid", label: "Paid" },
          { value: "partially_paid", label: "Partially Paid" },
          { value: "pending", label: "Pending" },
          { value: "overdue", label: "Overdue" },
        ],
      },
    ],
    placeholder: "Search invoices...",
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = invoices.filter((item) => {
        const keyword = values.invoiceNumber?.trim().toLowerCase() || "";
        const matchesKeyword =
          !keyword ||
          item.invoiceNumber.toLowerCase().includes(keyword) ||
          item.description.toLowerCase().includes(keyword);
        const matchesStatus = !values.status || item.status === values.status;
        return matchesKeyword && matchesStatus;
      });
      setFilteredInvoices(filtered);
    },
  };

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
            onClick={() => void handlePayInvoice(pendingInvoice)}
            disabled={!pendingInvoice || isPaying}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCreditCard className="h-5 w-5" />
            {pendingInvoice ? "Pay Pending Invoice" : "All Fees Settled"}
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending amount</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalPending)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Current status</p>
            <p className="mt-2 text-3xl font-bold capitalize text-slate-900">{pendingInvoice ? statusLabel(pendingInvoice.status) : "Paid"}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total paid</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalPaid)}</p>
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
                  {pendingInvoice
                    ? `${pendingInvoice.invoiceNumber} for ${pendingInvoice.description} is still awaiting payment.`
                    : "There are no pending payments right now."}
                </p>
              </div>
            </div>
            {pendingInvoice ? (
              <div className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                <p><span className="font-semibold text-slate-900">Due date:</span> {pendingInvoice.dueDate}</p>
                <p><span className="font-semibold text-slate-900">Outstanding:</span> {formatCurrency(pendingInvoice.pendingAmount)}</p>
                <p><span className="font-semibold text-slate-900">Invoice:</span> {pendingInvoice.invoiceNumber}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search Payments</p>
                <p className="text-sm text-slate-500">Filter by invoice, course, or payment status.</p>
              </div>
            </div>
            <Search config={searchConfig} />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-lg font-semibold text-slate-900">Fee Invoices</p>
            <p className="text-sm text-slate-500">Live enrollment invoices for {selectedChild?.name ?? "the selected student"}.</p>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Invoice</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Paid</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Pending</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 text-slate-700">
                      <p className="font-medium text-slate-900">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-slate-500">Due {invoice.dueDate}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{invoice.description}</td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(invoice.amount)}</td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(invoice.paidAmount)}</td>
                    <td className="px-6 py-4 text-slate-700">{formatCurrency(invoice.pendingAmount)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[invoice.status]}`}>
                        {statusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleDownloadInvoice(invoice)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          <FiDownload className="h-4 w-4" />
                          Download
                        </button>
                        {invoice.pendingAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => void handlePayInvoice(invoice)}
                            disabled={isPaying}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            <FiCreditCard className="h-4 w-4" />
                            Pay
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredInvoices.length && !isLoading && !isInvoicesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-sm text-slate-500">
                      No fee invoices found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 md:hidden">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">{invoice.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[invoice.status]}`}>
                    {statusLabel(invoice.status)}
                  </span>
                </div>
                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p><span className="font-semibold text-slate-900">Total:</span> {formatCurrency(invoice.amount)}</p>
                  <p><span className="font-semibold text-slate-900">Paid:</span> {formatCurrency(invoice.paidAmount)}</p>
                  <p><span className="font-semibold text-slate-900">Pending:</span> {formatCurrency(invoice.pendingAmount)}</p>
                  <p><span className="font-semibold text-slate-900">Due:</span> {invoice.dueDate}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDownloadInvoice(invoice)}
                    disabled={isDownloading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FiDownload className="h-4 w-4" />
                    Download
                  </button>
                  {invoice.pendingAmount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void handlePayInvoice(invoice)}
                      disabled={isPaying}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      Pay
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            {!filteredInvoices.length && !isLoading && !isInvoicesLoading ? (
              <div className="rounded-2xl border border-slate-200 p-4 text-center text-sm text-slate-500">
                No fee invoices found.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ParentFees;
