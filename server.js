const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
var cors = require("cors");
const fs = require("fs");
const theSportsDb = require("./controlers/sportsDbController.js");
// const pandaScore = require('./controlers/pandaScoreController.js');
const checkLocalFiles = require("./controlers/checkLocalFiles.js");
const retrieveSportsData = require("./controlers/retrieveSportsData.js");
const retrieveEsportsData = require("./controlers/retrieveEsportsData.js");

let finalJson = {};
/**
 * TODO:
 *  -tidy up code
 *  -remove path when the room is closed.
 */

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    transports: ["websocket"],
    upgrade: false,
  },
});
// set the public folder to serve public assets
app.use(express.static(__dirname + "/public_html"));
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/pages/homepage.html");
});

/**
 * Communication event listener on when a socket connects to the servers socket.io
 * @param {Socket} socket - Socket of the device which is passed through communication
 * @returns {void} - Nothing is returned from this method 
 */
io.on("connection", (socket) => {
  console.log("a user connected from ");
  console.log(io.sockets.adapter.rooms);

  /**
   * Communication event listener on when a socket creates a room
   * @param {String} room - Name of the room the socket is trying to create
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("create_room", (room) => {
    let rooms = getActiveRooms(io);
    if (rooms.includes(room)) {
      console.log(io.sockets.adapter.rooms);
      io.to(socket.id).emit("room_unavailable");
    } else {
      fs.readFile(
        "resources/rooms.json",
        "utf8",
        function readFileCallback(err, data) {
          if (err) {
            console.log(err);
          } else {
            let obj = {};
            if (data) {
              obj = JSON.parse(data); //now it an object
            }
            let tempObj = {};
            tempObj[room] = { path: "" };
            let newJson = { ...obj, ...{ [room]: { path: "" } } };
            newJson = JSON.stringify(newJson); //convert it back to json
            fs.writeFile("resources/rooms.json", newJson, "utf8", () => {
              console.log("WRITTEN TO VIDEO JSON FILE");
            }); // write it back
          }
        }
      );

      socket.join(room);
      io.to(socket.id).emit("room_joined", room);
      console.log("JOINED ROOM " + room);
    }
  });
  /**
   * Communication event listener which checks if a video has already been selected for the room or not
   * @param {Function} callback - A callback function returning if a video has been selected or not
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("video_selected", (callback) => {
    fs.stat("resources/rooms.json", (err, stat) => {
      if (err == null) {
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, data) {
            if (err) {
              console.log(err);
            } else {
              let obj = {};
              if (data) {
                obj = JSON.parse(data);
                let room = [...socket.rooms].filter(
                  (item) => item != socket.id
                );
                if (obj[room].path) {
                  let jsonFile = "public_html/assets/videos/videos.json";
                  fs.readFile(
                    jsonFile,
                    "utf8",
                    function readFileCallback(err, data) {
                      let jsonData = JSON.parse(data);
                      callback(true, JSON.stringify(jsonData[obj[room].path]));
                    }
                  );
                } else {
                  callback(false);
                }
              }
            }
          }
        );
      } else {
        callback(false);
      }
    });
  });
  /**
   * Communication event listener which updates the local storage JSON file
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("update_videos", () => {
    let filesToUpdate = [];
    checkLocalFiles.getNestedFileData((data, folderMax) => {
      let tempObj = {};
      for (var propName in data) {
        if (data.hasOwnProperty(propName)) {
          tempObj = data[propName];
        }
      }
      if (tempObj.date) {
        let homeTeamName = tempObj.hometeam;
        if (tempObj.sport == "Rugby") {
          homeTeamName = tempObj.hometeam + " Rugby";
        }
        finalJson = { ...finalJson, ...data };

        let jsonFile = "public_html/assets/videos/videos.json";
        fs.stat(jsonFile, (err, stat) => {
          if (err) {
            console.log(err);
          } else {
            fs.readFile(
              jsonFile,
              "utf8",
              function readFileCallback(err, videoFileData) {
                try {
                  videoObj = {};
                  try {
                    videoObj = JSON.parse(videoFileData);
                  } catch {}
                  if (
                    videoObj[tempObj.fileprefix] &&
                    videoObj[tempObj.fileprefix]["teams"] &&
                    videoObj[tempObj.fileprefix]["sport-info"]){
                    //if there is a team and sport-info, don't overwrite
                    let fileprefix = tempObj.fileprefix;
                    finalJson = {
                      ...finalJson,
                      ...{ [fileprefix]: videoObj[tempObj.fileprefix] },
                    };
                  } else {
                    // IF ESPORTS GIVE GAMES????????
                    if (tempObj.sport == "Esport") {
                      filesToUpdate.push([tempObj.games, tempObj]);
                      if (
                        videoObj[tempObj.fileprefix] &&
                        videoObj[tempObj.fileprefix].matches){
                        finalJson = {
                          ...finalJson,
                          ...{
                            [tempObj.fileprefix]: videoObj[tempObj.fileprefix],
                          },
                        };
                      }else{
                        finalJson = { ...finalJson, ...videoObj };
                      }
                    }else{
                      filesToUpdate.push([homeTeamName, tempObj]);
                      finalJson = { ...finalJson, ...videoObj }; //data
                    }
                  }
                  if (folderMax) {
                    returnDataAllSources(filesToUpdate, finalJson).then(
                      (theSportsDbData) => {
                        Promise.all(theSportsDbData[0]).then((neededData) => {
                          let allIdsPromise = [];
                          neededData.forEach((sportsData) => {
                            allIdsPromise.push(
                              getAllFileTeamIdsLocal(
                                sportsData[0],
                                sportsData[1]
                              )
                            );
                          });
                          retrieveSportsData
                            .returnAllSportsDbData(
                              allIdsPromise,
                              theSportsDbData[2]
                            )
                            .then((sportsUpdatedData) => {
                              finalJson = {
                                ...finalJson,
                                ...sportsUpdatedData,
                              };
                              retrieveEsportsData
                                .returnAllEsportsData(
                                  finalJson,
                                  theSportsDbData
                                )
                                .then((newEsportsData) => {
                                  finalJson = {
                                    ...finalJson,
                                    ...newEsportsData,
                                  };
                                  jsonFile =
                                    "public_html/assets/videos/videos.json";
                                  fs.stat(jsonFile, (err, stat) => {
                                    if (err) {
                                      console.log(err);
                                      fs.writeFile(
                                        jsonFile,
                                        finalJson,
                                        { flag: "w" },
                                        () => {
                                          console.log(
                                            "WRITTEN TO VIDEO JSON FILE"
                                          );
                                        }
                                      ); // write it back
                                    } else {
                                      fs.readFile(
                                        jsonFile,
                                        "utf8",
                                        function readFileCallback(err, data) {
                                          if (err) {
                                            console.log(err);
                                          } else {
                                            let newJson = {};
                                            try {
                                              newJson = JSON.stringify(finalJson); //convert it back to json
                                            } catch {
                                              newJson = JSON.stringify(finalJson);
                                            }
                                            fs.writeFile(
                                              jsonFile,
                                              newJson,
                                              "utf8",
                                              () => {
                                                console.log(
                                                  "WRITTEN TO VIDEO JSON FILE"
                                                );
                                              }
                                            ); // write it back
                                          }
                                        }
                                      );
                                    }
                                  });
                                });
                            });
                        });
                      }
                    );
                  }
                } catch (e) {
                  console.log(e);
                  console.log("HIT ERROR");
                }
              }
            );
          }
        });
      }
    });
  });

  /**
   * Communication event listener which returns all video data
   * @param {Function} callback - A callback function returning the video data
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("return_videos", (callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, data) {
      callback(JSON.stringify(data));
    });
  });

  /**
   * Communication event listener which tries to get the client socket to join a room
   * @param {String} room - Name of the room the socket is in
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("room_join", (room) => {
    socket.join(room);
    io.to(socket.id).emit("room_joined", room);
  });

  /**
   * Communication event listener which tries to set the video of the current room that the socket is in
   * @param {String} fileprefix - Name of the file that client just picked
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("set_video", (fileprefix) => {
    fs.stat("resources/rooms.json", (err, stat) => {
      if (err == null) {
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, data) {
            if (err) {
              console.log(err);
            } else {
              let roomObj = {};
              if (data) {
                roomObj = JSON.parse(data); //now it's an object
              }
              let room = [...socket.rooms].filter((item) => item != socket.id);
              let newJson = { ...roomObj, ...{ [room]: { path: fileprefix } } };
              newJson = JSON.stringify(newJson);
              fs.writeFile("resources/rooms.json", newJson, "utf8", () => {
                console.log("WRITTEN TO VIDEO JSON FILE");
              }); // write it back
              io.to(room).emit("set_video_video_client", fileprefix);
            }
          }
        );
      } else {
        let roomObj = {};
        let room = [...socket.rooms].filter((item) => item != socket.id);
        let newJson = { ...roomObj, ...{ [room]: { path: fileprefix } } };
        newJson = JSON.stringify(newJson);
        fs.writeFile("resources/rooms.json", newJson, { flag: "wx" }, () => {
          console.log("WRITTEN TO VIDEO JSON FILE");
        }); // write it back
        io.to(socket.id).emit("set_video_video_client", fileprefix);
      }
    });
  });

  /**
   * Communication event listener which tries to start the video of the room based on the video that is selected
   * @param {Object} clientData - Object containing data such as room_id (room name)
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("start_video", function (clientData, callback) {
    fs.readFile(
      "resources/rooms.json",
      "utf8",
      function readFileCallback(err, data) {
        if (data) {
          let obj = JSON.parse(data);
          let room = [...socket.rooms].filter((item) => item != socket.id);
          if (room.length > 0) {
            let filePath = obj[room].path;
            io.to(clientData["room_id"]).emit(
              "start_video_video_client",
              filePath
            );
            callback(false);
          } else {
            callback(true);
          }
        }
      }
    );
  });

  /**
   * Communication event listener which returns all room names and amount of clients within the rooms
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("secondary_device_connected", function () {
    console.log("Secondary device connected");
    let rooms = getActiveRooms(io);
    let rooms_clients = [];
    rooms.forEach((room) => {
      rooms_clients.push(io.sockets.adapter.rooms.get(room).size - 1);
    });
    io.emit("secondary_device_connected", {
      rooms: rooms,
      rooms_clients: rooms_clients,
    });
  });
  /**
   * Communication event listener which tries to play the video of the room
   * @param {Object} data - An object containing room_id (room name)
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("play_video", function (data) {
    io.to(data["room_id"]).emit("play_video");
  });
  /**
   * Communication event listener which tries to pause the video of the room
   * @param {Object} data - An object containing room_id (room name)
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("pause_video", function (data) {
    io.to(data["room_id"]).emit("pause_video");
  });
  /**
   * Communication event listener which tries to change the volume of the video of the room
   * @param {String} volumeValue - Value of the volume the socket wants to set the video to
   * @param {String} room - Name of the room the socket is connected to
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("change_volume", (volumeValue, room) => {
    io.to(room).emit("change_volume_client", volumeValue);
  });
  /**
   * Communication event listener which tries to change the fullscreen state of the video of the room
   * @param {String} room - Name of the room the socket is connected to
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("change_fullscreen", (room) => {
    io.to(room).emit("change_fullscreen_client");
  });
  /**
   * Communication event listener which tries to skip to the start of the video from the local storage JSON file data
   * @param {String} room - Name of the room the socket is connected to
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("skip_to_start", (room) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let filePath = obj[room].path;
              io.to(room).emit(
                "skip_to_start_client",
                videoObject[filePath]["start-time"]
              );
            }
          }
        );
      }
    });
  });

  /**
   * Communication event listener which tries to show the players information on the video while the user is holding down the button
   * @param {String} name - Name of the player that the user wants to show
   * @param {String} location - Value of the location that the socket wants to set the information on the video to
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("show_player_info_hold", (name, location, callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let room = [...socket.rooms].filter((item) => item != socket.id);
              if (room.length > 0) {
                let filePath = obj[room].path;
                let playersArr = [];
                let playerObj = {};
                if (videoObject[filePath].sport == "Esport") {
                  videoObject[filePath].matches.forEach((match) => {
                    match.opponents.forEach((teams) => {
                      teams.forEach((player) => {
                        playersArr.push(player);
                      });
                    });
                  });
                  playerObj = playersArr.find((player) => player.name == name);
                } else {
                  playersArr = [
                    ...videoObject[filePath].teams[0],
                    ...videoObject[filePath].teams[1],
                  ];
                  playerObj = playersArr.find((player) => player.name == name);
                }
                console.log(playerObj);
                io.to(room).emit(
                  "show_player_info_hold_client",
                  playerObj,
                  videoObject[filePath].sport,
                  location
                );
              } else {
                callback(true);
              }
            }
          }
        );
      }
    });
  });
  /**
   * Communication event listener which tries to stop showing the players information on the video when the user lets go of the button
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("stop_show_player_info_hold", (callback) => {
    fs.readFile(
      "resources/rooms.json",
      "utf8",
      function readFileCallback(err, roomData) {
        let obj = JSON.parse(roomData);
        let room = [...socket.rooms].filter((item) => item != socket.id);
        if (room.length > 0) {
          io.to(room).emit("stop_show_player_info_hold_client");
        } else {
          callback(true);
        }
      }
    );
  });

  /**
   * Communication event listener which tries to show the players information on the video for a tap duration
   * @param {String} name -  Name of the player that the user wants to show
   * @param {String} duration - Value of the duration that the socket wants to set the information on the video to
   * @param {String} location - Value of the location that the socket wants to set the information on the video to
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("show_player_info", (name, duration, location, callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let room = [...socket.rooms].filter((item) => item != socket.id);
              if (room.length > 0) {
                let filePath = obj[room].path;
                let playersArr = [];
                let playerObj = {};
                if (videoObject[filePath].sport == "Esport") {
                  videoObject[filePath].matches.forEach((match) => {
                    match.opponents.forEach((teams) => {
                      teams.forEach((player) => {
                        playersArr.push(player);
                      });
                    });
                  });
                  playerObj = playersArr.find((player) => player.name == name);
                } else {
                  playersArr = [
                    ...videoObject[filePath].teams[0],
                    ...videoObject[filePath].teams[1],
                  ];
                  playerObj = playersArr.find((player) => player.name == name);
                }
                io.to(room).emit(
                  "show_player_info_client",
                  playerObj,
                  duration,
                  videoObject[filePath].sport,
                  location
                );
              } else {
                callback(true);
              }
            }
          }
        );
      }
    });
  });
  /**
   * Communication event listener which tries to show the sport information on the video while the user is holding down the button
   * @param {String} type - Type of sport information that the user wants to see
   * @param {String} matchIndex - Index of the match (mainly for tournaments)
   * @param {String} location - Value of the location that the socket wants to set the information on the video to
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("show_sport_info_hold", (type, matchIndex, location, callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let room = [...socket.rooms].filter((item) => item != socket.id);
              if (room.length > 0) {
                let filePath = obj[room].path;
                let infoObj = {};
                if (videoObject[filePath].sport == "Esport") {
                  //NESTED
                  if (type == "prizepool") {
                    infoObj =
                      videoObject[filePath].matches[matchIndex].tournament[
                        type
                      ];
                  } else {
                    infoObj = videoObject[filePath].matches[matchIndex][type];
                  }
                } else {
                  infoObj = videoObject[filePath]["sport-info"][type];
                }
                io.to(room).emit(
                  "show_sport_info_hold_client",
                  infoObj,
                  type,
                  location
                );
              } else {
                callback(true);
              }
            }
          }
        );
      }
    });
  });

  /**
   * Communication event listener which tries to stop showing the sport information on the video when the user lets go of the button
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("stop_show_sport_info_hold", (type, matchIndex, callback) => {
    fs.readFile(
      "resources/rooms.json",
      "utf8",
      function readFileCallback(err, roomData) {
        let obj = JSON.parse(roomData);
        let room = [...socket.rooms].filter((item) => item != socket.id);
        if (room.length > 0) {
          io.to(room).emit("stop_show_sport_info_hold_client");
        } else {
          callback(true);
        }
      }
    );
  });

  /**
   * Communication event listener which tries to show the sport information on the video
   * @param {String} type - Type of sport information that the user wants to see
   * @param {String} duration - Value of the duration that the socket wants to set the information on the video to
   * @param {String} matchIndex - Index of the match (mainly for tournaments)
   * @param {String} location - Value of the location that the socket wants to set the information on the video to
   * @param {Function} callback - A callback function returning an error or not depending if the function completed successfully
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on(
    "show_sport_info",
    (type, duration, matchIndex, location, callback) => {
      let jsonFile = "public_html/assets/videos/videos.json";
      fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
        if (err) {
          console.log(err);
        } else {
          let videoObject = JSON.parse(videoData);
          fs.readFile(
            "resources/rooms.json",
            "utf8",
            function readFileCallback(err, roomData) {
              if (videoData) {
                let obj = JSON.parse(roomData);
                let room = [...socket.rooms].filter(
                  (item) => item != socket.id
                );
                if (room.length > 0) {
                  let filePath = obj[room].path;
                  let infoObj = {};
                  if (videoObject[filePath].sport == "Esport") {
                    if (type == "prizepool") {
                      infoObj =
                        videoObject[filePath].matches[matchIndex].tournament[
                          type
                        ];
                    } else {
                      infoObj = videoObject[filePath].matches[matchIndex][type];
                    }
                  } else {
                    infoObj = videoObject[filePath]["sport-info"][type];
                  }
                  io.to(room).emit(
                    "show_sport_info_client",
                    infoObj,
                    type,
                    duration,
                    location
                  );
                } else {
                  callback(true);
                }
              }
            }
          );
        }
      });
    }
  );

  /**
   * Communication event listener which returns all of the players information
   * @param {String} sportType - Name of type of sport e.g Esports or other (football).
   * @param {Function} callback - A callback function returning if a video has been selected or not
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("return_players", (sportType, callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let room = [...socket.rooms].filter((item) => item != socket.id);
              if (room.length > 0) {
                let filePath = obj[room].path;
                if (sportType == "Esport") {
                  callback(videoObject[filePath].matches);
                } else {
                  callback(videoObject[filePath].teams);
                }
              } else {
                callback("");
              }
            }
          }
        );
      }
    });
  });

  /**
   * Communication event listener which returns all sport informaiton types
   * @param {String} sportType - Name of type of sport e.g Esports or other (football).
   * @param {Function} callback - A callback function returning if a video has been selected or not
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("return_sport_info_types", (sportType, callback) => {
    let jsonFile = "public_html/assets/videos/videos.json";
    fs.readFile(jsonFile, "utf8", function readFileCallback(err, videoData) {
      if (err) {
        console.log(err);
      } else {
        let videoObject = JSON.parse(videoData);
        fs.readFile(
          "resources/rooms.json",
          "utf8",
          function readFileCallback(err, roomData) {
            if (videoData) {
              let obj = JSON.parse(roomData);
              let room = [...socket.rooms].filter((item) => item != socket.id);
              if (room.length > 0) {
                let filePath = obj[room].path;
                if (sportType == "Esport") {
                  callback(videoObject[filePath].matches);
                } else {
                  callback(videoObject[filePath]["sport-info"]);
                }
              } else {
                callback("");
              }
            }
          }
        );
      }
    });
  });
  /**
   * Communication event listener which makes the socket leave the room
   * @param {String} room - Name of the room the socket is in
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("leave_room", (room) => {
    socket.leave(room["room"]);
    console.log("user left: " + room["room"]);
  });
  /**
   * Communication event listener which runs on socket disconnect
   * @returns {void} - Nothing is returned from this method 
   */
  socket.on("disconnect", function () {
    console.log("USER DISCONNECTED: " + socket.id);
  });
});

