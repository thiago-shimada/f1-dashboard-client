import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import './App.css';
import Login from './Login';
import Dashboard from './Dashboard';
import ViewDetails from './ViewDetails';
import Reports from './Reports';

// A simple ProtectedRoute component
const ProtectedRoute = ({ children }) => {
  // This is a placeholder for actual auth checking logic
  // In a real app, you'd check a token, session, or context
  const [isAuthenticated, setIsAuthenticated] = React.useState(null);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/check-auth');
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error('Error checking auth status for protected route:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen"><div className="text-xl">Loading...</div></div>; // Styled Loading
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100"> {/* Basic Tailwind background */}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/view/:viewName"
            element={
              <ProtectedRoute>
                <ViewDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
