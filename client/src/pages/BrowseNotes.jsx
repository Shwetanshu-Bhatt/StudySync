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
        setCourses(response.data.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Browse Study Notes</h2>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="courseId"
            value={filters.courseId}
            onChange={handleFilterChange}
            className="input cursor-pointer"
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          <select
            name="subjectId"
            value={filters.subjectId}
            onChange={handleFilterChange}
            className="input cursor-pointer"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject._id} value={subject._id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>

          <select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="input cursor-pointer"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="input cursor-pointer"
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

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : notes.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">
            {user?.course 
              ? 'No notes found for your enrolled course.' 
              : 'No notes found matching your criteria.'}
          </p>
          {user?.role === 'student' && !user?.course && (
            <p className="text-gray-500 mt-2">
              Please contact admin to enroll you in a course.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
                  {note.course && (
                    <p className="text-sm text-blue-600 mb-1">
                      📚 {note.course.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-1">
                    📖 {note.subject?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {note.branch} | Year {note.year} | Sem {note.semester}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded by: {note.uploadedBy?.name}
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded uppercase">
                  {note.fileType}
                </span>
              </div>
              
              <div className="mt-4 flex gap-2">
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-1 text-center"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseNotes;
