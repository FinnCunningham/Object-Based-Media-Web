const axios = require('axios'); 
const cheerio = require('cheerio'); 

const getSportInfo = (sport) => 
  axios.get('https://www.thesportsdb.com/api/v1/json/2/all_sports.php')
  .then((response)=>{
    // console.log(response.data)
    let data = response.data["sports"].filter(sportObj => sportObj.strSport == sport)
    return data
  })

const getsportDBEvent = (hometeam, date) => axios.get('https://www.thesportsdb.com/api/v1/json/2/searchevents.php?e=' + hometeam + '&d=' + date)
.then((response)=>{
  return response.data.event[0].idEvent
})

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

const getPlayerDetails = (playerName) => axios.get('https://www.thesportsdb.com/api/v1/json/2/searchplayers.php?p=' + playerName)
.then((response)=>{
  return response.data.player[0];
})
exports.getsportDBEvent = getsportDBEvent;
exports.getPlayers = getPlayers;
exports.getPlayerDetails = getPlayerDetails;
exports.getSportInfo = getSportInfo;