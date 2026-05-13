const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load from current working directory

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await supabase.from('products').update({ name: 'Áo Jersey LHE 2026', image_url: '/images/shop/jersey.png' }).eq('name', 'Áo Jersey LHE 2024');
  await supabase.from('products').update({ image_url: '/images/shop/jersey.png' }).eq('name', 'Áo Jersey LHE 2026');
  await supabase.from('products').update({ image_url: '/images/shop/mousepad.png' }).eq('name', 'Mousepad LHE XL');
  await supabase.from('products').update({ image_url: '/images/shop/sticker.png' }).eq('name', 'Sticker Pack LHE');
  await supabase.from('products').update({ image_url: '/images/shop/hoodie.png' }).eq('name', 'Hoodie LHE Limited');
  await supabase.from('products').update({ image_url: '/images/shop/wristband.png' }).eq('name', 'Wristband LHE');
  await supabase.from('products').update({ image_url: '/images/shop/tshirt.png' }).ilike('name', '%Áo Thun LHE Black%');

  console.log("Products updated in DB!");
}
run();
