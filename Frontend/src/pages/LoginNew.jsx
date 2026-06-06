import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../apis/axios";
import "../styles/LoginNew.css";

export default function LoginNew() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cardRef = useRef(null);
  const canvasRef = useRef(null);

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "student",
    password: "",
    confirmPassword: "",
  });

  // Draw library background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Fill base color
    ctx.fillStyle = "#0a0500";
    ctx.fillRect(0, 0, width, height);

    // Vanishing point (upper-center)
    const vx = width / 2;
    const vy = height * 0.25;

    // Draw floor (perspective tiles)
    const drawFloor = () => {
      const floorY = height * 0.7;
      const tileColors = ["#1a0c03", "#2a1505"];
      
      for (let row = 0; row < 8; row++) {
        const y1 = floorY + (row * (height - floorY) / 8);
        const y2 = floorY + ((row + 1) * (height - floorY) / 8);
        const leftX1 = vx - (width * 0.6 * (1 - row / 8));
        const rightX1 = vx + (width * 0.6 * (1 - row / 8));
        const leftX2 = vx - (width * 0.6 * (1 - (row + 1) / 8));
        const rightX2 = vx + (width * 0.6 * (1 - (row + 1) / 8));

        for (let col = 0; col < 12; col++) {
          const x1 = leftX1 + (col * (rightX1 - leftX1) / 12);
          const x2 = leftX1 + ((col + 1) * (rightX1 - leftX1) / 12);
          const x3 = leftX2 + ((col + 1) * (rightX2 - leftX2) / 12);
          const x4 = leftX2 + (col * (rightX2 - leftX2) / 12);

          ctx.fillStyle = tileColors[(row + col) % 2];
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y1);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x4, y2);
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    // Draw bookshelves (5 rows receding in perspective)
    const drawBookshelves = () => {
      const bookColors = [
        "#3d1a08", "#08261a", "#08122a", "#2a0808",
        "#2a1508", "#1a2a08", "#2a0820", "#082a2a"
      ];

      for (let row = 0; row < 5; row++) {
        const depth = 1 - (row * 0.18);
        const shelfY = vy + (row * 80);
        const leftX = vx - (width * 0.45 * depth);
        const rightX = vx + (width * 0.45 * depth);
        const shelfHeight = 120 * depth;

        // Left bookshelf
        drawBookshelf(leftX - 150 * depth, shelfY, 150 * depth, shelfHeight, bookColors, depth);
        
        // Right bookshelf
        drawBookshelf(rightX, shelfY, 150 * depth, shelfHeight, bookColors, depth);
      }
    };

    const drawBookshelf = (x, y, width, height, colors, scale) => {
      // Shelf background
      ctx.fillStyle = "#0d0602";
      ctx.fillRect(x, y, width, height);

      // Books
      let currentX = x + 5;
      while (currentX < x + width - 5) {
        const bookWidth = (15 + Math.random() * 20) * scale;
        const bookHeight = height * (0.7 + Math.random() * 0.25);
        const bookY = y + height - bookHeight - 5;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Book spine
        const gradient = ctx.createLinearGradient(currentX, bookY, currentX + bookWidth, bookY);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, shadeColor(color, 20));
        gradient.addColorStop(1, color);
        ctx.fillStyle = gradient;
        ctx.fillRect(currentX, bookY, bookWidth, bookHeight);

        // Gold foil detail
        ctx.strokeStyle = "rgba(190,145,65,0.3)";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(currentX + 1, bookY + bookHeight * 0.1, bookWidth - 2, 1);

        // Slight tilt
        ctx.save();
        ctx.translate(currentX + bookWidth / 2, bookY + bookHeight);
        ctx.rotate((Math.random() - 0.5) * 0.05);
        ctx.restore();

        currentX += bookWidth + (2 * scale);
      }
    };

    const shadeColor = (color, percent) => {
      const num = parseInt(color.replace("#", ""), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
      const B = Math.min(255, (num & 0x0000ff) + amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    };

    // Draw god rays
    const drawGodRays = () => {
      for (let i = 0; i < 7; i++) {
        const startX = width * (0.3 + i * 0.08);
        const gradient = ctx.createLinearGradient(startX, 0, startX + 80, height * 0.7);
        gradient.addColorStop(0, "rgba(255,190,60,0.07)");
        gradient.addColorStop(0.5, "rgba(255,190,60,0.03)");
        gradient.addColorStop(1, "rgba(255,190,60,0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX + 30, 0);
        ctx.lineTo(startX + 120, height * 0.7);
        ctx.lineTo(startX + 50, height * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    };

    // Draw vignette
    const drawVignette = () => {
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.7
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.6, "rgba(0,0,0,0.3)");
      gradient.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Side shadows
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, width * 0.1, height);
      ctx.fillRect(width * 0.9, 0, width * 0.1, height);
    };

    drawFloor();
    drawBookshelves();
    drawGodRays();
    drawVignette();

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFloor();
      drawBookshelves();
      drawGodRays();
      drawVignette();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3D card parallax effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      const rotateY = deltaX * 14;
      const rotateX = -deltaY * 10;

      card.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = "perspective(1000px) rotateY(-6deg) rotateX(4deg)";
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(loginData.email, loginData.password);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        email: registerData.email,
        name: `${registerData.firstName} ${registerData.lastName}`,
        password: registerData.password,
        role: registerData.role,
      });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/chat");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((e) => e.msg).join(", "));
      } else {
        setError(detail || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated canvas background */}
      <canvas ref={canvasRef} className="library-canvas" />

      {/* Floating dust motes */}
      <div className="dust-container">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="dust-mote"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              width: `${0.5 + Math.random() * 2}px`,
              height: `${0.5 + Math.random() * 2}px`,
            }}
          />
        ))}
      </div>

      {/* 3D Login Card */}
      <div ref={cardRef} className="login-card">
        {/* Card depth faces */}
        <div className="card-face-left" />
        <div className="card-face-bottom" />

        {/* Corner filigree */}
        <div className="corner-filigree top-left" />
        <div className="corner-filigree top-right" />
        <div className="corner-filigree bottom-left" />
        <div className="corner-filigree bottom-right" />

        {/* Header */}
        <div className="card-header">
          <div className="lantern">
            <div className="lantern-top" />
            <div className="lantern-body">
              <div className="flame" />
              <div className="flame-glow" />
            </div>
          </div>
          <h1 className="brand-title">Maktab e Kamil</h1>
          <p className="brand-subtitle">ACCESS PORTAL</p>
          <div className="divider" />
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Login
          </button>
          <button
            className={`tab ${!isLogin ? "active" : ""}`}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLogin} className="form">
            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="Email address"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Entering..." : "Enter the Library"}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="form">
            <div className="input-row">
              <div className="input-group">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="First name"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="Last name"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                type="email"
                placeholder="Email address"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                className="input-select"
              >
                <option value="student">Student</option>
                <option value="faculty">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                placeholder="Password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                placeholder="Confirm password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="footer-note">— Restricted to enrolled members —</p>
      </div>
    </div>
  );
}
