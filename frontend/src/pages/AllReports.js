import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // State for handling the report currently being edited
  const [editingReport, setEditingReport] = useState(null);
  // Local state for the edit form fields
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Helper function to parse localStorage safely
  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  // Fetch user reports from the /reports route using AbortController to prevent memory leaks
  const fetchUserReports = useCallback(async (token) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("http://localhost:5000/reports", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch reports");

      const data = await response.json();
      // Combine redflags and interventions, tagging each with a type for later reference
      const redflags = data.redflags.map((r) => ({ ...r, type: "redflag" }));
      const interventions = data.interventions.map((i) => ({
        ...i,
        type: "intervention",
      }));
      setReports([...redflags, ...interventions]);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching reports:", error);
        setError(error.message || "Failed to fetch reports.");
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = localStorage.getItem("token");

    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
      fetchUserReports(token);
    } else {
      navigate("/login");
    }
  }, [navigate, fetchUserReports]);

  // Handle opening the edit form with the selected report's details
  const handleEdit = (report) => {
    setEditingReport(report);
    setEditTitle(report.title);
    setEditDescription(report.description);
    setEditLocation(report.location);
    setEditLatitude(report.latitude);
    setEditLongitude(report.longitude);
    setEditImageUrl(report.image_url || "");
    setEditStatus(report.status); // status as a string (e.g., "Draft", "Resolved")
  };

  // Submit the updated report via PUT
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    const endpoint = editingReport.type === "redflag" ? "redflags" : "interventions";
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Unauthorized! Please log in again.");
      return;
    }

    const payload = {
      title: editTitle,
      description: editDescription,
      location: editLocation,
      latitude: parseFloat(editLatitude),
      longitude: parseFloat(editLongitude),
      image_url: editImageUrl,
      status: editStatus,
    };

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}/${editingReport.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 403) {
        throw new Error("You don't have permission to edit this report.");
      }
      if (!response.ok) throw new Error("Failed to update report");

      const updatedReport = await response.json();

      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === updatedReport.id ? { ...updatedReport, type: editingReport.type } : r
        )
      );
      alert("Report updated successfully.");
      setEditingReport(null);
    } catch (error) {
      console.error("Error updating report:", error);
      alert(error.message || "An error occurred while updating the report.");
    }
  };


  // Cancel editing
  const handleEditCancel = () => {
    setEditingReport(null);
  };

  // Handle delete using the new DELETE routes
  const handleDelete = async (report) => {
    const confirmed = window.confirm(`Delete "${report.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    const endpoint = report.type === "redflag" ? "redflags" : "interventions";
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Unauthorized! Please log in again.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        throw new Error("You don't have permission to delete this report.");
      }
      if (!response.ok) throw new Error("Failed to delete report");

      setReports((prevReports) => prevReports.filter((r) => r.id !== report.id));
      alert("Report deleted successfully.");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert(error.message || "An error occurred while deleting the report.");
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="user-info">
          <img src="default-avatar.png" alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>
        <div className="dashboard-buttons">
          <button onClick={() => navigate("/dashboard")}>Add Report</button>
          <button onClick={() => navigate("/reports")}>All Reports</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <h2>Your Reports</h2>

      {loading ? (
        <p>Loading reports...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : reports.length > 0 ? (
        <div className="reports-list">
          {reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <p>
                  <strong>Location:</strong> {report.location}
                </p>
                <p>
                  <strong>Latitude:</strong> {report.latitude}
                </p>
                <p>
                  <strong>Longitude:</strong> {report.longitude}
                </p>
                <p>
                  <strong>Status:</strong> {report.status}
                </p>
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(report.created_at).toLocaleString()}
                </p>
                <p>
                  <strong>Updated At:</strong>{" "}
                  {new Date(report.updated_at).toLocaleString()}
                </p>
                {report.image_url && (
                  <img
                    src={
                      report.image_url.startsWith("http")
                        ? report.image_url
                        : `http://localhost:5000/uploads/${report.image_url}`
                    }
                    alt="Report"
                    className="report-image"
                  />
                )}
                {report.video_url && (
                  <video
                    src={
                      report.video_url.startsWith("http")
                        ? report.video_url
                        : `http://localhost:5000/uploads/${report.video_url}`
                    }
                    controls
                    className="report-video"
                  />
                )}
              </div>
              <div className="report-actions">
                <button onClick={() => handleEdit(report)}>Edit</button>
                <button onClick={() => handleDelete(report)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No reports found.</p>
      )}

      {/* Inline Edit Form */}
      {editingReport && (
        <div className="edit-form-container">
          <h3>Edit Report</h3>
          <form onSubmit={handleEditSubmit}>
            <label>
              Title:
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </label>
            <label>
              Description:
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </label>
            <label>
              Location:
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
              />
            </label>
            <label>
              Latitude:
              <input
                type="number"
                value={editLatitude}
                onChange={(e) => setEditLatitude(e.target.value)}
              />
            </label>
            <label>
              Longitude:
              <input
                type="number"
                value={editLongitude}
                onChange={(e) => setEditLongitude(e.target.value)}
              />
            </label>
            <label>
              Image URL:
              <input
                type="text"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
              />
            </label>
            <label>
              Status:
              <input
                type="text"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                placeholder="e.g.,DRAFT, RESOLVED"
              />
            </label>
            <div className="edit-form-buttons">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={handleEditCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AllReports;
