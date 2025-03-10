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
  const [reportType, setReportType] = useState("redflag"); // Default selection
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
            const placeName = data.address?.city || data.address?.town || data.address?.village || "Unknown Location";
            setLocation(placeName);
            localStorage.setItem("location", placeName);
          } catch (error) {
            setLocation("Unknown Location");
          }
          setShowLocation(true);
        },
        () => setError("Unable to fetch location. Please enter it manually.")
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const submitReport = async () => {
    if (!title || !description || !location || !latitude || !longitude) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload = {
      title,
      description,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image_url: imageUrl,
    };

    const endpoint = reportType === "redflags" ? "redflags" : "interventions";

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
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
        alert(`${reportType === "redflag" ? "Red Flag" : "Intervention"} submitted successfully!`);
        setTitle("");
        setDescription("");
        setImageUrl("");
        setError("");
      } else {
        setError(data.error || "Failed to submit report.");
      }
    } catch (error) {
      setError("An error occurred while submitting the report.");
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <div className="dashboard-header">
        <div className="user-info">
          <img src={profileImage || "default-avatar.png"} alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>
        <div className="dashboard-buttons">
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>All Reports</button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="report-box">
        <h3>Submit a Report</h3>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="redflags">Red Flag</option>
          <option value="intervention">Intervention</option>
        </select>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <button onClick={fetchLocation}>📍 Fetch Location</button>
        {showLocation && (
          <div className="location-info">
            <p><strong>Location:</strong> {location}</p>
            <p><strong>Latitude:</strong> {latitude}</p>
            <p><strong>Longitude:</strong> {longitude}</p>
          </div>
        )}
        <button className="report-btn" onClick={submitReport}>Submit Report</button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default Dashboard;
