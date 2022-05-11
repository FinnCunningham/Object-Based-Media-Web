/**
 * @file Controller file to retrieve api data from PandaScore
 */


const axios = require('axios'); 
/**
 * Retrieve data from a certain game
 * @param {String} range - Range of the video data that is being retrieved  
 * @param {String} name - Title of the video that is being retrieved
 * @param {String} token - Token for the API
 * @returns {Object} - Data returned for the API in JSON object format
 */
const getGameData = (range, name, token) =>
    axios.get('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + encodeURI(name)+"&token=" + token)
    .then((response)=>{
        return response["data"];
    })
/**
 * Retrieve data of a certain team
 * @param {String} teamId - ID of team data to be retrieved  
 * @param {String} token - Token for the API
 * @returns {Object} - Data returned for the API in JSON object format
 */      
const getTeamData = (teamId, token)=>
    axios.get('https://api.pandascore.co/teams/' + teamId + '?token=' + token)
    .then((response)=>{
        return response["data"];
    })

exports.getGameData = getGameData;
exports.getTeamData = getTeamData;