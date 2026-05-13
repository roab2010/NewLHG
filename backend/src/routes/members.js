import express from 'express'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// GET /api/members
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('position_order', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/members/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(404).json({ error: 'Member not found' })
  }
})

export default router
