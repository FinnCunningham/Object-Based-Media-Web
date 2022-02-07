let express = require('express');
let app = express();
let path = require('path');
// const fs = require("fs");
const cors = require("cors");
// set the view engine to ejs`
// app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '../web-client/build')));

app.use(cors());
// index page
// app.get('/', function(req, res) {
//   res.render('pages/home');
// });

// app.get("/video", function (req, res) {
//     // Ensure there is a range given for the video
//     const range = req.headers.range;
//     if (!range) {
//       res.status(400).send("Requires Range header");
//     }
  
//     // get video stats (about 61MB)
//     const videoPath = "public/assets/videos/Manchester United vs Tottenham Hotspur.mp4";
//     const videoSize = fs.statSync(videoPath).size;
  
//     // Parse Range
//     // Example: "bytes=32324-"
//     const CHUNK_SIZE = 10 ** 6; // 1MB
//     const start = Number(range.replace(/\D/g, ""));
//     const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
  
//     // Create headers
//     const contentLength = end - start + 1;
//     const headers = {
//       "Content-Range": `bytes ${start}-${end}/${videoSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Length": contentLength,
//       "Content-Type": "video/mp4",
//     };
  
//     // HTTP Status 206 for Partial Content
//     res.writeHead(206, headers);
  
//     // create video read stream for this particular chunk
//     const videoStream = fs.createReadStream(videoPath, { start, end });
  
//     // Stream the video chunk to the client
//     videoStream.pipe(res);
//   });

app.get("/api", (req, res) => {
  res.json({message: "Yo Yo Yo"});
});

app.get("/data", (req, res) => {
  // fetch("https://www.premierleague.com/players/4999/Son-Heung-Min/stats")
  // .then((response) => response.text())
  // .then((data) => res.send(data));
  res.json({message: "Yo Yo Yo"});

});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../web-client/build', 'index.html'));
});
app.listen(3001);
