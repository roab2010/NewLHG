import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import memberRoutes from './routes/members.js'
import productRoutes from './routes/products.js'
import orderRoutes from './routes/orders.js'
import postRoutes from './routes/posts.js'
import statsRoutes from './routes/stats.js'
import adminRoutes from './routes/admin.js'
import reviewRoutes from './routes/reviews.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000',
    /\.vercel\.app$/ // Cho phép tất cả các domain kết thúc bằng .vercel.app
  ],
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/stats', statsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reviews', reviewRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Long Hải Esports API is running 🎮' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`🎮 Long Hải Esports API running on port ${PORT}`)
})

export default app
