import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Admin.css";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:5000/admin/login", {
        email,
        password,
      });

      if (response.status === 200) {
        localStorage.setItem("adminToken", response.data.token);
        localStorage.setItem("role", "admin"); 
        navigate("/admin-dashboard"); 
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-form">
        <h2 className="admin-title">👁️ Reporter</h2>
        <h3 className="admin-subtitle">Welcome Back!</h3>

        <form onSubmit={handleAdminLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              role="button"
            >
              {showPassword ? "👁️" : "🙈"}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="admin-forgot-password">Forgot Password</p>
      </div>

      <div className="admin-login-info">
        <h2 className="hero-text">
          Let’s build the Nation <span className="bold-text">together</span>
        </h2>
        <p>👁️ <span className="highlight">Reporter</span> is a platform for every citizen.</p>
      </div>
    </div>
  );
};

export default AdminLogin;
