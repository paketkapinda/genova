// ai.js - Complete AI Assistant with All Features
import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';

// Aktif AI sağlayıcısını almak için yardımcı fonksiyon
async function getActiveAIProvider() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: apiKeys, error } = await supabase
            .from('ai_api_keys')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Kayıt yok, default değerlerle devam et
                console.log('No AI API keys found, using default configuration');
                return { provider: 'openai', key: null };
            }
            throw error;
        }

        // Öncelik sırasına göre aktif sağlayıcıyı döndür
        if (apiKeys.openai_active && apiKeys.openai_key_encrypted) {
            return { 
                provider: 'openai', 
                key: apiKeys.openai_key_encrypted,
                model: apiKeys.openai_model || 'gpt-4',
                temperature: apiKeys.openai_temperature || 0.7
            };
        } else if (apiKeys.anthropic_active && apiKeys.anthropic_key_encrypted) {
            return { 
                provider: 'anthropic', 
                key: apiKeys.anthropic_key_encrypted,
                model: apiKeys.anthropic_model || 'claude-3-sonnet-20240229',
                temperature: apiKeys.anthropic_temperature || 0.7
            };
        } else if (apiKeys.openrouter_active && apiKeys.openrouter_key_encrypted) {
            return { 
                provider: 'openrouter', 
                key: apiKeys.openrouter_key_encrypted,
                model: apiKeys.openrouter_model || 'openai/gpt-3.5-turbo',
                temperature: apiKeys.openrouter_temperature || 0.7
            };
        }

        return { provider: 'openai', key: null };
    } catch (error) {
        console.error('Error getting active AI provider:', error);
        return { provider: 'openai', key: null };
    }
}

// ===== PRODUCT CONTENT GENERATION =====
window.generateProductDescription = async function(productData) {
    try {
        showNotification('Generating product description...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-description', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productName: productData.name,
                productType: productData.type,
                keywords: productData.keywords,
                targetAudience: productData.audience,
                style: productData.style || 'professional',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Direkt AI chat kullan
            return await generateProductDescriptionFallback(productData);
        }
        
        const result = await response.json();
        showNotification('Product description generated successfully!', 'success');
        return result.description;
    } catch (error) {
        console.error('Error generating description:', error);
        return await generateProductDescriptionFallback(productData);
    }
};

// Fallback description generation
async function generateProductDescriptionFallback(productData) {
    const prompt = `Create an Etsy product description for:
Product: ${productData.name}
Type: ${productData.type}
Keywords: ${productData.keywords?.join(', ') || 'not specified'}
Target Audience: ${productData.audience || 'general audience'}
Style: ${productData.style || 'professional'}

Please create a compelling description that includes:
- Engaging opening paragraph
- Key features and benefits
- Materials and specifications
- Usage suggestions
- Care instructions (if applicable)
- Emotional appeal
- Call to action for purchase

Format the response in clear paragraphs.`;
    
    try {
        return await window.sendAIChatMessage(prompt);
    } catch (error) {
        console.error('Fallback description failed:', error);
        return `This beautifully crafted ${productData.name} is perfect for ${productData.audience || 'your customers'}. Made with attention to detail and quality materials, this ${productData.type} will delight your customers. Features include ${productData.keywords?.join(', ') || 'excellent craftsmanship'}. Perfect as a gift or for personal use.`;
    }
}

window.generateProductTitle = async function(productData) {
    try {
        showNotification('Generating product title...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-title', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productType: productData.type,
                keywords: productData.keywords,
                style: productData.style || 'catchy',
                characterLimit: productData.characterLimit || 60,
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Direkt AI chat kullan
            return await generateProductTitleFallback(productData);
        }
        
        const result = await response.json();
        showNotification('Product title generated successfully!', 'success');
        return result.titles;
    } catch (error) {
        console.error('Error generating title:', error);
        return await generateProductTitleFallback(productData);
    }
};

