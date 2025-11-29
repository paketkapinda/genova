// AI Assistant Functions - NEW DESIGN
import { supabase } from './supabaseClient.js';
import { api } from './api.js';
import { showNotification } from './ui.js';

let chatHistory = [];

export function initAI() {
  console.log('🚀 AI Assistant initializing...');
  
  // AI Tools - Yeni card yapısına uygun
  const generateDescBtn = document.getElementById('btn-generate-description');
  const generateSeoBtn = document.getElementById('btn-generate-seo');
  const analyzeBtn = document.getElementById('btn-analyze-top-seller');
  const sendBtn = document.getElementById('btn-send-chat');
  const clearBtn = document.getElementById('btn-clear-chat');
  const chatInput = document.getElementById('chat-input');

  // AI Tools Event Listeners
  if (generateDescBtn) {
    generateDescBtn.addEventListener('click', () => {
      addMessage('user', 'Generate a product description for a new t-shirt design');
      generateProductDescription();
    });
  }

  if (generateSeoBtn) {
    generateSeoBtn.addEventListener('click', () => {
      addMessage('user', 'Generate SEO tags for a vintage t-shirt');
      generateSEOTags();
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', () => {
      addMessage('user', 'Analyze top seller trends for my Etsy shop');
      analyzeTopSellers();
    });
  }

  // Chat Event Listeners
  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', clearChat);
  }

  console.log('✅ AI Assistant initialized');
}

// Yeni mesaj ekleme fonksiyonu
function addMessage(role, content) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}-message`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  if (role === 'user') {
    avatar.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>';
    messageContent.innerHTML = `<p>${content}</p>`;
  } else {
    avatar.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
    messageContent.innerHTML = `<p>${content}</p>`;
  }
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(messageContent);
  messagesContainer.appendChild(messageDiv);
  
  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Add to history
  chatHistory.push({ role, content });
}

// Typing indicator
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-message ai-message';
  typingDiv.id = 'typing-indicator';
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content chat-loading';
  messageContent.innerHTML = `
    <div class="chat-loading-dot"></div>
    <div class="chat-loading-dot"></div>
    <div class="chat-loading-dot"></div>
  `;
  
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(messageContent);
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Chat mesajı gönderme
async function sendMessage() {
  const chatInput = document.getElementById('chat-input');
  if (!chatInput || !chatInput.value.trim()) return;

  const message = chatInput.value.trim();
  chatInput.value = '';
  
  addMessage('user', message);
  showTypingIndicator();
  
  try {
    // Gerçek API çağrısı veya mock response
    const response = await getAIResponse(message);
    
    setTimeout(() => {
      hideTypingIndicator();
      addMessage('ai', response);
    }, 1000);
    
  } catch (error) {
    hideTypingIndicator();
    console.error('Chat error:', error);
    showNotification('Failed to send message', 'error');
    addMessage('ai', 'Sorry, I encountered an error. Please try again.');
  }
}

// AI Response - Gerçek API veya mock
async function getAIResponse(message) {
  try {
    // Önce gerçek API'yi dene
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { 
        message,
        history: chatHistory.slice(-10) // Son 10 mesaj
      }
    });

    if (!error && data) {
      return data.response;
    }
    
    // API yoksa mock response
    return generateMockAIResponse(message);
    
  } catch (error) {
    console.log('AI API not available, using mock response');
    return generateMockAIResponse(message);
  }
}

// Mock AI responses
function generateMockAIResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('description') || lowerMessage.includes('describe')) {
    return "I'll help you create compelling product descriptions! For best results, please provide:\n\n• Product type (t-shirt, mug, etc.)\n• Design style/theme\n• Key features\n• Target audience\n\nWould you like me to generate a description based on these details?";
  }
  
  if (lowerMessage.includes('seo') || lowerMessage.includes('tag')) {
    return "Great! SEO optimization is crucial for Etsy success. I can help you:\n\n• Generate relevant keywords\n• Optimize product titles\n• Create effective tags\n• Improve search visibility\n\nPlease share your product details for personalized SEO suggestions.";
  }
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('trend') || lowerMessage.includes('top seller')) {
    return "I can analyze market trends and top-performing products! For accurate analysis, I'll need:\n\n• Your product category\n• Target market\n• Current sales data (if available)\n• Competitor information\n\nThis helps me provide data-driven insights for your business strategy.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI Assistant for Etsy POD. I specialize in:\n\n📝 Product Descriptions\n🔍 SEO Optimization\n📈 Trend Analysis\n💡 Business Insights\n\nHow can I help you grow your Etsy business today?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to assist with various aspects of your Etsy business:\n\n**Quick Actions:**\n• Generate product descriptions\n• Create SEO-optimized tags\n• Analyze market trends\n• Provide business insights\n\n**Just ask me about:**\n• Product optimization\n• Sales strategies\n• Market research\n• Competitor analysis\n\nWhat specific area would you like help with?";
  }
  
  return "I understand you're looking for assistance with your Etsy business. I specialize in product optimization, SEO strategies, and market analysis. Could you provide more details about what you'd like help with? I'm here to support your business growth!";
}

// AI Tools Functions
function generateProductDescription() {
  showTypingIndicator();
  
  setTimeout(() => {
    hideTypingIndicator();
    const description = `**Vintage Retro T-Shirt - Premium Quality**

