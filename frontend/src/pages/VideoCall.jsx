import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../utils/socket';
import { getPeerConfig } from '../utils/config';
import Peer from 'peerjs';

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const userName = searchParams.get('userName');
  const receiverId = searchParams.get('receiverId');

  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [error, setError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();
  const socket = useRef();
  const streamRef = useRef();
  const otherPeerIdRef = useRef(null);
  const timerRef = useRef(null);

  const isInitiator = Boolean(receiverId);

  const cleanupCall = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCallEnded(true);
  }, []);

  const leaveCall = useCallback(() => {
    if (socket.current && roomId) {
      socket.current.emit('end_call', { roomId });
    }
    cleanupCall();
    navigate(-1);
  }, [socket, roomId, cleanupCall, navigate]);

  // Start call timer when call is accepted
  useEffect(() => {
    if (callAccepted && !callEnded) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callAccepted, callEnded]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => { track.enabled = !track.enabled; });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => { track.enabled = !track.enabled; });
      setIsCameraOff(!isCameraOff);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    const userData = userStr ? JSON.parse(userStr) : null;

    if (!userData || !tokenData || !roomId) {
      navigate('/login');
      return;
    }

    setUser(userData);

    socket.current = getSocket();
    if (!socket.current || !socket.current.connected) {
      socket.current = connectSocket(userData._id, tokenData);
    }

    if (!socket.current) {
      setError('Unable to connect to signaling server.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera or microphone is not supported in this browser.");
      navigate(-1);
      return;
    }

    const peerConfig = getPeerConfig();

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        streamRef.current = currentStream;
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        // Let PeerJS generate a unique ID — avoids "ID is taken" errors
        const peer = new Peer(undefined, {
          host: peerConfig.host,
          port: peerConfig.port,
          path: peerConfig.path,
          secure: peerConfig.secure,
          debug: 1
        });

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          socket.current.emit('join_call_room', { roomId, userId: userData._id, peerId: id });
        });

        peer.on('call', (call) => {
          call.answer(currentStream);
          call.on('stream', (userStream) => {
            setRemoteStream(userStream);
            setCallAccepted(true);
          });
          call.on('close', () => setCallEnded(true));
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError('Peer connection error: ' + err.type);
        });

        peerRef.current = peer;
      })
      .catch((err) => {
        console.error('Media error:', err);
        alert('Camera or microphone access failed: ' + err.name);
        navigate(-1);
      });

    // When we get the other peer's ID, call them immediately (initiator only)
    socket.current.on('peer_id', (data) => {
      if (data.userId !== userData._id) {
        otherPeerIdRef.current = data.peerId;

        if (isInitiator && peerRef.current && streamRef.current) {
          const call = peerRef.current.call(data.peerId, streamRef.current);
          if (!call) return;
          call.on('stream', (userStream) => {
            setRemoteStream(userStream);
            setCallAccepted(true);
          });
          call.on('close', () => setCallEnded(true));
        }
      }
    });

    socket.current.on('call_ended', (data) => {
      if (data?.roomId !== roomId) return;
      cleanupCall();
      setTimeout(() => navigate(-1), 800);
    });

    return () => {
      if (socket.current) {
        socket.current.off('peer_id');
        socket.current.off('call_ended');
      }
      cleanupCall();
    };
  }, [roomId, receiverId, navigate, isInitiator, cleanupCall]);

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div style={styles.container}>
      {/* Main video area */}
      <div style={styles.videoArea}>
        {remoteStream ? (
          <video playsInline ref={userVideo} autoPlay style={styles.remoteVideo} />
        ) : (
          <div style={styles.waitingOverlay}>
            <div style={styles.pulseRing}></div>
            <div style={styles.waitingText}>
              {callAccepted ? 'Connecting video...' : 'Waiting for other person to join...'}
            </div>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {stream && (
          <video
            playsInline muted ref={myVideo} autoPlay
            style={{
              ...styles.localVideo,
              opacity: isCameraOff ? 0.3 : 1
            }}
          />
        )}

        {/* Error display */}
        {error && (
          <div style={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* Call duration timer */}
        {callAccepted && !callEnded && (
          <div style={styles.timerBadge}>
            🔴 {formatDuration(callDuration)}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div style={styles.controlsBar}>
        <button
          onClick={toggleMute}
          style={{
            ...styles.controlBtn,
            backgroundColor: isMuted ? '#ff5252' : 'rgba(255,255,255,0.15)'
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>

        <button
          onClick={toggleCamera}
          style={{
            ...styles.controlBtn,
            backgroundColor: isCameraOff ? '#ff5252' : 'rgba(255,255,255,0.15)'
          }}
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? '📷' : '📹'}
        </button>

        <button
          onClick={leaveCall}
          style={styles.endCallBtn}
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#0f0f1a',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', 'Segoe UI', sans-serif"
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  localVideo: {
    position: 'absolute',
    bottom: '100px',
    right: '20px',
    width: '200px',
    height: '150px',
    borderRadius: '16px',
    border: '3px solid rgba(255,255,255,0.3)',
    objectFit: 'cover',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    transition: 'opacity 0.3s ease'
  },
  waitingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px'
  },
  pulseRing: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '4px solid rgba(100, 140, 255, 0.5)',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  waitingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '18px',
    fontWeight: '500'
  },
  errorBanner: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(255,82,82,0.9)',
    color: '#fff',
    padding: '10px 24px',
    borderRadius: '12px',
    fontSize: '14px',
    backdropFilter: 'blur(10px)'
  },
  timerBadge: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '8px 20px',
    borderRadius: '24px',
    fontSize: '16px',
    fontWeight: '600',
    backdropFilter: 'blur(10px)',
    letterSpacing: '1px'
  },
  controlsBar: {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '16px',
    padding: '12px 24px',
    background: 'rgba(0,0,0,0.5)',
    borderRadius: '40px',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  controlBtn: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  endCallBtn: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#e53935',
    color: 'white',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    transform: 'rotate(135deg)',
    outline: 'none'
  }
};

export default VideoCall;