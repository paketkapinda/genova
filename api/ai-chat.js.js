// /api/ai-chat.js (Netlify Functions veya benzeri için)
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history, context = 'etsy_business' } = req.body;
    
    // API key'leri environment variables'dan al
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    // Sistem prompt'u - Etsy uzmanı gibi davranması için
    const systemPrompt = `You are an expert Etsy seller and POD (Print-on-Demand) business consultant. You help users with:

- Product descriptions and listing optimization
- SEO strategies and keyword research
- Pricing and profit margin calculations
- Sales analysis and business insights
- Design trends and product ideas
- Marketing and social media strategies
- Customer service and messaging

Always provide practical, actionable advice specific to Etsy and POD businesses. Be concise but helpful.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Son 10 mesajı al (context window için)
      { role: 'user', content: message }
    ];

    // Öncelik sırası: OpenAI → OpenRouter → Anthropic
    let aiResponse = await tryOpenAI(messages, OPENAI_API_KEY);
    if (!aiResponse) aiResponse = await tryOpenRouter(messages, OPENROUTER_API_KEY);
    if (!aiResponse) aiResponse = await tryAnthropic(messages, ANTHROPIC_API_KEY);

    if (aiResponse) {
      return res.json({ response: aiResponse });
    } else {
      return res.status(503).json({ error: 'All AI services are unavailable' });
    }
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// OpenAI GPT-4/GPT-3.5
async function tryOpenAI(messages, apiKey) {
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4', // veya 'gpt-3.5-turbo'
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
  }
  return null;
}

// OpenRouter (çoklu model desteği)
async function tryOpenRouter(messages, apiKey) {
  if (!apiKey) return null;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-etsy-app.com', // Gerekli
        'X-Title': 'Etsy AI POD Assistant', // Gerekli
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-sonnet', // veya 'google/gemini-pro'
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('OpenRouter Error:', error);
  }
  return null;
}

// Anthropic Claude
async function tryAnthropic(messages, apiKey) {
  if (!apiKey) return null;

  try {
    // Sistem mesajını Anthropic formatına çevir
    const conversation = messages.filter(msg => msg.role !== 'system');
    const systemMessage = messages.find(msg => msg.role === 'system')?.content;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.7,
        system: systemMessage,
        messages: conversation,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.content[0].text;
    }
  } catch (error) {
    console.error('Anthropic Error:', error);
  }
  return null;
}