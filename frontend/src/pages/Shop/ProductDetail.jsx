import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  ShoppingCart,
  ChevronLeft,
  Package,
  ShieldCheck,
  Truck,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  User
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { fetchProductById, fetchReviews, checkCanReview, submitReview } from '../../services/api'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, token } = useAuth()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Review form state
  const [canReview, setCanReview] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  const [quantity, setQuantity] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState([])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching product with ID:', id)
        
        const productData = await fetchProductById(id)
        if (!productData) {
          throw new Error('Sản phẩm không tồn tại trong cơ sở dữ liệu.')
        }
        
        setProduct(productData)

        try {
          const reviewsData = await fetchReviews(id)
          setReviews(reviewsData)
        } catch (re) {
          console.warn('⚠️ Could not load reviews:', re.message)
        }

        if (isAuthenticated) {
          try {
            // Lấy session tươi nhất trực tiếp từ Supabase
            const { data: { session } } = await supabase.auth.getSession()
            const activeToken = session?.access_token || token

            if (activeToken) {
              const status = await checkCanReview(id, activeToken)
              console.log('📊 KẾT QUẢ KIỂM TRA ĐÁNH GIÁ:', status)
              setCanReview(status.canReview)
              setAlreadyReviewed(status.alreadyReviewed)
            }
          } catch (se) {
            console.warn('⚠️ Could not check review status:', se.message)
          }
        }
      } catch (err) {
        console.error('❌ Error loading product detail:', err)
        setError(err.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, isAuthenticated, token])

  // Load cart from localStorage on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const cartKey = `cart_${user.id}`
      const savedCart = JSON.parse(localStorage.getItem(cartKey) || '[]')
      setCart(savedCart)
    }
  }, [isAuthenticated, user])

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    // Lấy giỏ hàng từ localStorage
    const cartKey = `cart_${user.id}`
    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]')

    const existingIndex = currentCart.findIndex(item => item.id === product.id)
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity
    } else {
      currentCart.push({
        ...product,
        quantity: quantity
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(currentCart))
    setCart(currentCart)
    
    // Hiển thị Toast và mở giỏ hàng
    setToastMessage(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`)
    setIsCartOpen(true)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const removeFromCart = (productId) => {
    const cartKey = `cart_${user.id}`
    const updatedCart = cart.filter(item => item.id !== productId)
    setCart(updatedCart)
    localStorage.setItem(cartKey, JSON.stringify(updatedCart))
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      setSubmitting(true)
      const result = await submitReview({
        product_id: id,
        rating,
        comment
      }, token)

      setSubmitStatus({ type: 'success', message: 'Cảm ơn bạn đã đánh giá sản phẩm!' })
      setReviews([result, ...reviews])
      setAlreadyReviewed(true)
      setComment('')
    } catch (err) {
      setSubmitStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="product-detail-error container">
        <AlertCircle size={48} />
        <h2>{error || 'Sản phẩm không tồn tại'}</h2>
        <Link to="/shop" className="btn btn-primary">Quay lại cửa hàng</Link>
      </div>
    )
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  return (
    <div className="product-detail-page">
      <div className="product-detail__bg" />

      {/* Floating Cart Button */}
      {isAuthenticated && (
        <motion.button
          className="floating-cart-btn"
          onClick={() => setIsCartOpen(true)}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
        >
          <ShoppingCart size={24} />
          {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        </motion.button>
      )}

      <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-xl))' }}>
        <button className="back-btn" onClick={() => navigate('/shop')}>
          <ChevronLeft size={20} /> Quay lại cửa hàng
        </button>

        <div className="product-main glass-card">
          <div className="product-main__image">
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={product.image_url || '/images/shop/placeholder.png'}
              alt={product.name}
            />
          </div>

          <div className="product-main__info">
            <span className="product-category-tag">{product.category}</span>
            <h1 className="product-title">{product.name}</h1>

            <div className="product-rating-summary">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.floor(product.rating || 0) ? "#EAB308" : "none"}
                    color="#EAB308"
                  />
                ))}
              </div>
              <span className="rating-value">{product.rating || 0}</span>
              <span className="review-count">({reviews.length} đánh giá)</span>
            </div>

            <div className="product-price">{formatPrice(product.price)}</div>

            <p className="product-description">{product.description}</p>

            <div className="product-actions">
              <div className="quantity-selector">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
              </div>

              <button
                className="btn btn-primary add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
              >
                <ShoppingCart size={20} />
                {product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
            </div>

            <div className="product-stock-status">
              <Package size={16} />
              <span>{product.stock > 0 ? `Còn ${product.stock} sản phẩm trong kho` : 'Hết hàng'}</span>
            </div>

            <div className="product-features">
              <div className="feature-item">
                <ShieldCheck size={20} />
                <span>Bảo hành chính hãng</span>
              </div>
              <div className="feature-item">
                <Truck size={20} />
                <span>Giao hàng toàn quốc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="reviews-section">
          <div className="section-header">
            <h2 className="section-title">
              <MessageSquare size={24} /> Đánh Giá Sản Phẩm
            </h2>
          </div>

          <div className="reviews-layout">
            {/* Review Form */}
            <div className="review-form-container glass-card">
              <h3>Viết đánh giá</h3>
              {!isAuthenticated ? (
                <div className="review-notice">
                  <p>Vui lòng đăng nhập để đánh giá sản phẩm này.</p>
                  <Link to="/login" className="btn btn-outline btn--sm">Đăng nhập ngay</Link>
                </div>
              ) : alreadyReviewed ? (
                <div className="review-notice success">
                  <CheckCircle2 size={24} />
                  <p>Bạn đã đánh giá sản phẩm này. Cảm ơn ý kiến của bạn!</p>
                </div>
              ) : !canReview ? (
                <div className="review-notice info">
                  <AlertCircle size={24} />
                  <p>Bạn chỉ có thể đánh giá sau khi đã mua và nhận được sản phẩm này.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="rating-input">
                    <label>Xếp hạng của bạn:</label>
                    <div className="stars-input">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          type="button"
                          key={s}
                          onClick={() => setRating(s)}
                          className={s <= rating ? 'active' : ''}
                        >
                          <Star size={24} fill={s <= rating ? "#EAB308" : "none"} color="#EAB308" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nhận xét của bạn:</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                      rows="4"
                      required
                    ></textarea>
                  </div>

                  {submitStatus.message && (
                    <div className={`status-message ${submitStatus.type}`}>
                      {submitStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {submitStatus.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </button>
                </form>
              )}
            </div>

            {/* Reviews List */}
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <div className="empty-reviews glass-card">
                  <MessageSquare size={40} opacity={0.3} />
                  <p>Chưa có đánh giá nào cho sản phẩm này.</p>
                </div>
              ) : (
                reviews.map((review, index) => (
                  <motion.div
                    key={review.id}
                    className="review-item glass-card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="review-item__header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {review.profiles?.avatar_url ? (
                            <img src={review.profiles.avatar_url} alt="" />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div className="user-details">
                          <span className="user-name">{review.profiles?.display_name || 'Người dùng'}</span>
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < review.rating ? "#EAB308" : "none"}
                            color="#EAB308"
                          />
                        ))}
                      </div>
                    </div>
                    <p className="review-content">{review.comment}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${isCartOpen ? 'cart-sidebar--open' : ''}`}>
        <div className="cart-sidebar__header">
          <h3><ShoppingCart size={20} /> Giỏ Hàng ({cart.length})</h3>
          <button onClick={() => setIsCartOpen(false)}>&times;</button>
        </div>
        <div className="cart-sidebar__items">
          {cart.length === 0 ? (
            <p className="cart-sidebar__empty">Giỏ hàng trống</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item__info">
                  <h4>{item.name}</h4>
                  <p>{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <button
                  className="cart-item__remove"
                  onClick={() => removeFromCart(item.id)}
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="cart-sidebar__footer">
            <div className="cart-sidebar__total">
              <span>Tổng cộng:</span>
              <span className="cart-sidebar__total-value">{formatPrice(cartTotal)}</span>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
            >
              Tiến Hành Đặt Hàng
            </button>
          </div>
        )}
      </div>
      {isCartOpen && <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="toast-message"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, transition: { duration: 0.2 } }}
          >
            <CheckCircle2 size={20} className="toast-icon success" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
