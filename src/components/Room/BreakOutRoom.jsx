import React, { useState, useEffect } from "react";
import styled from "styled-components";
import socket from "../../socket";

const BreakoutRooms = ({ roomId, currentUser, peers }) => {
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    console.log("break")
    socket.on("FE-breakout-rooms-update", (rooms) => {
      setBreakoutRooms(rooms);
    });

    console.log("hhs")
    socket.on("FE-join-breakout-room", (roomName) => {
      setActiveRoom(roomName);
    });

    return () => {
      socket.off("FE-breakout-rooms-update");
      socket.off("FE-join-breakout-room");
    };
  }, []);

  const createBreakoutRoom = () => {
    console.log("Creating breakout room");
    console.log("Current roomId:", roomId);
    console.log("Current socket id:", socket);
    
    const roomName = `Breakout-${Date.now()}`;
    console.log("Emitting BE-create-breakout-room", { mainRoomId: roomId, breakoutRoomName: roomName });
    
    socket.emit("BE-create-breakout-room", {
      mainRoomId: roomId,
      breakoutRoomName: roomName,
    }, (response) => {
      if (response && response.success) {
        console.log("Breakout room created successfully:", response);
      } else {
        console.error("Failed to create breakout room:", response);
      }
    });
  };

  const joinBreakoutRoom = (roomName) => {
    console.log("triggers");
    socket.emit("BE-join-breakout-room", {
      mainRoomId: roomId,
      breakoutRoomName: roomName,
      userName: currentUser,
    });
  };

  const leaveBreakoutRoom = () => {
    console.log("triggers");
    socket.emit("BE-leave-breakout-room", {
      mainRoomId: roomId,
      userName: currentUser,
    });
    setActiveRoom(null);
  };

  return (
    <BreakoutContainer>
      <h3>Breakout Rooms</h3>
      {console.log(activeRoom)}
      {activeRoom ? (
        <div>
          <p>You are in: {activeRoom}</p>
          <Button onClick={leaveBreakoutRoom}>Leave Breakout Room</Button>
        </div>
      ) : (
        <div>
          <Button onClick={createBreakoutRoom}>Create Breakout Room</Button>
          {breakoutRooms.map((room, index) => (
            <RoomItem key={index}>
              {room}
              <Button onClick={() => joinBreakoutRoom(room)}>Join</Button>
            </RoomItem>
          ))}
        </div>
      )}
    </BreakoutContainer>
  );
};

const BreakoutContainer = styled.div`
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
`;

const Button = styled.button`
  margin: 5px;
  padding: 5px 10px;
  background-color: #4ea1d3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
`;

const RoomItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 5px 0;
`;

export default BreakoutRooms;
