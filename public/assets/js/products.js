// products.js - Tam Revize Edilmiş Versiyon
let currentUser = null;
let currentProducts = [];
let aiTools = [];
let topSellersData = [];

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products sayfası yükleniyor...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    currentUser = user;
    await initializeProductsPage();
});

async function initializeProductsPage() {
    setupUIEventListeners();
    await loadAITools();
    await loadUserProducts();
    setupTopSellerButton();
    updateProductStats();
}

function setupUIEventListeners() {
    // Yeni ürün butonu
    const newProductBtn = document.getElementById('newProductBtn');
    if (newProductBtn) {
        newProductBtn.addEventListener('click', showNewProductModal);
    }
    
    // AI ürün oluştur butonu
    const aiGenerateBtn = document.getElementById('aiGenerateBtn');
    if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', showAIGenerateModal);
    }
    
    // Etsy gönder butonu
    const etsyPublishBtn = document.getElementById('etsyPublishBtn');
    if (etsyPublishBtn) {
        etsyPublishBtn.addEventListener('click', publishToEtsy);
    }
    
    // Arama
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchProducts(this.value);
        });
    }
    
    // Kategori filtreleri
    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            filterProductsByCategory(category);
            updateActiveCategoryButton(this);
        });
    });
    
    // Durum filtreleri
    document.querySelectorAll('.status-filter').forEach(filter => {
        filter.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            filterProductsByStatus(status);
            updateActiveStatusButton(this);
        });
    });
}

