import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import AllReports from "./pages/AllReports";
import AdminDashboard from "./pages/AdminDashboard";
import PasswordReset from "./pages/PasswordReset";

function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/admindashboard"; 

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports" element={<AllReports />} />
        <Route path="/admindashboard" element={<AdminDashboard />} />
        <Route path="/forgot-password" element={<PasswordReset />} />
        <Route path="/admin-forgot-password" element={<PasswordReset />} />
        

      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
