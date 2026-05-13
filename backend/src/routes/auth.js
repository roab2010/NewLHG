import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    })

    if (error) throw error

    // Create profile
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name: displayName,
      role: 'customer',
    })

    res.status(201).json({ message: 'Đăng ký thành công', user: data.user })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    res.json({
      message: 'Đăng nhập thành công',
      session: data.session,
      user: data.user,
    })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token' })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error) throw error

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    res.json({ user, profile })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

export default router
