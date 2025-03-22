import { useState, useEffect } from 'react';

function Rooms() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/room') // Backend URL
      .then(response => response.json())
      .then(data => setRooms(data))
      .catch(error => console.error('Error fetching rooms:', error));
  }, []);

  return (
    <div>
      <h1>Available Rooms</h1>
      <ul>
        {rooms.map(room => (
          <li key={room.roomid}>Room {room.roomid}: ${room.price}</li>
        ))}
      </ul>
    </div>
  );
}

export default Rooms;