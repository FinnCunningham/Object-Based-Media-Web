/**
 * @file Controller file to retrieve api data from theSportsDb
 */

const axios = require('axios'); 
const cheerio = require('cheerio'); 

/**
 * Retrieve data of a certain sport
 * @param {String} sport - Name of sport to get data about  
 * @returns {Object} - Data returned for the API in JSON object format
 */   
const getSportInfo = (sport) => 
  axios.get('https://www.thesportsdb.com/api/v1/json/2/all_sports.php')
  .then((response)=>{
    let data = response.data["sports"].filter(sportObj => sportObj.strSport == sport)
    return data
  })

/**
 * Retrieve data of a certain sport event
 * @param {String} homeTeam - Name of the hometeam  
 * @param {String} date - date of the sport event  
 * @returns {Object} - Data returned for the API in JSON object format
 */ 
const getsportDBEvent = (hometeam, date) => axios.get('https://www.thesportsdb.com/api/v1/json/2/searchevents.php?e=' + hometeam + '&d=' + date)
.then((response)=>{
  return response.data.event[0].idEvent
})

/**
 * Retrieve data of certain teams
 * @param {String} id - Id of the sport event  
 * @param {String} fileprefix - file name of the local data storage  
 * @returns {Object} - Data returned for the API in JSON object format
 */ 
const getPlayers = (id, fileprefix) => axios.get('https://www.thesportsdb.com/event/' + id) 
.then(({data}) => {
  let homeTeam = [];
  let awayTeam = [];
  const $ = cheerio.load(data);
  const grid = $('#feature .container .row .col-sm-9 table:nth-of-type(2) tbody tr')
  $(grid).toArray().map((rowEle)=>{
    // Row
    rowEle.children.forEach((playerEle) => {
      // Player
      const playerText = $(playerEle).children('a')[0].childNodes;
      const final = $(playerText).toArray().filter(child => child.type == 'text').map((finalText) => {return $(finalText).text()});
      homeTeam.push({"name": final.join(' ')})
    })
    //End of row
  })

  const grid2 = $('#feature .container .row .col-sm-9 table:nth-of-type(3) tbody tr')
  $(grid2).toArray().map((rowEle)=>{
    // Row
    rowEle.children.forEach((playerEle) => {
      // Player
      const playerText = $(playerEle).children('a')[0].childNodes;
      const final = $(playerText).toArray().filter(child => child.type == 'text').map((finalText) => {return $(finalText).text()});
      awayTeam.push({"name": final.join(' ')});
    })
    //End of row
  })
  return({fileprefix: fileprefix, teams: [homeTeam, awayTeam]})
})

/**
 * Retrieve data of certain player
 * @param {String} playerName - name of the player that data is request for  
 * @returns {Object} - Data returned for the API in JSON object format
 */ 
const getPlayerDetails = (playerName) => axios.get('https://www.thesportsdb.com/api/v1/json/2/searchplayers.php?p=' + playerName)
.then((response)=>{
  return response.data.player[0];
})
exports.getsportDBEvent = getsportDBEvent;
exports.getPlayers = getPlayers;
exports.getPlayerDetails = getPlayerDetails;
exports.getSportInfo = getSportInfo;