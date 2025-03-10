import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./EditReport.css";

const EditReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search } = useLocation();
  const type = new URLSearchParams(search).get("type");
  const [report, setReport] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [media, setMedia] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/${type}s/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) throw new Error("Failed to fetch report");
        
        const data = await response.json();
        if (data.status !== 'draft') {
          setError("This report can no longer be edited");
          return;
        }

        setReport(data);
        setTitle(data.title);
        setDescription(data.description);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setMedia(data.media || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Title and description are required");
      return;
    }

    try {
      setLoading(true);
      // Update main report details
      const updateResponse = await fetch(`http://localhost:5000/${type}s/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (!updateResponse.ok) throw new Error("Failed to update report");

      // Update location if changed
      if (latitude !== report.latitude || longitude !== report.longitude) {
        const locationResponse = await fetch(`http://localhost:5000/${type}s/${id}/location`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        });
        
        if (!locationResponse.ok) throw new Error("Failed to update location");
      }

      alert("Report updated successfully!");
      navigate("/reports");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setLoading(true);
      const formData = new FormData();
      files.forEach(file => formData.append("file", file));

      const response = await fetch(`http://localhost:5000/${type}s/${id}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Media upload failed");
      
      const newMedia = await response.json();
      setMedia(prev => [...prev, ...newMedia]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      },
      error => setError("Failed to get current location")
    );
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-report-container">
      <div className="report-card">
        <h2>Edit {type.charAt(0).toUpperCase() + type.slice(1)} Report</h2>
        
        <div className="card-content">
          <div className="form-section">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  step="any"
                />
              </div>
              <div>
                <label>Longitude</label>
                <input
                  type="number"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  step="any"
                />
              </div>
            </div>
          </div>

          <div className="media-section">
            <h3>Media Attachments</h3>
            <div className="media-grid">
              {media.map((item) => (
                <div key={item.id} className="media-item">
                  {item.media_type === 'image' ? (
                    <img src={`http://localhost:5000/uploads/${item.file_url}`} alt="Attachment" />
                  ) : (
                    <video controls>
                      <source src={`http://localhost:5000/uploads/${item.file_url}`} />
                    </video>
                  )}
                </div>
              ))}
            </div>
            <input
              type="file"
              multiple
              onChange={handleMediaUpload}
              accept="image/*, video/*"
            />
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
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditReport;