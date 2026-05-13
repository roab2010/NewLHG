const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Dùng ANON KEY (giống frontend) thay vì SERVICE_ROLE_KEY
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  console.log("=== Test 1: Đăng nhập bằng tài khoản Lâm Quốc Bảo ===");
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'lamquocbao11a1@gmail.com',
    password: 'quocbao2010@#'
  });
  
  if (signInErr) {
    console.error("Login failed:", signInErr);
    return;
  }
  console.log("Login OK. User ID:", signInData.user.id);

  console.log("\n=== Test 2: Fetch profiles (giống frontend AuthContext) ===");
  const startTime = Date.now();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', signInData.user.id)
    .single();
  const elapsed = Date.now() - startTime;

  console.log(`Fetch took ${elapsed}ms`);
  if (error) {
    console.error("Fetch profile FAILED:", error);
  } else {
    console.log("Fetch profile SUCCESS:", data);
  }

  console.log("\n=== Test 3: Fetch ALL profiles ===");
  const { data: allProfiles, error: allErr } = await supabase
    .from('profiles')
    .select('*');
  
  if (allErr) {
    console.error("Fetch all profiles FAILED:", allErr);
  } else {
    console.log("All profiles:", allProfiles);
  }

  console.log("\n=== Test 4: Check RLS policies ===");
  // Dùng service role key để xem policies
  const adminClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: policies, error: polErr } = await adminClient.rpc('get_policies_for_table', { table_name: 'profiles' }).catch(() => ({ data: null, error: 'RPC not available' }));
  
  // Alternative: query pg_policies directly
  const { data: pgPolicies, error: pgErr } = await adminClient
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'profiles');
  
  if (pgErr) {
    console.log("Cannot query pg_policies (expected):", pgErr.message);
    // Try raw SQL
    const { data: sqlResult, error: sqlErr } = await adminClient.rpc('exec_sql', { sql: "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles'" });
    console.log("SQL result:", sqlResult, sqlErr);
  } else {
    console.log("Policies:", pgPolicies);
  }
}

test();
