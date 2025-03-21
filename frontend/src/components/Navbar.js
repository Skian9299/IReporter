import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  console.log("Navbar is rendering...");

  return (
    <nav className="navbar">
      <div className="logo">👁️ Reporter</div>
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/signup">SignUp</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
};

export default Navbar;
