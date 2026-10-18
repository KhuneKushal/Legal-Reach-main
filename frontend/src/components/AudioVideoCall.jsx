import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { getPeerConfig } from '../utils/config';
import './AudioVideoCall.css';

const AudioVideoCall = ({ socket, user, receiverId, isInitiator, onClose }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera or microphone is not supported in this browser.");
      return;
    }

    const roomId = [user._id, receiverId].sort().join('_');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        streamRef.current = currentStream;
        if (myVideo.current) myVideo.current.srcObject = currentStream;

        // Let PeerJS generate a unique ID — avoids "ID is taken" errors
        const peerConfig = getPeerConfig();
        const peer = new Peer(undefined, {
          host: peerConfig.host,
          port: peerConfig.port,
          path: peerConfig.path,
          secure: peerConfig.secure,
          debug: 1
        });

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          // Share our peer ID with the other side via socket
          socket.emit('join_call_room', { roomId, userId: user._id, peerId: id });
        });

        // Listen for the other peer's ID (initiator calls, receiver waits)
        socket.on('peer_id', (data) => {
          if (data.userId !== user._id && isInitiator && peerRef.current) {
            const call = peerRef.current.call(data.peerId, streamRef.current);
            if (!call) {
              console.error('Failed to initiate call to', data.peerId);
              return;
            }
            call.on('stream', (userStream) => {
              if (userVideo.current) userVideo.current.srcObject = userStream;
            });
            call.on('close', () => setCallEnded(true));
            setCallAccepted(true);
          }
        });

        // Receiver answers incoming call
        peer.on('call', (call) => {
          call.answer(currentStream);
          call.on('stream', (userStream) => {
            if (userVideo.current) userVideo.current.srcObject = userStream;
          });
          call.on('close', () => setCallEnded(true));
          setCallAccepted(true);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
        });

        peerRef.current = peer;
      })
      .catch((err) => {
        console.error('Media error:', err);
        alert('Camera/microphone access failed: ' + err.name);
      });

    return () => {
      socket.off('peer_id');
      if (peerRef.current) peerRef.current.destroy();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const leaveCall = () => {
    setCallEnded(true);
    socket.off('peer_id');
    if (peerRef.current) peerRef.current.destroy();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div className="call-overlay">
      <div className="video-container">
        {stream && (
          <video playsInline muted ref={myVideo} autoPlay className="my-video" />
        )}
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideo} autoPlay className="user-video" />
        ) : (
          <div className="calling-text">Connecting...</div>
        )}
      </div>
      <div className="call-controls">
        <button className="btn-end" onClick={leaveCall}>End Call</button>
      </div>
    </div>
  );
};

export default AudioVideoCall;