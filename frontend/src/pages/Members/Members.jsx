import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { fetchMembers } from '../../services/api'
import { FaInstagram } from 'react-icons/fa'
import './Members.css'

const igMap = {
  'NhanHoag': 'https://www.instagram.com/n.hoang2312/?hl=en',
  'TuanKitt': 'https://www.instagram.com/ngtrgtnkt/?hl=en',
  'Roab': 'https://www.instagram.com/bao.r_2010/?hl=en',
  'XunWon': 'https://www.instagram/_xun.won/?hl=en',
  'LocMaster': 'https://www.instagram.com/thanh.loc_1411/?hl=en',
  'YenOi': 'https://www.instagram.com/hoang.luat.54922/?hl=en',
  'Taile': 'https://www.instagram.com/thtai_12/?hl=en'
}

// Vùng hover trên ảnh team (phụ thuộc vào bố cục ảnh, không lưu DB)
const clipAreaMap = {
  'NhanHoag': { top: 0, left: 0, width: 25, height: 55 },
  'TuanKitt': { top: 0, left: 22, width: 25, height: 55 },
  'Roab':     { top: 0, left: 45, width: 25, height: 55 },
  'XunWon':   { top: 0, left: 68, width: 32, height: 55 },
  'LocMaster':{ top: 40, left: 0, width: 33, height: 60 },
  'YenOi':    { top: 40, left: 28, width: 34, height: 60 },
  'Taile':    { top: 40, left: 60, width: 40, height: 60 },
}

// Dữ liệu mẫu dùng khi chưa có dữ liệu từ DB
const fallbackMembers = [
  { id: 1, full_name: 'Hoàng Hữu Nhân', nickname: 'NhanHoag', date_of_birth: '2004-12-23', hidden_stat: 'Quan Sát', signature_color: '#3B82F6', role_in_team: 'Scout' },
  { id: 2, full_name: 'Nguyễn Trương Tuấn Kiệt', nickname: 'TuanKitt', date_of_birth: '2004-09-14', hidden_stat: 'Đột Biến', signature_color: '#F97316', role_in_team: 'Entry Fragger' },
  { id: 3, full_name: 'Lâm Quốc Bảo', nickname: 'Roab', date_of_birth: '2004-10-20', hidden_stat: 'Tốc Độ', signature_color: '#EAB308', role_in_team: 'Rifler' },
  { id: 4, full_name: 'Nguyễn Anh Xuân Quân', nickname: 'XunWon', date_of_birth: '2006-04-24', hidden_stat: 'Phản Xạ', signature_color: '#9CA3AF', role_in_team: 'Support' },
  { id: 5, full_name: 'Đặng Thành Lộc', nickname: 'LocMaster', date_of_birth: '2004-11-14', hidden_stat: 'Phân Tích', signature_color: '#EF4444', role_in_team: 'IGL / Analyst' },
  { id: 6, full_name: 'Hoàng Trí Luật', nickname: 'YenOi', date_of_birth: '2004-01-01', hidden_stat: 'Phán Đoán', signature_color: '#A855F7', role_in_team: 'Lurker' },
  { id: 7, full_name: 'Phạm Thanh Tài', nickname: 'Taile', date_of_birth: '2004-06-12', hidden_stat: 'Rình Ai Tắm', signature_color: '#EC4899', role_in_team: 'AWPer' },
]

