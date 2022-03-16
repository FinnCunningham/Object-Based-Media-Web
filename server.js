const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors');

const io = new Server(server, { 
  path: '/socket.io',
  cors: {
    // origin: "https://s5117817.bucomputing.uk/node",
    origin: '*',
    methods: ["GET", "POST"],
    // transports: ['websocket', 'polling'],
    // credentials: true
  },
  // allowEIO3: true
});
// set the public folder to serve public assets
app.use(express.static(__dirname + '/public'));
app.use(cors()); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/pages/homepage.html');
});

// let interval;
io.on('connection', (socket) => {
  
  console.log('a user connected from ');
  console.log(io.sockets.adapter.rooms)
  socket.on('join', (room) => {
    socket.join(room);
    console.log("JOINED ROOM " + room)
    console.log(io.sockets.adapter.rooms)
  })

  // socket.on('rooms', () => {
  //   socket.emit('rooms', io.sockets.adapter.rooms);
  // })  

  socket.on('start_video', function(){
		console.log('Starting Video');
		io.emit('start_video');
	});

  socket.on('secondary_device_connected', function(){
		console.log('Secondary device connected');
    // let rooms = io.sockets.adapter.rooms;
    let rooms = getActiveRooms(io)
    console.log(rooms)
		io.emit('secondary_device_connected', {"rooms": rooms});
	});
  socket.on('play_video', function(id){
		console.log('play clip');
    console.log(id)
		io.emit('play_video');
	});
  socket.on('pause_video', function(){
		io.emit('pause_video');
	});
});


io.on("connect_error", (e) => {
  // revert to classic upgrade
  console.log(e)
  io.opts.transports = ["polling", "websocket"];
});

function getActiveRooms(io) {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter(room => !room[1].has(room[0]))
  // Return only the room name: 
  // ==> ['room1', 'room2']
  const res = filtered.map(i => i[0]);
  return res;
}

server.listen(40074, () => {
  console.log('listening on *:40074');
});