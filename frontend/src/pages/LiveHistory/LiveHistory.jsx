import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import './LiveHistory.css'

// Component LazyYoutube: Cơ chế thông minh - Load hqdefault trước cho an toàn, sau đó nâng cấp lên maxresdefault nếu có bản HD thật
const LazyYoutube = ({ videoId, title, start }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [thumbSrc, setThumbSrc] = useState(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
  const videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1${start ? `&start=${start}` : ''}`

  useEffect(() => {
    // Bắt đầu bằng bản hqdefault để đảm bảo luôn có hình
    setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)

    // Thử load bản HD ở chế độ ngầm
    const img = new Image()
    img.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    img.onload = () => {
      // Youtube trả về ảnh placeholder xám (width=120) nếu ko có bản HD.
      // Nếu img.width > 120 tức là bản HD xịn -> Cập nhật ngay cho nét căng.
      if (img.width > 120) {
        setThumbSrc(img.src)
      }
    }
  }, [videoId])

  return (
    <div className="lazy-youtube" onClick={() => setIsPlaying(true)}>
      {!isPlaying ? (
        <>
          <img 
            src={thumbSrc} 
            alt={title} 
            className="lazy-youtube__img" 
          />
          <div className="lazy-youtube__play-btn">
            <svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%">
              <path className="lazy-youtube__play-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#f00"></path>
              <path d="M 45,24 27,14 27,34" fill="#fff"></path>
            </svg>
          </div>
        </>
      ) : (
        <iframe 
          src={videoUrl} 
          title={title} 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      )}
    </div>
  )
}

export default function LiveHistory() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const channelId = 'UCPmpK4CnfdeRWQGUvYeLGsQ' // Channel ID của @sae.1405

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        const data = await response.json()
        
        if (data.status === 'ok' && data.items) {
          const parsedVideos = data.items.map(item => {
            const videoId = item.link.split('v=')[1]
            return {
              id: videoId,
              title: item.title,
              pubDate: new Date(item.pubDate).toLocaleDateString('vi-VN')
            }
          })
          setVideos(parsedVideos)
        }
      } catch (error) {
        console.error('Error fetching YouTube videos:', error)
        // Fallback
        setVideos([
          { id: 'fGs9yj6Vr7o', title: 'Livestream History 1', pubDate: '15/05/2026' },
          { id: 'jJ4DN6GMyGM', title: 'Livestream History 2', pubDate: '14/05/2026' },
          { id: 'p7i_zmTuc2o', title: 'Livestream History 3', pubDate: '13/05/2026' },
          { id: '3zNgnGxZcOI', title: 'Livestream History 4', pubDate: '12/05/2026' },
          { id: 'fGs9yj6Vr7o', title: 'Livestream History 5', pubDate: '11/05/2026' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [])

  if (loading) {
    return (
      <div className="live-history-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Hoán đổi vị trí của video 0 và video 1 theo yêu cầu
  let displayVideos = [...videos]
  if (displayVideos.length >= 2) {
    const temp = displayVideos[0]
    displayVideos[0] = displayVideos[1]
    displayVideos[1] = temp
  }

  const mainVideo = displayVideos.length > 0 ? displayVideos[0] : null
  
  // 4 video bên phải (hardcode từ kênh @longhaiesport)
  const topSmallVideos = [
    { id: 'fGs9yj6Vr7o', title: 'Highlight Long Hải Esports 1' },
    { id: 'jJ4DN6GMyGM?start=252', title: 'Highlight Long Hải Esports 2' },
    { id: 'p7i_zmTuc2o?start=3', title: 'Highlight Long Hải Esports 3' },
    { id: '3zNgnGxZcOI?start=260', title: 'Highlight Long Hải Esports 4' }
  ]

  // Các video cũ ở dưới (từ kênh @sae.1405, lấy sau video mới nhất)
  const previousVideos = displayVideos.slice(1)

  return (
    <div className="live-history-page">
      <div className="live-history-page__bg" />
      
      <section className="section" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-3xl))' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="section-title">
              Livestream History
            </h1>
            <p className="section-subtitle">
              Theo dõi trực tiếp và xem lại các video mới nhất từ kênh Long Hải Esports
            </p>
          </motion.div>

          {mainVideo && (
            <motion.div
              className="live__highlight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="live__grid">
                <div className="live__main">
                  <LazyYoutube videoId={mainVideo.id} title={mainVideo.title} />
                </div>
                {topSmallVideos.map((video, index) => {
                  const videoId = video.id.split('?')[0]
                  const startParam = video.id.includes('start=') ? video.id.split('start=')[1] : null
                  return (
                    <div className="live__item" key={index}>
                      <LazyYoutube videoId={videoId} title={video.title} start={startParam} />
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Previous Videos Section */}
          {previousVideos.length > 0 && (
            <motion.div
              className="live__previous-section"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="live__section-header">
                <h2>CÁC LIVESTREAM KHÁC</h2>
                <a href="https://www.youtube.com/@sae.1405/streams" target="_blank" rel="noopener noreferrer" className="live__view-all">
                  XEM TẤT CẢ TRÊN YOUTUBE →
                </a>
              </div>

              <div className="live__previous-grid">
                {previousVideos.map((video, index) => (
                  <div className="live__previous-item" key={index}>
                    <div className="live__video-wrapper">
                      <LazyYoutube videoId={video.id} title={video.title} />
                    </div>
                    <div className="live__video-info">
                      <span className="live__video-tag">{video.pubDate}</span>
                      <h3 className="live__video-title">{video.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </section>
    </div>
  )
}
