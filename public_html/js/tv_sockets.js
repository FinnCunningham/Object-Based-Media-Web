let textShadow = "text-shadow:0.05em 0 black,0 0.05em black,-0.05em 0 black,0 -0.05em black,-0.05em -0.05em black,-0.05em 0.05em black,0.05em -0.05em black,0.05em 0.05em black;"
const setLocation = (locationPoint) => {
    let tempLocation = "top:6px;right:4px;";
    if(locationPoint == "Top Right"){
        tempLocation = "top:6px;right:4px;";
    }else if(locationPoint == "Top Left"){
        tempLocation = "top:6px;left:4px;";
    }else if(locationPoint == "Bottom Right"){
        tempLocation = "bottom:6px;right:4px;";
    }else if(locationPoint == "Bottom Left"){
        tempLocation = "bottom:6px;left:4px;";
    }
    return tempLocation;
}

let overlayStyle = "position:absolute;z-index:1;display:flex;overflow: hidden;flex-direction:column;";
$(function () {
    // var socket = io.connect('https://s5117817.bucomputing.uk', { path: '/node/socket.io/'});
    // let filePath = '';

    socket.on('connect', () => {
        if(!localStorage.getItem("room_id") || localStorage.getItem("room_id") == undefined){
            document.getElementById("room_div").style.display = "block";
        }else{
            console.log(socket.id)
            console.log(localStorage.getItem("room_id"))
            socket.emit("room_join", localStorage.getItem("room_id"));
        }
    })
    // LOCATION
    socket.on('show_players_client', (players, duration, location) => {
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = overlayStyle + setLocation(location);
        console.log(players)
        players.forEach((team, teamIndex) => {
            let teamDiv = document.createElement("div");
            teamDiv.style.color = "white";
            let teamP = document.createElement("p");
            if (teamIndex == 0) {
                teamP.innerText = "Home Team"
            }else{
                teamP.innerText = "Away Team"
            }
            teamDiv.appendChild(teamP);
            team.forEach(player => {
                let p = document.createElement("p")
                p.innerText = player["name"];
                teamDiv.appendChild(p)
            });    
            overlay.appendChild(teamDiv)
        });
        container.appendChild(overlay);
        setTimeout(
        function(){
            overlay.remove();
        }, duration);
    })

    // LOCATION
    socket.on('show_sport_info_client', (info, type, duration, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = overlayStyle + setLocation(location) + "max-height:40%";
        let infoP; 
        if(type == 'icon'){
            infoP = document.createElement("img");
            infoP.src = info;
            infoP.style = "width: 100%;height:200px;object-fit:scale-down;";
        }else{
            infoP = document.createElement("p");
            infoP = setElement(infoP, type + ": "+ info)
        }
        overlay.appendChild(infoP)
        container.appendChild(overlay);
        setTimeout(
        function(){
            overlay.remove();
        }, duration);
    })

    // LOCATION
    socket.on('show_sport_info_hold_client', (info, type, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.id = "overlay-div"
        let locationString = setLocation(location)
        console.log(location);
        overlay.style = overlayStyle + locationString + "max-height:40%";
        let infoP; 
        if(type == 'icon'){
            infoP = document.createElement("img");
            infoP.src = info;
            infoP.style = "width: 100%;height:200px;object-fit:scale-down;";
        }else{
            infoP = document.createElement("p");
            infoP = setElement(infoP, type + ": "+ info)
        }
        overlay.appendChild(infoP)
        container.appendChild(overlay);
        // setTimeout(
        // function(){
        //     overlay.remove();
        // }, duration);
    })

    socket.on('stop_show_sport_info_hold_client', ()=>{
       document.getElementById("overlay-div").remove();
    })

    // LOCATION
    socket.on('show_player_info_client', (playerObj, duration, sport, location)=>{
        console.log("IN HERE")
        console.log(playerObj)
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.className = "player-card";
        overlay.style = overlayStyle + setLocation(location);
        overlay = show_player_info(overlay, playerObj, sport)
        container.appendChild(overlay);
        console.log(duration)
        setTimeout(
        function(){
            overlay.remove();
        }, 100000000000); //duration
    })

    // LOCATION
    socket.on('show_player_info_hold_client', (playerObj, sport, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.className = "player-card";

        overlay.id = "overlay-div"
        overlay.style = overlayStyle + setLocation(location);
        overlay = show_player_info(overlay, playerObj, sport)
        container.appendChild(overlay);
    })

    socket.on('stop_show_player_info_hold_client', ()=>{
        document.getElementById("overlay-div").remove();
     })
     
 

    socket.on('set_video_video_client', (path) => {
        console.log(" CHANGED ... STARTING VIDEO...")
        let videoBaseUrl = '/assets/videos/';
        let filePath = path + "/" + path;
        $('#tv-content').html("<video id='videoClip' class='video_player'><source src='" + videoBaseUrl + filePath + ".mp4' type='video/mp4'></video>");    
        document.getElementById("videoClip").load();
        if(isFullScreen){
            document.getElementById("videoClip").style = "width:100%;";
        }
    })

    socket.on('start_video_video_client', (path) => {
        console.log("STARTING VIDEO...")
        let videoBaseUrl = '/assets/videos/';
        let filePath = path + "/" + path;
        $('#tv-content').html("<video id='videoClip' class='video_player'><source src='" + videoBaseUrl + filePath + ".mp4' type='video/mp4'></video>");    
        document.getElementById("videoClip").load();
        if(isFullScreen){
            document.getElementById("videoClip").style = "width:100%;";
        }
    })
    
    socket.on('play_video', function(msg){
        console.log("BACK" + socket.id)
        console.log("Start Clip");
        document.getElementById("videoClip").play();
    });

    socket.on('pause_video', () => {
        document.getElementById("videoClip").pause();
    })

    socket.on('change_volume_client', (value)=>{
        if(document.getElementById('videoClip')){
            document.getElementById('videoClip').volume = value;
        }
    })

    socket.on('change_fullscreen_client', ()=>{
        console.log("yo")
        fullscreen();
    })

    socket.on('skip_to_start_client', (time)=>{
        document.getElementById("videoClip").currentTime = time;
    })

    socket.on('room_unavailable', () => {
        console.log("unavailable");
        console.log("Create a different room, Room already created");
        document.getElementById("room_div").style.display = "Block";
        localStorage.removeItem("room_id");
    })

    socket.on('room_joined', (room) => {
        console.log(room);
        document.getElementById("room_div").style.display = "None";
        localStorage.setItem('room_id', room);
        document.getElementById("room_id_p").innerText = room;
    })

    window.addEventListener("beforeunload", function(event) {
        socket.disconnect();
        //event.preventDefault();
        event.returnValue = null; //"Any text"; //true; //false;
      });
});

