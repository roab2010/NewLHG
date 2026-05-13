// Script to test if RLS is blocking the frontend anon key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  console.log("Testing frontend fetch for Lâm Quốc Bảo...");
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '2a8c0bd9-d872-4219-bd70-075a8e3f771e')
    .single();

  if (error) {
    console.error("Frontend fetch failed:", error);
  } else {
    console.log("Frontend fetch success:", data);
  }
}

test();
