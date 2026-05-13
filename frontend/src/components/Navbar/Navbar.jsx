import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X, Shield, LogOut, User, ShoppingCart } from 'lucide-react'
import './Navbar.css'

const navLinks = [
  { path: '/', label: 'Trang Chủ' },
  { path: '/members', label: 'Thành Viên' },
  { path: '/shop', label: 'Cửa Hàng' },
  { path: '/stats', label: 'Thống Kê' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [location])

  return (
    <nav className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <img src="/images/logo.png" alt="Long Hải Esports" />
          <div className="navbar__logo-text">
            <span className="navbar__logo-name">LONG HẢI</span>
            <span className="navbar__logo-tag">ESPORTS</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="navbar__links">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
              >
                {link.label}
                <span className="navbar__link-indicator"></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="navbar__actions">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="navbar__admin-btn">
                  <Shield size={18} />
                  <span>Admin</span>
                </Link>
              )}
              <div className="navbar__user-menu">
                <button className="navbar__user-btn">
                  <User size={18} />
                  <span>{profile?.display_name || 'User'}</span>
                </button>
                <div className="navbar__dropdown">
                  <Link to="/profile" className="navbar__dropdown-item">
                    <User size={16} />
                    Hồ Sơ
                  </Link>
                  {!isAdmin && (
                    <Link to="/profile?tab=orders" className="navbar__dropdown-item">
                      <ShoppingCart size={16} />
                      Đơn hàng của tôi
                    </Link>
                  )}
                  <button onClick={signOut} className="navbar__dropdown-item navbar__dropdown-item--danger">
                    <LogOut size={16} />
                    Đăng Xuất
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="navbar__auth-btns">
              <Link to="/login" className="btn btn-ghost">Đăng Nhập</Link>
              <Link to="/register" className="btn btn-primary btn--sm">Đăng Ký</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="navbar__mobile-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar__mobile ${isMobileOpen ? 'navbar__mobile--open' : ''}`}>
        <ul className="navbar__mobile-links">
          {navLinks.map(link => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`navbar__mobile-link ${location.pathname === link.path ? 'navbar__mobile-link--active' : ''}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
          {!user && (
            <>
              <li>
                <Link to="/login" className="navbar__mobile-link">Đăng Nhập</Link>
              </li>
              <li>
                <Link to="/register" className="navbar__mobile-link navbar__mobile-link--primary">Đăng Ký</Link>
              </li>
            </>
          )}
          {user && (
            <>
              <li style={{ borderTop: '1px solid var(--white-10)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)', width: '100%' }}>
                <Link to="/profile" className="navbar__mobile-link">
                  Hồ Sơ
                </Link>
              </li>
              {!isAdmin && (
                <li>
                  <Link to="/profile?tab=orders" className="navbar__mobile-link">
                    Đơn Hàng Của Tôi
                  </Link>
                </li>
              )}
              {isAdmin && (
                <li>
                  <Link to="/admin" className="navbar__mobile-link navbar__mobile-link--primary" style={{ color: '#FF1744' }}>
                    Admin
                  </Link>
                </li>
              )}
              <li>
                <button onClick={signOut} className="navbar__mobile-link navbar__mobile-link--danger">
                  Đăng Xuất
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
