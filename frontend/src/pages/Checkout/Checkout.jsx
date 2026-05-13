import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Package, MapPin, Phone, User as UserIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './Checkout.css'

export default function Checkout() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated } = useAuth()
  const [cart, setCart] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    name: profile?.display_name || '',
    phone: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    // If not authenticated, redirect to shop
    if (!isAuthenticated) {
      navigate('/shop')
      return
    }

    // Load cart
    if (user?.id) {
      const saved = localStorage.getItem(`cart_${user.id}`)
      if (saved) {
        const parsedCart = JSON.parse(saved)
        if (parsedCart.length === 0) {
          navigate('/shop') // Empty cart -> back to shop
        } else {
          setCart(parsedCart)
        }
      } else {
        navigate('/shop')
      }
    }
  }, [isAuthenticated, user?.id, navigate, profile])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Tạo đơn hàng mới
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          status: 'pending',
          shipping_address: formData.address,
          phone: formData.phone,
          notes: formData.notes
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Tạo chi tiết đơn hàng (order_items)
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Thành công
      setIsSuccess(true)
      if (user?.id) {
        localStorage.removeItem(`cart_${user.id}`)
      }
    } catch (err) {
      console.error('Lỗi khi đặt hàng:', err)
      alert('Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="checkout-page checkout-page--success">
        <motion.div 
          className="checkout__success-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 size={80} className="success-icon" />
          <h2>Đặt hàng thành công!</h2>
          <p>Cảm ơn {formData.name} đã mua sắm tại Long Hải Esports.</p>
          <p>Chúng tôi sẽ liên hệ vào số điện thoại <strong>{formData.phone}</strong> để xác nhận đơn hàng trong thời gian sớm nhất.</p>
          <Link to="/shop" className="btn btn-primary mt-4">
            Quay Về Cửa Hàng
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <div className="container">
          <button onClick={() => navigate(-1)} className="btn btn-ghost checkout-back">
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1>Thanh Toán</h1>
        </div>
      </div>

      <div className="container checkout-container">
        <motion.div 
          className="checkout-form-section"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="checkout-card">
            <h2><MapPin size={20}/> Thông tin giao hàng</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label>Họ và Tên</label>
                <div className="input-with-icon">
                  <UserIcon size={18} />
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên người nhận"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ nhận hàng</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ nhận hàng chi tiết"
                    rows="3"
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ghi chú đơn hàng (Tùy chọn)</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Ví dụ: Giao hàng vào buổi chiều..."
                  rows="2"
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary checkout-submit ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác Nhận Đặt Hàng'}
              </button>
            </form>
          </div>
        </motion.div>

        <motion.div 
          className="checkout-summary-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="checkout-card">
            <h2><Package size={20}/> Đơn hàng của bạn</h2>
            
            <div className="checkout-items">
              {cart.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="checkout-item">
                  <div className="checkout-item-img">
                    <img src={item.image_url || '/images/shop/placeholder.jpg'} alt={item.name} />
                  </div>
                  <div className="checkout-item-info">
                    <h4>{item.name}</h4>
                    <p className="checkout-item-qty">Số lượng: {item.quantity}</p>
                    <p className="checkout-item-price">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout-totals">
              <div className="checkout-row">
                <span>Tạm tính</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="checkout-row">
                <span>Phí giao hàng</span>
                <span>Miễn phí</span>
              </div>
              <div className="checkout-row checkout-final">
                <span>Tổng cộng</span>
                <span className="checkout-final-price">{formatPrice(cartTotal)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
