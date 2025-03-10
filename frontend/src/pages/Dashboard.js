import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [location, setLocation] = useState(localStorage.getItem("location") || "");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  // For red flag report, use a text input for image URL
  const [redFlagImageUrl, setRedFlagImageUrl] = useState("");
  // For intervention, use a text input for image URL instead of file uploads
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
  const [interventionImageUrl, setInterventionImageUrl] = useState("");
  const [error, setError] = useState("");
  const [showLocation, setShowLocation] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Handle Profile Image Upload (for the user profile)
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

  // Fetch User's Current Location
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.address) {
              const placeName = data.address.city || data.address.town || data.address.village || "Unknown Location";
              setLocation(placeName);
              localStorage.setItem("location", placeName);
            } else {
              setLocation("Unknown Location");
            }
          } catch (error) {
            console.error("Error fetching location name:", error);
            setLocation("Unknown Location");
          }
          localStorage.setItem("latitude", lat);
          localStorage.setItem("longitude", lon);
          setShowLocation(true);
        },
        (error) => {
          setError("Unable to fetch location. Please enter it manually.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Submit Red Flag Report using JSON
  const submitRedFlag = async () => {
    if (!redFlagTitle || !redFlagDescription || !location || !latitude || !longitude) {
      setError("Please fill in all required fields for the red flag report.");
      return;
    }

    const payload = {
      title: redFlagTitle,
      description: redFlagDescription,
      location: location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image_url: redFlagImageUrl
    };

    try {
      const response = await fetch("http://localhost:5000/redflags", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const data = await response.json();
      if (response.ok) {
        alert("Red flag report submitted successfully!");
        setRedFlagTitle("");
        setRedFlagDescription("");
        setRedFlagImageUrl("");
        setError("");
      } else {
        setError(data.error || "Failed to submit red flag report.");
      }
    } catch (error) {
      console.error("Error submitting red flag:", error);
      setError("An error occurred while submitting the red flag.");
    }
  };

  // Submit Intervention Report using JSON
  const submitIntervention = async () => {
    if (!interventionTitle || !interventionDescription || !location || !latitude || !longitude) {
      setError("Please fill in all required fields for the intervention report.");
      return;
    }

    const payload = {
      title: interventionTitle,
      description: interventionDescription,
      location: location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image_url: interventionImageUrl
    };

    try {
      const response = await fetch("http://127.0.0.1:5000/interventions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        alert("Intervention report submitted successfully!");
        setInterventionTitle("");
        setInterventionDescription("");
        setInterventionImageUrl("");
        setError("");
      } else {
        setError(data.error || "Failed to submit intervention report.");
      }
    } catch (error) {
      console.error("Error submitting intervention:", error);
      setError("An error occurred while submitting the intervention.");
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
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>All Reports</button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* REPORT SECTION */}
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
            placeholder="Describe the issue..."
            value={redFlagDescription}
            onChange={(e) => setRedFlagDescription(e.target.value)}
          />
          {/* Input for the image URL */}
          <input
            type="text"
            placeholder="Image URL"
            value={redFlagImageUrl}
            onChange={(e) => setRedFlagImageUrl(e.target.value)}
          />
          <div className="report-actions">
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>
          {showLocation && (
            <div className="location-info">
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}
          <button className="report-btn" onClick={submitRedFlag}>Submit Report</button>
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
          {/* New input for the image URL */}
          <input
            type="text"
            placeholder="Image URL"
            value={interventionImageUrl}
            onChange={(e) => setInterventionImageUrl(e.target.value)}
          />
          <div className="report-actions">
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>
          {showLocation && (
            <div className="location-info">
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}
          <button className="report-btn" onClick={submitIntervention}>Submit Report</button>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Dashboard;
