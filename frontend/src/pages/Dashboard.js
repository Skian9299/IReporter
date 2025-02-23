import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(null);
  const [location, setLocation] = useState("");

  useEffect(() => {
    // Fetch user info from localStorage or API
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUsername(storedUser.name);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle Image Upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfileImage(imageURL);
    }
  };

  // Open File Input
  const openFileInput = () => {
    document.getElementById("imageUpload").click();
  };

  // Handle Location Input
  const handleLocationInput = () => {
    const userLocation = prompt("Enter your location (e.g., city, country):");
    if (userLocation) {
      setLocation(userLocation);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <img
            src={profileImage || "default-avatar.png"} // Default avatar
            alt="Profile"
            className="profile-pic"
          />
          <span className="username">{username}</span>
        </div>

        <div className="dashboard-buttons">
          <button className="add-report">Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>All Reports</button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="report-sections">
        <div className="report-box red-flag">
          <h3>Red Flag</h3>
          <input type="text" placeholder="Edit Title" />
          <p>Report any form of corruption going on around you...</p>
          <input type="file" id="imageUpload" accept="image/*" hidden onChange={handleImageUpload} />
          <button onClick={openFileInput}>📷</button>
          <button onClick={handleLocationInput}>📍</button>
          <button className="report-btn">Report</button>
        </div>

        <div className="report-box intervention">
          <h3>Intervention</h3>
          <input type="text" placeholder="Edit Title" />
          <p>Report on things that need government intervention...</p>
          <button onClick={openFileInput}>📷</button>
          <button onClick={handleLocationInput}>📍</button>
          <button className="report-btn">Report</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
