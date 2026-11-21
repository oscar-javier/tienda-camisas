// js/supabase.js
const SUPABASE_URL = 'https://yglnbiklmdhexpczewwv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RwO07Eu5T9_MK70rV0AUcA_5OzV9xKX';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase conectado:', !!supabaseClient);