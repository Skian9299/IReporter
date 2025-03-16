// Reports.jsx
import React, { useState, useEffect } from 'react';
import { User, LogOut, AlertTriangle, Shield, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function Reports() {
  const [activeTab, setActiveTab] = useState("redflags");
  const [editItem, setEditItem] = useState(null);
  const [userName, setUserName] = useState("");
  const [redFlags, setRedFlags] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUser();
    fetchReports();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('https://super-palm-tree-h366.onrender.com/user');
      setUserName(response.data.first_name);
    } catch (err) {
      console.error("Error fetching user:", err);
      setError("Failed to load user");
    }
  };

  const fetchReports = async () => {
    try {
      const [redFlagsRes, interventionsRes] = await Promise.all([
        axios.get('https://super-palm-tree-h366.onrender.com/user/redflags'),
        axios.get('https://super-palm-tree-h366.onrender.com/user/interventions')
      ]);
      setRedFlags(redFlagsRes.data);
      setInterventions(interventionsRes.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await axios.delete(`https://super-palm-tree-h366.onrender.com/${type}/${id}`);
        type === 'redflags' 
          ? setRedFlags(prev => prev.filter(item => item.id !== id))
          : setInterventions(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error("Error deleting item:", err);
        setError("Failed to delete item");
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = `https://super-palm-tree-h366.onrender.com/${editItem.type}/${editItem.data.id}`;
      const res = await axios.patch(url, editItem.data);
      
      if (editItem.type === 'redflags') {
        setRedFlags(prev => prev.map(item => item.id === editItem.data.id ? res.data : item));
      } else {
        setInterventions(prev => prev.map(item => item.id === editItem.data.id ? res.data : item));
      }
      setEditItem(null);
    } catch (err) {
      console.error("Error updating item:", err);
      setError("Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item, type) => {
    setEditItem({
      type: type === 'redflag' ? 'redflags' : 'interventions',
      data: { ...item }
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditItem(prev => ({
      ...prev,
      data: { ...prev.data, [name]: value }
    }));
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#FFEDCC', minHeight: '100vh' }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#FFA500' }}>
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">ireporter</Link>
          <div className="d-flex align-items-center">
            <User size={28} className="text-light me-2" />
            <span className="text-light me-3">Hi, {userName}</span>
            <Link to="/dashboard" className="btn btn-outline-light me-2">Back to Dashboard</Link>
            <button onClick={() => {
              sessionStorage.removeItem('access_token');
              window.location.href = '/login';
            }} className="btn btn-outline-light">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'redflags' ? 'active' : ''}`}
              onClick={() => setActiveTab('redflags')}
            >
              <AlertTriangle size={18} className="me-2" />
              Red Flags ({redFlags.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'interventions' ? 'active' : ''}`}
              onClick={() => setActiveTab('interventions')}
            >
              <Shield size={18} className="me-2" />
              Interventions ({interventions.length})
            </button>
          </li>
        </ul>

        {/* Error Display */}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* Content */}
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {activeTab === 'redflags' ? (
            redFlags.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p className="lead">No red flags reported yet</p>
              </div>
            ) : (
              redFlags.map(flag => (
                <div key={flag.id} className="col">
                  <div className="card h-100 shadow-sm">
                    {flag.image_url && (
                      <img src={flag.image_url} className="card-img-top" alt={flag.title} style={{ height: '200px', objectFit: 'cover' }} />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{flag.title}</h5>
                      <p className="card-text">{flag.description}</p>
                      <p className="text-muted small mb-0">
                        Location: {flag.location}<br />
                        {flag.latitude && `Coordinates: ${flag.latitude.toFixed(4)}, ${flag.longitude.toFixed(4)}`}
                      </p>
                    </div>
                    <div className="card-footer bg-white border-top-0">
                      <div className="d-flex justify-content-end gap-2">
                        <button 
                          onClick={() => handleEditClick(flag, 'redflag')}
                          className="btn btn-sm btn-outline-warning"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(flag.id, 'redflags')}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            interventions.length === 0 ? (
              <div className="col-12 text-center py-5">
                <p className="lead">No interventions requested yet</p>
              </div>
            ) : (
              interventions.map(intervention => (
                <div key={intervention.id} className="col">
                  <div className="card h-100 shadow-sm">
                    {intervention.image_url && (
                      <img src={intervention.image_url} className="card-img-top" alt={intervention.title} style={{ height: '200px', objectFit: 'cover' }} />
                    )}
                    <div className="card-body">
                      <h5 className="card-title">{intervention.title}</h5>
                      <p className="card-text">{intervention.description}</p>
                      <p className="text-muted small mb-0">
                        Location: {intervention.location}<br />
                        {intervention.latitude && `Coordinates: ${intervention.latitude.toFixed(4)}, ${intervention.longitude.toFixed(4)}`}
                      </p>
                    </div>
                    <div className="card-footer bg-white border-top-0">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => handleEditClick(intervention, 'intervention')}
                          className="btn btn-sm btn-outline-warning"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(intervention.id, 'interventions')}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Edit Modal */}
        {editItem && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className={`modal-header ${editItem.type === 'redflags' ? 'bg-danger' : 'bg-success'} text-white`}>
                  <h5 className="modal-title">
                    Edit {editItem.type === 'redflags' ? 'Red Flag' : 'Intervention'}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setEditItem(null)}
                    aria-label="Close"
                  ></button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        name="title"
                        value={editItem.data.title}
                        onChange={handleEditInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Description</label>
                      <textarea
                        name="description"
                        value={editItem.data.description}
                        onChange={handleEditInputChange}
                        className="form-control"
                        required
                        rows="4"
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Image URL</label>
                      <input
                        type="url"
                        name="image_url"
                        value={editItem.data.image_url}
                        onChange={handleEditInputChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setEditItem(null)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`btn ${editItem.type === 'redflags' ? 'btn-danger' : 'btn-success'}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;