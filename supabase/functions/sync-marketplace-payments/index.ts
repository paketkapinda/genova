import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ======================================================
   CORS HEADERS
====================================================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  /* ================================
     PREFLIGHT (ZORUNLU)
  ================================= */
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
      status: 200,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: integrations, error } = await supabase
      .from("integrations")
      .select("*")
      .eq("provider", "etsy")
      .eq("is_active", true);

    if (error) throw error;

    for (const integration of integrations) {
      const token = await refreshEtsyToken(supabase, integration);

      const res = await fetch(
        `https://api.etsy.com/v3/application/shops/${integration.shop_id}/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) continue;

      const json = await res.json();
      const payments = json.results || [];

      for (const payment of payments) {
        if (!payment.order_id) continue;

        const orderRes = await fetch(
          `https://api.etsy.com/v3/application/shops/${integration.shop_id}/orders/${payment.order_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!orderRes.ok) continue;

        const orderJson = await orderRes.json();
        const order = orderJson.results?.[0];
        if (!order) continue;

        const item = order.line_items?.[0];
        const skn = item?.sku;
        if (!skn) continue;

        const { data: product } = await supabase
          .from("products")
          .select("id, user_id")
          .eq("skn", skn)
          .single();

        if (!product) continue;

        await supabase.from("payments").upsert({
          provider: "etsy",
          user_id: product.user_id,
          order_id: payment.order_id,
          external_payment_id: payment.payment_id,
          amount: payment.amount.value / 100,
          currency: payment.amount.currency || "USD",
          status: payment.status,
          payment_date: payment.create_date,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("❌ Edge error:", err);

    return new Response(
      JSON.stringify({ error: "SYNC_FAILED" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
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
        refresh_token: integration.refresh_token,
      }),
    }
  );

  if (!res.ok) throw new Error("ETSY_TOKEN_REFRESH_FAILED");

  const data = await res.json();

  await supabase
    .from("integrations")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000),
    })
    .eq("id", integration.id);

  return data.access_token;
}