// Format ngày sinh từ ISO string
function formatDOB(dateStr) {
  if (!dateStr) return '??/??/????'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// Map dữ liệu DB sang format hiển thị
function mapMember(m) {
  return {
    id: m.id,
    name: m.full_name,
    nickname: m.nickname,
    dob: formatDOB(m.date_of_birth),
    hiddenStat: m.hidden_stat,
    color: m.signature_color,
    role: m.role_in_team,
    avatarUrl: m.avatar_url,
    igLink: igMap[m.nickname] || '#',
    clipArea: clipAreaMap[m.nickname] || { top: 0, left: 0, width: 14, height: 50 },
  }
}

export default function Members() {
  const [members, setMembers] = useState(fallbackMembers.map(mapMember))
  const [loading, setLoading] = useState(true)
  const [hoveredMember, setHoveredMember] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Fetch dữ liệu từ Supabase
  useEffect(() => {
    async function loadMembers() {
      try {
        const data = await fetchMembers()
        if (data && data.length > 0) {
          setMembers(data.map(mapMember))
          console.log('✅ Members loaded from Supabase:', data.length)
        } else {
          console.log('⚠️ No members in DB, using fallback data')
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch from Supabase, using fallback:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  const handleMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div className="members-page">
      {/* Background effects */}
      <div className="members-page__bg" />

      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="section-title">Thành Viên</h1>
            <p className="section-subtitle">
              7 game thủ mạnh nhất đến từ Long Hải — hover vào từng người để khám phá
            </p>
          </motion.div>

          {/* Team Photo with hover overlay */}
          <motion.div
            className="team-photo-container"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Base team image */}
            <img
              src="/images/team.png"
              alt="Long Hải Esports Team"
              className="team-photo"
            />

            {/* Hover zones for each member */}
            {members.map(member => (
              <div
                key={member.id}
                className={`member-zone ${hoveredMember?.id === member.id ? 'member-zone--active' : ''}`}
                style={{
                  top: `${member.clipArea.top}%`,
                  left: `${member.clipArea.left}%`,
                  width: `${member.clipArea.width}%`,
                  height: `${member.clipArea.height}%`,
                }}
                onMouseEnter={() => setHoveredMember(member)}
                onMouseLeave={() => setHoveredMember(null)}
              >
              </div>
            ))}

            {/* Floating tooltip card */}
            {hoveredMember && (
              <div
                className="member-tooltip"
                style={{
                  left: `${Math.min(tooltipPos.x + 20, containerRef.current?.offsetWidth - 280)}px`,
                  top: `${Math.max(tooltipPos.y - 100, 10)}px`,
                  '--member-color': hoveredMember.color,
                }}
              >
                <div className="member-tooltip__hidden-stat">
                  <span className="member-tooltip__stat-label">CHỈ SỐ ẨN</span>
                  <span
                    className="member-tooltip__stat-value"
                    style={{ color: hoveredMember.color }}
                  >
                    {hoveredMember.hiddenStat}
                  </span>
                </div>
                <div className="member-tooltip__divider" style={{ background: hoveredMember.color }} />
                <h3 className="member-tooltip__name">{hoveredMember.name}</h3>
                <div className="member-tooltip__nickname">
                  <span className="member-tooltip__tag" style={{ borderColor: hoveredMember.color, color: hoveredMember.color }}>
                    {hoveredMember.nickname}
                  </span>
                </div>
                <div className="member-tooltip__info">
                  <span>🎂 {hoveredMember.dob}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Member Cards Grid (alternative view below) */}
          <motion.div
            className="members-grid"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="section-title" style={{ marginTop: 'var(--space-4xl)' }}>Đội Hình</h2>
            <p className="section-subtitle">Thông tin chi tiết từng thành viên</p>
            
            <div className="members-cards">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  className="member-card glass-card"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  style={{ '--card-color': member.color }}
                >
                  <div className="member-card__accent" style={{ background: member.color }} />
                  <div className="member-card__header">
                    <div className="member-card__avatar" style={{ borderColor: member.color }}>
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} />
                      ) : (
                        <span style={{ color: member.color }}>{member.nickname[0]}</span>
                      )}
                    </div>
                    <div className="member-card__stat-badge" style={{ background: `${member.color}20`, color: member.color }}>
                      {member.hiddenStat}
                    </div>
                  </div>
                  <h3 className="member-card__name">{member.name}</h3>
                  <div className="member-card__nickname-wrap">
                    <p className="member-card__nickname" style={{ color: member.color }}>@{member.nickname}</p>
                    <a href={member.igLink} target="_blank" rel="noopener noreferrer" className="member-card__ig" style={{ color: member.color }}>
                      <FaInstagram />
                    </a>
                  </div>
                  <div className="member-card__details">
                    <span>🎂 {member.dob}</span>
                  </div>
                  <div className="member-card__glow" style={{ background: `radial-gradient(circle at bottom, ${member.color}15, transparent 70%)` }} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
