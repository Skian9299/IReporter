import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("adminAvatar") || "");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://ireporter-1-50ya.onrender.com/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const processReports = (reports, category) => reports.map(report => ({
          ...report,
          category,
          date: report.created_at,
          userEmail: report.user?.email || "unknown@email.com" // Ensure user email exists
        }));

        const combinedReports = [
          ...processReports(response.data.redflags, "Red Flag"),
          ...processReports(response.data.interventions, "Intervention")
        ];

        setReports(combinedReports);
        setFilteredReports(combinedReports);
      }
    } catch (error) {
      setError("Error fetching reports");
      console.error("Fetch error:", error);
    }
  };

  const filterReports = (type) => {
    setFilterType(type);
    setFilteredReports(type === "all" ? reports : reports.filter(report => report.category === type));
  };

  const updateStatus = async (reportId, status, category) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = category === "Red Flag" 
        ? `https://ireporter-1-50ya.onrender.com/redflags/${reportId}`
        : `https://ireporter-1-50ya.onrender.com/interventions/${reportId}`;

      // Update status
      await axios.patch(
        endpoint,
        { status: status.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Find report for email and update local state
      const updatedReports = reports.map(report => {
        if (report.id === reportId) {
          const updated = { ...report, status: status.toLowerCase() };
          
          // Send email notification
          axios.post(
            "https://ireporter-1-50ya.onrender.com/send-mail",
            {
              email: updated.userEmail,
              status: status.toLowerCase(),
              report_id: reportId
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          return updated;
        }
        return report;
      });

      setReports(updatedReports);
      setFilteredReports(updatedReports);

    } catch (error) {
      setError(`Update failed: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setError(""), 5000);
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
        <div className="admin-info">
          <label htmlFor="profile-upload">
            <img
              src={profilePic || "/default-avatar.png"}
              alt="Admin Avatar"
              className="avatar"
            />
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            style={{ display: "none" }}
          />
          <h3>Admin Panel</h3>
        </div>
        <button onClick={() => filterReports("all")}>All Reports</button>
        <button onClick={() => filterReports("Red Flag")}>Red Flags</button>
        <button onClick={() => filterReports("Intervention")}>Interventions</button>
        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>

      <div className="reports-table">
        <h2>Latest Reports</h2>
        {error && <p className="error-message">{error}</p>}
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Report</th>
              <th>Date</th>
              <th>Category</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report, index) => (
              <tr key={report.id}>
                <td>{index + 1}</td>
                <td>{report.title}</td>
                <td>{new Date(report.date).toLocaleDateString()}</td>
                <td>{report.category}</td>
                <td>
                  {!["resolved", "rejected"].includes(report.status?.toLowerCase()) ? (
                    <>
                      <button
                        onClick={() => updateStatus(report.id, "resolved", report.category)}
                        className="status-btn resolved"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => updateStatus(report.id, "rejected", report.category)}
                        className="status-btn rejected"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`status-${report.status}`}>
                      {report.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredReports.length === 0 && (
          <tr>
            <td colSpan="5" className="no-reports">
              No reports available
            </td>
          </tr>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;