import axios from "axios";
import { $SERVER } from "../_const/_const";

export async function fetchConfig() {
  const { data } = await axios.get(`${$SERVER}/api/config/getConfig`);
  return data?.config || {};
}

export async function updateConfig(update) {
  const token = localStorage.getItem("token-1755") || "";
  const { data } = await axios.post(
    `${$SERVER}/api/config/updateConfig`,
    { update },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data?.updatedConfig || null;
}
