import axios from "axios";
import { $SERVER } from "../_const/_const";

function authHeaders() {
  const token = localStorage.getItem("token-1755");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStatsSummary() {
  const res = await axios.get(`${$SERVER}/api/stats/summary`, {
    headers: authHeaders(),
  });
  return res.data?.data || { totalScans: 0, distinctLanguages: 0, languages: [] };
}
