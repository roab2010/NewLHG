import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, TrendingUp, Shield, RefreshCw, Trophy, Target } from 'lucide-react'
import { fetchLOLStats } from '../../services/api'
import './Stats.css'

export default function StatsLOL() {
  const [players, setPlayers] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [sortBy, setSortBy] = useState('soloRank')

  const getRankScore = (rankStr, lpStr) => {
    if (!rankStr || rankStr === 'Unranked') return 0;
    
    const tiers = {
      'IRON': 1000,
      'BRONZE': 2000,
      'SILVER': 3000,
      'GOLD': 4000,
      'PLATINUM': 5000,
      'EMERALD': 6000,
      'DIAMOND': 7000,
      'MASTER': 8000,
      'GRANDMASTER': 9000,
      'CHALLENGER': 10000
    };
    
    const parts = rankStr.toUpperCase().split(' ');
    const tier = parts[0];
    const division = parts[1] ? parseInt(parts[1]) : 4;
    
    const tierScore = tiers[tier] || 0;
    const divisionScore = (5 - division) * 100;
    const lp = parseInt((lpStr || '0').replace(/\D/g, '')) || 0;
    
    return tierScore + divisionScore + lp;
  }

  const getRankIconUrl = (rankStr) => {
    if (!rankStr || rankStr === 'Unranked') return 'https://www.deeplol.gg/images/Emblem_UNRANKED.png';
    const tier = rankStr.split(' ')[0].toUpperCase();
    return `https://www.deeplol.gg/images/Emblem_${tier}.png`;
  }

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchLOLStats()
      if (data && data.length > 0) {
        // Find latest updated time
        const latestTime = new Date(Math.max(...data.map(e => new Date(e.updatedAt))));
        setLastUpdated(latestTime.toISOString())

        const memberInfo = {
          'NhanHoang': { color: '#3b82f6' },
          'KietHoang': { color: '#eab308' },
          'Tai': { color: '#10b981' },
          'Luat': { color: '#ec4899' },
          'Bao': { color: '#f97316' },
          'Quan': { color: '#8b5cf6' },
          'Loc': { color: '#14b8a6' }
        }

        const formattedPlayers = data.map(p => {
          const info = memberInfo[p.nickname] || { color: '#ffffff' }
          // extract numeric value for sorting
          const kdaNum = parseFloat(p.kda) || 0;
          const winRateNum = parseInt(p.winRate) || 0;
          const soloLPNum = parseInt((p.soloLP || '0').replace(/\D/g, '')) || 0;
          const flexLPNum = parseInt((p.flexLP || '0').replace(/\D/g, '')) || 0;
          
          const soloRankScore = getRankScore(p.soloRank, p.soloLP);
          const flexRankScore = getRankScore(p.flexRank, p.flexLP);

          return {
            ...p,
            playerName: p.nickname,
            color: info.color,
            kdaNum,
            winRateNum,
            soloLPNum,
            flexLPNum,
            soloRankScore,
            flexRankScore
          }
        })
        setPlayers(formattedPlayers)
      }
    } catch (err) {
      console.error('Failed to load LOL stats:', err)
      setError('Không thể tải dữ liệu thống kê LOL. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const getSorted = () => {
    return [...players].sort((a, b) => {
      if (sortBy === 'kda') return b.kdaNum - a.kdaNum
      if (sortBy === 'winRate') return b.winRateNum - a.winRateNum
      if (sortBy === 'matches') return b.matchesPlayed - a.matchesPlayed
      if (sortBy === 'soloRank') return b.soloRankScore - a.soloRankScore
      return 0
    })
  }

  const getMaxVal = (key) => Math.max(...players.map(p => p[key] || 0))

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

  // Get deep.lol url
  const getDeeplolUrl = (nickname) => {
    const urls = {
        'NhanHoang': 'https://www.deeplol.gg/summoner/vn/doanh%20hyy-1405',
        'KietHoang': 'https://www.deeplol.gg/summoner/vn/YoneMin999-999',
        'Tai': 'https://www.deeplol.gg/summoner/vn/TALE12-2640',
        'Luat': 'https://www.deeplol.gg/summoner/vn/Tr%E1%BA%A3m%20T%C3%ACnh-adc',
        'Bao': 'https://www.deeplol.gg/summoner/vn/Young%20B-2010',
        'Quan': 'https://www.deeplol.gg/summoner/vn/Xun%20Won%20T%E1%BB%9Bi%20Ch%C6%A1i-2404',
        'Loc': 'https://www.deeplol.gg/summoner/vn/LHE%20Shadow-2010'
    };
    return urls[nickname] || '#';
  }

  if (loading) {
    return (
      <div className="stats__loading" style={{ marginTop: '50px' }}>
        <RefreshCw className="stats__loading-icon" size={40} />
        <p>Đang tải dữ liệu thống kê LOL...</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '20px' }}>
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
            key={player.nickname}
            className={`stats__player-card glass-card ${selectedPlayer?.nickname === player.nickname ? 'stats__player-card--selected' : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            onClick={() => setSelectedPlayer(selectedPlayer?.nickname === player.nickname ? null : player)}
            style={{ '--player-color': player.color }}
          >
            <div className="stats__player-card-accent" style={{ background: player.color }} />

            <div className="stats__player-card-header">
              <div className="stats__player-avatar-wrap">
                {player.profileIcon ? (
                  <img src={player.profileIcon} alt={player.playerName} className="stats__player-avatar" style={{ borderColor: player.color, objectFit: 'cover' }} />
                ) : (
                  <div className="stats__player-avatar stats__player-avatar--placeholder" style={{ borderColor: player.color }}>
                    {player.playerName[0]}
                  </div>
                )}
                <span className="stats__player-rank-badge">#{index + 1}</span>
              </div>
              
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                 <div className="stats__rank-tag" style={{ background: '#3b82f6', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '10px' }}>
                   S: {player.soloRank}
                 </div>
                 <div className="stats__rank-tag" style={{ background: '#10b981', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontWeight: 'bold', fontSize: '10px' }}>
                   F: {player.flexRank}
                 </div>
              </div>
            </div>

            <h3 className="stats__player-card-name">{player.playerName}</h3>
            <p className="stats__player-card-realname">
              <span style={{ color: player.color }}>@{player.nickname}</span>
            </p>

            <div className="stats__player-card-stats">
              <div className="stats__mini-stat">
                <span className="stats__mini-stat-label">KDA</span>
                <span className="stats__mini-stat-value" style={{ color: player.kdaNum >= 2.5 ? '#22c55e' : '#ef4444' }}>
                  {player.kda}
                </span>
              </div>
              <div className="stats__mini-stat">
                <span className="stats__mini-stat-label">Win%</span>
                <span className="stats__mini-stat-value" style={{ color: player.winRateNum >= 50 ? '#22c55e' : '#f59e0b' }}>
                  {player.winRate}
                </span>
              </div>
              <div className="stats__mini-stat">
                <span className="stats__mini-stat-label">LP</span>
                <span className="stats__mini-stat-value">{player.lp}</span>
              </div>
            </div>

            <div className="stats__player-card-footer">
              <span>{formatNumber(player.matchesPlayed)} trận</span>
              <a
                href={getDeeplolUrl(player.nickname)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="stats__external-link"
              >
                deeplol.gg
              </a>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Sort Controls */}
      <motion.div
        className="stats__sort-controls"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{ marginTop: '40px' }}
      >
        <span className="stats__sort-label">Sắp xếp theo:</span>
        {[
          { key: 'soloRank', label: 'Solo Rank' },
          { key: 'kda', label: 'KDA' },
          { key: 'winRate', label: 'Win Rate' },
          { key: 'matches', label: 'Matches' },
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
              <th>Solo Rank</th>
              <th>Flex Rank</th>
              <th><TrendingUp size={14} /> KDA</th>
              <th><Shield size={14} /> Win Rate</th>
              <th><Target size={14} /> Matches</th>
            </tr>
          </thead>
          <tbody>
            {getSorted().map((player, index) => (
              <motion.tr
                key={player.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={index === 0 ? 'stats__row--top' : ''}
              >
                <td className="stats__rank-cell">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                </td>
                <td>
                  <div className="stats__player">
                    <div className="stats__player-dot" style={{ background: player.color }} />
                    <div>
                      <span className="stats__player-nick">{player.playerName}</span>
                      <span className="stats__player-real">@{player.nickname}</span>
                    </div>
                  </div>
                </td>
                <td className="stats__value">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img src={getRankIconUrl(player.soloRank)} width="24" height="24" alt={player.soloRank} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px' }}>{player.soloRank}</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>{player.soloLP}</div>
                    </div>
                  </div>
                </td>
                <td className="stats__value">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img src={getRankIconUrl(player.flexRank)} width="24" height="24" alt={player.flexRank} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '13px' }}>{player.flexRank}</div>
                      <div style={{ fontSize: '11px', opacity: 0.7 }}>{player.flexLP}</div>
                    </div>
                  </div>
                </td>
                <td className="stats__value stats__value--highlight" style={{ color: player.kdaNum >= 2.5 ? '#22c55e' : '#ef4444' }}>
                  {player.kda}
                </td>
                <td className="stats__value" style={{ color: player.winRateNum >= 50 ? '#22c55e' : '#f59e0b' }}>
                  {player.winRate}
                </td>
                <td className="stats__value">{formatNumber(player.matchesPlayed)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Bar Chart */}
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
            const val = player[`${sortBy}Num`] || player.matchesPlayed || 0
            const maxVal = getMaxVal(`${sortBy}Num`) || getMaxVal('matchesPlayed')
            const width = maxVal > 0 ? (val / maxVal) * 100 : 0

            return (
              <div key={player.nickname} className="stats__bar-row">
                <div className="stats__bar-player">
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
                  {sortBy === 'kda' ? player.kda : sortBy === 'winRate' ? player.winRate : val}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      <div className="stats__footer-info">
        <p className="stats__note">
          📊 Dữ liệu thật từ <a href="https://deeplol.gg" target="_blank" rel="noopener noreferrer">deeplol.gg</a>
          {lastUpdated && ` • Cập nhật lần cuối: ${formatTime(lastUpdated)}`}
        </p>
      </div>
    </div>
  )
}
