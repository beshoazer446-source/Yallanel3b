import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// إصلاح مشكلة مسارات أيقونات Leaflet الافتراضية مع Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// إحداثيات المدن والمحافظات الرئيسية للتركيز المبدئي
const CITY_COORDINATES = {
  "القاهرة": [30.0444, 31.2357],
  "الجيزة": [30.0131, 31.2089],
  "الإسكندرية": [31.2001, 29.9187],
  "قنا": [26.1551, 32.7160],
  "الأقصر": [25.6872, 32.6396],
  "أسوان": [24.0889, 32.8998],
  "المنصورة": [31.0409, 31.3785],
  "الدقهلية": [31.0409, 31.3785],
  "طنطا": [30.7865, 31.0004],
  "الغربية": [30.7865, 31.0004],
  "الشرقية": [30.5877, 31.5020],
  "الزقازيق": [30.5877, 31.5020],
  "المنوفية": [30.5972, 30.9876],
  "بورسعيد": [31.2653, 32.3019],
  "السويس": [29.9668, 32.5498],
  "الإسماعيلية": [30.5965, 32.2715],
  "البحر الأحمر": [27.2579, 33.8116],
  "أسيوط": [27.1801, 31.1837],
  "سوهاج": [26.5590, 31.6957],
  "المنيا": [28.0871, 30.7618],
  "بني سويف": [29.0661, 31.0994],
  "الفيوم": [29.3084, 30.8428],
  "مطروح": [31.3543, 27.2373],
};

// استخراج الإحداثيات لو كان فيه رابط خرائط قديم
function parseCoordinatesFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/q=([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/) ||
                url.match(/@([+-]?\d+(?:\.\d+)?),([+-]?\d+(?:\.\d+)?)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  return null;
}

export default function MapPickerModal({ isOpen, onClose, onSelectLocation, initialUrl, city }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const initialCoords = parseCoordinatesFromUrl(initialUrl) ||
                        (city && CITY_COORDINATES[city]) ||
                        [30.0444, 31.2357]; // القاهرة افتراضياً

  const [selectedCoords, setSelectedCoords] = useState(initialCoords);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  const coordsRef = useRef(selectedCoords);

  useEffect(() => {
    coordsRef.current = selectedCoords;
  }, [selectedCoords]);

  useEffect(() => {
    if (!isOpen) return;

    // مهلة قصيرة للتأكد من رندر الـ DOM
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      const initialMapCoords = coordsRef.current;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: initialMapCoords,
          zoom: 14,
        });

        // طبقة خرائط OpenStreetMap مجانية وبدون قيود
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const marker = L.marker(initialMapCoords, { draggable: true }).addTo(map);
        marker.bindPopup("موقع الملعب المختار").openPopup();

        // عند سحب الماركر
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          setSelectedCoords([pos.lat, pos.lng]);
        });

        // عند الضغط على أي نقطة في الخريطة
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedCoords([lat, lng]);
          marker.bindPopup("موقع الملعب المختار").openPopup();
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView(initialMapCoords, 14);
        if (markerRef.current) {
          markerRef.current.setLatLng(initialMapCoords);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // إغلاق وتنظيف الخريطة عند إغلاق الـ Modal
  useEffect(() => {
    if (!isOpen && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [isOpen]);

  // تحديد الموقع الحالي بالـ GPS
  function handleLocateMe() {
    if (!navigator.geolocation) {
      setGpsError("متصفحك لا يدعم تحديد الموقع الجغرافي.");
      return;
    }

    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = [latitude, longitude];
        setSelectedCoords(newCoords);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView(newCoords, 16);
          markerRef.current.setLatLng(newCoords);
          markerRef.current.bindPopup("📍 موقعك الحالي تم تحديده!").openPopup();
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? "يرجى السماح بصلاحية الوصول للموقع في المتصفح."
            : "تعذر الحصول على موقعك الحالي. تأكد من تفعيل الـ GPS.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleConfirm() {
    const [lat, lng] = selectedCoords;
    const mapsUrl = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
    onSelectLocation(mapsUrl, { lat, lng });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(7, 28, 22, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        direction: "rtl",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 720,
          background: "var(--white)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 20, color: "var(--green)", fontWeight: 800 }}>
              📍 حدد موقع الملعب على الخريطة
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
              اضغط على أي مكان بالخريطة أو اسحب العلامة لوضعها على الملعب بدقة
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              fontSize: 22,
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 6,
            }}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* زر تحديد الموقع الحالي بالـ GPS */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={gpsLoading}
            className="btn btn-outline"
            style={{
              borderColor: "var(--green)",
              color: "var(--green)",
              fontWeight: 700,
              fontSize: 13,
              padding: "8px 16px",
            }}
          >
            {gpsLoading ? "جاري جلب موقعك..." : "🎯 موقعي الحالي (GPS)"}
          </button>
          {gpsError && (
            <span style={{ color: "var(--status-cancelled)", fontSize: 12 }}>
              {gpsError}
            </span>
          )}
        </div>

        {/* حاوية خريطة Leaflet */}
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: 380,
            borderRadius: 14,
            overflow: "hidden",
            border: "2px solid var(--border)",
            position: "relative",
          }}
        />

        {/* شريط الإحداثيات والتأكيد */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            background: "var(--bg)",
            padding: "12px 16px",
            borderRadius: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "var(--text)" }}>
            <strong>الإحداثيات المختارة: </strong>
            <span style={{ direction: "ltr", display: "inline-block", fontFamily: "monospace", color: "var(--green)" }}>
              {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              style={{ fontSize: 14 }}
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn-primary"
              style={{ fontSize: 14, fontWeight: 700 }}
            >
              ✓ تأكيد واستخدام هذا الموقع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
