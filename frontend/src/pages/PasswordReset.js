import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PasswordReset.css";

const PasswordReset = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("https://ireporter-2-6rr9.onrender.com/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          new_password: password, 
          confirm_password: confirmPassword 
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || "Password changed successfully!");
        setError("");
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || data.message || "Something went wrong.");
      }
    } catch (error) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-card">
        <h2>Change your password</h2>
        <p>Enter your email and a new password to change your password</p>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">CHANGE PASSWORD</button>
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;
