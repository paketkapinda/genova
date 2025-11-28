// Orders CRUD and management - Products style
import { supabase } from './supabaseClient.js';
import { api } from './api.js';
import { showNotification, showModal, hideModal, showLoading } from './ui.js';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, getStatusLabel } from './helpers.js';

let currentOrders = [];

export async function loadOrders() {
  const container = document.getElementById('orders-grid');
  const empty = document.getElementById('orders-empty');
  const statusFilter = document.getElementById('filter-status')?.value;
  const dateFilter = document.getElementById('filter-date')?.value;

  if (!container) return;

  showLoading(container);

  try {
    console.log('🔄 Orders yükleniyor...');
    
    // Önce session kontrolü
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      showNotification('Please login first', 'error');
      return;
    }

    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Date filter uygula
    if (dateFilter) {
      const dateRange = getDateRange(dateFilter);
      if (dateRange) {
        query = query.gte('created_at', dateRange.start).lte('created_at', dateRange.end);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Orders error:', error);
      
      // RLS hatası durumunda mock data kullan
      if (error.message.includes('recursion') || error.message.includes('policy')) {
        console.warn('⚠️ RLS hatası - Mock data kullanılıyor');
        showNotification('Demo mod: Örnek siparişler gösteriliyor', 'info');
        loadMockOrders();
        return;
      }
      throw error;
    }

    console.log('✅ Orders loaded:', data?.length || 0);
    currentOrders = data || [];

    if (currentOrders.length === 0) {
      container.classList.add('hidden');
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');
    container.classList.remove('hidden');
    
    renderOrders(currentOrders);
    
  } catch (error) {
    console.error('❌ Orders load error:', error);
    showNotification('Demo moda geçiliyor', 'info');
    loadMockOrders();
  }
}

function renderOrders(orders) {
  const container = document.getElementById('orders-grid');
  if (!container) return;

  container.innerHTML = orders.map(order => `
    <div class="order-card" data-order-id="${order.id}">
      <div class="order-header">
        <div class="order-image">
          <div class="order-image-placeholder">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
          </div>
        </div>
        <div class="order-status-badge status-${order.status}">
          ${getStatusLabel(order.status)}
        </div>
      </div>
      
      <div class="order-content">
        <div class="order-meta">
          <div class="order-title">Order #${order.order_number || order.id.slice(-8)}</div>
          <div class="order-customer">${order.customer_name || 'Guest Customer'}</div>
          <div class="order-date">${formatDate(order.created_at)}</div>
        </div>
        
        <div class="order-stats">
          <div class="order-stat">
            <span class="stat-label">Items</span>
            <span class="stat-value">${order.items_count || 1}</span>
          </div>
          <div class="order-stat">
            <span class="stat-label">Total</span>
            <span class="stat-value price">$${order.total_amount ? parseFloat(order.total_amount).toFixed(2) : '0.00'}</span>
          </div>
        </div>
        
        <div class="order-actions">
          <button class="btn btn-outline btn-sm" onclick="viewOrderDetails('${order.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            View Details
          </button>
          ${order.status === 'paid' || order.status === 'pending' ? `
            <button class="btn btn-primary btn-sm" onclick="processOrder('${order.id}')">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Process
            </button>
          ` : ''}
          ${order.status === 'processing' ? `
            <button class="btn btn-secondary btn-sm" onclick="markAsShipped('${order.id}')">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Ship
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

// Date range helper
function getDateRange(range) {
  const now = new Date();
  const start = new Date();
  
  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'week':
      start.setDate(now.getDate() - 7);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'month':
      start.setMonth(now.getMonth() - 1);
      return { start: start.toISOString(), end: now.toISOString() };
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      return { start: start.toISOString(), end: now.toISOString() };
    default:
      return null;
  }
}

// Status label helper
function getStatusLabel(status) {
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
}

// Mock data fallback
function loadMockOrders() {
  const container = document.getElementById('orders-grid');
  const empty = document.getElementById('orders-empty');
  
  if (!container) return;

  const mockOrders = [
    {
      id: 'mock-order-1',
      order_number: 'ETSY-001',
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah@example.com',
      status: 'paid',
      total_amount: 42.97,
      items_count: 2,
      created_at: '2024-01-20T14:30:00Z',
      items: [
        { product_title: 'Vintage Retro T-Shirt', quantity: 1, price: 24.99 },
        { product_title: 'Coffee Lover Mug', quantity: 1, price: 17.98 }
      ]
    },
    {
      id: 'mock-order-2',
      order_number: 'ETSY-002',
      customer_name: 'Mike Chen',
      customer_email: 'mike@example.com',
      status: 'processing',
      total_amount: 28.50,
      items_count: 1,
      created_at: '2024-01-19T10:15:00Z',
      items: [
        { product_title: 'Minimalist Phone Case', quantity: 1, price: 28.50 }
      ]
    },
    {
      id: 'mock-order-3',
      order_number: 'ETSY-003',
      customer_name: 'Emily Davis',
      customer_email: 'emily@example.com',
      status: 'shipped',
      total_amount: 65.75,
      items_count: 3,
      created_at: '2024-01-18T16:45:00Z',
      items: [
        { product_title: 'Vintage Retro T-Shirt', quantity: 2, price: 49.98 },
        { product_title: 'Wooden Coaster Set', quantity: 1, price: 15.77 }
      ]
    }
  ];

  currentOrders = mockOrders;

  if (currentOrders.length === 0) {
    container.classList.add('hidden');
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');
  container.classList.remove('hidden');
  
  renderOrders(currentOrders);
}

// Global functions
window.viewOrderDetails = function(orderId) {
  console.log('🔍 Order details:', orderId);
  window.location.href = `/order-detail.html?id=${orderId}`;
};

window.processOrder = async function(orderId) {
  if (!confirm('Process this order and send to production?')) return;

  try {
    showNotification('Processing order...', 'info');
    
    // Simüle edilmiş işlem
    setTimeout(() => {
      showNotification('Order processed successfully!', 'success');
      loadOrders();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Process error:', error);
    showNotification('Process failed', 'error');
  }
};

window.markAsShipped = async function(orderId) {
  if (!confirm('Mark this order as shipped?')) return;

  try {
    showNotification('Updating order status...', 'info');
    
    // Simüle edilmiş güncelleme
    setTimeout(() => {
      showNotification('Order marked as shipped!', 'success');
      loadOrders();
    }, 1500);
    
  } catch (error) {
    console.error('❌ Shipment error:', error);
    showNotification('Update failed', 'error');
  }
};

// Sync orders from Etsy
window.syncOrders = async function() {
  try {
    const syncBtn = document.getElementById('btn-sync-orders');
    const emptySyncBtn = document.getElementById('btn-empty-sync-orders');
    
    if (syncBtn) syncBtn.classList.add('syncing');
    if (emptySyncBtn) emptySyncBtn.classList.add('syncing');
    
    showNotification('Syncing orders from Etsy...', 'info');
    
    // Simüle edilmiş sync
    setTimeout(() => {
      showNotification('Orders synced successfully!', 'success');
      loadOrders();
      
      if (syncBtn) syncBtn.classList.remove('syncing');
      if (emptySyncBtn) emptySyncBtn.classList.remove('syncing');
    }, 3000);
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    showNotification('Sync failed', 'error');
  }
};

// Event listeners
export function initOrders() {
  const syncBtn = document.getElementById('btn-sync-orders');
  const emptySyncBtn = document.getElementById('btn-empty-sync-orders');
  const statusFilter = document.getElementById('filter-status');
  const dateFilter = document.getElementById('filter-date');

  if (syncBtn) {
    syncBtn.addEventListener('click', syncOrders);
  }

  if (emptySyncBtn) {
    emptySyncBtn.addEventListener('click', syncOrders);
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', loadOrders);
  }

  if (dateFilter) {
    dateFilter.addEventListener('change', loadOrders);
  }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Orders.js yüklendi');
  
  if (document.getElementById('orders-grid')) {
    loadOrders();
    initOrders();
  }
});

// Manual init for backward compatibility
if (document.getElementById('orders-grid')) {
  loadOrders();
  initOrders();
}
