import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// All admin routes require admin role
router.use(authMiddleware, requireRole('admin'))

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [usersResult, ordersResult, productsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('orders').select('id, total_amount', { count: 'exact' }),
      supabase.from('products').select('id', { count: 'exact' }),
    ])

    const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

    res.json({
      users: usersResult.count || 0,
      orders: ordersResult.count || 0,
      products: productsResult.count || 0,
      revenue: totalRevenue,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['customer', 'member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role không hợp lệ' })
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