async function generateProductTitleFallback(productData) {
    const prompt = `Generate ${productData.numTitles || 5} product title options for an Etsy listing:
Product Type: ${productData.type}
Keywords: ${productData.keywords?.join(', ') || 'handmade, unique, quality'}
Style: ${productData.style || 'catchy'}
Character Limit: ${productData.characterLimit || 60}

Requirements:
- Include main keywords
- Be attention-grabbing
- Optimized for Etsy search
- Include emotional triggers
- Clear and descriptive

Return as a JSON array of titles.`;
    
    try {
        const response = await window.sendAIChatMessage(prompt);
        // Parse the response to extract titles
        const titles = response.split('\n').filter(line => line.trim().length > 0);
        return titles.slice(0, productData.numTitles || 5);
    } catch (error) {
        console.error('Fallback title failed:', error);
        return [
            `Beautiful ${productData.type} - Handmade with Love`,
            `Premium ${productData.type} - Unique Design`,
            `${productData.type} Gift - Perfect Present`,
            `Custom ${productData.type} - Made to Order`,
            `${productData.type} - ${productData.keywords?.[0] || 'Quality'} Craftsmanship`
        ];
    }
}

window.generateSEOTags = async function(productData) {
    try {
        showNotification('Generating SEO tags and metadata...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-seo-tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productName: productData.name,
                productType: productData.type,
                keywords: productData.keywords,
                description: productData.description,
                targetPlatform: productData.platform || 'etsy',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Direkt AI chat kullan
            return await generateSEOTagsFallback(productData);
        }
        
        const result = await response.json();
        showNotification('SEO tags generated successfully!', 'success');
        return {
            metaDescription: result.metaDescription,
            tags: result.tags,
            categories: result.categories
        };
    } catch (error) {
        console.error('Error generating SEO tags:', error);
        return await generateSEOTagsFallback(productData);
    }
};

async function generateSEOTagsFallback(productData) {
    const prompt = `Generate SEO-optimized tags and metadata for Etsy listing:
Product: ${productData.name}
Type: ${productData.type}
Category: ${productData.category || 'Handmade'}
Materials: ${productData.materials || 'not specified'}
Style: ${productData.style || 'various'}
Description: ${productData.description?.substring(0, 200) || 'not provided'}

Provide:
1. Meta description (150-160 characters)
2. Primary keywords (3-5)
3. Long-tail keywords (5-7)
4. Product tags (13 max for Etsy)
5. Suggested categories

Format response as JSON.`;
    
    try {
        const response = await window.sendAIChatMessage(prompt);
        // Parse JSON response
        try {
            const parsed = JSON.parse(response);
            return {
                metaDescription: parsed.metaDescription || `Beautiful ${productData.type} - ${productData.name}. Handmade with quality materials. Perfect gift.`,
                tags: parsed.tags || generateDefaultTags(productData),
                categories: parsed.categories || [`${productData.type}s`, 'Handmade', 'Gifts']
            };
        } catch (e) {
            return {
                metaDescription: `Beautiful ${productData.type} - ${productData.name}. Handmade with quality materials. Perfect gift.`,
                tags: generateDefaultTags(productData),
                categories: [`${productData.type}s`, 'Handmade', 'Gifts']
            };
        }
    } catch (error) {
        console.error('Fallback SEO failed:', error);
        return {
            metaDescription: `Beautiful ${productData.type} - ${productData.name}. Handmade with quality materials. Perfect gift.`,
            tags: generateDefaultTags(productData),
            categories: [`${productData.type}s`, 'Handmade', 'Gifts']
        };
    }
}

function generateDefaultTags(productData) {
    const baseTags = [
        productData.name.toLowerCase(),
        productData.type.toLowerCase(),
        'handmade',
        'etsy',
        'gift'
    ];
    
    if (productData.keywords) {
        baseTags.push(...productData.keywords.slice(0, 8));
    }
    
    return baseTags.slice(0, 13);
}

window.generateProductTags = async function(productData) {
    try {
        showNotification('Generating product tags...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-tags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productName: productData.name,
                productType: productData.type,
                category: productData.category,
                style: productData.style,
                materials: productData.materials,
                maxTags: productData.maxTags || 13,
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Direkt AI chat kullan
            return await generateProductTagsFallback(productData);
        }
        
        const result = await response.json();
        showNotification('Product tags generated successfully!', 'success');
        return result.tags;
    } catch (error) {
        console.error('Error generating product tags:', error);
        return await generateProductTagsFallback(productData);
    }
};

