
import "../owner-pages.css";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OwnerRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("تم تسجيل بيانات صاحب الملعب بنجاح!");
    navigate('/owner/venues/new');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card p-4 shadow w-100" style={{ maxWidth: '600px' }}>
        <h2 className="text-center mb-4" style={{ color: 'var(--green-dark)' }}>تسجيل صاحب ملعب جديد</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>الاسم الكامل</label>
            <input 
              type="text" 
              name="fullName" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>البريد الإلكتروني</label>
            <input 
              type="email" 
              name="email" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>رقم الهاتف</label>
            <input 
              type="tel" 
              name="phone" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={formData.phone} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="mb-4">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>كلمة المرور</label>
            <input 
              type="password" 
              name="password" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2"
          >
            تسجيل الحساب
          </button>
        </form>
      </div>
    </div>
  );
}
