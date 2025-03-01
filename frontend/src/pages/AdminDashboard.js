import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = ({ onLogout }) => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [adminName, setAdminName] = useState("Admin Quincy");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("adminAvatar") || "");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get("/api/reports");
      setReports(response.data);
      setFilteredReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error.message || error);
    }
  };

  const filterReports = (type) => {
    setFilterType(type);
    if (type === "all") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter((report) => report.category === type));
    }
  };

  const updateStatus = async (reportId, status, userEmail) => {
    try {
      await axios.patch(`/api/reports/${reportId}/status`, { status });

      // Send email notification
      await axios.post("/api/send-email", {
        to: userEmail,
        subject: "Report Status Update",
        message: `Your report has been marked as ${status}.`,
      });

      fetchReports();
    } catch (error) {
      console.error("Error updating status:", error.message || error);
    }
  };

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
        localStorage.setItem("adminAvatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="admin-info">
          <label htmlFor="profile-upload">
            <img src={profilePic || "/default-avatar.png"} alt="Admin Avatar" className="avatar" />
          </label>
          <input id="profile-upload" type="file" accept="image/*" onChange={handleProfilePicChange} style={{ display: "none" }} />
          <h3>{adminName}</h3>
        </div>
        <button onClick={() => filterReports("all")}>All Reports</button>
        <button onClick={() => filterReports("Red Flag")}>Red Flags</button>
        <button onClick={() => filterReports("Intervention")}>Interventions</button>
        <button onClick={onLogout} className="logout-btn">Log Out</button>
      </div>

      {/* Reports Table */}
      <div className="reports-table">
        <h2>Latest Reports</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Report</th>
              <th>Date</th>
              <th>Category</th>
              <th>Reported By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <tr key={report.id}>
                  <td>{index + 1}</td>
                  <td>{report.title}</td>
                  <td>{report.date}</td>
                  <td>{report.category}</td>
                  <td>{report.userEmail}</td>
                  <td>
                    <button onClick={() => updateStatus(report.id, "Resolved", report.userEmail)} className="resolved-btn">
                      Resolved
                    </button>
                    <button onClick={() => updateStatus(report.id, "Rejected", report.userEmail)} className="rejected-btn">
                      Rejected
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-reports">No reports available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;