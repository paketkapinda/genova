import { supabase } from "./supabaseClient.js";

window.syncPayments = async () => {
  console.log("🔄 Syncing payments (Edge)...");

  const { error } = await supabase.functions.invoke(
    "sync-marketplace-payments"
  );

  if (error) {
    console.error("❌ Payment sync failed", error);
    alert("Payment sync failed");
    return;
  }

  await loadPayments();
};

async function loadPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .order("payment_date", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const el = document.getElementById("payments-container");
  if (!el) return;

  if (!data || data.length === 0) {
    el.innerHTML = `<div class="empty-state">No payments found</div>`;
    return;
  }

  el.innerHTML = `
    <div class="payments-grid">
      <div class="payments-header">
        <span>Provider</span>
        <span>Order</span>
        <span>Amount</span>
        <span>Status</span>
        <span>Date</span>
      </div>

      ${data.map(p => `
        <div class="payments-row">
          <span class="provider">${p.provider.toUpperCase()}</span>
          <span class="order">${p.order_id || "-"}</span>
          <span class="amount">$${Number(p.amount).toFixed(2)}</span>
          <span class="status status-${p.status}">
            ${p.status}
          </span>
          <span class="date">
            ${new Date(p.payment_date).toLocaleDateString()}
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

document
  .getElementById("btn-sync-payments")
  ?.addEventListener("click", syncPayments);

loadPayments();
