/**
 * @file Controller file to retrieve data about esports
 */

const path = require('path');
const pandaScore = require(path.resolve( __dirname, './pandaScoreController.js'));

/**
 * Check to see if the local storage already contains esports data to reduce API calls
 * @param {Array} theSportsDbData - data from the local storage
 * @returns {Array} - returns new api data and file prefixs of data gathered
 */
const esportsCheck = (theSportsDbData) => {
    let esportsCallPromises = [];
    let esportsFiles = [];
    theSportsDbData[1].forEach(esportsData => {
        let matches = [];
        esportsFiles.push(esportsData[1].fileprefix)
        esportsData[1].games.forEach(match => {
        matches.push([match, esportsData[1]])
        esportsCallPromises.push(getAllEsportsData(match, esportsData[1]))
        });
    });
    return [esportsCallPromises, esportsFiles];
}

/**
 * This tries to gather all of the esports data from external API but only if it is needed
 * @param {Object} finalJson - Object passed through the main server file which will write the new JSON file at the end
 * @param {Array} theSportsDbData - Data that needs to be checked from local storage
 * @returns {Promise} - Final promise of the data gathered from the api if needed
 */
async function returnAllEsportsData(finalJson, theSportsDbData) {
    return new Promise((resolve, reject)=>{
        let checkData = esportsCheck(theSportsDbData);
        let esportsCallPromises = checkData[0];
        let esportsFiles = checkData[1];
        Promise.all(esportsCallPromises)
        .then((esportsData)=>{
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

/**
 * Retrieve data from a certain team
 * @param {String} teamID - ID of the team that needs data  
 * @returns {Promise} - Data returned for the API in JSON object format
 */
async function getTeamData(teamId){
    return new Promise((resolve, reject)=>{
        pandaScore.getTeamData(teamId, "ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc")
        .then((data)=>{
        resolve(data)
        })
    })
}

/**
 * Retrieve data from a certain team
 * @param {Array} games - Array containg the names of the two teams playing
 * @param {Object} newData - Object containing date   
 * @returns {Promise} - Data returned for the API in JSON object format
 */
async function getAllEsportsData(games, newData){
    return new Promise((resolve, reject)=>{
      let range = newData.date + "T12:00:00Z," +  newData.date + "T22:00:00Z";
      pandaScore.getGameData(range, games[0] + " vs " + games[1], 'ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc')
      .then((data)=>{
        resolve(data)
      })
    })
  }

exports.returnAllEsportsData = returnAllEsportsData;