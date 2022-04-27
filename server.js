const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors');
const fs = require('fs');
const theSportsDb = require('./controlers/sportsDbController.js');
const pandaScore = require('./controlers/pandaScoreController.js');

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
                let jsonFile = 'public_html/assets/videos/videos.json';
                fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
                  let jsonData = JSON.parse(data)
                  callback(true, JSON.stringify(jsonData[obj[room].path]));
                })
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
      let filesToUpdate = []; 
      getNestedFileData((data, folderMax)=>{
        let tempObj = {}
        for(var propName in data) {
          if(data.hasOwnProperty(propName)) {
              tempObj = data[propName];
          }
        }
        if(tempObj.date){
          let homeTeamName = tempObj.hometeam;
          if(tempObj.sport == "Rugby"){
            homeTeamName = tempObj.hometeam + " Rugby";
          }
          finalJson = {...finalJson, ...data}

          let jsonFile = 'public_html/assets/videos/videos.json'
          fs.stat(jsonFile, (err, stat) => {
            if(err){
              console.log(err)
            }else{
              fs.readFile(jsonFile, 'utf8', function readFileCallback(err, videoFileData){
                try{
                  videoObj = {};
                  try{
                    videoObj = JSON.parse(videoFileData);
                  }catch{}
                  if((videoObj[tempObj.fileprefix]) && (videoObj[tempObj.fileprefix]["teams"]
                  && (videoObj[tempObj.fileprefix]["sport-info"]))){
                    //if there is a team and sport-info, don't overwrite
                    let fileprefix = tempObj.fileprefix;
                    finalJson = {...finalJson, ...{[fileprefix]: videoObj[tempObj.fileprefix]}}
                    
                  }else{
                    // IF ESPORTS GIVE GAMES????????
                    if(tempObj.sport == 'Esport'){
                      filesToUpdate.push([tempObj.games, tempObj]); 
                      if(videoObj[tempObj.fileprefix] && videoObj[tempObj.fileprefix].matches){
                        // console.log(tempObj);
                        finalJson = {...finalJson, ...{[tempObj.fileprefix]: videoObj[tempObj.fileprefix]}}
                      }else{
                        finalJson = {...finalJson, ...videoObj};
                      }
                    }else{
                      filesToUpdate.push([homeTeamName, tempObj]); 
                      finalJson = {...finalJson, ...videoObj}; //data
                    }                    
                }
                if(folderMax){
                  returnDataAllSources(filesToUpdate, finalJson).then((theSportsDbData)=>{
                    Promise.all(theSportsDbData[0])
                    .then((neededData)=>{                      
                      let allIdsPromise = [];
                      neededData.forEach(sportsData => {
                        allIdsPromise.push(getAllFileTeamIdsLocal(sportsData[0], sportsData[1]))
                      });
                      returnAllSportsDbData(allIdsPromise, theSportsDbData[2])
                      .then((sportsUpdatedData)=>{
                        finalJson = {...finalJson, ...sportsUpdatedData}
                        // IF HAS DATA DONT DO API CALLS, TO SAVE DATA
                        let esportsCallPromises = [];
                        console.log(theSportsDbData[1].length)
                        let esportsFiles = [];
                        theSportsDbData[1].forEach(esportsData => {
                          console.log(esportsData)
                          let matches = [];
                          esportsFiles.push(esportsData[1].fileprefix)
                          esportsData[1].games.forEach(match => {
                            console.log(esportsData)
                            console.log(match)
                            matches.push([match, esportsData[1]])
                            esportsCallPromises.push(getAllEsportsData(match, esportsData[1]))
            
                          });
                          
                        });
                        let tempIndex = 0;
                        Promise.all(esportsCallPromises)
                        .then((esportsData)=>{
                          console.log(esportsFiles)
                          let newEsportsData = {...finalJson};
                          
                          let tempMatches = [];
                          let teamsPromise = [];
                          esportsData.forEach((matchData, matchIndex) => {                     
                              tempMatches.push({
                                "name":matchData[0].name,
                                "tournament":{"prizepool": matchData[0].tournament.prizepool},
                                "videogame": matchData[0].videogame.name,
                                "opponents": [{id: matchData[0].opponents[0].opponent.id},
                                 {id: matchData[0].opponents[1].opponent.id}]
                              })
                              //Get the two teams data.
                              teamsPromise.push(getTeamData(matchData[0].opponents[0].opponent.id))
                              teamsPromise.push(getTeamData(matchData[0].opponents[1].opponent.id))
                          });
                          Promise.all(teamsPromise)
                          .then((teamsData)=>{
                            let tempTeamIndex = 0;
                            let tempMatchIndex = 0;
                            // EACH TEAM
                            tempMatches.forEach((match, matchIndex) => {
                              if(tempMatchIndex == 1){
                                newEsportsData[esportsFiles[Math.floor(matchIndex/2)]]["matches"] = [tempMatches[tempMatchIndex-1], tempMatches[tempMatchIndex]]
                                tempMatchIndex = 0;
                              }else{
                                tempMatchIndex++;
                              }
                            });
                            console.log(tempMatches.length)
                            tempMatchIndex = 0;
                            tempIndex = 0;
                            let matchesObj = newEsportsData;
                            let tempTeams = [];
                            tempTeamIndex = 0;
                            teamsData.forEach((teamDataLocal, teamDataIndex) => {
                              tempTeams.push(teamsData[teamDataIndex].players)
                            });
                            tempTeamIndex = 0;
                            tempMatchIndex = 0;
                            // FOR EACH TEAM
                            tempTeams.forEach((teamInfo, teamInfoIndex) => {
                              newEsportsData[esportsFiles[Math.floor(teamInfoIndex/4)]].matches[Math.floor(teamInfoIndex/2)].opponents[tempTeamIndex] = tempTeams[teamInfoIndex]
                              if(tempTeamIndex == 1){
                                tempTeamIndex = 0;
                              }else{
                                tempTeamIndex++;
                              }
                            });
                            finalJson = {...finalJson, ...newEsportsData}

                            jsonFile = 'public_html/assets/videos/videos.json'
                            fs.stat(jsonFile, (err, stat) => {
                              if(err){
                                console.log(err)
                                fs.writeFile(jsonFile, finalJson, {flag: 'w'}, ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                              }else{
                                fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
                                  if (err){
                                      console.log(err);
                                  } else {
                                    let newJson = {};
                                    try{
                                      newJson = JSON.stringify(finalJson); //convert it back to json
                                    }catch{
                                      newJson = JSON.stringify(finalJson);           
                                    }
                                    fs.writeFile(jsonFile, newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                                  }
                                });
                              }
                            })
                          })
                        })                        
                      })
                    })
                  })
                }
              }catch(e){
                console.log(e)
                console.log("HIT ERROR")
              }
            });
          }
        })
        }
      })
  })



  socket.on('return_videos', (callback) => {
    let jsonFile = 'public_html/assets/videos/videos.json';
    fs.readFile(jsonFile, 'utf8', function readFileCallback(err, data){
      callback(JSON.stringify(data));
    })
  })

  socket.on('room_join', (room) => {
    socket.join(room);
    io.to(socket.id).emit("room_joined", room);
  })

  socket.on('set_video', (fileprefix) => {
    fs.stat('resources/rooms.json', (err, stat) => {
      if(err == null){
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
          if (err){
              console.log(err);
          } else {
            let roomObj = {}
            if(data){
              roomObj = JSON.parse(data); //now it's an object
    
            }
            let room = [...socket.rooms].filter(item => item != socket.id);
            let newJson = {...roomObj, ...{[room]: {path: fileprefix}}}
            newJson = JSON.stringify(newJson);
            fs.writeFile('resources/rooms.json', newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
            io.to(room).emit('set_video_video_client', fileprefix)
          }
        });
      }else{
      let roomObj = {}
      let room = [...socket.rooms].filter(item => item != socket.id);
      let newJson = {...roomObj, ...{[room]: {path: fileprefix}}}
      newJson = JSON.stringify(newJson);
      fs.writeFile('resources/rooms.json', newJson, {flag: 'wx'}, ()=>{console.log("WRITTEN TO VIDEO JSON FILE")}); // write it back 
      io.to(socket.id).emit('set_video_video_client', fileprefix)
  
    }
    })    
  });

  socket.on('start_video', function(clientData, callback){
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
      if(data){
        let obj = JSON.parse(data)
        let room = [...socket.rooms].filter(item => item != socket.id)
        if(room.length > 0){
          let filePath = obj[room].path;
          io.to(clientData["room_id"]).emit('start_video_video_client', filePath);
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
    let rooms_clients = [];
    rooms.forEach(room => {
      rooms_clients.push(io.sockets.adapter.rooms.get(room).size - 1)
    });
		io.emit('secondary_device_connected', {"rooms": rooms, "rooms_clients": rooms_clients});
	});
  socket.on('play_video', function(data){
		io.to(data["room_id"]).emit('play_video');
	});
  socket.on('pause_video', function(data){
		io.to(data["room_id"]).emit('pause_video');
	});
  socket.on('change_volume', (volumeValue, room)=>{
    io.to(room).emit('change_volume_client', volumeValue);
  })
  socket.on('change_fullscreen', (room)=>{
    io.to(room).emit('change_fullscreen_client');
  })
  socket.on('skip_to_start', (room) => {
    // Maybe a callback if the video has not started yet?
    let jsonFile = 'public_html/assets/videos/videos.json'
    fs.readFile(jsonFile, 'utf8', function readFileCallback(err, videoData){
      if (err){
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, roomData){
          if(videoData){
            let obj = JSON.parse(roomData)
            let filePath = obj[room].path;
            io.to(room).emit('skip_to_start_client', videoObject[filePath]["start-time"])
          }
        })
      }
    })
  })

  socket.on('show_players_server', (duration, location, callback)=>{
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
              io.to(room).emit('show_players_client', videoObject[filePath].teams, duration, location)
            }else{
              callback(true);
            }
            
          }
        })
      }
    })
  })

  socket.on('show_player_info_hold', (name, location, callback)=>{
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
              let playersArr = [];
              let playerObj = {};
              if(videoObject[filePath].sport == 'Esport'){
                videoObject[filePath].matches.forEach(match => {
                  match.opponents.forEach(teams => {
                    teams.forEach(player => {
                      playersArr.push(player);
                    });
                  });
                });
                playerObj = playersArr.find(player => player.name == name);
              }else{
                playersArr = [...videoObject[filePath].teams[0], ...videoObject[filePath].teams[1]];
                playerObj = playersArr.find(player => player.name == name);
              }
              console.log(playerObj)
              io.to(room).emit('show_player_info_hold_client', playerObj, videoObject[filePath].sport, location)
            }else{
              callback(true);
            }
          }
        })
      }
    })
  })

  socket.on('stop_show_player_info_hold', (callback)=>{
    fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, roomData){
      let obj = JSON.parse(roomData)
      let room = [...socket.rooms].filter(item => item != socket.id)
      if(room.length > 0){
        io.to(room).emit('stop_show_player_info_hold_client');
      }else{
        callback(true);
      }
      
    })
    
})

  socket.on('show_player_info', (name, duration, location, callback)=>{
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
              let playersArr = [];
              let playerObj = {};
              if(videoObject[filePath].sport == 'Esport'){
                videoObject[filePath].matches.forEach(match => {
                  match.opponents.forEach(teams => {
                    teams.forEach(player => {
                      playersArr.push(player);
                    });
                  });
                });
                playerObj = playersArr.find(player => player.name == name);
              }else{
                playersArr = [...videoObject[filePath].teams[0], ...videoObject[filePath].teams[1]];
                playerObj = playersArr.find(player => player.name == name);
              }
              io.to(room).emit('show_player_info_client', playerObj, duration, videoObject[filePath].sport, location)
            }else{
              callback(true);
            }
          }
        })
      }
    })
  })

  socket.on('show_sport_info_hold', (type, matchIndex, location, callback)=>{
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
              let infoObj = {};
              if(videoObject[filePath].sport == 'Esport'){
                //NESTED
                if(type == 'prizepool'){
                  infoObj = videoObject[filePath].matches[matchIndex].tournament[type]
                }
                else{
                  infoObj = videoObject[filePath].matches[matchIndex][type]
                }
              }else{
                infoObj = videoObject[filePath]["sport-info"][type];
              }
              io.to(room).emit('show_sport_info_hold_client', infoObj, type, location);
            }else{
              callback(true);
            }
          }
        })
      }
    })
  })
  socket.on('stop_show_sport_info_hold', (type, matchIndex, callback)=>{
       
        fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, roomData){
          let obj = JSON.parse(roomData)
          let room = [...socket.rooms].filter(item => item != socket.id)
          if(room.length > 0){
            io.to(room).emit('stop_show_sport_info_hold_client');
          }else{
            callback(true);
          }
          
        })
      
  })

  socket.on('show_sport_info', (type, duration, matchIndex, location, callback)=>{
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
              let infoObj = {};
              if(videoObject[filePath].sport == 'Esport'){
                if(type == 'prizepool'){
                  infoObj = videoObject[filePath].matches[matchIndex].tournament[type]
                }
                else{
                  infoObj = videoObject[filePath].matches[matchIndex][type]
                }
              }else{
                infoObj = videoObject[filePath]["sport-info"][type];
              }
                io.to(room).emit('show_sport_info_client', infoObj, type, duration, location);
            }else{
              callback(true);
            }
            
          }
        })
      }
    })
  })

  socket.on('return_players', (sportType, callback)=>{
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
              if(sportType == 'Esport'){
                callback(videoObject[filePath].matches)
              }else{
                callback(videoObject[filePath].teams)
              }
            }else{
              callback('');
            }
          }
        })
      }
    })
  })

  socket.on('return_sport_info_types', (sportType, callback) =>{
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
              if(sportType == 'Esport'){
                callback(videoObject[filePath].matches);
              }else{
                callback(videoObject[filePath]["sport-info"]);
              }
            }else{
              callback('');
            }
          }
        })
      }
    })
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

