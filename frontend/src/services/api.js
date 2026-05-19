import { API_URL } from '../config'
import { supabase } from './supabase'

// ── Members ──
export async function fetchMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('position_order', { ascending: true })

  if (error) throw error
  return data
}

// ── Products ──
export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ── Orders ──
export async function createOrder(orderData, token) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(orderData),
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function fetchMyOrders(token) {
  const res = await fetch(`${API_URL}/orders/my-orders`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch orders')
  return res.json()
}

// ── Posts ──
export async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(display_name, avatar_url)')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createPost(postData, token) {
  const res = await fetch(`${API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  })
  if (!res.ok) throw new Error('Failed to create post')
  return res.json()
}

// ── Game Stats ──
export async function fetchGameStats() {
  const { data, error } = await supabase
    .from('game_stats')
    .select('*, members(full_name, nickname)')
    .order('fetched_at', { ascending: false })

  if (error) throw error
  return data
}

// ── CS2 Stats (scraped from csstats.gg) ──
export async function fetchCS2Stats() {
  const res = await fetch(`${API_URL}/stats/cs2`)
  if (!res.ok) throw new Error('Failed to fetch CS2 stats')
  return res.json()
}

// ── LOL Stats (scraped from deeplol.gg) ──
export async function fetchLOLStats() {
  const res = await fetch(`${API_URL}/stats/lol`)
  if (!res.ok) throw new Error('Failed to fetch LOL stats')
  return res.json()
}

// ── Reviews ──
export async function fetchReviews(productId) {
  const res = await fetch(`${API_URL}/reviews/${productId}`)
  if (!res.ok) throw new Error('Failed to fetch reviews')
  return res.json()
}

export async function checkCanReview(productId, token) {
  const res = await fetch(`${API_URL}/reviews/${productId}/can-review`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to check review status')
  return res.json()
}

export async function submitReview(reviewData, token) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to submit review')
  }
  return res.json()
}

// ── Admin ──
export async function fetchAdminDashboard(token) {
  const res = await fetch(`${API_URL}/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch dashboard')
  return res.json()
}

export async function fetchAllUsers(token) {
  const res = await fetch(`${API_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function updateUserRole(userId, role, token) {
  const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) throw new Error('Failed to update role')
  return res.json()
}

// ── Coupons ──
export async function validateCoupon(code, token) {
  const res = await fetch(`${API_URL}/coupons/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Mã giảm giá không hợp lệ')
  }
  return res.json()
}

export async function fetchCoupons(token) {
  const res = await fetch(`${API_URL}/coupons`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch coupons')
  return res.json()
}

export async function createCoupon(couponData, token) {
  const res = await fetch(`${API_URL}/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(couponData),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to create coupon')
  }
  return res.json()
}

export async function updateCoupon(id, couponData, token) {
  const res = await fetch(`${API_URL}/coupons/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(couponData),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to update coupon')
  }
  return res.json()
}

export async function deleteCoupon(id, token) {
  const res = await fetch(`${API_URL}/coupons/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to delete coupon')
  return res.json()
}

// ── Notifications ──
export async function fetchNotifications(token) {
  const res = await fetch(`${API_URL}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export async function markNotificationRead(id, token) {
  const res = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to mark notification as read')
  return res.json()
}

export async function markAllNotificationsRead(token) {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to mark all notifications as read')
  return res.json()
}

// ── Orders (Cancel Order) ──
export async function cancelOrder(orderId, token) {
  const res = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.error || 'Failed to cancel order')
  }
  return res.json()
}

// ── Analytics (Admin) ──
export async function fetchAnalyticsRevenue(days = 30, token) {
  const res = await fetch(`${API_URL}/admin/analytics/revenue?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch revenue analytics')
  return res.json()
}

export async function fetchAnalyticsTopProducts(token) {
  const res = await fetch(`${API_URL}/admin/analytics/top-products`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch top products analytics')
  return res.json()
}

export async function fetchAnalyticsUsersGrowth(days = 30, token) {
  const res = await fetch(`${API_URL}/admin/analytics/users-growth?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch users growth analytics')
  return res.json()
}

export async function fetchAnalyticsOrdersByStatus(token) {
  const res = await fetch(`${API_URL}/admin/analytics/orders-by-status`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch orders status analytics')
  return res.json()
}

export async function updateOrderStatus(orderId, status, token) {
  const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Failed to update order status')
  return res.json()
}
