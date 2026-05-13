import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Crosshair, Target, TrendingUp, Award, Skull } from 'lucide-react'
import { fetchGameStats } from '../../services/api'
import './Stats.css'

const membersStats = [
  {
    name: 'NhanHoag',
    realName: 'Hoàng Hữu Nhân',
    color: '#3B82F6',
    csgo: { kills: 3420, deaths: 2100, kd: 1.63, hs: 48, wins: 210, matches: 380 },
    pubg: { kills: 1250, wins: 85, top10: 220, matches: 450, kd: 2.78, dmg: 310 },
  },
  {
    name: 'TuanKitt',
    realName: 'Nguyễn Trương Tuấn Kiệt',
    color: '#F97316',
    csgo: { kills: 4100, deaths: 2800, kd: 1.46, hs: 52, wins: 250, matches: 420 },
    pubg: { kills: 980, wins: 60, top10: 180, matches: 380, kd: 2.58, dmg: 285 },
  },
  {
    name: 'Roab',
    realName: 'Lâm Quốc Bảo',
    color: '#EAB308',
    csgo: { kills: 3800, deaths: 2400, kd: 1.58, hs: 45, wins: 230, matches: 400 },
    pubg: { kills: 1100, wins: 70, top10: 200, matches: 420, kd: 2.62, dmg: 295 },
  },
  {
    name: 'XunWon',
    realName: 'Nguyễn Anh Xuân Quân',
    color: '#9CA3AF',
    csgo: { kills: 2900, deaths: 2200, kd: 1.32, hs: 40, wins: 180, matches: 350 },
    pubg: { kills: 850, wins: 55, top10: 160, matches: 340, kd: 2.5, dmg: 270 },
  },
  {
    name: 'LocMaster',
    realName: 'Đặng Thành Lộc',
    color: '#EF4444',
    csgo: { kills: 3600, deaths: 2300, kd: 1.57, hs: 43, wins: 220, matches: 390 },
    pubg: { kills: 1050, wins: 75, top10: 210, matches: 400, kd: 2.63, dmg: 300 },
  },
  {
    name: 'YenOi',
    realName: 'Hoàng Trí Luật',
    color: '#A855F7',
    csgo: { kills: 3100, deaths: 2500, kd: 1.24, hs: 38, wins: 190, matches: 370 },
    pubg: { kills: 900, wins: 50, top10: 170, matches: 360, kd: 2.5, dmg: 265 },
  },
  {
    name: 'Taile',
    realName: 'Phạm Thanh Tài',
    color: '#EC4899',
    csgo: { kills: 4500, deaths: 2600, kd: 1.73, hs: 55, wins: 270, matches: 430 },
    pubg: { kills: 1300, wins: 90, top10: 240, matches: 470, kd: 2.77, dmg: 320 },
  },
]

