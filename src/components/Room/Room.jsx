import React, { useState, useEffect, useRef } from "react";
import Peer from "simple-peer";
import styled from "styled-components";
import socket from "../../socket";
import VideoCard from "../Video/VideoCard";
import BottomBar from "../BottomBar/BottomBar";
import Chat from "../Chat/Chat";
import BreakoutRooms from "./BreakOutRoom"; // Import the new component

// params
import { useParams } from "react-router-dom";

const Room = () => {
  const currentUser = sessionStorage.getItem("user");
  const [peers, setPeers] = useState([]);
  const [userVideoAudio, setUserVideoAudio] = useState({
    localUser: { video: true, audio: true },
  });

  const [videoDevices, setVideoDevices] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  const [showVideoDevices, setShowVideoDevices] = useState(false);
  const [showBreakoutRooms, setShowBreakoutRooms] = useState(false);

  const peersRef = useRef([]);
  const userVideoRef = useRef();
  const screenTrackRef = useRef();
  const userStream = useRef();
  const { roomId } = useParams(); // this will work with react-router-dom v6
  console.log("roomId: ", roomId);

  useEffect(() => {
    console.log("effect roomId: ", roomId);

    // Get Video Devices
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const filtered = devices.filter((device) => device.kind === "videoinput");
      setVideoDevices(filtered);
    });
    ///here new Code

    ///new ode

    // Set Back Button Event
    window.addEventListener("popstate", goToBack);

    // Connect Camera & Mic
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        userVideoRef.current.srcObject = stream;
        userStream.current = stream;

        socket.emit("BE-join-room", { roomId, userName: currentUser });

        // Handle new viewers
        socket.on("FE-new-viewer", ({ viewerId, userName }) => {
          console.log("New viewer joined:", viewerId, userName);
          if (userStream.current) {
            const peer = new Peer({
              initiator: true,
              trickle: false,
              stream: userStream.current,
            });

            peer.on("signal", (signal) => {
              socket.emit("BE-send-signal-to-viewer", { viewerId, signal });
            });

            socket.on(
              "FE-viewer-signal",
              ({ viewerId: signalViewerId, signal }) => {
                if (signalViewerId === viewerId) {
                  peer.signal(signal);
                }
              }
            );

            peer.on("connect", () => {
              console.log("Peer connected to viewer:", viewerId);
            });

            peer.on("error", (err) => {
              console.error("Peer error with viewer:", err);
            });

            peersRef.current.push({
              peerID: viewerId,
              peer,
              userName,
            });
          }
        });

        socket.on("FE-call-accepted", ({ signal, answerId }) => {
          console.log("view", answerId);
          const peerIdx = findPeer(answerId);
          console.log("istur", peerIdx);
          if (peerIdx && peerIdx.peer) {
            // Check if peerIdx exists and has a peer property
            peerIdx.peer.signal(signal);
          } else {
            console.error("Peer not found for answerId:", answerId);
          }
        });

        socket.on("FE-user-leave", ({ userId, userName }) => {
          const peerIdx = findPeer(userId);

          if (peerIdx && peerIdx.peer) {
            // Check if peerIdx exists and has a peer property
            peerIdx.peer.destroy();
            setPeers((users) => {
              users = users.filter(
                (user) => user.peerID !== peerIdx.peer.peerID
              );
              return [...users];
            });
            peersRef.current = peersRef.current.filter(
              ({ peerID }) => peerID !== userId
            );
          } else {
            console.error("Peer not found for userId:", userId);
          }
        });
      });

    socket.on("FE-toggle-camera", ({ userId, switchTarget }) => {
      const peerIdx = findPeer(userId);

      if (peerIdx && peerIdx.userName) {
        // Check if peerIdx exists and has a userName
        setUserVideoAudio((preList) => {
          let video = preList[peerIdx.userName].video;
          let audio = preList[peerIdx.userName].audio;

          if (switchTarget === "video") video = !video;
          else audio = !audio;

          return {
            ...preList,
            [peerIdx.userName]: { video, audio },
          };
        });
      } else {
        console.error("Peer not found for userId:", userId);
      }
    });

    return () => {
      console.log("disconnect");
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  function findPeer(id) {
    return peersRef.current.find((p) => p.peerID === id);
  }

  function createUserVideo(peer, index, arr) {
    console.log("createUserVideo", peer, index, arr);
    return (
      <VideoBox
        className={`width-peer${peers.length > 8 ? "" : peers.length}`}
        onClick={expandScreen}
        key={index}
      >
        {writeUserName(peer.userName)}
        <FaIcon className="fas fa-expand" />
        <VideoCard key={index} peer={peer} number={arr.length} />
      </VideoBox>
    );
  }

  function writeUserName(userName, index) {
    if (userVideoAudio.hasOwnProperty(userName)) {
      if (!userVideoAudio[userName].video) {
        return <UserName key={userName}>{userName}</UserName>;
      }
    }
  }

  // Open Chat
  const clickChat = (e) => {
    e.stopPropagation();
    setDisplayChat(!displayChat);
  };
  const [removedata, setRemoveData] = useState(null);
  useEffect(() => {
    setRemoveData(JSON.parse(localStorage.getItem("removeData")));
    if (removedata) {
      socket.emit("BE-leave-room", {
        roomId: removedata.roomName,
        leaver: removedata.userName,
      });
    }
    sessionStorage.removeItem("user");
  });
  // BackButton
  const goToBack = (e) => {
    e.preventDefault();
    socket.emit("BE-leave-room", { roomId, leaver: currentUser });
    sessionStorage.removeItem("user");
  };

  const toggleCameraAudio = (e) => {
    const target = e.target.getAttribute("data-switch");

    setUserVideoAudio((preList) => {
      let videoSwitch = preList["localUser"].video;
      let audioSwitch = preList["localUser"].audio;

      if (target === "video") {
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
        } else {
          userStream.current.getAudioTracks()[0].enabled = audioSwitch;
        }
      }

      return {
        ...preList,
        localUser: { video: videoSwitch, audio: audioSwitch },
      };
    });

    socket.emit("BE-toggle-camera-audio", { roomId, switchTarget: target });
  };

  const clickScreenSharing = () => {
    if (!screenShare) {
      navigator.mediaDevices
        .getDisplayMedia({ cursor: true })
        .then((stream) => {
          const screenTrack = stream.getTracks()[0];

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              peer.streams[0]
                .getTracks()
                .find((track) => track.kind === "video"),
              screenTrack,
              userStream.current
            );
          });

          // Listen click end
          screenTrack.onended = () => {
            peersRef.current.forEach(({ peer }) => {
              peer.replaceTrack(
                screenTrack,
                peer.streams[0]
                  .getTracks()
                  .find((track) => track.kind === "video"),
                userStream.current
              );
            });
            userVideoRef.current.srcObject = userStream.current;
            setScreenShare(false);
          };

          userVideoRef.current.srcObject = stream;
          screenTrackRef.current = screenTrack;
          setScreenShare(true);
        });
    } else {
      screenTrackRef.current.onended();
    }
  };

  const expandScreen = (e) => {
    const elem = e.target;

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      /* IE/Edge */
      elem.msRequestFullscreen();
    }
  };

  const clickBackground = () => {
    if (!showVideoDevices) return;

    setShowVideoDevices(false);
  };

  const clickCameraDevice = (event) => {
    if (
      event &&
      event.target &&
      event.target.dataset &&
      event.target.dataset.value
    ) {
      const deviceId = event.target.dataset.value;
      const enabledAudio =
        userVideoRef.current.srcObject.getAudioTracks()[0].enabled;

      navigator.mediaDevices
        .getUserMedia({ video: { deviceId }, audio: enabledAudio })
        .then((stream) => {
          const newStreamTrack = stream
            .getTracks()
            .find((track) => track.kind === "video");
          const oldStreamTrack = userStream.current
            .getTracks()
            .find((track) => track.kind === "video");

          userStream.current.removeTrack(oldStreamTrack);
          userStream.current.addTrack(newStreamTrack);

          peersRef.current.forEach(({ peer }) => {
            // replaceTrack (oldTrack, newTrack, oldStream);
            peer.replaceTrack(
              oldStreamTrack,
              newStreamTrack,
              userStream.current
            );
          });
        });
    }
  };

  useEffect(() => {
    // ... (keep existing code)

    socket.on("FE-user-join-breakout", ({ userId, userName, roomName }) => {
      // Remove user from main room peers
      setPeers((prevPeers) =>
        prevPeers.filter((peer) => peer.peerID !== userId)
      );
    });

    socket.on("FE-user-leave-breakout", ({ userId, userName }) => {
      // Add user back to main room peers
      const peer = createPeer(userId, socket.id, userStream.current);
      peer.userName = userName;
      peer.peerID = userId;

      setPeers((prevPeers) => [...prevPeers, peer]);
    });

    // Clean up
    return () => {
      // ... (keep existing cleanup code)
      socket.off("FE-user-join-breakout");
      socket.off("FE-user-leave-breakout");
    };
  }, []);
  const toggleBreakoutRooms = () => {
    setShowBreakoutRooms(!showBreakoutRooms);
  };
  return (
    <MainContainer>
      <RoomContainer onClick={clickBackground}>
        <VideoAndBarContainer>
          <Header>
            <div className="meeting-status">
              <span className="status-dot">⬤</span>
              <span>On going meeting</span>
              <span className="moderator-badge">Moderator View</span>
            </div>
            <h1>MEETING 01 - PROJECT NAME</h1>
            <LeaveButton>Leave</LeaveButton>
          </Header>
          <VideoContainer>
            {/* Current User Video */}
            <VideoBox
              className={`width-peer${peers.length > 8 ? "" : peers.length}`}
            >
              {userVideoAudio["localUser"].video ? null : (
                <UserName>{currentUser}</UserName>
              )}
              <FaIcon className="fas fa-expand" />
              <MyVideo
                onClick={expandScreen}
                ref={userVideoRef}
                muted
                autoPlay
              ></MyVideo>
            </VideoBox>
            {/* Joined User Vidoe */}
            {peers &&
              peers.map((peer, index, arr) =>
                createUserVideo(peer, index, arr)
              )}
          </VideoContainer>
          <BottomBar
            clickScreenSharing={clickScreenSharing}
            clickChat={clickChat}
            clickCameraDevice={clickCameraDevice}
            goToBack={goToBack}
            toggleCameraAudio={toggleCameraAudio}
            userVideoAudio={userVideoAudio["localUser"]}
            screenShare={screenShare}
            videoDevices={videoDevices}
            showVideoDevices={showVideoDevices}
            setShowVideoDevices={setShowVideoDevices}
            toggleBreakoutRooms={toggleBreakoutRooms}
          />
        </VideoAndBarContainer>
        <Chat display={displayChat} roomId={roomId} />
        {showBreakoutRooms && (
          <BreakoutRooms
            roomId={roomId}
            currentUser={currentUser}
            peers={peers}
          />
        )}
      </RoomContainer>
    </MainContainer>
  );
};

const MainContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #f0f0f0;
`;

const RoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom right, #f0f0f0, #e0e0e0);
`;

const VideoAndBarContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  margin: 1rem auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
    @media (max-width: 728px) {
      font-size: 1.2rem;
      text-align: center;
      width: 100%;
    }
  }

  .meeting-status {
    display: flex;
    align-items: center;

    span {
      color: #555;
      margin-left: 0.5rem;
    }
  }

  @media (max-width: 728px) {
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    .meeting-status {
      margin-top: 0.5rem;
    }
  }
`;

const StatusDot = styled.span`
  color: #ff4d4f;
  font-size: 1.2rem;
  margin-right: 0.5rem;
`;

const ModeratorBadge = styled.span`
  background-color: #ffa940;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: bold;
`;

const LeaveButton = styled.button`
  background-color: #ff4d4f;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff7875;
  }
`;

const VideoContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  flex-grow: 1;
  overflow-y: auto;
  height: 90%;
  width: 94%;
  border-radius: 10px;
  margin: 0 auto;
  background-color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
`;

const VideoBox = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }

  > video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserName = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.9rem;
`;

const FaIcon = styled.i`
  display: none;
  position: absolute;
  right: 15px;
  top: 15px;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }
`;

const MyVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export default Room;