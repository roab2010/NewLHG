import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, Mail, Lock, User, Eye, EyeOff, AlertCircle, Phone } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../Login/Login.css'

export default function Register() {
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp!')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, displayName, phone)
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-page__bg" />
        <motion.div
          className="auth-card glass-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: '48px', marginBottom: 'var(--space-lg)' }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)' }}>
            Đăng Ký Thành Công!
          </h2>
          <p style={{ color: 'var(--white-60)', marginBottom: 'var(--space-xl)' }}>
            Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
            Đăng Nhập
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />

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
          <h1 className="auth-card__title">Đăng Ký</h1>
          <p className="auth-card__subtitle">Tham gia cộng đồng Long Hải Esports</p>
        </div>

        {error && (
          <div className="auth-card__error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form__field">
            <label htmlFor="displayName">Tên Hiển Thị</label>
            <div className="auth-form__input-wrapper">
              <User size={18} />
              <input
                id="displayName"
                type="text"
                placeholder="Nickname của bạn"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label htmlFor="phone">Số Điện Thoại</label>
            <div className="auth-form__input-wrapper">
              <Phone size={18} />
              <input
                id="phone"
                type="tel"
                placeholder="Số điện thoại của bạn"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label htmlFor="email">Email</label>
            <div className="auth-form__input-wrapper">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-form__field">
            <label htmlFor="password">Mật Khẩu</label>
            <div className="auth-form__input-wrapper">
              <Lock size={18} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-form__toggle-pass"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-form__field">
            <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
            <div className="auth-form__input-wrapper">
              <Lock size={18} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
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
                <UserPlus size={18} />
                Đăng Ký
              </>
            )}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>
            Đã có tài khoản?{' '}
            <Link to="/login" className="auth-card__link">Đăng nhập</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
