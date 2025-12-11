// API/etsy/payments.js
app.post('/api/etsy/payments', async (req, res) => {
    try {
        const { api_key, shared_secret, shop_id, limit, offset } = req.body;
        
        // Etsy Payments API çağrısı
        const etsyResponse = await fetch(`https://openapi.etsy.com/v3/application/shops/${shop_id}/payment-account/ledger-entries`, {
            headers: {
                'x-api-key': api_key,
                'Authorization': `Bearer ${shared_secret}`
            }
        });
        
        const data = await etsyResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API/etsy/trending.js
app.get('/api/etsy/trending', async (req, res) => {
    try {
        const { category, api_key } = req.query;
        
        // Etsy Trending API
        const response = await fetch(`https://openapi.etsy.com/v3/application/trending?category=${category}`, {
            headers: {
                'x-api-key': api_key
            }
        });
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        // API hatasında örnek veri dön
        res.json(getSampleTrendingData(req.query.category));
    }
});

// API/pod/:provider/mockups.js
app.post('/api/pod/:provider/mockups', async (req, res) => {
    const { provider } = req.params;
    const mockupData = req.body;
    
    try {
        let response;
        
        if (provider === 'printful') {
            response = await fetch('https://api.printful.com/mockup-generator/create-task', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mockupData)
            });
        } else if (provider === 'printify') {
            response = await fetch('https://api.printify.com/v1/mockups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(mockupData)
            });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message,
            mockups: generateSimulatedMockups(mockupData) // Simülasyon fallback
        });
    }
});