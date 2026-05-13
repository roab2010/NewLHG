const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("--- BẢNG auth.users ---");
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (err1) console.error(err1);
  else console.log(users.users.map(u => ({ id: u.id, email: u.email, name: u.user_metadata?.display_name })));

  console.log("\n--- BẢNG public.profiles ---");
  const { data: profiles, error: err2 } = await supabase.from('profiles').select('*');
  if (err2) console.error(err2);
  else console.log(profiles);
}

check();
