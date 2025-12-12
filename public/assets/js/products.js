// products.js - BASİT VE ÇALIŞAN VERSİYON

let currentUser = null;
let currentProducts = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Products page loaded');
    
    // Demo modda başlat
    initializeDemoMode();
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Demo ürünleri göster
    loadDemoProducts();
});

function initializeDemoMode() {
    // Demo kullanıcı oluştur
    currentUser = {
        id: 'demo-user-' + Date.now(),
        email: 'demo@example.com'
    };
    
    // Kullanıcı bilgilerini güncelle
    updateUserInfo();
}

function updateUserInfo() {
    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    
    if (avatar) avatar.textContent = 'DM';
    if (name) name.textContent = 'Demo User';
    if (email) email.textContent = currentUser.email;
}

function setupEventListeners() {
    // Yeni ürün butonları
    document.getElementById('btn-new-product')?.addEventListener('click', showNewProductModal);
    document.getElementById('btn-empty-new-product')?.addEventListener('click', showNewProductModal);
    
    // Trend analiz butonu
    document.getElementById('btn-analyze-top-sellers')?.addEventListener('click', analyzeTopSellers);
    
    // Filtreler
    document.getElementById('filter-status')?.addEventListener('change', filterProducts);
    document.getElementById('filter-category')?.addEventListener('change', filterProducts);
    
    // Arama
    document.getElementById('search-products')?.addEventListener('input', filterProducts);
    
    // Modal kapatma
    document.getElementById('modal-product-close')?.addEventListener('click', () => closeModal('modal-product'));
    document.getElementById('btn-cancel-product')?.addEventListener('click', () => closeModal('modal-product'));
    document.getElementById('modal-mockup-close')?.addEventListener('click', () => closeModal('modal-mockup'));
    
    // Form submit
    document.getElementById('form-product')?.addEventListener('submit', handleProductFormSubmit);
    
    // AI açıklama oluşturma
    document.getElementById('btn-generate-description')?.addEventListener('click', generateDescriptionWithAI);
    
    // Modal dışına tıklama
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function loadDemoProducts() {
    // Demo ürünler
    currentProducts = [
        {
            id: 'product-1',
            title: 'Minimalist Black T-Shirt',
            description: 'Comfortable cotton t-shirt with minimalist design',
            category: 'tshirt',
            price: 24.99,
            status: 'published',
            images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
            created_at: new Date().toISOString(),
            rating_stats: [{ average_rating: 4.5, monthly_sales_estimate: 45 }]
        },
        {
            id: 'product-2',
            title: 'Custom Coffee Mug',
            description: 'Personalized ceramic mug for coffee lovers',
            category: 'mug',
            price: 18.99,
            status: 'published',
            images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop'],
            created_at: new Date(Date.now() - 86400000).toISOString(),
            rating_stats: [{ average_rating: 4.2, monthly_sales_estimate: 32 }]
        },
        {
            id: 'product-3',
            title: 'Wooden Phone Case',
            description: 'Eco-friendly wooden phone case with protective design',
            category: 'phone-case',
            price: 29.99,
            status: 'draft',
            images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'],
            created_at: new Date(Date.now() - 172800000).toISOString(),
            rating_stats: [{ average_rating: 4.8, monthly_sales_estimate: 28 }]
        },
        {
            id: 'product-4',
            title: 'Minimalist Necklace',
            description: 'Elegant silver necklace with geometric pendant',
            category: 'jewelry',
            price: 34.99,
            status: 'published',
            images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop'],
            created_at: new Date(Date.now() - 259200000).toISOString(),
            rating_stats: [{ average_rating: 4.7, monthly_sales_estimate: 51 }]
        },
        {
            id: 'product-5',
            title: 'Decorative Wood Plate',
            description: 'Handcrafted wooden plate for home decoration',
            category: 'wood',
            price: 22.99,
            status: 'archived',
            images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop'],
            created_at: new Date(Date.now() - 345600000).toISOString(),
            rating_stats: [{ average_rating: 4.3, monthly_sales_estimate: 19 }]
        },
        {
            id: 'product-6',
            title: 'Ceramic Dinner Plate Set',
            description: 'Set of 4 premium ceramic plates for elegant dining',
            category: 'plate',
            price: 39.99,
            status: 'draft',
            images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop'],
            created_at: new Date(Date.now() - 432000000).toISOString(),
            rating_stats: [{ average_rating: 4.6, monthly_sales_estimate: 37 }]
        }
    ];
    
    renderProducts(currentProducts);
}

function renderProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    const emptyState = document.getElementById('products-empty');
    
    if (!products || products.length === 0) {
        if (productsGrid) productsGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    if (!productsGrid) return;
    
    let html = '';
    products.forEach(product => {
        html += createProductCardHTML(product);
    });
    
    productsGrid.innerHTML = html;
    
    // Ürün kartı butonlarına event listener ekle
    attachProductCardListeners();
}

function createProductCardHTML(product) {
    const statusClass = getProductStatusClass(product.status);
    const statusText = getProductStatusText(product.status);
    const price = parseFloat(product.price || 0).toFixed(2);
    const rating = product.rating_stats?.[0];
    const imageUrl = product.images && product.images.length > 0 ? 
        product.images[0] : getRandomProductImage(product.category);
    
    return `
        <div class="product-card" data-id="${product.id}" data-status="${product.status}" data-category="${product.category}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.title}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Product+Image';">
                <div class="product-badge ${statusClass}">${statusText}</div>
                <div class="price-badge">$${price}</div>
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-title">${truncateText(product.title, 40)}</h3>
                </div>
                <span class="product-category">${product.category}</span>
                <p class="product-description">${truncateText(product.description || '', 80)}</p>
                ${rating ? `
                    <div class="product-rating">
                        <span style="color: #fbbf24; font-weight: 600;">
                            ★ ${rating.average_rating?.toFixed(1) || '0.0'}
                        </span>
                        <span style="color: #6b7280; font-size: 12px;">
                            📈 ${rating.monthly_sales_estimate || '0'} sales/month
                        </span>
                    </div>
                ` : ''}
                <div class="product-actions">
                    <button class="btn btn-primary btn-sm" data-action="mockup" data-product-id="${product.id}">
                        Mockup
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="edit" data-product-id="${product.id}">
                        Edit
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="similar" data-product-id="${product.id}">
                        Similar
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="delete" data-product-id="${product.id}">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

function attachProductCardListeners() {
    // Edit button
    document.querySelectorAll('[data-action="edit"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            editProduct(productId);
        });
    });
    
    // Delete button
    document.querySelectorAll('[data-action="delete"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            deleteProduct(productId);
        });
    });
    
    // Mockup button
    document.querySelectorAll('[data-action="mockup"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            generateMockups(productId);
        });
    });
    
    // Similar button
    document.querySelectorAll('[data-action="similar"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            createSimilarProduct(productId);
        });
    });
}

// Filtreleme fonksiyonu
function filterProducts() {
    const status = document.getElementById('filter-status')?.value || '';
    const category = document.getElementById('filter-category')?.value || '';
    const search = document.getElementById('search-products')?.value.toLowerCase() || '';
    
    const filtered = currentProducts.filter(product => {
        // Status filter
        if (status && product.status !== status) return false;
        
        // Category filter
        if (category && product.category !== category) return false;
        
        // Search filter
        if (search) {
            const searchText = `${product.title} ${product.description} ${product.category}`.toLowerCase();
            if (!searchText.includes(search)) return false;
        }
        
        return true;
    });
    
    renderProducts(filtered);
}

// Modal fonksiyonları
function showNewProductModal() {
    resetProductForm();
    document.getElementById('modal-product-title').textContent = 'New Product';
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

function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('product-title').value.trim();
    const category = document.getElementById('product-category').value;
    const price = document.getElementById('product-price').value;
    const status = document.getElementById('product-status').value;
    const description = document.getElementById('product-description').value.trim();
    const productId = document.getElementById('product-id').value;
    
    if (!title || !category || !price) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    if (productId) {
        // Update existing product
        const index = currentProducts.findIndex(p => p.id === productId);
        if (index !== -1) {
            currentProducts[index] = {
                ...currentProducts[index],
                title,
                category,
                price: parseFloat(price),
                status,
                description,
                updated_at: new Date().toISOString()
            };
            showNotification('Product updated successfully', 'success');
        }
    } else {
        // Create new product
        const newProduct = {
            id: 'product-' + Date.now(),
            title,
            description,
            category,
            price: parseFloat(price),
            status,
            images: [getRandomProductImage(category)],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: currentUser.id,
            rating_stats: [{ average_rating: 0, monthly_sales_estimate: 0 }]
        };
        
        currentProducts.unshift(newProduct);
        showNotification('Product created successfully', 'success');
    }
    
    closeModal('modal-product');
    renderProducts(currentProducts);
}

function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modal-product-title').textContent = 'Edit Product';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-title').value = product.title || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-status').value = product.status || 'draft';
    document.getElementById('product-description').value = product.description || '';
    
    document.getElementById('modal-product').classList.add('active');
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    currentProducts = currentProducts.filter(p => p.id !== productId);
    showNotification('Product deleted successfully', 'success');
    renderProducts(currentProducts);
}

function generateDescriptionWithAI() {
    const title = document.getElementById('product-title').value.trim();
    const category = document.getElementById('product-category').value;
    
    if (!title) {
        showNotification('Please enter product title first', 'warning');
        return;
    }
    
    // Mock AI description
    const descriptions = [
        `${title} - Premium quality product with excellent craftsmanship and attention to detail.`,
        `${title} features high-quality materials and durable construction. Perfect for ${category || 'everyday use'}.`,
        `Handcrafted ${title} made with care and precision. Each piece is unique and carefully inspected.`,
        `${title} combines modern design with traditional techniques. A perfect gift for any occasion.`
    ];
    
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    document.getElementById('product-description').value = randomDescription;
    showNotification('AI description generated', 'success');
}

function analyzeTopSellers() {
    showNotification('Analyzing Etsy trends... (Demo Mode)', 'info');
    
    // Mock trend data
    const trends = [
        {
            id: 'trend-1',
            title: 'Personalized Pet Portrait',
            category: 'art',
            price: 34.99,
            monthly_sales: 156,
            trend_score: 85
        },
        {
            id: 'trend-2',
            title: 'Minimalist T-Shirt Design',
            category: 'tshirt',
            price: 24.99,
            monthly_sales: 189,
            trend_score: 88
        },
        {
            id: 'trend-3',
            title: 'Custom Coffee Mug',
            category: 'mug',
            price: 18.99,
            monthly_sales: 245,
            trend_score: 92
        }
    ];
    
    // Show trends modal
    showTrendsModal(trends);
}

function showTrendsModal(trends) {
    const container = document.getElementById('top-seller-modal-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="modal active" id="top-seller-modal">
            <div class="modal-content" style="max-width: 800px;">
                <button class="modal-close" onclick="closeTrendsModal()">&times;</button>
                <div class="modal-header">
                    <h2 class="modal-title">Trending Products Analysis</h2>
                    <p class="modal-subtitle">${trends.length} trending products found (Demo Mode)</p>
                </div>
                
                <div style="padding: 20px;">
                    ${trends.map(trend => `
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <h3 style="font-weight: 600; margin-bottom: 4px;">${trend.title}</h3>
                                    <div style="display: flex; gap: 12px; font-size: 12px; color: #6b7280;">
                                        <span>$${trend.price}</span>
                                        <span>${trend.category}</span>
                                        <span>📈 ${trend.monthly_sales} sales/month</span>
                                        <span>🔥 ${trend.trend_score} trend score</span>
                                    </div>
                                </div>
                                <button class="btn btn-primary btn-sm" onclick="createFromTrend('${trend.id}')">
                                    Create
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <button class="btn btn-outline" onclick="closeTrendsModal()">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
}

window.closeTrendsModal = function() {
    const modal = document.getElementById('top-seller-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            document.getElementById('top-seller-modal-container').innerHTML = '';
        }, 300);
    }
};

