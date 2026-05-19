// using native fetch

async function test() {
  try {
    console.log('--- Testing Public Config ---');
    const res1 = await fetch('http://localhost:5000/api/ai/config');
    console.log('Public Config Status:', res1.status);
    console.log('Public Config Body:', await res1.json());

    console.log('\n--- Testing Admin Config (No Token) ---');
    const res2 = await fetch('http://localhost:5000/api/ai/admin-config');
    console.log('Admin Config Status:', res2.status);
    console.log('Admin Config Body:', await res2.json());
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
