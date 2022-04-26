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
    socket.on('connect', () => {
        if(!localStorage.getItem("room_id") || localStorage.getItem("room_id") == undefined){
            document.getElementById("room_div").style.display = "block";
        }else{
            console.log(socket.id)
            console.log(localStorage.getItem("room_id"))
            socket.emit("room_join", localStorage.getItem("room_id"));
        }
    })
    socket.on('show_sport_info_client', (info, type, duration, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = overlayStyle + setLocation(location) + "max-height:40%;max-width: 400px";
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

    socket.on('show_sport_info_hold_client', (info, type, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.id = "overlay-div"
        // let locationString = setLocation(location)
        // console.log( );
        overlay.style = overlayStyle + setLocation(location) + "max-height:40%;max-width: 500px";
        let infoP; 
        if(type == 'icon'){
            infoP = document.createElement("img");
            infoP.src = info;
            infoP.style = "width: 100%;height:200px;object-fit:scale-down;";
        }else{
            infoP = document.createElement("p");
            infoP.style = "color: white;" + textShadow;
            infoP = setElement(infoP, type + ": "+ info)
        }
        overlay.appendChild(infoP)
        container.appendChild(overlay);
        setTimeout(
            function(){
                scrollSmoothlyToBottom("overlay-div");
            }, 2000); //duration
    })

    socket.on('stop_show_sport_info_hold_client', ()=>{
       document.getElementById("overlay-div").remove();
    })

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
        }, 1000000); //duration
    })

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
        event.returnValue = null;
      });
});

