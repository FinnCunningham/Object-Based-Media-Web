const axios = require('axios'); 

// https://api.pandascore.co/csgo/matches?page=1&per_page=5&range[begin_at]=2021-01-24T15:20:00Z,2021-01-24T21:00:00Z&sort=begin_at&search[name]= Vitality vs Natus Vincere
//https://www.bbc.co.uk/iplayer/episode/l002t8jy/esports-csgo-blast-premier-2020-csgo-blast-premier-global-final-day-six
//API - ul5RBe3fXjrzQYaWwZFXg7hv_ACaKq1kTrK7hI7KlmLIm7KYTsc
const getGameData = (date, name) => {
    let range = date + "T12:00:00Z," +  date + "T22:00:00Z";
    axios.get('https://api.pandascore.co/csgo/matches?per_page=3&range[begin_at]=' + range + '&sort=begin_at&search[name]=' + name)
    .then((response)=>{
        return response.data;
    })
}