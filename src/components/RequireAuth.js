import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', height: '50vh'}}>
      <div className="spinner-border text-primary" role="status" aria-hidden="true"></div>
      <span style={{marginLeft:12}}>جارٍ التحقق من الجلسة...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default RequireAuth;