async function generateProductTagsFallback(productData) {
    const prompt = `Generate ${productData.maxTags || 13} product tags for Etsy listing:
Product: ${productData.name}
Type: ${productData.type}
Category: ${productData.category || 'Handmade'}
Style: ${productData.style || 'various'}
Materials: ${productData.materials || 'not specified'}

Requirements:
- Include product type
- Include materials if specified
- Include style
- Include use cases
- Include target audience
- Include season/occasion if relevant
- Maximum 13 tags for Etsy

Return as comma-separated list.`;
    
    try {
        const response = await window.sendAIChatMessage(prompt);
        return response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } catch (error) {
        console.error('Fallback tags failed:', error);
        return generateDefaultTags(productData);
    }
};

// ===== PRODUCT DESIGN GENERATION =====
window.generateProductDesign = async function(designPrompt, style = 'modern', colors = [], dimensions = '1000x1000') {
    try {
        showNotification('Generating product design...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        
        // Show design generation progress
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

        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch('/api/generate-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                prompt: designPrompt,
                style: style,
                colorPalette: colors,
                dimensions: dimensions,
                aspectRatio: '1:1',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key
            })
        });

        if (!response.ok) throw new Error('Design generation failed');
        
        const result = await response.json();
        
        // Remove progress indicator
        document.body.removeChild(progressContainer);
        
        showNotification('Product design generated successfully!', 'success');
        return {
            imageUrl: result.designUrl,
            prompt: designPrompt,
            style: style,
            colors: colors
        };
    } catch (error) {
        console.error('Error generating design:', error);
        showNotification('Error generating product design', 'error');
        return null;
    }
};

window.generateDesignVariations = async function(baseDesign, variations = 4) {
    try {
        showNotification(`Generating ${variations} design variations...`, 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-design-variations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                baseDesign: baseDesign,
                variations: variations,
                styles: ['minimal', 'vintage', 'modern', 'abstract'],
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key
            })
        });

        if (!response.ok) throw new Error('Design variations generation failed');
        
        const result = await response.json();
        showNotification(`${variations} design variations generated!`, 'success');
        return result.variations;
    } catch (error) {
        console.error('Error generating design variations:', error);
        showNotification('Error generating design variations', 'error');
        return null;
    }
};

// ===== PRICE & BUSINESS INTELLIGENCE =====
window.recommendPrice = async function(productData, marketData = {}) {
    try {
        showNotification('Analyzing market for price recommendation...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/recommend-price', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productCost: productData.cost,
                productType: productData.type,
                competitionPrices: marketData.competition || [],
                targetMargin: marketData.margin || 0.4,
                platform: marketData.platform || 'etsy',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Basit hesaplama
            return calculateBasicPrice(productData, marketData);
        }
        
        const result = await response.json();
        showNotification('Price recommendation generated!', 'success');
        return {
            recommendedPrice: result.recommendedPrice,
            minPrice: result.minPrice,
            maxPrice: result.maxPrice,
            profitMargin: result.profitMargin,
            competitionAnalysis: result.competitionAnalysis
        };
    } catch (error) {
        console.error('Error generating price recommendation:', error);
        return calculateBasicPrice(productData, marketData);
    }
};

function calculateBasicPrice(productData, marketData) {
    const baseCost = productData.cost || 10;
    const margin = marketData.margin || 0.4;
    const recommended = baseCost * (1 + margin);
    
    return {
        recommendedPrice: Math.round(recommended * 100) / 100,
        minPrice: Math.round((baseCost * 1.2) * 100) / 100,
        maxPrice: Math.round((baseCost * 2) * 100) / 100,
        profitMargin: margin,
        competitionAnalysis: 'Using basic calculation method'
    };
}

