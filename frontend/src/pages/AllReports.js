import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
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

  const fetchUserReports = useCallback(async (token) => {
    const controller = new AbortController();
    try {
      setLoading(true);
      setError(null);

      const [redFlagsResponse, interventionsResponse] = await Promise.all([
        fetch("http://localhost:5000/redflags", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch("http://localhost:5000/interventions", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
      ]);

      if (!redFlagsResponse.ok || !interventionsResponse.ok) {
        throw new Error("Failed to fetch reports");
      }

      const [redFlags, interventions] = await Promise.all([
        redFlagsResponse.json(),
        interventionsResponse.json(),
      ]);

      const formattedRedFlags = redFlags.map((r) => ({ ...r, type: "redflag" }));
      const formattedInterventions = interventions.map((i) => ({ ...i, type: "intervention" }));

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

  const handleEdit = (report) => {
    navigate(`/edit-report/${report.id}?type=${report.type}`);
  };

  const handleDelete = async (report) => {
    if (report.status !== 'draft') {
      alert("Only draft reports can be deleted");
      return;
    }

    const token = localStorage.getItem("token");
    const endpoint = report.type === "redflag" ? "redflags" : "interventions";

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete report");
      setReports(reports.filter((r) => r.id !== report.id));
      alert("Report deleted successfully.");
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred while deleting the report.");
    }
  };

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
            <button onClick={handleLogout}>Logout</button>
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
                  <p><strong>Location:</strong> {report.location}</p>
                  <p><strong>Latitude:</strong> {report.latitude}</p>
                  <p><strong>Longitude:</strong> {report.longitude}</p>
                  <p><strong>Status:</strong> {report.status}</p>
                  <p><strong>Created At:</strong> {new Date(report.created_at).toLocaleString()}</p>
                  <p><strong>Updated At:</strong> {new Date(report.updated_at).toLocaleString()}</p>
                  {report.image_url && (
                    <img
                      src={`http://localhost:5000/uploads/${report.image_url}`}
                      alt="Report"
                      className="report-image"
                    />
                  )}
                  {report.video_url && (
                    <video
                      src={`http://localhost:5000/uploads/${report.video_url}`}
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
      </main>
    </div>
  );
};

export default AllReports;