import axios from "axios";
import { $SERVER } from "../_const/_const";

const base = `${$SERVER}/api/categories`;

function authHeaders() {
  const token = localStorage.getItem("jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchTree() {
  const res = await axios.get(`${base}?tree=1`);
  return res.data?.data || [];
}

export async function fetchFlat() {
  const res = await axios.get(base);
  return res.data?.data || [];
}

export async function createCategory(payload) {
  const res = await axios.post(base, payload, { headers: authHeaders() });
  return res.data?.data;
}

export async function updateCategory(id, payload) {
  const res = await axios.put(`${base}/${id}`, payload, { headers: authHeaders() });
  return res.data?.data;
}

export async function moveCategory(id, { parentId, order }) {
  const res = await axios.put(
    `${base}/${id}/move`,
    { parentId, order },
    { headers: authHeaders() }
  );
  return res.data?.data;
}

export async function reorderCategories(items) {
  const res = await axios.put(`${base}/reorder`, items, { headers: authHeaders() });
  return res.data?.data;
}

export async function deleteCategory(id) {
  const res = await axios.delete(`${base}/${id}`, { headers: authHeaders() });
  return res.data;
}
