import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingBag, Users, FileText,
  Plus, Edit2, Trash2, Eye, DollarSign, UserCheck, Upload,
  Ticket, Calendar, Tag, AlertCircle, CheckCircle2, RefreshCw, Star
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { uploadImage } from '../../services/storage'
import {
  fetchCoupons, createCoupon, updateCoupon, deleteCoupon,
  fetchAnalyticsRevenue, fetchAnalyticsTopProducts, fetchAnalyticsUsersGrowth, fetchAnalyticsOrdersByStatus,
  updateOrderStatus, fetchAdminReviews, deleteAdminReview
} from '../../services/api'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, PieChart, Pie, LineChart, Line
} from 'recharts'
import './Admin.css'

const sidebarItems = [
  { key: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
  { key: 'products', label: 'Sản Phẩm', icon: <Package size={20} /> },
  { key: 'orders', label: 'Đơn Hàng', icon: <ShoppingBag size={20} /> },
  { key: 'coupons', label: 'Mã Giảm Giá', icon: <Ticket size={20} /> },
  { key: 'users', label: 'Người Dùng', icon: <Users size={20} /> },
  { key: 'reviews', label: 'Đánh Giá', icon: <Star size={20} /> },
  { key: 'members', label: 'Thành Viên', icon: <UserCheck size={20} /> },
  { key: 'posts', label: 'Bài Viết', icon: <FileText size={20} /> },
]

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const formatDate = (dateString) => {
  if (!dateString) return 'Vô hạn'
  return new Date(dateString).toLocaleString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { profile, token } = useAuth()
  
  // Data States
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, products: 0 })
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Analytics States
  const [revenueData, setRevenueData] = useState([])
  const [topProductsData, setTopProductsData] = useState([])
  const [usersGrowthData, setUsersGrowthData] = useState([])
  const [ordersStatusData, setOrdersStatusData] = useState([])
  const [analyticsPeriod, setAnalyticsPeriod] = useState(30)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  // Coupons States
  const [coupons, setCoupons] = useState([])
  const [couponModal, setCouponModal] = useState({ isOpen: false, data: null })
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_percent: 10,
    max_uses: '',
    is_active: true,
    expires_at: '',
    description: ''
  })
  const [couponSubmitting, setCouponSubmitting] = useState(false)
  
  // Reviews States
  const [reviews, setReviews] = useState([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewFilterRating, setReviewFilterRating] = useState('all')
  const [reviewSearchQuery, setReviewSearchQuery] = useState('')
  const [reviewPage, setReviewPage] = useState(1)
  const reviewsPerPage = 8

  // Modal States
  const [productModal, setProductModal] = useState({ isOpen: false, data: null })
  const [orderModal, setOrderModal] = useState({ isOpen: false, order: null, items: [] })
  const [userDetailModal, setUserDetailModal] = useState({ isOpen: false, user: null })
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: null })
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, message: '' })
  
  // Form State for Product
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: 'Áo', image_url: '' })
  const [imageUploading, setImageUploading] = useState(false)

  // Load Main Tables Data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // 1. Fetch Users
        const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
        setUsers(usersData || [])
        
        // 2. Fetch Products
        const { data: productsData } = await supabase.from('products').select('*').order('created_at', { ascending: false })
        setProducts(productsData || [])
        
        // 3. Fetch Orders
        const { data: ordersData } = await supabase.from('orders').select(`
          id, total_amount, status, created_at, phone, shipping_address, notes,
          user:profiles(display_name)
        `).order('created_at', { ascending: false })
        setOrders(ordersData || [])

        // Calculate stats
        const totalRevenue = (ordersData || [])
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
        setStats({
          users: usersData?.length || 0,
          orders: ordersData?.length || 0,
          revenue: totalRevenue,
          products: productsData?.length || 0
        })

        // Recent activities
        const activities = []
        if (ordersData && ordersData.length > 0) {
          activities.push({
            id: 'o' + ordersData[0].id,
            text: `Đơn hàng mới #${ordersData[0].id.substring(0,8)} từ ${ordersData[0].user?.display_name || 'Khách'}`,
            time: formatDate(ordersData[0].created_at),
            color: '#10B981'
          })
        }
        if (usersData && usersData.length > 0) {
          activities.push({
            id: 'u' + usersData[0].id,
            text: `Người dùng mới đăng ký: ${usersData[0].display_name || 'User'}`,
            time: formatDate(usersData[0].created_at),
            color: '#3B82F6'
          })
        }
        if (productsData && productsData.length > 0) {
          activities.push({
            id: 'p' + productsData[0].id,
            text: `Sản phẩm mới thêm: ${productsData[0].name}`,
            time: formatDate(productsData[0].created_at),
            color: '#8B5CF6'
          })
        }
        setRecentActivity(activities)
        
      } catch (err) {
        console.error('Error loading admin data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    if (profile?.role === 'admin') {
      loadData()
    }
  }, [profile])

  // Load Analytics Data
  useEffect(() => {
    async function loadAnalyticsData() {
      if (profile?.role !== 'admin' || activeTab !== 'dashboard' || !token) return
      setAnalyticsLoading(true)
      try {
        const [rev, top, growth, statusData] = await Promise.all([
          fetchAnalyticsRevenue(analyticsPeriod, token),
          fetchAnalyticsTopProducts(token),
          fetchAnalyticsUsersGrowth(analyticsPeriod, token),
          fetchAnalyticsOrdersByStatus(token)
        ])
        setRevenueData(rev || [])
        setTopProductsData(top || [])
        setUsersGrowthData(growth || [])
        setOrdersStatusData(statusData || [])
      } catch (err) {
        console.error('Lỗi khi tải biểu đồ Analytics:', err)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    loadAnalyticsData()
  }, [profile, activeTab, analyticsPeriod, token])

  // Load Coupons Data
  useEffect(() => {
    async function loadCouponsData() {
      if (profile?.role !== 'admin' || activeTab !== 'coupons' || !token) return
      try {
        const data = await fetchCoupons(token)
        setCoupons(data || [])
      } catch (err) {
        console.error('Lỗi khi tải mã giảm giá:', err)
      }
    }
    loadCouponsData()
  }, [profile, activeTab, token])

  // Load Reviews Data
  useEffect(() => {
    async function loadReviewsData() {
      if (profile?.role !== 'admin' || activeTab !== 'reviews' || !token) return
      setReviewLoading(true)
      try {
        const data = await fetchAdminReviews(token)
        setReviews(data || [])
      } catch (err) {
        console.error('Lỗi khi tải danh sách đánh giá:', err)
      } finally {
        setReviewLoading(false)
      }
    }
    loadReviewsData()
  }, [profile, activeTab, token])

  // Reset page when filters change
  useEffect(() => {
    setReviewPage(1)
  }, [reviewSearchQuery, reviewFilterRating])

  // Product CRUD Handlers
  const handleDeleteProduct = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
      onConfirm: async () => {
        const { error } = await supabase.from('products').delete().eq('id', id)
        if (!error) {
          setProducts(products.filter(p => p.id !== id))
          setStats(s => ({ ...s, products: s.products - 1 }))
        }
        else setAlertDialog({ isOpen: true, message: 'Lỗi khi xóa sản phẩm: ' + error.message })
        setConfirmDialog({ isOpen: false })
      }
    })
  }

  const handleDeleteUser = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa người dùng này?',
      onConfirm: async () => {
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (!error) {
          setUsers(users.filter(u => u.id !== id))
          setStats(s => ({ ...s, users: s.users - 1 }))
        }
        else setAlertDialog({ isOpen: true, message: 'Lỗi khi xóa người dùng: ' + error.message })
        setConfirmDialog({ isOpen: false })
      }
    })
  }

  const handleDeleteReview = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này cũng sẽ cập nhật lại điểm trung bình của sản phẩm tương ứng.',
      onConfirm: async () => {
        try {
          await deleteAdminReview(id, token)
          setReviews(reviews.filter(r => r.id !== id))
          setAlertDialog({ isOpen: true, message: 'Đã xóa đánh giá thành công!' })
        } catch (err) {
          setAlertDialog({ isOpen: true, message: err.message || 'Lỗi khi xóa đánh giá!' })
        }
        setConfirmDialog({ isOpen: false })
      }
    })
  }

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      await updateOrderStatus(id, newStatus, token)
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
      
      // Update statistics revenue
      if (newStatus === 'delivered') {
        const o = orders.find(x => x.id === id)
        if (o) setStats(s => ({ ...s, revenue: s.revenue + Number(o.total_amount) }))
      } else {
        const oldO = orders.find(x => x.id === id)
        if (oldO && oldO.status === 'delivered') {
          setStats(s => ({ ...s, revenue: Math.max(0, s.revenue - Number(oldO.total_amount)) }))
        }
      }
    } catch (err) {
      setAlertDialog({ isOpen: true, message: err.message || 'Lỗi khi cập nhật trạng thái đơn hàng!' })
    }
  }

  const handleUpdateUserRole = async (id, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else setAlertDialog({ isOpen: true, message: 'Lỗi khi cập nhật chức vụ!' })
  }

  // Image upload directly to Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
    if (file) {
      setImageUploading(true)
      try {
        const publicUrl = await uploadImage('products', file, 'products')
        setProductForm(prev => ({ ...prev, image_url: publicUrl }))
      } catch (err) {
        console.error('Lỗi upload ảnh:', err)
        setAlertDialog({ isOpen: true, message: 'Lỗi upload ảnh lên Supabase Storage: ' + err.message })
      } finally {
        setImageUploading(false)
      }
    }
  }

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setProductForm({ name: product.name, price: product.price, stock: product.stock, category: product.category || 'Khác', image_url: product.image_url || '' })
      setProductModal({ isOpen: true, data: product })
    } else {
      setProductForm({ name: '', price: '', stock: '', category: 'Áo', image_url: '' })
      setProductModal({ isOpen: true, data: null })
    }
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || productForm.price === '') return setAlertDialog({ isOpen: true, message: 'Vui lòng nhập đủ thông tin!' })
    
    if (Number(productForm.price) < 0) return setAlertDialog({ isOpen: true, message: 'Giá sản phẩm không được âm!' })
    if (Number(productForm.stock) < 0) return setAlertDialog({ isOpen: true, message: 'Số lượng tồn kho không được âm!' })

    const productData = { 
      name: productForm.name, 
      price: Number(productForm.price), 
      stock: Number(productForm.stock), 
      category: productForm.category,
      image_url: productForm.image_url
    }

    if (productModal.data) {
      // Update
      const { error } = await supabase.from('products').update(productData).eq('id', productModal.data.id)
      if (!error) {
        setProducts(products.map(p => p.id === productModal.data.id ? { ...p, ...productData } : p))
        setProductModal({ isOpen: false, data: null })
      } else setAlertDialog({ isOpen: true, message: 'Lỗi khi cập nhật sản phẩm!' })
    } else {
      // Create new
      productData.created_by = profile?.id
      const { data, error } = await supabase.from('products').insert([productData]).select()
      if (!error && data) {
        setProducts([data[0], ...products])
        setStats(s => ({ ...s, products: s.products + 1 }))
        setProductModal({ isOpen: false, data: null })
      } else setAlertDialog({ isOpen: true, message: 'Lỗi khi thêm sản phẩm!' })
    }
  }

  const showOrderDetails = async (order) => {
    const { data, error } = await supabase.from('order_items').select('quantity, price, products(name)').eq('order_id', order.id)
    if (!error && data) {
      setOrderModal({ isOpen: true, order: order, items: data })
    } else {
      setAlertDialog({ isOpen: true, message: 'Không thể lấy chi tiết đơn hàng' })
    }
  }

  // Coupons CRUD Handlers
  const handleOpenCouponModal = (coupon = null) => {
    if (coupon) {
      setCouponForm({
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        max_uses: coupon.max_uses || '',
        is_active: coupon.is_active,
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
        description: coupon.description || ''
      })
      setCouponModal({ isOpen: true, data: coupon })
    } else {
      setCouponForm({
        code: '',
        discount_percent: 10,
        max_uses: '',
        is_active: true,
        expires_at: '',
        description: ''
      })
      setCouponModal({ isOpen: true, data: null })
    }
  }

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !couponForm.discount_percent) {
      return setAlertDialog({ isOpen: true, message: 'Vui lòng nhập đầy đủ thông tin mã giảm giá!' })
    }

    const couponData = {
      code: couponForm.code.trim().toUpperCase(),
      discount_percent: Number(couponForm.discount_percent),
      max_uses: couponForm.max_uses ? Number(couponForm.max_uses) : null,
      is_active: couponForm.is_active,
      expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
      description: couponForm.description.trim() || null
    }

    setCouponSubmitting(true)
    try {
      if (couponModal.data) {
        // Update
        const updated = await updateCoupon(couponModal.data.id, couponData, token)
        setCoupons(coupons.map(c => c.id === couponModal.data.id ? updated : c))
      } else {
        // Create
        const created = await createCoupon(couponData, token)
        setCoupons([created, ...coupons])
      }
      setCouponModal({ isOpen: false, data: null })
    } catch (err) {
      setAlertDialog({ isOpen: true, message: err.message || 'Lỗi khi lưu mã giảm giá!' })
    } finally {
      setCouponSubmitting(false)
    }
  }

  const handleDeleteCoupon = (id) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Bạn có chắc chắn muốn xóa mã giảm giá này?',
      onConfirm: async () => {
        try {
          await deleteCoupon(id, token)
          setCoupons(coupons.filter(c => c.id !== id))
        } catch (err) {
          setAlertDialog({ isOpen: true, message: err.message || 'Lỗi khi xóa mã giảm giá!' })
        }
        setConfirmDialog({ isOpen: false })
      }
    })
  }

  // Colors for Recharts Pie Chart
  const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#6366F1', '#FF1744']

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <img src="/images/logo.png" alt="LHE" className="admin-sidebar__logo" />
          <div>
            <h3>LHE Admin</h3>
            <span>{profile?.display_name}</span>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          {sidebarItems.map(item => (
            <button
              key={item.key}
              className={`admin-sidebar__item ${activeTab === item.key ? 'admin-sidebar__item--active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-main__header">
          <h1>{sidebarItems.find(i => i.key === activeTab)?.label}</h1>
          <div className="admin-main__badge">
            <span className="admin-main__role">ADMIN</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: DASHBOARD ANALYTICS */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--white-40)' }}>
                  <RefreshCw className="loading-spinner" size={40} style={{ margin: '0 auto var(--space-md)' }} />
                  <p>Đang tải dữ liệu hệ thống...</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="admin-stats">
                    <div className="admin-stat-card glass-card">
                      <div className="admin-stat-card__icon" style={{ color: '#3B82F6', background: '#3B82F615' }}>
                        <Users size={24} />
                      </div>
                      <div className="admin-stat-card__info">
                        <span className="admin-stat-card__value">{stats.users}</span>
                        <span className="admin-stat-card__label">Người dùng</span>
                      </div>
                    </div>
                    
                    <div className="admin-stat-card glass-card">
                      <div className="admin-stat-card__icon" style={{ color: '#10B981', background: '#10B98115' }}>
                        <ShoppingBag size={24} />
                      </div>
                      <div className="admin-stat-card__info">
                        <span className="admin-stat-card__value">{stats.orders}</span>
                        <span className="admin-stat-card__label">Đơn hàng</span>
                      </div>
                    </div>

                    <div className="admin-stat-card glass-card">
                      <div className="admin-stat-card__icon" style={{ color: '#F59E0B', background: '#F59E0B15' }}>
                        <DollarSign size={24} />
                      </div>
                      <div className="admin-stat-card__info">
                        <span className="admin-stat-card__value">{formatPrice(stats.revenue)}</span>
                        <span className="admin-stat-card__label">Doanh thu</span>
                      </div>
                    </div>

                    <div className="admin-stat-card glass-card">
                      <div className="admin-stat-card__icon" style={{ color: '#8B5CF6', background: '#8B5CF615' }}>
                        <Package size={24} />
                      </div>
                      <div className="admin-stat-card__info">
                        <span className="admin-stat-card__value">{stats.products}</span>
                        <span className="admin-stat-card__label">Sản phẩm</span>
                      </div>
                    </div>
                  </div>

                  {/* Analytics Section */}
                  <div className="analytics-header">
                    <h2>Biểu đồ phân tích chuyên sâu</h2>
                    <div className="analytics-period-selector">
                      {[7, 30, 90].map((days) => (
                        <button
                          key={days}
                          className={`analytics-period-btn ${analyticsPeriod === days ? 'analytics-period-btn--active' : ''}`}
                          onClick={() => setAnalyticsPeriod(days)}
                        >
                          {days} Ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="analytics-grid">
                    {/* Line Chart: Revenue */}
                    <div className="analytics-chart-container glass-card">
                      <h3>Doanh thu theo thời gian</h3>
                      {analyticsLoading && (
                        <div className="analytics-loading-placeholder">
                          <RefreshCw className="loading-spinner" size={24} />
                        </div>
                      )}
                      <div className="analytics-chart" style={{ width: '100%', height: '300px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--white-10)" />
                            <XAxis dataKey="date" stroke="var(--white-40)" tick={{ fontSize: 11 }} />
                            <YAxis stroke="var(--white-40)" tick={{ fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ background: '#12121a', border: '1px solid var(--white-10)', borderRadius: '8px' }}
                              labelStyle={{ color: 'var(--white)' }}
                            />
                            <Line type="monotone" dataKey="revenue" name="Doanh thu (VND)" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Area Chart: User Growth */}
                    <div className="analytics-chart-container glass-card">
                      <h3>Tăng trưởng người dùng mới</h3>
                      {analyticsLoading && (
                        <div className="analytics-loading-placeholder">
                          <RefreshCw className="loading-spinner" size={24} />
                        </div>
                      )}
                      <div className="analytics-chart" style={{ width: '100%', height: '300px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={usersGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--white-10)" />
                            <XAxis dataKey="date" stroke="var(--white-40)" tick={{ fontSize: 11 }} />
                            <YAxis stroke="var(--white-40)" tick={{ fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ background: '#12121a', border: '1px solid var(--white-10)', borderRadius: '8px' }}
                            />
                            <Area type="monotone" dataKey="count" name="Người dùng mới" stroke="#8B5CF6" fillOpacity={1} fill="url(#userGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bar Chart: Top Products */}
                    <div className="analytics-chart-container glass-card">
                      <h3>Top 5 sản phẩm bán chạy nhất</h3>
                      {analyticsLoading && (
                        <div className="analytics-loading-placeholder">
                          <RefreshCw className="loading-spinner" size={24} />
                        </div>
                      )}
                      <div className="analytics-chart" style={{ width: '100%', height: '300px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProductsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--white-10)" />
                            <XAxis dataKey="name" stroke="var(--white-40)" tick={{ fontSize: 9 }} />
                            <YAxis stroke="var(--white-40)" tick={{ fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ background: '#12121a', border: '1px solid var(--white-10)', borderRadius: '8px' }}
                            />
                            <Bar dataKey="total_sold" name="Đã bán" fill="#F59E0B" radius={[4, 4, 0, 0]}>
                              {topProductsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Pie Chart: Order Status */}
                    <div className="analytics-chart-container glass-card">
                      <h3>Phân bổ trạng thái đơn hàng</h3>
                      {analyticsLoading && (
                        <div className="analytics-loading-placeholder">
                          <RefreshCw className="loading-spinner" size={24} />
                        </div>
                      )}
                      <div className="analytics-chart" style={{ width: '100%', height: '300px', position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={ordersStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="count"
                              nameKey="status"
                            >
                              {ordersStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ background: '#12121a', border: '1px solid var(--white-10)', borderRadius: '8px' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="admin-section glass-card">
                    <h2>Hoạt Động Gần Đây (Thực tế)</h2>
                    <div className="admin-activity">
                      {recentActivity.length === 0 ? <p>Chưa có hoạt động nào.</p> : recentActivity.map(act => (
                        <div key={act.id} className="admin-activity__item">
                          <div className="admin-activity__dot" style={{ background: act.color }} />
                          <div>
                            <p>{act.text}</p>
                            <span>{act.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* TAB 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="admin-section glass-card">
                <div className="admin-section__header">
                  <h2>Quản Lý Sản Phẩm</h2>
                  <button className="btn btn-primary btn--sm" onClick={() => handleOpenProductModal()}>
                    <Plus size={16} /> Thêm Sản Phẩm
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hình ảnh</th>
                      <th>Tên</th>
                      <th>Danh mục</th>
                      <th>Giá</th>
                      <th>Tồn kho</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan="6" style={{textAlign:'center'}}>Chưa có sản phẩm nào.</td></tr>
                    ) : products.map(product => (
                      <tr key={product.id}>
                        <td>
                          <img 
                            src={product.image_url || '/images/shop/placeholder.jpg'} 
                            alt={product.name} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                          />
                        </td>
                        <td>{product.name}</td>
                        <td><span className="admin-badge">{product.category || 'Khác'}</span></td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{product.stock}</td>
                        <td>
                          <div className="admin-table__actions">
                            <button className="admin-action-btn" onClick={() => handleOpenProductModal(product)}><Edit2 size={16} /></button>
                            <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDeleteProduct(product.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="admin-section glass-card">
                <h2>Quản Lý Đơn Hàng</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã ĐH</th>
                      <th>Khách hàng</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Ngày đặt</th>
                      <th>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan="5" style={{textAlign:'center'}}>Chưa có đơn hàng nào.</td></tr>
                    ) : orders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id.substring(0,8)}</td>
                        <td>{order.user?.display_name || 'Khách'}</td>
                        <td>{formatPrice(order.total_amount)}</td>
                        <td>
                          <select 
                            className={`admin-status admin-status--${order.status} admin-select`}
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="shipped">Đang giao</option>
                            <option value="delivered">Đã giao</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          <button className="admin-action-btn" onClick={() => showOrderDetails(order)}>
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 4: COUPON MANAGEMENT */}
          {activeTab === 'coupons' && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="admin-section glass-card">
                <div className="admin-section__header">
                  <h2>Quản Lý Mã Giảm Giá (Coupons)</h2>
                  <button className="btn btn-primary btn--sm" onClick={() => handleOpenCouponModal()}>
                    <Plus size={16} /> Thêm Mã Giảm Giá
                  </button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã Code</th>
                      <th>Giảm giá (%)</th>
                      <th>Đã dùng / Tối đa</th>
                      <th>Ngày hết hạn</th>
                      <th>Trạng thái</th>
                      <th>Mô tả</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.length === 0 ? (
                      <tr><td colSpan="7" style={{textAlign:'center'}}>Chưa có mã giảm giá nào.</td></tr>
                    ) : coupons.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td><span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{c.discount_percent}%</span></td>
                        <td>{c.used_count} / {c.max_uses || 'Vô hạn'}</td>
                        <td>{formatDate(c.expires_at)}</td>
                        <td>
                          <span className={c.is_active ? 'coupon-active' : 'coupon-inactive'}>
                            {c.is_active ? 'Hoạt động' : 'Tắt'}
                          </span>
                        </td>
                        <td><span style={{ color: 'var(--white-60)', fontSize: 'var(--fs-xs)' }}>{c.description || 'Không có'}</span></td>
                        <td>
                          <div className="admin-table__actions">
                            <button className="admin-action-btn" onClick={() => handleOpenCouponModal(c)}><Edit2 size={16} /></button>
                            <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDeleteCoupon(c.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="admin-section glass-card">
                <h2>Quản Lý Người Dùng</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Ngày tham gia</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="5" style={{textAlign:'center'}}>Chưa có người dùng.</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} style={{ cursor: 'pointer' }} onClick={() => setUserDetailModal({ isOpen: true, user: u })}>
                        <td>{u.display_name || 'Chưa đặt tên'}</td>
                        <td>ID: {u.id.substring(0,8)}...</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className={`admin-badge admin-badge--${u.role} admin-select`}
                          >
                            <option value="customer">Customer</option>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{formatDate(u.created_at)}</td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="admin-table__actions">
                            <button className="admin-action-btn" onClick={() => setUserDetailModal({ isOpen: true, user: u })}><Eye size={16} /></button>
                            <button className="admin-action-btn admin-action-btn--danger" onClick={() => handleDeleteUser(u.id)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
          
          {/* TAB: REVIEW MANAGEMENT */}
          {activeTab === 'reviews' && (() => {
            // Tối ưu lọc mảng đánh giá: Chỉ lọc duy nhất 1 lần
            const filteredReviews = reviews.filter(r => {
              if (reviewFilterRating !== 'all' && r.rating !== parseInt(reviewFilterRating)) {
                return false;
              }
              if (reviewSearchQuery.trim() !== '') {
                const q = reviewSearchQuery.toLowerCase();
                const userName = r.profiles?.display_name?.toLowerCase() || '';
                const productName = r.products?.name?.toLowerCase() || '';
                const comment = r.comment?.toLowerCase() || '';
                return userName.includes(q) || productName.includes(q) || comment.includes(q);
              }
              return true;
            });

            // Tính toán nhanh thống kê đánh giá
            const totalReviewsCount = reviews.length;
            const avgRating = reviews.length > 0 
              ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
              : '0.0';
            const positiveReviewsCount = reviews.filter(r => r.rating >= 4).length;
            const positivePercent = reviews.length > 0 
              ? Math.round((positiveReviewsCount / reviews.length) * 100) 
              : 0;

            // Xử lý phân trang
            const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);
            const currentReviews = filteredReviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

            return (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                {/* Stats Cards cho Reviews */}
                <div className="admin-review-stats-grid">
                  <div className="admin-review-stat-card glass-card">
                    <div className="admin-review-stat-icon" style={{ background: 'rgba(0, 180, 216, 0.1)', color: 'var(--accent)' }}>
                      <Star size={22} fill="var(--accent)" />
                    </div>
                    <div className="admin-review-stat-info">
                      <h3>Tổng Đánh Giá</h3>
                      <p>{totalReviewsCount}</p>
                      <span>Từ khách hàng LHE</span>
                    </div>
                  </div>

                  <div className="admin-review-stat-card glass-card">
                    <div className="admin-review-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                      <Star size={22} fill="#F59E0B" />
                    </div>
                    <div className="admin-review-stat-info">
                      <h3>Điểm Trung Bình</h3>
                      <p>{avgRating} <span className="star-unit">★</span></p>
                      <span>Chất lượng sản phẩm</span>
                    </div>
                  </div>

                  <div className="admin-review-stat-card glass-card">
                    <div className="admin-review-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                      <Star size={22} fill="var(--success)" />
                    </div>
                    <div className="admin-review-stat-info">
                      <h3>Tích Cực (4-5★)</h3>
                      <p>{positivePercent}%</p>
                      <span>Tỷ lệ hài lòng cực cao</span>
                    </div>
                  </div>
                </div>

                <div className="admin-section glass-card">
                  <div className="admin-section__header-flex">
                    <h2>Danh Sách Đánh Giá Chi Tiết</h2>
                    <div className="admin-filters">
                      {/* Ô Tìm Kiếm */}
                      <input
                        type="text"
                        placeholder="Tìm theo sản phẩm, khách hàng..."
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        className="admin-search-input"
                      />
                      
                      {/* Bộ lọc Rating */}
                      <select
                        value={reviewFilterRating}
                        onChange={(e) => setReviewFilterRating(e.target.value)}
                        className="admin-select"
                      >
                        <option value="all">Tất cả sao</option>
                        <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                        <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                        <option value="3">⭐⭐⭐ (3 sao)</option>
                        <option value="2">⭐⭐ (2 sao)</option>
                        <option value="1">⭐ (1 sao)</option>
                      </select>
                    </div>
                  </div>

                  {reviewLoading ? (
                    <div className="admin-loading-spinner-wrapper">
                      <RefreshCw className="loading-spinner" size={24} />
                      <p>Đang tải danh sách đánh giá...</p>
                    </div>
                  ) : (
                    <>
                      <div className="admin-table-container" style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Khách hàng</th>
                              <th>Sản phẩm</th>
                              <th style={{ width: '120px' }}>Đánh giá</th>
                              <th>Nội dung nhận xét</th>
                              <th style={{ width: '150px' }}>Thời gian</th>
                              <th style={{ width: '80px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody style={{ position: 'relative' }}>
                            <AnimatePresence mode="popLayout">
                              {currentReviews.length === 0 ? (
                                <motion.tr 
                                  key="empty-reviews"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-2xl)', color: 'var(--white-40)' }}>
                                    Không tìm thấy đánh giá nào phù hợp.
                                  </td>
                                </motion.tr>
                              ) : (
                                currentReviews.map(r => (
                                  <motion.tr
                                    key={r.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12, scale: 0.96 }}
                                    transition={{ duration: 0.2 }}
                                    className="admin-review-row"
                                  >
                                    <td>
                                      <div className="admin-user-profile-flex">
                                        <div>
                                          <p className="admin-user-name-bold">{r.profiles?.display_name || 'Khách hàng LHE'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="admin-product-profile-flex">
                                        <img
                                          src={r.products?.image_url || '/images/default-product.png'}
                                          alt="Product"
                                          className="admin-product-img-small"
                                          onError={(e) => { e.target.src = '/images/default-product.png' }}
                                        />
                                        <p className="admin-product-name-bold" title={r.products?.name}>{r.products?.name || 'Sản phẩm LHE'}</p>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="admin-rating-stars-flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            size={14}
                                            fill={i < r.rating ? "#F59E0B" : "none"}
                                            stroke={i < r.rating ? "#F59E0B" : "var(--white-20)"}
                                          />
                                        ))}
                                      </div>
                                    </td>
                                    <td>
                                      <p className="admin-review-comment">{r.comment || <em style={{color:'var(--white-20)'}}>Không có nhận xét</em>}</p>
                                    </td>
                                    <td>
                                      <span className="admin-review-date">{formatDate(r.created_at)}</span>
                                    </td>
                                    <td>
                                      <div className="admin-table__actions" style={{ justifyContent: 'center' }}>
                                        <button
                                          className="admin-action-btn admin-action-btn--danger"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReview(r.id);
                                          }}
                                          title="Xóa đánh giá này"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))
                              )}
                            </AnimatePresence>
                          </tbody>
                        </table>
                      </div>

                      {/* Phân Trang Premium */}
                      {totalPages > 1 && (
                        <div className="admin-pagination-flex">
                          <button
                            className="admin-pagination-btn"
                            onClick={() => setReviewPage(p => Math.max(1, p - 1))}
                            disabled={reviewPage === 1}
                          >
                            Trước
                          </button>
                          <div className="admin-pagination-info">
                            Trang <strong>{reviewPage}</strong> / {totalPages} (Có {filteredReviews.length} đánh giá)
                          </div>
                          <button
                            className="admin-pagination-btn"
                            onClick={() => setReviewPage(p => Math.min(totalPages, p + 1))}
                            disabled={reviewPage === totalPages}
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* TAB 6 & 7: UNIMPLEMENTED PLACEHOLDERS */}
          {(activeTab === 'members' || activeTab === 'posts') && (
            <motion.div
              key="placeholders"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="admin-section glass-card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
                <LayoutDashboard size={48} style={{ color: 'var(--white-20)', marginBottom: 'var(--space-lg)' }} />
                <h2>Quản Lý {activeTab === 'members' ? 'Thành Viên' : 'Bài Viết'}</h2>
                <p style={{ color: 'var(--white-40)', marginTop: 'var(--space-md)' }}>
                  Tính năng sẽ được tích hợp trực tiếp với database Supabase ở phase sau.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Dialogs */}
      
      {/* 1. Modal Product (Create/Update) */}
      {productModal.isOpen && (
        <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setProductModal({ isOpen: false, data: null }) }}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>{productModal.data ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
            <div className="form-group">
              <label>Tên sản phẩm</label>
              <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Giá (VNĐ)</label>
              <input type="number" min="0" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tồn kho</label>
              <input type="number" min="0" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Danh mục</label>
              <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="admin-select" style={{ border: '1px solid var(--white-10)' }}>
                <option value="Áo">Áo</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="form-group">
              <label>Hình ảnh sản phẩm</label>
              <div 
                className="admin-image-dropzone"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); handleImageUpload(e) }}
                onClick={() => document.getElementById('productImageInput').click()}
              >
                <input type="file" id="productImageInput" accept="image/*" style={{display: 'none'}} onChange={handleImageUpload} />
                {imageUploading ? (
                  <div className="admin-image-placeholder">
                    <RefreshCw className="loading-spinner" size={24} />
                    <p>Đang tải ảnh lên Supabase Storage...</p>
                  </div>
                ) : productForm.image_url ? (
                  <img src={productForm.image_url} alt="preview" className="admin-image-preview" />
                ) : (
                  <div className="admin-image-placeholder">
                    <Upload size={24} />
                    <p>Kéo thả ảnh hoặc click để chọn</p>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-ghost" onClick={() => setProductModal({ isOpen: false, data: null })}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveProduct} disabled={imageUploading}>
                {imageUploading ? 'Đang lưu ảnh...' : 'Lưu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. Modal Coupon (Create/Update) */}
      {couponModal.isOpen && (
        <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCouponModal({ isOpen: false, data: null }) }}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>{couponModal.data ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</h3>
            <div className="form-group">
              <label>Mã Code (Ví dụ: TUANKITT)</label>
              <input 
                type="text" 
                value={couponForm.code} 
                onChange={e => setCouponForm({...couponForm, code: e.target.value})} 
                placeholder="Nhập mã in hoa không dấu"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div className="form-group">
              <label>Phần trăm giảm (%)</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={couponForm.discount_percent} 
                onChange={e => setCouponForm({...couponForm, discount_percent: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Giới hạn số lần sử dụng (Tùy chọn)</label>
              <input 
                type="number" 
                min="1" 
                value={couponForm.max_uses} 
                onChange={e => setCouponForm({...couponForm, max_uses: e.target.value})} 
                placeholder="Để trống nếu không giới hạn"
              />
            </div>
            <div className="form-group">
              <label>Ngày hết hạn (Tùy chọn)</label>
              <input 
                type="date" 
                value={couponForm.expires_at} 
                onChange={e => setCouponForm({...couponForm, expires_at: e.target.value})} 
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-sm) 0' }}>
              <input 
                type="checkbox" 
                id="is_active" 
                checked={couponForm.is_active} 
                onChange={e => setCouponForm({...couponForm, is_active: e.target.checked})}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>Cho phép hoạt động ngay</label>
            </div>
            <div className="form-group">
              <label>Mô tả ngắn</label>
              <input 
                type="text" 
                value={couponForm.description} 
                onChange={e => setCouponForm({...couponForm, description: e.target.value})} 
                placeholder="Ví dụ: Giảm giá đặc biệt cho tuyển thủ"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-ghost" onClick={() => setCouponModal({ isOpen: false, data: null })} disabled={couponSubmitting}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveCoupon} disabled={couponSubmitting}>
                {couponSubmitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Modal Order details */}
      {orderModal.isOpen && (
        <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setOrderModal({ isOpen: false, order: null, items: [] }) }}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>Chi tiết đơn hàng #{orderModal.order?.id?.substring(0,8)}</h3>
            <div style={{ marginBottom: 'var(--space-lg)', fontSize: 'var(--fs-sm)', color: 'var(--white-60)' }}>
              <p><strong>Khách hàng:</strong> {orderModal.order?.user?.display_name || 'Khách'}</p>
              <p><strong>SĐT:</strong> {orderModal.order?.phone || 'Không có'}</p>
              <p><strong>Địa chỉ:</strong> {orderModal.order?.shipping_address || 'Không có'}</p>
              <p><strong>Ghi chú:</strong> {orderModal.order?.notes || 'Không có'}</p>
            </div>
            <div className="admin-modal-details">
              {orderModal.items.length === 0 ? <p>Không có sản phẩm.</p> : orderModal.items.map((item, idx) => (
                <div key={idx} className="admin-modal-details-item">
                  <div>
                    <strong>{item.products?.name}</strong>
                    <div style={{ color: 'var(--white-40)', fontSize: '13px' }}>Số lượng: {item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-primary" onClick={() => setOrderModal({ isOpen: false, order: null, items: [] })}>Đóng</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. Modal User Detail */}
      {userDetailModal.isOpen && (
        <div className="admin-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setUserDetailModal({ isOpen: false, user: null }) }}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3>Thông tin người dùng</h3>
            <div className="admin-user-detail">
              <div className="admin-user-detail__avatar">
                <Users size={40} />
              </div>
              <div className="admin-user-detail__grid">
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">Tên hiển thị</span>
                  <span className="admin-user-detail__value">{userDetailModal.user?.display_name || 'Chưa cập nhật'}</span>
                </div>
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">ID</span>
                  <span className="admin-user-detail__value" style={{ fontSize: '13px', wordBreak: 'break-all' }}>{userDetailModal.user?.id}</span>
                </div>
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">Số điện thoại</span>
                  <span className="admin-user-detail__value">{userDetailModal.user?.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">Địa chỉ</span>
                  <span className="admin-user-detail__value">{userDetailModal.user?.address || 'Chưa cập nhật'}</span>
                </div>
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">Vai trò</span>
                  <span className="admin-user-detail__value">
                    <span className={`admin-badge admin-badge--${userDetailModal.user?.role}`}>{userDetailModal.user?.role}</span>
                  </span>
                </div>
                <div className="admin-user-detail__item">
                  <span className="admin-user-detail__label">Ngày tham gia</span>
                  <span className="admin-user-detail__value">{userDetailModal.user ? formatDate(userDetailModal.user.created_at) : ''}</span>
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-primary" onClick={() => setUserDetailModal({ isOpen: false, user: null })}>Đóng</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. Modal Confirm */}
      {confirmDialog.isOpen && (
        <div className="admin-confirm-overlay">
          <motion.div 
            className="admin-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p>{confirmDialog.message}</p>
            <div className="admin-confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDialog({ isOpen: false })}>Hủy</button>
              <button className="btn btn-primary" style={{ background: '#FF1744', borderColor: '#FF1744', color: 'white' }} onClick={confirmDialog.onConfirm}>Đồng ý</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 6. Modal Alert */}
      {alertDialog.isOpen && (
        <div className="admin-confirm-overlay">
          <motion.div 
            className="admin-confirm"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p>{alertDialog.message}</p>
            <div className="admin-confirm-actions">
              <button className="btn btn-primary" onClick={() => setAlertDialog({ isOpen: false, message: '' })}>Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
