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
  const [protectedData, setProtectedData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      setLoading(false); // Cleanup loading state on unmount
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "https://ireporter-1-50ya.onrender.com/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (response.status === 200) {
        // Destructure access_token instead of token
        const { access_token, role, user } = response.data;

        if (!access_token) {
          setError("Login failed: No token received.");
          return;
        }

        // Log the role for debugging
        console.log("Role from server:", role);

        // Store user info in localStorage
        localStorage.setItem("token", access_token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));

        console.log("User logged in:", user);

        // Optionally fetch protected data immediately after login
        fetchProtectedData(access_token);

        // Normalize role before checking
        if (role && role.trim().toLowerCase() === "admin") {
          navigate("/admindashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch protected data using the token
  const fetchProtectedData = async (token) => {
    try {
      const response = await axios.get("https://ireporter-1-50ya.onrender.com/protected-endpoint", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Protected data:", response.data);
      setProtectedData(response.data);
    } catch (error) {
      console.error("Error fetching protected data:", error.response?.data || error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2 className="title">👁️ Reporter</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
        <p className="or-text">OR</p>
        <p className="signup-link">
          <Link to="/signup">Sign Up</Link>
        </p>
      </div>
      <div className="login-info">
        <h2 className="hero-text">
          Let’s build the Nation <span className="bold-text">together</span>
        </h2>
        <p>
          👁️ <span className="highlight">Reporter</span> is a platform for every citizen.
        </p>
      </div>
      {/* Optionally display protected data if available */}
      {protectedData && (
        <div className="protected-data">
          <h3>Protected Data</h3>
          <pre>{JSON.stringify(protectedData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Login;