window.analyzeProductPerformance = async function(productId) {
    try {
        showNotification('Analyzing product performance...', 'info');
        
        // Get product data
        const { data: productData, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError) throw productError;

        // Get sales data
        const { data: salesData, error: salesError } = await supabase
            .from('orders')
            .select('total_amount, created_at, status')
            .eq('product_id', productId);

        if (salesError) throw salesError;

        // Get view data
        const { data: viewData, error: viewError } = await supabase
            .from('product_analytics')
            .select('views, clicks, conversions')
            .eq('product_id', productId);

        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/analyze-performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productData: productData,
                salesData: salesData || [],
                viewData: viewData || [],
                timePeriod: '30d',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) throw new Error('Performance analysis failed');
        
        const result = await response.json();
        showNotification('Product analysis completed!', 'success');
        return result.analysis;
    } catch (error) {
        console.error('Error analyzing product performance:', error);
        showNotification('Error analyzing product performance', 'error');
        return null;
    }
};

// ===== CONTENT OPTIMIZATION =====
window.optimizeProductListing = async function(productData) {
    try {
        showNotification('Optimizing product listing...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/optimize-listing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                title: productData.title,
                description: productData.description,
                tags: productData.tags,
                category: productData.category,
                platform: productData.platform || 'etsy',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            // Fallback: Basit optimizasyon
            return basicListingOptimization(productData);
        }
        
        const result = await response.json();
        showNotification('Listing optimization completed!', 'success');
        return {
            optimizedTitle: result.optimizedTitle,
            optimizedDescription: result.optimizedDescription,
            suggestedTags: result.suggestedTags,
            seoScore: result.seoScore,
            improvements: result.improvements
        };
    } catch (error) {
        console.error('Error optimizing product listing:', error);
        return basicListingOptimization(productData);
    }
};

function basicListingOptimization(productData) {
    const title = productData.title || 'Product Listing';
    const optimizedTitle = title.length > 60 ? title.substring(0, 57) + '...' : title;
    
    return {
        optimizedTitle: optimizedTitle,
        optimizedDescription: productData.description || 'No description provided',
        suggestedTags: productData.tags || [],
        seoScore: 65,
        improvements: [
            'Consider adding more keywords to title',
            'Increase description length',
            'Use all 13 available tags'
        ]
    };
}

window.generateMarketingCopy = async function(productData, platform = 'etsy') {
    try {
        showNotification('Generating marketing copy...', 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/generate-marketing-copy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                productName: productData.name,
                productDescription: productData.description,
                targetAudience: productData.audience,
                platform: platform,
                tone: productData.tone || 'enthusiastic',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) throw new Error('Marketing copy generation failed');
        
        const result = await response.json();
        showNotification('Marketing copy generated!', 'success');
        return {
            socialMediaPosts: result.socialMediaPosts,
            emailTemplates: result.emailTemplates,
            adCopy: result.adCopy
        };
    } catch (error) {
        console.error('Error generating marketing copy:', error);
        showNotification('Error generating marketing copy', 'error');
        return null;
    }
};

// ===== BULK OPERATIONS =====
window.bulkGenerateDescriptions = async function(products) {
    try {
        showNotification(`Generating descriptions for ${products.length} products...`, 'info');
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/bulk-generate-descriptions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                products: products,
                batchSize: 5,
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) throw new Error('Bulk description generation failed');
        
        const result = await response.json();
        showNotification(`Generated descriptions for ${result.processed} products!`, 'success');
        return result.descriptions;
    } catch (error) {
        console.error('Error in bulk description generation:', error);
        showNotification('Error generating bulk descriptions', 'error');
        return null;
    }
};

// ===== AI CHAT ASSISTANT =====
window.sendAIChatMessage = async function(message, conversationHistory = []) {
    try {
        console.log('💬 Sending to AI API:', message);
        
        const activeProvider = await getActiveAIProvider();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            throw new Error('No authentication session');
        }

        const response = await fetch('/api/ai-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory,
                context: 'etsy_business',
                aiProvider: activeProvider.provider,
                apiKey: activeProvider.key,
                model: activeProvider.model,
                temperature: activeProvider.temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'AI service error');
        }

        const result = await response.json();
        console.log('✅ AI response received');
        return result.response;
        
    } catch (error) {
        console.error('❌ AI Chat Error:', error);
        // Fallback response
        return generateFallbackResponse(message, conversationHistory);
    }
};

