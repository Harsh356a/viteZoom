import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";
import { useNavigate, useLocation } from "react-router-dom";

const Main = () => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const userName = searchParams.get("userName")?.replace(/['"]+/g, "");
  const roomName = searchParams.get("roomName")?.replace(/['"]+/g, "");
  let userName1 = localStorage.setItem("userName", userName);
  let roomName1 = localStorage.setItem("roomName", roomName);
  useEffect(() => {
    let userName1 = localStorage.getItem("userName");
    let roomName1 = localStorage.getItem("roomName");
    console.log("URL parameters:", userName1, roomName1);
    if (roomName1 && userName1) {
      // If both parameters are present, automatically join the room
      joinRoom(roomName1, userName1);
    }
  });

  useEffect(() => {
    let userName1 = localStorage.getItem("userName");
    let roomName1 = localStorage.getItem("roomName");
    socket.on("FE-error-user-exist", ({ error }) => {
      if (!error) {
        const roomName = roomRef.current?.value || roomName1;
        const userName = userRef.current?.value;
        console.log("Joining room:", roomName1, userName1);
        sessionStorage.setItem("user", userName1);
        navigate(`/room/${roomName1}`);
      } else {
        setErr(error);
        setErrMsg("User name already exists");
      }
    });

    // Clean up the event listener
    return () => {
      socket.off("FE-error-user-exist");
    };
  }, [navigate, location]);

  function joinRoom(roomName, userName) {
    console.log("Attempting to join room:", roomName, userName);
    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      socket.emit("BE-check-user", { roomName, userName });
      console.log("BE-check-user: ", { roomName, userName });
    }
  }

  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;
    joinRoom(roomName, userName);
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
