import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import PrivateRoute from './PrivateRoute';
import Signup from './pages/Signup';
import Login from './pages/Login';
import UserDash from './pages/UserDash';
import AdminDash from './pages/AdminDash';
import Reports from './pages/Reports';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reports" element={<Reports />} />

          {/* User Dashboard */}
          <Route element={<PrivateRoute allowedRoles={['user']} />}>
            <Route path="/dashboard" element={<UserDash />} />
          </Route>

          {/* Admin Dashboard */}
          <Route element={<PrivateRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDash />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;