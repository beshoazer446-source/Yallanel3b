import "../owner-pages.css";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createVenue } from '../services/venueService';
import { supabase } from '../lib/supabaseClient';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AddVenue() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [venueData, setVenueData] = useState({
    name: '',
    city: '',
    address: '',
    price_per_hour: '',
    description: '',
  });

  
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          toast.error("يجب تسجيل الدخول بحساب أونر أولاً!", { position: "top-center" });
        } else {
          setUser(user);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, []);

  const daysOfWeek = [
    { key: 6, label: 'السبت' },
    { key: 0, label: 'الأحد' },
    { key: 1, label: 'الإثنين' },
    { key: 2, label: 'الثلاثاء' },
    { key: 3, label: 'الأربعاء' },
    { key: 4, label: 'الخميس' },
    { key: 5, label: 'الجمعة' }
  ];

  const [schedules, setSchedules] = useState({
    6: [{ open_time: '08:00', close_time: '24:00' }],
    0: [{ open_time: '08:00', close_time: '24:00' }],
    1: [{ open_time: '08:00', close_time: '24:00' }],
    2: [{ open_time: '08:00', close_time: '24:00' }],
    3: [{ open_time: '08:00', close_time: '24:00' }],
    4: [{ open_time: '08:00', close_time: '24:00' }],
    5: [{ open_time: '14:00', close_time: '24:00' }],
  });

  const handleChange = (e) => {
    setVenueData({
      ...venueData,
      [e.target.name]: e.target.value,
    });
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
      [dayKey]: [...schedules[dayKey], { open_time: '08:00', close_time: '24:00' }],
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
    toast.info(`تم نسخ جدول يوم ${daysOfWeek.find(d => d.key === sourceDay).label} إلى جميع الأيام بنجاح!`, { position: "top-center" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("عذراً، لا يوجد مستخدم مسجل حالياً. يرجى تسجيل الدخول.", { position: "top-center" });
      return;
    }

    try {
      
      const venuePayload = {
        name: venueData.name,
        city: venueData.city,
        address: venueData.address,
        price_per_hour: parseFloat(venueData.price_per_hour),
        description: venueData.description,
      };

      
      const workingHoursPayload = [];
      Object.keys(schedules).forEach((dayKey) => {
        schedules[dayKey].forEach((period) => {
          workingHoursPayload.push({
            day_of_week: parseInt(dayKey),
            open_time: period.open_time,
            close_time: period.close_time === '00:00' ? '24:00' : period.close_time,
          });
        });
      });

      
      const paymentMethodsPayload = [
        { method: "cash", account: "01000000000" }
      ];

      const imageUrlsPayload = [];

      
      await createVenue({
        venue: venuePayload,
        workingHours: workingHoursPayload,
        paymentMethods: paymentMethodsPayload,
        imageUrls: imageUrlsPayload
      }, user.id);
      
      toast.success("تم إضافة الملعب ومواعيد العمل في Supabase بنجاح!", { position: "top-center" });
      setTimeout(() => {
        navigate('/owner/venues');
      }, 1500);
      
    } catch (error) {
      console.error("خطأ أثناء حفظ البيانات:", error);
      toast.error(`حدث خطأ أثناء حفظ البيانات: ${error.message || error}`, { position: "top-center" });
    }
  };

  if (loadingUser) {
    return <div className="text-center py-5">جاري التحقق من بيانات المستخدم...</div>;
  }

  return (
    <div className="container py-5">
      <ToastContainer />
      <div className="card p-4 shadow w-100 mx-auto" style={{ maxWidth: '900px' }}>
        <h2 className="text-center mb-4" style={{ color: 'var(--green-dark)' }}>إضافة ملعب جديد ومواعيد العمل</h2>
        
        <form onSubmit={handleSubmit}>
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

          <h4 className="mb-3" style={{ color: '#333' }}>مواعيد وفترات العمل الأسبوعية</h4>
          <p className="text-muted small mb-4">يمكنك إضافة أكثر من فترة عمل لكل يوم (تأكد من كتابة 24:00 في حالة الإغلاق منتصف الليل).</p>

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
                      value={period.open_time} 
                      onChange={(e) => handlePeriodChange(day.key, index, 'open_time', e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-5">
                    <label className="small text-muted">إلى وقت:</label>
                    <input 
                      type="time" 
                      className="form-control form-control-sm" 
                      value={period.close_time} 
                      onChange={(e) => handlePeriodChange(day.key, index, 'close_time', e.target.value)}
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
            حفظ وإضافة الملعب بنجاح
          </button>
        </form>
      </div>
    </div>
  );
}