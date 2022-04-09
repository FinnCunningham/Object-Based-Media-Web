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

// theSportsDb.getPlayerDetails('Mohammed%20Salisu').then((details)=>{
//   console.log("Nationality: " + details["strNationality"])
//   console.log(details["dateBorn"])
//   console.log(details["strSigning"])
//   console.log(details["strBirthLocation"])
//   console.log(details["strGender"])
//   console.log(details["strPosition"])
//   console.log(details["strHeight"])
//   console.log(details["strWeight"])
// })

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
    fs.stat('resources/rooms.json', (err, stat) => {
      if(err == null){
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
      }else{
        callback(false);
      }
    })   
    
  });

  socket.on('update_videos', ()=>{
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
            if(id)
            theSportsDb.getPlayers(id, tempObj.fileprefix).then((sportsDBData)=>{
              if(data[sportsDBData.fileprefix]){
                data[sportsDBData.fileprefix]["teams"] = sportsDBData.teams;
              }
              let playersPromise = [];
              data[sportsDBData.fileprefix]["teams"].forEach((team, teamIndex) => {
                team.forEach((player, playerIndex) => {
                  let teamMax = data[sportsDBData.fileprefix]["teams"].length - 1== teamIndex;
                  let playerMax = data[sportsDBData.fileprefix]["teams"][teamIndex].length - 1 == playerIndex;
                  playersPromise.push(getPlayerDetailsLocal(player, playerIndex, teamIndex, data, sportsDBData, folderMax, teamMax && playerMax));
                });
              });
              Promise.all(playersPromise)
              .then((finalPlayersData) => {
                // data[sportsDBData.fileprefix]["teams"].filter(child) = tempPlayerArr; 
                let tempIndex = 0;
                let tempTeamIndex = 0;
                finalPlayersData.forEach((finalPlayer, finalPlayerIndex) => {
                  if(finalPlayerIndex == data[sportsDBData.fileprefix]["teams"][0].length){
                    tempIndex = 0;
                    tempTeamIndex++;
                  }
                  console.log(tempIndex);
                  console.log(tempTeamIndex)
                  console.log("=========")
                  data[sportsDBData.fileprefix]["teams"][tempTeamIndex][tempIndex] = finalPlayer; 

                  tempIndex++;
                });
                // console.log(finalPlayersData)
                finalJson = {...finalJson, ...data};
                if(folderMax){
                  // End of check.
                  let jsonFile = 'public_html/assets/videos/videos.json'
                  fs.stat(jsonFile, (err, stat) => {
                    if(err){
                      // console.log(finalJson)
                      console.log(err)
                      fs.writeFile(jsonFile, finalJson, {flag: 'w'}, ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                    }else{
                      fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
                        if (err){
                            console.log(err);
                        } else {
                          let newJson = {};
                          try{
                            obj = JSON.parse(data); //now it an object
                            newJson = {...obj, ...finalJson}
                            newJson = JSON.stringify(newJson); //convert it back to json
                          }catch{
                            newJson = JSON.stringify(finalJson);           
                          }
                          // console.log(newJson)
                          console.log("===========")
                          fs.writeFile(jsonFile, newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                        }
                      });
                    }
                  })
                }  
              })
            })
          })
        }
      })
  })

  async function getPlayerDetailsLocal (player){
    
    return new Promise((resolve, reject) =>{theSportsDb.getPlayerDetails(encodeURI(player["name"])).then((details)=>{
      let tempPlayerArr = {
        "name": player["name"],
        "nationality": details["strNationality"],
        "birthDate": details["dateBorn"],
        "signingCost": details["strSigning"],
        "birthLocation": details["strBirthLocation"],
        "gender": details["strGender"],
        "position": details["strPosition"],
        "height": details["strHeight"],
        "weight": details["strWeight"]
      };
      setTimeout(resolve, 2000 , tempPlayerArr);
      // data[sportsDBData.fileprefix]["teams"][teamIndex][playerIndex] = tempPlayerArr; 
    })})
  }

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
    fs.stat('resources/rooms.json', (err, stat) => {
      if(err == null){
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
          if (err){
              console.log(err);
          } else {
            let roomObj = {}
            if(data){
              roomObj = JSON.parse(data); //now it an object
    
            }
            let room = [...socket.rooms].filter(item => item != socket.id);
            let newJson = {...roomObj, ...{[room]: {path: fileprefix}}}
            newJson = JSON.stringify(newJson);
            fs.writeFile('resources/rooms.json', newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
          }
        });
      }else{
      let roomObj = {}
      let room = [...socket.rooms].filter(item => item != socket.id);
      let newJson = {...roomObj, ...{[room]: {path: fileprefix}}}
      newJson = JSON.stringify(newJson);
      fs.writeFile('resources/rooms.json', newJson, {flag: 'wx'}, ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
      }
    })
    
    
    io.to(socket.id).emit('set_video_video_client', fileprefix)
  });

  socket.on('start_video', function(clientData, callback){
		console.log('Starting Video');
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
      if(data){
        let obj = JSON.parse(data)
        let room = [...socket.rooms].filter(item => item != socket.id)
        console.log(room)
        if(room.length > 0){
          let filePath = obj[room].path;
          io.to(clientData["room_id"]).emit('start_video_video_client', filePath);
          console.log(clientData["room_id"])
          callback(false)
        }else{
          callback(true)
        }
        
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

  socket.on('show_players_server', (duration, callback)=>{
    // videos.json (teams) -> by fileprefix -> by room obj
    let jsonFile = 'public_html/assets/videos/videos.json'
    fs.readFile(jsonFile, 'utf8', function readFileCallback(err, videoData){
      if (err){
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, roomData){
          if(videoData){
            let obj = JSON.parse(roomData)
            let room = [...socket.rooms].filter(item => item != socket.id)
            if(room.length > 0){
              let filePath = obj[room].path;
              io.to(room).emit('show_players_client', videoObject[filePath].teams, duration)
            }else{
              callback(true);
            }
            
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
    console.log("ROOM: " + socket.rooms.size )
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