import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        if (res.data.user) {
          setFormData({
            name: res.data.user.name || '',
            email: res.data.user.email || '',
            year: res.data.user.year || '',
            avatar: res.data.user.avatar || ''
          });
          // Update the user context with fresh data including createdAt
          setUser(prev => ({ ...prev, ...res.data.user }));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Just show preview - don't upload yet
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, avatar: previewUrl }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Check if avatar is a blob URL (preview) - need to upload first
      if (formData.avatar && formData.avatar.startsWith('blob:')) {
        const response = await fetch(formData.avatar);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: blob.type });
        
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', file);

        const uploadRes = await api.post('/users/avatar', formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (uploadRes.data.user) {
          formData.avatar = uploadRes.data.user.avatar;
        }
      }

      // Update profile with avatar URL
      const res = await api.put('/users/profile', formData);
      setUser(res.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    }
    setLoading(false);
  };

  const getAvatarColor = (role) => {
    switch (role) {
      case 'teacher': return 'from-amber-500 to-orange-500';
      case 'admin': return 'from-red-500 to-pink-500';
      default: return 'from-primary-500 to-secondary-500';
    }
  };

  const getOrdinalSuffix = (num) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = num % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6 lg:px-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-2xl mx-auto relative pt-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white mb-2">
            My <span className="text-brand-gradient">Profile</span>
          </h1>
          <p className="text-slate-400 text-lg">Manage your account settings</p>
        </div>

        <div className="glass-card rounded-2xl p-8 animate-fade-in-up">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary-500/30 shadow-lg"
                />
              ) : (
                <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getAvatarColor(user?.role)} flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-primary-500/25`}>
                  {formData.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-brand-gradient p-2 rounded-full cursor-pointer hover:opacity-90 transition-all shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-slate-400 text-sm">Click the camera icon to change avatar</p>
          </div>

          {/* Role Badge */}
          <div className="flex justify-center mb-8">
            <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
              user?.role === 'admin' ? 'bg-red-500/20 text-red-400' :
              user?.role === 'teacher' ? 'bg-amber-500/20 text-amber-400' :
              'bg-primary-500/20 text-primary-400'
            }`}>
              {user?.role}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {message.text && (
              <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-slate-400 text-sm mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-500 cursor-not-allowed"
              />
              <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
            </div>

            {user?.role === 'student' && (
              <div>
                <label className="block text-slate-400 text-sm mb-2">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500/50"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Account Info */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type</span>
                <span className="text-slate-500 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Since</span>
                <span className="text-slate-500">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              {user?.year && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Year</span>
                  <span className="text-slate-500">{user.year}{getOrdinalSuffix(user.year)} Year</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
