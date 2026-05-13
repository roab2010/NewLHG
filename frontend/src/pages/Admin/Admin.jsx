import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingBag, Users, FileText,
  Plus, Edit2, Trash2, Eye, TrendingUp, DollarSign, UserCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './Admin.css'

const sidebarItems = [
  { key: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
  { key: 'products', label: 'Sản Phẩm', icon: <Package size={20} /> },
  { key: 'orders', label: 'Đơn Hàng', icon: <ShoppingBag size={20} /> },
  { key: 'users', label: 'Người Dùng', icon: <Users size={20} /> },
  { key: 'members', label: 'Thành Viên', icon: <UserCheck size={20} /> },
  { key: 'posts', label: 'Bài Viết', icon: <FileText size={20} /> },
]

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { profile } = useAuth()
  
  // Data States
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, products: 0 })
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Modal States
  const [productModal, setProductModal] = useState({ isOpen: false, data: null })
  const [orderModal, setOrderModal] = useState({ isOpen: false, orderId: null, items: [] })
  
  // Form State for Product
  const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category: 'Áo' })

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
        
        // 3. Fetch Orders (Cần login admin hoặc role có quyền xem order)
        // Trong schema, Admin thấy tất cả.
        const { data: ordersData } = await supabase.from('orders').select(`
          id, total_amount, status, created_at,
          user:profiles(display_name)
        `).order('created_at', { ascending: false })
        setOrders(ordersData || [])

        // Tính toán stats
        const totalRevenue = (ordersData || [])
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
        setStats({
          users: usersData?.length || 0,
          orders: ordersData?.length || 0,
          revenue: totalRevenue,
          products: productsData?.length || 0
        })

        // Tạo Recent Activity ảo từ dữ liệu thật
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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (!error) setProducts(products.filter(p => p.id !== id))
    else alert('Lỗi khi xóa sản phẩm: ' + error.message)
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) setUsers(users.filter(u => u.id !== id))
    else alert('Lỗi khi xóa người dùng: ' + error.message)
  }

  const handleUpdateOrderStatus = async (id, newStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o))
      // Cập nhật lại doanh thu nếu chuyển thành delivered
      if (newStatus === 'delivered') {
        const o = orders.find(x => x.id === id)
        if (o) setStats(s => ({ ...s, revenue: s.revenue + Number(o.total_amount) }))
      }
    } else alert('Lỗi khi cập nhật trạng thái đơn hàng!')
  }

  const handleUpdateUserRole = async (id, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else alert('Lỗi khi cập nhật chức vụ!')
  }

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setProductForm({ name: product.name, price: product.price, stock: product.stock, category: product.category || 'Khác' })
      setProductModal({ isOpen: true, data: product })
    } else {
      setProductForm({ name: '', price: '', stock: '', category: 'Áo' })
      setProductModal({ isOpen: true, data: null })
    }
  }

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return alert('Vui lòng nhập đủ thông tin!')
    
    const productData = { 
      name: productForm.name, 
      price: Number(productForm.price), 
      stock: Number(productForm.stock), 
      category: productForm.category
    }

    if (productModal.data) {
      // Cập nhật
      const { error } = await supabase.from('products').update(productData).eq('id', productModal.data.id)
      if (!error) {
        setProducts(products.map(p => p.id === productModal.data.id ? { ...p, ...productData } : p))
        setProductModal({ isOpen: false, data: null })
      } else alert('Lỗi khi cập nhật sản phẩm!')
    } else {
      // Thêm mới
      productData.created_by = profile?.id
      const { data, error } = await supabase.from('products').insert([productData]).select()
      if (!error && data) {
        setProducts([data[0], ...products])
        setStats(s => ({ ...s, products: s.products + 1 }))
        setProductModal({ isOpen: false, data: null })
      } else alert('Lỗi khi thêm sản phẩm!')
    }
  }

  const showOrderDetails = async (orderId) => {
    const { data, error } = await supabase.from('order_items').select('quantity, price, products(name)').eq('order_id', orderId)
    if (!error && data) {
      setOrderModal({ isOpen: true, orderId, items: data })
    } else {
      alert('Không thể lấy chi tiết đơn hàng')
    }
  }

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

        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {loading ? <p>Đang tải dữ liệu...</p> : (
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

        {activeTab === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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
                    <th>Tên</th>
                    <th>Danh mục</th>
                    <th>Giá</th>
                    <th>Tồn kho</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan="5" style={{textAlign:'center'}}>Chưa có sản phẩm nào.</td></tr>
                  ) : products.map(product => (
                    <tr key={product.id}>
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

        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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
                        <button className="admin-action-btn" onClick={() => showOrderDetails(order.id)}>
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

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
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
                    <tr key={u.id}>
                      <td>{u.display_name || 'Chưa đặt tên'}</td>
                      <td>ID: {u.id.substring(0,8)}...</td>
                      <td>
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
                      <td>
                        <div className="admin-table__actions">
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

        {(activeTab === 'members' || activeTab === 'posts') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="admin-section glass-card" style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
              <LayoutDashboard size={48} style={{ color: 'var(--white-20)', marginBottom: 'var(--space-lg)' }} />
              <h2>Quản Lý {activeTab === 'members' ? 'Thành Viên' : 'Bài Viết'}</h2>
              <p style={{ color: 'var(--white-40)', marginTop: 'var(--space-md)' }}>
                Tính năng sẽ được tích hợp với database Supabase.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      {productModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setProductModal({ isOpen: false, data: null })}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{productModal.data ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
            <div className="form-group">
              <label>Tên sản phẩm</label>
              <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Giá (VNĐ)</label>
              <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Tồn kho</label>
              <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Danh mục</label>
              <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="admin-select" style={{ border: '1px solid var(--white-10)' }}>
                <option value="Áo">Áo</option>
                <option value="Phụ kiện">Phụ kiện</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="btn btn-ghost" onClick={() => setProductModal({ isOpen: false, data: null })}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveProduct}>Lưu</button>
            </div>
          </motion.div>
        </div>
      )}

      {orderModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setOrderModal({ isOpen: false, orderId: null, items: [] })}>
          <motion.div 
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Chi tiết đơn hàng #{orderModal.orderId?.substring(0,8)}</h3>
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
              <button className="btn btn-primary" onClick={() => setOrderModal({ isOpen: false, orderId: null, items: [] })}>Đóng</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
