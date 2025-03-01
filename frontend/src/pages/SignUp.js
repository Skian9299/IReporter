// import React, { useState, useEffect, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import "./AllReports.css"; 

// const AllReports = () => {
//   const navigate = useNavigate();
//   const [username, setUsername] = useState("User");
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Helper function to parse localStorage safely
//   const getStoredUser = () => {
//     try {
//       return JSON.parse(localStorage.getItem("user"));
//     } catch {
//       return null;
//     }
//   };

//   // Fetch user reports
//   const fetchUserReports = useCallback(async (token) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const [redFlagsResponse, interventionsResponse] = await Promise.all([
//         fetch("http://localhost:5000/redflags", {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//         fetch("http://localhost:5000/interventions", {
//           method: "GET",
//           headers: { Authorization: `Bearer ${token}` },
//         }),
//       ]);

//       if (!redFlagsResponse.ok) {
//         throw new Error("Failed to fetch red flags");
//       }
//       if (!interventionsResponse.ok) {
//         throw new Error("Failed to fetch interventions");
//       }

//       const [redFlags, interventions] = await Promise.all([
//         redFlagsResponse.json(),
//         interventionsResponse.json(),
//       ]);

//       setReports([...redFlags, ...interventions]);
//     } catch (error) {
//       console.error("Error fetching reports:", error);
//       setError(error.message || "Failed to fetch reports.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const storedUser = getStoredUser();
//     const token = localStorage.getItem("token");

//     if (storedUser && storedUser.first_name && storedUser.last_name && token) {
//       setUsername(`${storedUser.first_name} ${storedUser.last_name}`);
//       fetchUserReports(token);
//     } else {
//       navigate("/login");
//     }
//   }, [navigate, fetchUserReports]);

//   // Handle edit
//   const handleEdit = (report) => {
//     const reportType = report.type; // Assuming you store the type in each report
//     navigate(`/edit-report/${report.id}?type=${reportType}`);
//   };

//   // Handle delete
//   const handleDelete = async (report) => {
//     if (!window.confirm("Are you sure you want to delete this report?")) return;

//     const endpoint = report.type === "redflag" ? "redflags" : "interventions";

//     try {
//       const response = await fetch(`http://localhost:5000/${endpoint}/${report.id}`, {
//         method: "DELETE",
//         headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
//       });

//       if (!response.ok) throw new Error("Failed to delete report");
//       setReports(reports.filter((r) => r.id !== report.id));
//       alert("Report deleted successfully.");
//     } catch (error) {
//       console.error("Error deleting report:", error);
//       alert("An error occurred while deleting the report.");
//     }
//   };

//   // Handle logout
//   const handleLogout = () => {
//     localStorage.clear();
//     navigate("/");
//   };

//   return (
//     <div className="reports-container">
//       <div className="reports-header">
//         <div className="user-info">
//           <img src="default-avatar.png" alt="Profile" className="profile-pic" />
//           <span className="username">{username}</span>
//         </div>
//         <div className="dashboard-buttons">
//           <button onClick={() => navigate("/dashboard")}>Add Report</button>
//           <button onClick={() => navigate("/reports")}>All Reports</button>
//           <button onClick={handleLogout}>Log Out</button>
//         </div>
//       </div>

//       <h2>Your Reports</h2>

//       {loading ? (
//         <p>Loading reports...</p>
//       ) : error ? (
//         <p className="error-message">{error}</p>
//       ) : reports.length > 0 ? (
//         <div className="reports-list">
//           {reports.map((report) => (
//             <div key={report.id} className="report-card">
//               <div className="report-content">
//                 <h3>{report.title}</h3>
//                 <p>{report.description}</p>
//                 {report.image && <img src={`http://localhost:5000/uploads/${report.image}`} alt="Report" className="report-image" />}
//               </div>
//               <div className="report-actions">
//                 <button onClick={() => handleEdit(report)}>Edit</button>
//                 <button onClick={() => handleDelete(report)}>Delete</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p>No reports found.</p>
//       )}
//     </div>
//   );
// };

// export default AllReports;


import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AllReports.css";

const AllReports = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to parse localStorage safely
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

      if (!redFlagsResponse.ok) throw new Error("Failed to fetch red flags");
      if (!interventionsResponse.ok) throw new Error("Failed to fetch interventions");

      const [redFlags, interventions] = await Promise.all([
        redFlagsResponse.json(),
        interventionsResponse.json(),
      ]);

      // Ensure each report has a type for handling edits & deletions
      const formattedRedFlags = redFlags.map((r) => ({ ...r, type: "redflag" }));
      const formattedInterventions = interventions.map((i) => ({ ...i, type: "intervention" }));

      setReports([...formattedRedFlags, ...formattedInterventions]);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching reports:", error);
        setError(error.message || "Failed to fetch reports.");
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const storedUser = getStoredUser();
    const token = localStorage.getItem("token");

    if (storedUser && storedUser.first_name && storedUser.last_name && token) {
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
    const confirmed = window.confirm(`Delete "${report.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    const endpoint = report.type === "redflag" ? "redflags" : "interventions";

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}/${report.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!response.ok) throw new Error("Failed to delete report");
      setReports(reports.filter((r) => r.id !== report.id));
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
      <div className="reports-header">
        <div className="user-info">
          <img src="default-avatar.png" alt="Profile" className="profile-pic" />
          <span className="username">{username}</span>
        </div>
        <div className="dashboard-buttons">
          <button onClick={() => navigate("/dashboard")}>Add Report</button>
          <button onClick={() => navigate("/reports")}>All Reports</button>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <h2>Your Reports</h2>

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
                {report.image && <img src={`http://localhost:5000/uploads/${report.image}`} alt="Report" className="report-image" />}
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
    </div>
  );
};

export default AllReports;
