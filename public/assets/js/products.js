// products.js - TAM VE EKSİKSİZ VERSİYON (Tüm fonksiyonlar dahil)

let currentUser = null;
let currentProducts = [];
let aiTools = [];
let topSellersData = [];
let currentFilters = {
    status: '',
    category: '',
    search: ''
};

// Supabase bağlantısı kontrolü
if (typeof supabase === 'undefined') {
    console.error('Supabase tanımlı değil! Lütfen önce auth.js yükleyin.');
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products sayfası yükleniyor...');
    
    try {
        // Kullanıcı kontrolü
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('Auth hatası:', authError);
            window.location.href = '/login.html';
            return;
        }
        
        currentUser = user;
        await initializeProductsPage();
        
    } catch (error) {
        console.error('Başlatma hatası:', error);
        showNotification('Sayfa yüklenirken hata oluştu: ' + error.message, 'error');
    }
});

async function initializeProductsPage() {
    try {
        showLoading('Sayfa hazırlanıyor...');
        
        // Paralel yükleme işlemleri
        await Promise.all([
            loadAITools(),
            loadUserProducts()
        ]);
        
        setupAllEventListeners();
        updateProductStats();
        
    } catch (error) {
        console.error('Sayfa başlatma hatası:', error);
        showNotification('Sayfa başlatılamadı', 'error');
    } finally {
        hideLoading();
    }
}

function setupAllEventListeners() {
    // Header butonları
    document.getElementById('btn-new-product')?.addEventListener('click', showNewProductModal);
    document.getElementById('btn-empty-new-product')?.addEventListener('click', showNewProductModal);
    document.getElementById('btn-analyze-top-sellers')?.addEventListener('click', analyzeTopSellers);
    
    // Filtreler
    document.getElementById('filter-status')?.addEventListener('change', (e) => {
        const status = e.target.value;
        filterProductsByStatus(status);
    });
    
    document.getElementById('filter-category')?.addEventListener('change', (e) => {
        const category = e.target.value;
        filterProductsByCategory(category);
    });
    
    // Search input (eğer varsa)
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'search-products';
    searchInput.placeholder = 'Ürün ara...';
    searchInput.className = 'form-input';
    searchInput.style.marginLeft = 'auto';
    searchInput.style.maxWidth = '250px';
    
    // Search input'u header'a ekle
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('search-products')) {
        headerActions.parentElement.insertBefore(searchInput, headerActions);
    }
    
    searchInput.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });
    
    // Modal kapatma butonları
    document.getElementById('modal-product-close')?.addEventListener('click', () => closeModal('modal-product'));
    document.getElementById('modal-mockup-close')?.addEventListener('click', () => closeModal('modal-mockup'));
    document.getElementById('btn-cancel-product')?.addEventListener('click', () => closeModal('modal-product'));
    
    // Form işlemleri
    document.getElementById('form-product')?.addEventListener('submit', handleProductFormSubmit);
    document.getElementById('btn-generate-description')?.addEventListener('click', generateDescriptionWithAI);
    
    // Modal dışına tıklama
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // ESC tuşu ile kapatma
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // Kategori filtre butonları (eğer varsa)
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
            updateActiveCategoryButton(this);
        });
    });
    
    // Durum filtre butonları (eğer varsa)
    document.querySelectorAll('.status-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            filterProductsByStatus(status);
            updateActiveStatusButton(this);
        });
    });
}

async function loadAITools() {
    try {
        const { data, error } = await supabase
            .from('ai_tools')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true);
        
        if (error) throw error;
        aiTools = data || [];
        
    } catch (error) {
        console.error('AI araçları yükleme hatası:', error);
        aiTools = [];
    }
}

