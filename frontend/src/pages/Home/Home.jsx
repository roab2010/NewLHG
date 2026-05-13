import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { Crosshair, Target, Trophy, Users, ChevronRight, Gamepad2, Zap, Eye, Swords, Activity } from 'lucide-react'
import './Home.css'

/* Counter animation hook */
function useCounter(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!startOnView || !isInView) return
    let start = 0
    const step = end / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration, isInView, startOnView])

  return { count, ref }
}

/* Particle component */
function Particles() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

const games = [
  {
    name: 'Counter-Strike 2',
    tag: 'CS2',
    description: 'Chinh phục mọi map, clutch mọi round. Team LHE sẵn sàng chiến đấu.',
    icon: <Crosshair size={40} />,
    color: '#F0B232',
  },
  {
    name: 'PUBG',
    tag: 'PUBG',
    description: 'Sinh tồn là bản năng. Chiến thắng là sứ mệnh. Chicken Dinner mỗi ngày.',
    icon: <Target size={40} />,
    color: '#F2A900',
  },
  {
    name: 'Liên Minh Huyền Thoại',
    tag: 'LOL',
    description: 'Chiến thuật sắc bén, gank mọi lane. Summoner\'s Rift là sân nhà.',
    icon: <Swords size={40} />,
    color: '#0AC8B9',
  },
  {
    name: 'FIFA Online 4',
    tag: 'FO4',
    description: 'Kiểm soát thế trận, ghi bàn đẳng cấp. Đỉnh cao bóng đá ảo.',
    icon: <Activity size={40} />,
    color: '#FF3366',
  },
]

const stats = [
  { label: 'Thành Viên', value: 7, icon: <Users size={28} />, suffix: '' },
  { label: 'Trận Thắng', value: 1250, icon: <Trophy size={28} />, suffix: '+' },
  { label: 'Giải Đấu', value: 15, icon: <Gamepad2 size={28} />, suffix: '+' },
  { label: 'Giờ Luyện Tập', value: 5000, icon: <Zap size={28} />, suffix: '+' },
]

export default function Home() {
  return (
    <div className="home">
      {/* ── Hero Section ── */}
      <section className="hero">
        <Particles />
        <div className="hero__bg-image" />
        <div className="hero__overlay" />

        <div className="hero__content container">
          <motion.div
            className="hero__badge"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Zap size={14} />
            <span>GAMING TEAM SINCE 2024</span>
          </motion.div>

          <motion.div
            className="hero__logo-container"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <img src="/images/logo.png" alt="Long Hải Esports" className="hero__logo" />
            <div className="hero__logo-glow" />
          </motion.div>

          <motion.h1
            className="hero__title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            LONG HẢI
            <span className="hero__title-highlight"> ESPORTS</span>
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            Những game thủ mạnh nhất đến từ mảnh đất Long Hải
          </motion.p>

          <motion.p
            className="hero__tagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            BORN TO FIGHT
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <Link to="/members" className="btn btn-primary btn--lg">
              <Eye size={20} />
              Khám Phá Team
            </Link>
            <Link to="/shop" className="btn btn-outline btn--lg">
              Cửa Hàng
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>

        <div className="hero__scroll-indicator">
          <div className="hero__scroll-mouse">
            <div className="hero__scroll-wheel" />
          </div>
          <span>Cuộn xuống</span>
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="about section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Về Chúng Tôi</h2>
            <p className="section-subtitle">
              Đội ngũ game thủ tài năng nhất đến từ Long Hải, Bà Rịa - Vũng Tàu
            </p>
          </motion.div>

          <div className="about__grid">
            <motion.div
              className="about__text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h3>Chúng tôi là <span className="text-accent">Long Hải Esports</span></h3>
              <p>
                Được thành lập bởi những game thủ đam mê nhất tại Long Hải,
                chúng tôi không chỉ là một nhóm chơi game — chúng tôi là một gia đình.
              </p>
              <p>
                Từ những trận đấu CS:GO đầy kịch tính đến những ván PUBG sinh tồn
                đỉnh cao, Long Hải Esports luôn chiến đấu với tinh thần không bao giờ
                bỏ cuộc.
              </p>
              <p>
                Logo của chúng tôi lấy cảm hứng từ biển Long Hải — nơi chúng tôi sinh ra
                và lớn lên. Những cây súng phía sau tượng trưng cho đam mê game bắn súng
                cháy bỏng.
              </p>
              <div className="about__tags">
                <span className="about__tag"># FPS</span>
                <span className="about__tag"># TeamWork</span>
                <span className="about__tag"># LongHải</span>
                <span className="about__tag"># BornToFight</span>
              </div>
            </motion.div>

            <motion.div
              className="about__image"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="about__image-wrapper">
                <img src="/images/team.png" alt="Long Hải Esports Team" />
                <div className="about__image-border" />
                <div className="about__image-glow" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Games Section ── */}
      <section className="games section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Đấu Trường Của Chúng Tôi</h2>
            <p className="section-subtitle">
              Những tựa game mà chúng tôi chinh phục mỗi ngày
            </p>
          </motion.div>

          <div className="games__grid">
            {games.map((game, index) => (
              <motion.div
                key={game.tag}
                className="game-card glass-card"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                style={{
                  '--game-color': game.color,
                  '--game-color-shadow': `${game.color}40`
                }}
              >
                <div className="game-card__icon" style={{ color: game.color }}>
                  {game.icon}
                </div>
                <div className="game-card__tag" style={{ color: game.color }}>{game.tag}</div>
                <h3 className="game-card__name">{game.name}</h3>
                <p className="game-card__desc">{game.description}</p>
                <Link to="/stats" className="game-card__link" style={{ color: game.color }}>
                  Xem Thống Kê <ChevronRight size={16} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Counter Section ── */}
      <section className="counter section">
        <div className="counter__bg" />
        <div className="container">
          <div className="counter__grid">
            {stats.map((stat, index) => (
              <CounterCard key={stat.label} stat={stat} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta section">
        <div className="container">
          <motion.div
            className="cta__card glass-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="cta__title">Sẵn Sàng Tham Gia?</h2>
            <p className="cta__text">
              Tạo tài khoản để mua sắm merch, theo dõi thống kê và kết nối với team.
            </p>
            <div className="cta__actions">
              <Link to="/register" className="btn btn-primary btn--lg">
                Đăng Ký Ngay
              </Link>
              <Link to="/members" className="btn btn-outline btn--lg">
                Xem Thành Viên
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function CounterCard({ stat, index }) {
  const { count, ref } = useCounter(stat.value, 2000)
  return (
    <motion.div
      ref={ref}
      className="counter__card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="counter__icon">{stat.icon}</div>
      <div className="counter__value">
        {count.toLocaleString()}{stat.suffix}
      </div>
      <div className="counter__label">{stat.label}</div>
    </motion.div>
  )
}
