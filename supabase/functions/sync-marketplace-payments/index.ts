import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    /* ================================
       SUPABASE CLIENT (SERVICE ROLE)
    ================================= */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ================================
       AKTİF ETSY ENTEGRASYONLARI
    ================================= */
    const { data: integrations, error: intErr } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "etsy")
      .eq("is_active", true);

    if (intErr) throw intErr;

    /* ================================
       HER ETSY SHOP İÇİN
    ================================= */
    for (const integration of integrations) {
      const accessToken = await refreshEtsyToken(supabase, integration);

      /* ================================
         ETSY PAYMENTS
      ================================= */
      const paymentsRes = await fetch(
        `https://api.etsy.com/v3/application/shops/${integration.shop_id}/payments`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!paymentsRes.ok) continue;

      const paymentsJson = await paymentsRes.json();
      const payments = paymentsJson.results || [];

      for (const payment of payments) {
        if (!payment.order_id) continue;

        /* ================================
           ETSY ORDER DETAIL
        ================================= */
        const orderRes = await fetch(
          `https://api.etsy.com/v3/application/shops/${integration.shop_id}/orders/${payment.order_id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        );

        if (!orderRes.ok) continue;

        const orderJson = await orderRes.json();
        const order = orderJson.results?.[0];
        if (!order) continue;

        /* ================================
           SKU (SKN)
        ================================= */
        const lineItem = order.line_items?.[0];
        const skn = lineItem?.sku;
        if (!skn) continue;

        /* ================================
           PRODUCT → USER
        ================================= */
        const { data: product } = await supabase
          .from("products")
          .select("id, user_id")
          .eq("skn", skn)
          .single();

        if (!product) continue;

        /* ================================
           ORDERS UPSERT
        ================================= */
        await supabase.from("orders").upsert({
          user_id: product.user_id,
          product_id: product.id,
          etsy_order_id: payment.order_id,
          order_number: order.order_id,
          product_name: lineItem.title,
          quantity: lineItem.quantity,
          unit_price: payment.amount.value / 100,
          total_price: payment.amount.value / 100,
          status: "paid",
          fulfillment_status: "unfulfilled"
        });

        /* ================================
           PAYMENTS UPSERT
        ================================= */
        await supabase.from("payments").upsert({
          provider: "etsy",
          user_id: product.user_id,
          order_id: payment.order_id,
          external_payment_id: payment.payment_id,
          amount: payment.amount.value / 100,
          currency: payment.amount.currency || "USD",
          status: payment.status,
          payment_date: payment.create_date
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

  } catch (err) {
    console.error("❌ Sync error:", err);
    return new Response(
      JSON.stringify({ error: "SYNC_FAILED" }),
      { status: 500 }
    );
  }
});

/* ======================================================
   ETSY TOKEN REFRESH
====================================================== */
async function refreshEtsyToken(supabase: any, integration: any) {
  if (
    integration.expires_at &&
    new Date(integration.expires_at) > new Date()
  ) {
    return integration.access_token;
  }

  const res = await fetch(
    "https://api.etsy.com/v3/public/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: integration.api_key,
        refresh_token: integration.refresh_token
      })
    }
  );

  if (!res.ok) throw new Error("ETSY_TOKEN_REFRESH_FAILED");

  const data = await res.json();

  await supabase
    .from("integrations")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000)
    })
    .eq("id", integration.id);

  return data.access_token;
}
