import { useState, useEffect } from 'react';
import api from '../api/axios';

const ManageTeachers = () => {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    assignedCourses: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  useEffect(() => {
    fetchTeachers();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/auth/teachers');
      setTeachers(response.data.teachers);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'assignedCourses') {
      const courseId = value;
      if (formData.assignedCourses.includes(courseId)) {
        setFormData({ ...formData, assignedCourses: formData.assignedCourses.filter(id => id !== courseId) });
      } else {
        setFormData({ ...formData, assignedCourses: [...formData.assignedCourses, courseId] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.assignedCourses.length === 0) {
      setError('Please assign at least one course to the teacher');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/create-teacher', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        assignedCourses: formData.assignedCourses
      });
      setSuccess('Teacher created successfully');
      setFormData({ name: '', email: '', password: '', confirmPassword: '', assignedCourses: [] });
      fetchTeachers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCourses = async (teacherId) => {
    if (selectedTeacher.assignedCourses.length === 0) {
      setError('Please select at least one course');
      return;
    }
    try {
      await api.put(`/users/assign-courses/${teacherId}`, { courseIds: selectedTeacher.assignedCourses });
      setSuccess('Courses assigned successfully');
      fetchTeachers();
      setSelectedTeacher(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign courses');
    }
  };

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto relative">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">Manage <span className="text-brand-gradient">Teachers</span></h1>
          <p className="text-slate-400">Add and manage teacher accounts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Teacher Form */}
          <div className="glass-card p-6 animate-fade-in-up stagger-1">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              Add New Teacher
            </h2>

            {error && <div className="p-4 mb-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">{error}</div>}
            {success && <div className="p-4 mb-4 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" required />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" minLength={6} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white" required />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Assign Courses</label>
                <div className="max-h-40 overflow-y-auto bg-white/5 rounded-xl p-3 space-y-2">
                  {courses.map((course) => (
                    <label key={course._id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <input type="checkbox" name="assignedCourses" value={course._id} checked={formData.assignedCourses.includes(course._id)} onChange={handleChange} className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500" />
                      <span className="text-white text-sm">{course.code} - {course.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Creating...' : 'Add Teacher'}
              </button>
            </form>
          </div>

          {/* Teachers List */}
          <div className="glass-card p-6 animate-fade-in-up stagger-2">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Existing Teachers
            </h2>
            
            {teachers.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No teachers found.</p>
            ) : (
              <div className="space-y-3">
                {teachers.map((teacher) => (
                  <div key={teacher._id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{teacher.name}</p>
                        <p className="text-sm text-slate-400">{teacher.email}</p>
                        <p className="text-xs text-slate-500">{teacher.assignedCourses?.length || 0} courses</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedTeacher({ ...teacher, assignedCourses: teacher.assignedCourses || [] })} className="px-4 py-2 bg-white/10 hover:bg-primary-500/20 text-white rounded-xl text-sm transition-colors">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assign Courses Modal */}
        {selectedTeacher && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md p-6 animate-scale-in">
              <h2 className="text-xl font-bold text-white mb-2">Assign Courses to {selectedTeacher.name}</h2>
              <p className="text-sm text-slate-400 mb-4">Select courses to assign</p>
              <div className="mb-6 max-h-60 overflow-y-auto bg-white/5 rounded-xl p-3 space-y-2">
                {courses.map((course) => (
                  <label key={course._id} className="flex items-center gap-3 cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <input type="checkbox" checked={selectedTeacher.assignedCourses.includes(course._id)} onChange={(e) => {
                      if (e.target.checked) setSelectedTeacher({ ...selectedTeacher, assignedCourses: [...selectedTeacher.assignedCourses, course._id] });
                      else setSelectedTeacher({ ...selectedTeacher, assignedCourses: selectedTeacher.assignedCourses.filter(id => id !== course._id) });
                    }} className="w-4 h-4 rounded border-white/20 bg-white/10 text-primary-500" />
                    <span className="text-white text-sm">{course.code} - {course.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setSelectedTeacher(null)} className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                <button onClick={() => handleAssignCourses(selectedTeacher._id)} className="px-5 py-2.5 bg-brand-gradient text-white rounded-xl hover:opacity-90 transition-all shadow-lg">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTeachers;
