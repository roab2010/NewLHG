import rateLimit from 'express-rate-limit'

// General API limiter: 100 requests per 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth limiter: 10 requests per 15 minutes (stricter for login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// API write limiter: 30 requests per 15 minutes
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Quá nhiều yêu cầu ghi dữ liệu, vui lòng thử lại sau.' },
  standardHeaders: true,
  legacyHeaders: false,
})
