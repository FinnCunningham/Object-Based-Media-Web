const axios = require('axios'); 
const getGameData = (range, name, token) =>
    axios.get('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + encodeURI(name)+"&token=" + token)
    .then((response)=>{
        return response["data"];
    })
        
const getTeamData = (teamId, token)=>
    axios.get('https://api.pandascore.co/teams/' + teamId + '?token=' + token)
    .then((response)=>{
        return response["data"];
    })

exports.getGameData = getGameData;
exports.getTeamData = getTeamData;