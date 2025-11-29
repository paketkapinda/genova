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
    <div class="modal-overlay">
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">AI Design Tools</h3>
          <button class="modal-close" onclick="closeAIToolsModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="settings-form">
            <div class="ai-tools-grid">
              <!-- AI Tools will be loaded here -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="settings-btn settings-btn-primary" onclick="saveAITools()">
            Save AI Tools Settings
          </button>
        </div>
      </div>
    </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);

  window.closeAIToolsModal = () => {
    document.body.removeChild(modalContainer);
  };

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
      <div class="ai-tool-card ${tool.is_active ? 'active' : ''}">
        <div class="ai-tool-header">
          <div class="ai-tool-info">
            <h4 class="ai-tool-name">${tool.name}</h4>
            <p class="ai-tool-provider">${tool.provider}</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" ${tool.is_active ? 'checked' : ''} 
                   onchange="toggleAITool('${tool.id}', this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="ai-tool-config">
          <div class="settings-form-group">
            <label class="settings-form-label">API Key</label>
            <input type="password" 
                   value="${tool.api_key || ''}"
                   placeholder="Enter API key"
                   class="settings-form-input api-key-input"
                   data-tool-id="${tool.id}">
          </div>
          ${Object.entries(tool.config || {}).map(([key, value]) => `
            <div class="settings-form-group">
              <label class="settings-form-label">${key}</label>
              <input type="text" 
                     value="${value}"
                     class="settings-form-input config-input"
                     data-tool-id="${tool.id}"
                     data-config-key="${key}">
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
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
  } catch (error) {
    console.error('Error toggling AI tool:', error);
  }
};

window.saveAITools = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const apiKeyInputs = document.querySelectorAll('.api-key-input');
    const configInputs = document.querySelectorAll('.config-input');

    for (const input of apiKeyInputs) {
      const toolId = input.dataset.toolId;
      const apiKey = input.value;

      if (apiKey) {
        await supabase
          .from('ai_tools')
          .update({ api_key: apiKey })
          .eq('id', toolId)
          .eq('user_id', user.id);
      }
    }

    for (const input of configInputs) {
      const toolId = input.dataset.toolId;
      const configKey = input.dataset.configKey;
      const value = input.value;

      // Config güncelleme
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

// Initialize AI Tools in settings
if (window.location.pathname.includes('settings.html')) {
  // AI Tools butonunu settings'e ekle
  const aiToolsBtn = document.createElement('button');
  aiToolsBtn.className = 'settings-btn settings-btn-primary';
  aiToolsBtn.innerHTML = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
    AI Design Tools
  `;
  aiToolsBtn.onclick = loadAITools;

  // Settings container'a ekle
  const settingsContainer = document.querySelector('.settings-container');
  if (settingsContainer) {
    const aiToolsCard = document.createElement('div');
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
    `;
    aiToolsCard.appendChild(aiToolsBtn);
    settingsContainer.appendChild(aiToolsCard);
  }
}