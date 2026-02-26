import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { ConfirmProvider } from './components/ConfirmModal';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UploadNotes from './pages/UploadNotes';
import BrowseNotes from './pages/BrowseNotes';
import Subjects from './pages/Subjects';
import ManageTeachers from './pages/ManageTeachers';
import Courses from './pages/Courses';
import Friends from './pages/Friends';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <ToastProvider>
        <ConfirmProvider>
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
                      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                        <Subjects />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manage-teachers"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <ManageTeachers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/courses"
                    element={
                      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                        <Courses />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/friends"
                    element={
                      <ProtectedRoute>
                        <Friends />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
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
        </ConfirmProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
