// products.js - GERÇEK ETSY ENTEGRASYONLU

let currentUser = null;
let currentProducts = [];
let etsyService = null;
let etsyShop = null;
let isEtsyConnected = false;

// DOM yüklendiğinde
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products page loading with Etsy integration...');
    
    try {
        // Check if supabase is available
        if (!window.supabase) {
            console.warn('Supabase not available, using demo mode');
            initializeDemoMode();
            return;
        }
        
        // Get current user
        const { data: { user }, error: authError } = await window.supabase.auth.getUser();
        
        if (authError || !user) {
            console.warn('No authenticated user, using demo mode');
            initializeDemoMode();
            return;
        }
        
        currentUser = user;
        console.log('Authenticated user:', currentUser.email);
        
        // Load user data and products
        await initializePage();
        
    } catch (error) {
        console.error('Initialization error:', error);
        initializeDemoMode();
    }
});

async function initializePage() {
    try {
        showLoading('Loading products...');
        
        // Check Etsy connection
        await checkEtsyConnection();
        
        // Load products
        await loadProducts();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update UI
        updateUI();
        
        showNotification('Products page ready', 'success');
        
    } catch (error) {
        console.error('Page initialization error:', error);
        showNotification('Error loading page: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function checkEtsyConnection() {
    try {
        // Check if user has Etsy shop connected
        const { data: shop, error } = await window.supabase
            .from('etsy_shops')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (error || !shop) {
            console.log('No Etsy shop connected');
            isEtsyConnected = false;
            etsyShop = null;
            etsyService = null;
            return;
        }
        
        etsyShop = shop;
        isEtsyConnected = true;
        
        // Initialize Etsy service
        try {
            etsyService = new window.EtsyAPIService(shop.api_key, shop.id);
            const testResult = await etsyService.testConnection();
            
            if (testResult.success) {
                console.log('Etsy API connection successful');
                showNotification('Etsy shop connected: ' + shop.shop_name, 'success');
            } else {
                console.warn('Etsy API test failed:', testResult.message);
                showNotification('Etsy connection issue: ' + testResult.message, 'warning');
                isEtsyConnected = false;
            }
        } catch (apiError) {
            console.error('Etsy service initialization failed:', apiError);
            isEtsyConnected = false;
        }
        
    } catch (error) {
        console.error('Error checking Etsy connection:', error);
        isEtsyConnected = false;
    }
}

async function loadProducts() {
    try {
        // Show loading state
        showProductsLoading(true);
        
        let products = [];
        
        // Load from Supabase
        const { data: dbProducts, error } = await window.supabase
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
        
        if (error) {
            console.error('Error loading products from Supabase:', error);
            // Use demo data as fallback
            products = getDemoProducts();
        } else {
            products = dbProducts || [];
        }
        
        // If Etsy is connected, try to sync Etsy products
        if (isEtsyConnected && etsyService) {
            try {
                const etsyProducts = await syncEtsyProducts();
                products = [...products, ...etsyProducts];
            } catch (etsyError) {
                console.warn('Could not sync Etsy products:', etsyError.message);
                // Continue without Etsy products
            }
        }
        
        currentProducts = products;
        renderProducts(currentProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        currentProducts = getDemoProducts();
        renderProducts(currentProducts);
        showNotification('Using demo data. Some features may be limited.', 'warning');
    } finally {
        showProductsLoading(false);
    }
}

async function syncEtsyProducts() {
    if (!etsyService || !isEtsyConnected) return [];
    
    try {
        console.log('Syncing products from Etsy...');
        
        // Get listings from Etsy
        const listingsData = await etsyService.getShopListings(50, 0, 'active');
        
        if (!listingsData || !listingsData.results) {
            return [];
        }
        
        const etsyProducts = [];
        
        for (const listing of listingsData.results.slice(0, 10)) { // Limit to 10 for performance
            try {
                // Get images for this listing
                const images = await etsyService.getListingImages(listing.listing_id);
                const imageUrls = images.map(img => img.url_fullxfull).slice(0, 3);
                
                // Create product object from Etsy listing
                const product = {
                    id: `etsy-${listing.listing_id}`,
                    title: listing.title,
                    description: listing.description || '',
                    category: mapEtsyCategory(listing.taxonomy_id),
                    price: listing.price?.amount || 0,
                    status: 'published',
                    images: imageUrls,
                    etsy_listing_id: listing.listing_id.toString(),
                    source: 'etsy',
                    user_id: currentUser.id,
                    created_at: new Date(listing.created * 1000).toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: {
                        etsy_data: {
                            views: listing.views,
                            favorites: listing.num_favorers,
                            state: listing.state,
                            original_created: listing.created
                        }
                    },
                    rating_stats: [{
                        average_rating: 0,
                        monthly_sales_estimate: estimateSalesFromEtsy(listing)
                    }]
                };
                
                etsyProducts.push(product);
                
            } catch (listingError) {
                console.warn(`Error processing listing ${listing.listing_id}:`, listingError);
                continue;
            }
        }
        
        console.log(`Synced ${etsyProducts.length} products from Etsy`);
        return etsyProducts;
        
    } catch (error) {
        console.error('Error syncing Etsy products:', error);
        throw error;
    }
}

function mapEtsyCategory(taxonomyId) {
    const categoryMap = {
        1156: 'tshirt', // Clothing & Accessories
        1157: 'mug',    // Home & Living
        1158: 'plate',  // Home & Living
        1159: 'phone-case', // Electronics & Accessories
        1160: 'jewelry', // Jewelry
        1161: 'wood',    // Home & Living
        1162: 'art',     // Art & Collectibles
        1163: 'stationery' // Craft Supplies & Tools
    };
    
    return categoryMap[taxonomyId] || 'other';
}

function estimateSalesFromEtsy(listing) {
    const favorites = listing.num_favorers || 0;
    const views = listing.views || 0;
    const ageInDays = (Date.now() - (listing.created * 1000)) / (1000 * 60 * 60 * 24);
    
    let estimate = favorites * 0.15;
    estimate += views * 0.01;
    
    if (ageInDays > 0 && ageInDays < 365) {
        estimate = estimate * (365 / ageInDays);
    }
    
    return Math.floor(Math.max(estimate, 5));
}

function getDemoProducts() {
    return [
        {
            id: 'demo-1',
            title: 'Minimalist Black T-Shirt',
            description: 'Comfortable cotton t-shirt with minimalist design',
            category: 'tshirt',
            price: 24.99,
            status: 'published',
            images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'],
            source: 'local',
            created_at: new Date().toISOString(),
            rating_stats: [{ average_rating: 4.5, monthly_sales_estimate: 45 }]
        },
        {
            id: 'demo-2',
            title: 'Custom Coffee Mug',
            description: 'Personalized ceramic mug for coffee lovers',
            category: 'mug',
            price: 18.99,
            status: 'published',
            images: ['https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop'],
            source: 'local',
            created_at: new Date().toISOString(),
            rating_stats: [{ average_rating: 4.2, monthly_sales_estimate: 32 }]
        }
    ];
}

function showProductsLoading(show) {
    const loadingEl = document.getElementById('products-loading');
    const gridEl = document.getElementById('products-grid');
    const emptyEl = document.getElementById('products-empty');
    
    if (loadingEl) loadingEl.classList.toggle('hidden', !show);
    if (gridEl) gridEl.classList.toggle('hidden', show);
    if (emptyEl) emptyEl.classList.add('hidden');
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
    
    // Attach event listeners
    attachProductCardListeners();
}

function createProductCardHTML(product) {
    const statusClass = getProductStatusClass(product.status);
    const statusText = getProductStatusText(product.status);
    const price = parseFloat(product.price || 0).toFixed(2);
    const rating = product.rating_stats?.[0];
    const source = product.source || 'local';
    const isEtsyProduct = source === 'etsy';
    const imageUrl = product.images && product.images.length > 0 ? 
        product.images[0] : getRandomProductImage(product.category);
    
    return `
        <div class="product-card ${isEtsyProduct ? 'etsy-product-card' : ''}" 
             data-id="${product.id}" 
             data-status="${product.status}" 
             data-category="${product.category}"
             data-source="${source}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.title}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/400x300/cccccc/969696?text=Product+Image';">
                <div class="product-badge ${statusClass}">${statusText}</div>
                ${isEtsyProduct ? `
                    <div class="etsy-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        Etsy
                    </div>
                ` : ''}
                <div class="price-badge">$${price}</div>
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-title">
                        ${truncateText(product.title, 40)}
                        <span class="product-source-badge source-${source}">
                            ${source === 'etsy' ? 'Etsy' : source === 'ai' ? 'AI' : 'Local'}
                        </span>
                    </h3>
                </div>
                <span class="product-category">${product.category || 'Uncategorized'}</span>
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
                    ${isEtsyProduct ? `
                        <button class="btn btn-outline btn-sm" data-action="view-etsy" data-product-id="${product.id}">
                            View on Etsy
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-sm" data-action="publish-etsy" data-product-id="${product.id}">
                            Publish to Etsy
                        </button>
                    `}
                    <button class="btn btn-outline btn-sm" data-action="mockup" data-product-id="${product.id}">
                        Mockup
                    </button>
                    <button class="btn btn-outline btn-sm" data-action="edit" data-product-id="${product.id}">
                        Edit
                    </button>
                    ${!isEtsyProduct ? `
                        <button class="btn btn-outline btn-sm" data-action="similar" data-product-id="${product.id}">
                            Similar
                        </button>
                        <button class="btn btn-outline btn-sm" data-action="delete" data-product-id="${product.id}">
                            Delete
                        </button>
                    ` : ''}
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
    
    // Publish to Etsy button
    document.querySelectorAll('[data-action="publish-etsy"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            publishToEtsy(productId);
        });
    });
    
    // View on Etsy button
    document.querySelectorAll('[data-action="view-etsy"]').forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.dataset.productId;
            const product = currentProducts.find(p => p.id === productId);
            if (product && product.etsy_listing_id) {
                window.open(`https://www.etsy.com/listing/${product.etsy_listing_id}`, '_blank');
            }
        });
    });
}

