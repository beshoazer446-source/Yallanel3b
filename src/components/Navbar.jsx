import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const role = profile?.role

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-mark" />
          يلا نلعب
        </Link>

        <nav className="navbar-links">
          <NavLink to="/venues">الملاعب</NavLink>
          {user && role === 'user' && <NavLink to="/my-bookings">حجوزاتي</NavLink>}
          {user && role === 'owner' && <NavLink to="/owner/dashboard">لوحة التحكم</NavLink>}
          {user && role === 'owner' && <NavLink to="/owner/bookings">حجوزات ملعبي</NavLink>}
          {user && role === 'admin' && <NavLink to="/admin/dashboard">لوحة الأدمن</NavLink>}
        </nav>

        <div className="navbar-actions">
          {loading ? null : user ? (
            <>
              <span className="navbar-user">{profile?.name ?? user.email}</span>
              <button className="btn btn-outline" onClick={handleSignOut}>
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">تسجيل الدخول</Link>
              <Link to="/register" className="btn btn-primary">إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
