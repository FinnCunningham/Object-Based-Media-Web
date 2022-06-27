const fs = require('fs');

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
  
exports.getNestedFileData = getNestedFileData;
