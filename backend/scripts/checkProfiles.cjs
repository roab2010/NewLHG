const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@lhe.vn',
    password: 'password123',
    email_confirm: true,
    user_metadata: { display_name: 'Admin LHE' }
  });
  
  if (error) {
    console.log("Error or already exists:", error.message);
  } else {
    console.log("Created user:", data.user.id);
    // Cập nhật role thành admin (profile sẽ được tạo tự động qua trigger nếu có)
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
    console.log("Admin account ready!");
  }
}
run();
