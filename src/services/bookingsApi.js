import axios from "axios";
import { $SERVER } from "../_const/_const";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token-1755") || ""}`,
});

export async function fetchAllBookings() {
  const { data } = await axios.get(`${$SERVER}/api/bookings/allBookings`, {
    headers: authHeader(),
  });
  return data?.bookings || [];
}

export async function createBooking(booking, pushNotificationToken = "") {
  const { data } = await axios.post(`${$SERVER}/api/bookings/createBooking`, {
    booking,
    pushNotificationToken,
  });
  return data;
}

export async function updateBooking(update) {
  const { data } = await axios.post(
    `${$SERVER}/api/bookings/updateBooking`,
    { update },
    { headers: authHeader() }
  );
  return data;
}

export async function deleteBooking(update) {
  const { data } = await axios.delete(`${$SERVER}/api/bookings/deleteBooking`, {
    headers: authHeader(),
    data: { update },
  });
  return data;
}

export async function postAdminRegistrationToken(registrationKey) {
  const { data } = await axios.post(
    `${$SERVER}/api/bookings/registrationToken`,
    { registrationKey },
    { headers: authHeader() }
  );
  return data;
}
