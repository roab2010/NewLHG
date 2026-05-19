import { supabase } from './src/config/supabase.js'

async function checkDB() {
  try {
    // 1. Get all notifications
    const { data: notifs, error: notifErr } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('--- RECENT NOTIFICATIONS ---')
    if (notifErr) console.error('Error fetching notifications:', notifErr)
    else console.log(notifs)

    // 2. Get admins list
    const { data: admins, error: adminErr } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('role', 'admin')

    console.log('--- ADMINS IN DATABASE ---')
    if (adminErr) console.error('Error fetching admins:', adminErr)
    else console.log(admins)

    // 3. Get all profiles count
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .limit(5)
    console.log('--- SOME PROFILES ---')
    if (profErr) console.error('Error fetching profiles:', profErr)
    else console.log(profiles)

  } catch (err) {
    console.error(err)
  }
}

checkDB()
