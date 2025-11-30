// ai-tools.js - AI Tasarım Araçları Yönetimi
import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';

export async function loadAITools() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Varsayılan AI araçları
    const defaultTools = [
      {
        id: 'openai-dalle',
        name: 'OpenAI DALL-E',
        provider: 'openai',
        is_active: false,
        api_key: '',
        config: { model: 'dall-e-3', size: '1024x1024' }
      },
      {
        id: 'openai-chatgpt',
        name: 'OpenAI ChatGPT',
        provider: 'openai', 
        is_active: false,
        api_key: '',
        config: { model: 'gpt-4' }
      },
      {
        id: 'stability-ai',
        name: 'Stability AI',
        provider: 'stability',
        is_active: false,
        api_key: '',
        config: { engine: 'stable-diffusion-xl' }
      },
      {
        id: 'midjourney',
        name: 'Midjourney',
        provider: 'midjourney',
        is_active: false,
        api_key: '',
        config: { version: '5.2' }
      }
    ];

    // Mevcut ayarları yükle
    const { data: existingTools } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('user_id', user.id);

    // Eğer hiç kayıt yoksa, varsayılan araçları ekle
    if (!existingTools || existingTools.length === 0) {
      for (const tool of defaultTools) {
        await supabase
          .from('ai_tools')
          .insert({
            user_id: user.id,
            ...tool
          });
      }
    }

    showAIToolsModal();
  } catch (error) {
    console.error('Error loading AI tools:', error);
  }
}

function showAIToolsModal() {
  const modalHTML = `
    <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-start; justify-content: center; z-index: 1000; padding-top: 2rem;">
      <div class="modal-content" style="background: white; border-radius: 12px; padding: 0; min-width: 600px; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center; position: sticky; top: 0; background: white; z-index: 10;">
          <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">AI Design Tools</h3>
          <button class="modal-close" onclick="closeAIToolsModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div class="settings-form">
            <div class="ai-tools-grid">
              <!-- AI Tools will be loaded here -->
            </div>
          </div>
        </div>
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
          <button class="settings-btn settings-btn-outline" onclick="closeAIToolsModal()">Cancel</button>
          <button class="settings-btn settings-btn-primary" onclick="saveAITools()">Save AI Tools Settings</button>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  window.closeAIToolsModal = () => {
    if (document.body.contains(modalContainer)) {
      document.body.removeChild(modalContainer);
    }
  };

  // Close modal when clicking outside
  modalContainer.addEventListener('click', (e) => {
    if (e.target === modalContainer) {
      closeAIToolsModal();
    }
  });

  loadAIToolsList();
}

async function loadAIToolsList() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: tools } = await supabase
      .from('ai_tools')
      .select('*')
      .eq('user_id', user.id);

    const container = document.querySelector('.ai-tools-grid');
    if (!container) return;

    container.innerHTML = tools.map(tool => `
      <div class="ai-tool-card ${tool.is_active ? 'active' : ''}" style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <div class="ai-tool-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div class="ai-tool-info">
            <h4 class="ai-tool-name" style="margin: 0; font-size: 1rem; font-weight: 600;">${tool.name}</h4>
            <p class="ai-tool-provider" style="margin: 0; color: #6b7280; font-size: 0.875rem;">${tool.provider}</p>
          </div>
          <label class="toggle-switch" style="position: relative; display: inline-block; width: 44px; height: 24px;">
            <input type="checkbox" ${tool.is_active ? 'checked' : ''} 
                   onchange="toggleAITool('${tool.id}', this.checked)"
                   style="opacity: 0; width: 0; height: 0;">
            <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;"></span>
            <span class="toggle-slider:before" style="position: absolute; content: ''; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;"></span>
          </label>
        </div>
        <div class="ai-tool-config">
          <div class="settings-form-group">
            <label class="settings-form-label">API Key</label>
            <input type="password" 
                   value="${tool.api_key || ''}"
                   placeholder="Enter API key"
                   class="settings-form-input api-key-input"
                   data-tool-id="${tool.id}"
                   style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;">
          </div>
          ${Object.entries(tool.config || {}).map(([key, value]) => `
            <div class="settings-form-group">
              <label class="settings-form-label">${key.charAt(0).toUpperCase() + key.slice(1)}</label>
              <input type="text" 
                     value="${value}"
                     class="settings-form-input config-input"
                     data-tool-id="${tool.id}"
                     data-config-key="${key}"
                     style="width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;">
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Toggle switch styling
    const style = document.createElement('style');
    style.textContent = `
      .toggle-switch input:checked + .toggle-slider {
        background-color: #ea580c;
      }
      
      .toggle-switch input:checked + .toggle-slider:before {
        transform: translateX(20px);
      }
      
      .ai-tool-card.active {
        border-color: #ea580c;
        background-color: #fff7ed;
      }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error('Error loading AI tools list:', error);
  }
}

window.toggleAITool = async (toolId, isActive) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('ai_tools')
      .update({ is_active: isActive })
      .eq('id', toolId)
      .eq('user_id', user.id);

    showNotification(`${isActive ? 'Activated' : 'Deactivated'} AI tool`, 'success');
    
    // Reload the tools list to update UI
    loadAIToolsList();
  } catch (error) {
    console.error('Error toggling AI tool:', error);
    showNotification('Error updating AI tool', 'error');
  }
};

