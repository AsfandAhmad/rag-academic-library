import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────
export const registerUser  = (data) => API.post("/auth/register", data);
export const loginUser     = (email, password) => {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  return axios.post(
    `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/auth/login`,
    form,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
};
export const getMe = () => API.get("/auth/me");

// ─── Upload ───────────────────────────────────────────────
export const uploadPDF  = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return API.post("/upload/pdf", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const getMyDocs  = () => API.get("/upload/my-docs");
export const deleteDoc  = (id) => API.delete(`/upload/${id}`);

// ─── Query ────────────────────────────────────────────────
export const askQuestion   = (question) =>
  API.post("/query/ask", { question });
export const getHistory    = () => API.get("/query/history");

// ─── Feedback ─────────────────────────────────────────────
export const submitFeedback = (query_id, rating, comment = "") =>
  API.post("/feedback/", { query_id, rating, comment });

export default API;