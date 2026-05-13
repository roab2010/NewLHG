import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, ShoppingBag, Package } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './Profile.css'

export default function Profile() {
  const { user, profile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'info'
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrders()
    } else {
      setLoading(false)
    }
  }, [activeTab, user])

  const loadOrders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(quantity, price, products(name, image_url))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    if (!error && data) {
      setOrders(data)
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
              <p>{profile?.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
            </div>
          </div>
          <nav className="profile-nav">
            <button 
              className={`profile-nav-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'info' })}
            >
              <User size={18} /> Thông tin cá nhân
            </button>
            <button 
              className={`profile-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setSearchParams({ tab: 'orders' })}
            >
              <ShoppingBag size={18} /> Đơn hàng của tôi
            </button>
          </nav>
        </div>

        <div className="profile-content glass-card">
          {activeTab === 'info' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2>Thông tin cá nhân</h2>
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
                  <label>Vai trò</label>
                  <div className="info-value">{profile?.role || 'customer'}</div>
                </div>
                <div className="info-item">
                  <label>Ngày tham gia</label>
                  <div className="info-value">{profile ? formatDate(profile.created_at).split(' ')[1] : ''}</div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'orders' && (
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
    </div>
  )
}
