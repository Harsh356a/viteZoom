import React, { useRef, useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";
import { useNavigate, useLocation } from "react-router-dom";

const Main = () => {
  const roomRef = useRef();
  const userRef = useRef();
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [participants, setParticipants] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Get userName from query params
  const queryParams = new URLSearchParams(location.search);
  const userNameFromQuery = queryParams.get("fullName") || ""; // Fallback to empty string if not present
  useEffect(() => {
    console.log(userNameFromQuery);
  });
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

  function addParticipant() {
    const roomName = roomRef.current.value || "DefaultRmm"; // Use default room name if empty
    const userName = userRef.current.value || userNameFromQuery; // Use userName from query if not filled

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      fetch("https://serverzoom-mpbv.onrender.com/api/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomName, userName }),
      })
        .then((response) => response.json())
        .then((data) => {
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
        .catch((error) => {
          setErr(true);
          setErrMsg("Error adding participant");
        });
    }
  }

  return (
    <Container>
      <Form>
        <Label htmlFor="roomName">You are Joining :</Label>
        <StyledInput
          type="text"
          id="roomName"
          ref={roomRef}
          readOnly
          placeholder="Enter Room Name"
        />
      </Form>
      <Form>
        <Label htmlFor="userName">Your Name is :</Label>
        <StyledInput
          type="text"
          id="userName"
          readOnly
          ref={userRef}
          defaultValue={userNameFromQuery} // Pre-fill the username from the query
          placeholder="Enter Your Name"
        />
      </Form>
      <ButtonContainer>
        <JoinButton onClick={addParticipant}>Join Meeting</JoinButton>
      </ButtonContainer>
      {err && <Error>{errMsg}</Error>}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  background-color: black;
  width: 100%;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Form = styled.div`
  margin: 20px 0;
`;

const Label = styled.label`
  font-size: 1.2rem;
  margin-bottom: 10px;
  display: block;
  color: #f6c300;
`;

const StyledInput = styled.input`
  background: none;
  border: none;
  border-bottom: 2px solid #f6c300;
  padding: 10px 5px;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;

  ::placeholder {
    color: #f6c300;
  }

  &:focus {
    border-bottom: 2px solid orange;
  }
`;

const ButtonContainer = styled.div`
  margin-top: 20px;
`;

const JoinButton = styled.button`
  background-color: orange;
  color: black;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #ff9f00;
  }
`;

const Error = styled.div`
  color: #e85a71;
  margin-top: 20px;
  font-size: 1.2rem;
`;

export default Main;
