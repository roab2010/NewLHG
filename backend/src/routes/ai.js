import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const configPath = path.join(__dirname, '../../data/ai_config.json')

// Helper to read config
function readAIConfig() {
  try {
    if (!fs.existsSync(configPath)) {
      return {
        is_enabled: true,
        bot_name: 'LHE Assistant',
        welcome_message: 'Chào mừng bạn đến với Long Hải Esports! Mình có thể giúp gì cho bạn hôm nay? 🎮',
        system_prompt: 'Bạn là LHE Assistant - Trợ lý ảo cực kỳ thân thiện và năng động của Long Hải Esports. Hãy tư vấn nhiệt tình cho khách hàng về sản phẩm, dịch vụ và thông tin của đội tuyển. Hãy thêm các icon liên quan đến gaming 🎮🔥 để cuộc trò chuyện sống động hơn.'
      }
    }
    const data = fs.readFileSync(configPath, 'utf8')
    return JSON.parse(data)
  } catch (err) {
    console.error('Error reading AI config:', err)
    return {}
  }
}

// Helper to write config
function writeAIConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
    return true
  } catch (err) {
    console.error('Error writing AI config:', err)
    return false
  }
}

// 1. GET /api/ai/config - Lấy cấu hình công khai (Tên bot, Lời chào, Bật/Tắt) cho User
router.get('/config', async (req, res) => {
  const config = readAIConfig()
  res.json({
    is_enabled: config.is_enabled !== false,
    bot_name: config.bot_name || 'LHE Assistant',
    welcome_message: config.welcome_message || 'Chào mừng bạn đến với Long Hải Esports! 🎮'
  })
})

// 2. GET /api/ai/admin-config - Lấy cấu hình đầy đủ (Chỉ dành cho Admin)
router.get('/admin-config', authMiddleware, requireRole('admin'), async (req, res) => {
  const config = readAIConfig()
  res.json(config)
})

