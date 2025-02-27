import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const { token, role, user, redirect } = response.data;

        if (!token) {
          setError("Login failed: No token received.");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));

        navigate(redirect);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="title">👁️ Reporter</h2>

        {/* ✅ Ensure inputs are inside a form */}
        <form onSubmit={handleLogin}>
          {/* ✅ Email Input */}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email" // ✅ Required for autocomplete
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username" // ✅ Correct attribute
            />
          </div>

          {/* ✅ Password Input */}
          <div className="password-field">
            <label htmlFor="password">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password" // ✅ Required for autocomplete
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password" // ✅ Correct attribute
              onFocus={() => setTimeout(() => {}, 100)} // 🚀 Sometimes helps trigger autocomplete
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              role="button"
            >
              {showPassword ? "👁️" : "🙈"}
            </span>
          </div>

          {/* ✅ Error Message */}
          {error && <p className="error-text">{error}</p>}

          {/* ✅ Login Button */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* ✅ Forgot Password */}
        <p className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className="or-text">OR</p>

        {/* ✅ Signup Link */}
        <p className="signup-link">
          <Link to="/signup">Sign Up</Link>
        </p>
      </div>

      {/* ✅ Right Section */}
      <div className="login-info">
        <h2 className="hero-text">
          Let’s build the Nation <span className="bold-text">together</span>
        </h2>
        <p>👁️ <span className="highlight">Reporter</span> is a platform for every citizen.</p>
      </div>
    </div>
  );
};

export default Login;