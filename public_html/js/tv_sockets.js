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

    socket.on('show_players_client', (players, duration) => {
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.3);"
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

    socket.on('show_sport_info_client', (info, type, duration)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.3);max-width:30%;overflow: hidden;max-height:30%;"
        let infoP = document.createElement("p");
        infoP.innerText = type + ": " + info;
        infoP.style.color = "white";
        overlay.appendChild(infoP)
        container.appendChild(overlay);
        setTimeout(
        function(){
            overlay.remove();
        }, duration);
    })

    socket.on('show_sport_info_hold_client', (info, type, duration)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.id = "overlay-div"
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.3);max-width:30%;overflow: hidden;max-height:30%;"
        let infoP = document.createElement("p");
        infoP.innerText = type + ": " + info;
        infoP.style.color = "white";
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

    socket.on('show_player_info_client', (playerObj, duration, sport)=>{
        console.log("IN HERE")
        console.log(playerObj)
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.3);flex-direction: column;"
        overlay = show_player_info(overlay, playerObj, sport)
        container.appendChild(overlay);
        setTimeout(
        function(){
            overlay.remove();
        }, duration); //duration
    })

    socket.on('show_player_info_hold_client', (playerObj, sport)=>{
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.id = "overlay-div"
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.3);flex-direction: column;"
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
        $('#tv-content').html("<video id='videoClip' class='video_player' width='100%'><source src='" + videoBaseUrl + filePath + ".mp4' type='video/mp4'></video>");    
        document.getElementById("videoClip").load();
    })

    socket.on('start_video_video_client', (path) => {
        console.log("STARTING VIDEO...")
        let videoBaseUrl = '/assets/videos/';
        let filePath = path + "/" + path;
        $('#tv-content').html("<video id='videoClip' class='video_player' width='100%'><source src='" + videoBaseUrl + filePath + ".mp4' type='video/mp4'></video>");    
        document.getElementById("videoClip").load();
    })
    
    socket.on('play_video', function(msg){
        console.log("BACK" + socket.id)
        console.log("Start Clip");
        document.getElementById("videoClip").play();
    });

    socket.on('pause_video', () => {
        document.getElementById("videoClip").pause();
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
                esportsFullName.style.color = "white";
            }else if(key == 'last_name'){
                
            }else if(key == 'age'){
                // esportsAge.innerText = value;
                // esportsAge.className = "title";
                // esportsAge.style.color = "white";

                let ageInfoP = document.createElement("p")
                ageInfoP.innerText = "Age";
                ageInfoP.style.color = "white";
                esportsAge.appendChild(ageInfoP);
                let ageP = document.createElement("p")
                ageP.innerText = value;
                ageP.style.color = "white";
                esportsAge.appendChild(ageP);
            }else if(key == 'birthday'){
                let birthdayInfoP = document.createElement("p")
                birthdayInfoP.innerText = "Birthday";
                birthdayInfoP.style.color = "white";
                esportsBirth.appendChild(birthdayInfoP);
                let birthdayP = document.createElement("p")
                birthdayP.innerText = value;
                birthdayP.style.color = "white";
                esportsBirth.appendChild(birthdayP);
                
            }else if(key == 'hometown'){
                let homeInfoP = document.createElement("p")
                homeInfoP.innerText = "Home Town";
                homeInfoP.style.color = "white";
                esportsHome.appendChild(homeInfoP);
                let homeP = document.createElement("p")
                homeP.innerText = value;
                homeP.style.color = "white";
                esportsHome.appendChild(homeP);
            }
            // else{
            //     let itemP = document.createElement("p");
            //     itemP.innerText = key + ": " + value;
            //     itemP.style.color = "white";
            //     overlay.appendChild(itemP);
            // }
        }else{
                let itemP = document.createElement("p");
                itemP.innerText = key + ": " + value;
                itemP.style.color = "white";
                overlay.appendChild(itemP);
        }
        if(key == 'name'){
            name.innerText = value;
            name.style.color = "white";
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

    }
    return overlay;
}