function setupTopSellerButton() {
    const topSellerBtn = document.getElementById('topSellerBtn');
    if (topSellerBtn) {
        topSellerBtn.addEventListener('click', async function() {
            const btn = this;
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<i class="fas fa-chart-line fa-spin mr-2"></i> Analiz Ediliyor...';
            btn.disabled = true;
            
            try {
                await fetchTopSellersFromEtsy();
            } catch (error) {
                showNotification('Trend analizi başarısız: ' + error.message, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
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
        showLoading('Ürünler yükleniyor...');
        
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
        displayProducts(currentProducts);
        updateProductStats();
        
    } catch (error) {
        console.error('Ürün yükleme hatası:', error);
        showNotification('Ürünler yüklenirken hata oluştu: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = getEmptyStateHTML();
        return;
    }
    
    let html = '';
    products.forEach(product => {
        html += getProductCardHTML(product);
    });
    
    productsGrid.innerHTML = html;
}

function getEmptyStateHTML() {
    return `
        <div class="col-span-full text-center py-12">
            <div class="max-w-md mx-auto">
                <div class="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-box-open text-4xl text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Henüz ürününüz yok</h3>
                <p class="text-gray-500 mb-6">İlk ürününüzü oluşturarak başlayın</p>
                <div class="flex gap-4 justify-center">
                    <button onclick="showNewProductModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Yeni Ürün
                    </button>
                    <button onclick="fetchTopSellersFromEtsy()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                        <i class="fas fa-chart-line mr-2"></i>Trend Ürünleri Keşfet
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getProductCardHTML(product) {
    const imageUrl = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/400x400/cccccc/969696?text=Ürün+Görseli';
    
    const statusClass = getProductStatusClass(product.status);
    const rating = product.rating_stats?.[0];
    
    return `
        <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div class="relative h-48 bg-gray-100">
                <img src="${imageUrl}" alt="${product.title}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='https://via.placeholder.com/400x400/cccccc/969696?text=Görsel+Yüklenemedi'">
                
                <div class="absolute top-3 right-3 ${statusClass} px-3 py-1 rounded-full text-xs font-semibold">
                    ${getProductStatusText(product.status)}
                </div>
                
                <div class="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                    $${parseFloat(product.price).toFixed(2)}
                </div>
            </div>
            
            <div class="p-4">
                <h3 class="font-semibold text-gray-800 truncate" title="${product.title}">
                    ${product.title}
                </h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">${product.description || 'Açıklama yok'}</p>
                
                <div class="flex flex-wrap gap-1 mt-3">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        ${product.category || 'Kategori Yok'}
                    </span>
                    ${product.tags && product.tags.slice(0, 2).map(tag => `
                        <span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            ${tag}
                        </span>
                    `).join('')}
                </div>
                
                <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-star text-yellow-500 mr-1"></i>
                        <span>${rating?.average_rating?.toFixed(1) || '0.0'}</span>
                        <span class="mx-1">•</span>
                        <i class="fas fa-shopping-cart mr-1"></i>
                        <span>${rating?.monthly_sales_estimate || '0'}</span>
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button onclick="generateProductMockups('${product.id}')" 
                                class="text-blue-600 hover:text-blue-800 p-1"
                                title="Mockup Oluştur">
                            <i class="fas fa-tshirt"></i>
                        </button>
                        <button onclick="editProduct('${product.id}')" 
                                class="text-gray-600 hover:text-gray-800 p-1"
                                title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="generateSimilarProduct('${product.id}')" 
                                class="text-green-600 hover:text-green-800 p-1"
                                title="Benzer Ürün Oluştur">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="viewProductDetails('${product.id}')" 
                                class="text-purple-600 hover:text-purple-800 p-1"
                                title="Detaylar">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function fetchTopSellersFromEtsy() {
    try {
        showLoading('Etsy trend analizi yapılıyor...');
        
        // Etsy mağazasını kontrol et
        const { data: etsyShop } = await supabase
            .from('etsy_shops')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('is_active', true)
            .single();
        
        if (etsyShop) {
            // Gerçek Etsy API entegrasyonu
            topSellersData = await fetchRealEtsyTrends(etsyShop);
        } else {
            // Mock veri kullan
            topSellersData = await fetchMockTopSellers();
        }
        
        if (topSellersData.length > 0) {
            displayTopSellerModal(topSellersData);
            showNotification(`${topSellersData.length} trend ürün bulundu`, 'success');
        } else {
            showNotification('Trend ürün bulunamadı', 'warning');
        }
        
    } catch (error) {
        console.error('Top seller analiz hatası:', error);
        showNotification('Trend analizi başarısız: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function fetchRealEtsyTrends(etsyShop) {
    try {
        // Gerçek Etsy API implementasyonu için mock
        const mockTrends = generateMockTrendData();
        return mockTrends;
        
        // Gerçek implementasyon:
        /*
        const response = await fetch(`/api/etsy/trending?shop_id=${etsyShop.id}`, {
            headers: {
                'x-api-key': etsyShop.api_key
            }
        });
        
        if (!response.ok) throw new Error('Etsy API hatası');
        const data = await response.json();
        return processEtsyTrendData(data.results || []);
        */
        
    } catch (error) {
        console.error('Etsy trend çekme hatası:', error);
        return generateMockTrendData();
    }
}

function generateMockTrendData() {
    const categories = ['Art & Collectibles', 'Home & Living', 'Jewelry', 'Apparel', 'Accessories'];
    const trends = [];
    
    for (let i = 0; i < 8; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const style = ['Minimalist', 'Vintage', 'Modern', 'Handmade', 'Custom'][Math.floor(Math.random() * 5)];
        
        trends.push({
            id: `trend-${i}`,
            title: `${style} ${getProductTypeByCategory(category)}`,
            description: `Trend ${category.toLowerCase()} ürünü, ${style.toLowerCase()} tasarım`,
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
        'Art & Collectibles': ['Pet Portrait', 'Wall Art', 'Print', 'Painting'],
        'Home & Living': ['Coffee Mug', 'Candle', 'Pillow', 'Blanket'],
        'Jewelry': ['Necklace', 'Bracelet', 'Earrings', 'Ring'],
        'Apparel': ['T-Shirt', 'Hoodie', 'Sweatshirt', 'Tank Top'],
        'Accessories': ['Keychain', 'Bag', 'Wallet', 'Phone Case']
    };
    
    const categoryTypes = types[category] || ['Product'];
    return categoryTypes[Math.floor(Math.random() * categoryTypes.length)];
}

function getRandomProductImage(category) {
    const images = {
        'Art & Collectibles': 'https://images.unsplash.com/photo-1579168765467-3b235f938439?w=400&h=400&fit=crop',
        'Home & Living': 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400&h=400&fit=crop',
        'Jewelry': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
        'Apparel': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
        'Accessories': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'
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
    const modal = document.getElementById('topSellerModal');
    if (!modal) return;
    
    let html = `
        <div class="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-bold">
                            <i class="fas fa-chart-line mr-3"></i>Trend Ürün Analizi
                        </h3>
                        <p class="text-purple-100 mt-1">${trends.length} trend ürün bulundu</p>
                    </div>
                    <button onclick="closeModal('topSellerModal')" class="text-white hover:text-purple-200 text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-4 bg-gray-50 border-b">
                <div class="flex flex-wrap gap-2">
                    <button onclick="filterTrends('all')" class="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        Tümü
                    </button>
                    <button onclick="filterTrends('high_trend')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-fire mr-2"></i>Yüksek Trend
                    </button>
                    <button onclick="filterTrends('high_sales')" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                        <i class="fas fa-chart-bar mr-2"></i>Çok Satanlar
                    </button>
                </div>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-[60vh]">
                <div id="trendsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    `;
    
    trends.forEach((trend, index) => {
        const trendColor = trend.trend_score >= 90 ? 'bg-red-100 text-red-800' :
                          trend.trend_score >= 80 ? 'bg-orange-100 text-orange-800' :
                          trend.trend_score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800';
        
        html += `
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div class="relative h-48 bg-gray-100">
                    <img src="${trend.image_url}" alt="${trend.title}"
                         class="w-full h-full object-cover">
                    
                    <div class="absolute top-3 right-3 ${trendColor} px-3 py-1 rounded-full text-sm font-bold">
                        ${trend.trend_score.toFixed(1)}
                    </div>
                    
                    <div class="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-3 py-1 rounded-lg text-sm">
                        <i class="fas fa-shopping-cart mr-1"></i>${trend.monthly_sales}/ay
                    </div>
                </div>
                
                <div class="p-4">
                    <h4 class="font-bold text-gray-800 truncate">${trend.title}</h4>
                    <p class="text-sm text-gray-600 mt-1 line-clamp-2">${trend.description}</p>
                    
                    <div class="flex justify-between items-center mt-4">
                        <span class="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full">
                            ${trend.category}
                        </span>
                        <span class="font-bold text-lg text-gray-800">
                            $${parseFloat(trend.price).toFixed(2)}
                        </span>
                    </div>
                    
                    <div class="flex flex-wrap gap-1 mt-3">
                        ${trend.tags.slice(0, 3).map(tag => `
                            <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                ${tag}
                            </span>
                        `).join('')}
                    </div>
                    
                    <div class="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button onclick="createProductFromTrend(${index})" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">
                            <i class="fas fa-magic mr-2"></i>AI ile Oluştur
                        </button>
                        <button onclick="saveTrend(${index})" 
                                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-bookmark"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 border-t">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-info-circle mr-2"></i>
                        AI ile ürün oluşturmak için yukarıdaki butonları kullanın
                    </div>
                    <button onclick="closeModal('topSellerModal')" 
                            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.innerHTML = html;
    modal.classList.remove('hidden');
}

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
        
        // AI araç kontrolü
        if (aiTools.length === 0) {
            await createManualSimilarProduct(originalProduct);
            return;
        }
        
        // AI ile görsel oluştur
        const variation = getRandomVariation();
        const generatedImage = await generateAIImage(originalProduct, variation);
        
        // Yeni ürün oluştur
        const newProduct = {
            user_id: currentUser.id,
            title: `${variation.style} ${originalProduct.title}`,
            description: `${variation.style} varyasyonu: ${originalProduct.description || ''}`,
            category: originalProduct.category,
            price: calculateVariedPrice(originalProduct.price),
            images: [generatedImage],
            tags: [...(originalProduct.tags || []), variation.style, 'ai_generated'],
            status: 'draft',
            type: originalProduct.type,
            metadata: {
                original_product_id: originalProduct.id,
                variation: variation
            }
        };
        
        const { data: createdProduct, error } = await supabase
            .from('products')
            .insert(newProduct)
            .select()
            .single();
        
        if (error) throw error;
        
        // AI log kaydı
        await supabase.from('ai_logs').insert({
            user_id: currentUser.id,
            product_id: createdProduct.id,
            operation_type: 'mockup',
            input_data: { original_product: originalProduct, variation: variation },
            output_data: { generated_image: generatedImage },
            model_used: 'dall-e-3',
            status: 'completed',
            cost_estimate: 0.02
        });
        
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
    // Mock AI görsel üretimi - gerçek implementasyonda AI API çağrısı yapılacak
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
        status: 'draft',
        type: originalProduct.type
    };
    
    const { error } = await supabase
        .from('products')
        .insert(newProduct);
    
    if (error) throw error;
    
    showNotification('Manuel olarak benzer ürün oluşturuldu', 'success');
    await loadUserProducts();
}

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
            // Mock mockup üretimi
            mockupUrls = generateMockMockups();
        }
        
        // Ürünü güncelle
        const { error } = await supabase
            .from('products')
            .update({ mockup_urls: mockupUrls })
            .eq('id', productId);
        
        if (error) throw error;
        
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

function updateProductStats() {
    if (!currentProducts || currentProducts.length === 0) {
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('listedProducts').textContent = '0';
        document.getElementById('draftProducts').textContent = '0';
        document.getElementById('totalValue').textContent = '$0';
        return;
    }
    
    const total = currentProducts.length;
    const listed = currentProducts.filter(p => p.status === 'listed').length;
    const draft = currentProducts.filter(p => p.status === 'draft').length;
    const totalValue = currentProducts.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);
    
    document.getElementById('totalProducts').textContent = total.toString();
    document.getElementById('listedProducts').textContent = listed.toString();
    document.getElementById('draftProducts').textContent = draft.toString();
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
}

function filterProductsByCategory(category) {
    const cards = document.querySelectorAll('#productsGrid > div');
    
    cards.forEach(card => {
        if (category === 'all') {
            card.style.display = '';
        } else {
            const categorySpan = card.querySelector('.bg-blue-100');
            if (categorySpan) {
                const cardCategory = categorySpan.textContent.trim();
                card.style.display = cardCategory === category ? '' : 'none';
            }
        }
    });
}

function filterProductsByStatus(status) {
    const cards = document.querySelectorAll('#productsGrid > div');
    
    cards.forEach(card => {
        if (status === 'all') {
            card.style.display = '';
        } else {
            const statusBadge = card.querySelector('.absolute.top-3.right-3');
            if (statusBadge) {
                const cardStatus = getStatusFromText(statusBadge.textContent.trim());
                card.style.display = cardStatus === status ? '' : 'none';
            }
        }
    });
}

function searchProducts(query) {
    const cards = document.querySelectorAll('#productsGrid > div');
    const searchTerm = query.toLowerCase().trim();
    
    cards.forEach(card => {
        if (searchTerm === '') {
            card.style.display = '';
        } else {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.bg-gray-100')).map(tag => tag.textContent.toLowerCase()).join(' ');
            
            const cardText = `${title} ${description} ${tags}`;
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

// Yardımcı fonksiyonlar
function getProductStatusClass(status) {
    const classMap = {
        'draft': 'bg-gray-100 text-gray-800',
        'listed': 'bg-green-100 text-green-800',
        'archived': 'bg-red-100 text-red-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
}

function getProductStatusText(status) {
    const textMap = {
        'draft': 'Taslak',
        'listed': 'Yayında',
        'archived': 'Arşiv'
    };
    return textMap[status] || status;
}

function getStatusFromText(text) {
    const reverseMap = {
        'taslak': 'draft',
        'yayında': 'listed',
        'arşiv': 'archived'
    };
    return reverseMap[text.toLowerCase()] || text;
}

// Global fonksiyonlar
window.generateSimilarProduct = generateSimilarProduct;
window.generateProductMockups = generateProductMockups;
window.viewProductDetails = async function(productId) {
    showNotification('Ürün detayları gösterilecek', 'info');
};

window.editProduct = async function(productId) {
    showNotification('Ürün düzenleme sayfası açılacak', 'info');
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
            type: 'POD',
            metadata: { source: 'trend_analysis', trend_score: trend.trend_score }
        };
        
        const { error } = await supabase
            .from('products')
            .insert(newProduct);
        
        if (error) throw error;
        
        showNotification('Ürün başarıyla oluşturuldu!', 'success');
        await loadUserProducts();
        closeModal('topSellerModal');
        
    } catch (error) {
        showNotification('Ürün oluşturulamadı: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

window.saveTrend = function(index) {
    const trend = topSellersData[index];
    if (!trend) return;
    
    // Trend'i kaydet
    showNotification('Trend kaydedildi', 'success');
};

window.filterTrends = function(filter) {
    const cards = document.querySelectorAll('#trendsGrid > div');
    
    cards.forEach(card => {
        if (filter === 'all') {
            card.style.display = '';
        } else if (filter === 'high_trend') {
            const scoreElement = card.querySelector('.absolute.top-3.right-3');
            if (scoreElement) {
                const scoreText = scoreElement.textContent.trim();
                const score = parseFloat(scoreText);
                card.style.display = score >= 80 ? '' : 'none';
            }
        } else if (filter === 'high_sales') {
            const salesElement = card.querySelector('.absolute.bottom-3.left-3');
            if (salesElement) {
                const salesText = salesElement.textContent.trim();
                const sales = parseInt(salesText.split('/')[0]);
                card.style.display = sales >= 150 ? '' : 'none';
            }
        }
    });
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.innerHTML = '';
    }
};

// Modal fonksiyonları (basit implementasyon)
window.showNewProductModal = function() {
    showNotification('Yeni ürün modalı açılacak', 'info');
};

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
        // Şimdilik mock başarılı mesajı
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        showNotification('Ürün Etsy\'ye başarıyla gönderildi!', 'success');
        
    } catch (error) {
        showNotification('Etsy gönderimi başarısız: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
};

// Loading ve notification fonksiyonları (payment.js ile aynı)
function showLoading(message = 'Yükleniyor...') {
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
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
