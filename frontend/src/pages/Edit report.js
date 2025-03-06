import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./EditReport.css";

const EditReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { search } = useLocation();
  const type = new URLSearchParams(search).get("type"); // Get report type from query params
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch report details on component mount
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/${type}s/${id}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (!response.ok) throw new Error("Failed to fetch report");

        const data = await response.json();
        setTitle(data.title);
        setDescription(data.description);
        setLocation(data.location);
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError(error.message || "Failed to fetch report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, type]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !location || !latitude || !longitude) {
      setError("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    if (image) formData.append("image", image);
    if (video) formData.append("video", video);

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/${type}s/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update report");

      alert("Report updated successfully!");
      navigate("/reports");
    } catch (error) {
      console.error("Error updating report:", error);
      setError(error.message || "Failed to update report.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file uploads
  const handleFileUpload = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === "image") setImage(file);
      else if (fileType === "video") setVideo(file);
    }
  };

  return (
    <div className="edit-report-container">
      <h2>Edit {type === "redflag" ? "Red Flag" : "Intervention"}</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Latitude</label>
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Longitude</label>
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "image")}
          />
        </div>
        <div className="form-group">
          <label>Upload Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileUpload(e, "video")}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Report"}
        </button>
      </form>
    </div>
  );
};

export default EditReport;