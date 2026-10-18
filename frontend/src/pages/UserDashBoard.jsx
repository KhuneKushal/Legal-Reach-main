import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectSocket } from '../utils/socket';
import API_BASE_URL from '../utils/config';
import './Dashboard.css';

const UserDashBoard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeView, setActiveView] = useState('connections');
  const socketRef = useRef(null);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser || !token) {
      navigate('/login');
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
  }, [navigate, token]);

  // Socket connection
  useEffect(() => {
    if (!user || !token) return;

    socketRef.current = connectSocket(user._id, token);

    const handleIncomingCall = (data) => {
      const accept = window.confirm(`${data.callerName} is calling you (${data.callType}). Accept?`);
      if (accept) {
        navigate(`/video-call?roomId=${data.roomId}&userName=${user.name}`);
      }
    };

    socketRef.current.on('incoming_call_offer', handleIncomingCall);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('incoming_call_offer', handleIncomingCall);
      }
    };
  }, [user?._id, token, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user || !token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [connectionsRes, requestsRes, convoRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/connect/my-connections`, config),
          axios.get(`${API_BASE_URL}/api/connect/my-requests`, config),
          axios.get(`${API_BASE_URL}/api/chat/conversations`, config)
        ]);

        setConnections(connectionsRes.data || []);
        setRequests(requestsRes.data || []);
        setConversations(convoRes.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id, token]);

  const startVideoCall = (contact) => {
    if (!socketRef.current || !contact) return;
    const roomId = `video_${user._id}_${contact._id}_${Date.now()}`;
    socketRef.current.emit('initiate_call', {
      callerId: user._id,
      receiverId: contact._id,
      callerName: user.name,
      roomId,
      callType: 'video'
    });
    navigate(`/video-call?roomId=${roomId}&userName=${user.name}&receiverId=${contact._id}`);
  };

  const handleLogout = () => {
    if (socketRef.current) socketRef.current.disconnect();
    localStorage.clear();
    navigate('/login');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="cd-wrapper">
        <div className="cd-loading">
          <div className="cd-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-wrapper">
      {/* Top bar */}
      <div className="cd-topbar">
        <div className="cd-topbar-left">
          <h1>⚖️ My Dashboard</h1>
        </div>
        <div className="cd-topbar-right">
          <div className="cd-user-info">
            <div className="cd-user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="cd-user-name">{user.name}</p>
              <p className="cd-user-email">{user.email}</p>
            </div>
          </div>
          <button className="cd-btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="cd-body">
        {/* Sidebar */}
        <div className="cd-sidebar">
          <nav className="cd-nav">
            <button
              className={`cd-nav-item ${activeView === 'connections' ? 'active' : ''}`}
              onClick={() => setActiveView('connections')}
            >
              <span className="cd-icon">👥</span>
              <span className="cd-label">My Lawyers</span>
              {connections.length > 0 && <span className="cd-badge">{connections.length}</span>}
            </button>

            <button
              className={`cd-nav-item ${activeView === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveView('chats')}
            >
              <span className="cd-icon">💬</span>
              <span className="cd-label">My Chats</span>
              {conversations.length > 0 && <span className="cd-badge">{conversations.length}</span>}
            </button>

            <button
              className={`cd-nav-item ${activeView === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveView('requests')}
            >
              <span className="cd-icon">📩</span>
              <span className="cd-label">My Requests</span>
              {requests.length > 0 && <span className="cd-badge">{requests.length}</span>}
            </button>

            <button
              className={`cd-nav-item ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveView('profile')}
            >
              <span className="cd-icon">👤</span>
              <span className="cd-label">My Profile</span>
            </button>

            <button className="cd-nav-item cd-nav-find" onClick={() => navigate('/find-lawyers')}>
              <span className="cd-icon">🔍</span>
              <span className="cd-label">Find Lawyers</span>
            </button>
          </nav>
        </div>

        {/* Main content */}
        <div className="cd-content">
          {error && <div className="cd-alert cd-alert-error">{error}</div>}
          {success && <div className="cd-alert cd-alert-success">{success}</div>}

          {/* CONNECTIONS VIEW */}
          {activeView === 'connections' && (
            <div className="cd-section">
              <h2>My Connected Lawyers</h2>
              {connections.length === 0 ? (
                <div className="cd-empty">
                  <p>You haven't connected with any lawyers yet.</p>
                  <button className="cd-btn-primary" onClick={() => navigate('/find-lawyers')}>
                    🔍 Find Lawyers
                  </button>
                </div>
              ) : (
                <div className="cd-cards-grid">
                  {connections.map((lawyer) => (
                    <div key={lawyer._id} className="cd-card">
                      <div className="cd-card-avatar">{lawyer.name?.charAt(0).toUpperCase()}</div>
                      <h4>{lawyer.name}</h4>
                      <p className="cd-card-email">{lawyer.email}</p>
                      {lawyer.specialization && <span className="cd-card-tag">{lawyer.specialization}</span>}
                      <div className="cd-card-actions">
                        <button
                          className="cd-btn-chat"
                          onClick={() => navigate(`/chat?receiverId=${lawyer._id}&receiverName=${lawyer.name}`)}
                        >
                          💬 Chat
                        </button>
                        <button
                          className="cd-btn-video"
                          onClick={() => startVideoCall(lawyer)}
                        >
                          📹 Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHATS VIEW */}
          {activeView === 'chats' && (
            <div className="cd-section">
              <h2>My Conversations</h2>
              {conversations.length === 0 ? (
                <div className="cd-empty">
                  <p>No conversations yet. Start chatting with your connected lawyers!</p>
                </div>
              ) : (
                <div className="cd-convo-list">
                  {conversations.map((convo, index) => (
                    <div
                      key={convo.contact?._id || index}
                      className="cd-convo-item"
                      onClick={() => navigate(`/chat?receiverId=${convo.contact?._id}&receiverName=${convo.contact?.name}`)}
                    >
                      <div className="cd-convo-avatar">
                        {convo.contact?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="cd-convo-details">
                        <div className="cd-convo-header">
                          <h4>{convo.contact?.name || 'Unknown'}</h4>
                          <span className="cd-convo-time">
                            {convo.lastMessageTime
                              ? new Date(convo.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
                              : ''}
                          </span>
                        </div>
                        <p className="cd-convo-preview">
                          {convo.lastMessage?.length > 50
                            ? convo.lastMessage.substring(0, 50) + '...'
                            : convo.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REQUESTS VIEW */}
          {activeView === 'requests' && (
            <div className="cd-section">
              <h2>My Connection Requests</h2>
              {requests.length === 0 ? (
                <div className="cd-empty">
                  <p>You haven't sent any connection requests yet.</p>
                  <button className="cd-btn-primary" onClick={() => navigate('/find-lawyers')}>
                    🔍 Find Lawyers
                  </button>
                </div>
              ) : (
                <div className="cd-request-list">
                  {requests.map((req) => (
                    <div key={req._id} className="cd-request-item">
                      <div className="cd-request-avatar">
                        {req.receiver?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="cd-request-info">
                        <h4>{req.receiver?.name || 'Lawyer'}</h4>
                        <p>{req.receiver?.email}</p>
                      </div>
                      <span className={`cd-request-status cd-status-${req.status}`}>
                        {req.status === 'pending' && '⏳ Pending'}
                        {req.status === 'accepted' && '✅ Accepted'}
                        {req.status === 'rejected' && '❌ Rejected'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROFILE VIEW */}
          {activeView === 'profile' && (
            <div className="cd-section">
              <h2>My Profile</h2>
              <div className="cd-profile-card">
                <div className="cd-profile-header">
                  <div className="cd-profile-avatar-large">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="cd-profile-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <span className="cd-role-badge">{user.role}</span>
                  </div>
                </div>
                <div className="cd-profile-details">
                  {user.phone && (
                    <div className="cd-detail-item">
                      <span className="cd-detail-label">Phone</span>
                      <span className="cd-detail-value">{user.phone}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="cd-detail-item">
                      <span className="cd-detail-label">City</span>
                      <span className="cd-detail-value">{user.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashBoard;