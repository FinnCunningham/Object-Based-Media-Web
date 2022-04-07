const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors');
const fs = require('fs');
const theSportsDb = require('./controlers/sportsDbController.js')

let finalJson = {};
/**
 * TODO:
 *  -tidy up code
 *  -remove path when the room is closed.
 *  -FIX RUGBY - show rugby after hometeam name
 *      -Add sport to metadata
 *      -Then in update_videos -> add Rugby after hometeam if the sport == rugby getsportDBEvent
 */


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
let getRoomObj = ()=>{
  fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
    if(data){
      console.log(JSON.parse(data))

    }
  })
}
getRoomObj();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/pages/homepage.html');
});

io.on('connection', (socket) => {
  console.log('a user connected from ');
  console.log(io.sockets.adapter.rooms);

  socket.on('create_room', (room) => {
    let rooms = getActiveRooms(io)
    if(rooms.includes(room)){
      console.log(io.sockets.adapter.rooms)
      io.to(socket.id).emit('room_unavailable');
    }else{
      fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          let obj = {};
          if(data){
            obj = JSON.parse(data); //now it an object
          }
          let tempObj = {}
          tempObj[room] = {path: ""}
          let newJson = {...obj, ...{[room]: {path: ""}}}
          newJson = JSON.stringify(newJson); //convert it back to json
          fs.writeFile('resources/rooms.json', newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
        }
      });
      
      socket.join(room);
      io.to(socket.id).emit('room_joined', room);
      console.log("JOINED ROOM " + room)
    }
  })

  socket.on('video_selected', (callback)=>{    
    console.log([...socket.rooms].filter(item => item != socket.id))
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        let obj = {}
        if(data){
          obj = JSON.parse(data); //now it an object
          let room = [...socket.rooms].filter(item => item != socket.id);
          console.log(obj)
          console.log(room)
          if(obj[room].path){
            callback(true);
          }else{
              callback(false);
          } 
        }
        
      }
    });
    
  });

  socket.on('update_videos', ()=>{
    // theSportsDb.getPlayers(1514444, 'The_FA_Cup_2021_22_-_Quarter-Final_Southampton_v_Manchester_City_m0015p1g_original').then((sportsDBData)=>{
      getNestedFileData((data, folderMax)=>{
        let tempObj = {}
        for(var propName in data) {
          if(data.hasOwnProperty(propName)) {
              tempObj = data[propName];
              // do something with each element here
          }
        }

        if(tempObj.date){
          let homeTeamName = tempObj.hometeam;
          if(tempObj.sport == "Rugby"){
            homeTeamName = tempObj.hometeam + " Rugby";
          }
          theSportsDb.getsportDBEvent(homeTeamName, tempObj.date).then((id)=>{
            console.log(id)
            theSportsDb.getPlayers(id, tempObj.fileprefix).then((sportsDBData)=>{
              if(data[sportsDBData.fileprefix]){
                // console.log("SAME")
                // console.log(sportsDBData.fileprefix)
                data[sportsDBData.fileprefix]["teams"] = sportsDBData.teams;
              }
              finalJson = {...finalJson, ...data};
              // console.log("==================")
              // console.log("Folder Max: " + folderMax)
              if(folderMax){
                // End of check.
                // console.log("====================")
                // console.log(finalJson)
                // console.log("====================")
                let jsonFile = 'public_html/assets/videos/videos.json'
                fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    obj = JSON.parse(data); //now it an object
                    let newJson = {...obj, ...finalJson}
                    newJson = JSON.stringify(newJson); //convert it back to json
                    // console.log(newJson)
                    fs.writeFile(jsonFile, newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                  }
                });
              }  
            })
          })
        }
      })

      //   Object.keys(data).forEach((video)=> {
      //     console.log(video)
      //     if(video.date){
      //       theSportsDb.getsportDBEvent(video.hometeam, video.date).then((id)=>{
      //         theSportsDb.getPlayers(id, video.fileprefix)
      //         .then((sportsDBData)=>{
                
      //         })
      //       })
      //     }
          
      //   })
      // })
  })

  socket.on('return_videos', (callback) => {
    let jsonFile = 'public_html/assets/videos/videos.json';
    fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
      callback(JSON.stringify(data));
    })
  })

  socket.on('room_join', (room) => {
    socket.join(room);
    console.log("JOINING: " + room)
    console.log(io.sockets.adapter.rooms);
    io.to(socket.id).emit("room_joined", room);
  })

  socket.on('set_video', (fileprefix) => {
    console.log(fileprefix);
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        obj = JSON.parse(data); //now it an object
        let room = [...socket.rooms].filter(item => item != socket.id);
        let newJson = {...obj, ...{[room]: {path: fileprefix}}}
        newJson = JSON.stringify(newJson);
        fs.writeFile('resources/rooms.json', newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
      }
    });
    io.to(socket.id).emit('set_video_video_client', fileprefix)
  });

  socket.on('start_video', function(clientData){
		console.log('Starting Video');
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
      if(data){
        let obj = JSON.parse(data)
        let room = [...socket.rooms].filter(item => item != socket.id)
        let filePath = obj[room].path;
        io.to(clientData["room_id"]).emit('start_video_video_client', filePath);
        console.log(clientData["room_id"])
      }
    })
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

  socket.on('show_players', (team)=>{
    // videos.json (teams) -> by fileprefix -> by room obj
    let jsonFile = 'public_html/assets/videos/videos.json'
    fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
      if (err){
        console.log(err);
      } else {
        let videoObject = JSON.parse(data); //now it an object
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, roomData){
          if(data){
            let obj = JSON.parse(roomData)
            let room = [...socket.rooms].filter(item => item != socket.id)
            let filePath = obj[room].path;
            console.log(obj)
            console.log(room)
            console.log("===============")
            console.log(filePath)
            console.log(videoObject[filePath].teams)
          }
        })
      }
    })
    // console.log(team)

  })

  socket.on('leave_room', (room) => {
    socket.leave(room["room"]);
    console.log("user left: " + room["room"]);
  })
  socket.on('disconnect' , function(){
    console.log("USER DISCONNECTED: " + socket.id)
  });
});

