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
        setFormData({
          ...formData,
          assignedCourses: formData.assignedCourses.filter(id => id !== courseId)
        });
      } else {
        setFormData({
          ...formData,
          assignedCourses: [...formData.assignedCourses, courseId]
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
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
      await api.put(`/users/assign-courses/${teacherId}`, {
        courseIds: selectedTeacher.assignedCourses
      });
      setSuccess('Courses assigned successfully');
      fetchTeachers();
      setSelectedTeacher(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign courses');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Manage Teachers</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Teacher Form */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Add New Teacher</h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                minLength={6}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Assign Courses (select multiple)
              </label>
              <div className="max-h-40 overflow-y-auto border rounded p-2">
                {courses.map((course) => (
                  <label key={course._id} className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="assignedCourses"
                      value={course._id}
                      checked={formData.assignedCourses.includes(course._id)}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {course.code} - {course.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Add Teacher'}
            </button>
          </form>
        </div>

        {/* Teachers List */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Existing Teachers</h2>
          
          {teachers.length === 0 ? (
            <p className="text-slate-400">No teachers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Courses</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher._id} className="border-b">
                      <td className="py-2">{teacher.name}</td>
                      <td className="py-2">{teacher.email}</td>
                      <td className="py-2">
                        <span className="text-sm text-gray-500">
                          {teacher.assignedCourses?.length || 0} courses
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => setSelectedTeacher({
                            ...teacher,
                            assignedCourses: teacher.assignedCourses || []
                          })}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Manage Courses
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Courses Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Assign Courses to {selectedTeacher.name}
            </h2>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm font-bold mb-2">
                Select Courses
              </label>
              <div className="max-h-60 overflow-y-auto border rounded p-2">
                {courses.map((course) => (
                  <label key={course._id} className="flex items-center mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeacher.assignedCourses.includes(course._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeacher({
                            ...selectedTeacher,
                            assignedCourses: [...selectedTeacher.assignedCourses, course._id]
                          });
                        } else {
                          setSelectedTeacher({
                            ...selectedTeacher,
                            assignedCourses: selectedTeacher.assignedCourses.filter(id => id !== course._id)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    {course.code} - {course.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setSelectedTeacher(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignCourses(selectedTeacher._id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTeachers;
