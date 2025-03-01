import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);

  // Fetch user reports on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
      setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
      fetchUserReports(token);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch red flags and interventions for the logged-in user
  const fetchUserReports = async (token) => {
    try {
      const [redFlagsResponse, interventionsResponse] = await Promise.all([
        fetch("https://ireporter-1-07fm.onrender.com/redflags", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("https://ireporter-1-07fm.onrender.com/interventions", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const redFlagsData = await redFlagsResponse.json();
      const interventionsData = await interventionsResponse.json();

      if (redFlagsResponse.ok && interventionsResponse.ok) {
        // Combine red flags and interventions into a single array
        setReports([...redFlagsData, ...interventionsData]);
      } else {
        console.error("Error fetching reports:", redFlagsData.error || interventionsData.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handle edit action
  const handleEdit = (reportId) => {
    navigate(`/edit-report/${reportId}`);
  };

  // Handle delete action
  const handleDelete = async (reportId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://ireporter-1-07fm.onrender.com/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        alert("Report deleted successfully.");
        // Remove the deleted report from the state
        setReports(reports.filter((report) => report.id !== reportId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete report.");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  // Handle logout action
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="reports-container">
      {/* Header Section */}
      <div className="reports-header">
        <div className="user-info">
          <img src="default-avatar.png" alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>

        <div className="dashboard-buttons">
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add Report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>
            All Reports
          </button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* Reports List Section */}
      <h2>Your Reports</h2>

      <div className="reports-list">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                <p><strong>Status:</strong> {report.status}</p>
                <p><strong>Created At:</strong> {new Date(report.created_at).toLocaleString()}</p>
                {report.image_url && (
                  <img
                    src={`https://ireporter-1-07fm.onrender.com/uploads/${report.image_url}`}
                    alt="Report"
                    className="report-image"
                  />
                )}
              </div>
              <div className="report-actions">
                <button onClick={() => handleEdit(report.id)}>Edit</button>
                <button onClick={() => handleDelete(report.id)}>Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p>No reports found.</p>
        )}
      </div>
    </div>
  );
};

export default AllReports;