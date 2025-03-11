import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  const [redFlagImageUrl, setRedFlagImageUrl] = useState("");
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
  const [interventionImageUrl, setInterventionImageUrl] = useState("");
  const [error, setError] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [userLocation, setUserLocation] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
    } else {
      navigate("/login");
    }
  }, [navigate]);

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
            if (data?.address) {
              const placeName = data.address.city || data.address.town || data.address.village || "Unknown Location";
              setUserLocation(placeName);
              localStorage.setItem("location", placeName);
            } else {
              setUserLocation("Unknown Location");
            }
          } catch (error) {
            console.error("Error fetching location name:", error);
            setUserLocation("Unknown Location");
          }

          localStorage.setItem("latitude", lat);
          localStorage.setItem("longitude", lon);
          setShowLocation(true);
        },
        (error) => {
          setError("Unable to fetch location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  const submitRedFlag = async () => {
    try {
      const response = await fetch("https://ireporter-2-6rr9.onrender.com/redflags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title: redFlagTitle,
          description: redFlagDescription,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location: userLocation,
          image_url: redFlagImageUrl
        }),
      });
  
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${responseText}`);
      }
  
      const data = JSON.parse(responseText);
      // Handle success...
  
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message);
    }
  };

  const submitIntervention = async () => {
    if (!interventionTitle || !interventionDescription || !userLocation || !latitude || !longitude) {
      setError("Please fill in all required fields for the intervention report.");
      return;
    }
  
    const reportData = {
      title: interventionTitle,
      description: interventionDescription,
      location: userLocation,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      image_url: interventionImageUrl
    };
  
    try {
      const response = await fetch("https://ireporter-2-6rr9.onrender.com/interventions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: 'include', 
        body: JSON.stringify(reportData),
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
      setError(error.message);
      console.error("Error submitting report:", error);
    }
  };
  

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
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

      <div className="report-sections">
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
          <input
            type="text"
            placeholder="Image URL"
            value={redFlagImageUrl}
            onChange={(e) => setRedFlagImageUrl(e.target.value)}
            className="image-url-input"
          />

          <div className="report-actions">
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>

          {showLocation && (
            <div className="location-info">
              <p><strong>Location:</strong> {userLocation}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}

          {redFlagImageUrl && <img src={redFlagImageUrl} alt="Red Flag" className="report-image" />}
          <button className="report-btn" onClick={submitRedFlag}>Submit Report</button>
        </div>

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
          <input
            type="text"
            placeholder="Image URL"
            value={interventionImageUrl}
            onChange={(e) => setInterventionImageUrl(e.target.value)}
            className="image-url-input"
          />

          <div className="report-actions">
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>

          {showLocation && (
            <div className="location-info">
              <p><strong>Location:</strong> {userLocation}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}

          {interventionImageUrl && <img src={interventionImageUrl} alt="Intervention" className="report-image" />}
          <button className="report-btn" onClick={submitIntervention}>Submit Report</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Dashboard;