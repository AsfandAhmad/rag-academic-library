import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global response handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const registerUser = (data) =>
  API.post("/auth/register", data);

export const loginUser = (email, password) => {
  const form = new URLSearchParams();

  form.append("username", email);
  form.append("password", password);

  return axios.post(
    `${API_BASE_URL}/auth/login`,
    form,
    {
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );
};

export const getMe = () =>
  API.get("/auth/me");

// ─────────────────────────────────────────────
// PDF UPLOAD
// ─────────────────────────────────────────────

export const uploadPDF = (
  file,
  category = "",
  description = ""
) => {
  const fd = new FormData();

  fd.append("file", file);

  if (category) {
    fd.append("category", category);
  }

  if (description) {
    fd.append("description", description);
  }

  return API.post("/upload/pdf", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadPDFWithProgress = (
  file,
  onProgress,
  category = "",
  description = ""
) => {
  const fd = new FormData();

  fd.append("file", file);

  if (category) {
    fd.append("category", category);
  }

  if (description) {
    fd.append("description", description);
  }

  return API.post("/upload/pdf", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) /
            progressEvent.total
        );

        onProgress(percent);
      }
    },
  });
};

export const getMyDocs = () =>
  API.get("/upload/my-docs");

export const deleteDoc = (id) =>
  API.delete(`/upload/${id}`);

export const getDocPreview = (id) =>
  API.get(`/upload/${id}/preview`);

export const toggleFavorite = (id) =>
  API.post(`/upload/${id}/favorite`);

export const getStats = () =>
  API.get("/upload/stats");

export const getDocs = () =>
  API.get("/upload/docs");

export const deleteDocById = (id) =>
  API.delete(`/upload/docs/${id}`);

export const getAllDocs = () =>
  API.get("/upload/docs/all");

// ─────────────────────────────────────────────
// QUERY
// ─────────────────────────────────────────────

export const askQuestion = (question) =>
  API.post("/query/ask", {
    question,
  });

export const getHistory = () =>
  API.get("/query/history");

// ─────────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────────

export const submitFeedback = (
  query_id,
  rating,
  comment = ""
) =>
  API.post("/feedback/", {
    query_id,
    rating,
    comment,
  });

export default API;