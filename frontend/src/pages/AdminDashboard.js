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
      const response = await axios.get("http://127.0.0.1:5000/auth/email", {
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
      const response = await axios.get("http://127.0.0.1:5000/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        // Merge red flags and interventions into a single array with category labels
        const redflags = response.data.redflags.map(report => ({
          ...report,
          category: "Red Flag",
          date: report.created_at,
        }));

        const interventions = response.data.interventions.map(report => ({
          ...report,
          category: "Intervention",
          date: report.created_at,
        }));

        const combinedReports = [...redflags, ...interventions];

        setReports(combinedReports);
        setFilteredReports(combinedReports);
      }
    } catch (error) {
      console.error("Error fetching reports:", error.message || error);
      setError("Error fetching reports");
    }
  };

  // Ensure filter logic works with updated structure
  const filterReports = (type) => {
    setFilterType(type);
    if (type === "all") {
      setFilteredReports(reports);
    } else {
      setFilteredReports(reports.filter(report => report.category === type));
    }
  };


  // (Status update and email notification function remains unchanged)
  const updateStatus = async (reportId, status, userEmail, category) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = category === "Red Flag" ? `http://127.0.0.1:5000/redflags/${reportId}` : `http://127.0.0.1:5000/interventions/${reportId}`;
      console.log("🔍 Sending Token:", token);  // Debugging
      console.log("🔍 User Email:", userEmail);  // Debugging
      console.log("🔍 Sending Email Payload:", { email: userEmail, status: status, report_id: reportId });

      await axios.put(
        endpoint,
        { status: status.toLowerCase() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Send email notification
      await axios.post(
        "http://127.0.0.1:5000/send-mail",
        {
          email: userEmail,
          status: status,
          report_id: reportId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

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
                    {report.status !== "resolved" || report.status !== "rejected" ? (
                      <>
                      <button
                        onClick={() =>
                          updateStatus(report.id, "RESOLVED", userEmail, report.category)
                        }
                        className="resolved-btn"
                      >
                        Resolved
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(report.id, "REJECTED", userEmail, report.category)
                        }
                        className="rejected-btn"
                      >
                        Rejected
                      </button>
                    </>
                    ) : (
                      <span>{report.status}</span>
                    )}
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