/**
 * Splits the filesToUpdate array into their seperate arrays based on category of the video
 * @param {Array} filesToUpdate - Array containing the files that need to be updated with new data
 * @param {String} fileJson - Contents of the JSON storage file
 * @returns {Array} - sports files to update | esports files to update | overall data object
 */
async function returnDataAllSources(filesToUpdate, fileJson) {
  let newData = { ...fileJson };
  return new Promise((resolve, reject) => {
    let allEsportsPromise = [];
    let allSportsPromise = [];
    filesToUpdate.forEach((fileToUpdate) => {
      if (
        fileToUpdate[1].sport == "Football" ||
        fileToUpdate[1].sport == "Rugby"
      ) {
        allSportsPromise.push([fileToUpdate[0], fileToUpdate[1]]);
      } else if (fileToUpdate[1].sport == "Esport") {
        allEsportsPromise.push([fileToUpdate[0], fileToUpdate[1]]);
      }
    });
    resolve([allSportsPromise, allEsportsPromise, newData]);
  });
}
/**
 * Retrieve all team ids from the video
 * @param {String} homeTeamName - Name of the home team of the video
 * @param {Object} tempObj - Object containing date and fileprefix of video
 * @returns {Promise} - API request for the teams ids
 */
async function getAllFileTeamIdsLocal(homeTeamName, tempObj) {
  return new Promise((resolve, rejet) => {
    theSportsDb.getsportDBEvent(homeTeamName, tempObj.date).then((id) => {
      resolve([id, tempObj.fileprefix]);
    });
  });
}

/**
 * Retrieve all room names that are active within the server
 * @param {Socket.io IO} io - Socket.io overall variable
 * @returns {Map} - Map of active rooms 
 */
function getActiveRooms(io) {
  const roomArr = Array.from(io.sockets.adapter.rooms);
  const filtered = roomArr.filter((room) => !room[1].has(room[0]));
  return filtered.map((i) => i[0]);
}

/**
 * Server event listener
 * @returns {void} - Nothing is returned from this method 
 */
server.listen(40074, () => {
  console.log("listening on *:40074");
});