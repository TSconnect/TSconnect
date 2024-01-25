function toTimestamp(dateString) {
  return new Date(dateString);
}
const { contextBridge, ipcRenderer } = require("electron");

window.onload = async () => {
  // Discord RPC
  let status = ["You play stupid games, you win stupid prizes", "RIP Me, I Died Dead", "You Could Lose Your Hand, You Could Lose Your Foot. You Could Lose Your Hand Getting It Off Your Foot! I Don’t Like Sea Urchins.","I'm a Doctor now so I know how breathing works", "I hate that stupid old pick-up truck you never let me drive."]

  ipcRenderer.send("sendRPC", `Browsing ${document.title}`, status[Math.floor(Math.random() * status.length)])

  // Setup variables and update static messages
  let days;


  // if the page needs nextTourDate
  // Required for livestreams function
  if (document.getElementById("nextTourDate") != undefined) {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://tsconnect.github.io/contents/TSConnect/TheErasTourDates.json",
      headers: {
        "Content-Type": "application/json",
      },
    };

    let tourdate = await axios.request(config);
    tourdate = tourdate.data;
    console.log(`Requested data: ${JSON.stringify(tourdate)}`);

    let dates = [];
    for (i in tourdate) {
      dates.push(new Date(toTimestamp(tourdate[i].time).getTime() + (8 * 60 * 60 * 1000)));
    }
    let nearest = nearestDate(dates);
    console.log(nearest, tourdate[nearest])
     days = tourdate[nearest]
    let time = toTimestamp(tourdate[nearest]["time"]);
    if(document.getElementById("nextTourDate"))document.getElementById("nextTourDate").innerText =
      `${time.toDateString()} ${time.toLocaleTimeString()}`;
    if(document.getElementById("nextTourDateLocal"))document.getElementById("nextTourDateLocal").innerText =
      `${time.toDateString()} 4:00:00pm`;
    if(document.getElementById("tourLocation"))document.getElementById("tourLocation").innerText =
      `${tourdate[nearest].location}`;
  } 
    
// Get the livestreams for the date
if (document.getElementById("livestreams") != undefined) {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://tsconnect.github.io/contents/TSConnect/livestreams.json",
      headers: {
        "Content-Type": "application/json",
      },
    };
    console.log(days)
    let streams = await axios.request(config);
    streams = streams.data;
    console.log(`Requested data: ${JSON.stringify(streams)}`);
    if(new Date(new Date(days['time']).getTime() + (8 * 60 * 60 * 1000)).getTime() - new Date().getTime() > (18 * 60 * 60 * 1000) || (new Date(days['time']).getTime() + (8 * 60 * 60 * 1000)) < new Date().getTime()){
        
        let tempTimeStart = new Date(new Date(days['time']).getTime() - (10 * 60 * 60 * 1000))
        let tempTimeEnd = new Date(new Date(days['time']).getTime() + (8 * 60 * 60 * 1000))
        document.getElementById("livestreams").innerHTML = `Live streams for the next stop will start appearing here at: ${tempTimeStart.toLocaleDateString()} ${tempTimeStart.toLocaleTimeString()}<br />Live streams for the next stop will disappear at: ${tempTimeEnd.toLocaleDateString()} ${tempTimeEnd.toLocaleTimeString()}`
        return;
    }
    let temp = []
    for (const [key, value] of Object.entries(streams)) {
        temp.push(toTimestamp(key))
    }
    let near = nearestDate(temp)
    console.log(near, temp[near])
    let date = streams[formatDMY(temp[near])];
    if (date == undefined) return;
    document.getElementById("livestreams").innerHTML = "";
    for (i in date) {
      document.getElementById("livestreams").innerHTML +=
        `<a href="#" onclick="openLink('${date[i]["url"]}')">${date[i]["name"]}</a><br />`;
    }
  }
    
    
    //countdown
    
if(document.getElementById("countdown") != undefined){
    // Set the date we're counting down to
var countDownDate = new Date(days['time']).getTime();

// Update the count down every 1 second
var x = setInterval(function() {

  // Get today's date and time
  var now = new Date().getTime();

  // Find the distance between now and the count down date
  var distance = countDownDate - now;

  // Time calculations for days, hours, minutes and seconds
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  // Display the result in the element with id="demo"
  document.getElementById("countdown").innerHTML = days + "d " + hours + "h "
  + minutes + "m " + seconds + "s";

  // If the count down is finished, write some text
  if (distance < 0) {
    clearInterval(x);
    document.getElementById("countdown").innerHTML = "DOORS ARE OPEN";
  }
}, 1000);
}
};

function formatDMY(d) {
  // Default to today
  d = d || new Date();
  return (
    ("0" + (d.getMonth() + 1)).slice(-2) +
    "/" +
    ("0" + d.getDate()).slice(-2) +
    "/" +
    ("000" + d.getFullYear()).slice(-4)
  );
}

function nearestDate(dates, target) {
  if (!target) {
    target = Date.now();
  } else if (target instanceof Date) {
    target = target.getTime();
  }

  let nearest = Infinity;
  let winner = -1;

  dates.forEach(function (date, index) {
    if (date instanceof Date) {
      date = date.getTime();
    }
    let distance = (date - target);
    if (distance < nearest && distance >= 0) {
      nearest = distance;
      winner = index;
    }
  });

  return winner;
}

function openLink(url) {
  if (!url) return;
  require("electron").shell.openExternal(url);
}
