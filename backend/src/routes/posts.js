import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/posts
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(display_name, avatar_url)')
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/posts (member/admin)
router.post('/', authMiddleware, requireRole('member', 'admin'), async (req, res) => {
  try {
    const { title, content, image_url, category } = req.body
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: req.user.id,
        title, content, image_url, category,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    // Check ownership or admin
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', req.params.id)
      .single()

    if (post.author_id !== req.user.id && req.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa' })
    }

    const { data, error } = await supabase
      .from('posts')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', req.params.id)
      .single()

    if (post.author_id !== req.user.id && req.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền xóa' })
    }

    await supabase.from('posts').delete().eq('id', req.params.id)
    res.json({ message: 'Xóa bài viết thành công' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
