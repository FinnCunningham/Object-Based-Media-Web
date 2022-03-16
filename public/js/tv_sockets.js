$(function () {
    // var socket = io.connect('https://s5117817.bucomputing.uk', { path: '/node/socket.io/'});
    socket.on('start_video', (msg) => {
        console.log("BACK" + socket.id)
        console.log("STARTING VIDEO...")
        $('#tv-content').html("<video id='videoClip' class='video_player' width='90%' height='90%'><source src='/assets/videos/FINAL Highlights 2021 US Open Pool Championship.mp4' type='video/mp4'></video>");    
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


});