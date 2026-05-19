import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// All analytics routes require admin
router.use(authMiddleware, requireRole('admin'))

// GET /revenue - revenue by day for last N days (default 30)
router.get('/revenue', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total, created_at')
      .eq('status', 'delivered')
      .gte('created_at', startDateStr)

    if (error) throw error

    // Group by date
    const revenueMap = {}
    for (const order of orders) {
      const date = order.created_at.split('T')[0]
      revenueMap[date] = (revenueMap[date] || 0) + (order.total || 0)
    }

    const revenue = Object.entries(revenueMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    res.json(revenue)
  } catch (err) {
    console.error('Revenue analytics error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu doanh thu' })
  }
})

// GET /top-products - top 5 best selling products
router.get('/top-products', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, quantity, products(id, name, image_url)')

    if (error) throw error

    // Sum quantities by product
    const productMap = {}
    for (const item of items) {
      const pid = item.product_id
      if (!productMap[pid]) {
        productMap[pid] = {
          product_id: pid,
          name: item.products?.name || 'Sản phẩm không xác định',
          image_url: item.products?.image_url || null,
          total_sold: 0,
        }
      }
      productMap[pid].total_sold += item.quantity || 0
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5)

    res.json(topProducts)
  } catch (err) {
    console.error('Top products analytics error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu sản phẩm bán chạy' })
  }
})

// GET /users-growth - new users per day for last N days
router.get('/users-growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDateStr)

    if (error) throw error

    // Group by date
    const growthMap = {}
    for (const profile of profiles) {
      const date = profile.created_at.split('T')[0]
      growthMap[date] = (growthMap[date] || 0) + 1
    }

    const growth = Object.entries(growthMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    res.json(growth)
  } catch (err) {
    console.error('Users growth analytics error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu tăng trưởng người dùng' })
  }
})

// GET /orders-by-status - count orders grouped by status
router.get('/orders-by-status', async (req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')

    if (error) throw error

    // Group by status
    const statusMap = {}
    for (const order of orders) {
      const status = order.status || 'unknown'
      statusMap[status] = (statusMap[status] || 0) + 1
    }

    const result = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))

    res.json(result)
  } catch (err) {
    console.error('Orders by status analytics error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy dữ liệu đơn hàng theo trạng thái' })
  }
})

export default router
