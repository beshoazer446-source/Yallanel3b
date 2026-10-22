import "../owner-pages.css";
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AddVenue() {
  const navigate = useNavigate();
  const [venueData, setVenueData] = useState({
    name: '',
    city: '',
    address: '',
    price_per_hour: '',
    description: '',
    image_url: '',
    start_time: '08:00',
    end_time: '23:00'
  });

  const handleChange = (e) => {
    setVenueData({
      ...venueData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("تم إضافة الملعب بنجاح!");
    navigate('/owner/venues/1/edit');
  };

  return (
    <div className="container d-flex justify-content-center align-items-center py-5">
      <div className="card p-4 shadow w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-center mb-4" style={{ color: 'var(--green-dark)' }}>إضافة ملعب جديد</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>اسم الملعب</label>
            <input 
              type="text" 
              name="name" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={venueData.name} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="row mb-3" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label mb-2" style={{ fontWeight: '600' }}>المدينة</label>
              <input 
                type="text" 
                name="city" 
                className="form-control" 
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                value={venueData.city} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label mb-2" style={{ fontWeight: '600' }}>السعر لكل ساعة (جنيه)</label>
              <input 
                type="number" 
                name="price_per_hour" 
                className="form-control" 
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                value={venueData.price_per_hour} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>العنوان بالتفصيل</label>
            <input 
              type="text" 
              name="address" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={venueData.address} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="row mb-3" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label mb-2" style={{ fontWeight: '600' }}>وقت الفتح (start_time)</label>
              <input 
                type="text" 
                name="start_time" 
                className="form-control" 
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                value={venueData.start_time} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label mb-2" style={{ fontWeight: '600' }}>وقت الإغلاق (end_time)</label>
              <input 
                type="text" 
                name="end_time" 
                className="form-control" 
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                value={venueData.end_time} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>رابط صورة الملعب (Image URL)</label>
            <input 
              type="url" 
              name="image_url" 
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}
              value={venueData.image_url} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="mb-4">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>وصف الملعب والمميزات</label>
            <textarea 
              name="description" 
              rows="3"
              className="form-control" 
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', resize: 'vertical' }}
              value={venueData.description} 
              onChange={handleChange} 
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2"
          >
            حفظ وإضافة الملعب
          </button>
        </form>
      </div>
    </div>
  );
}
