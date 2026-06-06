import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../apis/axios";

const registerRoleOptions = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "faculty" },
  { label: "Administrator", value: "admin" },
];

function seedRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function lightenColor(hex, amount) {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, ((value >> 16) & 255) + amount);
  const g = Math.min(255, ((value >> 8) & 255) + amount);
  const b = Math.min(255, (value & 255) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex, amount) {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((value >> 16) & 255) - amount);
  const g = Math.max(0, ((value >> 8) & 255) - amount);
  const b = Math.max(0, (value & 255) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawLibraryScene(canvas, time = 0) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0a0500";
  ctx.fillRect(0, 0, width, height);

  const rng = seedRandom(20260606);
  const vanishingX = width * 0.51;
  const vanishingY = height * 0.28;

  const haze = ctx.createRadialGradient(vanishingX, vanishingY, 0, vanishingX, vanishingY, height * 0.85);
  haze.addColorStop(0, "rgba(255,205,110,0.20)");
  haze.addColorStop(0.28, "rgba(255,175,70,0.10)");
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 7; i += 1) {
    const rayWidth = width * (0.06 + rng() * 0.03);
    const x = width * (0.1 + i * 0.12 + (rng() - 0.5) * 0.02);
    const alpha = 0.035 + rng() * 0.028 + Math.sin(time * 0.001 + i) * 0.004;
    ctx.fillStyle = `rgba(255,190,60,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + rayWidth, 0);
    ctx.lineTo(vanishingX + (i - 3) * width * 0.08, vanishingY + height * 0.08);
    ctx.lineTo(vanishingX + (i - 3) * width * 0.03, vanishingY + height * 0.08);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const leftShadow = ctx.createLinearGradient(0, 0, width * 0.12, 0);
  leftShadow.addColorStop(0, "rgba(0,0,0,0.96)");
  leftShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = leftShadow;
  ctx.fillRect(0, 0, width * 0.16, height);

  const rightShadow = ctx.createLinearGradient(width, 0, width * 0.88, 0);
  rightShadow.addColorStop(0, "rgba(0,0,0,0.96)");
  rightShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rightShadow;
  ctx.fillRect(width * 0.84, 0, width * 0.16, height);

  const floorTop = vanishingY + height * 0.08;
  const floorBottom = height;
  const aisleGlow = ctx.createRadialGradient(vanishingX, floorTop, 0, vanishingX, floorTop, height * 0.82);
  aisleGlow.addColorStop(0, "rgba(255,190,60,0.12)");
  aisleGlow.addColorStop(0.35, "rgba(255,160,50,0.06)");
  aisleGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = aisleGlow;
  ctx.fillRect(0, floorTop, width, floorBottom - floorTop);

  for (let y = floorTop; y < floorBottom; y += 18) {
    const t1 = (y - floorTop) / (floorBottom - floorTop);
    const t2 = (y + 18 - floorTop) / (floorBottom - floorTop);
    const left1 = vanishingX - (vanishingX - 0) * t1;
    const right1 = vanishingX + (width - vanishingX) * t1;
    const left2 = vanishingX - (vanishingX - 0) * t2;
    const right2 = vanishingX + (width - vanishingX) * t2;
    const rowIndex = Math.floor((y - floorTop) / 18);

    ctx.fillStyle = rowIndex % 2 === 0 ? "#120a04" : "#1c1005";
    ctx.beginPath();
    ctx.moveTo(left1, y);
    ctx.lineTo(right1, y);
    ctx.lineTo(right2, Math.min(y + 18, floorBottom));
    ctx.lineTo(left2, Math.min(y + 18, floorBottom));
    ctx.closePath();
    ctx.fill();
  }

  for (let i = -6; i <= 6; i += 1) {
    const x = vanishingX + i * width * 0.065;
    ctx.strokeStyle = "rgba(255,220,160,0.04)";
    ctx.beginPath();
    ctx.moveTo(vanishingX, floorTop);
    ctx.lineTo(x, floorBottom);
    ctx.stroke();
  }

  const rowConfigs = [
    { y: height * 0.36, scale: 1.0, shelfH: 120 },
    { y: height * 0.48, scale: 0.82, shelfH: 104 },
    { y: height * 0.58, scale: 0.68, shelfH: 92 },
    { y: height * 0.67, scale: 0.56, shelfH: 78 },
    { y: height * 0.74, scale: 0.46, shelfH: 66 },
  ];
  const bookColors = ["#3d1a08", "#08261a", "#08122a", "#2a0808", "#1b1230", "#4a2a0a", "#2c1206", "#3a1f0f"];

  rowConfigs.forEach((row) => {
    const shelfDepth = 220 * row.scale;
    const shelfLeft = vanishingX - shelfDepth * 2.1;
    const shelfRight = vanishingX + shelfDepth * 2.1;
    const shelfY = row.y;
    const shelfHeight = row.shelfH * row.scale;

    ctx.fillStyle = "#221108";
    ctx.fillRect(shelfLeft, shelfY, shelfRight - shelfLeft, shelfHeight);

    const shelfDepthLeft = ctx.createLinearGradient(shelfLeft, 0, shelfLeft + 18 * row.scale, 0);
    shelfDepthLeft.addColorStop(0, "#140b05");
    shelfDepthLeft.addColorStop(1, "rgba(38,20,11,0.55)");
    ctx.fillStyle = shelfDepthLeft;
    ctx.fillRect(shelfLeft, shelfY, 18 * row.scale, shelfHeight);

    const shelfDepthRight = ctx.createLinearGradient(shelfRight - 18 * row.scale, 0, shelfRight, 0);
    shelfDepthRight.addColorStop(0, "rgba(38,20,11,0.55)");
    shelfDepthRight.addColorStop(1, "#120a05");
    ctx.fillStyle = shelfDepthRight;
    ctx.fillRect(shelfRight - 18 * row.scale, shelfY, 18 * row.scale, shelfHeight);

    ctx.strokeStyle = "rgba(201,151,74,0.2)";
    ctx.strokeRect(shelfLeft, shelfY, shelfRight - shelfLeft, shelfHeight);

    for (let s = 0; s < 3; s += 1) {
      const shelfLineY = shelfY + (s + 1) * (shelfHeight / 4);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(shelfLeft, shelfLineY, shelfRight - shelfLeft, 2);
    }

    let cursorX = shelfLeft + 12 * row.scale;
    const bookAreaWidth = shelfRight - shelfLeft - 24 * row.scale;
    const bookCount = Math.floor(32 + row.scale * 24);

    for (let i = 0; i < bookCount; i += 1) {
      const remaining = bookAreaWidth - (cursorX - shelfLeft);
      if (remaining <= 16 * row.scale) break;

      const bookW = Math.max(8, (12 + rng() * 18) * row.scale);
      const bookH = shelfHeight * (0.74 + rng() * 0.22) - rng() * 6 * row.scale;
      const bookX = cursorX;
      const bookY = shelfY + shelfHeight - bookH - 8 * row.scale;
      const tilt = (rng() - 0.5) * 0.16;
      const color = bookColors[Math.floor(rng() * bookColors.length)];
      const grad = ctx.createLinearGradient(bookX, bookY, bookX + bookW, bookY);
      grad.addColorStop(0, lightenColor(color, 18));
      grad.addColorStop(0.52, color);
      grad.addColorStop(1, darkenColor(color, 14));

      ctx.save();
      ctx.translate(bookX + bookW / 2, bookY + bookH / 2);
      ctx.rotate(tilt);
      ctx.translate(-bookW / 2, -bookH / 2);
      ctx.fillStyle = grad;
      roundRect(ctx, 0, 0, bookW, bookH, 1.2);
      ctx.fill();

      ctx.strokeStyle = "rgba(255,240,200,0.1)";
      ctx.beginPath();
      ctx.moveTo(1, 1);
      ctx.lineTo(bookW - 1, 1);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,214,120,0.26)";
      ctx.beginPath();
      ctx.moveTo(bookW * 0.1, 3);
      ctx.lineTo(bookW * 0.9, 3);
      ctx.stroke();

      ctx.strokeStyle = "rgba(0,0,0,0.24)";
      ctx.beginPath();
      ctx.moveTo(bookW * 0.14, bookH - 3);
      ctx.lineTo(bookW * 0.86, bookH - 3);
      ctx.stroke();
      ctx.restore();

      cursorX += bookW + (2 + rng() * 6) * row.scale;
    }

    ctx.fillStyle = "rgba(255,220,160,0.04)";
    ctx.fillRect(shelfLeft, shelfY, shelfRight - shelfLeft, 2);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(shelfLeft, shelfY + shelfHeight - 5, shelfRight - shelfLeft, 5);
  });

  const vignette = ctx.createRadialGradient(vanishingX, height * 0.54, width * 0.18, vanishingX, height * 0.54, width * 0.9);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.74)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function Icon({ type }) {
  if (type === "mail") {
    return (
      <svg className="auth-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "lock") {
    return (
      <svg className="auth-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="10" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  if (type === "user") {
    return (
      <svg className="auth-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M5.5 19a6.5 6.5 0 0113 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true">
      <path d="M3 4l18 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10.6 10.4a2.8 2.8 0 003.9 3.9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 12s3.5-6 9.5-6c1.7 0 3.2.4 4.5 1.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20.2 8.8C21.1 10 21.5 12 21.5 12s-3.5 6-9.5 6c-1 0-2-.1-2.9-.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function Lantern() {
  return (
    <div className="lantern-wrap" aria-hidden="true">
      <div className="lantern-cap" />
      <div className="lantern-body">
        <div className="lantern-window" />
        <div className="lantern-flame" />
      </div>
      <div className="lantern-base" />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [errors, setErrors] = useState({});
  const dustMotes = useMemo(() => {
    return Array.from({ length: 24 }, (_, index) => {
      const random = seedRandom(1000 + index * 91)();
      return {
        left: `${Math.round(2 + random * 96)}%`,
        size: `${0.5 + (index % 7) * 0.3}px`,
        duration: `${11 + (index % 9) * 1.9}s`,
        delay: `${-(index * 0.85)}s`,
        drift: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 5) * 7)}px`,
      };
    });
  }, []);

  useEffect(() => {
    let frame = 0;
    let stop = false;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const redraw = () => drawLibraryScene(canvas, frame);
    const animate = () => {
      if (stop) return;
      frame += 1;
      drawLibraryScene(canvas, frame);
      requestAnimationFrame(animate);
    };

    redraw();
    const raf = requestAnimationFrame(animate);
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);

    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    const handleMove = (event) => {
      const rect = card.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = clamp(offsetX * 28, -14, 14);
      const rotateX = clamp(-offsetY * 20, -10, 10);
      card.style.transform = `rotateY(${rotateY - 6}deg) rotateX(${rotateX + 4}deg) translateZ(0)`;
    };

    const handleLeave = () => {
      card.style.transform = "rotateY(-6deg) rotateX(4deg) translateZ(0)";
    };

    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", handleLeave);
    return () => {
      card.removeEventListener("mousemove", handleMove);
      card.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (isRegister) {
      if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
      if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
      if (!form.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
      if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (!form.password) nextErrors.password = "Password is required.";
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
        res = await registerUser({ email: form.email, password: form.password, name, role: form.role });
      } else {
        res = await loginUser(form.email, form.password);
      }

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/chat");
    } catch (error) {
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        const mapped = detail.reduce((accumulator, item) => {
          const key = item.loc?.[item.loc.length - 1] || "form";
          accumulator[key] = item.msg;
          return accumulator;
        }, {});
        setErrors(mapped);
      } else {
        setErrors({ form: detail || error.message || "Something went wrong" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bayt-auth">
      <canvas ref={canvasRef} className="bayt-auth-canvas" />
      <div className="dust-layer">
        {dustMotes.map((mote, index) => (
          <span
            key={index}
            className="dust-mote"
            style={{
              left: mote.left,
              ["--size"]: mote.size,
              ["--duration"]: mote.duration,
              ["--delay"]: mote.delay,
              ["--drift"]: mote.drift,
            }}
          />
        ))}
      </div>
      <div className="auth-backdrop-shadow" />

      <div className="bayt-auth-wrap">
        <div ref={cardRef} className="bayt-auth-card">
          <div className="card-glow-ring" />
          <span className="card-filigree tl" />
          <span className="card-filigree tr" />
          <span className="card-filigree bl" />
          <span className="card-filigree br" />

          <div className="auth-header">
            <Lantern />
            <h1 className="auth-title">Maktab e Kamil</h1>
            <p className="auth-subtitle">ACCESS PORTAL</p>
          </div>

          <div className="auth-divider" />

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${!isRegister ? "active" : ""}`}
              onClick={() => {
                setIsRegister(false);
                setErrors({});
                setShowPassword(false);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab ${isRegister ? "active" : ""}`}
              onClick={() => {
                setIsRegister(true);
                setErrors({});
              }}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="auth-row">
                <div>
                  <label className="auth-label">First Name</label>
                  <div className="auth-field">
                    <Icon type="user" />
                    <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleChange} />
                  </div>
                  {errors.firstName && <div className="auth-error">{errors.firstName}</div>}
                </div>
                <div>
                  <label className="auth-label">Last Name</label>
                  <div className="auth-field">
                    <Icon type="user" />
                    <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleChange} />
                  </div>
                  {errors.lastName && <div className="auth-error">{errors.lastName}</div>}
                </div>
              </div>
            )}

            <div>
              <label className="auth-label">Email</label>
              <div className="auth-field">
                <Icon type="mail" />
                <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
              </div>
              {errors.email && <div className="auth-error">{errors.email}</div>}
            </div>

            {isRegister && (
              <div>
                <label className="auth-label">Role</label>
                <div className="auth-field">
                  <Icon type="user" />
                  <select name="role" value={form.role} onChange={handleChange}>
                    {registerRoleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="auth-label">Password</label>
              <div className="auth-field">
                <Icon type="lock" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {errors.password && <div className="auth-error">{errors.password}</div>}
            </div>

            {isRegister && (
              <div>
                <label className="auth-label">Confirm Password</label>
                <div className="auth-field">
                  <Icon type="lock" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && <div className="auth-error">{errors.confirmPassword}</div>}
              </div>
            )}

            {errors.form && <div className="auth-error">{errors.form}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create Account" : "Enter the Library"}
            </button>
          </form>

          <div className="auth-note">— Restricted to enrolled members —</div>
        </div>
      </div>
    </div>
  );
}
