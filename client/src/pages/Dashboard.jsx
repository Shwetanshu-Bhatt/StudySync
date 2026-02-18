import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await api.get('/notes');
        setRecentNotes(response.data.notes.slice(0, 5));
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Welcome, {user.name}!
        </h1>
        <p className="text-slate-400 mt-2">
          {user.role === 'student' && `Browse notes for ${user.year}th Year`}
          {user.role === 'teacher' && 'Manage your subjects and upload notes'}
          {user.role === 'admin' && 'System Administration Dashboard'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(user.role === 'teacher' || user.role === 'admin') && (
          <Link to="/upload-notes" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-blue-600">Upload Notes</h3>
            <p className="text-slate-400 mt-2">Share study materials with students</p>
          </Link>
        )}
        <Link to="/browse-notes" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-green-600">Browse Notes</h3>
          <p className="text-slate-400 mt-2">Find study materials by subject</p>
        </Link>
        <Link to="/subjects" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-purple-600">View Subjects</h3>
          <p className="text-slate-400 mt-2">Browse available subjects</p>
        </Link>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Notes</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : recentNotes.length === 0 ? (
          <p className="text-slate-400">No notes available yet.</p>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <div key={note._id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border">
                <div>
                  <h4 className="font-medium">{note.title}</h4>
                  <p className="text-sm text-slate-400">
                    {note.subject?.name} - {note.branch?.name || note.branch} Year {note.semester}
                  </p>
                </div>
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-sm"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat widget removed from dashboard - use /chat page */}
    </div>
  );
};

export default Dashboard;
