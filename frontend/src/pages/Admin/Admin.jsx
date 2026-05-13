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
        const totalRevenue = (ordersData || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
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
                <button className="btn btn-primary btn--sm">
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
                          <button className="admin-action-btn"><Edit2 size={16} /></button>
                          <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
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
                        <span className={`admin-status admin-status--${order.status}`}>
                          {order.status === 'pending' ? 'Chờ xử lý' : 
                           order.status === 'confirmed' ? 'Đã xác nhận' :
                           order.status === 'shipped' ? 'Đang giao' :
                           order.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                        </span>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
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
                        <span className={`admin-badge admin-badge--${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <div className="admin-table__actions">
                          <button className="admin-action-btn"><Edit2 size={16} /></button>
                          <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
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
    </div>
  )
}
