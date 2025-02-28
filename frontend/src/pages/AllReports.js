import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);

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
        setReports([...redFlagsData, ...interventionsData]);
      } else {
        console.error("Error fetching reports:", redFlagsData.error || interventionsData.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEdit = (reportId) => {
    navigate(`/edit-report/${reportId}`);
  };

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
        setReports(reports.filter((report) => report.id !== reportId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete report.");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
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
          <button className="add-report" onClick={() => navigate("/dashboard")}>Add report</button>
          <button className="all-reports" onClick={() => navigate("/reports")}>
            All Reports
          </button>
          <button className="logout" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <h2>Your Reports</h2>

      <div className="reports-list">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report.id} className="report-card">
              <div className="report-content">
                <h3>{report.title}</h3>
                <p>{report.description}</p>
                {report.image && <img src={`https://ireporter-1-07fm.onrender.com/uploads/${report.image}`} alt="Report" className="report-image" />}
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