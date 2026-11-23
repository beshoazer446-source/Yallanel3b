import "../owner-pages.css";
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateVenue } from '../services/venueService';
export default function EditVenue() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venueData, setVenueData] = useState({
    name: '',
    city: '',
    address: '',
    price_per_hour: '',
    description: '',
    imageFile: null, 
    currentImage: '' 
  });

 
  const daysOfWeek = [
    { key: 'saturday', label: 'السبت' },
    { key: 'sunday', label: 'الأحد' },
    { key: 'monday', label: 'الإثنين' },
    { key: 'tuesday', label: 'الثلاثاء' },
    { key: 'wednesday', label: 'الأربعاء' },
    { key: 'thursday', label: 'الخميس' },
    { key: 'friday', label: 'الجمعة' }
  ];

  
  const [schedules, setSchedules] = useState({
    saturday: [{ start: '08:00', end: '23:00' }],
    sunday: [{ start: '08:00', end: '23:00' }],
    monday: [{ start: '08:00', end: '23:00' }],
    tuesday: [{ start: '08:00', end: '23:00' }],
    wednesday: [{ start: '08:00', end: '23:00' }],
    thursday: [{ start: '08:00', end: '23:00' }],
    friday: [{ start: '14:00', end: '23:00' }],
  });

  useEffect(() => {
    
    setVenueData({
      name: 'ملعب النجوم',
      city: 'القاهرة',
      address: 'شارع الهرم الرئيسي',
      price_per_hour: '200',
      description: 'ملعب عشب صناعي ممتاز ومجهز بالكامل',
      imageFile: null,
      currentImage: 'https://example.com/stadium.jpg'
    });
  }, [id]);

  const handleChange = (e) => {
    setVenueData({
      ...venueData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVenueData({
        ...venueData,
        imageFile: e.target.files[0],
      });
    }
  };

  
  const handlePeriodChange = (dayKey, index, field, value) => {
    const updatedDayPeriods = [...schedules[dayKey]];
    updatedDayPeriods[index][field] = value;
    setSchedules({
      ...schedules,
      [dayKey]: updatedDayPeriods,
    });
  };

  const handleAddPeriod = (dayKey) => {
    setSchedules({
      ...schedules,
      [dayKey]: [...schedules[dayKey], { start: '08:00', end: '23:00' }],
    });
  };

  const handleRemovePeriod = (dayKey, index) => {
    const updatedDayPeriods = schedules[dayKey].filter((_, i) => i !== index);
    setSchedules({
      ...schedules,
      [dayKey]: updatedDayPeriods,
    });
  };

  const handleCopyScheduleToAll = (sourceDay) => {
    const sourceSchedule = schedules[sourceDay];
    const newSchedules = {};
    daysOfWeek.forEach((day) => {
      newSchedules[day.key] = JSON.parse(JSON.stringify(sourceSchedule));
    });
    setSchedules(newSchedules);
    alert(`تم نسخ جدول يوم ${daysOfWeek.find(d => d.key === sourceDay).label} إلى جميع الأيام بنجاح!`);
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', venueData.name);
    formDataToSend.append('city', venueData.city);
    formDataToSend.append('address', venueData.address);
    formDataToSend.append('price_per_hour', venueData.price_per_hour);
    formDataToSend.append('description', venueData.description);
    
    
    if (venueData.imageFile) {
      formDataToSend.append('image', venueData.imageFile);
    }
    
    formDataToSend.append('schedules', JSON.stringify(schedules));

    try {
      
      await updateVenue(id, formDataToSend);
      
      alert("تم تحديث بيانات الملعب ومواعيد العمل في الداتابيز بنجاح!");
      navigate('/owner/dashboard'); 
      
    } catch (error) {
      console.error("خطأ أثناء تحديث البيانات:", error);
      alert("حدث خطأ أثناء حفظ التعديلات، تأكد أن السيرفر يعمل!");
    }
  };
  

  return (
    <div className="container py-5">
      <div className="card p-4 shadow w-100 mx-auto" style={{ maxWidth: '900px' }}>
        <h2 className="text-center mb-4" style={{ color: 'var(--green-dark)' }}>تعديل بيانات الملعب (رقم: {id})</h2>
        
        <form onSubmit={handleSubmit}>
          {}
          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>اسم الملعب</label>
            <input 
              type="text" 
              name="name" 
              className="form-control" 
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
              value={venueData.address} 
              onChange={handleChange} 
              required 
            />
          </div>

          {}
          <div className="mb-3">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>تحديث صورة الملعب (اختر ملف جديد إن أردت التغيير)</label>
            {venueData.currentImage && (
              <div className="mb-2">
                <small className="text-muted">الصورة الحالية مسجلة بالنظام</small>
              </div>
            )}
            <input 
              type="file" 
              name="imageFile" 
              className="form-control" 
              accept="image/*"
              onChange={handleImageChange} 
            />
          </div>

          <div className="mb-4">
            <label className="form-label mb-2" style={{ fontWeight: '600' }}>وصف الملعب والمميزات</label>
            <textarea 
              name="description" 
              rows="3"
              className="form-control" 
              value={venueData.description} 
              onChange={handleChange} 
            ></textarea>
          </div>

          <hr className="my-4" />

          {}
          <h4 className="mb-3" style={{ color: '#333' }}>تعديل فترات ومواعيد العمل الأسبوعية</h4>
          <p className="text-muted small mb-4">يمكنك تعديل أوقات الفترات لكل يوم أو نسخ الجدول لجميع الأيام.</p>

          {daysOfWeek.map((day) => (
            <div key={day.key} className="p-3 mb-3 border rounded" style={{ backgroundColor: '#fafafa' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1e293b' }}>{day.label}</span>
                <div>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary me-2" 
                    onClick={() => handleCopyScheduleToAll(day.key)}
                    style={{ fontSize: '12px' }}
                  >
                    نسخ جدول {day.label} إلى جميع الأيام
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-warning text-white" 
                    onClick={() => handleAddPeriod(day.key)}
                    style={{ fontSize: '12px' }}
                  >
                    + إضافة فترة
                  </button>
                </div>
              </div>

              {schedules[day.key].map((period, index) => (
                <div key={index} className="row align-items-center mb-2">
                  <div className="col-5">
                    <label className="small text-muted">من وقت:</label>
                    <input 
                      type="time" 
                      className="form-control form-control-sm" 
                      value={period.start} 
                      onChange={(e) => handlePeriodChange(day.key, index, 'start', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-5">
                    <label className="small text-muted">إلى وقت:</label>
                    <input 
                      type="time" 
                      className="form-control form-control-sm" 
                      value={period.end} 
                      onChange={(e) => handlePeriodChange(day.key, index, 'end', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-2 text-end pt-4">
                    {schedules[day.key].length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-danger" 
                        onClick={() => handleRemovePeriod(day.key, index)}
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-3 mt-3"
            style={{ fontSize: '16px', fontWeight: 'bold' }}
          >
            حفظ التعديلات بنجاح
          </button>
        </form>
      </div>
    </div>
  );
}