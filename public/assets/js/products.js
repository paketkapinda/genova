/* =====================================================
   PRODUCTS – Single Source of Truth
   Role: Frontend Orchestrator (Edge Functions Only)
===================================================== */

import { supabase } from './supabaseClient.js';

/* -----------------------------------------------------
   GLOBAL STATE
----------------------------------------------------- */
let currentUser = null;
let currentProfile = null;
let isLoading = false;

/* -----------------------------------------------------
   INIT
----------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await initUser();
  bindUI();
});

/* -----------------------------------------------------
   USER / PROFILE
----------------------------------------------------- */
async function initUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    notify('Please login', 'error');
    return;
  }

  currentUser = user;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, subscription_type')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error(error);
    notify('Profile load failed', 'error');
    return;
  }

  currentProfile = data;
}

/* -----------------------------------------------------
   UI BINDINGS
----------------------------------------------------- */
function bindUI() {
  document
    .getElementById('btn-analyze-top-sellers')
    ?.addEventListener('click', loadTopSellers);

  document
    .getElementById('btn-new-product')
    ?.addEventListener('click', createEmptyProductCard);
}

/* -----------------------------------------------------
   TOP SELLERS (EDGE)
----------------------------------------------------- */
async function loadTopSellers() {
  if (isLoading) return;
  isLoading = true;

  notify('Analyzing top sellers...', 'info');

  try {
    const { data, error } = await supabase.functions.invoke(
      'analyze-top-sellers',
      {
        body: { user_id: currentProfile.id }
      }
    );

    if (error) throw error;

    renderProducts(data.trend_scores);

  } catch (err) {
    console.error(err);
    notify('Top seller analysis failed', 'error');
  } finally {
    isLoading = false;
  }
}

/* -----------------------------------------------------
   RENDER PRODUCT CARDS
----------------------------------------------------- */
function renderProducts(products = []) {
  const container = document.getElementById('products-container');
  if (!container) return;

  container.innerHTML = products.map(p => `
    <div class="product-card">
      <h4>${p.listing_title}</h4>
      <p>Monthly Sales: ${p.monthly_sales_estimate}</p>
      <p>Trend: ${p.trend_score}%</p>

      <button onclick="window.generateDesign('${p.listing_id}')">
        Generate Design
      </button>

      <button onclick="window.publishProduct('${p.listing_id}')">
        Publish
      </button>
    </div>
  `).join('');
}

/* -----------------------------------------------------
   GENERATE DESIGN (EDGE)
----------------------------------------------------- */
window.generateDesign = async (listingId) => {
  if (isLoading) return;
  isLoading = true;

  notify('Generating design...', 'info');

  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-design-variations',
      {
        body: {
          user_id: currentProfile.id,
          listing_id: listingId,
          variations: 3
        }
      }
    );

    if (error) throw error;

    notify('Designs generated', 'success');

  } catch (err) {
    console.error(err);
    notify('Design generation failed', 'error');
  } finally {
    isLoading = false;
  }
};

/* -----------------------------------------------------
   PUBLISH PRODUCT (EDGE)
----------------------------------------------------- */
window.publishProduct = async (listingId) => {
  if (isLoading) return;
  isLoading = true;

  notify('Publishing product...', 'info');

  try {
    const { data, error } = await supabase.functions.invoke(
      'publish-to-marketplace',
      {
        body: {
          user_id: currentProfile.id,
          listing_id: listingId
        }
      }
    );

    if (error) throw error;

    notify('Product published 🎉', 'success');

  } catch (err) {
    console.error(err);
    notify('Publish failed', 'error');
  } finally {
    isLoading = false;
  }
};

/* -----------------------------------------------------
   MANUAL PRODUCT
----------------------------------------------------- */
function createEmptyProductCard() {
  notify('Manual product creation coming soon', 'info');
}

/* -----------------------------------------------------
   UI HELPERS
----------------------------------------------------- */
function notify(message, type = 'info') {
  console.log(`[${type.toUpperCase()}]`, message);
}
