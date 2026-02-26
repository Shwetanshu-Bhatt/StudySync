import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const UploadNotes = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    courseId: '',
    year: user?.year || 1,
    semester: 1,
    branch: user?.branch || '',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedCourse) {
        setSubjects([]);
        return;
      }
      try {
        const response = await api.get(`/courses/${selectedCourse}`);
        setSubjects(response.data.course.subjects || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setSubjects([]);
      }
    };
    fetchSubjects();
  }, [selectedCourse]);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setFormData({
      ...formData,
      courseId,
      subjectId: '',
      branch: ''
    });
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    const selectedSubject = subjects.find(s => s._id === subjectId);
    const selectedCourseObj = courses.find(c => c._id === selectedSubject?.course);
    if (selectedSubject) {
      setFormData({
        ...formData,
        subjectId,
        courseId: selectedSubject.course,
        year: selectedSubject.year,
        semester: selectedSubject.semester,
        branch: selectedCourseObj?.name || ''
      });
      setSelectedCourse(selectedSubject.course);
    } else {
      setFormData({ ...formData, subjectId, branch: '' });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.courseId) {
      setMessage({ type: 'error', text: 'Please select a course' });
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      await api.post('/notes', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Note uploaded successfully!' });
      setFormData({
        title: '', subjectId: '', courseId: formData.courseId,
        year: user?.year || 1, semester: 1, branch: user?.branch || '',
        description: '', file: null
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Upload <span className="text-brand-gradient">Notes</span></h1>
          <p className="text-slate-400">Share your study materials with others</p>
        </div>

        <div className="glass-card p-8">
          {message.text && (
            <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <p>{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Course</label>
              <select value={selectedCourse} onChange={handleCourseChange} className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white cursor-pointer" required>
                <option value="">Select a course</option>
                {courses.map((course) => (<option key={course._id} value={course._id}>{course.code} - {course.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <select name="subjectId" value={formData.subjectId} onChange={handleSubjectChange} className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white cursor-pointer" required disabled={!selectedCourse}>
                <option value="">Select a subject</option>
                {subjects.map((subject) => (<option key={subject._id} value={subject._id}>{subject.code} - {subject.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500" placeholder="Enter note title" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 resize-none" rows={3} placeholder="Add a description..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">File (PDF, DOC, PPT)</label>
              <input type="file" onChange={handleFileChange} className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-gradient file:text-white" accept=".pdf,.doc,.docx,.ppt,.pptx" required />
            </div>

            <button type="submit" disabled={loading} className="w-full py-4 bg-brand-gradient hover:opacity-90 text-white font-semibold rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span>Uploading...</span></>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg><span>Upload Notes</span></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadNotes;
