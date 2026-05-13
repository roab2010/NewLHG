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

const dashboardStats = [
  { label: 'Người dùng', value: '156', change: '+12%', icon: <Users size={24} />, color: '#3B82F6' },
  { label: 'Đơn hàng', value: '48', change: '+8%', icon: <ShoppingBag size={24} />, color: '#10B981' },
  { label: 'Doanh thu', value: '12.5M', change: '+23%', icon: <DollarSign size={24} />, color: '#F59E0B' },
  { label: 'Sản phẩm', value: '24', change: '+3', icon: <Package size={24} />, color: '#8B5CF6' },
]

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { profile } = useAuth()

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
            {/* Stats Cards */}
            <div className="admin-stats">
              {dashboardStats.map((stat, index) => (
                <div key={stat.label} className="admin-stat-card glass-card">
                  <div className="admin-stat-card__icon" style={{ color: stat.color, background: `${stat.color}15` }}>
                    {stat.icon}
                  </div>
                  <div className="admin-stat-card__info">
                    <span className="admin-stat-card__value">{stat.value}</span>
                    <span className="admin-stat-card__label">{stat.label}</span>
                  </div>
                  <span className="admin-stat-card__change" style={{ color: '#10B981' }}>
                    <TrendingUp size={14} />
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="admin-section glass-card">
              <h2>Hoạt Động Gần Đây</h2>
              <div className="admin-activity">
                <div className="admin-activity__item">
                  <div className="admin-activity__dot" style={{ background: '#10B981' }} />
                  <div>
                    <p>Đơn hàng mới #1048 — Áo Jersey LHE 2024</p>
                    <span>2 phút trước</span>
                  </div>
                </div>
                <div className="admin-activity__item">
                  <div className="admin-activity__dot" style={{ background: '#3B82F6' }} />
                  <div>
                    <p>Người dùng mới đăng ký: gamer123@email.com</p>
                    <span>15 phút trước</span>
                  </div>
                </div>
                <div className="admin-activity__item">
                  <div className="admin-activity__dot" style={{ background: '#F59E0B' }} />
                  <div>
                    <p>NhanHoag đăng bài viết mới: "Tips CS2 cho newbie"</p>
                    <span>1 giờ trước</span>
                  </div>
                </div>
                <div className="admin-activity__item">
                  <div className="admin-activity__dot" style={{ background: '#8B5CF6' }} />
                  <div>
                    <p>Sản phẩm mới thêm: Mousepad LHE V2</p>
                    <span>3 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
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
                  <tr>
                    <td>Áo Jersey LHE 2024</td>
                    <td><span className="admin-badge">Áo</span></td>
                    <td>450,000₫</td>
                    <td>25</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn"><Eye size={16} /></button>
                        <button className="admin-action-btn"><Edit2 size={16} /></button>
                        <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Mousepad LHE XL</td>
                    <td><span className="admin-badge">Phụ kiện</span></td>
                    <td>250,000₫</td>
                    <td>50</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn"><Eye size={16} /></button>
                        <button className="admin-action-btn"><Edit2 size={16} /></button>
                        <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Hoodie LHE Limited</td>
                    <td><span className="admin-badge">Áo</span></td>
                    <td>550,000₫</td>
                    <td>10</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn"><Eye size={16} /></button>
                        <button className="admin-action-btn"><Edit2 size={16} /></button>
                        <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
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
                  <tr>
                    <td>#1048</td>
                    <td>gamer123</td>
                    <td>450,000₫</td>
                    <td><span className="admin-status admin-status--pending">Chờ xử lý</span></td>
                    <td>12/05/2026</td>
                  </tr>
                  <tr>
                    <td>#1047</td>
                    <td>player_x</td>
                    <td>710,000₫</td>
                    <td><span className="admin-status admin-status--confirmed">Đã xác nhận</span></td>
                    <td>11/05/2026</td>
                  </tr>
                  <tr>
                    <td>#1046</td>
                    <td>noob2pro</td>
                    <td>200,000₫</td>
                    <td><span className="admin-status admin-status--delivered">Đã giao</span></td>
                    <td>10/05/2026</td>
                  </tr>
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
                  <tr>
                    <td>Admin LHE</td>
                    <td>admin@lhe.vn</td>
                    <td><span className="admin-badge admin-badge--admin">Admin</span></td>
                    <td>01/01/2024</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn"><Edit2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>gamer123</td>
                    <td>gamer@email.com</td>
                    <td><span className="admin-badge admin-badge--customer">Customer</span></td>
                    <td>05/05/2026</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn"><Edit2 size={16} /></button>
                        <button className="admin-action-btn admin-action-btn--danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
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
