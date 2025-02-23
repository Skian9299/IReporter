// import React, { useState } from "react";
// import "./SignUp.css";

// const SignUp = () => {
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [error, setError] = useState("");

//   const handlePasswordChange = (e) => {
//     setPassword(e.target.value);
//     validatePasswords(e.target.value, confirmPassword);
//   };

//   const handleConfirmPasswordChange = (e) => {
//     setConfirmPassword(e.target.value);
//     validatePasswords(password, e.target.value);
//   };

//   const validatePasswords = (pass, confirmPass) => {
//     if (confirmPass && pass !== confirmPass) {
//       setError("Passwords do not match.");
//     } else {
//       setError("");
//     }
//   };

//   return (
//     <div className="signup-container">
//       <div className="signup-form">
//         <h2 className="title">👁️ Reporter</h2>
//         <p className="subtitle">Fill in the form to create an account</p>

//         <form>
//           <input type="text" placeholder="First Name" aria-label="First Name" required />
//           <input type="text" placeholder="Last Name" aria-label="Last Name" required />
//           <input type="email" placeholder="Email Address" aria-label="Email Address" required />

//           <div className="password-field">
//             <input
//               type={showPassword ? "text" : "password"}
//               placeholder="Enter your password"
//               aria-label="Password"
//               value={password}
//               onChange={handlePasswordChange}
//               required
//             />
//             <span
//               className="toggle-password"
//               onClick={() => setShowPassword(!showPassword)}
//               role="button"
//               aria-label="Toggle Password Visibility"
//             >
//               {showPassword ? "👁️" : "🙈"}
//             </span>
//           </div>

//           <div className="password-field">
//             <input
//               type={showConfirmPassword ? "text" : "password"}
//               placeholder="Confirm your password"
//               aria-label="Confirm Password"
//               value={confirmPassword}
//               onChange={handleConfirmPasswordChange}
//               required
//             />
//             <span
//               className="toggle-password"
//               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//               role="button"
//               aria-label="Toggle Confirm Password Visibility"
//             >
//               {showConfirmPassword ? "👁️" : "🙈"}
//             </span>
//           </div>

//           {error && <p className="error-text">{error}</p>}

//           <button type="submit" className="signup-btn" disabled={error !== ""}>
//             Sign Up
//           </button>

//           <p className="or-text">OR</p>
//           <a href="/login" className="login-link">Login</a>
//         </form>
//       </div>

//       <div className="signup-info">
//         <h2 className="hero-text">
//           Let’s build the Nation <span className="bold-text">together</span>
//         </h2>
//         <p>👁️ <span className="highlight">Reporter</span> is a platform for every citizen.</p>
//       </div>
//     </div>
//   );
// };

// export default SignUp;


import React, { useState } from "react";
import axios from "axios";
import "./SignUp.css";

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "password" || e.target.name === "confirmPassword") {
      validatePasswords(
        e.target.name === "password" ? e.target.value : formData.password,
        e.target.name === "confirmPassword" ? e.target.value : formData.confirmPassword
      );
    }
  };

  // Validate password match
  const validatePasswords = (pass, confirmPass) => {
    if (confirmPass && pass !== confirmPass) {
      setError("Passwords do not match.");
    } else {
      setError("");
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post("https://your-backend-url/api/auth/signup", formData);
      setSuccessMessage(response.data.message || "Sign-up successful! Please log in.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2 className="title">👁️ Reporter</h2>
        <p className="subtitle">Fill in the form to create an account</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
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

          <div className="password-field">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              role="button"
            >
              {showConfirmPassword ? "👁️" : "🙈"}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}
          {successMessage && <p className="success-text">{successMessage}</p>}

          <button type="submit" className="signup-btn" disabled={error !== "" || loading}>
            {loading ? "Signing Up..." : "Sign Up"}
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
