import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Crosshair, TrendingUp, Award, Skull, Shield, Zap, Eye, ExternalLink, RefreshCw, Target, Gamepad2 } from 'lucide-react'
import { fetchCS2Stats } from '../../services/api'
import StatsLOL from './StatsLOL'
import './Stats.css'

export default function Stats() {
  const [activeTab, setActiveTab] = useState('cs2')
  const [players, setPlayers] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [sortBy, setSortBy] = useState('kd')

  useEffect(() => {
    if (activeTab === 'cs2') {
      loadStats()
    }
  }, [activeTab])

  async function loadStats() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchCS2Stats()
      if (data && data.players) {
        setPlayers(data.players)
        setLastUpdated(data.lastUpdated)
      }
    } catch (err) {
      console.error('Failed to load CS2 stats:', err)
      setError('Không thể tải dữ liệu thống kê CS2. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const getSorted = () => {
    return [...players].sort((a, b) => {
      if (sortBy === 'kd') return (b.kd || 0) - (a.kd || 0)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'kills') return (b.kills || 0) - (a.kills || 0)
      if (sortBy === 'winRate') return (b.winRate || 0) - (a.winRate || 0)
      if (sortBy === 'hs') return (b.hsPercent || 0) - (a.hsPercent || 0)
      if (sortBy === 'adr') return (b.adr || 0) - (a.adr || 0)
      return 0
    })
  }

  const getMaxVal = (key) => Math.max(...players.map(p => p[key] || 0))

  const getRankName = (rankUrl) => {
    if (!rankUrl) return 'Unranked'
    const match = rankUrl.match(/ranks\/(\d+)\.png/)
    if (!match) return 'Unranked'
    const num = parseInt(match[1])
    const ranks = {
      0: 'Unranked', 1: 'Silver I', 2: 'Silver II', 3: 'Silver III',
      4: 'Silver IV', 5: 'Silver Elite', 6: 'Silver Elite Master',
      7: 'Gold Nova I', 8: 'Gold Nova II', 9: 'Gold Nova III',
      10: 'Gold Nova Master', 11: 'Master Guardian I', 12: 'Master Guardian II',
      13: 'Master Guardian Elite', 14: 'Distinguished Master Guardian',
      15: 'Legendary Eagle', 16: 'Legendary Eagle Master',
      17: 'Supreme Master First Class', 18: 'The Global Elite',
    }
    return ranks[num] || 'Unranked'
  }

  const renderRank = (url, bg, name, fallback = 'Unranked') => {
    if (bg) {
      return <div className="stats__premier-rank" style={{ background: bg, padding: '4px 8px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>{name}</div>
    }
    if (url && url.indexOf('ranks/0') === -1) {
      return <img src={url} alt="rank" className="stats__player-card-rank-img" title={getRankName(url)} style={{ height: '32px' }} />
    }
    return <span className="stats__value--muted">{fallback}</span>
  }

  const formatNumber = (n) => {
    if (n == null) return '—'
    return n.toLocaleString('vi-VN')
  }

  const formatTime = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="stats-page">
      <div className="stats-page__bg" />

      <section className="section" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-3xl))' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="section-title">
              <BarChart3 size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '12px' }} />
              Thống Kê Đội Tuyển
            </h1>
            <p className="section-subtitle">
              Theo dõi chỉ số phong độ thời gian thực của các thành viên Long Hải Esports
            </p>
          </motion.div>

          {/* Game Selector Tabs */}
          <div className="stats__game-tabs">
            <button 
              className={`stats__game-tab ${activeTab === 'cs2' ? 'active' : ''}`}
              onClick={() => setActiveTab('cs2')}
            >
              <Crosshair size={20} />
              Counter-Strike 2
            </button>
            <button 
              className={`stats__game-tab ${activeTab === 'lol' ? 'active' : ''}`}
              onClick={() => setActiveTab('lol')}
            >
              <Gamepad2 size={20} />
              League of Legends
            </button>
          </div>

          {activeTab === 'lol' ? (
            <StatsLOL />
          ) : (
            <>
              {loading ? (
                <div className="stats__loading">
                  <RefreshCw className="stats__loading-icon" size={40} />
                  <p>Đang tải dữ liệu thống kê CS2...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <motion.div className="stats__error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <p>{error}</p>
                      <button onClick={loadStats}>Thử lại</button>
                    </motion.div>
                  )}


          {/* Player Cards Overview */}
          <motion.div
            className="stats__cards-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {getSorted().map((player, index) => (
              <motion.div
                key={player.steamId}
                className={`stats__player-card glass-card ${selectedPlayer?.steamId === player.steamId ? 'stats__player-card--selected' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                onClick={() => setSelectedPlayer(selectedPlayer?.steamId === player.steamId ? null : player)}
                style={{ '--player-color': player.color }}
              >
                <div className="stats__player-card-accent" style={{ background: player.color }} />

                <div className="stats__player-card-header">
                  <div className="stats__player-avatar-wrap">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.playerName} className="stats__player-avatar" />
                    ) : (
                      <div className="stats__player-avatar stats__player-avatar--placeholder" style={{ borderColor: player.color }}>
                        {player.nickname[0]}
                      </div>
                    )}
                    <span className="stats__player-rank-badge">#{index + 1}</span>
                  </div>
                  
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    {renderRank(player.currentRank, player.currentRankBg, player.currentRank, "")}
                  </div>
                </div>

                <h3 className="stats__player-card-name">{player.playerName}</h3>
                <p className="stats__player-card-realname">
                  <span style={{ color: player.color }}>@{player.nickname}</span> • {player.realName}
                </p>

                <div className="stats__player-card-stats">
                  <div className="stats__mini-stat">
                    <span className="stats__mini-stat-label">K/D</span>
                    <span className="stats__mini-stat-value" style={{ color: (player.kd || 0) >= 1 ? '#22c55e' : '#ef4444' }}>
                      {player.kd?.toFixed(2) || '—'}
                    </span>
                  </div>
                  <div className="stats__mini-stat">
                    <span className="stats__mini-stat-label">Rating</span>
                    <span className="stats__mini-stat-value" style={{ color: (player.rating || 0) >= 1 ? '#22c55e' : '#f59e0b' }}>
                      {player.rating?.toFixed(2) || '—'}
                    </span>
                  </div>
                  <div className="stats__mini-stat">
                    <span className="stats__mini-stat-label">Win%</span>
                    <span className="stats__mini-stat-value">{player.winRate != null ? `${player.winRate}%` : '—'}</span>
                  </div>
                  <div className="stats__mini-stat">
                    <span className="stats__mini-stat-label">ADR</span>
                    <span className="stats__mini-stat-value">{player.adr || '—'}</span>
                  </div>
                </div>

                <div className="stats__player-card-footer">
                  <span>{formatNumber(player.played)} trận</span>
                  <a
                    href={player.csstatsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="stats__external-link"
                  >
                    <ExternalLink size={14} /> csstats.gg
                  </a>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Detailed Player View */}
          <AnimatePresence>
            {selectedPlayer && (
              <motion.div
                className="stats__detail glass-card"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="stats__detail-header">
                  <div className="stats__detail-player-info">
                    {selectedPlayer.avatar && (
                      <img src={selectedPlayer.avatar} alt="" className="stats__detail-avatar" />
                    )}
                    <div>
                      <h2 className="stats__detail-name">{selectedPlayer.playerName}</h2>
                      <p className="stats__detail-sub" style={{ color: selectedPlayer.color }}>
                        {selectedPlayer.realName} • @{selectedPlayer.nickname}
                      </p>
                    </div>
                  </div>
                  <div className="stats__detail-ranks">
                    <div className="stats__detail-rank-item">
                      <span>Rank hiện tại</span>
                      <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
                         {renderRank(selectedPlayer.currentRank, selectedPlayer.currentRankBg, selectedPlayer.currentRank, "Unranked")}
                      </div>
                    </div>
                    <div className="stats__detail-rank-item">
                      <span>Rank cao nhất</span>
                      <div style={{ height: 48, display: 'flex', alignItems: 'center' }}>
                         {renderRank(selectedPlayer.bestRank, selectedPlayer.bestRankBg, selectedPlayer.bestRank, "Unranked")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="stats__detail-grid">
                  <div className="stats__detail-block stats__detail-block--primary">
                    <TrendingUp size={20} />
                    <span className="stats__detail-block-label">K/D Ratio</span>
                    <span className="stats__detail-block-value" style={{ color: (selectedPlayer.kd || 0) >= 1 ? '#22c55e' : '#ef4444' }}>
                      {selectedPlayer.kd?.toFixed(2) || '—'}
                    </span>
                  </div>
                  <div className="stats__detail-block stats__detail-block--primary">
                    <Award size={20} />
                    <span className="stats__detail-block-label">HLTV Rating</span>
                    <span className="stats__detail-block-value" style={{ color: (selectedPlayer.rating || 0) >= 1 ? '#22c55e' : '#f59e0b' }}>
                      {selectedPlayer.rating?.toFixed(2) || '—'}
                    </span>
                  </div>
                  <div className="stats__detail-block stats__detail-block--primary">
                    <Shield size={20} />
                    <span className="stats__detail-block-label">Win Rate</span>
                    <span className="stats__detail-block-value">{selectedPlayer.winRate != null ? `${selectedPlayer.winRate}%` : '—'}</span>
                  </div>
                  <div className="stats__detail-block stats__detail-block--primary">
                    <Crosshair size={20} />
                    <span className="stats__detail-block-label">HS%</span>
                    <span className="stats__detail-block-value">{selectedPlayer.hsPercent != null ? `${selectedPlayer.hsPercent}%` : '—'}</span>
                  </div>
                  <div className="stats__detail-block stats__detail-block--primary">
                    <Zap size={20} />
                    <span className="stats__detail-block-label">ADR</span>
                    <span className="stats__detail-block-value">{selectedPlayer.adr || '—'}</span>
                  </div>
                </div>

                <div className="stats__detail-numbers">
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val">{formatNumber(selectedPlayer.kills)}</span>
                    <span className="stats__detail-num-label">Kills</span>
                  </div>
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val stats__detail-num-val--muted">{formatNumber(selectedPlayer.deaths)}</span>
                    <span className="stats__detail-num-label">Deaths</span>
                  </div>
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val">{formatNumber(selectedPlayer.assists)}</span>
                    <span className="stats__detail-num-label">Assists</span>
                  </div>
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val" style={{ color: '#f59e0b' }}>{formatNumber(selectedPlayer.headshots)}</span>
                    <span className="stats__detail-num-label">Headshots</span>
                  </div>
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val">{formatNumber(selectedPlayer.damage)}</span>
                    <span className="stats__detail-num-label">Damage</span>
                  </div>
                  <div className="stats__detail-num">
                    <span className="stats__detail-num-val stats__detail-num-val--muted">{formatNumber(selectedPlayer.rounds)}</span>
                    <span className="stats__detail-num-label">Rounds</span>
                  </div>
                </div>

                <div className="stats__detail-matches">
                  <div className="stats__match-stat">
                    <span className="stats__match-val">{formatNumber(selectedPlayer.played)}</span>
                    <span className="stats__match-label">Đã chơi</span>
                  </div>
                  <div className="stats__match-stat stats__match-stat--win">
                    <span className="stats__match-val">{formatNumber(selectedPlayer.won)}</span>
                    <span className="stats__match-label">Thắng</span>
                  </div>
                  <div className="stats__match-stat stats__match-stat--loss">
                    <span className="stats__match-val">{formatNumber(selectedPlayer.lost)}</span>
                    <span className="stats__match-label">Thua</span>
                  </div>
                  <div className="stats__match-stat">
                    <span className="stats__match-val">{formatNumber(selectedPlayer.tied)}</span>
                    <span className="stats__match-label">Hòa</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sort Controls */}
          <motion.div
            className="stats__sort-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span className="stats__sort-label">Sắp xếp theo:</span>
            {[
              { key: 'kd', label: 'K/D' },
              { key: 'rating', label: 'Rating' },
              { key: 'kills', label: 'Kills' },
              { key: 'winRate', label: 'Win%' },
              { key: 'hs', label: 'HS%' },
              { key: 'adr', label: 'ADR' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`stats__sort-btn ${sortBy === opt.key ? 'stats__sort-btn--active' : ''}`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>

          {/* Stats Table */}
          <motion.div
            className="stats__table-wrapper glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <table className="stats__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Rank</th>
                  <th><TrendingUp size={14} /> K/D</th>
                  <th><Award size={14} /> Rating</th>
                  <th><Target size={14} /> HS%</th>
                  <th><Shield size={14} /> Win%</th>
                  <th><Zap size={14} /> ADR</th>
                  <th><Skull size={14} /> Kills</th>
                  <th>Deaths</th>
                  <th>Matches</th>
                </tr>
              </thead>
              <tbody>
                {getSorted().map((player, index) => (
                  <motion.tr
                    key={player.steamId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={index === 0 ? 'stats__row--top' : ''}
                    onClick={() => setSelectedPlayer(selectedPlayer?.steamId === player.steamId ? null : player)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="stats__rank-cell">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </td>
                    <td>
                      <div className="stats__player">
                        {player.avatar ? (
                          <img src={player.avatar} alt="" className="stats__player-img" />
                        ) : (
                          <div className="stats__player-dot" style={{ background: player.color }} />
                        )}
                        <div>
                          <span className="stats__player-nick">{player.playerName}</span>
                          <span className="stats__player-real">{player.realName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {renderRank(player.currentRank, player.currentRankBg, player.currentRank, "—")}
                    </td>
                    <td className="stats__value stats__value--highlight" style={{ color: (player.kd || 0) >= 1 ? '#22c55e' : '#ef4444' }}>
                      {player.kd?.toFixed(2) || '—'}
                    </td>
                    <td className="stats__value" style={{ color: (player.rating || 0) >= 1 ? '#22c55e' : '#f59e0b' }}>
                      {player.rating?.toFixed(2) || '—'}
                    </td>
                    <td className="stats__value">{player.hsPercent != null ? `${player.hsPercent}%` : '—'}</td>
                    <td className="stats__value">{player.winRate != null ? `${player.winRate}%` : '—'}</td>
                    <td className="stats__value">{player.adr || '—'}</td>
                    <td className="stats__value">{formatNumber(player.kills)}</td>
                    <td className="stats__value stats__value--muted">{formatNumber(player.deaths)}</td>
                    <td className="stats__value stats__value--muted">{formatNumber(player.played)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* K/D Bar Chart */}
          <motion.div
            className="stats__chart glass-card"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="stats__chart-title">
              <BarChart3 size={20} />
              So sánh chỉ số
            </h3>
            <div className="stats__bars">
              {getSorted().map(player => {
                const val = player[sortBy === 'hs' ? 'hsPercent' : sortBy] || 0
                const maxVal = getMaxVal(sortBy === 'hs' ? 'hsPercent' : sortBy)
                const width = maxVal > 0 ? (val / maxVal) * 100 : 0

                return (
                  <div key={player.steamId} className="stats__bar-row">
                    <div className="stats__bar-player">
                      {player.avatar && <img src={player.avatar} alt="" className="stats__bar-avatar" />}
                      <span className="stats__bar-label">{player.playerName}</span>
                    </div>
                    <div className="stats__bar-track">
                      <motion.div
                        className="stats__bar-fill"
                        style={{ background: `linear-gradient(90deg, ${player.color}, ${player.color}88)` }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${width}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3 }}
                      />
                    </div>
                    <span className="stats__bar-value" style={{ color: player.color }}>
                      {sortBy === 'kd' || sortBy === 'rating' ? val.toFixed(2) : sortBy === 'hs' || sortBy === 'winRate' ? `${val}%` : formatNumber(val)}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <div className="stats__footer-info">
            <p className="stats__note">
              📊 Dữ liệu thật từ <a href="https://csstats.gg" target="_blank" rel="noopener noreferrer">csstats.gg</a>
              {lastUpdated && ` • Cập nhật lần cuối: ${formatTime(lastUpdated)}`}
            </p>
            <p className="stats__note stats__note--small">
              * Chế độ Competitive 5v5 • Dữ liệu có thể chưa đầy đủ nếu chưa bật match tracking
            </p>
          </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
