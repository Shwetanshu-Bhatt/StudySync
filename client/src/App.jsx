import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UploadNotes from './pages/UploadNotes';
import BrowseNotes from './pages/BrowseNotes';
import Subjects from './pages/Subjects';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-notes"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <UploadNotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/browse-notes"
                element={
                  <ProtectedRoute>
                    <BrowseNotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/subjects"
                element={
                  <ProtectedRoute>
                    <Subjects />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-800">404</h1>
                      <p className="text-gray-600 mt-2">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
