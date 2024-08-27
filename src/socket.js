import io from 'socket.io-client';
// const sockets = io('http://localhost:3001', { autoConnect: true, forceNew: true });
const sockets = io('https://serverzoom-mpbv.onrender.com/');
export default sockets;
