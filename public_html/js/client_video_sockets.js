let textShadow = "text-shadow:0.05em 0 black,0 0.05em black,-0.05em 0 black,0 -0.05em black,-0.05em -0.05em black,-0.05em 0.05em black,0.05em -0.05em black,0.05em 0.05em black;"
/**
 * Changes string location to location in css
 * @param {String} locationPoint - where the location is set (Top Right, Top Left, etc) 
 * @returns {String} - string location -> css location
 */
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
/**
 * On load function
 */
$(function () {
    /**
     * On communication connect function
     */
    socket.on('connect', () => {
        if(!localStorage.getItem("room_id") || localStorage.getItem("room_id") == undefined){
            document.getElementById("room_div").style.display = "block";
        }else{
            console.log(socket.id)
            console.log(localStorage.getItem("room_id"))
            socket.emit("room_join", localStorage.getItem("room_id"));
        }
    })
  /**
   * Communication event listener which shows the sport info
   * @param {String} info - Info that will be displayed
   * @param {String} type - Type of info that will be displayed
   * @param {String} duration - Length of time that the info will be displayed
   * @param {String} location - Name of location where the info will be shown 
   * @returns {void} - Nothing is returned from this method 
   */
    socket.on('show_sport_info_client', (info, type, duration, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = overlayStyle + setLocation(location) + "max-height:40%;max-width: 400px;background:rgba(0, 0, 0, 0.5);";
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

    /**
     * Communication event listener which shows the sport info while the user holds the button
     * @param {String} info - Info that will be displayed
     * @param {String} type - Type of info that will be displayed
     * @param {String} location - Name of location where the info will be shown 
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('show_sport_info_hold_client', (info, type, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.id = "overlay-div"
        overlay.style = overlayStyle + setLocation(location) + "max-height:40%;max-width: 500px;background:rgba(0, 0, 0, 0.5);";
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
    /**
     * Communication event listener which destroys the information being shown when the user lets go
     */
    socket.on('stop_show_sport_info_hold_client', ()=>{
       document.getElementById("overlay-div").remove();
    })

    /**
     * Communication event listener which shows the player info
     * @param {String} playerObj - Object that contains the players information
     * @param {String} duration - Length of time that the info will be displayed
     * @param {String} sport - Name of sport of the information being displayed 
     * @param {String} location - Name of location where the info will be shown 
     * @returns {void} - Nothing is returned from this method 
     */
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
        }, duration); //duration
    })

    /**
     * Communication event listener which shows the player info while the user holds the button
     * @param {Object} playerObj - Object that contains the players information
     * @param {String} sport - Name of sport of the information being displayed 
     * @param {String} location - Name of location where the info will be shown 
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('show_player_info_hold_client', (playerObj, sport, location)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.className = "player-card";

        overlay.id = "overlay-div"
        overlay.style = overlayStyle + setLocation(location);
        overlay = show_player_info(overlay, playerObj, sport)
        container.appendChild(overlay);
    })

    /**
     * Communication event listener which destroys the information being shown when the user lets go
     */
    socket.on('stop_show_player_info_hold_client', ()=>{
        document.getElementById("overlay-div").remove();
    })

    /**
     * Communication event listener which creates a video element and sets it to the video chosen by the room (Done by the user changing the video)
     * @param {String} path - Path of the video that is being set up
     * @returns {void} - Nothing is returned from this method 
     */
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

    /**
     * Communication event listener which creates a video element and sets it to the video chosen by the room (Done by the user starting the video)
     * @param {String} path - Path of the video that is being set up
     * @returns {void} - Nothing is returned from this method 
     */
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
    /**
     * Communication event listener which plays the video
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('play_video', function(){
        console.log("BACK" + socket.id)
        console.log("Start Clip");
        document.getElementById("videoClip").play();
    });

    /**
     * Communication event listener which pauses the video
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('pause_video', () => {
        document.getElementById("videoClip").pause();
    })


    /**
     * Communication event listener which changes the volume the video
     * @param {String} - value that the volume is being changed to
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('change_volume_client', (value)=>{
        if(document.getElementById('videoClip')){
            document.getElementById('videoClip').volume = value;
        }
    })

    /**
     * Communication event listener which changes the fullscreen state of the video
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('change_fullscreen_client', ()=>{
        console.log("yo")
        fullscreen();
    })

    /**
     * Communication event listener which skips to the start of the video
     * @param {String} time - data set in the local storage of the start of the video
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('skip_to_start_client', (time)=>{
        document.getElementById("videoClip").currentTime = time;
    })

    /**
     * Communication event listener which returns that the room is unavailable
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('room_unavailable', () => {
        console.log("unavailable");
        console.log("Create a different room, Room already created");
        document.getElementById("room_div").style.display = "Block";
        localStorage.removeItem("room_id");
    })

    /**
     * Communication event listener which sets the user to a room joined state
     * @returns {void} - Nothing is returned from this method 
     */
    socket.on('room_joined', (room) => {
        console.log(room);
        document.getElementById("room_div").style.display = "None";
        localStorage.setItem('room_id', room);
        document.getElementById("room_id_p").innerText = room;
    })

    /**
     * Browser event listener that runs before the user refreshes to make sure that the socket is disconnected properly 
     * @returns {void} - Nothing is returned from this method 
     */
    window.addEventListener("beforeunload", function(event) {
        socket.disconnect();
        event.returnValue = null;
      });
});

/**
 * Sets what data is displayed for the players information
 * @param {String} overlay - overlay element
 * @param {Object} playerObj - Object containing information on the player
 * @param {String} sport - Type of sport the information is from
 * @returns {Element} - Overlay element is returned 
 */
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

/**
 * Helper function that sets the players information within the feature span
 * @param {Element} valueElement - The element that contains the value
 * @param {String} labelText - Text about the type of information
 * @returns {void} - Nothing is returned from this method 
 */
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

/**
 * Helper function that sets the elements value with validation
 * @param {Element} element - The element that is going to be changed
 * @param {String} textValue - Value the element is being changed to
 * @returns {Element} - Returns the new element 
 */
const setElement = (element, textValue) => {
    if(textValue == "" || !textValue || textValue == 0 || textValue == "0" || textValue == "£"){
        textValue = "N/A";
    }
    element.innerText = textValue;
    return element;
}
/**
 * Helper function that checks if string contains a number
 * @param {String} myString - String that will be checked
 * @returns {Boolean} - True/False if contains number 
 */
function hasNumber(myString) {
    return /\d/.test(myString);
}

/**
 * Function that slowly scrolls the element to the bottom (sport description)
 * @param {String} ElementId - ID of the element being scrolled
 * @returns {void} - Nothing is returned from this method 
 */
const scrollSmoothlyToBottom = (ElementId) => {
    const element = $(`#${ElementId}`);
    element.animate({
        scrollTop: element.prop("scrollHeight")
    }, 50000);
}

/**
 * Helper function that gets the age of someone from their birthdate
 * @param {String} dateString - Date of birth 
 * @returns {String} - Age is returned 
 */
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