const show_player_info = (overlay, playerObj, sport) => {
    let esportsElements = {};
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

    for (const [key, value] of Object.entries(playerObj)) {
        if(sport == 'Esport'){
            if(key == 'image_url'){
                esportsElements["img"] = document.createElement("img");
                esportsElements["img"].src = value;
                // esportsImg.src = value;
                esportsElements["img"].style = "width: 100%;height:200px;object-fit:scale-down;";
            }else if(key == 'first_name'){
                let tempVal = value + " " + playerObj["last_name"];
                esportsElements["fullName"] = document.createElement("span");
                esportsElements["fullName"] = setElement(esportsElements["fullName"], tempVal);                
            }else if(key == 'age'){
                esportsElements["age"] = document.createElement("div");
                esportsElements["age"] = setElement(esportsElements["age"], value);
            }else if(key == 'birthday'){
                esportsElements["birthday"] = document.createElement("div");
                esportsElements["birthday"] = setElement(esportsElements["birthday"], value);   
            }else if(key == 'hometown'){
                esportsElements["hometown"] = document.createElement("div");
                esportsElements["hometown"] = setElement(esportsElements["hometown"], value);
            }else if(key == 'name'){
                esportsElements["name"] = document.createElement("div");
                esportsElements["name"] = setElement(esportsElements["name"], value);   
            }
        }else{
            if(key == 'name'){
                // Split name
                let firstName = value.substring(0, value.indexOf(' '));
                let lastName = value.substring(value.indexOf(' ') + 1);
                sportsElements.name = setElement(sportsElements.name, firstName + " " + lastName)                
            }else if(key == 'nationality'){
                sportsElements.nationality = setElement(sportsElements.nationality, value)

            }else if(key == 'birthDate'){
                let age = getAge(value);
                sportsElements.birthday = setElement(sportsElements.birthday, age)
                sportsElements.birthdayLabel = "yrs";
            }else if(key == 'signingCost'){
                let newValue = "";
                if(value.includes(",")){
                    let index = value.indexOf(",")
                    newValue = value.substring(0, index)
                }else if (!hasNumber(value)){
                    newValue = "";
                }else if(value.includes(".")){
                    let index = value.indexOf(".")
                    newValue = value.substring(0, index)
                }
                else{
                    newValue = value.replace(/(^\d+)(.+$)/i,'$1')
                }
                newValue = newValue.replace(/[^0-9.]/g, '');
                newValue = "£" + newValue;
                sportsElements.SigningCost = setElement(sportsElements.SigningCost, newValue)
            }else if(key == 'gender'){
                sportsElements.gender = setElement(sportsElements.gender, value)
            }else if(key == 'position'){
                sportsElements.position = setElement(sportsElements.position, value)
                sportsElements.position.className = "title";
            }else if(key == 'height'){
                let newValue = "";
                if(value.includes("cm")){
                    newValue = value.match(/(\d+)(?=\s*cm)/i,'$1')[0];
                    sportsElements["heightLabel"] = "cm";
                }else if(value.includes("m")){
                    if(value.includes(".")){
                     let tempValue = value.match(/(\d+)(?=\s*m)/i,'$1')[0];
                     let index = value.indexOf(tempValue)
 
                     newValue = value.substring(index - 2, index + tempValue.length)
 
                     }else{
                         newValue = value.match(/(\d+)(?=\s*m)/i,'$1')[0];
                     }
                     sportsElements["heightLabel"] = "m"; 
                }else{
                    newValue = value;
                    sportsElements["heightLabel"] = "m";
                }
                
                sportsElements.height = setElement(sportsElements.height, newValue)

            }else if(key == 'weight'){
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
                
        }        
    }
    if(sport == 'Esport'){
        let topPlayerDiv = document.createElement("div");
        let divPlayerImg = document.createElement("div");
        topPlayerDiv.className = "player-card-top";
        divPlayerImg.className = "player-img";
        let playerMasterInfoDiv = document.createElement("div");
        playerMasterInfoDiv.className = "player-master-info";
        let nationalitySpan = document.createElement("span");
        nationalitySpan.innerText = esportsElements.hometown.innerText;
        playerMasterInfoDiv.appendChild(nationalitySpan);
        divPlayerImg.appendChild(esportsElements.img);
        topPlayerDiv.appendChild(divPlayerImg);
        topPlayerDiv.appendChild(playerMasterInfoDiv);

        let bottomPlayerDiv = document.createElement("div");
        bottomPlayerDiv.className = "player-card-bottom"
        let playerInfoDiv = document.createElement("div");
        playerInfoDiv.className = "player-info";
        let playerNameDiv = document.createElement("div");
        playerNameDiv.className = "player-name";
        esportsElements.name.style = "display: block; text-shadow: 2px 2px #111;";

        let playerFullNameDiv = document.createElement("div");
        playerFullNameDiv.className = "player-fullname";
        esportsElements.fullName.style = "display: block; text-shadow: 2px 2px #111;";
        let playerBottomInfoDiv = document.createElement("div");
        playerBottomInfoDiv.className = "player-features";
        let playerFeaturesColDivLeft = document.createElement("div");
        playerFeaturesColDivLeft.className = "player-features-col";
        let playerFeaturesColDivRight = document.createElement("div");
        playerFeaturesColDivRight.className = "player-features-col";

        let birthdayFeatureSpan = setPlayerFeatureSpan(esportsElements.birthday, "");
        let ageFeatureSpan = setPlayerFeatureSpan(esportsElements.age, "");
        playerFeaturesColDivLeft.appendChild(ageFeatureSpan);
        playerFeaturesColDivRight.appendChild(birthdayFeatureSpan);
        playerBottomInfoDiv.appendChild(playerFeaturesColDivLeft);
        playerBottomInfoDiv.appendChild(playerFeaturesColDivRight);
        playerNameDiv.appendChild(esportsElements.name);
        playerFullNameDiv.appendChild(esportsElements.fullName);

        playerInfoDiv.appendChild(playerNameDiv);
        playerInfoDiv.appendChild(playerFullNameDiv);
        playerInfoDiv.appendChild(playerBottomInfoDiv);
        bottomPlayerDiv.appendChild(playerInfoDiv);
        overlay.appendChild(topPlayerDiv);
        overlay.appendChild(bottomPlayerDiv);
    }else{
        let topPlayerDiv = document.createElement("div");
        let divPlayerImg = document.createElement("div");
        topPlayerDiv.className = "player-card-top";
        divPlayerImg.className = "player-img";
        let playerMasterInfoDiv = document.createElement("div");
        playerMasterInfoDiv.className = "player-master-info";
        let nationalitySpan = document.createElement("span");
        nationalitySpan.innerText = sportsElements.nationality.innerText;
        playerMasterInfoDiv.appendChild(nationalitySpan);
        divPlayerImg.appendChild(sportsElements.img);
        topPlayerDiv.appendChild(divPlayerImg);
        topPlayerDiv.appendChild(playerMasterInfoDiv);

        let bottomPlayerDiv = document.createElement("div");
        bottomPlayerDiv.className = "player-card-bottom"
        let playerInfoDiv = document.createElement("div");
        playerInfoDiv.className = "player-info";
        let playerNameDiv = document.createElement("div");
        playerNameDiv.className = "player-name";
        sportsElements.name.style = "display: block; text-shadow: 2px 2px #111;";
        let playerBottomInfoDiv = document.createElement("div");
        playerBottomInfoDiv.className = "player-features";
        let playerFeaturesColDivLeft = document.createElement("div");
        playerFeaturesColDivLeft.className = "player-features-col";
        let playerFeaturesColDivRight = document.createElement("div");
        playerFeaturesColDivRight.className = "player-features-col";

        let weigthFeatureSpan = setPlayerFeatureSpan(sportsElements.weight, "KG");
        let heightFeatureSpan = setPlayerFeatureSpan(sportsElements.height, sportsElements.heightLabel);
        let costFeatureSpan = setPlayerFeatureSpan(sportsElements.SigningCost, "M");
        let birthdayFeatureSpan = setPlayerFeatureSpan(sportsElements.birthday, sportsElements.birthdayLabel);

        playerFeaturesColDivLeft.appendChild(weigthFeatureSpan);
        playerFeaturesColDivLeft.appendChild(heightFeatureSpan);
        playerFeaturesColDivRight.appendChild(costFeatureSpan);
        playerFeaturesColDivRight.appendChild(birthdayFeatureSpan);
        playerBottomInfoDiv.appendChild(playerFeaturesColDivLeft);
        playerBottomInfoDiv.appendChild(playerFeaturesColDivRight);
        playerNameDiv.appendChild(sportsElements.name);
        playerInfoDiv.appendChild(playerNameDiv);
        playerInfoDiv.appendChild(playerBottomInfoDiv);
        bottomPlayerDiv.appendChild(playerInfoDiv);
        overlay.appendChild(topPlayerDiv);
        overlay.appendChild(bottomPlayerDiv);
    }
    return overlay;
}

const setPlayerFeatureSpan = ( valueElement, labelText) => {
    let playerFeatureSpanElement = document.createElement("span");
    playerFeatureSpanElement.style = "display: flex;font-size: 1rem;text-transform: uppercase;";
    playerFeatureSpanElement.appendChild(valueElement)
    let playerLabelDiv = document.createElement("div");
    playerLabelDiv.innerText = labelText;
    playerLabelDiv.className = "player-feature-title";
    valueElement.className = "player-feature-value"
    playerFeatureSpanElement.appendChild(valueElement)
    playerFeatureSpanElement.appendChild(playerLabelDiv)
    return playerFeatureSpanElement;
}

const setElement = (element, textValue) => {
    if(textValue == "" || !textValue || textValue == 0 || textValue == "0" || textValue == "£"){
        textValue = "N/A";
    }
    element.innerText = textValue;
    return element;
}

function hasNumber(myString) {
    return /\d/.test(myString);
}

const scrollSmoothlyToBottom = (ElementId) => {
    const element = $(`#${ElementId}`);
    element.animate({
        scrollTop: element.prop("scrollHeight")
    }, 50000);
}

const getAge = (dateString)  => {
    let today = new Date();
    let birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    let month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}