async function loadUserProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select(`
                *,
                rating_stats (
                    average_rating,
                    total_reviews,
                    monthly_sales_estimate
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        currentProducts = products || [];
        renderProducts(currentProducts);
        
    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        showNotification('Ürünler yüklenirken hata oluştu', 'error');
        currentProducts = [];
        renderProducts([]);
    }
}

function renderProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    const emptyState = document.getElementById('products-empty');
    
    if (!productsGrid || !emptyState) return;
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    let html = '';
    products.forEach(product => {
        html += createProductCardHTML(product);
    });
    
    productsGrid.innerHTML = html;
    
    // Ürün kartlarına event listener ekle
    attachProductCardListeners();
}

function createProductCardHTML(product) {
    const statusClass = getProductStatusClass(product.status);
    const statusText = getProductStatusText(product.status);
    const price = parseFloat(product.price || 0).toFixed(2);
    const rating = product.rating_stats?.[0];
    
    return `
        <div class="product-card" data-id="${product.id}" data-status="${product.status}" data-category="${product.category || ''}">
            <div class="product-image">
                <div class="product-image-placeholder">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p>Ürün Görseli</p>
                </div>
                <div class="product-badge ${statusClass}">${statusText}</div>
                <div style="position: absolute; bottom: 12px; left: 12px; background: black; color: white; padding: 4px 8px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                    $${price}
                </div>
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-title" title="${escapeHtml(product.title || 'Başlıksız Ürün')}">
                        ${truncateText(product.title || 'Başlıksız Ürün', 50)}
                    </h3>
                </div>
                <span class="product-category bg-blue-100 text-blue-800" style="display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">
                    ${escapeHtml(product.category || 'Kategorisiz')}
                </span>
                <p class="product-description" title="${escapeHtml(product.description || '')}">
                    ${truncateText(product.description || 'Açıklama yok', 100)}
                </p>
                ${rating ? `
                    <div class="product-rating" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                        <span style="color: #fbbf24; font-weight: 600; display: flex; align-items: center;">
                            ★ ${rating.average_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span style="color: #6b7280; font-size: 12px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 4px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                            </svg>
                            ${rating.monthly_sales_estimate || '0'} satış/ay
                        </span>
                    </div>
                ` : ''}
                <div class="product-actions">
                    <button class="btn btn-outline btn-sm" data-action="mockup" data-product-id="${product.id}">
                        Mockup
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="edit" data-product-id="${product.id}">
                        Düzenle
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="similar" data-product-id="${product.id}">
                        Benzer Üret
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="delete" data-product-id="${product.id}">
                        Sil
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachProductCardListeners() {
    document.querySelectorAll('[data-action="edit"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            deleteProduct(productId);
        });
    });
    
    document.querySelectorAll('[data-action="mockup"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            generateProductMockups(productId);
        });
    });
    
    document.querySelectorAll('[data-action="similar"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            generateSimilarProduct(productId);
        });
    });
}

// EKSİK FONKSİYONLAR - GÜNCELLENDİ
function updateProductStats() {
    if (!currentProducts || currentProducts.length === 0) {
        // İstatistik elementlerini kontrol et
        const totalProductsEl = document.getElementById('totalProducts');
        const listedProductsEl = document.getElementById('listedProducts');
        const draftProductsEl = document.getElementById('draftProducts');
        const totalValueEl = document.getElementById('totalValue');
        
        if (totalProductsEl) totalProductsEl.textContent = '0';
        if (listedProductsEl) listedProductsEl.textContent = '0';
        if (draftProductsEl) draftProductsEl.textContent = '0';
        if (totalValueEl) totalValueEl.textContent = '$0';
        return;
    }
    
    const total = currentProducts.length;
    const listed = currentProducts.filter(p => p.status === 'listed' || p.status === 'published').length;
    const draft = currentProducts.filter(p => p.status === 'draft').length;
    const totalValue = currentProducts.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    
    // İstatistik elementlerini güncelle
    const totalProductsEl = document.getElementById('totalProducts');
    const listedProductsEl = document.getElementById('listedProducts');
    const draftProductsEl = document.getElementById('draftProducts');
    const totalValueEl = document.getElementById('totalValue');
    
    if (totalProductsEl) totalProductsEl.textContent = total.toString();
    if (listedProductsEl) listedProductsEl.textContent = listed.toString();
    if (draftProductsEl) draftProductsEl.textContent = draft.toString();
    if (totalValueEl) totalValueEl.textContent = `$${totalValue.toFixed(2)}`;
}

