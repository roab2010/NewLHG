import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(404).json({ error: 'Product not found' })
  }
})

// POST /api/products (admin/member only)
router.post('/', authMiddleware, requireRole('admin', 'member'), async (req, res) => {
  try {
    const { name, description, price, image_url, category, stock } = req.body
    const { data, error } = await supabase
      .from('products')
      .insert({
        name, description, price, image_url, category, stock,
        created_by: req.user.id,
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/products/:id
router.put('/:id', authMiddleware, requireRole('admin', 'member'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)

    if (error) throw error
    res.json({ message: 'Xóa sản phẩm thành công' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
