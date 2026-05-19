import { body, validationResult } from 'express-validator'

// Middleware to check validation results
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg })
  }
  next()
}

// Auth validators
export const validateRegister = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('displayName').notEmpty().withMessage('Tên hiển thị không được để trống'),
  handleValidation,
]

export const validateLogin = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
  handleValidation,
]

// Product validators
export const validateProduct = [
  body('name').notEmpty().withMessage('Tên sản phẩm không được để trống'),
  body('price').isFloat({ min: 0 }).withMessage('Giá phải là số dương'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Tồn kho phải là số nguyên dương'),
  handleValidation,
]

// Order validators
export const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Đơn hàng phải có ít nhất 1 sản phẩm'),
  body('shipping_address').notEmpty().withMessage('Địa chỉ giao hàng không được để trống'),
  body('phone').notEmpty().withMessage('Số điện thoại không được để trống'),
  handleValidation,
]

// Post validators
export const validatePost = [
  body('title').notEmpty().withMessage('Tiêu đề không được để trống'),
  body('content').notEmpty().withMessage('Nội dung không được để trống'),
  handleValidation,
]

// Review validators
export const validateReview = [
  body('product_id').notEmpty().withMessage('Product ID không được để trống'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating phải từ 1 đến 5'),
  handleValidation,
]

// Coupon validators
export const validateCoupon = [
  body('code').notEmpty().withMessage('Mã giảm giá không được để trống'),
  body('discount_percent').isInt({ min: 1, max: 100 }).withMessage('Phần trăm giảm giá phải từ 1 đến 100'),
  handleValidation,
]

export const validateCouponCode = [
  body('code').notEmpty().withMessage('Vui lòng nhập mã giảm giá'),
  handleValidation,
]
