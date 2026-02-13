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
      alert(error.response?.data?.message || 'Failed to create subject');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Subjects</h2>
        {(isTeacher || isAdmin) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Subject'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-6 max-w-xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                placeholder="Subject Name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                type="text"
                name="code"
                placeholder="Subject Code"
                value={formData.code}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input"
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
                  className="input"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Sem {sem}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Create Subject
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : Object.keys(groupedSubjects).length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">No subjects available.</p>
        </div>
      ) : (
        Object.entries(groupedSubjects)
          .sort(([a], [b]) => a - b)
          .map(([year, yearSubjects]) => (
            <div key={year} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Year {year}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearSubjects.map((subject) => (
                  <div key={subject._id} className="card">
                    <h4 className="font-semibold text-lg">{subject.name}</h4>
                    <p className="text-gray-600">{subject.code}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Semester {subject.semester} | {subject.course?.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default Subjects;
