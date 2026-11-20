import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import logoImage from '../../Logo/Glossy Gold Soccer Ball Emblem.png'
import notificationImage from '../../Logo/Glossy Gold Notification Bell.png'
import moonImage from '../../Logo/Glossy Gold Moon.png'
import sunImage from '../../Logo/Glossy Gold Sun.png'
import { useAuth } from '../context/useAuth'
import './Navbar.css'

/* ---------- Dark mode ---------- */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      className="navbar-icon-btn"
      onClick={onToggle}
      aria-label={isDark ? 'التبديل للوضع الفاتح' : 'التبديل للوضع الداكن'}
      title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      <img
        src={isDark ? sunImage : moonImage}
        alt=""
        className="navbar-theme-img"
      />
    </button>
  )
}

/* ---------- Navbar ---------- */
export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, toggleTheme] = useTheme()
  const menuRef = useRef(null)

  const role = profile?.role
  const displayName = profile?.name ?? user?.email ?? ''

  // Home / Dashboard حسب الدور
  const homePath =
    role === 'owner' ? '/owner/dashboard' : role === 'admin' ? '/admin/dashboard' : '/'
  const homeLabel = role === 'owner' || role === 'admin' ? 'لوحة التحكم' : 'الرئيسية'

  // My Bookings حسب الدور
  const bookingsPath = role === 'owner' ? '/owner/bookings' : '/my-bookings'
  const bookingsLabel = role === 'owner' ? 'حجوزات ملعبي' : 'حجوزاتي'

  // اقفل الـ dropdown لما الصفحة تتغير
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // اقفل الـ dropdown لما تدوس برّاه أو تضغط Escape
  useEffect(() => {
    if (!menuOpen) return
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function handleSignOut() {
    setError('')
    setMenuOpen(false)
    try {
      await signOut()
      navigate('/login')
    } catch (signOutError) {
      setError(signOutError.message || 'تعذر تسجيل الخروج.')
    }
  }

  const isLoggedIn = !loading && !!user

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to={isLoggedIn ? homePath : '/'} className="navbar-logo">
          <img src={logoImage} alt="" className="navbar-logo-img" />
          يلا نلعب
        </Link>

        {/* Links */}
        <nav className="navbar-links">
          {isLoggedIn ? (
            <>
              <NavLink to={homePath} end>{homeLabel}</NavLink>
              <NavLink to="/venues">استكشف الملاعب</NavLink>
              {(role === 'user' || role === 'owner') && (
                <NavLink to={bookingsPath}>{bookingsLabel}</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/" end>الرئيسية</NavLink>
              <NavLink to="/venues">استكشف الملاعب</NavLink>
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          <ThemeToggle theme={theme} onToggle={toggleTheme} />

          {loading ? null : user ? (
            <>
              {role === 'owner' && (
                <Link to="/owner/venues/new" className="btn btn-primary navbar-add">
                  إضافة ملعب
                </Link>
              )}

              <Link
                to="/notifications"
                className="navbar-icon-btn"
                aria-label="الإشعارات"
                title="الإشعارات"
              >
                <img
                  src={notificationImage}
                  alt=""
                  className="navbar-notification-img"
                />
              </Link>

              {/* Profile dropdown */}
              <div className="navbar-profile" ref={menuRef}>
                <button
                  type="button"
                  className="navbar-profile-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="navbar-avatar">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="navbar-profile-name">{displayName}</span>
                  <span className="navbar-caret" aria-hidden="true">▾</span>
                </button>

                {menuOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <Link to="/profile" role="menuitem">الملف الشخصي</Link>
                    <button type="button" role="menuitem" onClick={handleSignOut}>
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">تسجيل الدخول</Link>
              <Link to="/register" className="btn btn-primary">ابدأ الآن</Link>
            </>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{ color: 'var(--status-cancelled)', textAlign: 'center', padding: '4px 12px' }}
        >
          {error}
        </p>
      )}
    </header>
  )
}
