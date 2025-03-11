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

  const getStoredUser = () => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  };

  // Fetch user reports with AbortController to prevent memory leaks
  const fetchUserReports = useCallback(async (token) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);
  
      const response = await fetch("https://ireporter-1-50ya.onrender.com/reports", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
  
      const data = await response.json();
  
      // Ensure each report has a type for proper handling
      const formattedRedFlags = data.redflags.map((r) => ({ ...r, type: "redflag" }));
      const formattedInterventions = data.interventions.map((i) => ({ ...i, type: "intervention" }));
  
      setReports([...formattedRedFlags, ...formattedInterventions]);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error.message || "Failed to load reports");
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);
  
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = localStorage.getItem("token");
  
    if (storedUser?.id && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
      fetchUserReports(token);
    } else {
      navigate("/login");
    }
  }, [navigate, fetchUserReports]);
  
  // Handle edit
  const handleEdit = (report) => {
    navigate(`/edit-report/${report.id}?type=${report.type}`);
  };

  // Handle delete
  const handleDelete = async (report) => {
    if (report.status !== "draft") {
      alert("Only draft reports can be deleted");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`https://ireporter-1-50ya.onrender.com/${report.type}s/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (!response.ok) throw new Error("Failed to delete report");
      setReports((prevReports) => prevReports.filter((r) => r.id !== report.id));
      alert("Report deleted successfully.");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred while deleting the report.");
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
      <header className="reports-header">
        <div className="user-info">
          <span className="username">{username}</span>
          <div className="header-actions">
            <button onClick={() => navigate("/dashboard")}>New Report</button>
            <button onClick={() => navigate("/reports")}>Refresh</button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="reports-main">
        <h1>Your Reports</h1>

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
                    <strong>Created At:</strong> {new Date(report.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Updated At:</strong> {new Date(report.updated_at).toLocaleString()}
                  </p>
                  {report.image_url && (
                    <img
                      src={report.image_url} // No need to prepend localhost if it's already a full URL
                      alt="Report"
                      className="report-image"
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
      </main>
    </div>
  );
};

export default AllReports;
