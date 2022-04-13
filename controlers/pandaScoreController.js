const axios = require('axios'); 
// async function getGameData(date, name, token){
//     return new Promise((resolve, reject)=>{
//         let range = date + "T12:00:00Z," +  date + "T22:00:00Z";
//         console.log("BEFORE REQUEST")
//         console.log('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + encodeURI(name)+"&token=" + token)
        
//             console.log("123")
//             axios.get('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + encodeURI(name)+"&token=" + token)
//             .then((response)=>{
//                 console.log("DURING REQUEST")
//                 // console.log(response["data"])
//                 resolve(response["data"]);
//             })
        
        
//     })
// }

const getGameData = (range, name, token) =>
    axios.get('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + encodeURI(name)+"&token=" + token)
    .then((response)=>{
        console.log("DURING REQUEST")
        // console.log(response["data"])
        return response["data"];
    })
        
const getTeamData = (teamId, token)=>
    axios.get('https://api.pandascore.co/teams/' + teamId + '?token=' + token)
    .then((response)=>{
        return response["data"];
    })

exports.getGameData = getGameData;
exports.getTeamData = getTeamData;