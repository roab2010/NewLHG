import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAvatars() {
  const avatarMap = {
    'Roab': '/images/avatars/bao.png', // Lâm Quốc Bảo
    'NhanHoag': '/images/avatars/nhan.png', // Hoàng Hữu Nhân
    'XunWon': '/images/avatars/quan.png', // Nguyễn Anh Xuân Quân
    'TuanKitt': '/images/avatars/kiet.png', // Nguyễn Trương Tuấn Kiệt
    'Taile': '/images/avatars/tai.png', // Phạm Thanh Tài
    'LocMaster': '/images/avatars/loc.png', // Đặng Thành Lộc
    'YenOi': '/images/avatars/luat.png' // Hoàng Trí Luật
  }

  for (const [nickname, avatar_url] of Object.entries(avatarMap)) {
    const { data, error } = await supabase
      .from('members')
      .update({ avatar_url })
      .eq('nickname', nickname)
    
    if (error) {
      console.error(`Lỗi cập nhật cho ${nickname}:`, error.message)
    } else {
      console.log(`Đã cập nhật avatar cho ${nickname}`)
    }
  }
}

updateAvatars()
