import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [reportType, setReportType] = useState("redflags");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!token || !user) {
        navigate("/login");
        return;
      }
      
      try {
        const response = await axios.get("https://ireporter-1-50ya.onrender.com/auth/email", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsername(`${user.first_name} ${user.last_name}`);
      } catch (error) {
        localStorage.clear();
        navigate("/login");
      }
    };

    verifyAuth();
  }, [navigate]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const address = response.data.address;
          const locationName = [
            address.road,
            address.city,
            address.state,
            address.country
          ].filter(Boolean).join(", ");

          setLocation(locationName);
          setCoordinates({ lat: latitude, lng: longitude });
          setError("");
        } catch (error) {
          setError("Failed to fetch location details");
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError("Please enable location services to continue");
        setLoading(false);
      }
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.title || !formData.description || !coordinates.lat || !coordinates.lng) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("description", formData.description);
    payload.append("location", location);
    payload.append("latitude", coordinates.lat);
    payload.append("longitude", coordinates.lng);
    if (formData.image) payload.append("image", formData.image);

    try {
      const endpoint = reportType === "redflags" ? "redflags" : "interventions";
      const response = await axios.post(
        `https://ireporter-1-50ya.onrender.com/${endpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.status === 201) {
        setFormData({ title: "", description: "", image: null });
        setCoordinates({ lat: null, lng: null });
        setLocation("");
        alert(`Report submitted successfully! ID: ${response.data.id}`);
      }
    } catch (error) {
      setError(error.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="user-info">
          <span className="username">{username}</span>
          <div className="header-actions">
            <button onClick={() => navigate("/reports")}>View Reports</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="report-form-container">
        <h2>Submit New Report</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              required
            >
              <option value="redflags">Red Flag</option>
              <option value="interventions">Intervention</option>
            </select>
          </div>

          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Attach Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>

          <div className="location-section">
            <button
              type="button"
              onClick={handleGeolocation}
              disabled={loading}
              className="location-btn"
            >
              {loading ? "Fetching Location..." : "📍 Auto-Detect Location"}
            </button>
            
            {coordinates.lat && (
              <div className="coordinates-display">
                <p>Location: {location || "Unknown area"}</p>
                <p>Latitude: {coordinates.lat?.toFixed(6)}</p>
                <p>Longitude: {coordinates.lng?.toFixed(6)}</p>
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default Dashboard;