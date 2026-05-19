import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Helper function to create a notification
export async function createNotification(userId, title, message, type = 'info', link = null) {
  await supabase.from('notifications').insert({ user_id: userId, title, message, type, link })
}

// GET / - get user's notifications (auth required)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('Get notifications error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy thông báo' })
  }
})

// PUT /read-all - mark all user's notifications as read (auth required)
// NOTE: This route must be defined before /:id/read to avoid conflicts
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' })
  } catch (err) {
    console.error('Read all notifications error:', err)
    res.status(500).json({ error: 'Lỗi server khi cập nhật thông báo' })
  }
})

// PUT /:id/read - mark single notification as read (auth required, verify ownership)
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Không tìm thấy thông báo' })
      }
      throw error
    }

    res.json(data)
  } catch (err) {
    console.error('Read notification error:', err)
    res.status(500).json({ error: 'Lỗi server khi cập nhật thông báo' })
  }
})

// DELETE /:id - delete notification (auth required, verify ownership)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verify ownership before deleting
    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (findError || !notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' })
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    res.json({ message: 'Đã xóa thông báo thành công' })
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json({ error: 'Lỗi server khi xóa thông báo' })
  }
})

export default router
