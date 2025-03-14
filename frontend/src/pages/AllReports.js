import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getStoredUser = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch reports");
      }

      const data = await response.json();
      const processReports = (arr, type) => arr.map(item => ({
        ...item,
        type,
        created_at: new Date(item.created_at).toLocaleString(),
        updated_at: new Date(item.updated_at).toLocaleString()
      }));

      setReports([
        ...processReports(data.redflags, "redflag"),
        ...processReports(data.interventions, "intervention")
      ]);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error.message);
        setTimeout(() => setError(null), 5000);
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    const token = localStorage.getItem("token");

    if (user?.id && token) {
      setUsername(`${user.first_name} ${user.last_name}`);
      fetchUserReports(token);
    } else {
      navigate("/login");
    }
  }, [navigate, fetchUserReports, getStoredUser]);

  const handleDelete = async (report) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://ireporter-1-50ya.onrender.com/${report.type}s/${report.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Deletion failed");
      }

      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (error) {
      alert(error.message);
      console.error("Delete error:", error);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem("token");
    fetchUserReports(token);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const StatusBadge = ({ status }) => (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="user-info">
          <span className="username">{username}</span>
          <div className="header-actions">
            <button onClick={() => navigate("/dashboard")}>New Report</button>
            <button onClick={handleRefresh} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="reports-main">
        <h1>Your Reports</h1>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <div className="loading-indicator">Loading reports...</div>
        ) : reports.length === 0 ? (
          <p className="no-reports">No reports found</p>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <h3>{report.title}</h3>
                  <StatusBadge status={report.status} />
                </div>

                <div className="report-body">
                  <p className="report-description">{report.description}</p>
                  
                  <div className="location-info">
                    <div>
                      <strong>Location:</strong>
                      <p>{report.location}</p>
                    </div>
                    <div className="coordinates">
                      <span>
                        <strong>Lat:</strong> {report.latitude}
                      </span>
                      <span>
                        <strong>Lng:</strong> {report.longitude}
                      </span>
                    </div>
                  </div>

                  {report.image_url && (
                    <div className="report-media">
                      <img
                        src={report.image_url}
                        alt="Report visual"
                        className="report-image"
                      />
                    </div>
                  )}

                  <div className="timestamps">
                    <span>Created: {report.created_at}</span>
                    <span>Updated: {report.updated_at}</span>
                  </div>
                </div>

                <div className="report-actions">
                  <button 
                    onClick={() => navigate(`/edit-report/${report.id}?type=${report.type}`)}
                    disabled={report.status !== 'draft'}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(report)}
                    disabled={!['draft', 'resolved'].includes(report.status)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllReports;