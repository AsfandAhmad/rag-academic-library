import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../apis/axios";
import { useTheme } from "../context/ThemeContext";

export default function Login() {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "student" });
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
      // Extract error message properly
      const errorMessage = err.response?.data?.detail || err.message || "Something went wrong";
      // If detail is an array (validation errors), format it
      if (Array.isArray(err.response?.data?.detail)) {
        const errors = err.response.data.detail.map(e => e.msg).join(", ");
        setError(errors);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: isDark 
        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
        : "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
      position: "relative",
    },
    themeToggle: {
      position: "absolute",
      top: 20,
      right: 20,
      background: colors.bgSecondary,
      border: `1px solid ${colors.border}`,
      borderRadius: 8,
      padding: "8px 16px",
      cursor: "pointer",
      color: colors.text,
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      gap: 8,
      transition: "all 0.3s ease",
      boxShadow: isDark 
        ? "0 4px 6px rgba(0, 0, 0, 0.3)"
        : "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    card: {
      background: colors.bgSecondary,
      borderRadius: 16,
      padding: 40,
      width: 380,
      boxShadow: isDark 
        ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)"
        : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      border: `1px solid ${colors.border}`,
    },
    title: { color: colors.text, textAlign: "center", margin: 0, fontSize: 28, fontWeight: 700 },
    subtitle: { color: colors.textSecondary, textAlign: "center", marginBottom: 28, marginTop: 8 },
    tabs: { display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden", border: `1px solid ${colors.border}` },
    tab: {
      flex: 1,
      padding: "10px 0",
      border: "none",
      background: colors.bg,
      color: colors.textSecondary,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 500,
      transition: "all 0.2s ease",
    },
    activeTab: { background: colors.primary, color: "#fff", fontWeight: 600 },
    input: {
      width: "100%",
      padding: "12px 14px",
      marginBottom: 14,
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.text,
      fontSize: 14,
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.2s ease",
    },
    select: {
      width: "100%",
      padding: "12px 14px",
      marginBottom: 14,
      borderRadius: 8,
      border: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.text,
      fontSize: 14,
      boxSizing: "border-box",
      outline: "none",
      cursor: "pointer",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 10px center",
      backgroundSize: "20px",
      paddingRight: "40px",
    },
    btn: {
      width: "100%",
      padding: "13px 0",
      borderRadius: 8,
      border: "none",
      background: colors.primary,
      color: "#fff",
      fontSize: 16,
      cursor: "pointer",
      marginTop: 4,
      fontWeight: 600,
      transition: "all 0.2s ease",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    error: { 
      color: colors.error, 
      fontSize: 13, 
      marginBottom: 10, 
      textAlign: "center",
      background: colors.errorBg,
      padding: "8px 12px",
      borderRadius: 6,
      border: `1px solid ${colors.error}`,
    },
  };

  return (
    <div style={styles.container}>
      <button style={styles.themeToggle} onClick={toggleTheme}>
        {isDark ? "☀️" : "🌙"} {isDark ? "Light" : "Dark"} Mode
      </button>

      <div style={styles.card}>
        <h1 style={styles.title}>📚 RAG Library</h1>
        <p style={styles.subtitle}>Academic Research Assistant</p>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isRegister ? {} : styles.activeTab) }}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(isRegister ? styles.activeTab : {}) }}
            onClick={() => { setIsRegister(true); setError(""); }}
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
          <select style={styles.select} name="role" value={form.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <button 
          style={styles.btn} 
          onClick={handleSubmit} 
          disabled={loading}
          onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
        >
          {loading ? "Please wait..." : isRegister ? "Create Account" : "Login"}
        </button>
      </div>
    </div>
  );
}
