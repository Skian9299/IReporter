// UserDash.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, User, LogOut } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function UserDash() {
  const [userName, setUserName] = useState("Alex Johnson");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const initialFormState = { 
    redflag: { title: '', description: '', imageUrl: '' },
    intervention: { title: '', description: '', imageUrl: '' }
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    fetchUser();
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

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const address = response.data.address;
          const locationName = [
            address.road,
            address.city,
            address.state,
            address.country
          ].filter(Boolean).join(", ");
          setLocation(locationName);
          setCoordinates({ lat: latitude, lng: longitude });
          setError("");
        } catch (error) {
          setError("Failed to fetch location details", error);
        }
      },
      (error) => {
        setError("Please enable location services to continue", error);
      }
    );
  };

  const handleInputChange = (type, e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [name]: value }
    }));
  };

  const handleSubmit = async (type, e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const url = type === 'redflag' 
        ? 'https://super-palm-tree-h366.onrender.com/redflags'
        : 'https://super-palm-tree-h366.onrender.com/interventions';

      await axios.post(url, {
        title: formData[type].title,
        description: formData[type].description,
        image_url: formData[type].imageUrl,
        location,
        latitude: coordinates.lat,
        longitude: coordinates.lng
      });

      setFormData(initialFormState);
      setLocation("");
      setCoordinates({ lat: null, lng: null });
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    window.location.href = '/login';
  };

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#FFEDCC', minHeight: '100vh' }}>
      <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#FFA500' }}>
        <div className="container">
          <Link className="navbar-brand" to="/">ireporter</Link>
          <div className="d-flex align-items-center">
            <User size={28} className="text-light me-2" />
            <span className="text-light me-3">Hi, {userName}</span>
            <Link to="/reports" className="btn btn-outline-light me-2">View All Reports</Link>
            <button onClick={handleLogout} className="btn btn-outline-light">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <h1 className="text-center mb-5">Create New Report</h1>
        <div className="row g-4">
          {/* Red Flag Form */}
          <div className="col-md-6">
            <div className="card h-100 shadow">
              <div className="card-header bg-danger text-white">
                <h5 className="card-title mb-0">
                  <AlertTriangle size={18} className="me-2" /> New Red Flag
                </h5>
              </div>
              <form onSubmit={(e) => handleSubmit('redflag', e)} className="card-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.redflag.title} 
                    onChange={(e) => handleInputChange('redflag', e)}
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description"
                    value={formData.redflag.description}
                    onChange={(e) => handleInputChange('redflag', e)}
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Image URL</label>
                  <input 
                    type="url" 
                    name="imageUrl"
                    value={formData.redflag.imageUrl}
                    onChange={(e) => handleInputChange('redflag', e)}
                    className="form-control" 
                  />
                </div>
                <div className="mb-3">
                  <button 
                    type="button" 
                    onClick={handleGeolocation} 
                    className="btn btn-secondary">
                    Get My Location
                  </button>
                  {location && <p className="mt-2"><small>Location: {location}</small></p>}
                </div>
                <button type="submit" className="btn btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Red Flag'}
                </button>
              </form>
            </div>
          </div>

          {/* Intervention Form */}
          <div className="col-md-6">
            <div className="card h-100 shadow">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">
                  <Shield size={18} className="me-2" /> New Intervention
                </h5>
              </div>
              <form onSubmit={(e) => handleSubmit('intervention', e)} className="card-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    value={formData.intervention.title} 
                    onChange={(e) => handleInputChange('intervention', e)}
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    name="description"
                    value={formData.intervention.description}
                    onChange={(e) => handleInputChange('intervention', e)}
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Image URL</label>
                  <input 
                    type="url" 
                    name="imageUrl"
                    value={formData.intervention.imageUrl}
                    onChange={(e) => handleInputChange('intervention', e)}
                    className="form-control" 
                  />
                </div>
                <div className="mb-3">
                  <button 
                    type="button" 
                    onClick={handleGeolocation} 
                    className="btn btn-secondary">
                    Get My Location
                  </button>
                  {location && <p className="mt-2"><small>Location: {location}</small></p>}
                </div>
                <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Intervention'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDash;
