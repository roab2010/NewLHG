const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('orders').select(`
    id, total_amount, status, created_at,
    user:profiles(display_name)
  `);
  console.log('Error:', error);
  console.log('Data:', data);
}
test();