async function returnDataAllSources(filesToUpdate, fileJson){
  let newData = {...fileJson}; //fileJson
  return new Promise((resolve, reject)=>{
    let allEsportsPromise = [];
    let allSportsPromise = [];
    filesToUpdate.forEach(fileToUpdate => {
      if(fileToUpdate[1].sport == 'Football' || fileToUpdate[1].sport == 'Rugby'){
        allSportsPromise.push([fileToUpdate[0], fileToUpdate[1]]);
      }else if(fileToUpdate[1].sport == 'Esport'){
        allEsportsPromise.push([fileToUpdate[0], fileToUpdate[1]])
      }
    });
    resolve([allSportsPromise, allEsportsPromise, newData]);
  })
}

async function getAllEsportsData(games, newData){
  return new Promise((resolve, reject)=>{
    let range = newData.date + "T12:00:00Z," +  newData.date + "T22:00:00Z";
    pandaScore.getGameData(range, games[0] + " vs " + games[1], 'ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc')
    .then((data)=>{
      resolve(data)
    })
  })
}

async function getTeamData(teamId){
  return new Promise((resolve, reject)=>{
    pandaScore.getTeamData(teamId, "ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc")
    .then((data)=>{
      resolve(data)
    })
  })
}

async function returnAllSportsDbData(allIdsPromise, newData){
  return new Promise((resolve, reject)=>{

    Promise.all(allIdsPromise)
    .then((finalIdsData)=>{
      let teamsPromise = []
      finalIdsData.forEach((idObj) =>{
        teamsPromise.push(getAllPlayersDataLocal(idObj[0], idObj[1]));
      })
      let playersPromise = [];
      let fileprefixs = [];
      let sportsInfoPromise = [];
      let sportsInfoFixprefixs = [];
      Promise.all(teamsPromise)
      .then((sportsDBDatas)=>{
        sportsDBDatas.forEach(sportsDBData => {
            if(newData[sportsDBData.fileprefix]){
              if(!newData[sportsDBData.fileprefix]["teams"]){
                newData[sportsDBData.fileprefix]["teams"] = sportsDBData.teams;
                if(newData[sportsDBData.fileprefix]["teams"][0].length > 0){
                  fileprefixs.push(sportsDBData.fileprefix)  
                }
                newData[sportsDBData.fileprefix]["teams"][0].forEach((player) => {
                  playersPromise.push(getPlayerDetailsLocal(player));
                });
                newData[sportsDBData.fileprefix]["teams"][1].forEach((player) => {
                  playersPromise.push(getPlayerDetailsLocal(player));
                });
              }else{
                // Maybe set it to the file teams if needed?
              }
              
              if(!newData[sportsDBData.fileprefix]["sport-info"]){
                let sport = newData[sportsDBData.fileprefix].sport;
                if(sport == 'Football'){
                  sport = "Soccer";
                }
                sportsInfoPromise.push(getSportsDetailsLocal(sport));
                sportsInfoFixprefixs.push(sportsDBData.fileprefix);
              }
            }else{
              // getSportInfo
            }      
        });
        Promise.all(playersPromise)

        .then((finalPlayersData) => {
          let tempTeamIndex = 0;
          let fileTeams = []
          for (let i = 0; i < finalPlayersData.length / 11; i++) {
            fileTeams.push(finalPlayersData.slice(i*11,i*11+11))
            
          } 
          fileTeams.forEach((finalTeam, finalTeamIndex) => {
            let tempIndex = 0;
            finalTeam.forEach((finalPlayer, finalPlayerIndex)=>{
              newData[fileprefixs[Math.floor((finalTeamIndex/2))]]["teams"][tempTeamIndex][tempIndex] = finalPlayer; 
              tempIndex++;
            })
            if(tempTeamIndex + 1 == 2){
              tempTeamIndex = 0;
            }else{
              tempTeamIndex++;
            }    
          });
          Promise.all(sportsInfoPromise)
          .then((sportsData) => {
            sportsData.forEach((sportData, sportDataIndex) => {
              let finalSportData = [];
                finalSportData = {
                  "name": sportData[0]["strSport"],
                  "Description": sportData[0]["strSportDescription"],
                  "icon": sportData[0]["strSportIconGreen"]
                }
              newData[sportsInfoFixprefixs[sportDataIndex]]["sport-info"] = finalSportData;
            });
            // End of check.
            resolve(newData)
          })
        })        
      }) 
    })
  })
}