// Özel Etsy fonksiyonları
window.generateProductDescriptionAI = async function(productData) {
    const prompt = `Create an Etsy product description for:
Product: ${productData.name}
Type: ${productData.type}
Keywords: ${productData.keywords?.join(', ') || 'not specified'}
Target Audience: ${productData.audience || 'general audience'}

Please create a compelling description that includes:
- Engaging opening
- Key features and benefits
- Technical specifications
- Usage suggestions
- Emotional appeal
- Call to action

Format in clear paragraphs.`;

    return await window.sendAIChatMessage(prompt);
};

window.generateSEOTagsAI = async function(productData) {
    const prompt = `Generate SEO-optimized tags and metadata for Etsy:
Product: ${productData.name}
Category: ${productData.category || 'Handmade'}
Materials: ${productData.materials || 'various'}
Style: ${productData.style || 'traditional'}

Provide:
1. Primary keywords (3-5)
2. Long-tail keywords (5-7)
3. Meta description (150-160 chars)
4. Product tags (13 max for Etsy)

Format as JSON.`;

    const response = await window.sendAIChatMessage(prompt);
    
    try {
        return JSON.parse(response);
    } catch (e) {
        return {
            primaryKeywords: [productData.name, productData.type, 'handmade'],
            longTailKeywords: [`${productData.name} ${productData.type}`, 'handmade gift', 'etsy shop'],
            metaDescription: `Beautiful ${productData.name} - handmade ${productData.type}. Perfect gift.`,
            tags: generateDefaultTags(productData)
        };
    }
};

window.analyzeSalesAI = async function(salesData) {
    const prompt = `Analyze this Etsy sales data and provide insights:
Total Sales: ${salesData.totalSales || 0}
Conversion Rate: ${salesData.conversionRate || 0}%
Average Order Value: $${salesData.averageOrderValue || 0}
Top Products: ${salesData.topProducts?.join(', ') || 'none'}

Provide:
- Performance analysis
- Growth opportunities
- Recommendations for improvement
- Seasonal trends if visible

Format as bullet points.`;

    return await window.sendAIChatMessage(prompt);
};

// Fallback yanıt üretici
function generateFallbackResponse(message, history) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('description') || lowerMessage.includes('describe') || lowerMessage.includes('product')) {
        return "I'd be happy to help you create a product description! For a compelling Etsy listing, focus on:\n\n• The unique features of your product\n• Materials and craftsmanship\n• Size and specifications\n• How it benefits the customer\n• What makes it special\n\nCould you tell me more about the product you'd like to describe?";
    }
    
    if (lowerMessage.includes('seo') || lowerMessage.includes('tag') || lowerMessage.includes('keyword')) {
        return "Great! For Etsy SEO optimization, consider these strategies:\n\n• Use all 13 tags effectively\n• Include long-tail keywords\n• Mention product attributes (color, size, material)\n• Use seasonal and occasion keywords\n• Research competitor tags\n\nWhat type of product are you optimizing?";
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
        return "For pricing your Etsy products, consider:\n\n• Material costs × 2-3\n• Labor time × your hourly rate\n• Etsy fees (5% + payment processing)\n• Shipping and packaging\n• Desired profit margin\n• Competitor pricing\n\nA good starting point is materials × 3 + labor + fees.";
    }
    
    if (lowerMessage.includes('sales') || lowerMessage.includes('analyze') || lowerMessage.includes('performance')) {
        return "To analyze your sales performance:\n\n• Track conversion rates\n• Monitor listing views and favorites\n• Analyze seasonal trends\n• Review customer reviews\n• Check competitor performance\n• Optimize based on data\n\nWould you like me to help analyze specific metrics?";
    }
    
    if (lowerMessage.includes('design') || lowerMessage.includes('create') || lowerMessage.includes('mockup')) {
        return "For product design inspiration:\n\n• Research trending designs on Etsy\n• Consider your target audience\n• Use color psychology\n• Create multiple variations\n• Test different styles\n• Get customer feedback\n\nWhat type of design are you working on?";
    }
    
    if (lowerMessage.includes('etsy') || lowerMessage.includes('shop') || lowerMessage.includes('store')) {
        return "For Etsy shop success:\n\n• Use high-quality photos (5+ per listing)\n• Write detailed descriptions\n• Offer excellent customer service\n• Use all available tags\n• Update listings regularly\n• Promote on social media\n• Consider Etsy Ads for top listings\n\nWhat specific aspect of your Etsy shop would you like to improve?";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
        return "Hello! I'm your Etsy AI Assistant. I can help you with:\n\n• Product descriptions and SEO\n• Pricing strategies\n• Sales analysis\n• Design inspiration\n• Marketing tips\n• Customer service templates\n\nWhat would you like help with today?";
    }
    
    return "I'm here to help with your Etsy business! I can assist with:\n\n📝 Product descriptions and listings\n🔍 SEO optimization and tags\n💰 Pricing strategies\n📈 Sales analysis and insights\n🎨 Design inspiration\n📱 Marketing and social media\n\nWhat specific area would you like to focus on?";
}

