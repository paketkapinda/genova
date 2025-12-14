/* =====================================================
   AI Top Seller Enhanced (CLEAN & FINAL)
   ===================================================== */

import { supabase } from './supabaseClient.js';

/* =========================
   NOTIFICATION
========================= */
function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background: ${
      type === 'success' ? '#10b981' :
      type === 'error'   ? '#ef4444' :
      type === 'warning' ? '#f59e0b' : '#3b82f6'
    };
    color: white;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

/* =========================
   LOADING
========================= */
function showLoading() {
  const el = document.createElement('div');
  el.id = 'analysis-loading';
  el.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    color: white;
    font-size: 1.2rem;
  `;
  el.innerHTML = `🔍 Analyzing Etsy Top Sellers...`;
  document.body.appendChild(el);
}

function hideLoading() {
  document.getElementById('analysis-loading')?.remove();
}

/* =========================
   MAIN ANALYZE FUNCTION
========================= */
async function analyzeTopSellers() {
  try {
    showLoading();
    showNotification('Analyzing top sellers...', 'info');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not logged in');

    // 🔹 MOCK DATA (sonra Edge Function’a bağlanır)
    const result = generateMockAnalysis();

    await saveAnalysisToDatabase(result, user.id);

    hideLoading();
    showNotification('Analysis completed', 'success');

    showResults(result);

  } catch (err) {
    hideLoading();
    console.error(err);
    showNotification(err.message, 'error');
  }
}

/* =========================
   MOCK ANALYSIS
========================= */
function generateMockAnalysis() {
  return {
    trend_scores: [
      { id: '1', title: 'Personalized Mug', score: 92, sales: 245 },
      { id: '2', title: 'Minimal T-Shirt', score: 88, sales: 190 },
      { id: '3', title: 'Pet Portrait', score: 85, sales: 155 },
      { id: '4', title: 'Vintage Poster', score: 79, sales: 132 }
    ]
  };
}

/* =========================
   SAVE TO SUPABASE
========================= */
async function saveAnalysisToDatabase(analysis, userId) {
  const { error } = await supabase
    .from('top_seller_analysis')
    .insert({
      user_id: userId,
      trend_scores: analysis.trend_scores,
      created_at: new Date().toISOString()
    });

  if (error) throw error;
}

/* =========================
   UI RENDER
========================= */
function showResults(data) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; inset: 0;
    background: rgba(0,0,0,.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="background:white;padding:2rem;border-radius:12px;max-width:600px;width:90%">
      <h2>🔥 Top Seller Analysis</h2>
      ${data.trend_scores.map(p => `
        <div style="margin:1rem 0;padding:1rem;border:1px solid #eee;border-radius:8px">
          <strong>${p.title}</strong><br>
          Trend Score: ${p.score}%<br>
          Monthly Sales: ${p.sales}
        </div>
      `).join('')}
      <button id="closeModal" style="margin-top:1rem">Close</button>
    </div>
  `;

  modal.querySelector('#closeModal').onclick = () => modal.remove();
  document.body.appendChild(modal);
}

/* =========================
   EXPORT TO WINDOW
========================= */
window.analyzeTopSellers = analyzeTopSellers;