async function getAllFileTeamIdsLocal(homeTeamName, tempObj){
  return new Promise((resolve, rejet)=>{
    theSportsDb.getsportDBEvent(homeTeamName, tempObj.date).then((id)=>{
      resolve([id, tempObj.fileprefix])
    })
  })
}

async function getAllPlayersDataLocal(id, fileprefix){
  return new Promise((resolve, rejet)=>{
    theSportsDb.getPlayers(id, fileprefix).then((sportsDBData)=>{
      resolve(sportsDBData)
    })
  })
}

async function getSportsDetailsLocal(sport){
  return new Promise((resolve, reject) =>{
    theSportsDb.getSportInfo(sport).then((details)=>{  
    resolve(details)
  })})
}

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
        "weight": details["strWeight"],
        "cutout": details["strCutout"]
      };
      resolve(tempPlayerArr)
    })})
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
              if(json["sport"] == 'Esport'){
                tempData[file] = {
                  "video-url": json["fileprefix"] + ".mp4",
                  "title": json["title"],
                  "desc": json["desc"],
                  "fileprefix": json["fileprefix"],
                  "date": json["date"],
                  "sport": json["sport"],
                  "games": json["games"],
                  "start-time": json["start-time"]
                }
              }else{
                tempData[file] = {
                "video-url": json["fileprefix"] + ".mp4",
                "title": json["title"],
                "desc": json["desc"],
                "fileprefix": json["fileprefix"],
                "hometeam": json["hometeam"],
                "awayteam": json["awayteam"],
                "date": json["firstbcastdate"],
                "sport": json["sport"],
                "start-time": json["start-time"]
                }
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