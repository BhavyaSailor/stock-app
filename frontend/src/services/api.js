import axios from "axios";
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const api = axios.create({
  baseURL: API_BASE,
});

export async function getTrades() {
  const response = await api.get("/trades");

  return response.data;
}

export async function startPull() {
  const response = await api.post("/pulls");

  return response.data;
}

export default api;