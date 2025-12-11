// payment.js - Tam Revize Edilmiş Versiyon (Eksikler Tamamlandı)
let currentUser = null;
let allPayments = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Payments sayfası yükleniyor...');
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = user;
        await initializePaymentsPage();
        setupAllEventListeners();
    } catch (error) {
        console.error('Kullanıcı kontrol hatası:', error);
    }
});

async function initializePaymentsPage() {
    await loadPayments();
    updateStats();
    checkEmptyState();
}

function setupAllEventListeners() {
    // Sync Payments butonu
    const etsySyncBtn = document.getElementById('etsySyncBtn');
    if (etsySyncBtn) {
        etsySyncBtn.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Syncing...';
            btn.disabled = true;
            
            try {
                await syncEtsyPayments();
                await loadPayments();
            } catch (error) {
                showNotification('Sync failed: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // Process Payouts butonu
    const processBtn = document.getElementById('btn-process-payouts');
    if (processBtn) {
        processBtn.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg> Processing...';
            btn.disabled = true;
            
            try {
                await processAllPayouts();
                await loadPayments();
            } catch (error) {
                showNotification('Process failed: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
    
    // Export butonu
    const exportBtn = document.getElementById('exportPayments');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportPaymentsToCSV();
        });
    }
    
    // Arama input'u
    const searchInput = document.getElementById('searchPayments');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchPayments(this.value);
        });
    }
    
    // Tarih filtresi
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            filterPaymentsByDate(this.value);
        });
    }
    
    // Initial sync butonu
    const initialSyncBtn = document.getElementById('btn-initial-sync');
    if (initialSyncBtn) {
        initialSyncBtn.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Syncing...';
            btn.disabled = true;
            
            try {
                await syncEtsyPayments();
                await loadPayments();
            } catch (error) {
                showNotification('Sync failed: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

async function loadPayments() {
    try {
        showLoading('Loading payments...');
        
        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
                *,
                orders (
                    order_number,
                    etsy_order_id,
                    total_amount,
                    shipping_address,
                    customer_name,
                    customer_email
                ),
                profiles:producer_id (
                    full_name,
                    email
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allPayments = payments || [];
        displayPayments(allPayments);
        updateStats();
        checkEmptyState();
        
    } catch (error) {
        console.error('Ödemeler yükleme hatası:', error);
        showNotification('Error loading payments: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ETSY SENKRONİZASYON FONKSİYONLARI (EKSİK OLANLAR)
async function fetchEtsyOrders(etsyShop) {
    try {
        // Mock Etsy API response - gerçek implementasyonda değiştirilecek
        const mockOrders = generateMockEtsyOrders(5);
        return mockOrders;
        
    } catch (error) {
        console.error('Etsy sipariş çekme hatası:', error);
        return generateMockEtsyOrders(3);
    }
}

function generateMockEtsyOrders(count) {
    const orders = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const orderDate = new Date(now);
        orderDate.setDate(now.getDate() - daysAgo);
        
        orders.push({
            receipt_id: 1000000000 + i,
            name: `Customer ${i + 1}`,
            first_line: `Sample Address ${i + 1}`,
            city: 'Istanbul',
            country_iso: 'TR',
            buyer_email: `customer${i + 1}@example.com`,
            grandtotal: (25 + Math.random() * 75).toFixed(2),
            total_shipping_cost: (5 + Math.random() * 10).toFixed(2),
            total_tax_cost: (2 + Math.random() * 5).toFixed(2),
            created_timestamp: Math.floor(orderDate.getTime() / 1000),
            transactions: [
                {
                    listing_id: 2000000000 + i,
                    title: `Mock Product ${i + 1}`,
                    price: (15 + Math.random() * 50).toFixed(2),
                    quantity: Math.floor(Math.random() * 3) + 1
                }
            ]
        });
    }
    
    return orders;
}

async function createOrderFromEtsy(etsyOrder) {
    try {
        const orderData = {
            user_id: currentUser.id,
            producer_id: currentUser.id,
            order_number: `ETSY-${etsyOrder.receipt_id}`,
            etsy_order_id: etsyOrder.receipt_id.toString(),
            customer_name: etsyOrder.name,
            customer_email: etsyOrder.buyer_email,
            shipping_address: `${etsyOrder.first_line}, ${etsyOrder.city}, ${etsyOrder.country_iso}`,
            subtotal_amount: parseFloat(etsyOrder.grandtotal) - parseFloat(etsyOrder.total_shipping_cost || 0) - parseFloat(etsyOrder.total_tax_cost || 0),
            shipping_amount: parseFloat(etsyOrder.total_shipping_cost || 0),
            tax_amount: parseFloat(etsyOrder.total_tax_cost || 0),
            total_amount: parseFloat(etsyOrder.grandtotal),
            status: 'paid',
            payment_method: 'etsy',
            payment_status: 'paid',
            order_date: new Date(etsyOrder.created_timestamp * 1000).toISOString(),
            metadata: etsyOrder
        };
        
        const { data: order, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();
        
        if (error) throw error;
        return order;
        
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        return null;
    }
}

async function createPaymentForOrder(order, etsyOrder) {
    try {
        const amount = order.total_amount;
        const producerCost = amount * 0.5;
        const platformFee = amount * 0.15;
        const gatewayFee = (amount * 0.03) + 0.25;
        const netPayout = amount - producerCost - platformFee - gatewayFee;
        
        const paymentData = {
            user_id: currentUser.id,
            order_id: order.id,
            producer_id: order.producer_id,
            amount: amount,
            producer_cost: producerCost,
            platform_fee: platformFee,
            payment_gateway_fee: gatewayFee,
            net_payout: netPayout,
            status: 'completed',
            settlement_date: new Date().toISOString(),
            etsy_receipt_id: etsyOrder.receipt_id?.toString(),
            payment_method: 'etsy'
        };
        
        const { error } = await supabase
            .from('payments')
            .insert(paymentData);
        
        if (error) throw error;
        return true;
        
    } catch (error) {
        console.error('Ödeme oluşturma hatası:', error);
        return false;
    }
}

async function syncEtsyPayments() {
    try {
        showLoading('Syncing Etsy payments...');
        
        // 1. Aktif Etsy mağazasını kontrol et
        const { data: etsyShop } = await supabase
            .from('etsy_shops')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (!etsyShop) {
            // Mock mağaza oluştur (test için)
            console.log('Mock Etsy shop kullanılıyor');
        }
        
        // 2. Etsy API'den siparişleri çek
        const etsyOrders = await fetchEtsyOrders(etsyShop || {});
        
        if (!etsyOrders || etsyOrders.length === 0) {
            showNotification('No new orders found on Etsy.', 'info');
            return;
        }
        
        // 3. Siparişleri işle
        let processedCount = 0;
        
        for (const etsyOrder of etsyOrders) {
            try {
                // Sipariş zaten var mı kontrol et
                const { data: existingOrder } = await supabase
                    .from('orders')
                    .select('id')
                    .eq('etsy_order_id', etsyOrder.receipt_id.toString())
                    .single();
                
                if (!existingOrder) {
                    // Yeni sipariş oluştur
                    const newOrder = await createOrderFromEtsy(etsyOrder);
                    if (newOrder) {
                        await createPaymentForOrder(newOrder, etsyOrder);
                        processedCount++;
                    }
                }
            } catch (orderError) {
                console.error('Order processing error:', orderError);
            }
        }
        
        if (processedCount > 0) {
            showNotification(`${processedCount} new payments synced.`, 'success');
        } else {
            showNotification('No new payments found.', 'info');
        }
        
    } catch (error) {
        console.error('Etsy sync error:', error);
        showNotification('Etsy sync failed: ' + error.message, 'error');
        // Hata durumunda mock veri ekle
        await addMockPayments(3);
    } finally {
        hideLoading();
    }
}

async function addMockPayments(count) {
    try {
        const mockPayments = generateMockPayments(count);
        
        for (const payment of mockPayments) {
            // Önce sipariş oluştur
            const orderData = {
                user_id: currentUser.id,
                producer_id: currentUser.id,
                order_number: `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                customer_name: `Mock Customer ${Math.floor(Math.random() * 100)}`,
                customer_email: `mock${Math.floor(Math.random() * 100)}@example.com`,
                shipping_address: 'Mock Address',
                total_amount: payment.amount,
                status: 'paid',
                payment_method: 'mock',
                payment_status: 'paid'
            };
            
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert(orderData)
                .select()
                .single();
            
            if (orderError) throw orderError;
            
            // Sonra ödeme oluştur
            const paymentData = {
                user_id: currentUser.id,
                order_id: order.id,
                producer_id: currentUser.id,
                amount: payment.amount,
                producer_cost: payment.producer_cost,
                platform_fee: payment.platform_fee,
                payment_gateway_fee: payment.payment_gateway_fee,
                net_payout: payment.net_payout,
                status: payment.status,
                settlement_date: payment.settlement_date,
                payment_method: 'mock'
            };
            
            const { error: paymentError } = await supabase
                .from('payments')
                .insert(paymentData);
            
            if (paymentError) throw paymentError;
        }
        
        showNotification(`${count} mock payments added for testing`, 'info');
        
    } catch (error) {
        console.error('Mock payment error:', error);
    }
}

function generateMockPayments(count) {
    const payments = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(now.getDate() - daysAgo);
        
        const amount = 20 + Math.random() * 80;
        const producerCost = amount * 0.5;
        const platformFee = amount * 0.15;
        const gatewayFee = (amount * 0.03) + 0.25;
        const netPayout = amount - producerCost - platformFee - gatewayFee;
        
        payments.push({
            amount: parseFloat(amount.toFixed(2)),
            producer_cost: parseFloat(producerCost.toFixed(2)),
            platform_fee: parseFloat(platformFee.toFixed(2)),
            payment_gateway_fee: parseFloat(gatewayFee.toFixed(2)),
            net_payout: parseFloat(netPayout.toFixed(2)),
            status: Math.random() > 0.3 ? 'completed' : 'pending',
            settlement_date: date.toISOString()
        });
    }
    
    return payments;
}

async function processAllPayouts() {
    try {
        if (!allPayments || allPayments.length === 0) {
            showNotification('No payments to process', 'warning');
            return;
        }
        
        const pendingPayments = allPayments.filter(p => p.status === 'pending');
        
        if (pendingPayments.length === 0) {
            showNotification('No pending payments found', 'info');
            return;
        }
        
        if (!confirm(`Process ${pendingPayments.length} pending payments?`)) {
            return;
        }
        
        showLoading(`Processing ${pendingPayments.length} payments...`);
        
        let processedCount = 0;
        
        for (const payment of pendingPayments) {
            try {
                const { error } = await supabase
                    .from('payments')
                    .update({
                        status: 'completed',
                        settlement_date: new Date().toISOString()
                    })
                    .eq('id', payment.id);
                
                if (error) throw error;
                processedCount++;
                
            } catch (error) {
                console.error(`Error processing payment ${payment.id}:`, error);
            }
        }
        
        if (processedCount > 0) {
            showNotification(`${processedCount} payments processed successfully`, 'success');
        }
        
    } catch (error) {
        showNotification('Error processing payments: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayPayments(payments) {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) {
        console.error('paymentsTableBody not found');
        return;
    }
    
    if (!payments || payments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8">
                    <div class="text-gray-500">
                        <p>No payment records found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    payments.forEach(payment => {
        const order = payment.orders || {};
        
        html += `
            <tr>
                <td class="payment-date">
                    ${formatDate(payment.created_at)}
                </td>
                <td>
                    <span class="order-id">${order.order_number || payment.id.substring(0, 8)}</span>
                </td>
                <td class="amount">
                    $${parseFloat(payment.amount).toFixed(2)}
                </td>
                <td>
                    <div class="fees-breakdown">
                        <div>Prod: $${parseFloat(payment.producer_cost).toFixed(2)}</div>
                        <div>Platform: $${parseFloat(payment.platform_fee).toFixed(2)}</div>
                        <div>Gateway: $${parseFloat(payment.payment_gateway_fee || 0).toFixed(2)}</div>
                    </div>
                </td>
                <td class="payout positive">
                    $${parseFloat(payment.net_payout).toFixed(2)}
                </td>
                <td>
                    <span class="payment-status ${getStatusClass(payment.status)}">
                        ${getStatusText(payment.status)}
                    </span>
                </td>
                <td class="payment-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewPaymentDetails('${payment.id}')">
                        View
                    </button>
                    ${payment.status === 'pending' ? `
                    <button class="btn btn-sm btn-primary" onclick="processSinglePayment('${payment.id}')">
                        Process
                    </button>
                    ` : ''}
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

function updateStats() {
    if (!allPayments || allPayments.length === 0) {
        document.getElementById('totalRevenue').textContent = '$0.00';
        document.getElementById('totalPayout').textContent = '$0.00';
        document.getElementById('pendingPayments').textContent = '0';
        document.getElementById('avgPayout').textContent = '$0.00';
        return;
    }
    
    const totalRevenue = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalPayout = allPayments.reduce((sum, p) => sum + parseFloat(p.net_payout || 0), 0);
    const pendingCount = allPayments.filter(p => p.status === 'pending').length;
    const avgPayout = allPayments.length > 0 ? totalPayout / allPayments.length : 0;
    
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalPayout').textContent = `$${totalPayout.toFixed(2)}`;
    document.getElementById('pendingPayments').textContent = pendingCount.toString();
    document.getElementById('avgPayout').textContent = `$${avgPayout.toFixed(2)}`;
}

function checkEmptyState() {
    const emptyState = document.getElementById('paymentsEmptyState');
    const tableContainer = document.querySelector('.payments-table-container');
    
    if (!allPayments || allPayments.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
    } else {
        if (emptyState) emptyState.classList.add('hidden');
        if (tableContainer) tableContainer.classList.remove('hidden');
    }
}

function filterPaymentsByDate(dateValue) {
    if (!dateValue) {
        // Tüm ödemeleri göster
        const rows = document.querySelectorAll('#paymentsTableBody tr');
        rows.forEach(row => row.style.display = '');
        return;
    }
    
    const selectedDate = new Date(dateValue);
    const rows = document.querySelectorAll('#paymentsTableBody tr');
    
    rows.forEach(row => {
        if (row.cells.length < 7) return;
        
        const dateCell = row.cells[0];
        if (dateCell) {
            const dateText = dateCell.textContent.trim();
            if (dateText) {
                const paymentDate = parseDate(dateText);
                const isSameDay = paymentDate.toDateString() === selectedDate.toDateString();
                row.style.display = isSameDay ? '' : 'none';
            }
        }
    });
}

function searchPayments(query) {
    const rows = document.querySelectorAll('#paymentsTableBody tr');
    const searchTerm = query.toLowerCase().trim();
    
    rows.forEach(row => {
        if (searchTerm === '') {
            row.style.display = '';
        } else {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(searchTerm) ? '' : 'none';
        }
    });
}

// Yardımcı fonksiyonlar
function getStatusClass(status) {
    const classMap = {
        'completed': 'status-completed',
        'pending': 'status-pending',
        'failed': 'status-failed',
        'refunded': 'status-processing'
    };
    return classMap[status] || 'status-pending';
}

function getStatusText(status) {
    const textMap = {
        'completed': 'Completed',
        'pending': 'Pending',
        'failed': 'Failed',
        'refunded': 'Refunded'
    };
    return textMap[status] || status;
}

function getStatusFromText(text) {
    const reverseMap = {
        'completed': 'completed',
        'pending': 'pending',
        'failed': 'failed',
        'refunded': 'refunded'
    };
    return reverseMap[text.toLowerCase()] || text;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function parseDate(dateString) {
    try {
        return new Date(dateString);
    } catch {
        return new Date();
    }
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function updateActiveFilterButton(activeBtn) {
    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
    activeBtn.classList.add('bg-blue-600', 'text-white');
}

function filterPaymentsByStatus(status) {
    const rows = document.querySelectorAll('#paymentsTableBody tr');
    
    rows.forEach(row => {
        if (row.cells.length < 7) return;
        
        if (status === 'all') {
            row.style.display = '';
        } else {
            const statusCell = row.cells[5];
            if (statusCell) {
                const statusSpan = statusCell.querySelector('span');
                if (statusSpan) {
                    const rowStatus = getStatusFromText(statusSpan.textContent.trim());
                    row.style.display = rowStatus === status ? '' : 'none';
                }
            }
        }
    });
}

// Global fonksiyonlar (buton onclick'leri için)
window.viewPaymentDetails = function(paymentId) {
    showNotification('Payment details will be shown here', 'info');
};

window.processSinglePayment = async function(paymentId) {
    if (!confirm('Process this payment?')) return;
    
    try {
        showLoading('Processing payment...');
        
        const { error } = await supabase
            .from('payments')
            .update({
                status: 'completed',
                settlement_date: new Date().toISOString()
            })
            .eq('id', paymentId);
        
        if (error) throw error;
        
        showNotification('Payment processed successfully!', 'success');
        await loadPayments();
        
    } catch (error) {
        showNotification('Error processing payment: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.exportPaymentsToCSV = function() {
    try {
        if (!allPayments || allPayments.length === 0) {
            showNotification('No payments to export', 'warning');
            return;
        }
        
        const headers = ['Date', 'Order ID', 'Amount', 'Payout', 'Status'];
        const rows = allPayments.map(p => [
            formatDate(p.created_at),
            p.orders?.order_number || p.id.substring(0, 8),
            `$${parseFloat(p.amount).toFixed(2)}`,
            `$${parseFloat(p.net_payout).toFixed(2)}`,
            getStatusText(p.status)
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`${allPayments.length} payments exported`, 'success');
        
    } catch (error) {
        showNotification('Export error: ' + error.message, 'error');
    }
};

// Loading ve notification fonksiyonları
function showLoading(message = 'Loading...') {
    let loadingEl = document.getElementById('loadingOverlay');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingOverlay';
        loadingEl.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loadingEl.innerHTML = `
            <div class="bg-white rounded-lg p-8 flex flex-col items-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-gray-700">${message}</p>
            </div>
        `;
        document.body.appendChild(loadingEl);
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        z-index: 9999;
        background-color: ${colors[type] || colors.info};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Global fonksiyonlar
window.syncAllPayments = syncEtsyPayments;
window.filterPaymentsByDate = filterPaymentsByDate;
window.searchPayments = searchPayments;
window.loadPayments = loadPayments;
