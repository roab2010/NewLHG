import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './backend/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Connecting to:', supabaseUrl)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function test() {
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, profiles(*), products(*)')
    
    if (error) throw error
    console.log('Total reviews in DB:', reviews ? reviews.length : 0)
    console.log('Reviews list:', JSON.stringify(reviews, null, 2))
  } catch (err) {
    console.error('Error:', err.message)
  }
}

test()