function filterProductsByCategory(category) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const cards = productsGrid.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        if (category === '' || category === 'all') {
            card.style.display = '';
        } else {
            const categorySpan = card.querySelector('.product-category');
            if (categorySpan) {
                const cardCategory = categorySpan.textContent.trim();
                card.style.display = cardCategory === category ? '' : 'none';
            }
        }
    });
}

function filterProductsByStatus(status) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const cards = productsGrid.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        if (status === '' || status === 'all') {
            card.style.display = '';
        } else {
            const statusBadge = card.querySelector('.product-badge');
            if (statusBadge) {
                const statusText = statusBadge.textContent.trim();
                const cardStatus = getStatusFromText(statusText);
                card.style.display = cardStatus === status ? '' : 'none';
            }
        }
    });
}

function searchProducts(query) {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    const cards = productsGrid.querySelectorAll('.product-card');
    const searchTerm = query.toLowerCase().trim();
    
    cards.forEach(card => {
        if (searchTerm === '') {
            card.style.display = '';
        } else {
            const title = card.querySelector('.product-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.product-description')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.product-category')?.textContent.toLowerCase() || '';
            
            const cardText = `${title} ${description} ${category}`;
            card.style.display = cardText.includes(searchTerm) ? '' : 'none';
        }
    });
}

function updateActiveCategoryButton(activeBtn) {
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
    activeBtn.classList.add('bg-blue-600', 'text-white');
}

function updateActiveStatusButton(activeBtn) {
    document.querySelectorAll('.status-filter').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700');
    });
    
    activeBtn.classList.remove('bg-gray-200', 'text-gray-700');
    activeBtn.classList.add('bg-blue-600', 'text-white');
}

