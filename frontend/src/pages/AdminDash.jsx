import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, LogOut } from 'lucide-react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../App.css';

function AdminDash() {
  const [redFlags, setRedFlags] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Status options available for the admin.
  const statusOptions = [
    { value: 'under_investigation', label: 'Under Investigation' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'resolved', label: 'Resolved' }
  ];

  // Set admin's JWT token in Axios headers if available
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  useEffect(() => {
    fetchAllRedFlags();
    fetchAllInterventions();
  }, []);

  const fetchAllRedFlags = async () => {
    try {
      const response = await axios.get('https://super-palm-tree-h366.onrender.com/redflags');
      setRedFlags(response.data);
    } catch (err) {
      console.error("Error fetching red flags:", err);
      setError("Failed to load red flags");
    }
  };

  const fetchAllInterventions = async () => {
    try {
      const response = await axios.get('https://super-palm-tree-h366.onrender.com/interventions');
      setInterventions(response.data);
    } catch (err) {
      console.error("Error fetching interventions:", err);
      setError("Failed to load interventions");
    }
  };

  // This function calls the PATCH route to update the status.
  // If an email was sent (indicated by the extra email_message field),
  // it displays that message to the admin.
  const handleStatusChange = async (id, type, newStatus) => {
    setIsUpdating(true);
    try {
      let response;
      if (type === 'redflag') {
        response = await axios.patch(`https://super-palm-tree-h366.onrender.com/redflags/${id}`, {
          status: newStatus
        });
        setRedFlags(prev => prev.map(item => item.id === id ? response.data : item));
      } else {
        response = await axios.patch(`https://super-palm-tree-h366.onrender.com/interventions/${id}`, {
          status: newStatus
        });
        setInterventions(prev => prev.map(item => item.id === id ? response.data : item));
      }

      if (response.data.email_message) {
        alert(response.data.email_message);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div style={{ backgroundColor: '#FFEDCC', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#FFA500' }}>
        <div className="container">
          <a className="navbar-brand" href="#">Admin Dashboard</a>
          <button onClick={handleLogout} className="btn btn-outline-light">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </nav>

      <div className="container mt-5">
        {/* Header */}
        <header className="mb-4">
          <h1 className="display-4 text-center">Admin Dashboard</h1>
        </header>

        {/* Error Message */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Main Content */}
        <main>
          {/* Red Flags Section */}
          <section className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <AlertTriangle size={22} className="me-2" />
              <h2 className="h4 mb-0">Red Flags</h2>
              <span className="badge bg-secondary ms-2">{redFlags.length}</span>
            </div>
            <div className="row">
              {redFlags.length === 0 ? (
                <div className="col">
                  <p>No red flags available.</p>
                </div>
              ) : (
                redFlags.map(flag => (
                  <div key={flag.id} className="col-md-4 mb-4">
                    <div className="card h-100">
                      {flag.image_url && (
                        <img 
                          src={flag.image_url} 
                          alt={flag.title} 
                          className="card-img-top" 
                          loading="lazy"
                        />
                      )}
                      <div className="card-header">
                        <h5 className="card-title">{flag.title}</h5>
                        <p className="mb-0">Status: {flag.status}</p>
                      </div>
                      <div className="card-body">
                        <p className="card-text">{flag.description}</p>
                        <div className="mb-3">
                          <label htmlFor={`status-${flag.id}`} className="form-label">Change Status:</label>
                          <select
                            id={`status-${flag.id}`}
                            className="form-select"
                            defaultValue={flag.status}
                            onChange={(e) =>
                              handleStatusChange(flag.id, 'redflag', e.target.value)
                            }
                            disabled={isUpdating}
                          >
                            <option value={flag.status}>{flag.status}</option>
                            {statusOptions.map(option =>
                              option.value !== flag.status && (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Interventions Section */}
          <section>
            <div className="d-flex align-items-center mb-3">
              <Shield size={22} className="me-2" />
              <h2 className="h4 mb-0">Interventions</h2>
              <span className="badge bg-secondary ms-2">{interventions.length}</span>
            </div>
            <div className="row">
              {interventions.length === 0 ? (
                <div className="col">
                  <p>No interventions available.</p>
                </div>
              ) : (
                interventions.map(intervention => (
                  <div key={intervention.id} className="col-md-4 mb-4">
                    <div className="card h-100">
                      {intervention.image_url && (
                        <img 
                          src={intervention.image_url} 
                          alt={intervention.title} 
                          className="card-img-top" 
                          loading="lazy"
                        />
                      )}
                      <div className="card-header">
                        <h5 className="card-title">{intervention.title}</h5>
                        <p className="mb-0">Status: {intervention.status}</p>
                      </div>
                      <div className="card-body">
                        <p className="card-text">{intervention.description}</p>
                        <div className="mb-3">
                          <label htmlFor={`status-${intervention.id}`} className="form-label">Change Status:</label>
                          <select
                            id={`status-${intervention.id}`}
                            className="form-select"
                            defaultValue={intervention.status}
                            onChange={(e) =>
                              handleStatusChange(intervention.id, 'intervention', e.target.value)
                            }
                            disabled={isUpdating}
                          >
                            <option value={intervention.status}>{intervention.status}</option>
                            {statusOptions.map(option =>
                              option.value !== intervention.status && (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminDash;
