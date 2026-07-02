const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const SUPABASE_URL = 'https://hqiggiqwyxjiltltvoay.supabase.co';

// Get anon key from main.tsx or .env file
const envPath = require('path').join(__dirname, '.env');
const envLocalPath = require('path').join(__dirname, '.env.local');
let anonKey = '';
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  if (match) anonKey = match[1].trim();
} catch {}
try {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const match = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  if (match) anonKey = match[1].trim();
} catch {}

if (!anonKey) {
  // Try to get from environment
  const dotenv = require('dotenv');
  const result = dotenv.config({ path: envLocalPath });
  anonKey = process.env.VITE_SUPABASE_ANON_KEY || result?.VITE_SUPABASE_ANON_KEY || '';
}

// Actually let me just read main.tsx to find the anon key
const mainTsx = fs.readFileSync(require('path').join(__dirname, 'src', 'main.tsx'), 'utf8');
const keyMatch = mainTsx.match(/VITE_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY|['"](eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+)['"]/);
console.log('Found key pattern:', keyMatch ? 'yes' : 'no');

// Actually, let me just use the project API to get the anon key
const { createClient } = require('@supabase/supabase-js');
const token = process.env.SUPABASE_ACCESS_TOKEN || require('child_process')
  .execSync('powershell -Command "[Environment]::GetEnvironmentVariable(\'SUPABASE_ACCESS_TOKEN\', \'User\')"', { encoding: 'utf8' }).trim();

async function getAnonKey() {
  const res = await fetch('https://api.supabase.com/v1/projects/hqiggiqwyxjiltltvoay', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  // The anon key is in the project's API keys
  const res2 = await fetch('https://api.supabase.com/v1/projects/hqiggiqwyxjiltltvoay/api-keys', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const keys = await res2.json();
  const anon = keys.find(k => k.name === 'anon');
  console.log('Anon key found:', !!anon);
  return anon?.api_key || '';
}

getAnonKey().then(async (anonKey) => {
  if (!anonKey) {
    console.log('No anon key found. Trying SR key fallback...');
    return;
  }
  const supabase = createClient(SUPABASE_URL, anonKey);
  
  // Simulate end-user query with actual JWT
  // We need an actual user token... let me try the SR key approach differently
  const { data, error } = await supabase
    .from('employees')
    .select(`
      employee_code,
      reporting_manager:employees!reporting_manager_id(id, first_name, last_name)
    `)
    .eq('employee_code', 'EMP-2026-0003')
    .maybeSingle();

  console.log('With anon key:');
  console.log('  reporting_manager:', JSON.stringify(data?.reporting_manager));
  console.log('  isArray:', Array.isArray(data?.reporting_manager));
}).catch(console.error);
