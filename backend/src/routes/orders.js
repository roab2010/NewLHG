import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// POST /api/orders (authenticated customers)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { items, shipping_address, phone } = req.body
    
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

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: req.user.id,
        total_amount: totalAmount,
        shipping_address,
        phone,
        status: 'pending',
      })
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
    res.json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
