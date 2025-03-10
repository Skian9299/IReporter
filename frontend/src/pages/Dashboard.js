import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [profileImage, setProfileImage] = useState(localStorage.getItem("profileImage") || null);
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  const [redFlagImage, setRedFlagImage] = useState(null);
  const [redFlagVideo, setRedFlagVideo] = useState(null);
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
  const [interventionImage, setInterventionImage] = useState(null);
  const [interventionVideo, setInterventionVideo] = useState(null);
  const [error, setError] = useState("");
  const [showLocation, setShowLocation] = useState(false); // State to toggle location visibility

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

  // Handle Report Image/Video Upload
  const handleReportFileUpload = (event, type, fileType) => {
    const file = event.target.files[0];
    if (file) {
      if (type === "redFlag") {
        if (fileType === "image") {
          setRedFlagImage(file);
        } else if (fileType === "video") {
          setRedFlagVideo(file);
        }
      } else if (type === "intervention") {
        if (fileType === "image") {
          setInterventionImage(file);
        } else if (fileType === "video") {
          setInterventionVideo(file);
        }
      }
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
            // Reverse geocoding to get location name
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
          setShowLocation(true); // Show location details
        },
        (error) => {
          setError("Unable to fetch location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  // Submit Red Flag Report
  const submitRedFlag = async () => {
    if (!redFlagTitle || !redFlagDescription || !location || !latitude || !longitude) {
      setError("Please fill in all required fields for the red flag report.");
      return;
    }

    const formData = new FormData();
    formData.append("title", redFlagTitle);
    formData.append("description", redFlagDescription);
    formData.append("location", location);
    formData.append("latitude", parseFloat(latitude));
    formData.append("longitude", parseFloat(longitude));

    if (redFlagImage) {
      formData.append("image", redFlagImage);
    }
    if (redFlagVideo) {
      formData.append("video", redFlagVideo);
    }

    try {
      const reportResponse = await fetch(`http://localhost:5000/${baseUrl}`, {
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
        setRedFlagVideo(null);
        setError("");
      } else {
        setError(data.error || "Failed to submit red flag report.");
      }
    } catch (error) {
      console.error("Error submitting red flag:", error);
      setError("An error occurred while submitting the red flag.");
    }
  };

  // Submit Intervention Report
  const submitIntervention = async () => {
    if (!interventionTitle || !interventionDescription || !location || !latitude || !longitude) {
      setError("Please fill in all required fields for the intervention report.");
      return;
    }

    const formData = new FormData();
    formData.append("title", interventionTitle);
    formData.append("description", interventionDescription);
    formData.append("location", location);
    formData.append("latitude", parseFloat(latitude));
    formData.append("longitude", parseFloat(longitude));
    if (interventionImage) {
      formData.append("image", interventionImage);
    }
    if (interventionVideo) {
      formData.append("video", interventionVideo);
    }


    try {
      const response = await fetch("http://localhost:5000/interventions", {
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
        setInterventionVideo(null);
        setError("");
      } else {
        setError(data.error || "Failed to submit intervention report.");
      }
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
          <input type="text" placeholder="Title" value={redFlagTitle} onChange={(e) => setRedFlagTitle(e.target.value)} />
          <textarea placeholder="Report corruption..." value={redFlagDescription} onChange={(e) => setRedFlagDescription(e.target.value)} />

          <div className="report-actions">
            <input type="file" id="redFlagImageUpload" accept="image/*" hidden onChange={(e) => handleReportFileUpload(e, "redFlag", "image")} />
            <button onClick={() => document.getElementById("redFlagImageUpload").click()}>📷 Upload Image</button>
            <input type="file" id="redFlagVideoUpload" accept="video/*" hidden onChange={(e) => handleReportFileUpload(e, "redFlag", "video")} />
            <button onClick={() => document.getElementById("redFlagVideoUpload").click()}>🎥 Upload Video</button>
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>

          {showLocation && ( // Toggle visibility of location, latitude, and longitude
            <div className="location-info">
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}

          {redFlagImage && <img src={URL.createObjectURL(redFlagImage)} alt="Red Flag" className="report-image" />}
          {redFlagVideo && <video src={URL.createObjectURL(redFlagVideo)} controls className="report-video" />}
          <button className="report-btn" onClick={submitRedFlag}>Submit Report</button>
        </div>

        {/* INTERVENTION REPORT */}
        <div className="report-box intervention">
          <h3>Intervention</h3>
          <input type="text" placeholder="Title" value={interventionTitle} onChange={(e) => setInterventionTitle(e.target.value)} />
          <textarea placeholder="Report an issue needing government intervention..." value={interventionDescription} onChange={(e) => setInterventionDescription(e.target.value)} />

          <div className="report-actions">
            <input type="file" id="interventionImageUpload" accept="image/*" hidden onChange={(e) => handleReportFileUpload(e, "intervention", "image")} />
            <button onClick={() => document.getElementById("interventionImageUpload").click()}>📷 Upload Image</button>
            <input type="file" id="interventionVideoUpload" accept="video/*" hidden onChange={(e) => handleReportFileUpload(e, "intervention", "video")} />
            <button onClick={() => document.getElementById("interventionVideoUpload").click()}>🎥 Upload Video</button>
            <button onClick={fetchLocation}>📍 Fetch Location</button>
          </div>

          {showLocation && ( // Toggle visibility of location, latitude, and longitude
            <div className="location-info">
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Latitude:</strong> {latitude}</p>
              <p><strong>Longitude:</strong> {longitude}</p>
            </div>
          )}

          {interventionImage && <img src={URL.createObjectURL(interventionImage)} alt="Intervention" className="report-image" />}
          {interventionVideo && <video src={URL.createObjectURL(interventionVideo)} controls className="report-video" />}
          <button className="report-btn" onClick={submitIntervention}>Submit Report</button>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Dashboard;
