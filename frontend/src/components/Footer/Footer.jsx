import { Link } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'
import { FaFacebook, FaYoutube, FaDiscord } from 'react-icons/fa'
import './Footer.css'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer__glow"></div>
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <img src="/images/logo.png" alt="Long Hải Esports" />
              <div>
                <h3>LONG HẢI ESPORTS</h3>
                <p>Born to Fight</p>
              </div>
            </div>
            <p className="footer__desc">
              Nhóm game thủ hàng đầu đến từ mảnh đất Long Hải. 
              Chúng tôi chinh phục mọi đấu trường từ CS:GO đến PUBG.
            </p>
          </div>

          <div className="footer__nav">
            <h4>Điều Hướng</h4>
            <ul>
              <li><Link to="/">Trang Chủ</Link></li>
              <li><Link to="/members">Thành Viên</Link></li>
              <li><Link to="/shop">Cửa Hàng</Link></li>
              <li><Link to="/stats">Thống Kê</Link></li>
            </ul>
          </div>

          <div className="footer__nav">
            <h4>Games</h4>
            <ul>
              <li><a href="https://store.steampowered.com/app/730/CounterStrike_2/" target="_blank" rel="noopener noreferrer">Counter-Strike 2</a></li>
              <li><a href="https://store.steampowered.com/app/578080/PLAYERUNKNOWNS_BATTLEGROUNDS/" target="_blank" rel="noopener noreferrer">PUBG</a></li>
              <li><a href="https://lienminh.vnggames.com/" target="_blank" rel="noopener noreferrer">Liên Minh Huyền Thoại</a></li>
              <li><a href="https://fo4.garena.vn/" target="_blank" rel="noopener noreferrer">FIFA Online 4</a></li>
            </ul>
          </div>

          <div className="footer__social">
            <h4>Kết Nối</h4>
            <div className="footer__social-links">
              <a href="https://www.facebook.com/longhaiesport" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Facebook">
                <FaFacebook size={22} />
              </a>
              <a href="https://www.youtube.com/@longhaiesport" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Youtube">
                <FaYoutube size={22} />
              </a>
              <a href="https://discord.gg/cEfJmvdrAq" target="_blank" rel="noopener noreferrer" className="footer__social-link" aria-label="Discord">
                <FaDiscord size={22} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} Long Hải Esports. All rights reserved.</p>
          <button className="footer__scroll-top" onClick={scrollToTop} aria-label="Scroll to top">
            <ChevronUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  )
}
