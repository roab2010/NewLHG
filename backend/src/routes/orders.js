import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { createNotification } from './notifications.js'

const router = express.Router()

// POST /api/orders (authenticated customers)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shipping_address, phone, coupon_id, discount_amount } = req.body
    
    // Calculate total
    let totalAmount = 0
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('price')
        .eq('id', item.product_id)
        .single()
      
      totalAmount += product.price * item.quantity
    }

    // Apply discount if coupon provided
    if (discount_amount && discount_amount > 0) {
      totalAmount = Math.max(0, totalAmount - discount_amount)
    }

    // Create order
    const orderInsert = {
      user_id: req.user.id,
      total_amount: totalAmount,
      shipping_address,
      phone,
      status: 'pending',
    }
    if (coupon_id) orderInsert.coupon_id = coupon_id
    if (discount_amount) orderInsert.discount_amount = discount_amount

    const { data: order, error } = await supabase
      .from('orders')
      .insert(orderInsert)
      .select()
      .single()

    if (error) throw error

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }))

    await supabase.from('order_items').insert(orderItems)

    // Record coupon usage if coupon was applied
    if (coupon_id) {
      await supabase.from('coupon_usage').insert({
        coupon_id,
        user_id: req.user.id,
        order_id: order.id,
      })
      await supabase.rpc('increment_coupon_used_count', { coupon_id_input: coupon_id })
    }

    // Notify all admins about the new order
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin')
    if (admins) {
      for (const admin of admins) {
        await createNotification(admin.id, 'Đơn hàng mới', `Đơn hàng mới #${order.id.substring(0, 8)} vừa được tạo`, 'order', '/admin')
      }
    }

    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// GET /api/orders/my-orders
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, image_url))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/orders (admin)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles(display_name), order_items(*, products(name))')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/orders/:id/status (admin)
router.put('/:id/status', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    // Send notification to the order's user
    const order = data
    if (order && order.user_id) {
      const statusLabels = { pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipped: 'Đang giao hàng', delivered: 'Đã giao hàng', cancelled: 'Đã hủy' }
      await createNotification(
        order.user_id,
        'Cập nhật đơn hàng',
        `Đơn hàng #${order.id.substring(0, 8)} đã được cập nhật thành: ${statusLabels[status] || status}`,
        'order',
        '/profile?tab=orders'
      )
    }

    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// PUT /api/orders/cancel/:id - User cancels own pending order
router.put('/cancel/:id', authMiddleware, async (req, res) => {
  try {
    // First check if order belongs to user and is pending
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single()

    if (findError || !order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' })
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
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
