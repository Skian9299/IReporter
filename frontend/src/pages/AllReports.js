import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
        fetch("http://localhost:5000/interventions", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }),
      ]);

      if (!redFlagsResponse.ok) throw new Error("Failed to fetch red flags");
      if (!interventionsResponse.ok) throw new Error("Failed to fetch interventions");

      const [redFlags, interventions] = await Promise.all([
        redFlagsResponse.json(),
        interventionsResponse.json(),
      ]);

      // Combine and format reports with media
      const combined = [
        ...redFlags.map(r => ({ ...r, type: "redflag" })),
        ...interventions.map(i => ({ ...i, type: "intervention" }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setReports(combined);
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
    if (report.status !== 'draft') {
      alert("Only draft reports can be edited");
      return;
    }
    navigate(`/edit-report/${report.id}?type=${report.type}`);
  };

  const handleDelete = async (report) => {
    if (report.status !== 'draft') {
      alert("Only draft reports can be deleted");
      return;
    }

    if (!window.confirm(`Delete "${report.title}"?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/${report.type}s/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) throw new Error("Delete failed");
      setReports(reports.filter(r => r.id !== report.id));
    } catch (error) {
      setError(error.message);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'draft': return { background: '#e0e0e0', color: '#333' };
      case 'under_investigation': return { background: '#fff3cd', color: '#856404' };
      case 'resolved': return { background: '#d4edda', color: '#155724' };
      case 'rejected': return { background: '#f8d7da', color: '#721c24' };
      default: return {};
    }
  };

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="user-info">
          <span className="username">{username}</span>
          <div className="header-actions">
            <button onClick={() => navigate("/dashboard")}>New Report</button>
            <button onClick={() => navigate("/reports")}>Refresh</button>
            <button onClick={() => {
              localStorage.clear();
              navigate("/");
            }}>Logout</button>
          </div>
        </div>
      </header>

      <main className="reports-main">
        <h1>Your Reports</h1>

        {loading ? (
          <div className="loading">Loading reports...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : reports.length > 0 ? (
          <div className="reports-grid">
            {reports.map(report => (
              <div key={report.id} className="report-card">
                <div className="card-header">
                  <h3>{report.title}</h3>
                  <span 
                    className="status-badge"
                    style={getStatusStyle(report.status)}
                  >
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="card-body">
                  <p className="description">{report.description}</p>
                  
                  <div className="location-info">
                    <div className="coordinates">
                      <span>Lat: {report.latitude}</span>
                      <span>Lon: {report.longitude}</span>
                    </div>
                  </div>

                  {report.media?.length > 0 && (
                    <div className="media-preview">
                      {report.media.map(media => (
                        <div key={media.id} className="media-item">
                          {media.media_type === 'image' ? (
                            <img 
                              src={`http://localhost:5000/uploads/${media.file_url}`} 
                              alt="Report media" 
                            />
                          ) : (
                            <video controls>
                              <source 
                                src={`http://localhost:5000/uploads/${media.file_url}`} 
                                type={`video/${media.file_url.split('.').pop()}`} 
                              />
                            </video>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="meta-info">
                    <span className="report-type">{report.type}</span>
                    <time>{new Date(report.created_at).toLocaleDateString()}</time>
                  </div>
                </div>

                <div className="card-actions">
                  <button 
                    onClick={() => handleEdit(report)}
                    disabled={report.status !== 'draft'}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(report)}
                    disabled={report.status !== 'draft'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No reports found</div>
        )}
      </main>
    </div>
  );
};

export default AllReports;