🌟 **Product Description:**

Crafted with exceptional attention to detail, this vintage-inspired t-shirt seamlessly blends retro aesthetics with modern comfort. Made from 100% premium ring-spun cotton, it offers unparalleled softness and durability for everyday wear.

✨ **Key Features:**
• Premium 100% ring-spun cotton fabric
• Retro vintage design with vibrant, long-lasting print
• Comfortable regular fit for all-day wear
• Pre-shrunk to maintain perfect shape wash after wash
• Breathable, soft material that gets better with time

🎨 **Design Excellence:**
Our unique retro pattern captures the essence of classic style while maintaining contemporary appeal. Each design is carefully curated to tell a story and evoke nostalgia, making it a conversation starter wherever you go.

📏 **Perfect Fit & Sizing:**
Available in sizes S-XXL with a true-to-size regular fit. Designed for comfort and versatility - perfect for layering or wearing as a standalone statement piece.

💫 **Why Choose This Shirt:**
• High-quality, eco-friendly materials
• Unique designs you won't find anywhere else
• Professional printing that withstands washing
• Perfect for casual outings, concerts, or adding vintage charm to any outfit
• Excellent gift choice for vintage enthusiasts and fashion lovers

🛍️ **Care Instructions:**
Machine wash cold, tumble dry low. For best results, turn inside out before washing and avoid bleach.

Add this standout piece to your collection today and experience the perfect blend of vintage style and modern comfort!`;
    
    addMessage('ai', description);
    showNotification('Product description generated!', 'success');
  }, 2000);
}

function generateSEOTags() {
  showTypingIndicator();
  
  setTimeout(() => {
    hideTypingIndicator();
    const tags = `**SEO Optimization for Vintage T-Shirt**

🏷️ **Primary Keywords:**
vintage tshirt, retro clothing, vintage style tshirt, retro graphic tee, vintage apparel

🎯 **Secondary Keywords:**
vintage inspired clothing, retro fashion tee, cotton tshirt vintage, comfort wear retro, unique vintage design

🔍 **Long-tail Keywords:**
vintage retro graphic tshirt, comfortable cotton vintage shirt, unique retro design tee, vintage style cotton apparel, retro inspired comfort wear

📈 **Etsy-Specific Tags:**
vintage aesthetic clothing, retro vibe tshirt, throwback style tee, classic vintage design, nostalgic clothing apparel

💡 **Optimization Tips:**

**Title Structure:**
Vintage Retro Graphic Tshirt - Premium Cotton Comfort Fit - [Your Brand Name]

**Description Keywords:**
- Mention "vintage" and "retro" multiple times
- Include "premium cotton" and "comfort fit"
- Add "unique design" and "exclusive print"
- Use "unisex" and "regular fit" for sizing

**Tag Strategy:**
1. Start with broad terms (vintage tshirt)
2. Add specific descriptors (graphic, cotton)
3. Include style words (retro, classic)
4. Add occasion tags (casual, everyday wear)
5. Include material and quality terms

**Pro Tip:** Update your tags seasonally and monitor which ones drive the most traffic!`;
    
    addMessage('ai', tags);
    showNotification('SEO tags generated!', 'success');
  }, 2000);
}

function analyzeTopSellers() {
  showTypingIndicator();
  
  setTimeout(() => {
    hideTypingIndicator();
    const analysis = `**Top Seller Analysis - Vintage & POD Category**

📊 **Market Overview:**
• Vintage category growth: +25% YoY
• Personalized items: +18% monthly growth  
• Sustainable materials: +30% engagement
• Average order value: $42.50

🎯 **Top Performing Niches:**
1. **Vintage Band Tees** (+42%)
   - High demand for 70s-90s bands
   - Strong nostalgia factor
   - Good for bundle deals

2. **Retro Gaming Designs** (+35%)
   - Classic console themes performing well
   - 25-35 age group most engaged
   - Great for limited editions

3. **80s/90s Nostalgia** (+28%)
   - Pop culture references trending
   - Social media driven demand
   - Seasonal spikes around holidays

4. **Custom Vintage Styles** (+22%)
   - Personalized elements increase value
   - Higher price point acceptance
   - Repeat customer potential

💰 **Pricing Insights:**
• **Optimal Range:** $24-$32
• **Premium Vintage:** $35-$45 (performs well)
• **Bundle Deals:** Increase AOV by 18%
• **Free Shipping:** 22% conversion boost at $35+

📈 **Q4 Forecast (Next 90 Days):**
• Expected growth: 15-20%
• Seasonal peak in 45-60 days
• Competitor activity increasing
• Holiday shopping starts early November

🚀 **Growth Opportunities:**
1. Expand vintage gaming collection
2. Test sustainable material options
3. Implement bundle pricing strategies
4. Prepare Q4 holiday inventory
5. Focus on social media marketing

💡 **Actionable Recommendations:**
• Stock up on best-sellers 60 days before holidays
• Create 3-5 new vintage designs monthly
• Test $35+ premium pricing tier
• Implement customer review collection
• Optimize for mobile shoppers (68% of traffic)`;
    
    addMessage('ai', analysis);
    showNotification('Market analysis completed!', 'success');
  }, 2500);
}

function clearChat() {
  const messagesContainer = document.getElementById('chat-messages');
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="chat-message ai-message">
        <div class="message-avatar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <div class="message-content">
          <p>Hello! I'm your AI Assistant for Etsy POD. I can help you generate product descriptions, SEO tags, analyze market trends, and provide business insights. What would you like to work on today?</p>
        </div>
      </div>
    `;
  }
  
  chatHistory = [];
  showNotification('Chat history cleared', 'info');
}

// Products sayfasından çağrılacak fonksiyonlar
export async function generateDescription(productId, context) {
  try {
    showNotification('Generating AI description...', 'info');
    const result = await api.post('/functions/v1/ai-seo', {
      product_id: productId,
      type: 'description',
      context,
    });
    showNotification('Description generated successfully!', 'success');
    return result;
  } catch (error) {
    console.error('Error generating description:', error);
    showNotification('Failed to generate description', 'error');
    return null;
  }
}

export async function generateSEOTags(productId, title) {
  try {
    showNotification('Generating SEO tags...', 'info');
    const result = await api.post('/functions/v1/ai-seo', {
      product_id: productId,
      type: 'tags',
      title,
    });
    showNotification('SEO tags generated successfully!', 'success');
    return result;
  } catch (error) {
    console.error('Error generating SEO tags:', error);
    showNotification('Failed to generate SEO tags', 'error');
    return null;
  }
}

export async function analyzeTopSeller(shopId, months = 12) {
  try {
    showNotification('Analyzing top sellers...', 'info');
    const result = await api.post('/functions/v1/ai-top-seller', {
      shop_id: shopId,
      months,
    });
    if (result.error) throw new Error(result.error);
    showNotification('Top seller analysis completed', 'success');
    return result;
  } catch (error) {
    console.error('Error analyzing top sellers:', error);
    showNotification('Failed to analyze top sellers', 'error');
    return null;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 AI Assistant loaded');
  initAI();
});
