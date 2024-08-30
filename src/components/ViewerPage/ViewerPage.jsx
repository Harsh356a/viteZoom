import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import socket from "../../socket";

const ViewerPage = () => {
  const [peers, setPeers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [streams, setStreams] = useState([]);
  const [displayChat, setDisplayChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [observerMessages, setObserverMessages] = useState([]);
  const [observerInput, setObserverInput] = useState("");
  const { roomId } = useParams();
  const peersRef = useRef([]);
  const messagesEndRef = useRef(null);
  const observerMessagesEndRef = useRef(null);
  const observerName = localStorage.getItem("observername");

  useEffect(() => {
    if (isAuthenticated) {
      socket.emit("BE-join-as-viewer", { roomId });

      socket.on("FE-viewer-init", (participants) => {
        const peers = [];
        participants.forEach(({ userId, info }) => {
          const peer = createPeer(userId, socket.id);
          peersRef.current.push({
            peerID: userId,
            peer,
          });
          peers.push({
            peerID: userId,
            peer,
            userName: info.userName,
          });
        });
        setPeers(peers);
      });

      socket.on("FE-viewer-update", ({ type, userId, info }) => {
        if (type === "join") {
          const peer = createPeer(userId, socket.id);
          peersRef.current.push({
            peerID: userId,
            peer,
          });
          setPeers((prevPeers) => [
            ...prevPeers,
            { peerID: userId, peer, userName: info.userName },
          ]);
        } else if (type === "leave") {
          const peerObj = peersRef.current.find((p) => p.peerID === userId);
          if (peerObj) {
            peerObj.peer.destroy();
          }
          const newPeers = peersRef.current.filter((p) => p.peerID !== userId);
          peersRef.current = newPeers;
          setPeers((prevPeers) => prevPeers.filter((p) => p.peerID !== userId));
        }
      });

      socket.on("FE-receive-call", ({ signal, from }) => {
        const peerObj = peersRef.current.find((p) => p.peerID === from);
        if (peerObj) {
          peerObj.peer.signal(signal);
        }
      });

      socket.on('FE-receive-message', ({ msg, sender, isBreakoutRoom, roomId: msgRoomId }) => {
        if (!isBreakoutRoom && msgRoomId === roomId) {
          setMessages((msgs) => [...msgs, { sender, msg }]);
        }
      });

      socket.on('FE-receive-observer-message', ({ msg, sender }) => {
        setObserverMessages((msgs) => [...msgs, { sender, msg }]);
      });

      return () => {
        socket.emit("BE-leave-as-viewer", { roomId });
        peersRef.current.forEach(({ peer }) => {
          peer.destroy();
        });
        socket.off("FE-viewer-init");
        socket.off("FE-viewer-update");
        socket.off("FE-receive-call");
        socket.off("FE-receive-message");
        socket.off("FE-receive-observer-message");
      };
    }
  }, [isAuthenticated, roomId]);

  useEffect(() => {
    scrollToBottom(messagesEndRef);
    scrollToBottom(observerMessagesEndRef);
  }, [messages, observerMessages]);

  function createPeer(userId, callerId) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
    });

    peer.on("signal", (signal) => {
      socket.emit("BE-viewer-send-signal", {
        userId,
        signal,
      });
    });

    peer.on("stream", (stream) => {
      setPeers((prevPeers) =>
        prevPeers.map((p) =>
          p.peerID === userId ? { ...p, stream } : p
        )
      );
    });

    socket.on("FE-viewer-receive-signal", ({ userId: signalUserId, signal }) => {
      if (signalUserId === userId) {
        peer.signal(signal);
      }
    });

    return peer;
  }

  const handleAuthentication = (e) => {
    e.preventDefault();
    if (password === "123") {
      setIsAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const scrollToBottom = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth'});
  }

  const sendObserverMessage = (e) => {
    e.preventDefault();
    if (observerInput.trim()) {
      socket.emit('BE-send-observer-message', { roomId, msg: observerInput, sender: observerName });
      setObserverMessages((msgs) => [...msgs, { sender: "You", msg: observerInput }]);
      setObserverInput("");
    }
  };

  const toggleChat = () => {
    setDisplayChat(!displayChat);
  };

  if (!isAuthenticated) {
    return (
      <AuthContainer>
        <h2>Enter Password to View Room {roomId}</h2>
        <form onSubmit={handleAuthentication}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <button type="submit">Submit</button>
        </form>
      </AuthContainer>
    );
  }

  return (
    <ViewerContainer>
      <h2>Viewing Room: {roomId}</h2>
      <Button onClick={toggleChat}>{displayChat ? 'Hide Chats' : 'Show Chats'}</Button>
      <ContentContainer>
        <VideoContainer>
          {peers.map(peer => (
            <VideoBox key={peer.peerID}>
              {peer.stream ? (
                <video
                  playsInline
                  autoPlay
                  ref={video => {
                    if (video) video.srcObject = peer.stream;
                  }}
                />
              ) : (
                <p>Waiting for {peer.userName}'s stream...</p>
              )}
              <UserName>{peer.userName}</UserName>
            </VideoBox>
          ))}
        </VideoContainer>
        {displayChat && (
          <ChatsContainer>
            <ChatContainer>
              <TopHeader>Main Room Chat</TopHeader>
              <ChatArea>
                <MessageList>
                  {messages.map(({ sender, msg }, idx) => (
                    <Message key={idx}>
                      <strong>{sender}</strong>
                      <p>{msg}</p>
                    </Message>
                  ))}
                  <div ref={messagesEndRef} />
                </MessageList>
              </ChatArea>
            </ChatContainer>
            <ChatContainer>
              <TopHeader>Observer Chat</TopHeader>
              <ChatArea>
                <MessageList>
                  {observerMessages.map(({ sender, msg }, idx) => (
                    <Message key={idx} isYou={sender === "You"}>
                      <strong>{sender}</strong>
                      <p>{msg}</p>
                    </Message>
                  ))}
                  <div ref={observerMessagesEndRef} />
                </MessageList>
              </ChatArea>
              <ObserverInputContainer onSubmit={sendObserverMessage}>
                <ObserverInput
                  value={observerInput}
                  onChange={(e) => setObserverInput(e.target.value)}
                  placeholder="Enter your message"
                />
                <SendButton type="submit">Send</SendButton>
              </ObserverInputContainer>
            </ChatContainer>
          </ChatsContainer>
        )}
      </ContentContainer>
    </ViewerContainer>
  );
};

const AuthContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const ViewerContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentContainer = styled.div`
  display: flex;
  width: 100%;
  height: calc(100vh - 100px);
`;

const VideoContainer = styled.div`
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  overflow-y: auto;
`;

const VideoBox = styled.div`
  width: 300px;
  height: 225px;
  margin: 10px;
  position: relative;
`;

const UserName = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px;
  border-radius: 5px;
`;

const ChatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 50%;
  background-color: white;
  border-left: 1px solid #ccc;
`;

const TopHeader = styled.div`
  width: 100%;
  padding: 10px;
  font-weight: 600;
  font-size: 18px;
  color: black;
  border-bottom: 1px solid #ccc;
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 15px;
  color: #454552;
`;

const Message = styled.div`
  max-width: 80%;
  align-self: ${props => props.isYou ? 'flex-end' : 'flex-start'};
  margin-bottom: 10px;

  > strong {
    font-size: 14px;
    margin-bottom: 5px;
  }

  > p {
    background-color: ${props => props.isYou ? '#4ea1d3' : '#f1f0f0'};
    color: ${props => props.isYou ? 'white' : 'black'};
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 14px;
  }
`;

const ObserverInputContainer = styled.form`
  display: flex;
  padding: 10px;
  border-top: 1px solid #ccc;
`;

const ObserverInput = styled.input`
  flex: 1;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SendButton = styled.button`
  margin-left: 10px;
  padding: 5px 10px;
  background-color: #4ea1d3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const Button = styled.button`
  margin: 10px;
  padding: 8px 16px;
  background-color: #4ea1d3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export default ViewerPage;