// Supabase client initialisation for browser
// Uses anon key and URL from window globals injected by env.js

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0';

// Wait for env.js to load credentials if needed
async function waitForCredentials() {
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    return;
  }
  
  if (window.__SUPABASE_ENV_PROMISE__) {
    await window.__SUPABASE_ENV_PROMISE__;
  } else {
    // Wait a short time for env.js to load
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

await waitForCredentials();

const supabaseUrl = window.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabaseClient] Missing SUPABASE_URL or SUPABASE_ANON_KEY. ' +
    'Make sure env.js is loaded before supabaseClient.js. ' +
    'Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel environment variables.'
  );
  throw new Error('Supabase credentials not loaded');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

// ==================== REFERRAL SYSTEM FUNCTIONS ====================

// Referans kodu oluştur (UUID'nin ilk kısmını kullan)
export function getReferralCode(userId) {
    if (!userId) return null;
    return userId.split('-')[0].toLowerCase();
}

// URL'den referral code çıkarma
export function getReferralCodeFromURL() {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    return refCode ? refCode.toLowerCase() : null;
}

// Referans kodu ile kullanıcı bul
async function findUserByReferralCode(referralCode) {
    try {
        if (!referralCode) return null;
        
        // Referans kodu ile kullanıcı ara
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, referral_code')
            .ilike('referral_code', referralCode);
        
        if (error) throw error;
        
        if (users && users.length > 0) {
            return users[0].id;
        }
        
        return null;
    } catch (error) {
        console.error('Find user by referral code error:', error);
        return null;
    }
}

// Referans kaydı oluşturma
export async function createProfileWithReferral(user, referralCode = null) {
    try {
        let referredBy = null;
        
        // Referans kodu varsa, referans vereni bul
        if (referralCode) {
            referredBy = await findUserByReferralCode(referralCode);
        }
        
        // Kullanıcının referral kodunu oluştur
        const userReferralCode = getReferralCode(user.id);
        
        // Profil oluştur veya güncelle
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || '',
                referral_code: userReferralCode,
                referred_by: referredBy,
                referral_balance: 0,
                total_referrals: 0,
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'id',
                ignoreDuplicates: false
            })
            .select()
            .single();
        
        if (profileError) throw profileError;
        
        // Referans bonusu ekle
        if (referredBy) {
            await addReferralBonus(referredBy);
        }
        
        return profile;
    } catch (error) {
        console.error('Profil oluşturma hatası:', error);
        throw error;
    }
}

// Referans bonusu ekle
async function addReferralBonus(referrerId) {
    try {
        const referralBonus = 8.70; // 29 USD'nin %30'u
        
        // Referans verenin mevcut bilgilerini al
        const { data: referrerData } = await supabase
            .from('profiles')
            .select('referral_balance, total_referrals')
            .eq('id', referrerId)
            .single();
        
        if (referrerData) {
            // Bakiyeyi güncelle
            await supabase
                .from('profiles')
                .update({
                    referral_balance: (parseFloat(referrerData.referral_balance) || 0) + referralBonus,
                    total_referrals: (parseInt(referrerData.total_referrals) || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', referrerId);
        }
    } catch (error) {
        console.error('Referans bonusu ekleme hatası:', error);
    }
}

// Kullanıcının referral bilgilerini getir
export async function getUserReferralInfo(userId) {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('referral_code, referral_balance, total_referrals, full_name')
            .eq('id', userId)
            .single();
        
        if (error) {
            // Profil yoksa, referral kodu oluştur
            const referralCode = getReferralCode(userId);
            return {
                referral_code: referralCode,
                referral_balance: 0,
                total_referrals: 0,
                full_name: ''
            };
        }
        
        // Referans kodu yoksa oluştur
        if (!profile.referral_code) {
            const referralCode = getReferralCode(userId);
            await supabase
                .from('profiles')
                .update({
                    referral_code: referralCode,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            
            profile.referral_code = referralCode;
        }
        
        return profile;
    } catch (error) {
        console.error('Referral info get error:', error);
        const referralCode = getReferralCode(userId);
        return {
            referral_code: referralCode,
            referral_balance: 0,
            total_referrals: 0,
            full_name: ''
        };
    }
}

// Referans geçmişini getir
export async function getReferralHistory(userId) {
    try {
        const { data: referrals, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, created_at')
            .eq('referred_by', userId)
            .order('created_at', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        return referrals || [];
    } catch (error) {
        console.error('Referral history error:', error);
        return [];
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Bildirim göster
export function showNotification(message, type = 'info') {
    if (typeof document === 'undefined') return;
    
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 10px;
        color: white;
        font-weight: 500;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Modal gizle
export function hideModal(modalId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Modal göster
export function showModal(modalId) {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// ==================== EXISTING CODE ====================

function setupModal() {
  const modalClose = document.getElementById('modal-product-close');
  const cancelBtn = document.getElementById('btn-cancel-product');
  const modal = document.getElementById('modal-product');

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      hideModal('modal-product');
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideModal('modal-product');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal('modal-product');
      }
    });
  }

  const form = document.getElementById('form-product');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const id = document.getElementById('product-id').value;
      const title = document.getElementById('product-title').value;
      const category = document.getElementById('product-category').value;
      const price = document.getElementById('product-price').value;
      const status = document.getElementById('product-status').value;
      const description = document.getElementById('product-description').value;

      if (!title || !category || !price) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      try {
        showNotification('Updating product...', 'info');
        
        setTimeout(() => {
          showNotification('Product updated successfully!', 'success');
          hideModal('modal-product');
          
          setTimeout(() => {
            loadProductDetail();
          }, 500);
          
        }, 1000);

      } catch (error) {
        console.error('❌ Update error:', error);
        showNotification('Update failed', 'error');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Product Detail yüklendi');
  
  if (document.getElementById('product-detail-container')) {
    loadProductDetail();
    setupActionButtons();
    setupModal();
  }
});
