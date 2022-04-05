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

    // socket.on('video_selected', (callback)=>{
    //     console.log("HIT")
    //     if(filePath){
    //         callback(true);
    //     }else{
    //         callback(false);
    //     }
        
    // });

    // socket.on('set_video_video_client', (file)=>{
    //     filePath = file + "/" + file;
    // });

    socket.on('start_video_video_client', (path) => {
        console.log("STARTING VIDEO...")
        let videoBaseUrl = '/assets/videos/';
        let filePath = path + "/" + path;
        $('#tv-content').html("<video id='videoClip' class='video_player' width='90%' height='90%'><source src='" + videoBaseUrl + filePath + ".mp4' type='video/mp4'></video>");    
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