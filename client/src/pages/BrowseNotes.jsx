import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BrowseNotes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    courseId: '',
    subjectId: '',
    year: '',
    semester: ''
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        const allCourses = response.data.courses;
        setCourses(allCourses);
        
        if (user?.role === 'student' && user?.branch) {
          const isObjectId = /^[0-9a-fA-F]{24}$/.test(user.branch);
          if (isObjectId) {
            setFilters(prev => ({ ...prev, courseId: user.branch }));
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!filters.courseId) {
        setSubjects([]);
        return;
      }
      try {
        const response = await api.get(`/courses/${filters.courseId}`);
        setSubjects(response.data.course.subjects || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [filters.courseId]);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const params = new URLSearchParams(activeFilters).toString();
      const response = await api.get(`/notes?${params}`);
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-secondary-500/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            Browse <span className="text-brand-gradient">Notes</span>
          </h1>
          <p className="text-slate-400 text-lg">Find study materials for your courses</p>
        </div>

        {/* Filters */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user?.role === 'student' ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Branch</p>
                  <p className="text-white font-medium">{courses.find(c => c._id === user?.branch)?.name || 'Not enrolled'}</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-slate-400 mb-2">Course</label>
                <select
                  name="courseId"
                  value={filters.courseId}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 transition-all"
                >
                  <option value="">All Courses</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-2">Subject</label>
              <select
                name="subjectId"
                value={filters.subjectId}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 transition-all"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 transition-all"
              >
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Semester</label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 transition-all"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse glass-card p-6">
                <div className="w-12 h-12 bg-white mb-4" />
                <div className="w/10 rounded-xl-3/4 h-5 bg-white/10 rounded mb-3" />
                <div className="w-1/2 h-4 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="glass-card text-center py-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg mb-2">
              {user?.course ? 'No notes found for your enrolled course.' : 'No notes found matching your criteria.'}
            </p>
            {user?.role === 'student' && !user?.course && (
              <p className="text-slate-500">Please contact admin to enroll you in a course.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note, index) => (
              <div 
                key={note._id} 
                className="glass-card p-6 card-hover animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-slate-300 uppercase">
                    {note.fileType}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-3">{note.title}</h3>
                
                <div className="space-y-1 mb-4">
                  {note.subject && (
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {note.subject?.name}
                    </p>
                  )}
                  <p className="text-sm text-slate-500">
                    {note.branch?.name || note.branch} | Year {note.year} | Sem {note.semester}
                  </p>
                  <p className="text-sm text-slate-500">
                    By: {note.uploadedBy?.name}
                  </p>
                </div>
                
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-brand-gradient text-white text-center rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseNotes;
