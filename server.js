const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors');
const fs = require('fs');
let finalJson = {};

const io = new Server(server, { 
  path: '/socket.io',
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    transports: ['websocket'],
    upgrade: false
  },
});
// set the public folder to serve public assets
app.use(express.static(__dirname + '/public_html'));
app.use(cors()); 

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/pages/homepage.html');
});
// getAllVideos()
// .then((json) => {console.log(json); console.log("HITHIHITHIT")})
// (async () =>{ 
//   await getAllVideos()
//   console.log("HIT")
// });

io.on('connection', (socket) => {
  console.log('a user connected from ');
  console.log(io.sockets.adapter.rooms);
  socket.on('create_room', (room) => {
    let rooms = getActiveRooms(io)
    if(rooms.includes(room)){
      console.log(io.sockets.adapter.rooms)
      io.to(socket.id).emit('room_unavailable');
    }else{
      socket.join(room);
      io.to(socket.id).emit('room_joined', room);
      console.log("JOINED ROOM " + room)
    }
  })

  socket.on('room_join', (room) => {
    socket.join(room);
    console.log("JOINING: " + room)
    console.log(io.sockets.adapter.rooms);
    io.to(socket.id).emit("room_joined", room);
  })

  socket.on('start_video', function(data){
		console.log('Starting Video');
		io.to(data["room_id"]).emit('start_video');
	});

  socket.on('secondary_device_connected', function(){
		console.log('Secondary device connected');
    let rooms = getActiveRooms(io)
    console.log(rooms)
    let rooms_clients = [];
    rooms.forEach(room => {
      rooms_clients.push(io.sockets.adapter.rooms.get(room).size - 1)
    });
		io.emit('secondary_device_connected', {"rooms": rooms, "rooms_clients": rooms_clients});
	});
  socket.on('play_video', function(data){
		console.log('play clip');
		io.to(data["room_id"]).emit('play_video');
	});
  socket.on('pause_video', function(data){
		io.to(data["room_id"]).emit('pause_video');
	});
  socket.on('leave_room', (room) => {
    socket.leave(room["room"]);
    console.log("user left: " + room["room"]);
  })
  socket.on('disconnect' , function(){
    console.log("USER DISCONNECTED: " + socket.id)
  });
});

async function getAllVideos(){
  let baseURL = 'public_html/assets/videos/';
  // let finalJson = {};
  let filter = 'json';
  // let jsonFilesData;
  // let tempJSON = {};
  return new Promise((resolve, reject) => {
    fs.readdir(baseURL, (err, files) => {
      // console.log(files);
      files.forEach((folder, index) => {
        fs.readdir(baseURL + "/" + folder, (err, childFiles) => {
          childFiles.forEach((childFile, indexChild) => {
            let filename = baseURL + folder + "/" + childFile;
            if (childFile.indexOf(filter)>=0) {
              let data =  fs.readFile(filename, 'utf8', (err, rawJson) => {
                
                let json = JSON.parse(rawJson);
                console.log("Title" + json["desc"]);
                finalJson[folder] = {
                  "video-url": json["fileprefix"] + ".mp4",
                  "title": json["title"],
                  "desc": json["desc"]
                }
                // console.log(finalJson)
              })
              console.log("data" + data) 
  
              console.log('-- found: ',filename);
              
            }
            if(indexChild == childFiles.length - 1 && index == files.length - 1){
              console.log("HIT INDEX")
              resolve(finalJson);
  
            }
            // console.log(childFiles)
            // finalJson[file] = {}
          })
  
        });
      });  
    });
  })
  
}

const getDirectories = (source, callback) =>
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err)
    } else {
      callback(
        files
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      )
    }
  })

getDirectories("public_html/assets/videos/", (files)=>{
  files.forEach((file)=>{
    console.log("public_html/assets/videos/" + file + "/")
    getDirectories("public_html/assets/videos/" + file + "/", (childFiles)=>{console.log(childFiles)});
  })

});


// async function getJsonFile(){
//   fs.readFile(filename, 'utf8', (err, rawJson) => {
              
//     let json = JSON.parse(rawJson);
//     console.log("Title" + json["desc"]);
//     finalJson[folder] = {
//       "video-url": json["fileprefix"] + ".mp4",
//       "title": json["title"],
//       "desc": json["desc"]
//     }
//     // console.log(finalJson)
//   });
// }

function getActiveRooms(io) {
  const roomArr = Array.from(io.sockets.adapter.rooms);
  const filtered = roomArr.filter(room => !room[1].has(room[0]))
  return filtered.map(i => i[0]);
}

server.listen(40074, () => {
  console.log('listening on *:40074');
});