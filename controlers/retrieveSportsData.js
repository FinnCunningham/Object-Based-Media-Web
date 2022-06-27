const path = require('path');
const theSportsDb = require(path.resolve( __dirname, './sportsDbController.js'));


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

exports.returnAllSportsDbData = returnAllSportsDbData;