const getDirectories = (source, callback, directoryNeeded) => {
  fs.readdir(source, { withFileTypes: true }, (err, files) => {
    if (err) {
      callback(err)
    } else {
      callback(
        ( directoryNeeded ? 
        files
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name) 
          : files.map(dirent => dirent.name)
        )
      )
    }
  })
}

// https://s5117817.bucomputing.uk/assets/videos/The_FA_Cup_2021_22_Quarter-Final/The_FA_Cup_2021_22_-_Quarter-Final_Southampton_v_Manchester_City_m0015p1g_original.jpg


function getNestedFileData(innerCallback){
  let baseURL = 'public_html/assets/videos/';
  getDirectories("public_html/assets/videos/", (files)=>{
    files.forEach((file, folderIndex)=>{
      getDirectories("public_html/assets/videos/" + file + "/", (childFiles)=>{
        childFiles.forEach((childFile, childIndex) => {
          let filename = baseURL + file + "/" + childFile;
          if (childFile.indexOf('.json')>=0) {
            fs.readFile(filename, 'utf8', (err, rawJson) => {
              let tempData = {};
              let json = JSON.parse(rawJson);
              tempData[file] = {
                "video-url": json["fileprefix"] + ".mp4",
                "title": json["title"],
                "desc": json["desc"],
                "fileprefix": json["fileprefix"],
                "hometeam": json["hometeam"],
                "awayteam": json["awayteam"],
                "date": json["firstbcastdate"],
                "sport": json["sport"]
              }
              innerCallback(tempData, folderIndex == files.length - 1);
            })
          }
        });
      });
    }, false)
  }, true);
}

function getActiveRooms(io) {
  const roomArr = Array.from(io.sockets.adapter.rooms);
  const filtered = roomArr.filter(room => !room[1].has(room[0]))
  return filtered.map(i => i[0]);
}

server.listen(40074, () => {
  console.log('listening on *:40074');
});