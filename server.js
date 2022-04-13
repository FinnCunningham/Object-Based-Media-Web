const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require('cors');
const fs = require('fs');
const theSportsDb = require('./controlers/sportsDbController.js');
const pandaScore = require('./controlers/pandaScoreController.js');
const e = require('express');

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
// let getRoomObj = ()=>{
//   fs.readFile('resources/rooms.json', 'utf8', function readFileCallback(err, data){
//     if(data){
//       console.log(JSON.parse(data))

//     }
//   })
// }
// getRoomObj();

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
      let filesToUpdate = []; 
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
                    // console.log(tempObj)
                    // IF ESPORTS GIVE GAMES????????
                    // if()
                    if(tempObj.sport == 'Esport'){
                      filesToUpdate.push([tempObj.games, tempObj]); 

                    }else{
                      filesToUpdate.push([homeTeamName, tempObj]); 
                    }
                    // console.log(tempObj)
                    // filesToUpdate.push([homeTeamName, tempObj]); 
                    finalJson = {...finalJson, ...videoObj}; //data
                }
                // console.log("?????????????")
                // console.log(finalJson)
                // console.log("?????????????")
                console.log("EHEHHEHHEHHEHE")
                if(folderMax){
                  console.log("MAST MAX")
                  console.log("MX+=========================================")
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
                        // WORKING HERE !!!!!!!!!!!!!!
                        //  THEN DO ESPORTS W/ theSportsDbData[1]
                        
                        // console.log(theSportsDbData[1][0])
                        // IF HAS DATA DONT DO API CALLS, TO SAVE DATA
                        let esportsCallPromises = [];
                        console.log(theSportsDbData[1].length)
                        let esportsFiles = [];
                        theSportsDbData[1].forEach(esportsData => {
                          console.log(esportsData)
                          let matches = [];
                          esportsFiles.push(esportsData[1].fileprefix)

                          esportsData[1].games.forEach(match => {
                            // HERE !!!!!!!!!!!!!!!!!!!
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
                          // console.log(esportsData);
                          let newEsportsData = {...finalJson};
                          let tempMatches = [];
                          let teamsPromise = [];
                          esportsData.forEach((matchData, matchIndex) => {  
                            console.log("?????????????????")
                            console.log(matchData[0].opponents)   
                            console.log("?????????????????")                         
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
                            console.log(teamsData)
                            let tempTeamIndex = 0;
                            let tempMatchIndex = 0;
                            // EACH TEAM
                            tempMatches.forEach((match, matchIndex) => {
                              if(tempMatchIndex == 1){
                              newEsportsData[esportsFiles[Math.floor(matchIndex/2)]] = {matches:[tempMatches[tempMatchIndex-1], tempMatches[tempMatchIndex]]}
                              tempMatchIndex = 0;
                              
                              }else{
                                tempMatchIndex++;
                              }
                            });
                            console.log(tempMatches.length)
                            console.log("???????????????????????")
                            // console.log(newEsportsData)
                            console.log("????????????????????????")
                            tempMatchIndex = 0;
                            tempIndex = 0;
                            let matchesObj = newEsportsData;
                            let tempTeams = [];
                            tempTeamIndex = 0;
                            teamsData.forEach((teamDataLocal, teamDataIndex) => {
                              // if(tempTeamIndex == 1){
                              //   //Match 2
                              //   // console.log(teamDataIndex)
                              //   tempTeams.push(teamsData[teamDataIndex-1].players)
                              //   tempTeams.push(teamDataLocal.players)
                              //     tempTeamIndex = 0;
                              // }else{
                              //   tempTeamIndex++;
                              // }
                              tempTeams.push(teamsData[teamDataIndex].players)
                            });
                            let tempFileIndex = 0;
                            // let tempMatchIndex = 0;
                            tempTeamIndex = 0;
                            tempMatchIndex = 0;
                            // console.log(tempTeams)
                            // FOR EACH TEAM
                            tempTeams.forEach((teamInfo, teamInfoIndex) => {
                              // teamInfo.players.forEach(player => {
                                
                              // });
                              
                              
                              newEsportsData[esportsFiles[Math.floor(teamInfoIndex/4)]].matches[Math.floor(teamInfoIndex/2)].opponents[tempTeamIndex] = tempTeams[teamInfoIndex]
                              // console.log(teamInfoIndex)
                              if(tempTeamIndex == 1){
                                tempTeamIndex = 0;
                              }else{
                                tempTeamIndex++;
                              }
                            });
                            console.log("==================")
                            // console.log(newEsportsData)
                            console.log("==================")
                            console.log("==================")
                            // console.log(newEsportsData['esports_CS_GO_-_BLAST_Premier_2020_-_CS_GO_-_BLAST_Premier_Global_Final_-_day_six_l002t8jy_original'])
                            // console.log(newEsportsData['esports_CS_GO_-_BLAST_Premier_2020_-_CS_GO_-_BLAST_Premier_Global_Final_-_day_six_l002t8jy_original'].matches[0].opponents)
                            // console.log(newEsportsData['esports_CS_GO_-_BLAST_Premier_2020_-_CS_GO_-_BLAST_Premier_Global_Final_-_day_six_l002t8jy_original'].matches[1].opponents)
                            console.log("==================")
                            finalJson = {...finalJson, ...newEsportsData}

                            console.log("==================")
                            jsonFile = 'public_html/assets/videos/videos.json'
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
                                      // obj = JSON.parse(finalJson); //now it an object
                                      // newJson = {...obj, ...finalJson}
                                      newJson = JSON.stringify(finalJson); //convert it back to json
                                    }catch{
                                      newJson = JSON.stringify(finalJson);           
                                    }
                                    console.log("=============")
                                    // console.log(finalJson)
                                    console.log("===========")
                                    // fs.writeFile(jsonFile, newJson, 'utf8', ()=>{console.log("WRITTEN TO VIDEO JSON FILE");}); // write it back 
                                  }
                                });
                              }
                            })
                          })
                          
                          // newEsportsData.matches = tempMatches;
                         
                        })                        
                      })

                    })
                    
                  })
                  
                }
                console.log("HIT")
                //Only write if there is no team made
              //   theSportsDb.getsportDBEvent(homeTeamName, tempObj.date).then((id)=>{
              //   console.log(id)
              //   // if(id)
                
              // })
              }catch(e){
                console.log(e)
                console.log("HIT ERROR")
              }
            });
          }
        })


          // if()
          
        }
      })
  })