// AI Tool butonları için hızlı fonksiyonlar
window.quickGenerateDescription = async function() {
    return "I'd be happy to help you create a product description! For a compelling Etsy listing, focus on:\n\n• The unique features of your product\n• Materials and craftsmanship\n• Size and specifications\n• How it benefits the customer\n• What makes it special\n\nCould you tell me more about the product you'd like to describe?";
};

window.quickGenerateSEO = async function() {
    return "Great! For Etsy SEO optimization, consider these strategies:\n\n• Use all 13 tags effectively\n• Include long-tail keywords\n• Mention product attributes (color, size, material)\n• Use seasonal and occasion keywords\n• Research competitor tags\n\nWhat type of product are you optimizing?";
};

window.quickAnalyzePerformance = async function() {
    return "To analyze your sales performance:\n\n• Track conversion rates\n• Monitor listing views and favorites\n• Analyze seasonal trends\n• Review customer reviews\n• Check competitor performance\n• Optimize based on data\n\nWould you like me to help analyze specific metrics?";
};

// ===== HELPER FUNCTIONS =====
async function getSalesData(productId) {
    const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .eq('product_id', productId);
    
    if (error) throw error;
    return data;
}

async function getViewData(productId) {
    const { data, error } = await supabase
        .from('product_analytics')
        .select('views, clicks, conversions, created_at')
        .eq('product_id', productId);
    
    if (error) throw error;
    return data;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 AI Assistant initialized with all features');
    
    // Check AI provider status
    checkAIProviderStatus();
    
    // Initialize AI action buttons
    initializeAIActions();
});

async function checkAIProviderStatus() {
    const provider = await getActiveAIProvider();
    console.log('🤖 Active AI Provider:', provider.provider);
    
    if (!provider.key) {
        console.warn('⚠️ No API key configured for active provider');
    }
}

function initializeAIActions() {
    // Product page AI buttons
    const aiActionButtons = [
        { selector: '[data-ai-action="generate-title"]', action: 'generateTitle' },
        { selector: '[data-ai-action="generate-description"]', action: 'generateDescription' },
        { selector: '[data-ai-action="generate-tags"]', action: 'generateTags' },
        { selector: '[data-ai-action="generate-seo"]', action: 'generateSEO' },
        { selector: '[data-ai-action="generate-design"]', action: 'generateDesign' },
        { selector: '[data-ai-action="optimize-listing"]', action: 'optimizeListing' }
    ];

    aiActionButtons.forEach(({ selector, action }) => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
            button.addEventListener('click', async function() {
                await handleAIAction(action, this);
            });
        });
    });
}

async function handleAIAction(action, element) {
    const productData = getProductDataFromPage();
    
    switch(action) {
        case 'generateTitle':
            const titles = await generateProductTitle(productData);
            if (titles) {
                showTitleSelectionModal(titles);
            }
            break;
            
        case 'generateDescription':
            const description = await generateProductDescription(productData);
            if (description) {
                document.getElementById('product-description').value = description;
            }
            break;
            
        case 'generateTags':
            const tags = await generateProductTags(productData);
            if (tags) {
                document.getElementById('product-tags').value = tags.join(', ');
            }
            break;
            
        case 'generateSEO':
            const seoData = await generateSEOTags(productData);
            if (seoData) {
                showSEOModal(seoData);
            }
            break;
            
        case 'generateDesign':
            const designPrompt = prompt('Enter design description:');
            if (designPrompt) {
                const design = await generateProductDesign(designPrompt);
                if (design) {
                    showDesignModal(design);
                }
            }
            break;
            
        case 'optimizeListing':
            const optimization = await optimizeProductListing(productData);
            if (optimization) {
                showOptimizationModal(optimization);
            }
            break;
            
        default:
            console.log('Unknown AI action:', action);
    }
}