window.createFromTrend = function(trendId) {
    showNotification('Creating product from trend...', 'success');
    closeTrendsModal();
};

function generateMockups(productId) {
    showNotification('Generating mockups... (Demo Mode)', 'info');
    setTimeout(() => {
        showNotification('Mockups generated successfully', 'success');
    }, 1000);
}

function createSimilarProduct(productId) {
    const original = currentProducts.find(p => p.id === productId);
    if (!original) return;
    
    const variations = ['Minimalist', 'Vintage', 'Modern', 'Colorful', 'Premium'];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    const newProduct = {
        id: 'similar-' + Date.now(),
        title: `${variation} ${original.title}`,
        description: `${variation} version of ${original.title}`,
        category: original.category,
        price: (parseFloat(original.price) * (0.9 + Math.random() * 0.2)).toFixed(2),
        status: 'draft',
        images: [getRandomProductImage(original.category)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: currentUser.id,
        rating_stats: [{ average_rating: 0, monthly_sales_estimate: 0 }]
    };
    
    currentProducts.unshift(newProduct);
    showNotification('Similar product created successfully', 'success');
    renderProducts(currentProducts);
}

// Utility functions
function getProductStatusClass(status) {
    return {
        'draft': 'status-draft',
        'published': 'status-published',
        'archived': 'status-archived'
    }[status] || 'status-draft';
}

function getProductStatusText(status) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRandomProductImage(category) {
    const images = {
        'tshirt': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        'mug': 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=300&fit=crop',
        'plate': 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=300&fit=crop',
        'phone-case': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop',
        'jewelry': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop',
        'wood': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
    };
    
    return images[category] || 'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?w=400&h=300&fit=crop';
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions available globally
window.closeModal = closeModal;
window.showNotification = showNotification;

console.log('Products.js loaded successfully in demo mode');
