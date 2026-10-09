export const profiles = [
  {
    id: "u1",
    name: "أحمد سامي",
    email: "ahmed@example.com",
    phone: "01000000001",
    role: "user",
  },
  {
    id: "o1",
    name: "كريم حسن",
    email: "karim@example.com",
    phone: "01000000002",
    role: "owner",
  },
];

export const venues = [
  {
    id: 1,
    owner_id: "o1",
    name: "ملعب جولدن أرينا",
    city: "القاهرة",
    area: "التجمع الخامس",
    address: "شارع التسعين الشمالي، التجمع الخامس",
    maps_url: "https://maps.google.com",
    description: "ملعب خماسي نجيل صناعي عالي الجودة وإضاءة ليلية قوية",
    price_per_hour: 450,
    deposit_percent: 25,
    payment_number: "01000000000",
    slot_minutes: 60,
    amenities: [
      "إضاءة ليلية",
      "كراسي مدرجة",
      "كافيتريا",
      "دش ومياه",
      "غرف تغيير",
      "مواقف سيارات",
    ],
    cancellation_hours: 12,
    is_active: true,
  },
];

export const venue_images = [
  { id: 1, venue_id: 1, image_url: "/img1.jpg", sort_order: 0 },
];

// day_of_week: 0 = الأحد ... 6 = السبت
export const venue_working_hours = [
  {
    id: 1,
    venue_id: 1,
    day_of_week: 0,
    open_time: "16:00",
    close_time: "24:00",
  },
  {
    id: 2,
    venue_id: 1,
    day_of_week: 5,
    open_time: "10:00",
    close_time: "14:00",
  },
  {
    id: 3,
    venue_id: 1,
    day_of_week: 5,
    open_time: "16:00",
    close_time: "24:00",
  },
];

export const bookings = [
  {
    id: 1,
    user_id: "u1",
    venue_id: 1,
    date: "2026-10-12",
    start_time: "19:00",
    end_time: "20:00",
    price: 450,
    deposit_amount: 112.5,
    status: "pending", // pending | confirmed | rejected | cancelled
    payment_proof_url: null,
  },
];
