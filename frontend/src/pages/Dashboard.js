import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  const [redFlagMedia, setRedFlagMedia] = useState([]);
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
  const [interventionMedia, setInterventionMedia] = useState([]);
  const [error, setError] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle Profile Image Upload (Keep original UI)
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

  // Updated location handling
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          setError("Unable to fetch location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Updated media handling for multiple files
  const handleReportMediaUpload = (event, isRedFlag) => {
    const files = Array.from(event.target.files);
    if (isRedFlag) {
      setRedFlagMedia([...redFlagMedia, ...files]);
    } else {
      setInterventionMedia([...interventionMedia, ...files]);
    }
  };

  // Unified submit function
  const submitReport = async (isRedFlag) => {
    const baseUrl = isRedFlag ? "redflags" : "interventions";
    const title = isRedFlag ? redFlagTitle : interventionTitle;
    const description = isRedFlag ? redFlagDescription : interventionDescription;
    const media = isRedFlag ? redFlagMedia : interventionMedia;
  
    if (!title || !description || !latitude || !longitude) {
      setError("Please fill in all required fields");
      return;
    }
    
  
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
  
    if (isNaN(lat) || isNaN(lon)) {
      setError("Invalid location data. Please fetch location again.");
      return;
    }
  
    // Debugging: Log the request payload
    console.log("Submitting report with payload:", {
      title,
      description,
      latitude: lat,
      longitude: lon,
    });
  
    try {
      const reportResponse = await fetch(`http://localhost:5000/${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          description,
          latitude: lat,
          longitude: lon,
        }),
      });
  
      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        console.error("Backend Error:", errorData);
        throw new Error(errorData.message || "Failed to submit report");
      }
  
      const reportData = await reportResponse.json();
      console.log("Report submitted successfully:", reportData);
      
      // Handle media uploads (if applicable)
      if (media.length > 0) {
        const formData = new FormData();
        media.forEach((file) => formData.append(`file`, file));
  
        const mediaResponse = await fetch(`http://localhost:5000/${baseUrl}/${reportData.id}/media`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });
  
        if (!mediaResponse.ok) {
          const mediaErrorData = await mediaResponse.json();
          console.error("Media Upload Error:", mediaErrorData);
        }
      }
  
      // Reset form fields
      if (isRedFlag) {
        setRedFlagTitle("");
        setRedFlagDescription("");
        setRedFlagMedia([]);
      } else {
        setInterventionTitle("");
        setInterventionDescription("");
        setInterventionMedia([]);
      }
  
      setError("");
      alert("Report submitted successfully!");
    } catch (error) {
      setError(error.message);
      console.error("Error submitting report:", error.message);
    }
  };
  

  // Handle Logout (Keep original UI)
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION - Keep original UI */}
      <div className="dashboard-header">
        <div className="user-info" onClick={() => document.getElementById("profileImageUpload").click()}>
          <input type="file" id="profileImageUpload" accept="image/*" hidden onChange={handleImageUpload} />
          <img src={profileImage || "default-avatar.png"} alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>

        <div className="dashboard-buttons">
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>All Reports</button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* REPORT SECTION - Keep original UI structure */}
      <div className="report-sections">
        {/* RED FLAG REPORT */}
        <div className="report-box red-flag">
          <h3>Red Flag</h3>
          <input 
            type="text" 
            placeholder="Title" 
            value={redFlagTitle} 
            onChange={(e) => setRedFlagTitle(e.target.value)} 
          />
          <textarea 
            placeholder="Report corruption..." 
            value={redFlagDescription} 
            onChange={(e) => setRedFlagDescription(e.target.value)} 
          />

          <div className="report-actions">
            <input 
              type="file" 
              id="redFlagMediaUpload" 
              multiple 
              accept="image/*, video/*" 
              hidden 
              onChange={(e) => handleReportMediaUpload(e, true)} 
            />
            <button onClick={() => document.getElementById("redFlagMediaUpload").click()}>
              📷 Upload Media
            </button>
            <button onClick={fetchLocation}>📍 Get Location</button>
          </div>

          <div className="location-info">
            {latitude && longitude && (
              <>
                <p><strong>Latitude:</strong> {latitude}</p>
                <p><strong>Longitude:</strong> {longitude}</p>
              </>
            )}
          </div>

          <button 
            className="report-btn" 
            onClick={() => submitReport(true)}
          >
            Submit Red Flag
          </button>
        </div>

        {/* INTERVENTION REPORT */}
        <div className="report-box intervention">
          <h3>Intervention</h3>
          <input 
            type="text" 
            placeholder="Title" 
            value={interventionTitle} 
            onChange={(e) => setInterventionTitle(e.target.value)} 
          />
          <textarea 
            placeholder="Report an issue needing government intervention..." 
            value={interventionDescription} 
            onChange={(e) => setInterventionDescription(e.target.value)} 
          />

          <div className="report-actions">
            <input 
              type="file" 
              id="interventionMediaUpload" 
              multiple 
              accept="image/*, video/*" 
              hidden 
              onChange={(e) => handleReportMediaUpload(e, false)} 
            />
            <button onClick={() => document.getElementById("interventionMediaUpload").click()}>
              📷 Upload Media
            </button>
            <button onClick={fetchLocation}>📍 Get Location</button>
          </div>

          <div className="location-info">
            {latitude && longitude && (
              <>
                <p><strong>Latitude:</strong> {latitude}</p>
                <p><strong>Longitude:</strong> {longitude}</p>
              </>
            )}
          </div>

          <button 
            className="report-btn" 
            onClick={() => submitReport(false)}
          >
            Submit Intervention
          </button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Dashboard;