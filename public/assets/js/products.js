/* =====================================================
   PRODUCTS.JS – EDGE FUNCTION ORCHESTRATOR (FINAL)
   ===================================================== */

import { supabase } from './supabaseClient.js'

/* -----------------------------
   STATE
-------------------------------- */
let currentUser = null
let session = null
let isLoading = false

/* -----------------------------
   INIT
-------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  await initAuth()
  bindUI()
})

async function initAuth() {
  const { data } = await supabase.auth.getSession()
  session = data.session
  currentUser = session?.user || null

  if (!currentUser) {
    console.warn('No active session')
  }
}

/* -----------------------------
   UI BINDINGS
-------------------------------- */
function bindUI() {
  const btn = document.getElementById('analyzeTopSellers')
  if (btn) {
    btn.addEventListener('click', loadTopSellers)
  }
}

/* -----------------------------
   EDGE CALL HELPER
-------------------------------- */
async function callEdgeFunction(name, body = {}) {
  if (!session?.access_token) {
    throw new Error('User not authenticated')
  }

  const res = await fetch(
    `https://YOUR_PROJECT_ID.functions.supabase.co/${name}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }
  )

  const text = await res.text()
  let json

  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON response: ${text}`)
  }

  if (!res.ok) {
    throw new Error(json.error || 'Edge Function failed')
  }

  return json
}

/* -----------------------------
   TOP SELLERS
-------------------------------- */
async function loadTopSellers() {
  if (isLoading) return
  isLoading = true
  lockUI(true)

  try {
    console.log('🔄 Analyzing top sellers...')

    const result = await callEdgeFunction('analyze-top-sellers')

    if (!result.success) {
      throw new Error('Analyze failed')
    }

    renderTopSellers(result.trend_scores || [])
  } catch (err) {
    console.error('Top seller error:', err)
    alert('Top sellers could not be loaded')
  } finally {
    isLoading = false
    lockUI(false)
  }
}

/* -----------------------------
   RENDER CARDS
-------------------------------- */
function renderTopSellers(items) {
  const container = document.getElementById('products-grid')
  if (!container) return

  if (!items.length) {
    container.innerHTML = '<p>No results found.</p>'
    return
  }

  container.innerHTML = items.map(item => `
    <div class="product-card">
      <h4>${item.title}</h4>

      <p>
        Trend Score: <b>${item.trend_score}</b><br/>
        Est. Monthly Sales: ${item.monthly_sales_estimate}
      </p>

      <div class="actions">
        <button data-id="${item.listing_id}" class="btn-generate">
          Generate Design
        </button>
        <button data-id="${item.listing_id}" class="btn-publish">
          Publish
        </button>
      </div>
    </div>
  `).join('')

  bindCardActions()
}

/* -----------------------------
   CARD ACTIONS
-------------------------------- */
function bindCardActions() {
  document.querySelectorAll('.btn-generate').forEach(btn => {
    btn.addEventListener('click', () => {
      generateDesign(btn.dataset.id)
    })
  })

  document.querySelectorAll('.btn-publish').forEach(btn => {
    btn.addEventListener('click', () => {
      publishProduct(btn.dataset.id)
    })
  })
}

/* -----------------------------
   GENERATE DESIGN
-------------------------------- */
async function generateDesign(listingId) {
  if (isLoading) return
  isLoading = true
  lockUI(true)

  try {
    console.log('🎨 Generating design for', listingId)

    const result = await callEdgeFunction(
      'generate-design-variations',
      {
        listing_id: listingId,
        variations: 4,
      }
    )

    alert(`Designs generated: ${result.count || 0}`)
  } catch (err) {
    console.error('Design error:', err)
    alert('Design generation failed')
  } finally {
    isLoading = false
    lockUI(false)
  }
}

/* -----------------------------
   PUBLISH PRODUCT
-------------------------------- */
async function publishProduct(listingId) {
  if (isLoading) return
  isLoading = true
  lockUI(true)

  try {
    console.log('🚀 Publishing product', listingId)

    const result = await callEdgeFunction(
      'publish-to-marketplace',
      {
        listing_id: listingId,
        price_strategy: '1-dollar-under',
      }
    )

    alert('Product published successfully')
  } catch (err) {
    console.error('Publish error:', err)
    alert('Publish failed')
  } finally {
    isLoading = false
    lockUI(false)
  }
}

/* -----------------------------
   UI HELPERS
-------------------------------- */
function lockUI(state) {
  document.body.classList.toggle('loading', state)
}
