import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [location, setLocation] = useState(localStorage.getItem("location") || "");
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  const [redFlagImage, setRedFlagImage] = useState(null);
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        localStorage.setItem("profileImage", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Report Image Upload
  const handleReportImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (type === "redFlag") {
        setRedFlagImage(file);
      } else if (type === "intervention") {
        setInterventionImage(file);
      }
    }
  };

  // Handle Location Input
  const handleLocationInput = () => {
    const userLocation = prompt("Enter your location (e.g., city, country):");
    if (userLocation) {
      setLocation(userLocation);
      localStorage.setItem("location", userLocation);
    }
  };

  // Submit Red Flag Report
  const submitRedFlag = async () => {
    if (!redFlagTitle || !redFlagDescription) {
      alert("Please fill in all fields for the red flag report.");
      return;
    }

    const formData = new FormData();
    formData.append("title", redFlagTitle);
    formData.append("description", redFlagDescription);
    formData.append("location", location);
    if (redFlagImage) {
      formData.append("image", redFlagImage);
    }

    try {
      const response = await fetch("https://ireporter-1-07fm.onrender.com/redflags", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Red flag report submitted successfully!");
        setRedFlagTitle("");
        setRedFlagDescription("");
        setRedFlagImage(null);
      } else {
        alert(data.error || "Failed to submit red flag report.");
      }
    } catch (error) {
      console.error("Error submitting red flag:", error);
      alert("An error occurred while submitting the red flag.");
    }
  };

  // Submit Intervention Report
  const submitIntervention = async () => {
    if (!interventionTitle || !interventionDescription) {
      alert("Please fill in all fields for the intervention report.");
      return;
    }

    const formData = new FormData();
    formData.append("title", interventionTitle);
    formData.append("description", interventionDescription);
    formData.append("location", location);
    if (interventionImage) {
      formData.append("image", interventionImage);
    }

    try {
      const response = await fetch("https://ireporter-1-07fm.onrender.com/interventions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Intervention report submitted successfully!");
        setInterventionTitle("");
        setInterventionDescription("");
        setInterventionImage(null);
      } else {
        alert(data.error || "Failed to submit intervention report.");
      }
    } catch (error) {
      console.error("Error submitting intervention:", error);
      alert("An error occurred while submitting the intervention.");
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
        <div className="user-info" onClick={() => document.getElementById("profileImageUpload").click()}>
          <input type="file" id="profileImageUpload" accept="image/*" hidden onChange={handleImageUpload} />
          <img src={profileImage || "default-avatar.png"} alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>

        <div className="dashboard-buttons">
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add report</button>
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
          <input type="text" placeholder="Title" value={redFlagTitle} onChange={(e) => setRedFlagTitle(e.target.value)} />
          <textarea placeholder="Report corruption..." value={redFlagDescription} onChange={(e) => setRedFlagDescription(e.target.value)} />

          <div className="report-actions">
            <input type="file" id="redFlagImageUpload" accept="image/*" hidden onChange={(e) => handleReportImageUpload(e, "redFlag")} />
            <button onClick={() => document.getElementById("redFlagImageUpload").click()}>📷 Upload</button>
            <button onClick={handleLocationInput}>📍 Location</button>
          </div>

          {redFlagImage && <img src={URL.createObjectURL(redFlagImage)} alt="Red Flag" className="report-image" />}
          <button className="report-btn" onClick={submitRedFlag}>Submit Report</button>
        </div>

        {/* INTERVENTION REPORT */}
        <div className="report-box intervention">
          <h3>Intervention</h3>
          <input type="text" placeholder="Title" value={interventionTitle} onChange={(e) => setInterventionTitle(e.target.value)} />
          <textarea placeholder="Report an issue needing government intervention..." value={interventionDescription} onChange={(e) => setInterventionDescription(e.target.value)} />

          <div className="report-actions">
            <input type="file" id="interventionImageUpload" accept="image/*" hidden onChange={(e) => handleReportImageUpload(e, "intervention")} />
            <button onClick={() => document.getElementById("interventionImageUpload").click()}>📷 Upload</button>
            <button onClick={handleLocationInput}>📍 Location</button>
          </div>

          {interventionImage && <img src={URL.createObjectURL(interventionImage)} alt="Intervention" className="report-image" />}
          <button className="report-btn" onClick={submitIntervention}>Submit Report</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;