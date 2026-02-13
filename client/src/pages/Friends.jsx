import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [friends, user]);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/users/friends');
      setFriends(res.data.friends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const res = await api.get('/users/friend-requests');
      setFriendRequests(res.data.requests);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/users/search?q=');
      let allUsers = res.data.users || [];
      
      const friendsRes = await api.get('/users/friends');
      const currentFriends = friendsRes.data.friends || [];
      const friendIds = new Set(currentFriends.map(f => f.user?._id));
      
      const friends = allUsers.filter(u => friendIds.has(u._id));
      const nonFriends = allUsers.filter(u => !friendIds.has(u._id) && u._id !== user?._id);
      
      const suggested = nonFriends.map(u => {
        let score = 0;
        if (u.course?.toString() === user?.course?.toString()) score += 3;
        if (u.year === user?.year) score += 2;
        if (u.role === user?.role) score += 1;
        return { ...u, suggestionScore: score };
      });
      
      const result = [
        ...friends.map(u => ({ ...u, isFriend: true, suggestionScore: 10 })),
        ...suggested.sort((a, b) => b.suggestionScore - a.suggestionScore).slice(0, 10)
      ];
      
      setSuggestions(result);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setLoading(false);
  };

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
      alert('Friend request sent!');
      setSearchResults(searchResults.map(u => 
        u._id === userId ? { ...u, requestSent: true } : u
      ));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const res = await api.post(`/users/accept-friend/${requestId}`);
      alert(res.data.message || 'Friend request accepted!');
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Error accepting friend request');
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const res = await api.post(`/users/decline-friend/${requestId}`);
      alert(res.data.message || 'Friend request declined');
      fetchFriendRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Error declining friend request');
    }
  };

  const removeFriend = async (friendId) => {
    if (window.confirm('Are you sure you want to remove this friend?')) {
      try {
        await api.delete(`/users/friends/${friendId}`);
        fetchFriends();
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  const startDMChat = async (friendUser) => {
    try {
      const res = await api.post(`/chat/dm/${friendUser._id}`);
      const room = res.data.room;
      navigate(`/chat?roomId=${room._id}`);
      setSelectedFriend(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start chat');
    }
  };

  const getAvatarColor = (role) => {
    switch (role) {
      case 'teacher': return 'from-amber-500 to-orange-500';
      case 'admin': return 'from-red-500 to-pink-500';
      default: return 'from-blue-500 to-indigo-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Friends</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-700 pb-4">
          {[
            { id: 'friends', label: 'My Friends', count: friends.length },
            { id: 'requests', label: 'Requests', count: friendRequests.length },
            { id: 'suggestions', label: 'Suggestions', count: suggestions.length },
            { id: 'search', label: 'Find Friends' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="mb-8">
            <form onSubmit={handleSearch} className="flex gap-4 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Search
              </button>
            </form>

            {loading ? (
              <div className="text-center text-slate-400">Loading...</div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div key={result._id} className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(result.role)} flex items-center justify-center text-white font-bold`}>
                        {result.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{result.name}</p>
                        <p className="text-slate-400 text-sm">{result.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300 capitalize">{result.role}</span>
                      {result._id !== user?._id && (
                        <button
                          onClick={() => sendFriendRequest(result._id)}
                          disabled={result.requestSent}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            result.requestSent
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          {result.requestSent ? 'Request Sent' : 'Add Friend'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="text-center text-slate-400 py-8">No users found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Friend Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {friendRequests.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No pending friend requests</p>
            ) : (
              friendRequests.map((request) => (
                <div key={request._id} className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {request.from?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{request.from?.name || 'Unknown'}</p>
                      <p className="text-slate-400 text-sm">{request.from?.email}</p>
                      <p className="text-slate-500 text-xs">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request._id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => declineFriendRequest(request._id)}
                      className="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No suggestions available</p>
            ) : (
              suggestions.map((suggestion) => (
                <div key={suggestion._id} className="bg-slate-800 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(suggestion.role)} flex items-center justify-center text-white font-bold`}>
                      {suggestion.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white flex items-center gap-2">
                        {suggestion.name}
                        {suggestion.isFriend && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">Friend</span>
                        )}
                      </p>
                      <p className="text-slate-400 text-sm">{suggestion.email}</p>
                      <p className="text-slate-500 text-xs">
                        {suggestion.role} • Year {suggestion.year}
                      </p>
                    </div>
                  </div>
                  {suggestion.isFriend ? (
                    <span className="px-4 py-2 bg-slate-700 text-slate-400 rounded-lg font-medium cursor-not-allowed">
                      Already Friends
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(suggestion._id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Add Friend
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends List Tab */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.length === 0 ? (
              <p className="col-span-3 text-center text-slate-400 py-8">No friends yet. Start adding friends!</p>
            ) : (
              friends.map((friend) => {
                const friendUser = friend.user || {};
                return (
                  <div key={friend._id || friendUser._id} className="bg-slate-800 rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(friendUser.role)} flex items-center justify-center text-white font-bold`}>
                        {friendUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{friendUser.name || 'Unknown'}</p>
                        <p className="text-slate-400 text-sm">{friendUser.email}</p>
                        <p className="text-slate-500 text-xs capitalize">{friendUser.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedFriend(friendUser)}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Message
                      </button>
                      <button
                        onClick={() => removeFriend(friendUser._id)}
                        className="px-4 py-2 bg-slate-700 hover:bg-red-600 text-white rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Start DM Modal */}
        {selectedFriend && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Chat with {selectedFriend.name}</h2>
              <p className="text-slate-400 mb-4">This will open a direct message chat.</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startDMChat(selectedFriend)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Friends;
