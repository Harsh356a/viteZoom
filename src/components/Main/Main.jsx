import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";
import { useNavigate } from "react-router-dom";

const Main = () => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [participants, setParticipants] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    socket.on("FE-error-user-exist", ({ error }) => {
      if (error) {
        setErr(true);
        setErrMsg("User name already exists");
      }
    });

    socket.on("FE-user-join", (users) => {
      setParticipants(users);
    });

    socket.on("FE-user-leave", ({ userName }) => {
      setParticipants((prevParticipants) =>
        prevParticipants.filter((p) => p.info.userName !== userName)
      );
    });

    return () => {
      socket.off("FE-error-user-exist");
      socket.off("FE-user-join");
      socket.off("FE-user-leave");
    };
  }, [navigate]);

  function clickJoin() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      setErr(false);
      socket.emit("BE-join-room", { roomId: roomName, userName });
      sessionStorage.setItem("user", userName);
      navigate(`/room/${roomName}`);
    }
  }

  function addParticipant() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      fetch('https://serverzoom-mpbv.onrender.com/api/addUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName, userName }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setErr(true);
            setErrMsg(data.error);
          } else {
            setErr(false);
            setErrMsg("");
            // After successfully adding the user, join the room
            socket.emit("BE-join-room", { roomId: roomName, userName });
            sessionStorage.setItem("user", userName);
            navigate(`/room/${roomName}`);
          }
        })
        .catch(error => {
          setErr(true);
          setErrMsg("Error adding participant");
        });
    }
  }

  function removeParticipant() {
    const roomName = roomRef.current.value;
    const userName = userRef.current.value;

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      fetch('https://serverzoom-mpbv.onrender.com/api/removeUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId: roomName, userName }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            setErr(true);
            setErrMsg(data.error);
          } else {
            setErr(false);
            setErrMsg("");
          }
        })
        .catch(error => {
          setErr(true);
          setErrMsg("Error removing participant");
        });
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
      <ButtonContainer>
        <JoinButton onClick={clickJoin}>Join</JoinButton>
        <AddButton onClick={addParticipant}>Add Participant</AddButton>
        <RemoveButton onClick={removeParticipant}>Remove Participant</RemoveButton>
      </ButtonContainer>
      {err ? <Error>{errMsg}</Error> : null}
      <ParticipantList>
        <h3>Participants:</h3>
        <ul>
          {participants.map((participant, index) => (
            <li key={index}>{participant.info.userName}</li>
          ))}
        </ul>
      </ParticipantList>
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

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 35px;
`;

const Button = styled.button`
  height: 40px;
  outline: none;
  border: none;
  border-radius: 15px;
  color: #d8e9ef;
  font-size: 25px;
  font-weight: 500;
  cursor: pointer;
`;

const JoinButton = styled(Button)`
  background-color: #4ea1d3;
  &:hover {
    background-color: #7bb1d1;
  }
`;

const AddButton = styled(Button)`
  background-color: #4caf50;
  &:hover {
    background-color: #45a049;
  }
`;

const RemoveButton = styled(Button)`
  background-color: #f44336;
  &:hover {
    background-color: #d32f2f;
  }
`;

const ParticipantList = styled.div`
  margin-top: 20px;
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    margin-bottom: 5px;
  }
`;

export default Main;