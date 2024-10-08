import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

const BottomBar = ({
  clickChat,
  clickCameraDevice,
  goToBack,
  toggleCameraAudio,
  userVideoAudio,
  clickScreenSharing,
  screenShare,
  videoDevices,
  showVideoDevices,
  setShowVideoDevices,
  toggleBreakoutRooms, // Add this prop
}) => {
  const handleToggle = useCallback(
    (e) => {
      setShowVideoDevices((state) => !state);
    },
    [setShowVideoDevices]
  );
  const role = localStorage.getItem("roletoban"); // Example role value

  return (
    <Bar>
      <Left>
        <CameraButton
          onClick={toggleCameraAudio}
          data-switch="video"
          className={role === "Observer" ? "disabled" : ""}
        >
          <div>
            {userVideoAudio.video ? (
              <FaIcon className="fas fa-video"></FaIcon>
            ) : (
              <FaIcon className="fas fa-video-slash"></FaIcon>
            )}
          </div>
          Camera
        </CameraButton>
        {showVideoDevices && (
          <SwitchList>
            {videoDevices.length > 0 &&
              videoDevices.map((device) => {
                return (
                  <div
                    key={device.deviceId}
                    onClick={clickCameraDevice}
                    data-value={device.deviceId}
                  >
                    {device.label}
                  </div>
                );
              })}
            <div>Switch Camera</div>
          </SwitchList>
        )}
        <SwitchMenu onClick={handleToggle}>
          <i className="fas fa-angle-up"></i>
        </SwitchMenu>
        <CameraButton
          onClick={toggleCameraAudio}
          data-switch="audio"
          className={role === "Observer" ? "disabled" : ""}
        >
          <div>
            {userVideoAudio.audio ? (
              <FaIcon className="fas fa-microphone"></FaIcon>
            ) : (
              <FaIcon className="fas fa-microphone-slash"></FaIcon>
            )}
          </div>
          Audio
        </CameraButton>
      </Left>
      <Center>
        <ChatButton
          onClick={clickChat}
          className={role === "Observer" ? "disabled" : ""}
        >
          <div>
            <FaIcon className="fas fa-comments"></FaIcon>
          </div>
          Chat
        </ChatButton>

        <ScreenButton
          className={role === "Observer" ? "disabled" : ""}
          onClick={role !== "Observer" ? clickScreenSharing : undefined} // Prevent click if role is "Observer"
        >
          <div>
            <FaIcon
              className={`fas fa-desktop ${screenShare ? "sharing" : ""}`}
              // Disable the button if the role is "Observer"
            ></FaIcon>
          </div>
          Share Screen
        </ScreenButton>
      </Center>
      <Right>
        <StopButton onClick={goToBack}>Stop</StopButton>
      </Right>
    </Bar>
  );
};

const Bar = styled.div`
  position: absolute;
  // margin:0 ,auto;
  right: 45px;
  bottom: 0;
  width: 95%;
  border-radius: 10px;
  height: 8%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 500;
  background-color: #000;
`;
const Left = styled.div`
  display: flex;
  align-items: center;

  margin-left: 15px;
`;

const Center = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

const Right = styled.div``;

const ChatButton = styled.div`
  width: 75px;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }
`;

const CameraButton = styled.div`
  position: relative;
  width: 75px;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }

  .fa-microphone-slash {
    color: #ee2560;
  }

  .fa-video-slash {
    color: #ee2560;
  }
`;

const ScreenButton = styled.div`
  width: auto;
  border: none;
  font-size: 0.9375rem;
  padding: 5px;

  :hover {
    background-color: #77b7dd;
    cursor: pointer;
    border-radius: 15px;
  }

  .sharing {
    color: #ee2560;
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
    cursor: not-allowed;
  }
`;

const FaIcon = styled.i`
  width: 30px;
  font-size: calc(16px + 1vmin);
`;

const StopButton = styled.div`
  width: 75px;
  height: 30px;
  border: none;
  font-size: 0.9375rem;
  line-height: 30px;
  margin-right: 15px;
  background-color: #ee2560;
  border-radius: 15px;

  :hover {
    background-color: #f25483;
    cursor: pointer;
  }
`;

const SwitchMenu = styled.div`
  display: flex;
  position: absolute;
  width: 20px;
  top: 7px;
  left: 80px;
  z-index: 1;

  :hover {
    background-color: #476d84;
    cursor: pointer;
    border-radius: 15px;
  }

  * {
    pointer-events: none;
  }

  > i {
    width: 90%;
    font-size: calc(10px + 1vmin);
  }
`;

const SwitchList = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: -65.95px;
  left: 80px;
  background-color: #4ea1d3;
  color: white;
  padding-top: 5px;
  padding-right: 10px;
  padding-bottom: 5px;
  padding-left: 10px;
  text-align: left;

  > div {
    font-size: 0.85rem;
    padding: 1px;
    margin-bottom: 5px;

    :not(:last-child):hover {
      background-color: #77b7dd;
      cursor: pointer;
    }
  }

  > div:last-child {
    border-top: 1px solid white;
    cursor: context-menu !important;
  }
`;

export default BottomBar;
