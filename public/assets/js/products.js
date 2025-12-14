/* =====================================================
   PartnerShop – Products Module (CLEAN & SAFE)
===================================================== */

import { supabase } from './supabaseClient.js';

/* -----------------------------
   GLOBAL STATE
-------------------------------- */
let currentUser = null;
let currentProfile = null;
let isLoading = false;

/* -----------------------------
   INIT
-------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserAndProfile();
  bindUIEvents();
});

/* -----------------------------
   LOAD USER & PROFILE
-------------------------------- */
async function loadUserAndProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('User not logged in');
    return;
  }

  currentUser = user;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, subscription_type')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Profile load failed', error);
    return;
  }

  currentProfile = data;
}

/* -----------------------------
   UI EVENTS
-------------------------------- */
function bindUIEvents() {
  const analyzeBtn = document.getElementById('btn-analyze-top-sellers');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', analyzeTopSellers);
  }
}

/* -----------------------------
   TOP SELLER ANALYSIS
-------------------------------- */
async function analyzeTopSellers() {
  if (!currentProfile || isLoading) return;

  isLoading = true;
  lockUI(true);

  try {
    notify('Analyzing Etsy top sellers...', 'info');

    const { data, error } = await supabase.functions.invoke(
      'etsy-top-sellers',
      {
        body: {
          user_id: currentProfile.id
        }
      }
    );

    if (error) throw error;

    renderTopSellerResults(data?.trend_scores || []);

  } catch (err) {
    console.error(err);
    notify('Top seller analysis failed', 'error');
  } finally {
    isLoading = false;
    lockUI(false);
  }
}

/* -----------------------------
   RENDER RESULTS
-------------------------------- */
function renderTopSellerResults(products = []) {
  const container = document.getElementById('top-seller-results');
  if (!container) return;

  if (!products.length) {
    container.innerHTML = `<p>No results found.</p>`;
    return;
  }

  container.innerHTML = products.map(p => `
    <div class="product-card">
      <h4>${p.listing_title}</h4>
      <p>Monthly sales: ${p.monthly_sales_estimate}</p>
      <p>Trend score: ${p.trend_score}%</p>
      <button data-id="${p.listing_id}" class="btn-create">
        Create Product
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.btn-create').forEach(btn => {
    btn.addEventListener('click', () => {
      createProduct(btn.dataset.id);
    });
  });
}

/* -----------------------------
   CREATE PRODUCT
-------------------------------- */
async function createProduct(listingId) {
  if (!currentProfile || isLoading) return;

  isLoading = true;
  lockUI(true);

  try {
    notify('Creating product...', 'info');

    const { error } = await supabase.functions.invoke(
      'create-product-from-etsy',
      {
        body: {
          user_id: currentProfile.id,
          listing_id: listingId
        }
      }
    );

    if (error) throw error;

    notify('Product created successfully', 'success');

  } catch (err) {
    console.error(err);
    notify('Product creation failed', 'error');
  } finally {
    isLoading = false;
    lockUI(false);
  }
}

/* -----------------------------
   UI HELPERS
-------------------------------- */
function lockUI(state) {
  document.body.classList.toggle('loading', state);
}

function notify(message, type = 'info') {
  console.log(`[${type.toUpperCase()}]`, message);
}