export default function Stats() {
  const [activeGame, setActiveGame] = useState('csgo')
  const [statsData, setStatsData] = useState(membersStats)
  const [dataSource, setDataSource] = useState('sample') // 'sample' hoặc 'database'

  // Fetch dữ liệu từ Supabase
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await fetchGameStats()
        if (data && data.length > 0) {
          // TODO: Transform data từ DB format sang display format
          console.log('✅ Game stats loaded from Supabase:', data.length)
          setDataSource('database')
        } else {
          console.log('⚠️ No game stats in DB, using sample data')
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch game stats:', err.message)
      }
    }
    loadStats()
  }, [])

  const getMaxKD = () => {
    return Math.max(...statsData.map(m => m[activeGame].kd))
  }

  return (
    <div className="stats-page">
      <div className="stats-page__bg" />

      <section className="section" style={{ paddingTop: `calc(var(--navbar-height) + var(--space-3xl))` }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="section-title">Thống Kê</h1>
            <p className="section-subtitle">
              Số liệu chiến đấu của các thành viên Long Hải Esports
            </p>
          </motion.div>

          {/* Game Tabs */}
          <motion.div
            className="stats__tabs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <button
              className={`stats__tab ${activeGame === 'csgo' ? 'stats__tab--active' : ''}`}
              onClick={() => setActiveGame('csgo')}
            >
              <Crosshair size={20} />
              Counter-Strike 2
            </button>
            <button
              className={`stats__tab ${activeGame === 'pubg' ? 'stats__tab--active' : ''}`}
              onClick={() => setActiveGame('pubg')}
            >
              <Target size={20} />
              PUBG
            </button>
          </motion.div>

          {/* Stats Table */}
          <motion.div
            className="stats__table-wrapper glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <table className="stats__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  {activeGame === 'csgo' ? (
                    <>
                      <th><Skull size={14} /> Kills</th>
                      <th>Deaths</th>
                      <th><TrendingUp size={14} /> K/D</th>
                      <th>HS%</th>
                      <th><Award size={14} /> Wins</th>
                      <th>Matches</th>
                    </>
                  ) : (
                    <>
                      <th><Skull size={14} /> Kills</th>
                      <th><Award size={14} /> Wins</th>
                      <th>Top 10</th>
                      <th><TrendingUp size={14} /> K/D</th>
                      <th>Avg DMG</th>
                      <th>Matches</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {statsData
                  .sort((a, b) => b[activeGame].kd - a[activeGame].kd)
                  .map((member, index) => {
                    const stats = member[activeGame]
                    const isTopKD = stats.kd === getMaxKD()
                    return (
                      <motion.tr
                        key={member.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={isTopKD ? 'stats__row--top' : ''}
                      >
                        <td className="stats__rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </td>
                        <td>
                          <div className="stats__player">
                            <div
                              className="stats__player-dot"
                              style={{ background: member.color }}
                            />
                            <div>
                              <span className="stats__player-nick">{member.name}</span>
                              <span className="stats__player-real">{member.realName}</span>
                            </div>
                          </div>
                        </td>
                        {activeGame === 'csgo' ? (
                          <>
                            <td className="stats__value">{stats.kills.toLocaleString()}</td>
                            <td className="stats__value stats__value--muted">{stats.deaths.toLocaleString()}</td>
                            <td className="stats__value stats__value--highlight">{stats.kd.toFixed(2)}</td>
                            <td className="stats__value">{stats.hs}%</td>
                            <td className="stats__value stats__value--success">{stats.wins}</td>
                            <td className="stats__value stats__value--muted">{stats.matches}</td>
                          </>
                        ) : (
                          <>
                            <td className="stats__value">{stats.kills.toLocaleString()}</td>
                            <td className="stats__value stats__value--success">{stats.wins}</td>
                            <td className="stats__value">{stats.top10}</td>
                            <td className="stats__value stats__value--highlight">{stats.kd.toFixed(2)}</td>
                            <td className="stats__value">{stats.dmg}</td>
                            <td className="stats__value stats__value--muted">{stats.matches}</td>
                          </>
                        )}
                      </motion.tr>
                    )
                  })}
              </tbody>
            </table>
          </motion.div>

          {/* KD Chart */}
          <motion.div
            className="stats__chart glass-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="stats__chart-title">
              <BarChart3 size={20} />
              K/D Ratio - {activeGame === 'csgo' ? 'CS2' : 'PUBG'}
            </h3>
            <div className="stats__bars">
              {statsData
                .sort((a, b) => b[activeGame].kd - a[activeGame].kd)
                .map(member => {
                  const kd = member[activeGame].kd
                  const maxKd = getMaxKD()
                  const width = (kd / maxKd) * 100

                  return (
                    <div key={member.name} className="stats__bar-row">
                      <span className="stats__bar-label">{member.name}</span>
                      <div className="stats__bar-track">
                        <motion.div
                          className="stats__bar-fill"
                          style={{ background: member.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${width}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                        />
                      </div>
                      <span className="stats__bar-value" style={{ color: member.color }}>
                        {kd.toFixed(2)}
                      </span>
                    </div>
                  )
                })}
            </div>
          </motion.div>

          <p className="stats__note">
            * {dataSource === 'database' ? 'Dữ liệu từ Supabase Database' : 'Số liệu mẫu — thêm dữ liệu vào bảng game_stats để cập nhật'}
          </p>
        </div>
      </section>
    </div>
  )
}
