import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm]   = useState({ email: "", password: "", name: "", role: "student" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await registerUser(form);
      } else {
        res = await loginUser(form.email, form.password);
      }
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📚 RAG Library</h1>
        <p style={styles.subtitle}>Academic Research Assistant</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isRegister ? {} : styles.activeTab) }}
            onClick={() => setIsRegister(false)}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(isRegister ? styles.activeTab : {}) }}
            onClick={() => setIsRegister(true)}
          >
            Register
          </button>
        </div>

        {isRegister && (
          <input
            style={styles.input}
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
          />
        )}

        <input
          style={styles.input}
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        {isRegister && (
          <select style={styles.input} name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#0f172a"
  },
  card: {
    background: "#1e293b", borderRadius: 16, padding: 40,
    width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
  },
  title:    { color: "#f1f5f9", textAlign: "center", margin: 0, fontSize: 28 },
  subtitle: { color: "#94a3b8", textAlign: "center", marginBottom: 28 },
  tabs:     { display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden" },
  tab: {
    flex: 1, padding: "10px 0", border: "none", background: "#0f172a",
    color: "#94a3b8", cursor: "pointer", fontSize: 14
  },
  activeTab: { background: "#3b82f6", color: "#fff" },
  input: {
    width: "100%", padding: "12px 14px", marginBottom: 14,
    borderRadius: 8, border: "1px solid #334155",
    background: "#0f172a", color: "#f1f5f9", fontSize: 14,
    boxSizing: "border-box"
  },
  btn: {
    width: "100%", padding: "13px 0", borderRadius: 8, border: "none",
    background: "#3b82f6", color: "#fff", fontSize: 16,
    cursor: "pointer", marginTop: 4
  },
  error: { color: "#f87171", fontSize: 13, marginBottom: 10, textAlign: "center" }
};