const show_player_info = (overlay, playerObj, sport) => {
    let esportsImg = document.createElement("img");
    let esportsFullName = document.createElement("p");
    let esportsAge = document.createElement("div");
    let name = document.createElement("h1");
    let esportsBirth = document.createElement("div");
    let esportsHome = document.createElement("div");
    let sportsElements = {};
    sportsElements["img"] = document.createElement("img");
    sportsElements["name"] = document.createElement("span");
    sportsElements["gender"] = document.createElement("p");
    sportsElements["position"] = document.createElement("h1");
    sportsElements["birthday"] = document.createElement("div");
    sportsElements["SigningCost"] = document.createElement("div");
    sportsElements["nationality"] = document.createElement("div");
    sportsElements["weight"] = document.createElement("div");
    sportsElements["height"] = document.createElement("div");

    // sportsElements["birthday"] = document.createElement("div");
    // sportsElements["SigningCost"] = document.createElement("span");
    // sportsElements["nationality"] = document.createElement("span");
    // sportsElements["weight"] = document.createElement("span");
    // sportsElements["height"] = document.createElement("span");

    for (const [key, value] of Object.entries(playerObj)) {
        
        // let itemP = document.createElement("p");
        // let itemH1 = document.createElement("h1");
        if(sport == 'Esport'){
            if(key == 'image_url'){
                esportsImg.src = value;
                esportsImg.style = "width: 100%;height:200px;object-fit:scale-down;";
                // overlay.insertBefore(itemImg, overlay.firstChild)
            }else if(key == 'first_name'){
                esportsFullName.innerText = value + " " + playerObj["last_name"];
                esportsFullName.className = "title";
                esportsFullName.style = "color:white;" + textShadow;
            }else if(key == 'last_name'){
                
            }else if(key == 'age'){
                // esportsAge.innerText = value;
                // esportsAge.className = "title";
                // esportsAge.style.color = "white";

                let ageInfoP = document.createElement("p")
                ageInfoP.innerText = "Age";
                ageInfoP.style = "color:white;" + textShadow;
                esportsAge.appendChild(ageInfoP);
                let ageP = document.createElement("p")
                ageP.innerText = value;
                ageP.style = "color:white;" + textShadow;
                esportsAge.appendChild(ageP);
            }else if(key == 'birthday'){
                let birthdayInfoP = document.createElement("p")
                birthdayInfoP.innerText = "Birthday";
                birthdayInfoP.style = "color:white;" + textShadow;
                esportsBirth.appendChild(birthdayInfoP);
                let birthdayP = document.createElement("p")
                birthdayP.innerText = value;
                birthdayP.style = "color:white;" + textShadow;
                esportsBirth.appendChild(birthdayP);
                
            }else if(key == 'hometown'){
                let homeInfoP = document.createElement("p")
                homeInfoP.innerText = "Home Town";
                homeInfoP.style = "color:white;" + textShadow;
                esportsHome.appendChild(homeInfoP);
                let homeP = document.createElement("p")
                homeP.innerText = value;
                homeP.style = "color:white;" + textShadow;
                esportsHome.appendChild(homeP);
            }
        }else{
            if(key == 'name'){
                // Split name
                let firstName = value.substring(0, value.indexOf(' '));
                let lastName = value.substring(value.indexOf(' ') + 1);
                sportsElements.name = setElement(sportsElements.name, firstName + " " + lastName)
                // let firstNameP = document.createElement("h1");
                // firstNameP = setElement(firstNameP, firstName)
                // sportsElements.name.appendChild(firstNameP);
                // let lastNameP = document.createElement("h1");
                // lastNameP = setElement(lastNameP, lastName)
                // sportsElements.name.appendChild(lastNameP);
                // sportsElements.name.className = "title";
                
            }else if(key == 'nationality'){
                // let nationalityInfoP = document.createElement("p");
                // nationalityInfoP = setElement(nationalityInfoP, 'Nationality')
                // sportsElements.nationality.appendChild(nationalityInfoP);
                // let nationalityP = document.createElement("p");
                // nationalityP = setElement(nationalityP, value)
                // sportsElements.nationality.appendChild(nationalityP);
                sportsElements.nationality = setElement(sportsElements.nationality, value)

            }else if(key == 'birthDate'){
                // let birthdayInfoP = document.createElement("p");
                // birthdayInfoP = setElement(birthdayInfoP, 'Birthday')
                // sportsElements.birthday.appendChild(birthdayInfoP);
                // let birthdayP = document.createElement("p");
                // birthdayP = setElement(birthdayP, value)
                // sportsElements.birthday.appendChild(birthdayP);

                sportsElements.birthday = setElement(sportsElements.birthday, value)
            }else if(key == 'signingCost'){
                // let costInfoP = document.createElement("p");
                // costInfoP = setElement(costInfoP, 'Signing Cost')
                // sportsElements.SigningCost.appendChild(costInfoP);
                // let costP = document.createElement("p");
                // costP = setElement(costP, value)
                // sportsElements.SigningCost.appendChild(costP);
                let newValue = "";
                if(value.includes(",")){
                    newValue = value.replace(/(^\d+\,\d+)(.+$)/i,'$1')

                }else if (!hasNumber(value))
                    newValue = "";
                else{
                    newValue = value.replace(/(^\d+)(.+$)/i,'$1')
                }
                sportsElements.SigningCost = setElement(sportsElements.SigningCost, newValue)


            }else if(key == 'gender'){
                sportsElements.gender = setElement(sportsElements.gender, value)
            }else if(key == 'position'){
                sportsElements.position = setElement(sportsElements.position, value)
                sportsElements.position.className = "title";
            }else if(key == 'height'){
                // let heightInfoP = document.createElement("p");
                // heightInfoP = setElement(heightInfoP, 'Height')
                // sportsElements.height.appendChild(heightInfoP);
                // let heightP = document.createElement("p");
                // heightP = setElement(heightP, value)
                // sportsElements.height.appendChild(heightP);
                // sportsElements.height.style = "display: flex;flex-direction: row;";
                let newValue = "";
                if(value.includes("m")){
                   if(value.includes(".")){
                    let tempValue = value.match(/(\d+)(?=\s*m)/i,'$1')[0];
                    let index = value.indexOf(tempValue)

                    newValue = value.substring(index - 2, index + tempValue.length)

                }else{
                    newValue = value.match(/(\d+)(?=\s*m)/i,'$1')[0];
                } 
                }else{
                    newValue = value;
                }
                
                sportsElements.height = setElement(sportsElements.height, newValue)

            }else if(key == 'weight'){
                // let weightInfoP = document.createElement("p");
                // weightInfoP = setElement(weightInfoP, 'Weight')
                // sportsElements.weight.appendChild(weightInfoP);
                // let weightP = document.createElement("p");
                // weightP = setElement(weightP, value)
                // sportsElements.weight.appendChild(weightP);
                // sportsElements.weight.style = "display: flex;flex-direction: row;";
                if(value.includes(".")){
                    newValue = value.replace(/(^\d+\.\d+)(.+$)/i,'$1')

                }else{
                    newValue = value.replace(/(^\d+)(.+$)/i,'$1')
                }
                sportsElements.weight = setElement(sportsElements.weight, newValue)

            }else if(key == 'cutout'){
                sportsElements.img.src = value;
                sportsElements.img.style = "width: 100%;height:200px;object-fit:scale-down;";
            }
            
            // else{
            //     let itemP = document.createElement("p");
            //     itemP.innerText = key + ": " + value;
            //     itemP.style.color = "white";
            //     overlay.appendChild(itemP);
            // }
                
        }
        if(key == 'name'){
            name.innerText = value;
            name.style = "color:white;" + textShadow;

            // overlay.insertBefore(itemH1, overlay.children[1]);
        }
        
    }
    if(sport == 'Esport'){
        overlay.appendChild(esportsImg);
        overlay.appendChild(name);
        overlay.appendChild(esportsFullName);
        // overlay.appendChild(esportsAge);
        let infoDiv = document.createElement("div")
        infoDiv.style= "display:flex;flex-direction: row;justify-content: space-evenly;"
        infoDiv.appendChild(esportsBirth);
        infoDiv.appendChild(esportsAge);
        infoDiv.appendChild(esportsHome);
        overlay.appendChild(infoDiv)
    }else{
        // let leftInfoDiv = document.createElement("div");
        // let centerInfoDiv = document.createElement("div");
        // centerInfoDiv.style = "display: flex;flex-direction: row;align-items: flex-start;"
        // overlay.appendChild(sportsElements.img);
        // leftInfoDiv.appendChild(sportsElements.name);
        // leftInfoDiv.appendChild(sportsElements.gender);
        // centerInfoDiv.appendChild(leftInfoDiv);

        // let rightInfoDiv = document.createElement("div")
        // rightInfoDiv.appendChild(sportsElements.weight);
        // rightInfoDiv.appendChild(sportsElements.height);
        // rightInfoDiv.style = "display: flex;flex-direction: column;";
        // centerInfoDiv.appendChild(rightInfoDiv);
        // centerInfoDiv.appendChild(leftInfoDiv);
        // centerInfoDiv.appendChild(rightInfoDiv);
        // overlay.appendChild(centerInfoDiv);
        // let bottomInfoDiv = document.createElement("div")
        // bottomInfoDiv.style= "display:flex;flex-direction: row;justify-content: space-evenly;"
        // bottomInfoDiv.appendChild(sportsElements.birthday);
        // bottomInfoDiv.appendChild(sportsElements.SigningCost);
        // bottomInfoDiv.appendChild(sportsElements.nationality);
        // overlay.appendChild(bottomInfoDiv);
        let topPlayerDiv = document.createElement("div");
        let divPlayerImg = document.createElement("div");
        topPlayerDiv.className = "player-card-top";
        divPlayerImg.className = "player-img";
        let playerMasterInfoDiv = document.createElement("div");
        playerMasterInfoDiv.className = "player-master-info";
        let nationalitySpan = document.createElement("span");
        nationalitySpan.innerText = sportsElements.nationality.innerText;
        playerMasterInfoDiv.appendChild(nationalitySpan)
        divPlayerImg.appendChild(sportsElements.img)
        topPlayerDiv.appendChild(divPlayerImg);
        topPlayerDiv.appendChild(playerMasterInfoDiv);

        let bottomPlayerDiv = document.createElement("div");
        bottomPlayerDiv.className = "player-card-bottom"
        let playerInfoDiv = document.createElement("div");
        playerInfoDiv.className = "player-info";
        let playerNameDiv = document.createElement("div");
        playerNameDiv.className = "player-name";
        // let playerNameSpan = document.createElement("span");
        // playerNameSpan.innerText = sportsElements.name;
        sportsElements.name.style = "display: block; text-shadow: 2px 2px #111;"

        let playerBottomInfoDiv = document.createElement("div");
        playerBottomInfoDiv.className = "player-features";

        let playerFeaturesColDivLeft = document.createElement("div");
        playerFeaturesColDivLeft.className = "player-features-col";
        let playerFeaturesColDivRight = document.createElement("div");
        playerFeaturesColDivRight.className = "player-features-col";

        let weigthFeatureSpan = document.createElement("span");
        weigthFeatureSpan.style = "display: flex;font-size: 1rem;text-transform: uppercase;";
        weigthFeatureSpan.appendChild(sportsElements.weight)
        let weightLabelDiv = document.createElement("div");
        weightLabelDiv.innerText = "KG";
        weightLabelDiv.className = "player-feature-title";
        sportsElements.weight.className = "player-feature-value"
        weigthFeatureSpan.appendChild(sportsElements.weight)
        weigthFeatureSpan.appendChild(weightLabelDiv)

        let heightFeatureSpan = document.createElement("span");
        heightFeatureSpan.style = "display: flex;font-size: 1rem;text-transform: uppercase;";
        heightFeatureSpan.appendChild(sportsElements.height)
        let heightLabelDiv = document.createElement("div");
        heightLabelDiv.innerText = "M";
        heightLabelDiv.className = "player-feature-title";
        sportsElements.height.className = "player-feature-value"
        heightFeatureSpan.appendChild(sportsElements.height)
        heightFeatureSpan.appendChild(heightLabelDiv)

        let costFeatureSpan = document.createElement("span");
        costFeatureSpan.style = "display: flex;font-size: 1rem;text-transform: uppercase;";
        costFeatureSpan.appendChild(sportsElements.SigningCost)
        let costLabelDiv = document.createElement("div");
        costLabelDiv.innerText = "Mil";
        costLabelDiv.className = "player-feature-title";
        sportsElements.SigningCost.className = "player-feature-value"
        costFeatureSpan.appendChild(sportsElements.SigningCost)
        costFeatureSpan.appendChild(costLabelDiv)

        let birthdayFeatureSpan = document.createElement("span");
        birthdayFeatureSpan.style = "display: flex;font-size: 1rem;text-transform: uppercase;";
        birthdayFeatureSpan.appendChild(sportsElements.birthday)
        // let birthdayLabelDiv = document.createElement("div");
        // birthdayLabelDiv.innerText = "Birth";
        // birthdayLabelDiv.className = "player-feature-title";
        sportsElements.birthday.className = "player-feature-value"
        birthdayFeatureSpan.appendChild(sportsElements.birthday)
        // birthdayFeatureSpan.appendChild(birthdayLabelDiv)


        playerFeaturesColDivLeft.appendChild(weigthFeatureSpan);
        playerFeaturesColDivLeft.appendChild(heightFeatureSpan);

        playerFeaturesColDivRight.appendChild(costFeatureSpan);
        playerFeaturesColDivRight.appendChild(birthdayFeatureSpan);

        playerBottomInfoDiv.appendChild(playerFeaturesColDivLeft);
        playerBottomInfoDiv.appendChild(playerFeaturesColDivRight);

        playerNameDiv.appendChild(sportsElements.name)

        playerInfoDiv.appendChild(playerNameDiv);
        playerInfoDiv.appendChild(playerBottomInfoDiv)
        bottomPlayerDiv.appendChild(playerInfoDiv);
        // bottomPlayerDiv.appendChild(playerBottomInfoDiv)

        overlay.appendChild(topPlayerDiv);
        overlay.appendChild(bottomPlayerDiv);


        // Weight   Signing Cost 
        // Height   Birthday

        
        // overlay.appendChild(sportsElements.img);
    }
    return overlay;
}

const setElement = (element, textValue) => {
    if(textValue == "" || !textValue || textValue == 0 || textValue == "0"){
        textValue = "N/A";
    }
    element.innerText = textValue;
    // element.style = "color:white;" + textShadow;
    return element;
}

function hasNumber(myString) {
    return /\d/.test(myString);
  }