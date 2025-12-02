// main-integrations.js
import { analyzeTopSellersWithAnimation } from './ai-top-seller-enhanced.js';
import { loadDashboardPayments } from './dashboard-payments.js';
import { loadRecentActivities } from './dashboard-activities.js';

// Dashboard'da tüm entegrasyonları başlat
document.addEventListener('DOMContentLoaded', function() {
  // Payments verilerini yükle
  loadDashboardPayments();
  
  // Recent activities yükle
  loadRecentActivities();
  
  // AI Top Seller butonu
  const analyzeBtn = document.getElementById('btn-analyze-top-seller');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      analyzeTopSellersWithAnimation('current_shop');
    });
  }
  
  // AI Assistant kartlarına event listener'lar ekle
  const aiCards = document.querySelectorAll('.ai-tool-card');
  aiCards.forEach(card => {
    card.addEventListener('click', function() {
      const cardId = this.id;
      handleAICardClick(cardId);
    });
  });
});

// Eksik fonksiyonları ekleyin
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    font-weight: 500;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  // Animasyon için style ekle
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
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
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}
function handleAICardClick(cardId) {
  switch(cardId) {
    case 'btn-generate-description':
      showNotification('Redirecting to product creation...', 'info');
      window.location.href = '/products.html?action=generate_description';
      break;
      
    case 'btn-generate-seo':
      showNotification('Redirecting to product creation...', 'info');
      window.location.href = '/products.html?action=generate_seo';
      break;
      
    case 'btn-analyze-top-seller':
      analyzeTopSellersWithAnimation('current_shop');
      break;
      
    default:
      showNotification('AI feature coming soon!', 'info');
  }
}

// Global fonksiyonlar
window.analyzeTopSellersWithAnimation = analyzeTopSellersWithAnimation;
window.showProductContentGenerator = showProductContentGenerator;
