import express from 'express'
import { supabase } from '../config/supabase.js'
import fs from 'fs'
import path from 'path'

const router = express.Router()

// GET /api/stats/cs2 — Get cached CS2 stats from scraped data
router.get('/cs2', async (req, res) => {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'cs2stats.json')
    console.log('📂 Looking for CS2 stats at:', dataPath)

    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ error: 'CS2 stats not available. Run the scraper first.' })
    }

    const raw = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(raw)
    res.json(data)
  } catch (error) {
    console.error('Error reading CS2 stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/stats/all — Get all cached stats for all members (legacy)
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*, members(full_name, nickname)')
      .order('fetched_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/stats/:game/:memberNickname — Get stats for specific member + game
router.get('/:game/:nickname', async (req, res) => {
  try {
    const { game, nickname } = req.params

    // Find member
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('nickname', nickname)
      .single()

    if (!member) {
      return res.status(404).json({ error: 'Member not found' })
    }

    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('member_id', member.id)
      .eq('game', game)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(404).json({ error: 'Stats not found' })
  }
})

export default router