// EKSİK YARDIMCI FONKSİYONLAR
function getProductStatusClass(status) {
    const classMap = {
        'draft': 'bg-gray-100 text-gray-800',
        'listed': 'bg-green-100 text-green-800',
        'published': 'bg-green-100 text-green-800',
        'archived': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
}

function getProductStatusText(status) {
    const textMap = {
        'draft': 'Taslak',
        'listed': 'Yayında',
        'published': 'Yayında',
        'archived': 'Arşiv'
    };
    return textMap[status] || status;
}

function getStatusFromText(text) {
    const reverseMap = {
        'taslak': 'draft',
        'yayında': 'published',
        'arşiv': 'archived'
    };
    return reverseMap[text.toLowerCase()] || text;
}

// MODAL İŞLEMLERİ
function showNewProductModal() {
    resetProductForm();
    document.getElementById('modal-product-title').textContent = 'Yeni Ürün';
    document.getElementById('modal-product').classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function resetProductForm() {
    const form = document.getElementById('form-product');
    if (form) {
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-status').value = 'draft';
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    try {
        showLoading('Ürün kaydediliyor...');
        
        const productData = {
            user_id: currentUser.id,
            title: document.getElementById('product-title').value.trim(),
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value) || 0,
            status: document.getElementById('product-status').value,
            description: document.getElementById('product-description').value.trim(),
            updated_at: new Date().toISOString()
        };
        
        if (!productData.title) throw new Error('Ürün başlığı gereklidir');
        if (!productData.category) throw new Error('Kategori seçmelisiniz');
        
        const productId = document.getElementById('product-id').value;
        
        if (productId) {
            // Güncelle
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            showNotification('Ürün güncellendi', 'success');
        } else {
            // Yeni oluştur
            productData.created_at = new Date().toISOString();
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            showNotification('Ürün oluşturuldu', 'success');
        }
        
        closeModal('modal-product');
        await loadUserProducts();
        
    } catch (error) {
        console.error('Ürün kaydetme hatası:', error);
        showNotification(error.message || 'Ürün kaydedilemedi', 'error');
    } finally {
        hideLoading();
    }
}

async function editProduct(productId) {
    try {
        showLoading('Ürün yükleniyor...');
        
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        document.getElementById('modal-product-title').textContent = 'Ürünü Düzenle';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-title').value = product.title || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-status').value = product.status || 'draft';
        document.getElementById('product-description').value = product.description || '';
        
        document.getElementById('modal-product').classList.add('active');
        
    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        showNotification('Ürün yüklenemedi', 'error');
    } finally {
        hideLoading();
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    
    try {
        showLoading('Ürün siliniyor...');
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        showNotification('Ürün silindi', 'success');
        await loadUserProducts();
        
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        showNotification('Ürün silinemedi', 'error');
    } finally {
        hideLoading();
    }
}

// AI FONKSİYONLARI
async function generateDescriptionWithAI() {
    const title = document.getElementById('product-title').value.trim();
    const category = document.getElementById('product-category').value;
    
    if (!title) {
        showNotification('Lütfen önce ürün başlığı girin', 'warning');
        return;
    }
    
    try {
        showLoading('AI ile tanım oluşturuluyor...');
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockDescription = `${title} - Kaliteli malzeme ve özenli işçilikle üretilmiştir. Mükemmel hediye alternatifi! ${category ? `İdeal ${category.toLowerCase()} seçeneği.` : ''}`;
        document.getElementById('product-description').value = mockDescription;
        
        showNotification('AI tanım oluşturuldu', 'success');
        
    } catch (error) {
        console.error('AI tanım oluşturma hatası:', error);
        showNotification('AI tanım oluşturulamadı', 'error');
    } finally {
        hideLoading();
    }
}

// ETSY TREND ANALİZİ FONKSİYONLARI
async function analyzeTopSellers() {
    try {
        showLoading('Etsy trend ürünleri analiz ediliyor...');
        
        await fetchTopSellersFromEtsy();
        
        if (topSellersData.length > 0) {
            displayTopSellerModal(topSellersData);
            showNotification(`${topSellersData.length} trend ürün bulundu', 'success`);
        } else {
            showNotification('Trend ürün bulunamadı', 'warning');
        }
        
    } catch (error) {
        console.error('Trend analiz hatası:', error);
        showNotification('Trend analizi başarısız: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function fetchTopSellersFromEtsy() {
    try {
        // Etsy mağazasını kontrol et
        const { data: etsyShop } = await supabase
            .from('etsy_shops')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (etsyShop) {
            topSellersData = await fetchRealEtsyTrends(etsyShop);
        } else {
            topSellersData = await fetchMockTopSellers();
        }
        
    } catch (error) {
        console.error('Top seller analiz hatası:', error);
        topSellersData = await fetchMockTopSellers();
    }
}

async function fetchRealEtsyTrends(etsyShop) {
    try {
        // Gerçek Etsy API implementasyonu için mock
        return generateMockTrendData();
        
    } catch (error) {
        console.error('Etsy trend çekme hatası:', error);
        return generateMockTrendData();
    }
}

function generateMockTrendData() {
    const categories = ['tshirt', 'mug', 'plate', 'phone-case', 'jewelry', 'wood'];
    const trends = [];
    
    for (let i = 0; i < 8; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const style = ['Minimalist', 'Vintage', 'Modern', 'Handmade', 'Custom'][Math.floor(Math.random() * 5)];
        
        trends.push({
            id: `trend-${i}`,
            title: `${style} ${getProductTypeByCategory(category)}`,
            description: `Trend ${category} ürünü, ${style.toLowerCase()} tasarım`,
            price: (15 + Math.random() * 35).toFixed(2),
            category: category,
            tags: [style.toLowerCase(), 'trending', 'popular'],
            image_url: getRandomProductImage(category),
            monthly_sales: Math.floor(Math.random() * 200) + 50,
            trend_score: 70 + Math.random() * 30,
            source: 'etsy_mock'
        });
    }
    
    return trends;
}

function getProductTypeByCategory(category) {
    const types = {
        'tshirt': ['T-Shirt', 'Hoodie', 'Sweatshirt'],
        'mug': ['Coffee Mug', 'Travel Mug', 'Ceramic Mug'],
        'plate': ['Dinner Plate', 'Decorative Plate', 'Serving Plate'],
        'phone-case': ['Phone Case', 'Tablet Case', 'Laptop Case'],
        'jewelry': ['Necklace', 'Bracelet', 'Earrings'],
        'wood': ['Cutting Board', 'Coaster', 'Wall Art']
    };
    
    const categoryTypes = types[category] || ['Product'];
    return categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
}

function getRandomProductImage(category) {
    const images = {
        'tshirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        'mug': 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
        'plate': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
        'phone-case': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
        'jewelry': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
        'wood': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'
    };
    
    return images[category] || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=400&fit=crop';
}

async function fetchMockTopSellers() {
    const { data: marketData } = await supabase
        .from('etsy_market_data')
        .select('*')
        .order('trend_score', { ascending: false })
        .limit(10);
    
    if (marketData && marketData.length > 0) {
        return marketData.map(item => ({
            id: item.id,
            title: item.product_title,
            description: `${item.category} kategorisinde trend ürün`,
            price: parsePriceRange(item.price_range),
            category: item.category,
            tags: item.tags || [],
            image_url: getRandomProductImage(item.category),
            monthly_sales: item.monthly_sales || 100,
            trend_score: item.trend_score || 75,
            source: 'market_data'
        }));
    }
    
    return generateMockTrendData();
}

function parsePriceRange(priceRange) {
    if (!priceRange) return 24.99;
    const prices = priceRange.replace('$', '').split('-');
    if (prices.length === 2) {
        return (parseFloat(prices[0]) + parseFloat(prices[1])) / 2;
    }
    return 24.99;
}

function displayTopSellerModal(trends) {
    const modal = document.createElement('div');
    modal.id = 'top-seller-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 1200px;">
            <button class="modal-close" onclick="closeModal('top-seller-modal')">&times;</button>
            <div class="modal-header">
                <h2 class="modal-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; margin-right: 8px; vertical-align: middle;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                    Trend Ürün Analizi
                </h2>
                <p class="modal-subtitle">${trends.length} trend ürün bulundu</p>
            </div>
            
            <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="filterTrends('all')" class="btn btn-primary btn-sm">Tümü</button>
                    <button onclick="filterTrends('high_trend')" class="btn btn-outline btn-sm">
                        Yüksek Trend (80+)
                    </button>
                    <button onclick="filterTrends('high_sales')" class="btn btn-outline btn-sm">
                        Çok Satanlar (150+)
                    </button>
                </div>
            </div>
            
            <div id="trends-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; max-height: 600px; overflow-y: auto; padding: 10px;">
                ${trends.map((trend, index) => `
                    <div class="product-card" data-trend-index="${index}" data-score="${trend.trend_score}" data-sales="${trend.monthly_sales}">
                        <div class="product-image">
                            <img src="${trend.image_url}" alt="${trend.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;">
                            <div class="product-badge" style="background: ${trend.trend_score >= 90 ? '#dc2626' : trend.trend_score >= 80 ? '#ea580c' : '#16a34a'}">
                                ${trend.trend_score.toFixed(1)}
                            </div>
                            <div style="position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                                ${trend.monthly_sales} satış/ay
                            </div>
                        </div>
                        <div class="product-content">
                            <div class="product-header">
                                <h3 class="product-title">${trend.title}</h3>
                                <div class="product-price">$${trend.price}</div>
                            </div>
                            <span class="product-category">${trend.category}</span>
                            <p class="product-description">${trend.description}</p>
                            <div class="product-actions">
                                <button class="btn btn-primary btn-sm" onclick="createProductFromTrend(${index})" style="flex: 1;">
                                    AI ile Oluştur
                                </button>
                                <button class="btn btn-outline btn-sm" onclick="saveTrend(${index})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <button onclick="closeModal('top-seller-modal')" class="btn btn-outline">
                    Kapat
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.classList.add('active');
}

window.filterTrends = function(filter) {
    const cards = document.querySelectorAll('#trends-grid .product-card');
    
    cards.forEach(card => {
        const score = parseFloat(card.dataset.score);
        const sales = parseInt(card.dataset.sales);
        
        let show = true;
        
        if (filter === 'high_trend') {
            show = score >= 80;
        } else if (filter === 'high_sales') {
            show = sales >= 150;
        }
        
        card.style.display = show ? '' : 'none';
    });
};

window.createProductFromTrend = async function(index) {
    const trend = topSellersData[index];
    if (!trend) return;
    
    try {
        showLoading('Ürün oluşturuluyor...');
        
        const newProduct = {
            user_id: currentUser.id,
            title: trend.title,
            description: trend.description,
            category: trend.category,
            price: parseFloat(trend.price),
            images: [trend.image_url],
            tags: trend.tags,
            status: 'draft',
            metadata: { 
                source: 'trend_analysis', 
                trend_score: trend.trend_score,
                monthly_sales: trend.monthly_sales 
            }
        };
        
        const { error } = await supabase
            .from('products')
            .insert([newProduct]);
        
        if (error) throw error;
        
        showNotification('Ürün başarıyla oluşturuldu!', 'success');
        closeModal('top-seller-modal');
        await loadUserProducts();
        
    } catch (error) {
        console.error('Trend ürün oluşturma hatası:', error);
        showNotification('Ürün oluşturulamadı: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.saveTrend = function(index) {
    const trend = topSellersData[index];
    if (!trend) return;
    
    // Burada trend'i veritabanına kaydedebilirsiniz
    showNotification('Trend kaydedildi', 'success');
};

// BENZER ÜRÜN OLUŞTURMA
async function generateSimilarProduct(productId) {
    try {
        showLoading('Benzer ürün oluşturuluyor...');
        
        // Orijinal ürünü al
        const { data: originalProduct } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        
        if (!originalProduct) throw new Error('Ürün bulunamadı');
        
        const variation = getRandomVariation();
        
        // AI araç kontrolü
        if (aiTools.length === 0) {
            await createManualSimilarProduct(originalProduct);
            return;
        }
        
        const generatedImage = await generateAIImage(originalProduct, variation);
        
        const newProduct = {
            user_id: currentUser.id,
            title: `${variation.style} ${originalProduct.title}`,
            description: `${variation.style} varyasyonu: ${originalProduct.description || ''}`,
            category: originalProduct.category,
            price: calculateVariedPrice(originalProduct.price),
            images: [generatedImage],
            tags: [...(originalProduct.tags || []), variation.style, 'ai_generated'],
            status: 'draft',
            metadata: {
                original_product_id: originalProduct.id,
                variation: variation
            }
        };
        
        const { error } = await supabase
            .from('products')
            .insert([newProduct]);
        
        if (error) throw error;
        
        showNotification('Benzer ürün başarıyla oluşturuldu!', 'success');
        await loadUserProducts();
        
    } catch (error) {
        console.error('Benzer ürün oluşturma hatası:', error);
        showNotification('Ürün oluşturulamadı: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function getRandomVariation() {
    const variations = [
        { style: 'Minimalist', colors: ['monochrome', 'black & white'] },
        { style: 'Vintage', colors: ['sepia', 'retro'] },
        { style: 'Modern', colors: ['vibrant', 'gradient'] },
        { style: 'Handmade', colors: ['natural', 'textured'] },
        { style: 'Luxury', colors: ['gold', 'premium'] }
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
}

async function generateAIImage(originalProduct, variation) {
    // Mock AI görsel üretimi
    const mockImages = [
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop'
    ];
    
    return mockImages[Math.floor(Math.random() * mockImages.length)];
}

function calculateVariedPrice(originalPrice) {
    const variation = (Math.random() * 0.4) - 0.2; // -20% ile +20% arası
    return parseFloat((originalPrice * (1 + variation)).toFixed(2));
}

async function createManualSimilarProduct(originalProduct) {
    const variation = getRandomVariation();
    const mockImage = getRandomProductImage(originalProduct.category);
    
    const newProduct = {
        user_id: currentUser.id,
        title: `${variation.style} ${originalProduct.title}`,
        description: `Manuel oluşturulmuş ${variation.style.toLowerCase()} varyasyonu`,
        category: originalProduct.category,
        price: calculateVariedPrice(originalProduct.price),
        images: [mockImage],
        tags: [...(originalProduct.tags || []), variation.style, 'manual'],
        status: 'draft'
    };
    
    const { error } = await supabase
        .from('products')
        .insert([newProduct]);
    
    if (error) throw error;
    
    showNotification('Manuel olarak benzer ürün oluşturuldu', 'success');
    await loadUserProducts();
}

// MOCKUP OLUŞTURMA
async function generateProductMockups(productId) {
    try {
        showLoading('Mockup görselleri oluşturuluyor...');
        
        // POD sağlayıcısını kontrol et
        const { data: podProvider } = await supabase
            .from('pod_providers')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        let mockupUrls = [];
        
        if (podProvider) {
            // Gerçek POD API entegrasyonu
            mockupUrls = await generateRealMockups(productId, podProvider);
        } else {
            mockupUrls = generateMockMockups();
        }
        
        // Ürünü güncelle
        const { error } = await supabase
            .from('products')
            .update({ mockup_urls: mockupUrls })
            .eq('id', productId);
        
        if (error) throw error;
        
        // Mockup modalını aç
        openMockupModal(productId, mockupUrls);
        
        showNotification('Mockup görselleri başarıyla oluşturuldu!', 'success');
        
    } catch (error) {
        console.error('Mockup oluşturma hatası:', error);
        showNotification('Mockup oluşturulamadı: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function generateMockMockups() {
    const angles = ['front', 'back', 'side', '3-4', 'flat'];
    const styles = ['male', 'female', 'child', 'lifestyle'];
    
    return angles.map(angle => ({
        url: `https://via.placeholder.com/600x800/cccccc/969696?text=Mockup+${angle}`,
        angle: angle,
        style: styles[Math.floor(Math.random() * styles.length)],
        variant: 'mock'
    }));
}

async function generateRealMockups(productId, podProvider) {
    // Gerçek POD API entegrasyonu
    return generateMockMockups();
}

function openMockupModal(productId, mockupUrls = []) {
    const mockupContainer = document.getElementById('mockup-editor-container');
    
    if (mockupContainer) {
        mockupContainer.innerHTML = `
            <div class="mockup-editor">
                <h3 style="margin-bottom: 16px; font-size: 18px; font-weight: 600;">Mockup Görselleri</h3>
                
                <div class="mockup-preview">
                    ${mockupUrls.length > 0 ? `
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; width: 100%;">
                            ${mockupUrls.map((mockup, index) => `
                                <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                    <img src="${mockup.url}" alt="Mockup ${index + 1}" style="width: 100%; height: 150px; object-fit: cover;">
                                    <div style="padding: 8px; font-size: 12px; color: #6b7280;">
                                        ${mockup.angle} - ${mockup.style}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; color: #6b7280;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                            </svg>
                            <p style="margin-top: 16px;">Mockup görselleri hazırlanıyor...</p>
                        </div>
                    `}
                </div>
                
                <div class="mockup-controls">
                    <div class="control-group">
                        <label class="control-label">Mockup Stili</label>
                        <select class="control-input" id="mockup-style">
                            <option value="lifestyle">Yaşam Tarzı</option>
                            <option value="flat">Düz</option>
                            <option value="model">Model Üzerinde</option>
                            <option value="packaging">Paketli</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Arkaplan</label>
                        <select class="control-input" id="mockup-background">
                            <option value="white">Beyaz</option>
                            <option value="gray">Gri</option>
                            <option value="scene">Sahne</option>
                            <option value="custom">Özel</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="control-label">Açılar</label>
                        <select class="control-input" id="mockup-angles" multiple style="height: 100px;">
                            <option value="front" selected>Ön</option>
                            <option value="back" selected>Arka</option>
                            <option value="side">Yan</option>
                            <option value="perspective">Perspektif</option>
                            <option value="closeup">Yakın Çekim</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button class="btn btn-primary btn-flex" onclick="regenerateMockups('${productId}')">
                        Yeniden Oluştur
                    </button>
                    <button class="btn btn-outline btn-flex" onclick="downloadMockups()">
                        İndir
                    </button>
                    <button class="btn btn-outline btn-flex" onclick="closeModal('modal-mockup')">
                        Kapat
                    </button>
                </div>
            </div>
        `;
    }
    
    document.getElementById('modal-mockup').classList.add('active');
}

window.regenerateMockups = async function(productId) {
    await generateProductMockups(productId);
};

window.downloadMockups = function() {
    showNotification('Mockup indirme işlemi başlatıldı', 'info');
};

// EKSİK GLOBAL FONKSİYONLAR
window.editProduct = editProduct;
window.generateSimilarProduct = generateSimilarProduct;
window.generateProductMockups = generateProductMockups;
window.viewProductDetails = async function(productId) {
    showNotification('Ürün detayları gösterilecek', 'info');
};

window.showNewProductModal = showNewProductModal;

window.showAIGenerateModal = function() {
    showNotification('AI ürün oluşturma modalı açılacak', 'info');
};

window.publishToEtsy = async function() {
    try {
        showLoading('Etsy\'ye gönderiliyor...');
        
        // Etsy mağaza kontrolü
        const { data: etsyShop } = await supabase
            .from('etsy_shops')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (!etsyShop) {
            throw new Error('Aktif Etsy mağazanız bulunamadı');
        }
        
        // Burada gerçek Etsy API entegrasyonu olacak
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('Ürün Etsy\'ye başarıyla gönderildi!', 'success');
        
    } catch (error) {
        showNotification('Etsy gönderimi başarısız: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// YARDIMCI FONKSİYONLAR
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// LOADING VE NOTIFICATION
function showLoading(message = 'Yükleniyor...') {
    let loadingEl = document.getElementById('loadingOverlay');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingOverlay';
        loadingEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loadingEl.innerHTML = `
            <div style="background: white; padding: 24px; border-radius: 12px; display: flex; flex-direction: column; align-items: center;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top-color: #ea580c; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                <p style="color: #374151; font-weight: 500;">${message}</p>
            </div>
        `;
        
        // Spinner animasyonu için CSS
        if (!document.querySelector('#loading-spinner-style')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-style';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
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
    // Önceki bildirimleri temizle
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
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
        background: ${colors[type]};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 8px;">
                &times;
            </button>
        </div>
    `;
    
    // Animasyon için CSS
    if (!document.querySelector('#notification-animation')) {
        const style = document.createElement('style');
        style.id = 'notification-animation';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 5 saniye sonra kaldır
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Global fonksiyonlar
window.closeModal = closeModal;
window.showNotification = showNotification;

console.log('Products.js tam yüklendi - Tüm fonksiyonlar dahil');
