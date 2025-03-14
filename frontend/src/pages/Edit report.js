import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./EditReport.css";

const EditReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search } = useLocation();
  const type = new URLSearchParams(search).get("type");
  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    location: ""
  });
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://ireporter-1-50ya.onrender.com/${type}s/${id}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          }
        );

        if (response.data.status !== 'draft') {
          setError("Only draft reports can be edited");
          return;
        }

        setReport(response.data);
        setFormData({
          title: response.data.title,
          description: response.data.description,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          location: response.data.location
        });
        setMedia(response.data.media || []);
      } catch (error) {
        setError(error.response?.data?.error || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        location: formData.location
      };

      const response = await axios.patch(
        `https://ireporter-1-50ya.onrender.com/${type}s/${id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      if (response.status === 200) {
        alert("Report updated successfully!");
        navigate("/reports");
      }
    } catch (error) {
      setError(error.response?.data?.error || "Failed to update report");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append("media", file));

      const response = await axios.post(
        `https://ireporter-1-50ya.onrender.com/${type}s/${id}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setMedia(prev => [...prev, ...response.data]);
    } catch (error) {
      setError(error.response?.data?.error || "Media upload failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          setFormData(prev => ({
            ...prev,
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            location: response.data.display_name || "Unknown location"
          }));
        } catch (error) {
          setError("Failed to fetch location details");
        }
      },
      (error) => setError("Please enable location services to continue")
    );
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!window.confirm("Are you sure you want to delete this media?")) return;
    
    try {
      await axios.delete(
        `https://ireporter-1-50ya.onrender.com/${type}s/${id}/media/${mediaId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (error) {
      setError(error.response?.data?.error || "Failed to delete media");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!report) return null;

  return (
    <div className="edit-report-container">
      <div className="report-card">
        <h2>Edit {type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <label>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>

          <div className="form-section">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              required
            />
          </div>

          <div className="location-section">
            <div className="location-header">
              <h3>Location</h3>
              <button type="button" onClick={fetchCurrentLocation}>
                Use Current Location
              </button>
            </div>
            <div className="coordinates">
              <div>
                <label>Latitude</label>
                <input
                  type="number"
                  value={formData.latitude}
                  onChange={(e) => setFormData(p => ({ ...p, latitude: e.target.value }))}
                  step="any"
                  required
                />
              </div>
              <div>
                <label>Longitude</label>
                <input
                  type="number"
                  value={formData.longitude}
                  onChange={(e) => setFormData(p => ({ ...p, longitude: e.target.value }))}
                  step="any"
                  required
                />
              </div>
              <div>
                <label>Location Name</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="media-section">
            <h3>Media Attachments</h3>
            <div className="media-grid">
              {media.map((item) => (
                <div key={item.id} className="media-item">
                  {item.file_url.includes('image') ? (
                    <>
                      <img src={item.file_url} alt="Attachment" />
                      <button 
                        className="delete-media"
                        onClick={() => handleDeleteMedia(item.id)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <video controls>
                        <source src={item.file_url} />
                      </video>
                      <button
                        className="delete-media"
                        onClick={() => handleDeleteMedia(item.id)}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="media-upload">
              <input
                type="file"
                multiple
                onChange={handleMediaUpload}
                accept="image/*, video/*"
                id="media-upload"
              />
              <label htmlFor="media-upload" className="upload-button">
                Upload New Media
              </label>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate("/reports")}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReport;