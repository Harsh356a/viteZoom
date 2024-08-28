import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import styled from "styled-components";
import socket from "../../socket";
import VideoCard from "../Video/VideoCard";

const BreakoutVideoRoom = ({ roomId, currentUser, onLeave }) => {
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });

  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const userStream = useRef();

  useEffect(() => {
    let mounted = true;

    const setupMediaStream = async () => {
      try {
        console.log("Attempting to get user media");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Got user media stream");
        // if (!mounted) return;

        userStream.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }

        console.log("Emitting BE-join-breakout-room");
        socket.emit("BE-join-breakout-room", { roomId, userName: currentUser });

        // socket.on("FE-user-join", (users) => {
        //   console.log("Received FE-user-join", users);
        //   if (!mounted) return;
        //   const peers = [];
        //   users.forEach(({ userId, info }) => {
        //     let { userName, video, audio } = info;
        //     if (userName !== currentUser) {
        //       const peer = createPeer(userId, socket.id, stream);
        //       peer.userName = userName;
        //       peer.peerID = userId;
        //       peersRef.current.push({
        //         peerID: userId,
        //         peer,
        //         userName,
        //       });
        //       peers.push(peer);
        //       setUserVideoAudio((prev) => ({
        //         ...prev,
        //         [peer.userName]: { video, audio },
        //       }));
        //     }
        //   });
        //   setPeers(peers);
        // });

        // socket.on("FE-receive-call", ({ signal, from, info }) => {
        //   const { userName, video, audio } = info;
        //   const peerIdx = findPeer(from);
        //   if (!peerIdx) {
        //     const peer = addPeer(signal, from, stream);
        //     peer.userName = userName;
        //     peersRef.current.push({
        //       peerID: from,
        //       peer,
        //       userName: userName,
        //     });
        //     setPeers((users) => [...users, peer]);
        //     setUserVideoAudio((prev) => ({
        //       ...prev,
        //       [peer.userName]: { video, audio },
        //     }));
        //   }
        // });

        // socket.on("FE-call-accepted", ({ signal, answerId }) => {
        //   const peerIdx = findPeer(answerId);
        //   peerIdx.peer.signal(signal);
        // });

        // socket.on("FE-user-leave", ({ userId, userName }) => {
        //   const peerIdx = findPeer(userId);
        //   peerIdx.peer.destroy();
        //   setPeers((users) =>
        //     users.filter((user) => user.peerID !== peerIdx.peer.peerID)
        //   );
        //   peersRef.current = peersRef.current.filter(
        //     ({ peerID }) => peerID !== userId
        //   );
        // });
      } catch (error) {
        console.error("Error getting user media:", error);
      }
    };

    setupMediaStream();

   
  }, [roomId, currentUser]);

  function createPeer(userId, caller, stream) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-call-user", {
        userToCall: userId,
        from: caller,
        signal,
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerId, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-accept-call", { signal, to: callerId });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  const toggleCameraAudio = (type) => {
    setUserVideoAudio((prev) => {
      let videoSwitch = prev.localUser.video;
      let audioSwitch = prev.localUser.audio;

      if (type === "video") {
        const userVideoTrack =
          userVideoRef.current.srcObject.getVideoTracks()[0];
        videoSwitch = !videoSwitch;
        userVideoTrack.enabled = videoSwitch;
      } else {
        const userAudioTrack =
          userVideoRef.current.srcObject.getAudioTracks()[0];
        audioSwitch = !audioSwitch;
        if (userAudioTrack) {
          userAudioTrack.enabled = audioSwitch;
        }
      }

      return {
        ...prev,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit("BE-toggle-camera-audio", { roomId, switchTarget: type });
  };

  return (
    <BreakoutVideoContainer>
      <VideoBox className={`width-peer${peers.length > 8 ? "" : peers.length}`}>
        {userVideoAudio.localUser.video ? null : (
          <UserName>{currentUser}</UserName>
        )}
        <MyVideo ref={userVideoRef} muted autoPlay playsInline />
      </VideoBox>
      {console.log("peers",peers)}
      {peers.map((peer, index) => (
        <VideoBox
          className={`width-peer${peers.length > 8 ? "" : peers.length}`}
          key={index}
        >
          {writeUserName(peer.userName)}
          <VideoCard key={index} peer={peer} number={peers.length} />
        </VideoBox>
      ))}
      <BottomBar>
        <CameraButton onClick={() => toggleCameraAudio("video")}>
          Camera {userVideoAudio.localUser.video ? "On" : "Off"}
        </CameraButton>
        <AudioButton onClick={() => toggleCameraAudio("audio")}>
          Audio {userVideoAudio.localUser.audio ? "On" : "Off"}
        </AudioButton>
        <LeaveButton onClick={onLeave}>Leave Breakout Room</LeaveButton>
      </BottomBar>
    </BreakoutVideoContainer>
  );

  function writeUserName(userName) {
    if (userVideoAudio[userName]) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }
};

const BreakoutVideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-wrap: wrap;
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  > video {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
`;

const MyVideo = styled.video``;

const UserName = styled.div`
  position: absolute;
  font-size: calc(20px + 5vmin);
  z-index: 1;
`;

const BottomBar = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 10px;
`;

const CameraButton = styled.button`
  margin: 0 10px;
`;

const AudioButton = styled.button`
  margin: 0 10px;
`;

const LeaveButton = styled.button`
  margin: 0 10px;
  background-color: #f44336;
  color: white;
`;

export default BreakoutVideoRoom;
