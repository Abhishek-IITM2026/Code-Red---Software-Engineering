import { useEffect, useMemo, useState } from "react";
import inventoryApi from "../../api/inventoryApi";
import type { InventoryItem, InventoryProcurement, Vendor } from "../../types/inventory";

const ProcurementManagement = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [procurements, setProcurements] = useState<InventoryProcurement[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [vendorForm, setVendorForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    notes: "",
    isActive: true,
  });
  const [procurementForm, setProcurementForm] = useState({
    inventoryItemId: "",
    vendorId: "",
    quantity: 1,
    unitPrice: 0,
    taxAmount: 0,
    shippingCost: 0,
    invoiceNumber: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    paymentStatus: "completed",
    receivedStatus: "received",
    notes: "",
  });

  const loadData = async () => {
    const [inventoryItems, vendorRows, procurementRows] = await Promise.all([
      inventoryApi.getItems(),
      inventoryApi.getVendors(),
      inventoryApi.getProcurements(),
    ]);
    setItems(inventoryItems);
    setVendors(vendorRows);
    setProcurements(procurementRows);
    setProcurementForm((current) => ({
      ...current,
      inventoryItemId: current.inventoryItemId || inventoryItems[0]?.id || "",
      vendorId: current.vendorId || vendorRows[0]?.id || "",
    }));
  };

  useEffect(() => {
    loadData().catch(() => setStatusMessage("Unable to load procurement data."));
  }, []);

  const estimatedTotal = useMemo(
    () =>
      procurementForm.quantity * procurementForm.unitPrice + procurementForm.taxAmount + procurementForm.shippingCost,
    [procurementForm],
  );

  const submitVendor = async () => {
    if (!vendorForm.name.trim()) {
      setStatusMessage("Vendor name is required.");
      return;
    }
    await inventoryApi.addVendor(vendorForm);
    setVendorForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      gstNumber: "",
      address: "",
      notes: "",
      isActive: true,
    });
    setStatusMessage("Vendor saved.");
    await loadData();
  };

  const submitProcurement = async () => {
    if (!procurementForm.inventoryItemId || !procurementForm.vendorId) {
      setStatusMessage("Select an item and vendor before saving procurement.");
      return;
    }
    await inventoryApi.addProcurement({
      ...procurementForm,
      quantity: Number(procurementForm.quantity),
      unitPrice: Number(procurementForm.unitPrice),
      taxAmount: Number(procurementForm.taxAmount),
      shippingCost: Number(procurementForm.shippingCost),
    });
    setStatusMessage("Procurement recorded.");
    await loadData();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Procurement Desk</p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Inventory Procurement</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Capture vendor details, record procurement expenses, and keep stock updates tied to finance transactions.
        </p>
      </section>

      {statusMessage ? (
        <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">{statusMessage}</div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Add Vendor</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <input value={vendorForm.name} onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))} placeholder="Vendor name" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={vendorForm.contactPerson} onChange={(event) => setVendorForm((current) => ({ ...current, contactPerson: event.target.value }))} placeholder="Contact person" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={vendorForm.email} onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={vendorForm.phone} onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={vendorForm.gstNumber} onChange={(event) => setVendorForm((current) => ({ ...current, gstNumber: event.target.value }))} placeholder="GST number" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={vendorForm.address} onChange={(event) => setVendorForm((current) => ({ ...current, address: event.target.value }))} placeholder="Address" className="rounded-2xl border border-slate-200 px-4 py-3" />
          </div>
          <textarea value={vendorForm.notes} onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
          <button onClick={() => void submitVendor()} className="mt-4 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Save Vendor</button>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Record Procurement</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <select value={procurementForm.inventoryItemId} onChange={(event) => setProcurementForm((current) => ({ ...current, inventoryItemId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3">
              {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select value={procurementForm.vendorId} onChange={(event) => setProcurementForm((current) => ({ ...current, vendorId: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3">
              {vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
            </select>
            <input type="number" value={procurementForm.quantity} onChange={(event) => setProcurementForm((current) => ({ ...current, quantity: Number(event.target.value) }))} placeholder="Quantity" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input type="number" value={procurementForm.unitPrice} onChange={(event) => setProcurementForm((current) => ({ ...current, unitPrice: Number(event.target.value) }))} placeholder="Unit price" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input type="number" value={procurementForm.taxAmount} onChange={(event) => setProcurementForm((current) => ({ ...current, taxAmount: Number(event.target.value) }))} placeholder="Tax" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input type="number" value={procurementForm.shippingCost} onChange={(event) => setProcurementForm((current) => ({ ...current, shippingCost: Number(event.target.value) }))} placeholder="Shipping" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input value={procurementForm.invoiceNumber} onChange={(event) => setProcurementForm((current) => ({ ...current, invoiceNumber: event.target.value }))} placeholder="Invoice number" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input type="date" value={procurementForm.purchaseDate} onChange={(event) => setProcurementForm((current) => ({ ...current, purchaseDate: event.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3" />
          </div>
          <textarea value={procurementForm.notes} onChange={(event) => setProcurementForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="mt-4 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" />
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">Estimated total: Rs. {estimatedTotal.toLocaleString()}</p>
            <button onClick={() => void submitProcurement()} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Save Procurement</button>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Vendors</h2>
          <div className="mt-4 space-y-3">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-900">{vendor.name}</p>
                <p className="text-sm text-slate-500">{vendor.contactPerson || "No contact"} • {vendor.phone || "No phone"}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Recent Procurements</h2>
          <div className="mt-4 space-y-3">
            {procurements.map((procurement) => (
              <div key={procurement.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <p className="font-semibold text-slate-900">{procurement.inventoryItemName} • {procurement.vendorName}</p>
                <p className="text-sm text-slate-500">
                  Qty {procurement.quantity} • Rs. {procurement.totalAmount.toLocaleString()} • {procurement.purchaseDate}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ProcurementManagement;
