// env.js
(function () {
  console.log('🔄 Environment variables yükleniyor...');

  window.ENV = {
    SUPABASE_URL: "https://pywffpqbbrjfcpzigepa.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5d2ZmcHFiYnJqZmNwemlnZXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTEzNDIsImV4cCI6MjA3OTc2NzM0Mn0.ivqA2wj3nS20i8AcKZSec_paQ99qqcw6YaeTZeVV2vo",
    SUPABASE_FUNCTIONS_URL: "https://pywffpqbbrjfcpzigepa.supabase.co/functions/v1"
  };

  window.__SUPABASE_ENV_LOADED__ = true;

  if (window.__SUPABASE_ENV_RESOLVE__) {
    window.__SUPABASE_ENV_RESOLVE__();
  }

  console.log('✅ Environment variables başarıyla yüklendi!', window.ENV);
})();
