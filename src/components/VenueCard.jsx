import { ArrowLeft, MapPin, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import "./VenueCard.css";

export default function VenueCard({ venue }) {
  return (
    <article className="venue-card">
      <div className="venue-card-image">
        {venue.images?.[0]?.image_url ? (
          <img src={venue.images[0].image_url} alt={`ملعب ${venue.name}`} loading="lazy" />
        ) : (
          <div className="venue-image-placeholder" aria-hidden="true">
            <Trophy size={30} />
            <span>ملعبك في انتظارك</span>
          </div>
        )}
        <span className="venue-city">
          {venue.city || "الموقع غير محدد"}
        </span>
      </div>

      <div className="venue-card-content">
        <h3>{venue.name}</h3>
        <p className="venue-location">
          <MapPin size={16} aria-hidden="true" />{" "}
          {venue.area || venue.address || "العنوان غير متوفر"}
        </p>
        {venue.description && (
          <p className="venue-description">{venue.description}</p>
        )}
        {venue.amenities?.length > 0 && (
          <div className="venue-amenities">
            {venue.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>
        )}
        <div className="venue-card-footer">
          <div className="venue-price">
            <strong>{venue.price_per_hour} <span>ج.م</span></strong>
            <span> / ساعة</span>
          </div>
          <Link
            className="venue-details-link"
            to={`/venues/${venue.id}`}
            aria-label={`عرض تفاصيل ${venue.name}`}
          >
            التفاصيل <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
