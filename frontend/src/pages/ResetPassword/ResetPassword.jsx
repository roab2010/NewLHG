import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import './ResetPassword.css'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const navigate = useNavigate()

  // Countdown and redirect after success
  useEffect(() => {
    if (!success) return
    if (countdown <= 0) {
      navigate('/login')
      return
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [success, countdown, navigate])

  const validate = () => {
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return false
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const passwordLongEnough = password.length >= 6

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />
      <div className="auth-page__particles" />

      <motion.div
        className="auth-card glass-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-card__header">
          <Link to="/" className="auth-card__logo">
            <img src="/images/logo.png" alt="LHE" />
          </Link>
          <h1 className="auth-card__title">Đặt Lại Mật Khẩu</h1>
          <p className="auth-card__subtitle">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              className="reset-pw__success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="reset-pw__success-icon">
                <CheckCircle size={48} />
              </div>
              <h2 className="reset-pw__success-title">Đổi Mật Khẩu Thành Công!</h2>
              <p className="reset-pw__success-text">
                Mật khẩu đã được cập nhật. Bạn sẽ được chuyển về trang đăng nhập sau{' '}
                <strong>{countdown}</strong> giây...
              </p>
              <div className="reset-pw__progress-bar">
                <motion.div
                  className="reset-pw__progress-fill"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error && (
                <div className="auth-card__error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-form__field">
                  <label htmlFor="new-password">Mật Khẩu Mới</label>
                  <div className="auth-form__input-wrapper">
                    <Lock size={18} />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="auth-form__toggle-pass"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className={`reset-pw__hint ${passwordLongEnough ? 'reset-pw__hint--valid' : ''}`}>
                      <CheckCircle size={12} />
                      Ít nhất 6 ký tự
                    </div>
                  )}
                </div>

                <div className="auth-form__field">
                  <label htmlFor="confirm-password">Xác Nhận Mật Khẩu</label>
                  <div className="auth-form__input-wrapper">
                    <Lock size={18} />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-form__toggle-pass"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className={`reset-pw__hint ${passwordsMatch ? 'reset-pw__hint--valid' : 'reset-pw__hint--invalid'}`}>
                      {passwordsMatch ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                      {passwordsMatch ? 'Mật khẩu khớp' : 'Mật khẩu chưa khớp'}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-form__submit"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="auth-form__spinner" />
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      Đặt Lại Mật Khẩu
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="auth-card__footer">
          <p>
            <Link to="/login" className="auth-card__link">
              Quay lại Đăng Nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
