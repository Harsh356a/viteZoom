import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";

const Main = () => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    // Socket listener for checking user existence
    socket.on("FE-error-user-exist", ({ error }) => {
      if (!error) {
        const roomName = roomRef.current.value;
        const userName = userRef.current.value;

        sessionStorage.setItem("user", userName);
        const recentRoom = localStorage.getItem("recentRoom");

        navigate(`/room/${recentRoom}`);
      } else {
        setErr(error);
        setErrMsg("User name already exists");
      }
    });

    // Set up a continuous effect to watch localStorage for changes
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

    // Emit on component mount and whenever the localStorage values change
    window.addEventListener("storage", handleStorageChange);

    // Emit immediately if the values are already in localStorage
    handleStorageChange();

    return () => {
      socket.off("FE-error-user-exist"); // Cleanup socket listener
      window.removeEventListener("storage", handleStorageChange); // Cleanup event listener
    };
  }, []);

  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

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
        <Input type="text" id="roomName" ref={roomRef} />
      </Row>
      <Row>
        <Label htmlFor="userName">User Name</Label>
        <Input type="text" id="userName" ref={userRef} />
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
