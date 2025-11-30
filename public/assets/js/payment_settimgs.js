// payment.js - New file for payment settings
import { supabase } from './supabaseClient.js';
import { showNotification } from './ui.js';

export async function loadPaymentSettings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('payment_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      document.getElementById('wise-api-key').value = data.wise_api_key_encrypted || '';
      document.getElementById('payoneer-api-key').value = data.payoneer_api_key_encrypted || '';
      document.getElementById('bank-name').value = data.bank_name || '';
      document.getElementById('iban').value = data.iban || '';
      document.getElementById('swift-code').value = data.swift_code || '';
      document.getElementById('account-holder').value = data.account_holder_name || '';
    }
  } catch (error) {
    console.error('Error loading payment settings:', error);
    showNotification('Error loading payment settings', 'error');
  }
}

export function initPaymentSettings() {
  const form = document.getElementById('form-payment');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePaymentSettings();
  });
}

async function savePaymentSettings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const wiseApiKey = document.getElementById('wise-api-key').value;
    const payoneerApiKey = document.getElementById('payoneer-api-key').value;
    const bankName = document.getElementById('bank-name').value;
    const iban = document.getElementById('iban').value;
    const swiftCode = document.getElementById('swift-code').value;
    const accountHolder = document.getElementById('account-holder').value;

    const { data, error } = await supabase
      .from('payment_settings')
      .upsert({
        user_id: user.id,
        wise_api_key_encrypted: wiseApiKey,
        payoneer_api_key_encrypted: payoneerApiKey,
        bank_name: bankName,
        iban: iban,
        swift_code: swiftCode,
        account_holder_name: accountHolder,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    showNotification('Payment settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving payment settings:', error);
    showNotification('Error saving payment settings', 'error');
  }
}

// Initialize
if (document.getElementById('form-payment')) {
  loadPaymentSettings();
  initPaymentSettings();
}