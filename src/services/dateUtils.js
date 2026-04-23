export function calculateDate(date) {
  const oneDay = 24 * 60 * 60 * 1000;
  const d = new Date(new Date(date).toISOString().split("T")[0]);
  const now = new Date(new Date().toISOString().split("T")[0]);
  const diff = Math.round((d - now) / oneDay);
  if (diff === 0) return [0, "Aujourd'hui"];
  if (diff === 1) return [1, "Demain"];
  if (diff < 0) return [-1, `Il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? "s" : ""}`];
  return [2, `Dans ${diff} jours`];
}

export function bookingsFilter(bookings, bucket) {
  return bookings.filter((b) => calculateDate(b.bookingDate)[0] === bucket);
}