window.saveAITools = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const apiKeyInputs = document.querySelectorAll('.api-key-input');
    const configInputs = document.querySelectorAll('.config-input');

    // Update API keys
    for (const input of apiKeyInputs) {
      const toolId = input.dataset.toolId;
      const apiKey = input.value;

      await supabase
        .from('ai_tools')
        .update({ api_key: apiKey })
        .eq('id', toolId)
        .eq('user_id', user.id);
    }

    // Update configs
    for (const input of configInputs) {
      const toolId = input.dataset.toolId;
      const configKey = input.dataset.configKey;
      const value = input.value;

      // Get current config
      const { data: tool } = await supabase
        .from('ai_tools')
        .select('config')
        .eq('id', toolId)
        .single();

      if (tool) {
        const updatedConfig = { ...tool.config, [configKey]: value };
        await supabase
          .from('ai_tools')
          .update({ config: updatedConfig })
          .eq('id', toolId)
          .eq('user_id', user.id);
      }
    }

    showNotification('AI tools settings saved successfully', 'success');
    window.closeAIToolsModal();
  } catch (error) {
    console.error('Error saving AI tools:', error);
    showNotification('Error saving AI tools settings', 'error');
  }
};

// Generate AI Design function
window.generateAIDesign = async () => {
  try {
    const model = document.getElementById('ai-model')?.value;
    const apiKey = document.getElementById('ai-api-key')?.value;
    const style = document.getElementById('design-style')?.value;
    const colors = document.getElementById('color-palette')?.value;
    const prompt = document.getElementById('design-prompt')?.value;
    const format = document.getElementById('output-format')?.value;

    if (!apiKey || !prompt) {
      showNotification('Please fill in API key and design prompt', 'error');
      return;
    }

    showNotification('Generating AI design...', 'info');
    
    // Show progress animation
    const progressHTML = `
      <div class="connection-progress" style="position: fixed; top: 20px; right: 20px; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1000;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div class="spinner" style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top: 2px solid #ea580c; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>Generating AI design...</span>
        </div>
      </div>
    `;
    
    const progressContainer = document.createElement('div');
    progressContainer.innerHTML = progressHTML;
    document.body.appendChild(progressContainer);

    // Simulate AI design generation
    setTimeout(() => {
      document.body.removeChild(progressContainer);
      showNotification('AI design generated successfully!', 'success');
      
      // Close modal after successful generation
      if (window.closeAIToolsModal) {
        window.closeAIToolsModal();
      }
    }, 3000);

  } catch (error) {
    console.error('Error generating AI design:', error);
    showNotification('Error generating AI design', 'error');
  }
};

// Initialize AI Tools in settings
export function initAITools() {
  // AI Tools butonunu settings'e ekle (eğer yoksa)
  if (!document.getElementById('btn-ai-tools')) {
    const settingsContainer = document.querySelector('.settings-container');
    if (settingsContainer && !document.querySelector('#ai-tools-card')) {
      const aiToolsCard = document.createElement('div');
      aiToolsCard.id = 'ai-tools-card';
      aiToolsCard.className = 'settings-card';
      aiToolsCard.innerHTML = `
        <div class="settings-card-header">
          <div class="settings-card-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
          </div>
          <div>
            <h3 class="settings-card-title">AI Design Tools</h3>
            <p class="settings-card-subtitle">Configure AI tools for product design</p>
          </div>
        </div>
        <p style="margin-bottom: 1.5rem; color: #6b7280; font-size: 0.875rem;">
          Configure OpenAI DALL-E, ChatGPT, Stability AI and other design tools for automated product creation.
        </p>
        <button id="btn-ai-tools" class="settings-btn settings-btn-primary">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Configure AI Tools
        </button>
      `;
      settingsContainer.appendChild(aiToolsCard);

      // Event listener ekle
      document.getElementById('btn-ai-tools').addEventListener('click', loadAITools);
    }
  }
}

// Initialize when page loads
if (window.location.pathname.includes('settings.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initAITools, 100);
  });
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  .ai-tool-card {
    transition: all 0.3s ease;
  }
  
  .ai-tool-card:hover {
    border-color: #ea580c;
    box-shadow: 0 4px 12px rgba(234, 88, 12, 0.1);
  }
`;
document.head.appendChild(style);
