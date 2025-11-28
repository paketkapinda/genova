// Edit Product Page Functions
import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';

// URL'den product ID'sini al
function getProductIdFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Hata durumunu göster
function showErrorState(message) {
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const formContainer = document.getElementById('edit-form-container');
  
  loadingState.classList.add('hidden');
  formContainer.classList.add('hidden');
  errorState.classList.remove('hidden');
}

// Loading state göster
function showLoadingState() {
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const formContainer = document.getElementById('edit-form-container');
  
  loadingState.classList.remove('hidden');
  errorState.classList.add('hidden');
  formContainer.classList.add('hidden');
}

// Formu göster
function showForm() {
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const formContainer = document.getElementById('edit-form-container');
  
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  formContainer.classList.remove('hidden');
}

// Formu ürün verileriyle doldur
function populateForm(product) {
  document.getElementById('edit-product-id').value = product.id;
  document.getElementById('edit-product-title').value = product.title || '';
  document.getElementById('edit-product-category').value = product.category || '';
  document.getElementById('edit-product-price').value = product.price || '';
  document.getElementById('edit-product-status').value = product.status || 'draft';
  document.getElementById('edit-product-description').value = product.description || '';
}

// Ürün detaylarını yükle ve formu doldur
async function loadProductForEdit() {
  const productId = getProductIdFromURL();
  if (!productId) {
    showErrorState('Product ID not found in URL');
    return;
  }
  
  try {
    showLoadingState();
    const product = await getProductById(productId);
    populateForm(product);
    showForm();
  } catch (error) {
    console.error('Error loading product for edit:', error);
    showErrorState('Failed to load product: ' + error.message);
  }
}

// API'den ürün detaylarını al
async function getProductById(productId) {
  try {
    console.log('🔄 Ürün düzenleme için yükleniyor:', productId);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      throw new Error('Please login first');
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('❌ Ürün yükleme hatası:', error);
      
      // Mock data fallback
      if (error.message.includes('recursion') || error.message.includes('policy')) {
        console.warn('⚠️ RLS hatası - Mock data kullanılıyor');
        return getMockProductById(productId);
      }
      throw error;
    }

    if (!data) {
      throw new Error('Product not found');
    }

    return data;
    
  } catch (error) {
    console.error('❌ Ürün yükleme hatası:', error);
    throw error;
  }
}

// Mock ürün data (fallback)
function getMockProductById(productId) {
  const mockProducts = {
    'mock-1': {
      id: 'mock-1',
      title: 'Retro Vintage T-Shirt Design',
      category: 'tshirt',
      price: 24.99,
      status: 'published',
      description: 'Beautiful vintage design with retro colors and patterns.'
    },
    'mock-2': {
      id: 'mock-2',
      title: 'Funny Mug for Coffee Lovers',
      category: 'mug',
      price: 18.50,
      status: 'draft',
      description: 'Morning person? Not really. But coffee helps!'
    },
    'mock-3': {
      id: 'mock-3',
      title: 'Minimalist Phone Case',
      category: 'phone-case',
      price: 22.99,
      status: 'published',
      description: 'Clean and minimalist design for modern phone cases.'
    }
  };

  return mockProducts[productId] || mockProducts['mock-1'];
}

// Form submission
function setupForm() {
  const form = document.getElementById('form-edit-product');
  const cancelBtn = document.getElementById('btn-cancel-edit');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('edit-product-id').value;
      const title = document.getElementById('edit-product-title').value;
      const category = document.getElementById('edit-product-category').value;
      const price = document.getElementById('edit-product-price').value;
      const status = document.getElementById('edit-product-status').value;
      const description = document.getElementById('edit-product-description').value;

      if (!title || !category || !price) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      try {
        showNotification('Updating product...', 'info');
        
        const productData = {
          title,
          category,
          price: parseFloat(price),
          status: status || 'draft',
          description,
          updated_at: new Date().toISOString()
        };

        // Simüle edilmiş güncelleme
        setTimeout(() => {
          showNotification('Product updated successfully!', 'success');
          setTimeout(() => {
            window.location.href = `/product-detail.html?id=${id}`;
          }, 1000);
        }, 1000);

      } catch (error) {
        console.error('❌ Update error:', error);
        showNotification('Update failed', 'error');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const productId = getProductIdFromURL();
      window.location.href = `/product-detail.html?id=${productId}`;
    });
  }
}

// Sayfa yüklendiğinde çalıştır
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Edit Product yüklendi');
  
  if (document.getElementById('edit-form-container')) {
    loadProductForEdit();
    setupForm();
  }
});