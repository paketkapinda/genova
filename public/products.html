<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Products – Etsy AI POD</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Environment Configuration -->
    <script src="/assets/js/env.js"></script>
    
    <!-- Supabase Client -->
    <script type="module" src="/assets/js/supabaseClient.js"></script>
    
    <!-- Custom CSS -->
    <style>
      /* Reset & Base Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', sans-serif;
        background: #f9fafb;
        color: #374151;
        line-height: 1.5;
        overflow-x: hidden;
      }
      
      /* Dashboard Layout */
      .dashboard-container {
        min-height: 100vh;
      }
      
      .dashboard-layout {
        display: flex;
        min-height: 100vh;
      }
      
      /* Sidebar */
      .dashboard-sidebar {
        width: 260px;
        background: white;
        border-right: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      
      .sidebar-header {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .sidebar-logo {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ea580c, #dc2626);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
      
      .sidebar-logo svg {
        width: 24px;
        height: 24px;
      }
      
      .sidebar-title {
        font-size: 18px;
        font-weight: 700;
        color: #18181b;
      }
      
      .sidebar-subtitle {
        font-size: 11px;
        color: #ea580c;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        margin-top: 2px;
      }
      
      .sidebar-nav {
        flex: 1;
        padding: 24px 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .sidebar-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        color: #6b7280;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s ease;
      }
      
      .sidebar-nav-item:hover {
        background: #f3f4f6;
        color: #374151;
      }
      
      .sidebar-nav-item.active {
        background: #fef7f0;
        color: #ea580c;
        font-weight: 600;
      }
      
      .sidebar-nav-item svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      
      .sidebar-user {
        padding: 20px 16px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      
      .user-avatar {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #ea580c, #dc2626);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        flex-shrink: 0;
      }
      
      /* Main Content */
      .dashboard-main {
        flex: 1;
        padding: 32px;
        overflow-y: auto;
      }
      
      /* Products Header */
      .products-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .products-title {
        flex: 1;
        min-width: 300px;
      }
      
      .products-title h1 {
        font-size: 32px;
        font-weight: 700;
        color: #18181b;
        margin-bottom: 8px;
      }
      
      .products-title p {
        color: #6b7280;
        font-size: 16px;
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }
      
      /* Status Badge */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        background: #10b981;
        color: white;
      }
      
      .status-badge.inactive {
        background: #6b7280;
      }
      
      .status-badge svg {
        width: 14px;
        height: 14px;
      }
      
      /* Products Grid */
      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
      }
      
      /* Product Card */
      .product-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .product-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(234, 88, 12, 0.15);
        border-color: #fdba74;
      }
      
      .product-image {
        height: 200px;
        background: linear-gradient(135deg, #fef3f2, #fef7f0);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      
      .product-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      .product-image-placeholder {
        text-align: center;
        color: #ea580c;
        padding: 20px;
      }
      
      .product-image-placeholder svg {
        width: 48px;
        height: 48px;
        margin-bottom: 12px;
      }
      
      .product-image-placeholder p {
        font-size: 14px;
        font-weight: 500;
      }
      
      .product-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: linear-gradient(135deg, #ea580c, #dc2626);
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        z-index: 2;
      }
      
      .etsy-badge {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #fbbf24;
        color: black;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 2;
      }
      
      .etsy-badge svg {
        width: 12px;
        height: 12px;
      }
      
      .price-badge {
        position: absolute;
        bottom: 12px;
        left: 12px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .product-content {
        padding: 20px;
      }
      
      .product-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 12px;
      }
      
      .product-title {
        font-size: 16px;
        font-weight: 600;
        color: #18181b;
        line-height: 1.4;
        flex: 1;
        margin: 0;
      }
      
      .product-price {
        font-size: 18px;
        font-weight: 700;
        color: #ea580c;
        white-space: nowrap;
      }
      
      .product-category {
        display: inline-block;
        background: #f0f9ff;
        color: #0ea5e9;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 12px;
      }
      
      .product-description {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.5;
        margin-bottom: 16px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .product-rating {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      
      .product-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      /* Button Styles */
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        justify-content: center;
        white-space: nowrap;
      }
      
      .btn-primary {
        background: #ea580c;
        color: white;
      }
      
      .btn-primary:hover {
        background: #c2410c;
        transform: translateY(-1px);
      }
      
      .btn-outline {
        background: transparent;
        border: 1px solid #d1d5db;
        color: #374151;
      }
      
      .btn-outline:hover {
        border-color: #ea580c;
        color: #ea580c;
        background: #fef7f0;
        transform: translateY(-1px);
      }
      
      .btn-sm {
        padding: 6px 12px;
        font-size: 12px;
      }
      
      .btn-flex {
        flex: 1;
      }
      
      /* Filters */
      .products-filters {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        flex-wrap: wrap;
        align-items: center;
      }
      
      .filter-group {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      
      .filter-label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
      }
      
      .select-input, .form-input {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        background: white;
        min-width: 150px;
      }
      
      .select-input:focus, .form-input:focus {
        outline: none;
        border-color: #ea580c;
        box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
      }
      
      /* Empty State */
      .products-empty {
        text-align: center;
        padding: 80px 24px;
        background: white;
        border: 2px dashed #e5e7eb;
        border-radius: 16px;
      }
      
      .empty-icon {
        width: 64px;
        height: 64px;
        background: #fef7f0;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }
      
      .empty-icon svg {
        width: 32px;
        height: 32px;
        color: #ea580c;
      }
      
      .empty-title {
        font-size: 18px;
        font-weight: 600;
        color: #18181b;
        margin-bottom: 8px;
      }
      
      .empty-description {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 24px;
      }
      
      /* Modal Styles */
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      
      .modal.active {
        display: flex;
      }
      
      .modal-content {
        background: white;
        border-radius: 16px;
        padding: 24px;
        position: relative;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        max-width: 600px;
      }
      
      .modal-close {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #6b7280;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
      }
      
      .modal-close:hover {
        background: #f3f4f6;
      }
      
      .modal-header {
        margin-bottom: 24px;
      }
      
      .modal-title {
        font-size: 24px;
        font-weight: 600;
        color: #18181b;
        margin-bottom: 8px;
      }
      
      .modal-subtitle {
        color: #6b7280;
        font-size: 14px;
      }
      
      /* Form Styles */
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #374151;
        font-size: 14px;
      }
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      textarea.form-input {
        resize: vertical;
        min-height: 100px;
        font-family: 'Inter', sans-serif;
      }
      
      /* AI Buttons */
      .ai-buttons {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      
      .ai-button {
        font-size: 12px !important;
        padding: 4px 8px !important;
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 24px;
      }
      
      /* Mockup Modal */
      .mockup-editor {
        background: #fafafa;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 20px;
      }
      
      .mockup-preview {
        height: 300px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        overflow: auto;
      }
      
      .mockup-controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }
      
      .control-group {
        margin-bottom: 16px;
      }
      
      .control-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: #374151;
        font-size: 14px;
      }
      
      .control-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        background: white;
      }
      
      /* Product Status Badges */
      .status-draft { background: #fffbeb; color: #d97706; }
      .status-listed { background: #f0fdf4; color: #059669; }
      .status-published { background: #f0fdf4; color: #059669; }
      .status-archived { background: #f3f4f6; color: #6b7280; }
      
      /* Utility Classes */
      .hidden {
        display: none !important;
      }
      
      .bg-blue-100 { background-color: #dbeafe; }
      .text-blue-800 { color: #1e40af; }
      
      /* Loading Animation */
      .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      /* Notification */
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .notification.success { background: #10b981; }
      .notification.error { background: #ef4444; }
      .notification.warning { background: #f59e0b; }
      .notification.info { background: #3b82f6; }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      /* Responsive */
      @media (max-width: 768px) {
        .dashboard-layout {
          flex-direction: column;
        }
        
        .dashboard-sidebar {
          width: 100%;
          border-right: none;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .sidebar-nav {
          flex-direction: row;
          overflow-x: auto;
          padding: 16px;
        }
        
        .sidebar-nav-item {
          white-space: nowrap;
        }
        
        .dashboard-main {
          padding: 24px;
        }
        
        .products-header {
          flex-direction: column;
          align-items: stretch;
        }
        
        .header-actions {
          justify-content: stretch;
        }
        
        .products-grid {
          grid-template-columns: 1fr;
        }
        
        .form-row {
          grid-template-columns: 1fr;
        }
        
        .products-filters {
          flex-direction: column;
          align-items: stretch;
        }
        
        .filter-group {
          justify-content: space-between;
        }
        
        .product-actions {
          flex-direction: column;
        }
      }
      
      @media (max-width: 480px) {
        .products-title h1 {
          font-size: 24px;
        }
        
        .header-actions {
          flex-direction: column;
        }
        
        .modal-content {
          padding: 20px;
        }
      }
    </style>
  </head>
  
  <body class="dashboard-container">
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="dashboard-sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div>
            <div class="sidebar-title">Etsy AI POD</div>
            <div class="sidebar-subtitle">PREMIUM PLATFORM</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a href="/dashboard.html" class="sidebar-nav-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </a>
          <a href="/products.html" class="sidebar-nav-item active">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            Products
          </a>
          <a href="/orders.html" class="sidebar-nav-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            Orders
          </a>
          <a href="/payments.html" class="sidebar-nav-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
            </svg>
            Payments
          </a>
          <a href="/ai-assistant.html" class="sidebar-nav-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            AI Assistant
          </a>
          <a href="/settings.html" class="sidebar-nav-item">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Settings
          </a>
        </nav>

        <div class="sidebar-user">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="user-avatar" id="user-avatar">JD</div>
            <div>
              <div style="font-weight: 600; color: #18181b;" id="user-name">John Doe</div>
              <div style="font-size: 12px; color: #6b7280;" id="user-email">admin@example.com</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="dashboard-main">
        <!-- Header -->
        <header class="products-header">
          <div class="products-title">
            <h1>Products</h1>
            <p>Manage your product catalog and generate mockups</p>
          </div>
          <div class="header-actions" id="header-actions">
            <button class="btn btn-outline" id="btn-analyze-top-sellers">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Analyze Top Sellers
            </button>
            <button class="btn btn-primary" id="btn-new-product">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              New Product
            </button>
          </div>
        </header>

        <!-- Search Bar -->
        <div style="margin-bottom: 24px;">
          <input 
            type="text" 
            id="search-products" 
            placeholder="Search products..."
            class="form-input"
            style="width: 100%; max-width: 400px;"
          />
        </div>

        <!-- Filters -->
        <div class="products-filters">
          <div class="filter-group">
            <label class="filter-label">Status:</label>
            <select class="select-input" id="filter-status">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label class="filter-label">Category:</label>
            <select class="select-input" id="filter-category">
              <option value="">All Categories</option>
              <option value="tshirt">T-Shirt</option>
              <option value="mug">Mug</option>
              <option value="plate">Plate</option>
              <option value="phone-case">Phone Case</option>
              <option value="jewelry">Jewelry</option>
              <option value="wood">Wood Product</option>
            </select>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="products-grid" id="products-grid">
          <!-- Products will be loaded here -->
        </div>

        <!-- Empty State -->
        <div class="products-empty hidden" id="products-empty">
          <div class="empty-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
          </div>
          <h3 class="empty-title">No products yet</h3>
          <p class="empty-description">Create your first product to get started with your Etsy POD business</p>
          <button class="btn btn-primary" id="btn-empty-new-product">
            Create First Product
          </button>
        </div>
      </main>
    </div>

    <!-- Product Modal -->
    <div class="modal" id="modal-product">
      <div class="modal-content" style="max-width: 600px;">
        <button class="modal-close" id="modal-product-close">&times;</button>
        <div class="modal-header">
          <h2 class="modal-title" id="modal-product-title">New Product</h2>
          <p class="modal-subtitle">Add a new product to your catalog</p>
        </div>
        
        <form id="form-product">
          <input type="hidden" id="product-id" />
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="product-title">Product Title</label>
              <input
                type="text"
                id="product-title"
                required
                placeholder="Enter product title"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="product-category">Category</label>
              <select
                id="product-category"
                required
                class="select-input"
              >
                <option value="">Select category</option>
                <option value="tshirt">T-Shirt</option>
                <option value="mug">Mug</option>
                <option value="plate">Plate</option>
                <option value="phone-case">Phone Case</option>
                <option value="jewelry">Jewelry</option>
                <option value="wood">Wood Product</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="product-price">Price (USD)</label>
              <input
                type="number"
                id="product-price"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                class="form-input"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label" for="product-status">Status</label>
              <select
                id="product-status"
                class="select-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="product-description">Description</label>
            <textarea
              id="product-description"
              rows="4"
              placeholder="Enter product description..."
              class="form-input"
            ></textarea>
            <div class="ai-buttons">
              <button type="button" class="btn btn-outline btn-sm ai-button" id="btn-generate-description">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="12" height="12">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                AI Generate
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-flex">Save Product</button>
            <button type="button" class="btn btn-outline btn-flex" id="btn-cancel-product">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Mockup Generation Modal -->
    <div class="modal" id="modal-mockup">
      <div class="modal-content" style="max-width: 800px;">
        <button class="modal-close" id="modal-mockup-close">&times;</button>
        <div class="modal-header">
          <h2 class="modal-title">Generate Mockups</h2>
          <p class="modal-subtitle">Create professional product mockups for your designs</p>
        </div>
        
        <div id="mockup-editor-container">
          <!-- Mockup editor will be loaded here -->
        </div>
      </div>
    </div>

    <!-- Top Sellers Modal (Dynamic) -->
    <div id="top-seller-modal-container"></div>

    <!-- JavaScript -->
    <script src="/assets/js/products.js"></script>
  </body>
</html>
