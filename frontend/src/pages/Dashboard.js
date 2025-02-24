import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [location, setLocation] = useState(localStorage.getItem("location") || "");
  const [redFlagImage, setRedFlagImage] = useState(null);
  const [interventionImage, setInterventionImage] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle Profile Image Upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setProfileImage(imageURL);
      localStorage.setItem("profileImage", imageURL);
    }
  };

  // Handle Red Flag & Intervention Image Upload
  const handleReportImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      if (type === "redFlag") {
        setRedFlagImage(imageURL);
      } else if (type === "intervention") {
        setInterventionImage(imageURL);
      }
    }
  };

  // Open File Input for Profile
  const openProfileImageInput = () => {
    document.getElementById("profileImageUpload").click();
  };

  // Handle Location Input
  const handleLocationInput = () => {
    const userLocation = prompt("Enter your location (e.g., city, country):");
    if (userLocation) {
      setLocation(userLocation);
      localStorage.setItem("location", userLocation);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <div className="dashboard-header">
        <div className="user-info" onClick={openProfileImageInput}>
          <input
            type="file"
            id="profileImageUpload"
            accept="image/*"
            hidden
            onChange={handleImageUpload}
          />
          <img
            src={profileImage || "default-avatar.png"}
            alt="Profile"
            className="profile-pic"
          />
          <span className="username">{username}</span>
        </div>

        <div className="dashboard-buttons">
          <button className="add-report">Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>
            All Reports
          </button>
          <button className="logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>

      {/* REPORT SECTION */}
      <div className="report-sections">
        {/* RED FLAG REPORT */}
        <div className="report-box red-flag">
          <h3>Red Flag</h3>
          <input type="text" placeholder="Edit Title" className="title-input" />
          <textarea placeholder="Report any form of corruption..." className="report-textarea"></textarea>
          
          <div className="report-actions">
            <input
              type="file"
              id="redFlagImageUpload"
              accept="image/*"
              hidden
              onChange={(e) => handleReportImageUpload(e, "redFlag")}
            />

            <button onClick={() => document.getElementById("redFlagImageUpload").click()} className="action-btn">
              📷 Upload
            </button>
            <button onClick={handleLocationInput} className="action-btn">
              📍 Location
            </button>
          </div>

          {/* Image Preview */}
          {redFlagImage && <img src={redFlagImage} alt="Red Flag" className="report-image" />}

          <button className="report-btn">Submit Report</button>
        </div>

        {/* INTERVENTION REPORT */}
        <div className="report-box intervention">
          <h3>Intervention</h3>
          <input type="text" placeholder="Edit Title" className="title-input" />
          <textarea placeholder="Report on things that need government intervention..." className="report-textarea"></textarea>
          
          <div className="report-actions">
            <input
              type="file"
              id="interventionImageUpload"
              accept="image/*"
              hidden
              onChange={(e) => handleReportImageUpload(e, "intervention")}
            />

            <button onClick={() => document.getElementById("interventionImageUpload").click()} className="action-btn">
              📷 Upload
            </button>
            <button onClick={handleLocationInput} className="action-btn">
              📍 Location
            </button>
          </div>

          {/* Image Preview */}
          {interventionImage && <img src={interventionImage} alt="Intervention" className="report-image" />}

          <button className="report-btn">Submit Report</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


