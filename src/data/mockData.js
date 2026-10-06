export const venues = [
  {
    id: 1,
    owner_id: "o1",
    name: "ملعب النجوم",
    address: "الغردقة - الدهار",
    maps_url: "https://maps.google.com",
    price_per_hour: 400,
    deposit_percent: 25,
    payment_number: "01000000000",
    open_time: 16,
    close_time: 24,
    description: "ملعب خماسي نجيل صناعي",
    images: [],
  },
];

export const bookings = [
  {
    id: 1,
    user_id: "u1",
    venue_id: 1,
    date: "2026-10-10",
    start_hour: 19,
    price: 400,
    deposit_amount: 100,
    status: "pending", // pending | confirmed | rejected | cancelled
  },
];