function getProductDataFromPage() {
    // Extract product data from form fields
    return {
        name: document.getElementById('product-name')?.value || '',
        type: document.getElementById('product-type')?.value || '',
        category: document.getElementById('product-category')?.value || '',
        description: document.getElementById('product-description')?.value || '',
        keywords: document.getElementById('product-keywords')?.value?.split(',') || [],
        cost: parseFloat(document.getElementById('product-cost')?.value) || 0,
        materials: document.getElementById('product-materials')?.value || '',
        style: document.getElementById('product-style')?.value || '',
        audience: document.getElementById('product-audience')?.value || ''
    };
}

// Modal functions for AI results
function showTitleSelectionModal(titles) {
    const modalHTML = `
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 0; min-width: 400px; max-width: 500px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">Select a Title</h3>
                    <button class="modal-close" onclick="window.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem; max-height: 400px; overflow-y: auto;">
                    ${titles.map((title, index) => `
                        <div class="ai-option" onclick="window.selectTitle('${title.replace(/'/g, "\\'")}')" style="padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 0.75rem; cursor: pointer; transition: all 0.3s ease;">
                            <div style="font-weight: 500; margin-bottom: 0.25rem;">${title}</div>
                            <div style="font-size: 0.75rem; color: #6b7280;">${title.length} characters</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    showModal(modalHTML);
}

function showSEOModal(seoData) {
    const modalHTML = `
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div class="modal-content" style="background: white; border-radius: 12px; padding: 0; min-width: 500px; max-width: 600px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
                    <h3 class="modal-title" style="font-size: 1.25rem; font-weight: 600; color: #111827; margin: 0;">SEO Recommendations</h3>
                    <button class="modal-close" onclick="window.closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">&times;</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem; max-height: 500px; overflow-y: auto;">
                    <div class="seo-section" style="margin-bottom: 1.5rem;">
                        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">Meta Description</h4>
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e5e7eb;">
                            <p style="margin: 0; font-size: 0.875rem; color: #4b5563;">${seoData.metaDescription}</p>
                        </div>
                        <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
                            ${seoData.metaDescription.length} characters (optimal: 150-160)
                        </div>
                    </div>
                    <div class="seo-section" style="margin-bottom: 1.5rem;">
                        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">Tags (${seoData.tags.length}/13)</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${seoData.tags.map(tag => `
                                <span style="background: #f3f4f6; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; color: #374151;">${tag}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div class="seo-section">
                        <h4 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: #374151;">Categories</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${seoData.categories.map(cat => `
                                <span style="background: #fef3c7; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.875rem; color: #92400e;">${cat}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end;">
                    <button class="settings-btn settings-btn-primary" onclick="window.closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    showModal(modalHTML);
}

// Utility functions
function showModal(html) {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    document.body.appendChild(modalContainer);
}

window.closeModal = function() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    });
};

window.selectTitle = function(title) {
    const titleInput = document.getElementById('product-name');
    if (titleInput) {
        titleInput.value = title;
    }
    window.closeModal();
};

// Global export
console.log('✅ AI Assistant loaded with all features:');
console.log('   - Product Content Generation');
console.log('   - Design Generation');
console.log('   - Price Intelligence');
console.log('   - SEO Optimization');
console.log('   - Marketing Copy');
console.log('   - Bulk Operations');
console.log('   - Chat Assistant with AI Provider integration');

export {
    generateProductDescription,
    generateProductTitle,
    generateSEOTags,
    generateProductTags,
    generateProductDesign,
    generateDesignVariations,
    recommendPrice,
    analyzeProductPerformance,
    optimizeProductListing,
    generateMarketingCopy,
    bulkGenerateDescriptions,
    sendAIChatMessage,
    generateProductDescriptionAI,
    generateSEOTagsAI,
    analyzeSalesAI,
    quickGenerateDescription,
    quickGenerateSEO,
    quickAnalyzePerformance
};
