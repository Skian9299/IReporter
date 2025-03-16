import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { auth, user } = useAuth();

  if (!auth) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to default route based on role or a common page
    return user?.role === 'admin' 
      ? <Navigate to="/admin" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;