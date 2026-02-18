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
      // Auto-fill year and semester from subject, and branch from subject's course
      setFormData({
        ...formData,
        subjectId,
        courseId: selectedSubject.course,
        year: selectedSubject.year,
        semester: selectedSubject.semester,
        branch: selectedCourseObj?.name || ''
      });
      // Also update selected course to match
      setSelectedCourse(selectedSubject.course);
    } else {
      setFormData({
        ...formData,
        subjectId,
        branch: ''
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage({ type: 'success', text: 'Note uploaded successfully!' });
      
      setFormData({
        title: '',
        subjectId: '',
        courseId: formData.courseId,
        year: user?.year || 1,
        semester: 1,
        branch: user?.branch || '',
        description: '',
        file: null
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Upload failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Upload Study Notes</h2>

        {message.text && (
          <div
            className={`p-4 mb-4 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="input"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              Subject
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleSubjectChange}
              className="input"
              required
              disabled={!selectedCourse}
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>

          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-bold mb-2">
              File (PDF, DOC, PPT)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Uploading...' : 'Upload Notes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadNotes;
