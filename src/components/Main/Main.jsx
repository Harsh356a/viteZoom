import React, { useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";
import { useNavigate, useSearchParams } from "react-router-dom";

const Main = () => {
  const [searchParams] = useSearchParams();

  // Extract query parameters and set initial state
  const [roomName, setRoomName] = useState(searchParams.get('room') || "");
  const [userName, setUserName] = useState(searchParams.get('name') || "");
  
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Socket listener for checking user existence
    socket.on("FE-error-user-exist", ({ error }) => {
      if (!error) {
        sessionStorage.setItem("user", userName);
        const recentRoom = localStorage.getItem("recentRoom");

        navigate(`/room/${recentRoom}?name=${userName}&room=${roomName}`);
      } else {
        setErr(error);
        setErrMsg("User name already exists");
      }
    });

    const handleStorageChange = () => {
      const recentRoom = localStorage.getItem("recentRoom");
      const recentUsername = localStorage.getItem("recentUsername");

      if (recentRoom && recentUsername) {
        socket.emit("BE-check-user", {
          roomId: recentRoom,
          userName: recentUsername,
        });
        console.log("Emitted to socket: ", {
          roomId: recentRoom,
          userName: recentUsername,
        });
      }
    };

    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();

    return () => {
      socket.off("FE-error-user-exist");
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [roomName, userName, navigate]);

  function clickJoin() {
    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name or User Name");
    } else {
      localStorage.setItem("recentRoom", roomName);
      localStorage.setItem("recentUsername", userName);

      socket.emit("BE-check-user", { roomId: roomName, userName });
      console.log("BE-check-user: ", { roomId: roomName, userName });
    }
  }

  return (
    <MainContainer>
      <Row>
        <Label htmlFor="roomName">Room Name</Label>
        <Input
          type="text"
          id="roomName"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
      </Row>
      <Row>
        <Label htmlFor="userName">User Name</Label>
        <Input
          type="text"
          id="userName"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </Row>
      <JoinButton onClick={clickJoin}> Join </JoinButton>
      {err ? <Error>{errMsg}</Error> : null}
    </MainContainer>
  );
};

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 15px;
  line-height: 35px;
`;

const Label = styled.label``;

const Input = styled.input`
  width: 150px;
  height: 35px;
  margin-left: 15px;
  padding-left: 10px;
  outline: none;
  border: none;
  border-radius: 5px;
`;

const Error = styled.div`
  margin-top: 10px;
  font-size: 20px;
  color: #e85a71;
`;

const JoinButton = styled.button`
  height: 40px;
  margin-top: 35px;
  outline: none;
  border: none;
  border-radius: 15px;
  color: #d8e9ef;
  background-color: #4ea1d3;
  font-size: 25px;
  font-weight: 500;

  :hover {
    background-color: #7bb1d1;
    cursor: pointer;
  }
`;

export default Main;
