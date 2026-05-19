import express from 'express'
import { supabase } from '../config/supabase.js'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { validateCoupon, validateCouponCode } from '../middleware/validate.js'

const router = express.Router()

// POST /validate - validate a coupon code (auth required)
router.post('/validate', authMiddleware, validateCouponCode, async (req, res) => {
  try {
    const { code } = req.body
    const userId = req.user.id

    // Check coupon exists
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single()

    if (error || !coupon) {
      return res.status(404).json({ error: 'Mã giảm giá không tồn tại' })
    }

    // Check is_active
    if (!coupon.is_active) {
      return res.status(400).json({ error: 'Mã giảm giá đã bị vô hiệu hóa' })
    }

    // Check expiration
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' })
    }

    // Check max_uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return res.status(400).json({ error: 'Mã giảm giá đã hết lượt sử dụng' })
    }

    // Check if user already used this coupon
    const { data: usage } = await supabase
      .from('coupon_usage')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('user_id', userId)
      .single()

    if (usage) {
      return res.status(400).json({ error: 'Bạn đã sử dụng mã giảm giá này rồi' })
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        max_discount: coupon.max_discount || null,
      },
    })
  } catch (err) {
    console.error('Validate coupon error:', err)
    res.status(500).json({ error: 'Lỗi server khi xác thực mã giảm giá' })
  }
})

// GET / - list all coupons (admin only)
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (err) {
    console.error('List coupons error:', err)
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách mã giảm giá' })
  }
})

// POST / - create coupon (admin only)
router.post('/', authMiddleware, requireRole('admin'), validateCoupon, async (req, res) => {
  try {
    const { code, discount_percent, max_discount, max_uses, expires_at, is_active } = req.body

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code,
        discount_percent,
        max_discount: max_discount || null,
        max_uses: max_uses || null,
        expires_at: expires_at || null,
        is_active: is_active !== undefined ? is_active : true,
        used_count: 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' })
      }
      throw error
    }

    res.status(201).json(data)
  } catch (err) {
    console.error('Create coupon error:', err)
    res.status(500).json({ error: 'Lỗi server khi tạo mã giảm giá' })
  }
})

// PUT /:id - update coupon (admin only)
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params
    const { code, discount_percent, max_discount, max_uses, expires_at, is_active } = req.body

    const updates = {}
    if (code !== undefined) updates.code = code
    if (discount_percent !== undefined) updates.discount_percent = discount_percent
    if (max_discount !== undefined) updates.max_discount = max_discount
    if (max_uses !== undefined) updates.max_uses = max_uses
    if (expires_at !== undefined) updates.expires_at = expires_at
    if (is_active !== undefined) updates.is_active = is_active

    const { data, error } = await supabase
      .from('coupons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' })
      }
      if (error.code === '23505') {
        return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' })
      }
      throw error
    }

    res.json(data)
  } catch (err) {
    console.error('Update coupon error:', err)
    res.status(500).json({ error: 'Lỗi server khi cập nhật mã giảm giá' })
  }
})

// DELETE /:id - delete coupon (admin only)
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ message: 'Đã xóa mã giảm giá thành công' })
  } catch (err) {
    console.error('Delete coupon error:', err)
    res.status(500).json({ error: 'Lỗi server khi xóa mã giảm giá' })
  }
})

export default router
