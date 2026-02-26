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

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'teacher':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Teacher', gradient: 'from-amber-500 to-orange-500' };
      case 'admin':
        return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', label: 'Admin', gradient: 'from-red-500 to-pink-500' };
      default:
        return { bg: 'bg-primary-500/20', border: 'border-primary-500/30', text: 'text-primary-400', label: 'Student', gradient: 'from-primary-500 to-secondary-500' };
    }
  };

  const roleStyle = getRoleBadge();

  return (
    <div className="min-h-screen pb-12 px-3 sm:px-6 lg:px-8 pt-4 md:pt-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Welcome Section */}
        <div className="mb-8 md:mb-10 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                Welcome back, <span className="text-brand-gradient">{user.name?.split(' ')[0]}!</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-lg">
                {user.role === 'student' && `Ready to explore your ${user.year}nd Year materials?`}
                {user.role === 'teacher' && 'Ready to share knowledge with your students?'}
                {user.role === 'admin' && 'Welcome to your administration dashboard'}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full ${roleStyle.bg} border ${roleStyle.border}`}>
              <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${roleStyle.gradient} animate-pulse`} />
              <span className={`text-sm font-semibold ${roleStyle.text}`}>{roleStyle.label}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(user.role === 'teacher' || user.role === 'admin') && (
            <Link 
              to="/upload-notes" 
              className="group glass-card p-6 card-hover animate-fade-in-up stagger-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all group-hover:scale-110">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <svg className="w-6 h-6 text-slate-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mt-4 group-hover:text-primary-400 transition-colors">Upload Notes</h3>
              <p className="text-slate-400 mt-2 text-sm">Share study materials with your students</p>
            </Link>
          )}
          
          <Link 
            to="/browse-notes" 
            className="group glass-card p-6 card-hover animate-fade-in-up stagger-2"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/30 group-hover:shadow-secondary-500/50 transition-all group-hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-slate-500 group-hover:text-secondary-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mt-4 group-hover:text-secondary-400 transition-colors">Browse Notes</h3>
            <p className="text-slate-400 mt-2 text-sm">Find study materials by subject</p>
          </Link>

          <Link 
            to="/subjects" 
            className="group glass-card p-6 card-hover animate-fade-in-up stagger-3"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-pink-500 flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:shadow-accent-500/50 transition-all group-hover:scale-110">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <svg className="w-6 h-6 text-slate-500 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mt-4 group-hover:text-accent-400 transition-colors">View Subjects</h3>
            <p className="text-slate-400 mt-2 text-sm">Browse available subjects</p>
          </Link>
        </div>

        {/* Recent Notes */}
        <div className="glass-card p-8 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Notes</h2>
            <Link to="/browse-notes" className="text-primary-500 hover:text-primary-400 text-sm font-medium transition-colors flex items-center gap-1">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-48 h-4 bg-white/10 rounded" />
                      <div className="w-32 h-3 bg-white/10 rounded" />
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400">No notes available yet.</p>
              {(user.role === 'teacher' || user.role === 'admin') && (
                <Link to="/upload-notes" className="inline-block mt-4 text-primary-500 hover:text-primary-400 font-medium">
                  Upload the first note →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note, index) => (
                <div 
                  key={note._id} 
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5 hover:border-white/10 group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">{note.title}</h4>
                      <p className="text-sm text-slate-400">
                        {note.subject?.name} • {note.branch?.name || note.branch} • Year {note.semester}
                      </p>
                    </div>
                  </div>
                  <a
                    href={note.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-brand-gradient text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
