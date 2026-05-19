import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  Star,
  Info,
  Package,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import { API_URL } from '../../config'
import './NotificationBell.css'

const NOTIFICATION_ICONS = {
  order: ShoppingBag,
  review: Star,
  system: Info,
  delivery: Package,
  message: MessageSquare,
}

const NOTIFICATION_COLORS = {
  order: 'var(--success)',
  review: 'var(--info)',
  system: 'var(--warning)',
  delivery: 'var(--primary)',
  message: 'var(--accent)',
}

function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'Vừa xong'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} tuần trước`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} tháng trước`

  return `${Math.floor(months / 12)} năm trước`
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const bellRef = useRef(null)

  // Fetch notifications on mount
  const fetchNotifications = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const list = data.notifications || data || []
        setNotifications(list)
        setUnreadCount(list.filter((n) => !n.is_read).length)
      }
    } catch (err) {
      console.error('[NotificationBell] Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('[NotificationBell] Mark read error:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('[NotificationBell] Mark all read error:', err)
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      navigate(notification.link)
    }
    setOpen(false)
  }

  const toggleDropdown = () => setOpen((prev) => !prev)

  if (!user) return null

  return (
    <div className="notification-bell">
      <button
        ref={bellRef}
        className="notification-bell__trigger"
        onClick={toggleDropdown}
        aria-label="Thông báo"
      >
        <Bell size={22} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="notification-bell__badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={dropdownRef}
            className="notification-bell__dropdown glass-card"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="notification-bell__header">
              <h3 className="notification-bell__title">Thông Báo</h3>
              {unreadCount > 0 && (
                <button
                  className="notification-bell__mark-all"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} />
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="notification-bell__list">
              {loading && notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <div className="auth-form__spinner" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-bell__empty">
                  <Bell size={32} />
                  <p>Không có thông báo nào</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const type = notification.type || 'system'
                  const IconComponent = NOTIFICATION_ICONS[type] || Info
                  const iconColor = NOTIFICATION_COLORS[type] || 'var(--white-60)'

                  return (
                    <motion.button
                      key={notification.id}
                      className={`notification-bell__item ${
                        !notification.is_read
                          ? 'notification-bell__item--unread'
                          : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="notification-bell__item-icon"
                        style={{
                          color: iconColor,
                          background: `${iconColor}15`,
                        }}
                      >
                        <IconComponent size={18} />
                      </div>
                      <div className="notification-bell__item-content">
                        <span className="notification-bell__item-title">
                          {notification.title}
                        </span>
                        <span className="notification-bell__item-message">
                          {notification.message}
                        </span>
                        <span className="notification-bell__time">
                          {timeAgo(notification.created_at)}
                        </span>
                      </div>
                      {!notification.is_read && (
                        <span className="notification-bell__unread-dot" />
                      )}
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
