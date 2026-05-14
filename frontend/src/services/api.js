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
