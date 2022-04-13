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
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.5);"
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
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.5);max-width:30%;overflow: hidden;max-height:30%;"
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

    socket.on('show_player_info_client', (playerObj, duration)=>{
        console.log("IN HERE")
        console.log(playerObj)
        let container = document.getElementById("container");
        let overlay = document.createElement("div");
        overlay.style = "position:absolute;top:5%;right:10px;z-index:1;display:flex;background: rgba(0, 0, 0, 0.5);flex-direction: column;"
        for (const [key, value] of Object.entries(playerObj)) {
            let itemP = document.createElement("p");
            itemP.innerText = key + ": " + value;
            itemP.style.color = "white";
            overlay.appendChild(itemP);
        }
        container.appendChild(overlay);
        setTimeout(
        function(){
            overlay.remove();
        }, duration);
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