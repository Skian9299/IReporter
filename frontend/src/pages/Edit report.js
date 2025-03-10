import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./EditReport.css";

const EditReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search } = useLocation();
  const type = new URLSearchParams(search).get("type");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    image_url: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch(`https://ireporter-2-6rr9.onrender.com/${type}s/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (!response.ok) throw new Error("Failed to fetch report");
        
        const data = await response.json();
        setFormData({
          title: data.title,
          description: data.description,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          image_url: data.image_url || ""
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://ireporter-2-6rr9.onrender.com/${type}s/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Update failed");
      }

      navigate("/reports");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="edit-container">
      <h2>Edit {type === 'redflag' ? 'Red Flag' : 'Intervention'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="coordinates">
          <div className="form-group">
            <label>Latitude</label>
            <input
              type="number"
              name="latitude"
              step="any"
              value={formData.latitude}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Longitude</label>
            <input
              type="number"
              name="longitude"
              step="any"
              value={formData.longitude}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input
            type="text"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
          />
        </div>

        {formData.image_url && (
          <div className="image-preview">
            <img src={formData.image_url} alt="Preview" />
          </div>
        )}

        <div className="button-group">
          <button type="button" onClick={() => navigate("/reports")}>
            Cancel
          </button>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default EditReport;