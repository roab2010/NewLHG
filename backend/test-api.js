import { supabase } from './src/config/supabase.js'

async function checkAnalyticsData() {
  try {
    console.log('--- CHECKING ACTUAL DATABASE VALUES FOR ANALYTICS ---')

    // 1. Check orders delivered vs all orders
    const { data: allOrders } = await supabase.from('orders').select('*')
    console.log('Total orders in DB:', allOrders?.length)
    console.log('Orders status distribution:', allOrders?.map(o => o.status))

    // 2. Check profiles
    const { data: allProfiles } = await supabase.from('profiles').select('created_at')
    console.log('Total profiles in DB:', allProfiles?.length)
    console.log('Profiles created_at:', allProfiles?.map(p => p.created_at))

    // 3. Check order_items
    const { data: allOrderItems } = await supabase.from('order_items').select('*')
    console.log('Total order_items in DB:', allOrderItems?.length)

  } catch (err) {
    console.error(err)
  }
}

checkAnalyticsData()
