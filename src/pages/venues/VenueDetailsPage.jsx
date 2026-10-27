// src/pages/venues/VenueDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getVenueById } from '../../services/venuesService';

export default function VenueDetailsPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVenue() {
      const data = await getVenueById(id);
      setVenue(data);
      setLoading(false);
    }
    fetchVenue();
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: '20px' }}>جاري تحميل تفاصيل الملعب...</div>;
  }

  if (!venue) {
    return <div className="container" style={{ padding: '20px' }}>عذراً، هذا الملعب غير موجود.</div>;
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <Link to="/venues" className="btn btn-outline" style={{ marginBottom: '20px', display: 'inline-block' }}>
        ← العودة لقائمة الملاعب
      </Link>
      
      <div className="card">
        <h2 style={{ color: 'var(--green)' }}>{venue.name}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>{venue.address}</p>
        
        <div style={{ margin: '20px 0', padding: '15px', background: 'var(--bg)', borderRadius: '8px' }}>
          <p><strong>سعر الساعة:</strong> {venue.price_per_hour} ج.م</p>
          <p style={{ marginTop: '8px' }}><strong>مدة الحجز (السلوت):</strong> {venue.slot_minutes} دقيقة</p>
        </div>

        {venue.amenities && venue.amenities.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h4>مميزات الملعب:</h4>
            <ul style={{ paddingRight: '20px', marginTop: '8px' }}>
              {venue.amenities.map((amenity, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>{amenity}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <Link to={`/booking/${venue.id}`} className="btn btn-primary">
            اذهب لحجز الملعب
          </Link>
        </div>
      </div>
    </div>
  );
}
```[cite: 7]

---

<ElicitationsGroup>
  <Elicitation context="Next step after creating VenueDetailsPage">
    <Question>هل قمت بإنشاء صفحة تفاصيل الملعب بنجاح؟ هل ننتقل الآن لإنشاء صفحة حسابي وحجوزاتي (My Bookings)؟</Question>
    <Options>
      <Option label="نعم، لننتقل لكتابة صفحة حسابي وحجوزاتي" value="my_bookings_page"/>
      <Option label="لدي استفسار حول كود صفحة التفاصيل" value="details_question"/>
    </Options>
  </Elicitation>
</ElicitationsGroup>