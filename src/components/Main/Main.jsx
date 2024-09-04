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
  const userNameFromQuery = queryParams.get("userName") || ""; // Fallback to empty string if not present

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
    const roomName = roomRef.current.value || "DefaultRoom"; // Use default room name if empty
    const userName = userRef.current.value || userNameFromQuery; // Use userName from query if not filled

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
    const roomName = roomRef.current.value || "DefaultRoom"; // Use default room name if empty
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

  function removeParticipant() {
    const roomName = roomRef.current.value || "DefaultRoom"; // Use default room name if empty
    const userName = userRef.current.value || userNameFromQuery; // Use userName from query if not filled

    if (!roomName || !userName) {
      setErr(true);
      setErrMsg("Enter Room Name and User Name");
    } else {
      fetch("https://serverzoom-mpbv.onrender.com/api/removeUser", {
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
          }
        })
        .catch((error) => {
          setErr(true);
          setErrMsg("Error removing participant");
        });
    }
  }

  return (
    <div className="">
      <div>
        <label htmlFor="roomName">Room Name</label>
        <input type="text" id="roomName" ref={roomRef} />
      </div>
      <div>
        <label htmlFor="userName">User Name</label>
        <input
          type="text"
          id="userName"
          ref={userRef}
          defaultValue={userNameFromQuery} // Pre-fill the username from the query
        />
      </div>
      <div>
        <div onClick={clickJoin}>Join</div>
        <div onClick={addParticipant}>Add Participant</div>
        <div onClick={removeParticipant}>Remove Participant</div>
      </div>
      {err ? <Error>{errMsg}</Error> : null}
      <div>
        <h3>Participants:</h3>
        <ul>
          {participants.map((participant, index) => (
            <li key={index}>{participant.info.userName}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Main;
