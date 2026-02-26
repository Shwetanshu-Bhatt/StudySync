import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Subjects = () => {
  const { isTeacher, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    course: '',
    year: 1,
    semester: 1
  });

  useEffect(() => {
    fetchSubjects();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', formData);
      setShowForm(false);
      setFormData({
        name: '',
        code: '',
        course: '',
        year: 1,
        semester: 1
      });
      fetchSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const groupedSubjects = subjects.reduce((acc, subject) => {
    if (!acc[subject.year]) {
      acc[subject.year] = [];
    }
    acc[subject.year].push(subject);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="text-brand-gradient">Subjects</span> Management
            </h1>
            <p className="text-slate-400">View and manage all subjects</p>
          </div>
          {(isTeacher || isAdmin) && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? 'Cancel' : 'Add Subject'}
            </button>
          )}
        </div>

        {/* Add Subject Form */}
        {showForm && (
          <div className="glass-card p-6 mb-8 animate-fade-in-up">
            <h3 className="text-lg font-semibold text-white mb-4">Add New Subject</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Subject Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
                  required
                />
                <input
                  type="text"
                  name="code"
                  placeholder="Subject Code"
                  value={formData.code}
                  onChange={handleChange}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 cursor-pointer"
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 cursor-pointer"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg"
              >
                Create Subject
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse glass-card p-6">
                <div className="w-10 h-10 bg-white/10 rounded-xl mb-3" />
                <div className="w-3/4 h-5 bg-white/10 rounded mb-2" />
                <div className="w-1/2 h-4 bg-white/10 rounded" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedSubjects).length === 0 ? (
          <div className="glass-card text-center py-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 text-lg">No subjects available</p>
          </div>
        ) : (
          Object.entries(groupedSubjects)
            .sort(([a], [b]) => a - b)
            .map(([year, yearSubjects], yearIndex) => (
              <div key={year} className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${yearIndex * 100}ms` }}>
                  <span className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                    Y{year}
                  </span>
                  Year {year}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearSubjects.map((subject, index) => (
                    <div 
                      key={subject._id} 
                      className="glass-card p-5 card-hover animate-fade-in-up"
                      style={{ animationDelay: `${(yearIndex * 100) + (index * 50)}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-white text-lg">{subject.name}</h4>
                          <p className="text-slate-500 text-sm">{subject.code}</p>
                        </div>
                        <span className="px-2 py-1 bg-white/10 rounded-lg text-xs text-slate-400">
                          Sem {subject.semester}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-3">
                        {subject.course?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Subjects;
