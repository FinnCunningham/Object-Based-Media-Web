$(function () {
    var socket = io();
    socket.on('start_video', (msg) => {
        console.log("STARTING VIDEO...")
        $('#tv-content').html("<video id='videoClip'><source src='/assets/videos/FINAL Highlights 2021 US Open Pool Championship.mp4' type='video/mp4'></video>");    
        document.getElementById("videoClip").load();
    })
    
    socket.on('play', function(msg){
        console.log("Start Clip");
    });



});