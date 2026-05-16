import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, ShoppingBag, Package, Edit2, Save, X, Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './Profile.css'

export default function Profile() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'info'
  const isAdmin = profile?.role === 'admin'
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    phone: '',
    address: ''
  })
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '', type: 'error' })

  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      })
    }
  }, [profile])

  useEffect(() => {
    if (activeTab === 'orders' && user && !isAdmin) {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [activeTab, user, isAdmin])

  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(quantity, price, product_id, products(name, image_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('profiles').update({
      display_name: profileForm.display_name,
      phone: profileForm.phone,
      address: profileForm.address
    }).eq('id', user.id)
    
    if (!error) {
      setAlertDialog({ isOpen: true, message: "Cập nhật thông tin thành công!", type: 'success' })
      // Delay reload to let user see success message
      setTimeout(() => window.location.reload(), 1500)
    } else {
      setAlertDialog({ isOpen: true, message: "Lỗi khi cập nhật hồ sơ: " + error.message, type: 'error' })
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new !== passwordForm.confirm) {
      setAlertDialog({ isOpen: true, message: "Mật khẩu không khớp!", type: 'error' })
      return
    }
    if (passwordForm.new.length < 6) {
      setAlertDialog({ isOpen: true, message: "Mật khẩu phải có ít nhất 6 ký tự!", type: 'error' })
      return
    }
    setLoading(true)
    
    // Xác thực mật khẩu cũ trước khi đổi
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.current
    })

    if (signInError) {
      setAlertDialog({ isOpen: true, message: "Mật khẩu hiện tại không chính xác!", type: 'error' })
      setLoading(false)
      return
    }

    // Đổi mật khẩu
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new
    })
    
    if (!error) {
      setAlertDialog({ isOpen: true, message: "Đổi mật khẩu thành công!", type: 'success' })
      setIsChangingPassword(false)
      setPasswordForm({ current: '', new: '', confirm: '' })
    } else {
      setAlertDialog({ isOpen: true, message: "Lỗi đổi mật khẩu: " + error.message, type: 'error' })
    }
    setLoading(false)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit',
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="profile-badge profile-badge--warning">Chờ xử lý</span>
      case 'confirmed': return <span className="profile-badge profile-badge--info">Đã xác nhận</span>
      case 'shipped': return <span className="profile-badge profile-badge--primary">Đang giao</span>
      case 'delivered': return <span className="profile-badge profile-badge--success">Đã giao</span>
      case 'cancelled': return <span className="profile-badge profile-badge--danger">Đã hủy</span>
      default: return <span className="profile-badge">Khác</span>
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="container">
          <h1>Tài Khoản Của Tôi</h1>
        </div>
      </div>

      <div className="container profile-container">
        <div className="profile-sidebar glass-card">
          <div className="profile-user">
            <div className="profile-avatar">
              <User size={40} />
            </div>
            <div className="profile-user-info">
              <h3>{profile?.display_name || 'Người dùng'}</h3>
              <p>{isAdmin ? 'Quản trị viên' : 'Thành viên'}</p>
            </div>
          </div>
          <nav className="profile-nav">
            <button 
              className={`profile-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'info' })}
            >
              <User size={18} /> Thông tin cá nhân
            </button>
            {!isAdmin && (
              <button 
                className={`profile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setSearchParams({ tab: 'orders' })}
              >
                <ShoppingBag size={18} /> Đơn hàng của tôi
              </button>
            )}
          </nav>
        </div>

        <div className="profile-content glass-card">
          {activeTab === 'info' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="profile-content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--white-10)' }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Thông tin cá nhân</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {!isChangingPassword && !isEditingProfile && (
                    <button className="btn btn-ghost btn--sm" onClick={() => setIsChangingPassword(true)}>
                      <Lock size={16} /> Đổi mật khẩu
                    </button>
                  )}
                  {!isEditingProfile && !isChangingPassword && (
                    <button className="btn btn-primary btn--sm" onClick={() => setIsEditingProfile(true)}>
                      <Edit2 size={16} /> Sửa thông tin
                    </button>
                  )}
                </div>
              </div>

              {isChangingPassword ? (
                <div className="profile-edit-form">
                  <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                      <label>Mật khẩu hiện tại</label>
                      <input 
                        type="password" 
                        value={passwordForm.current} 
                        onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} 
                        placeholder="Nhập mật khẩu hiện tại"
                        className="profile-input"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passwordForm.new} 
                        onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} 
                        placeholder="Nhập mật khẩu mới"
                        className="profile-input"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Xác nhận mật khẩu mới</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirm} 
                        onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} 
                        placeholder="Nhập lại mật khẩu mới"
                        className="profile-input"
                        required 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={loading}>Đổi Mật Khẩu</button>
                      <button type="button" className="btn btn-ghost" onClick={() => setIsChangingPassword(false)}>Hủy</button>
                    </div>
                  </form>
                </div>
              ) : isEditingProfile ? (
                <div className="profile-edit-form">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="form-group">
                      <label>Tên hiển thị</label>
                      <input 
                        type="text" 
                        value={profileForm.display_name} 
                        onChange={e => setProfileForm({...profileForm, display_name: e.target.value})} 
                        className="profile-input"
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input 
                        type="tel" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                        className="profile-input"
                        placeholder="Chưa cập nhật"
                      />
                    </div>
                    <div className="form-group">
                      <label>Địa chỉ</label>
                      <textarea 
                        value={profileForm.address} 
                        onChange={e => setProfileForm({...profileForm, address: e.target.value})} 
                        className="profile-input"
                        rows="3"
                        placeholder="Chưa cập nhật"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={loading}>
                        <Save size={16} /> Lưu Thay Đổi
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setIsEditingProfile(false)}>
                        <X size={16} /> Hủy
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="profile-info-grid">
                  <div className="info-item">
                    <label>Tên hiển thị</label>
                    <div className="info-value">{profile?.display_name || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-item">
                    <label>Email liên kết</label>
                    <div className="info-value">{user?.email || 'Không có email'}</div>
                  </div>
                  <div className="info-item">
                    <label>Số điện thoại</label>
                    <div className="info-value">{profile?.phone || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-item">
                    <label>Địa chỉ</label>
                    <div className="info-value">{profile?.address || 'Chưa cập nhật'}</div>
                  </div>
                  <div className="info-item">
                    <label>Vai trò</label>
                    <div className="info-value">{profile?.role || 'customer'}</div>
                  </div>
                  <div className="info-item">
                    <label>Ngày tham gia</label>
                    <div className="info-value">{profile ? formatDate(profile.created_at).split(' ')[1] : ''}</div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'orders' && !isAdmin && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>Đơn hàng của tôi</h2>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải đơn hàng...</div>
              ) : orders.length === 0 ? (
                <div className="empty-orders">
                  <Package size={48} />
                  <p>Bạn chưa có đơn hàng nào.</p>
                </div>
              ) : (
                <div className="profile-orders">
                  {orders.map(order => (
                    <div key={order.id} className="profile-order-card">
                      <div className="order-header">
                        <div>
                          <span className="order-id">#{order.id.substring(0,8)}</span>
                          <span className="order-date">{formatDate(order.created_at)}</span>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="order-body">
                        {order.order_items?.map((item, idx) => (
                          <div key={idx} className="order-item">
                            <img src={item.products?.image_url || '/images/shop/placeholder.jpg'} alt="Product" />
                            <div className="item-info">
                              <h4>{item.products?.name}</h4>
                              <p>Số lượng: {item.quantity}</p>
                            </div>
                            <div className="item-price">
                              {formatPrice(item.price * item.quantity)}
                            </div>
                            {order.status === 'delivered' && (
                              <Link 
                                to={`/shop/${item.product_id}`} 
                                className="btn btn-primary btn--sm"
                                style={{ marginLeft: '1rem', whiteSpace: 'nowrap' }}
                              >
                                Đánh giá
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <div className="order-totals">
                          <span>Tổng cộng:</span>
                          <span className="total-price">{formatPrice(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {alertDialog.isOpen && (
        <div className="profile-alert-overlay">
          <motion.div 
            className="profile-alert-box glass-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={`profile-alert-icon ${alertDialog.type}`}>
              {alertDialog.type === 'success' ? <Package size={32} /> : <X size={32} />}
            </div>
            <h3>{alertDialog.type === 'success' ? 'Thành công' : 'Lỗi'}</h3>
            <p>{alertDialog.message}</p>
            <button 
              className={`btn ${alertDialog.type === 'success' ? 'btn-primary' : 'btn-danger'}`} 
              onClick={() => setAlertDialog({ isOpen: false, message: '', type: 'error' })}
            >
              Đóng
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