async function returnDataAllSources(filesToUpdate, fileJson){
  let newData = {...fileJson}; //fileJson
  //newData WORKING HERE !!!!!!!!!!!!!!!!!!!
  // if(filesToUpdate )
  return new Promise((resolve, reject)=>{
    let allIdsPromise = [];
    let allEsportsPromise = [];
    let allSportsPromise = [];
    console.log("IN HERE")
    // console.log(filesToUpdate)
    filesToUpdate.forEach(fileToUpdate => {
      if(fileToUpdate[1].sport == 'Football' || fileToUpdate[1].sport == 'Rugby'){
        allSportsPromise.push([fileToUpdate[0], fileToUpdate[1]]);
        // console.log(filesToUpdate)
        // allIdsPromise.push(getAllFileTeamIdsLocal(fileToUpdate[0], fileToUpdate[1]))
      }else if(fileToUpdate[1].sport == 'Esport'){
        console.log("HIT ESPORTS")
        allEsportsPromise.push([fileToUpdate[0], fileToUpdate[1]])
      }
    });
    // console.log("?????????????")
    // console.log(newData)
    // console.log("?????????????")
    resolve([allSportsPromise, allEsportsPromise, newData]);

    // resolve(returnAllSportsDbData(allIdsPromise, newData));
  })
}

