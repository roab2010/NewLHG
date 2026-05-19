import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../services/supabase'
import './ForgotPassword.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Gửi email thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="auth-card__title">Quên Mật Khẩu</h1>
          <p className="auth-card__subtitle">
            Nhập email để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              className="forgot-pw__success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="forgot-pw__success-icon">
                <CheckCircle size={48} />
              </div>
              <h2 className="forgot-pw__success-title">Email Đã Được Gửi!</h2>
              <p className="forgot-pw__success-text">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu đến{' '}
                <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (và thư rác).
              </p>
              <button
                className="btn btn-outline forgot-pw__resend"
                onClick={() => { setSent(false); setEmail('') }}
              >
                <Mail size={18} />
                Gửi Lại Email
              </button>
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
                  <label htmlFor="forgot-email">Email</label>
                  <div className="auth-form__input-wrapper">
                    <Mail size={18} />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
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
                      <Send size={18} />
                      Gửi Liên Kết
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="auth-card__footer">
          <p>
            <Link to="/login" className="auth-card__link forgot-pw__back-link">
              <ArrowLeft size={16} />
              Quay lại Đăng Nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
