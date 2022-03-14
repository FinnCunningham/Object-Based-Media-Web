const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// set the public folder to serve public assets
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/pages/homepage.html');
});

let interval;

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('play', function(){
		console.log('play clip');
		io.emit('play');
	});
    socket.on('start_video', function(){
		console.log('Starting Video');
		io.emit('start_video');
	});

    if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => getApiAndEmit(socket), 1000);
      socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(interval);
    });
});

const getApiAndEmit = socket => {
    const response = new Date();
    // Emitting a new message. Will be consumed by the client
    socket.emit("FromAPI", response);
};

server.listen(8080, () => {
  console.log('listening on *:8080');
});