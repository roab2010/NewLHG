import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'

const router = express.Router()

// 1. GET /api/reviews - Lấy TẤT CẢ đánh giá (Chỉ dành cho Admin) - Đặt lên đầu tiên!
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url), products(id, name, image_url)')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 2. GET /api/reviews/:productId/can-review - Kiểm tra xem user có quyền đánh giá sản phẩm không
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

// 3. GET /api/reviews/:productId - Lấy danh sách đánh giá của một sản phẩm
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

// 4. POST /api/reviews - Tạo đánh giá mới (Người dùng)
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

// 5. DELETE /api/reviews/:id - Xóa một đánh giá (Chỉ dành cho Admin)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params

    // Lấy thông tin review trước khi xóa để biết product_id
    const { data: review, error: getError } = await supabase
      .from('reviews')
      .select('product_id')
      .eq('id', id)
      .maybeSingle()

    if (getError) throw getError
    if (!review) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá cần xóa.' })
    }

    // Thực hiện xóa đánh giá
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Tính toán lại rating trung bình cho sản phẩm
    const { data: allReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', review.product_id)

    if (reviewsError) throw reviewsError

    const avg = allReviews && allReviews.length > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      : 0

    // Cập nhật rating mới cho sản phẩm
    const { error: updateError } = await supabase
      .from('products')
      .update({ rating: parseFloat(avg.toFixed(1)) })
      .eq('id', review.product_id)

    if (updateError) throw updateError

    res.json({ success: true, message: 'Đã xóa đánh giá thành công và cập nhật điểm sản phẩm.' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
