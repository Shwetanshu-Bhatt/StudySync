import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FriendAvatar = ({ src, name, size = 'standard' }) => {
  const sizeClass = `friend-avatar-${size}`;
  const initial = name?.trim().charAt(0).toUpperCase() || '?';

  return src ? (
    <img src={src} alt="" className={`friend-avatar-image ${sizeClass}`} />
  ) : (
    <span className={`friend-avatar ${sizeClass}`} aria-hidden="true">{initial}</span>
  );
};

const Friends = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [displayedCount, setDisplayedCount] = useState(5);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const loadMoreRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [friends, user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && displayedCount < suggestions.length) {
          loadMoreSuggestions();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadingMore, displayedCount, suggestions]);

  const loadMoreSuggestions = useCallback(() => {
    if (loadingMore || displayedCount >= suggestions.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + 5, suggestions.length));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, displayedCount, suggestions.length]);

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
      
      const friendUserIds = currentFriends.map(f => f.user?._id).filter(Boolean);
      
      const nonFriends = allUsers.filter(u => !friendIds.has(u._id) && u._id !== user?._id);
      
      const suggested = nonFriends.map(u => {
        let score = 0;
        let reasons = [];
        
        if (u.branch === user?.branch) {
          score += 5;
          reasons.push('Same Course');
        }
        
        if (u.year === user?.year) {
          score += 3;
          reasons.push('Same Year');
        }
        
        const mutualFriends = friendUserIds.filter(fid => 
          allUsers.some(au => au._id === fid && 
            (au.friends?.some(f => f.user?._id === u._id)))
        );
        if (mutualFriends.length > 0) {
          score += 4;
          reasons.push(`${mutualFriends.length} Mutual Friend(s)`);
        }
        
        if (u.role === user?.role) {
          score += 1;
        }
        
        return { 
          ...u, 
          suggestionScore: score,
          suggestionReasons: reasons
        };
      });
      
      const result = suggested
        .sort((a, b) => b.suggestionScore - a.suggestionScore);
      
      setSuggestions(result);
      setDisplayedCount(5);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setShowDropdown(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/search?q=${query}`);
        setSearchResults(res.data.users);
      } catch (error) {
        console.error('Error searching users:', error);
      }
      setLoading(false);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowDropdown(false);
  };

  const sendFriendRequest = async (userId) => {
    try {
      await api.post(`/users/friend-request/${userId}`);
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
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const res = await api.post(`/users/decline-friend/${requestId}`);
      fetchFriendRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const removeFriend = async (friendId) => {
    try {
      await api.delete(`/users/friends/${friendId}`);
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const startDMChat = async (friendUser) => {
    try {
      const res = await api.post(`/chat/dm/${friendUser._id}`);
      const room = res.data.room;
      navigate(`/chat?roomId=${room._id}`);
      setSelectedFriend(null);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const tabs = [
    { id: 'friends', label: 'My Friends', count: friends.length, icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.5 8c0-3.5 1.9-5.3 5.5-5.3 2.2 0 3.9.7 4.8 2M16 11a3 3 0 1 0 0-6m-1 8.7c2.8.4 4.2 1.9 4.2 4.6' },
    { id: 'requests', label: 'Requests', count: friendRequests.length, icon: 'M4 10.5h4l2 3h4l2-3h4M5 10.5V19h14v-8.5M12 3v6m-2-2 2 2 2-2' },
    { id: 'suggestions', label: 'Find Friends', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
  ];

  return (
    <div className="min-h-screen pb-12 px-3 sm:px-6 lg:px-8 pt-4 md:pt-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-0 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-secondary-500/5 rounded-full blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto relative">
        <div className="mb-6 md:mb-8 animate-fade-in-up">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
            Friends <span className="text-brand-gradient">&</span> Community
          </h1>
          <p className="text-slate-400 text-sm md:text-lg">Connect with peers and build your network</p>
        </div>

        <div className="flex gap-2 mb-6 md:mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-gradient text-white shadow-lg shadow-primary-500/25'
                  : 'glass text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="text-sm md:text-base">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'suggestions' && (
          <div className="animate-fade-in-up">
            <div className="relative mb-6">
              <form onSubmit={handleSearchSubmit} className="flex gap-4">
                <div className="flex-1 relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                    placeholder="Search by name or email..."
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
                  />
                  {loading && (
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                </div>
                <button type="submit" className="px-8 py-4 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25">
                  Search
                </button>
              </form>

              {showDropdown && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-card rounded-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      <p className="px-4 py-2 text-xs text-slate-500 uppercase tracking-wider">Search Results</p>
                      {searchResults.slice(0, 8).map((result) => (
                        <div
                          key={result._id}
                          onClick={() => {
                            setSearchQuery(result.name);
                            setShowDropdown(false);
                            sendFriendRequest(result._id);
                          }}
                          className="px-4 py-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors"
                        >
                          <FriendAvatar src={result.avatar} name={result.name} size="small" />
                          <div className="flex-1">
                            <p className="font-semibold text-white">{result.name}</p>
                            <p className="text-slate-400 text-sm">{result.email}</p>
                          </div>
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-slate-300 capitalize">{result.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-400">
                      <p>No users found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show search results inline when dropdown is closed but there's a search query */}
            {showDropdown === false && searchQuery && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">Search Results for "{searchQuery}"</h3>
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div key={result._id} className="glass-card p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <FriendAvatar src={result.avatar} name={result.name} />
                        <div>
                          <p className="font-semibold text-white">{result.name}</p>
                          <p className="text-slate-400 text-sm">{result.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300 capitalize">{result.role}</span>
                        {result._id !== user?._id && (
                          <button onClick={() => sendFriendRequest(result._id)} disabled={result.requestSent} className={`px-5 py-2 rounded-xl font-medium transition-all ${result.requestSent ? 'bg-white/10 text-slate-400 cursor-not-allowed' : 'bg-brand-gradient text-white hover:opacity-90 shadow-lg shadow-primary-500/25'}`}>
                            {result.requestSent ? 'Request Sent' : 'Add Friend'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400">No users found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Show suggestions when not searching and dropdown is closed */}
            {!showDropdown && searchQuery === '' && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white mb-4">Suggested Friends</h3>
                {suggestions.length === 0 ? (
                  <p className="friends-inline-empty">No classmates to suggest right now.</p>
                ) : suggestions.slice(0, displayedCount).map((suggestion) => (
                  <div key={suggestion._id} className="glass-card p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <FriendAvatar src={suggestion.avatar} name={suggestion.name} />
                      <div>
                        <p className="font-semibold text-white flex items-center gap-2">
                          {suggestion.name}
                        </p>
                        <p className="text-slate-400 text-sm">{suggestion.email}</p>
                        <p className="text-slate-500 text-xs">
                          {suggestion.role} • Year {suggestion.year}
                          {suggestion.suggestionReasons && suggestion.suggestionReasons.length > 0 && (
                            <span className="ml-2 text-primary-400">
                              • {suggestion.suggestionReasons.join(', ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(suggestion._id)}
                      className="px-5 py-2 bg-brand-gradient hover:opacity-90 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/25"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
                
                {displayedCount < suggestions.length && (
                  <div className="py-6 text-center">
                    <button 
                      onClick={loadMoreSuggestions}
                      disabled={loadingMore}
                      className="px-6 py-3 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3 animate-fade-in-up">
            {friendRequests.length === 0 ? (
              <div className="friends-inline-empty">
                <span>REQUESTS</span>
                <p>No pending friend requests.</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request._id} className="glass-card p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <FriendAvatar src={request.from?.avatar} name={request.from?.name} />
                    <div>
                      <p className="font-semibold text-white">{request.from?.name || 'Unknown'}</p>
                      <p className="text-slate-400 text-sm">{request.from?.email}</p>
                      <p className="text-slate-500 text-xs">{new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => acceptFriendRequest(request._id)} className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-lg">Accept</button>
                    <button onClick={() => declineFriendRequest(request._id)} className="px-5 py-2 bg-white/10 hover:bg-red-500/20 text-white rounded-xl font-medium transition-colors">Decline</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
            {friends.length === 0 ? (
              <div className="friends-empty-state col-span-full">
                <p className="friends-empty-overline">STUDYSYNC COMMUNITY</p>
                <div className="friends-empty-main">
                  <div>
                    <h2>Find your classmates.</h2>
                    <p>Connect with people from your courses and start a study conversation.</p>
                  </div>
                  <button onClick={() => setActiveTab('suggestions')} className="friends-empty-action">
                    Find classmates <span aria-hidden="true">→</span>
                  </button>
                </div>
              </div>
            ) : (
              friends.map((friend) => {
                const friendUser = friend.user || {};
                return (
                  <div key={friend._id || friendUser._id} className="glass-card p-5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                      <FriendAvatar src={friendUser.avatar} name={friendUser.name} size="large" />
                      <div>
                        <p className="font-semibold text-white text-lg">{friendUser.name || 'Unknown'}</p>
                        <p className="text-slate-400 text-sm">{friendUser.email}</p>
                        <p className="text-slate-500 text-xs capitalize">{friendUser.role}</p>
                      </div>
                    </div>
                    <div className="friend-card-actions flex gap-2">
                      <button onClick={() => setSelectedFriend(friendUser)} className="friend-chat-button flex-1 px-4 py-2.5 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Chat
                      </button>
                      <button type="button" onClick={() => removeFriend(friendUser._id)} className="friend-remove-button px-4 py-2.5 bg-white/10 hover:bg-red-500/20 text-white rounded-xl font-medium transition-colors" aria-label={'Remove ' + (friendUser.name || 'friend')}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedFriend && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 rounded-2xl max-w-sm w-full animate-fade-in-up">
            <h3 className="text-xl font-bold text-white mb-4">Start Chat with {selectedFriend.name}?</h3>
            <div className="flex gap-3">
              <button onClick={() => startDMChat(selectedFriend)} className="flex-1 px-5 py-3 bg-brand-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all">Start Chat</button>
              <button onClick={() => setSelectedFriend(null)} className="px-5 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
