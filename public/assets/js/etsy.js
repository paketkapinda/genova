// Etsy shops management
import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';

export async function loadEtsyShops() {
  const container = document.getElementById('etsy-shops-list');
  if (!container) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('etsy_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="settings-empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <div class="settings-empty-state-title">No Etsy shops connected</div>
          <div class="settings-empty-state-description">Connect your first Etsy shop to get started</div>
        </div>
      `;
      return;
    }

    container.innerHTML = data.map(shop => `
      <div class="settings-list-item">
        <div class="settings-list-item-info">
          <div class="settings-list-item-name">${shop.shop_display_name || shop.shop_name || 'Unnamed Shop'}</div>
          <div class="settings-list-item-desc">
            ${shop.shop_id} · ${shop.is_active ? 'Active' : 'Inactive'}
            ${shop.created_at ? `· Connected ${formatDate(shop.created_at)}` : ''}
          </div>
        </div>
        <div class="settings-list-item-actions">
          <button class="settings-btn settings-btn-outline" onclick="syncEtsyShop('${shop.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Sync
          </button>
          <button class="settings-btn settings-btn-danger" onclick="removeEtsyShop('${shop.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading Etsy shops:', error);
    container.innerHTML = '<p class="text-sm text-red-300">Error loading Etsy shops</p>';
  }
}

export function initEtsyConnect() {
  const btnConnect = document.getElementById('btn-connect-etsy');
  if (!btnConnect) return;

  btnConnect.addEventListener('click', async () => {
    try {
      showNotification('Redirecting to Etsy authentication...', 'info');
      
      // Edge Function'ı çağır
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/etsy-auth-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to get auth URL');
      
      const { authUrl } = await response.json();
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Error connecting Etsy:', error);
      showNotification('Error connecting to Etsy', 'error');
    }
  });
}

// Sync Etsy shop
window.syncEtsyShop = async (shopId) => {
  try {
    showNotification('Syncing Etsy shop...', 'info');
    
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch('/api/sync-etsy-orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ shop_id: shopId })
    });

    if (!response.ok) throw new Error('Sync failed');
    
    const result = await response.json();
    showNotification(`Synced ${result.synced} orders from Etsy`, 'success');
  } catch (error) {
    console.error('Error syncing Etsy shop:', error);
    showNotification('Error syncing Etsy shop', 'error');
  }
};

// Remove Etsy shop
window.removeEtsyShop = async (shopId) => {
  if (!confirm('Are you sure you want to remove this Etsy shop?')) {
    return;
  }

  try {
    const { error } = await supabase
      .from('etsy_accounts')
      .delete()
      .eq('id', shopId);

    if (error) throw error;

    showNotification('Etsy shop removed successfully', 'success');
    loadEtsyShops();
  } catch (error) {
    console.error('Error removing Etsy shop:', error);
    showNotification('Error removing Etsy shop', 'error');
  }
};

// Initialize
if (document.getElementById('etsy-shops-list')) {
  loadEtsyShops();
  initEtsyConnect();
}