// 3. PUT /api/ai/admin-config - Cập nhật cấu hình đầy đủ (Chỉ dành cho Admin)
router.put('/admin-config', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { is_enabled, bot_name, welcome_message, system_prompt } = req.body
    
    if (bot_name === undefined || welcome_message === undefined || system_prompt === undefined) {
      return res.status(400).json({ error: 'Thiếu dữ liệu cấu hình bắt buộc' })
    }

    const newConfig = {
      is_enabled: !!is_enabled,
      bot_name: bot_name.trim(),
      welcome_message: welcome_message.trim(),
      system_prompt: system_prompt.trim()
    }

    const success = writeAIConfig(newConfig)
    if (!success) throw new Error('Không thể ghi file cấu hình')

    res.json({ success: true, message: 'Cập nhật cấu hình AI thành công!', config: newConfig })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 4. POST /api/ai/chat - Trò chuyện với AI (Hỗ trợ cả Guest và Auth User)
router.post('/chat', async (req, res) => {
  try {
    const config = readAIConfig()
    if (config.is_enabled === false) {
      return res.status(503).json({ error: 'Trợ lý ảo hiện đang bảo trì, vui lòng quay lại sau!' })
    }

    const { message, history } = req.body
    if (!message) {
      return res.status(400).json({ error: 'Tin nhắn không được để trống' })
    }

    // 1. Kiểm tra API Key của Gemini
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('[Gemini AI] GEMINI_API_KEY is missing in .env!')
      return res.json({
        reply: 'Xin chào! Trợ lý ảo của Long Hải Esports đã sẵn sàng. Tuy nhiên, hệ thống chưa được cấu hình khóa API (GEMINI_API_KEY). Vui lòng thông báo cho Admin điền Key để bắt đầu chat nhé! 🎮🤖'
      })
    }

    // 2. Lấy danh sách sản phẩm thời gian thực từ DB
    const { data: products } = await supabase
      .from('products')
      .select('name, price, description, category, stock, rating')
      .eq('is_active', true)

    // 3. Tra cứu thông tin User & Đơn hàng nếu có token (Auth Header)
    let userContext = ''
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        // Giải mã JWT để xác thực user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          // Lấy profile hiển thị
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle()

          // Lấy danh sách đơn hàng gần nhất (tối đa 5 đơn)
          const { data: orders } = await supabase
            .from('orders')
            .select('id, total_amount, status, created_at, order_items(quantity, price, products(name))')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

          userContext = `
THÔNG TIN KHÁCH HÀNG ĐANG CHAT VỚI BẠN:
- Tên khách hàng: ${profile?.display_name || 'Khách hàng'}
- Email của họ: ${user.email}
- Các đơn hàng gần đây của khách hàng này (dùng để trả lời chính xác khi họ hỏi về đơn hàng của mình):
${JSON.stringify(orders, null, 2)}
`
        }
      } catch (err) {
        console.warn('[Gemini AI] Auth token error, continuing as Guest:', err.message)
      }
    }

    // 4. Khởi tạo Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Xây dựng System Instruction tổng lực
    const systemInstruction = `
${config.system_prompt}

DƯỚI ĐÂY LÀ DANH SÁCH SẢN PHẨM THỰC TẾ ĐANG BÁN TẠI CỬA HÀNG LONG HẢI ESPORTS (Hãy dùng thông tin này để tư vấn chính xác, không tự bịa ra sản phẩm khác):
${JSON.stringify(products, null, 2)}

Lưu ý về sản phẩm:
- Giá sản phẩm là VNĐ. Hãy viết rõ ràng dạng 450.000đ thay vì số thô.
- Hãy khuyên khích khách hàng mua hàng bằng cách dẫn link hoặc hướng dẫn họ vào tab "CỬA HÀNG" ở thanh điều hướng trên cùng.

${userContext}

QUY TẮC PHẢN HỒI:
1. Hãy trả lời ngắn gọn, súc tích, dễ thương, đúng trọng tâm và đậm chất Esports gaming.
2. Tuyệt đối không bàn luận về chính trị, tôn giáo hay các vấn đề nhạy cảm khác. Nếu bị hỏi, hãy khéo léo từ chối và lái cuộc trò chuyện về Long Hải Esports.
3. Hỗ trợ hiển thị Markdown đẹp mắt để tô đậm các thông tin quan trọng.
`

    // Sử dụng model gemini-2.5-flash thế hệ mới cực kỳ thông minh và nhanh
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction,
    })

    // Xây dựng format chat history phù hợp với cấu trúc Gemini API
    // Gemini nhận history có dạng: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const geminiHistory = (history || []).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))

    // Bắt đầu chat session
    const chat = model.startChat({
      history: geminiHistory,
    })

    let result;
    let response;
    let replyText;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await chat.sendMessage(message)
        response = await result.response
        replyText = response.text()
        break; // Thành công thì thoát khỏi vòng lặp
      } catch (error) {
        const isTemporaryError = 
          error.status === 503 || 
          error.status === 429 ||
          error.message?.includes('503') || 
          error.message?.includes('429') || 
          error.message?.includes('demand') || 
          error.message?.includes('overloaded');
        
        if (isTemporaryError && attempt < maxRetries) {
          const delay = attempt * 600; // 600ms, 1200ms
          console.warn(`[Gemini AI] Thử lại lần thứ ${attempt} do lỗi tạm thời (503/429/Quá tải). Đang chờ ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Ném lỗi ra ngoài nếu không phải lỗi tạm thời hoặc hết lượt thử
        }
      }
    }

    res.json({ reply: replyText })

  } catch (error) {
    console.error('[Gemini AI Error]:', error)
    res.status(500).json({ error: 'Đã xảy ra lỗi khi kết nối với trí tuệ nhân tạo, vui lòng thử lại sau!' })
  }
})

export default router
