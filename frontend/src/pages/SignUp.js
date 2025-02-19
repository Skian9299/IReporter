import React, { useState } from "react";
import "./SignUp.css";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    validatePasswords(e.target.value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validatePasswords(password, e.target.value);
  };

  const validatePasswords = (pass, confirmPass) => {
    if (confirmPass && pass !== confirmPass) {
      setError("Passwords do not match.");
    } else {
      setError("");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2 className="title">👁️ Reporter</h2>
        <p className="subtitle">Fill in the form to create an account</p>

        <form>
          <input type="text" placeholder="First Name" aria-label="First Name" required />
          <input type="text" placeholder="Last Name" aria-label="Last Name" required />
          <input type="email" placeholder="Email Address" aria-label="Email Address" required />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              aria-label="Password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              role="button"
              aria-label="Toggle Password Visibility"
            >
              {showPassword ? "👁️" : "🙈"}
            </span>
          </div>

          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              aria-label="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              role="button"
              aria-label="Toggle Confirm Password Visibility"
            >
              {showConfirmPassword ? "👁️" : "🙈"}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="signup-btn" disabled={error !== ""}>
            Sign Up
          </button>

          <p className="or-text">OR</p>
          <a href="/login" className="login-link">Login</a>
        </form>
      </div>

      <div className="signup-info">
        <h2 className="hero-text">
          Let’s build the Nation <span className="bold-text">together</span>
        </h2>
        <p>👁️ <span className="highlight">Reporter</span> is a platform for every citizen.</p>
      </div>
    </div>
  );
};

export default SignUp;