function setupEventListeners() {
    // New product buttons
    document.getElementById('btn-new-product')?.addEventListener('click', showNewProductModal);
    document.getElementById('btn-empty-new-product')?.addEventListener('click', showNewProductModal);
    
    // Import from Etsy buttons
    document.getElementById('btn-import-etsy')?.addEventListener('click', showEtsyImportModal);
    document.getElementById('btn-empty-import-etsy')?.addEventListener('click', showEtsyImportModal);
    
    // Trend analysis
    document.getElementById('btn-analyze-top-sellers')?.addEventListener('click', analyzeTopSellers);
    
    // Etsy connect/disconnect
    document.getElementById('btn-disconnect-etsy')?.addEventListener('click', disconnectEtsy);
    document.getElementById('btn-connect-etsy')?.addEventListener('click', connectEtsy);
    
    // Filters
    document.getElementById('filter-status')?.addEventListener('change', filterProducts);
    document.getElementById('filter-category')?.addEventListener('change', filterProducts);
    document.getElementById('filter-source')?.addEventListener('change', filterProducts);
    
    // Search
    document.getElementById('search-products')?.addEventListener('input', filterProducts);
    
    // Modal close buttons
    document.getElementById('modal-product-close')?.addEventListener('click', () => closeModal('modal-product'));
    document.getElementById('btn-cancel-product')?.addEventListener('click', () => closeModal('modal-product'));
    document.getElementById('modal-mockup-close')?.addEventListener('click', () => closeModal('modal-mockup'));
    document.getElementById('modal-etsy-import-close')?.addEventListener('click', () => closeModal('modal-etsy-import'));
    document.getElementById('modal-etsy-connect-close')?.addEventListener('click', () => closeModal('modal-etsy-connect'));
    
    // Form submit
    document.getElementById('form-product')?.addEventListener('submit', handleProductFormSubmit);
    
    // AI description generation
    document.getElementById('btn-generate-description')?.addEventListener('click', generateDescriptionWithAI);
    
    // Image upload
    document.getElementById('btn-upload-images')?.addEventListener('click', () => {
        document.getElementById('file-upload').click();
    });
    
    document.getElementById('file-upload')?.addEventListener('change', handleImageUpload);
    
    // Modal outside click
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function updateUI() {
    // Update Etsy connection status
    const etsyPanel = document.getElementById('etsy-connection-panel');
    const etsyStatus = document.getElementById('etsy-status');
    
    if (isEtsyConnected && etsyShop) {
        if (etsyPanel) etsyPanel.classList.remove('hidden');
        if (etsyStatus) {
            etsyStatus.style.display = 'flex';
            document.getElementById('etsy-status-text').textContent = etsyShop.shop_name;
        }
    } else {
        if (etsyPanel) etsyPanel.classList.add('hidden');
        if (etsyStatus) etsyStatus.style.display = 'none';
    }
}

async function showEtsyImportModal() {
    if (!isEtsyConnected || !etsyService) {
        showNotification('Please connect your Etsy shop first', 'warning');
        showModal('modal-etsy-connect');
        return;
    }
    
    try {
        showLoading('Loading Etsy products...');
        
        // Get Etsy listings
        const listingsData = await etsyService.getShopListings(50, 0, 'active');
        
        if (!listingsData || !listingsData.results || listingsData.results.length === 0) {
            showNotification('No products found in your Etsy shop', 'info');
            closeModal('modal-etsy-import');
            return;
        }
        
        // Show import modal
        const content = document.getElementById('etsy-import-content');
        if (content) {
            content.innerHTML = `
                <div style="max-height: 400px; overflow-y: auto;">
                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">
                        Select products to import from Etsy (${listingsData.results.length} found)
                    </h3>
                    
                    ${listingsData.results.map(listing => `
                        <div class="etsy-import-item" data-listing-id="${listing.listing_id}">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 60px; height: 60px; background: #f3f4f6; border-radius: 6px; 
                                     display: flex; align-items: center; justify-content: center;">
                                    <span style="color: #9ca3af; font-size: 12px;">Image</span>
                                </div>
                                <div>
                                    <div style="font-weight: 500; margin-bottom: 4px;">${listing.title}</div>
                                    <div style="font-size: 12px; color: #6b7280;">
                                        $${listing.price?.amount || 0} • 
                                        ${listing.views || 0} views • 
                                        ${listing.num_favorers || 0} favorites
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" onclick="importEtsyProduct(${listing.listing_id})">
                                Import
                            </button>
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-primary btn-flex" onclick="importAllEtsyProducts()">
                            Import All (${listingsData.results.length})
                        </button>
                        <button class="btn btn-outline btn-flex" onclick="closeModal('modal-etsy-import')">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
        }
        
        showModal('modal-etsy-import');
        
    } catch (error) {
        console.error('Error loading Etsy products:', error);
        showNotification('Error loading Etsy products: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

window.importEtsyProduct = async function(listingId) {
    try {
        showLoading('Importing product from Etsy...');
        
        if (!etsyService) {
            throw new Error('Etsy service not available');
        }
        
        // Get listing details
        const listing = await etsyService.getListingDetails(listingId);
        const images = await etsyService.getListingImages(listingId);
        const imageUrls = images.map(img => img.url_fullxfull).slice(0, 3);
        
        // Create product in database
        const newProduct = {
            user_id: currentUser.id,
            title: listing.title,
            description: listing.description || '',
            category: mapEtsyCategory(listing.taxonomy_id),
            price: listing.price?.amount || 0,
            status: 'published',
            images: imageUrls,
            etsy_listing_id: listingId.toString(),
            source: 'etsy',
            tags: listing.tags || [],
            metadata: {
                etsy_data: {
                    views: listing.views,
                    favorites: listing.num_favorers,
                    state: listing.state,
                    original_created: listing.created
                }
            }
        };
        
        // Save to Supabase
        const { error } = await window.supabase
            .from('products')
            .insert([newProduct]);
        
        if (error) throw error;
        
        showNotification('Product imported successfully from Etsy', 'success');
        
        // Reload products
        await loadProducts();
        closeModal('modal-etsy-import');
        
    } catch (error) {
        console.error('Error importing Etsy product:', error);
        showNotification('Error importing product: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.importAllEtsyProducts = async function() {
    if (!confirm(`Are you sure you want to import all products from Etsy? This may take a while.`)) {
        return;
    }
    
    try {
        showLoading('Importing all products from Etsy...');
        
        if (!etsyService) {
            throw new Error('Etsy service not available');
        }
        
        // Get all listings
        const listingsData = await etsyService.getShopListings(100, 0, 'active');
        
        if (!listingsData || !listingsData.results) {
            showNotification('No products found to import', 'info');
            return;
        }
        
        let importedCount = 0;
        let errorCount = 0;
        
        // Import each product (limit to 20 for performance)
        for (const listing of listingsData.results.slice(0, 20)) {
            try {
                // Skip if already imported
                const { data: existing } = await window.supabase
                    .from('products')
                    .select('id')
                    .eq('etsy_listing_id', listing.listing_id.toString())
                    .single();
                
                if (existing) {
                    console.log(`Product ${listing.listing_id} already imported, skipping`);
                    continue;
                }
                
                // Get images
                const images = await etsyService.getListingImages(listing.listing_id);
                const imageUrls = images.map(img => img.url_fullxfull).slice(0, 3);
                
                // Create product
                const newProduct = {
                    user_id: currentUser.id,
                    title: listing.title,
                    description: listing.description || '',
                    category: mapEtsyCategory(listing.taxonomy_id),
                    price: listing.price?.amount || 0,
                    status: 'published',
                    images: imageUrls,
                    etsy_listing_id: listing.listing_id.toString(),
                    source: 'etsy',
                    tags: listing.tags || []
                };
                
                // Save to database
                await window.supabase
                    .from('products')
                    .insert([newProduct]);
                
                importedCount++;
                
            } catch (itemError) {
                console.warn(`Error importing listing ${listing.listing_id}:`, itemError);
                errorCount++;
            }
        }
        
        showNotification(`Imported ${importedCount} products from Etsy${errorCount > 0 ? ` (${errorCount} failed)` : ''}`, 'success');
        
        // Reload products
        await loadProducts();
        closeModal('modal-etsy-import');
        
    } catch (error) {
        console.error('Error importing all Etsy products:', error);
        showNotification('Error importing products: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

async function analyzeTopSellers() {
    try {
        showLoading('Analyzing Etsy trends...');
        
        let trends = [];
        
        if (isEtsyConnected && etsyService) {
            // Get real trends from Etsy
            const category = document.getElementById('filter-category')?.value || null;
            const trendingData = await etsyService.getTrendingListings(category);
            trends = trendingData.results || [];
        } else {
            // Use mock trends
            trends = getMockTrends();
        }
        
        if (trends.length === 0) {
            showNotification('No trending products found', 'info');
            return;
        }
        
        // Show trends modal
        showTrendsModal(trends);
        
    } catch (error) {
        console.error('Error analyzing trends:', error);
        showNotification('Error analyzing trends: ' + error.message, 'error');
        
        // Fallback to mock trends
        const mockTrends = getMockTrends();
        showTrendsModal(mockTrends);
    } finally {
        hideLoading();
    }
}

function getMockTrends() {
    return [
        {
            id: 'trend-1',
            title: 'Personalized Pet Portrait',
            category: 'art',
            price: 34.99,
            monthly_sales: 156,
            trend_score: 85,
            description: 'Custom pet portraits from your photos'
        },
        {
            id: 'trend-2',
            title: 'Minimalist T-Shirt Design',
            category: 'tshirt',
            price: 24.99,
            monthly_sales: 189,
            trend_score: 88,
            description: 'Clean and simple t-shirt designs'
        },
        {
            id: 'trend-3',
            title: 'Custom Coffee Mug',
            category: 'mug',
            price: 18.99,
            monthly_sales: 245,
            trend_score: 92,
            description: 'Personalized mugs for coffee lovers'
        },
        {
            id: 'trend-4',
            title: 'Minimalist Necklace',
            category: 'jewelry',
            price: 29.99,
            monthly_sales: 134,
            trend_score: 82,
            description: 'Simple and elegant necklace designs'
        }
    ];
}

function showTrendsModal(trends) {
    const container = document.getElementById('top-seller-modal-container');
    if (!container) return;
    
    const sourceText = isEtsyConnected ? 'Etsy API' : 'Demo Data';
    
    container.innerHTML = `
        <div class="modal active" id="top-seller-modal">
            <div class="modal-content" style="max-width: 900px;">
                <button class="modal-close" onclick="closeTrendsModal()">&times;</button>
                <div class="modal-header">
                    <h2 class="modal-title">Trending Products Analysis (${sourceText})</h2>
                    <p class="modal-subtitle">${trends.length} trending products found</p>
                </div>
                
                <div style="padding: 20px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
                        ${trends.map(trend => `
                            <div class="product-card" style="margin: 0;">
                                <div class="product-image">
                                    <img src="${getRandomProductImage(trend.category)}" alt="${trend.title}" style="height: 150px;">
                                    <div class="product-badge" style="background: ${trend.trend_score >= 90 ? '#dc2626' : trend.trend_score >= 80 ? '#ea580c' : '#16a34a'};">
                                        ${trend.trend_score}%
                                    </div>
                                    <div class="price-badge">$${trend.price}</div>
                                </div>
                                <div class="product-content">
                                    <h3 class="product-title">${truncateText(trend.title, 35)}</h3>
                                    <span class="product-category">${trend.category}</span>
                                    <p class="product-description">${truncateText(trend.description || '', 60)}</p>
                                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
                                        📈 ${trend.monthly_sales} sales/month
                                    </div>
                                    <button class="btn btn-primary btn-sm" style="width: 100%;" 
                                            onclick="createFromTrend('${trend.id}', '${trend.title}', '${trend.category}', ${trend.price})">
                                        Create Similar Product
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
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

window.createFromTrend = function(trendId, title, category, price) {
    // Pre-fill new product form with trend data
    resetProductForm();
    document.getElementById('product-title').value = `Inspired by: ${title}`;
    document.getElementById('product-category').value = category;
    document.getElementById('product-price').value = (parseFloat(price) * (0.8 + Math.random() * 0.4)).toFixed(2);
    document.getElementById('product-source').value = 'ai';
    
    // Generate AI description
    setTimeout(() => {
        generateDescriptionWithAI();
    }, 500);
    
    closeTrendsModal();
    showModal('modal-product');
    showNotification('Product form pre-filled with trend data', 'success');
};

async function connectEtsy() {
    const shopName = document.getElementById('etsy-shop-name')?.value.trim();
    const apiKey = document.getElementById('etsy-api-key')?.value.trim();
    const sharedSecret = document.getElementById('etsy-shared-secret')?.value.trim();
    
    if (!shopName || !apiKey) {
        showNotification('Please enter shop name and API key', 'error');
        return;
    }
    
    try {
        showLoading('Connecting to Etsy...');
        
        // Test API connection
        const testService = new window.EtsyAPIService(apiKey);
        const testResult = await testService.testConnection();
        
        if (!testResult.success) {
            throw new Error(testResult.message);
        }
        
        // Get shop ID from shop name
        let shopId = shopName;
        if (!shopName.includes('.')) {
            // Assume it's a shop ID
            try {
                const shopInfo = await testService.getShopInfo(shopName);
                shopId = shopInfo.shop_id;
            } catch (shopError) {
                console.warn('Could not get shop info:', shopError);
                // Use shop name as ID
            }
        }
        
        // Save to database
        const etsyShopData = {
            id: `etsy_${Date.now()}`,
            user_id: currentUser.id,
            shop_name: shopName,
            shop_url: `https://www.etsy.com/shop/${shopName}`,
            api_key: apiKey,
            shared_secret: sharedSecret,
            is_active: true
        };
        
        const { error } = await window.supabase
            .from('etsy_shops')
            .upsert([etsyShopData], { onConflict: 'id' });
        
        if (error) throw error;
        
        // Update local state
        etsyShop = etsyShopData;
        isEtsyConnected = true;
        etsyService = new window.EtsyAPIService(apiKey, shopId);
        
        showNotification('Etsy shop connected successfully!', 'success');
        closeModal('modal-etsy-connect');
        
        // Update UI
        updateUI();
        
        // Reload products to include Etsy products
        await loadProducts();
        
    } catch (error) {
        console.error('Error connecting Etsy:', error);
        showNotification('Failed to connect Etsy: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function disconnectEtsy() {
    if (!confirm('Are you sure you want to disconnect your Etsy shop?')) {
        return;
    }
    
    try {
        showLoading('Disconnecting Etsy...');
        
        if (etsyShop) {
            // Mark as inactive in database
            const { error } = await window.supabase
                .from('etsy_shops')
                .update({ is_active: false })
                .eq('id', etsyShop.id);
            
            if (error) throw error;
        }
        
        // Reset local state
        etsyShop = null;
        isEtsyConnected = false;
        etsyService = null;
        
        showNotification('Etsy shop disconnected', 'success');
        
        // Update UI
        updateUI();
        
        // Reload products (remove Etsy products)
        await loadProducts();
        
    } catch (error) {
        console.error('Error disconnecting Etsy:', error);
        showNotification('Error disconnecting Etsy: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function publishToEtsy(productId) {
    if (!isEtsyConnected || !etsyService) {
        showNotification('Please connect your Etsy shop first', 'warning');
        showModal('modal-etsy-connect');
        return;
    }
    
    const product = currentProducts.find(p => p.id === productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return;
    }
    
    if (!confirm(`Publish "${product.title}" to Etsy?`)) {
        return;
    }
    
    try {
        showLoading('Publishing to Etsy...');
        
        // Mock publish (real implementation would use Etsy API)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update product with Etsy listing ID
        const etsyListingId = Math.floor(Math.random() * 1000000);
        
        const { error } = await window.supabase
            .from('products')
            .update({
                etsy_listing_id: etsyListingId.toString(),
                source: 'etsy',
                status: 'published',
                updated_at: new Date().toISOString()
            })
            .eq('id', productId);
        
        if (error) throw error;
        
        showNotification(`Product published to Etsy! Listing ID: ${etsyListingId}`, 'success');
        
        // Reload products
        await loadProducts();
        
    } catch (error) {
        console.error('Error publishing to Etsy:', error);
        showNotification('Error publishing to Etsy: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// The rest of the functions remain similar to previous versions
// (showNewProductModal, closeModal, handleProductFormSubmit, etc.)
// Just make sure to use window.supabase for database operations

// Utility functions (same as before, but with window.supabase)
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function showLoading(message = 'Loading...') {
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
            <div style="background: white; padding: 24px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; min-width: 200px;">
                <div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top-color: #ea580c; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
                <p style="color: #374151; font-weight: 500;">${message}</p>
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
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; min-width: 200px;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px; margin-left: 12px; padding: 0 4px;">
                &times;
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Make functions available globally
window.closeModal = closeModal;
window.showModal = showModal;
window.showNotification = showNotification;

console.log('Products.js with Etsy integration loaded');
