/**
 * @file Controller file to check the nested local file directories.
 */
const fs = require('fs');

/**
 * Checks through the nested file directories to pull certain JSON files.
 * @param {Function} innerCallback - Return when it has been completed
 * @returns {void} - Nothing is returned from this method 
 */
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

/**
 * Checks the folder child directories
 * @param {Function} source - Path of folder to look for child files
 * @param {Function} callback - Return all needed directories
 * @param {Boolean} directoriesNeeded - Boolean whether files need to be returned
 * @returns {void} - Nothing is returned from this method 
 */
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
