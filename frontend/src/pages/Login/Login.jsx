import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
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
          <h1 className="auth-card__title">Đăng Nhập</h1>
          <p className="auth-card__subtitle">Chào mừng trở lại, game thủ!</p>
        </div>

        {error && (
          <div className="auth-card__error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
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

          <button
            type="submit"
            className="btn btn-primary auth-form__submit"
            disabled={loading}
          >
            {loading ? (
              <div className="auth-form__spinner" />
            ) : (
              <>
                <LogIn size={18} />
                Đăng Nhập
              </>
            )}
          </button>
        </form>

        <div className="auth-card__footer">
          <p>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="auth-card__link">Đăng ký ngay</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
