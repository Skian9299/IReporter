import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [adminName, setAdminName] = useState("Admin");
  const [profilePic, setProfilePic] = useState(localStorage.getItem("adminAvatar") || "");
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetchUserEmail(); // Fetch user email first
    fetchReports();   // Then fetch reports
}, []);

const fetchUserEmail = async () => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://ireporter-2-6rr9.onrender.com/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data && response.data.email) {
            setUserEmail(response.data.email);
            console.log("✅ User email fetched:", response.data.email);
        } else {
            console.error("❌ No email found in response:", response.data);
        }
    } catch (error) {
        console.error("❌ Error fetching user email:", error);
    }
};

const fetchReports = async () => {
    try {
        const token = localStorage.getItem("token");

        // Fetch red flags and interventions
        const [redflagsResponse, interventionsResponse] = await Promise.all([
            axios.get("https://ireporter-2-6rr9.onrender.com/redflags", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get("https://ireporter-2-6rr9.onrender.com/interventions", {
                headers: { Authorization: `Bearer ${token}` },
            }),
        ]);
      // Map each response to add a category and a date property (from created_at)
      const redflags = redflagsResponse.data.map((report) => ({
        ...report,
        category: "Red Flag",
        date: report.created_at,
      }));
      const interventions = interventionsResponse.data.map((report) => ({
        ...report,
        category: "Intervention",
        date: report.created_at,
      }));
      const combinedReports = [...redflags, ...interventions];
      setReports(combinedReports);
      setFilteredReports(combinedReports);
    } catch (error) {
      console.error("Error fetching reports:", error.message || error);
      setError("Error fetching reports");
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

  // (Status update and email notification function remains unchanged)
  const updateStatus = async (reportId, status, reportType) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await axios.patch(
        `https://ireporter-2-6rr9.onrender.com/admin/${reportType.toLowerCase()}s/${reportId}/status`,
        { status: status.toUpperCase() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.data) {
        // Update local state
        const updatedReports = reports.map(report => {
          if (report.id === reportId && report.category === reportType) {
            return { ...report, status: status.toUpperCase() };
          }
          return report;
        });
        
        setReports(updatedReports);
        setFilteredReports(updatedReports);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(`Error updating status: ${error.response?.data?.error || error.message}`);
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
      {/* Sidebar */}
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
          <h3>{adminName}</h3>
        </div>
        <button onClick={() => filterReports("all")}>All Reports</button>
        <button onClick={() => filterReports("Red Flag")}>Red Flags</button>
        <button onClick={() => filterReports("Intervention")}>Interventions</button>
        <button onClick={handleLogout} className="logout-btn">
          Log Out
        </button>
      </div>

      {/* Reports Table */}
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
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <tr key={report.id}>
                  <td>{index + 1}</td>
                  <td>{report.title}</td>
                  <td>{new Date(report.date).toLocaleString()}</td>
                  <td>{report.category}</td>
                  <td>
                    <button
                      onClick={() =>
                        updateStatus(report.id, "RESOLVED", report.userEmail)
                      }
                      className="resolved-btn"
                    >
                      Resolved
                    </button>
                    <button
                      onClick={() =>
                        updateStatus(report.id, "REJECTED", report.userEmail)
                      }
                      className="rejected-btn"
                    >
                      Rejected
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-reports">
                  No reports available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
