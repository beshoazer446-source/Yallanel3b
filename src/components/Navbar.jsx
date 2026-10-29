import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Navbar.css'

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function handleSignOut() {
    setError('')
    try {
      await signOut()
      navigate('/login')
    } catch (signOutError) {
      setError(signOutError.message || 'تعذر تسجيل الخروج.')
    }
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
          <NavLink to="/" end>الرئيسية</NavLink>
          <NavLink to="/venues">الملاعب</NavLink>
          {user && role === 'user' && <NavLink to="/my-bookings">حجوزاتي</NavLink>}
          {user && role === 'owner' && <NavLink to="/owner/dashboard">لوحة التحكم</NavLink>}
          {user && role === 'owner' && <NavLink to="/owner/bookings">حجوزات ملعبي</NavLink>}
          {user && role === 'admin' && <NavLink to="/admin/dashboard">لوحة الأدمن</NavLink>}
        </nav>

        <div className="navbar-actions">
          {loading ? null : user ? (
            <>
              <Link to="/profile" className="navbar-user">{profile?.name ?? user.email}</Link>
              {role === 'owner' && <Link to="/owner/venues/new" className="btn btn-primary">إضافة ملعب</Link>}
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
      {error && <p role="alert" style={{ color: 'var(--status-cancelled)', textAlign: 'center', padding: '4px 12px' }}>{error}</p>}
    </header>
  )
}