async function getAllEsportsData(games, newData){
  return new Promise((resolve, reject)=>{
    console.log("£IN ESPOERSTS HW AJDG JAWG HWJ HWG HGH JWG HA J")
    console.log(games)
    console.log(newData)
    let range = newData.date + "T12:00:00Z," +  newData.date + "T22:00:00Z";
    console.log(range)
    pandaScore.getGameData(range, games[0] + " vs " + games[1], 'ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc')
    .then((data)=>{
      console.log("?>?>?>>>>>.//.././......")
      console.log(data)
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
        // console.log("????????????????????")
        //   console.log(sportsDBDatas.length)
        //   console.log("????????????????????")
        sportsDBDatas.forEach(sportsDBData => {
          // console.log(sportsDBData)
 
          
            if(newData[sportsDBData.fileprefix]){
              if(!newData[sportsDBData.fileprefix]["teams"]){
                console.log("Team needed")
                // let tempTeamObj =  sportsDBData.teams;
                // console.log(newData[sportsDBData.fileprefix])
                                
                newData[sportsDBData.fileprefix]["teams"] = sportsDBData.teams;
                if(newData[sportsDBData.fileprefix]["teams"][0].length > 0){
                  fileprefixs.push(sportsDBData.fileprefix)  

                }
                // newData[sportsDBData.fileprefix]["teams"] = sportsDBData.teams;
                newData[sportsDBData.fileprefix]["teams"][0].forEach((player) => {
                  
                  playersPromise.push(getPlayerDetailsLocal(player));
                });
                newData[sportsDBData.fileprefix]["teams"][1].forEach((player) => {
                  playersPromise.push(getPlayerDetailsLocal(player));
                  // fileprefixs.push(sportsDBData.fileprefix)
                  
                  
                });
                
                
                // newData[sportsDBData.fileprefix]["teams"].forEach((team, teamIndex) => {
                  console.log("????????????????????")
                  console.log("THREE")
                  console.log("????????????????????")
                //   team.forEach((player) => {
                //     playersPromise.push(getPlayerDetailsLocal(player));
                //     fileprefixs.push(sportsDBData.fileprefix)
                    
                    
                //   });
                  
                  
                // });
              }else{
                // Maybe set it to the file teams if needed?
              }
              
              if(!newData[sportsDBData.fileprefix]["sport-info"]){
                console.log("IN GERE")
                let sport = newData[sportsDBData.fileprefix].sport;
                if(sport == 'Football'){
                  sport = "Soccer";
                }
                // console.log(sport)
                sportsInfoPromise.push(getSportsDetailsLocal(sport));
                sportsInfoFixprefixs.push(sportsDBData.fileprefix);
                // newData[sportsDBData.fileprefix] = 
                // console.log(tempObj)
              }
            }else{
              // getSportInfo
            }
            
            
            
        });
        // console.log("????????????????????")
        //   console.log(playersPromise.length)
        //   console.log("????????????????????")
        Promise.all(playersPromise)

        .then((finalPlayersData) => {
          // console.log("????????????????????")
          // console.log(finalPlayersData)
          // console.log("????????????????????")
          // let tempIndex = 0;
          let tempTeamIndex = 0;
          // console.log("????????????????????")
          //     console.log(finalPlayersData)
          //     console.log("????????????????????")
          //     console.log(finalPlayersData.length)

          // console.log("????????????????????")
          //   console.log(tempIndex)
          //   console.log("????????????????????")
          // console.log(finalPlayersData.length)
          let fileTeams = []
          let fileIndex = 0;
          for (let i = 0; i < finalPlayersData.length / 11; i++) {
            fileTeams.push(finalPlayersData.slice(i*11,i*11+11))
            console.log("IN HERE THREEEEEEE:     " + i)
            
          } 
          console.log("????????????????????")
            // console.log(fileTeams)
            console.log("????????????????????")
          // let gameIndex = 0;
          fileTeams.forEach((finalTeam, finalTeamIndex) => {
            let tempIndex = 0;
            finalTeam.forEach((finalPlayer, finalPlayerIndex)=>{
              // if(finalPlayerIndex == newData[fileprefixs[tempTeamIndex]]["teams"][0].length){
              //   tempIndex = 0;
              //   tempTeamIndex++;
              // }
              // console.log(newData[fileprefixs[finalPlayerIndex]]);
              // console.log(finalTeamIndex)
              // console.log(fileprefixs)
              // if()
              newData[fileprefixs[Math.floor((finalTeamIndex/2))]]["teams"][tempTeamIndex][tempIndex] = finalPlayer; 
              // console.log(finalPlayer)
              tempIndex++;
              console.log("INSIDE FOR")
            })
            if(tempTeamIndex + 1 == 2){
              tempTeamIndex = 0;
            }else{
              tempTeamIndex++;

            }
              console.log("????????????????????")
              // console.log(fileprefixs)
              console.log("????????????????????")
 
            
          });
          console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
          // for(var propName in newData) {
          //   // console.log(newData[propName].teams)
            
          // }
          console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
          console.log("END OF FOR")
          // finalJson = {...finalJson, ...data};
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
        "weight": details["strWeight"]
      };
      resolve(tempPlayerArr)
      // setTimeout(resolve, 3000 , tempPlayerArr);
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
            // SEND TO CLINENT TO START THE VIDEO
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

  socket.on('show_player_info', (name, duration, callback)=>{
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
              let playersArr = [...videoObject[filePath].teams[0], ...videoObject[filePath].teams[1]];
              let playerObj = playersArr.find(player => player.name == name);
              console.log(playerObj);
              io.to(room).emit('show_player_info_client', playerObj, duration)
            }else{
              callback(true);
            }
          }
        })
      }
    })
  })

  socket.on('show_sport_info', (type, duration, callback)=>{
    console.log("HIT IN HERE SPORT")
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
              io.to(room).emit('show_sport_info_client', videoObject[filePath]["sport-info"][type], type, duration);
            }else{
              callback(true);
            }
            
          }
        })
      }
    })
  })

  socket.on('return_players', (callback)=>{
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
              callback(videoObject[filePath].teams)
            }else{
              callback('');
            }
            
          }
        })
      }
    })
  })

  socket.on('return_sport_info_types', (callback) =>{
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
              callback(videoObject[filePath]["sport-info"]);
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
              if(json["sport"] == 'Esport'){
                tempData[file] = {
                  "video-url": json["fileprefix"] + ".mp4",
                  "title": json["title"],
                  "desc": json["desc"],
                  "fileprefix": json["fileprefix"],
                  "date": json["date"],
                  "sport": json["sport"],
                  "games": json["games"]
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
                "sport": json["sport"]
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