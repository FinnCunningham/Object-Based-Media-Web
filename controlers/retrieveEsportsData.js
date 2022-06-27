const path = require('path');
const pandaScore = require(path.resolve( __dirname, './pandaScoreController.js'));

const esportsCheck = (theSportsDbData) => {
    let esportsCallPromises = [];
    // console.log(theSportsDbData[1].length)
    let esportsFiles = [];
    theSportsDbData[1].forEach(esportsData => {
        // console.log(esportsData)
        let matches = [];
        esportsFiles.push(esportsData[1].fileprefix)
        esportsData[1].games.forEach(match => {
        // console.log(esportsData)
        // console.log(match)
        matches.push([match, esportsData[1]])
        esportsCallPromises.push(getAllEsportsData(match, esportsData[1]))

        });
        
    });
    return [esportsCallPromises, esportsFiles];
}

async function returnAllEsportsData(finalJson, theSportsDbData) {
    return new Promise((resolve, reject)=>{
        let checkData = esportsCheck(theSportsDbData);
        let esportsCallPromises = checkData[0];
        let esportsFiles = checkData[1];
        Promise.all(esportsCallPromises)
        .then((esportsData)=>{
            // console.log(esportsFiles)
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
            // let matchesObj = newEsportsData;
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
            resolve(newEsportsData)
            })
            })
        })
  }

async function getTeamData(teamId){
    return new Promise((resolve, reject)=>{
        pandaScore.getTeamData(teamId, "token")
        .then((data)=>{
        resolve(data)
        })
    })
}

async function getAllEsportsData(games, newData){
    return new Promise((resolve, reject)=>{
      let range = newData.date + "T12:00:00Z," +  newData.date + "T22:00:00Z";
      pandaScore.getGameData(range, games[0] + " vs " + games[1], 'token')
      .then((data)=>{
        resolve(data)
      })
    })
  }

exports.returnAllEsportsData = returnAllEsportsData;