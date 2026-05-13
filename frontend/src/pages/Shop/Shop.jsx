import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ShoppingCart, Plus, Star, Package, AlertCircle, Trash2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { fetchProducts } from '../../services/api'
import './Shop.css'

const sampleProducts = [
  {
    id: 1,
    name: 'Áo Jersey LHE 2026',
    description: 'Áo thi đấu chính thức của Long Hải Esports, chất liệu polyester cao cấp.',
    price: 450000,
    image_url: '/images/shop/jersey.png',
    category: 'Áo',
    rating: 4.8,
    stock: 25,
  },
  {
    id: 2,
    name: 'Mousepad LHE XL',
    description: 'Mousepad gaming kích thước lớn, bề mặt mịn, đế cao su chống trượt.',
    price: 250000,
    image_url: '/images/shop/mousepad.png',
    category: 'Phụ kiện',
    rating: 4.5,
    stock: 50,
  },
  {
    id: 3,
    name: 'Sticker Pack LHE',
    description: 'Bộ 10 sticker logo và mascot Long Hải Esports, chống nước.',
    price: 80000,
    image_url: '/images/shop/sticker.png',
    category: 'Sticker',
    rating: 4.9,
    stock: 100,
  },
  {
    id: 4,
    name: 'Nón LHE Snapback',
    description: 'Nón snapback thêu logo LHE, phong cách urban streetwear.',
    price: 200000,
    image_url: '/images/shop/non.png',
    category: 'Phụ kiện',
    rating: 4.7,
    stock: 30,
  },
  {
    id: 5,
    name: 'Hoodie LHE Limited',
    description: 'Hoodie limited edition, chất liệu cotton premium, in họa tiết gaming.',
    price: 550000,
    image_url: '/images/shop/hoodie.png',
    category: 'Áo',
    rating: 5.0,
    stock: 10,
  },
  {
    id: 6,
    name: 'Wristband LHE',
    description: 'Vòng tay gaming co giãn, thấm mồ hôi, logo LHE thêu nổi.',
    price: 60000,
    image_url: '/images/shop/wristband.png',
    category: 'Phụ kiện',
    rating: 4.3,
    stock: 80,
  },
  {
    id: 7,
    name: 'Áo Thun LHE Black',
    description: 'Áo thun đen cổ tròn, in logo Long Hải Esports trước ngực, chất cotton 100% thoáng mát.',
    price: 280000,
    image_url: '/images/shop/tshirt.png',
    category: 'Áo',
    rating: 4.9,
    stock: 40,
  }
]

export default function Shop() {
  const [products, setProducts] = useState(sampleProducts)
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [searchTerm, setSearchTerm] = useState('')
  const { isAuthenticated, user } = useAuth()
  
  // Khởi tạo giỏ hàng từ localStorage dựa theo user ID
  const [cart, setCart] = useState(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`cart_${user.id}`)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const navigate = useNavigate()

  // Cập nhật giỏ hàng khi đổi user (đăng nhập/đăng xuất)
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`cart_${user.id}`)
      setCart(saved ? JSON.parse(saved) : [])
    } else {
      setCart([])
      setIsCartOpen(false)
    }
  }, [user?.id])

  // Lưu giỏ hàng vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cart))
    }
  }, [cart, user?.id])

  // Fetch sản phẩm từ Supabase
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts()
        if (data && data.length > 0) {
          setProducts(data)
          console.log('✅ Products loaded from Supabase:', data.length)
        } else {
          console.log('⚠️ No products in DB, using sample data')
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch products, using sample:', err.message)
      }
    }
    loadProducts()
  }, [])

  // Tạo danh sách categories động từ data
  const categories = ['Tất cả', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Tất cả' || p.category === selectedCategory
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const addToCart = (product) => {
    if (!isAuthenticated) {
      setToastMessage('Vui lòng đăng nhập để mua hàng!')
      setTimeout(() => setToastMessage(''), 3000)
      return
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  return (
    <div className="shop-page">
      <div className="shop-page__bg" />

      <section className="section" style={{ paddingTop: `calc(var(--navbar-height) + var(--space-3xl))` }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="section-title">Cửa Hàng</h1>
            <p className="section-subtitle">
              Merch chính thức của Long Hải Esports — thể hiện tinh thần game thủ
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            className="shop__filters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="shop__search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="shop__categories">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`shop__category-btn ${selectedCategory === cat ? 'shop__category-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              className="shop__cart-btn"
              onClick={() => setIsCartOpen(!isCartOpen)}
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="shop__cart-badge">{cart.length}</span>
              )}
            </button>
          </motion.div>

          {/* Products Grid */}
          <div className="shop__grid">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                className="product-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
              >
                <div className="product-card__image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <Package size={48} />
                  )}
                  <span className="product-card__category">{product.category}</span>
                </div>
                <div className="product-card__body">
                  <h3 className="product-card__name">{product.name}</h3>
                  <p className="product-card__desc">{product.description}</p>
                  <div className="product-card__meta">
                    <div className="product-card__rating">
                      <Star size={14} fill="#EAB308" color="#EAB308" />
                      <span>{product.rating}</span>
                    </div>
                    <span className="product-card__stock">Còn {product.stock}</span>
                  </div>
                  <div className="product-card__footer">
                    <span className="product-card__price">{formatPrice(product.price)}</span>
                    <button
                      className="btn btn-primary btn--sm"
                      onClick={() => addToCart(product)}
                    >
                      <Plus size={16} />
                      {isAuthenticated ? 'Thêm' : 'Đăng nhập'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="shop__empty">
              <Package size={48} />
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>
      </section>

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
            <AlertCircle size={20} className="toast-icon" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
