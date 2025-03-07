import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [redFlagTitle, setRedFlagTitle] = useState("");
  const [redFlagDescription, setRedFlagDescription] = useState("");
  const [redFlagMedia, setRedFlagMedia] = useState([]);
  const [interventionTitle, setInterventionTitle] = useState("");
  const [interventionDescription, setInterventionDescription] = useState("");
  const [interventionMedia, setInterventionMedia] = useState([]);
  const [error, setError] = useState("");

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

  const handleMediaUpload = async (files, reportId, isRedFlag) => {
    const endpoint = isRedFlag 
      ? `http://localhost:5000/redflags/${reportId}/media`
      : `http://localhost:5000/interventions/${reportId}/media`;

    try {
      await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload media");
        }
      }));
    } catch (error) {
      console.error("Media upload error:", error);
      throw error;
    }
  };

  const submitReport = async (isRedFlag) => {
    const baseUrl = isRedFlag ? "redflags" : "interventions";
    const title = isRedFlag ? redFlagTitle : interventionTitle;
    const description = isRedFlag ? redFlagDescription : interventionDescription;
    const media = isRedFlag ? redFlagMedia : interventionMedia;

    if (!title || !description || !latitude || !longitude) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      // Create report
      const reportResponse = await fetch(`http://localhost:5000/${baseUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          title,
          description,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      const reportData = await reportResponse.json();
      
      // Upload media files
      if (media.length > 0) {
        await handleMediaUpload(media, reportData.id, isRedFlag);
      }

      // Reset form
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
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-info">
          <span className="username">{username}</span>
        </div>
        <div className="dashboard-buttons">
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="report-sections">
        {/* Red Flag Section */}
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
              multiple
              onChange={(e) => setRedFlagMedia([...e.target.files])}
            />
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

        {/* Intervention Section */}
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
              multiple
              onChange={(e) => setInterventionMedia([...e.target.files])}
            />
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