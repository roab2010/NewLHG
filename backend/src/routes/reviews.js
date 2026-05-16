import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// GET /api/reviews/:productId - Lấy danh sách đánh giá của sản phẩm
router.get('/:productId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url)')
      .eq('product_id', req.params.productId)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/reviews/:productId/can-review
router.get('/:productId/can-review', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params
    const userId = req.user.id

    console.log(`[ReviewCheck] User: ${userId}, Product: ${productId}`)

    // TRUY VẤN TỔNG LỰC: Tìm bất kỳ item nào khớp product_id mà thuộc về user này và order đã giao
    const { data: matches, error: queryError } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'delivered')

    if (queryError) {
      console.error('[ReviewCheck] Query Error:', queryError)
      // Thử cách 2 nếu cách 1 lỗi join
      const { data: orders } = await supabase.from('orders').select('id').eq('user_id', userId).eq('status', 'delivered')
      if (orders && orders.length > 0) {
        const { data: items } = await supabase.from('order_items').select('id').in('order_id', orders.map(o => o.id)).eq('product_id', productId)
        const canReview = items && items.length > 0
        return res.json({ canReview, alreadyReviewed: false })
      }
      return res.json({ canReview: false, alreadyReviewed: false })
    }

    const canReview = matches && matches.length > 0
    console.log(`[ReviewCheck] Result: ${canReview}`)

    // Kiểm tra đã đánh giá chưa
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle()

    res.json({ 
      canReview, 
      alreadyReviewed: !!existing 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/reviews
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body
    const userId = req.user.id

    // Kiểm tra quyền
    const { data: matches } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, status)')
      .eq('product_id', product_id)
      .eq('orders.user_id', userId)
      .eq('orders.status', 'delivered')

    if (!matches || matches.length === 0) {
      return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá sản phẩm đã mua và đã được giao thành công.' })
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        product_id,
        user_id: userId,
        rating,
        comment,
      })
      .select()
      .single()

    if (error) throw error

    // Cập nhật rating sản phẩm
    const { data: allReviews } = await supabase.from('reviews').select('rating').eq('product_id', product_id)
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      await supabase.from('products').update({ rating: parseFloat(avg.toFixed(1)) }).eq('id', product_id)
    }

    res.status(201).json(data)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

export default router
