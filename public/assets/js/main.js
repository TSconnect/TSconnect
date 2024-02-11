// Main JS for the app

// Define neccesary variable and libraries
const { ipcRenderer } = require("electron");

// when the window loads
window.onload = async () => {
  // send message to console for those debugging
  console.log("")
  console.log(`
Welcome to the debug console!

Only renderer side logs will appear here, backend logs will be logged in your machine's log folder. 

To find the backend logs, please use the guide below:
MacOS: ~/Library/Logs/TSConnect/main.log
Windows: %USERPROFILE%\\AppData\\Roaming\\TSConnect\\logs\\main.log
  `)
  console.log("")

  // set the document title, needed to execute specific actions
  var title = document.title;

  // Discord RPC
  let status = ["You play stupid games, you win stupid prizes", "RIP Me, I Died Dead", "You Could Lose Your Hand, You Could Lose Your Foot. You Could Lose Your Hand Getting It Off Your Foot! I Don’t Like Sea Urchins.","I'm a Doctor now so I know how breathing works", "I hate that stupid old pick-up truck you never let me drive."]

  ipcRenderer.send("sendRPC", `Browsing ${title}`, status[Math.floor(Math.random() * status.length)])


  // convert all to lowercase for safekeeping
  title = title.toLowerCase()

  // if current page is dashboard
  if(title == "dashboard"){
      // get the tourdates and then edit it to only include the time in the Dates object
      let tourdate = await getTourDate()
      let dates = editDate(tourdate)

      // check for nearest date in the future, get the info, and update the dashboard
      let nearest = nearestDate(dates);
      let days = tourdate[nearest]

    // if the page needs nextTourDate
    let time = toTimestamp(tourdate[nearest]["time"]);
    if(document.getElementById("nextTourDate"))document.getElementById("nextTourDate").innerText =
      `${time.toDateString()} ${time.toLocaleTimeString()}`;
    if(document.getElementById("nextTourDateLocal"))document.getElementById("nextTourDateLocal").innerText =
      `${time.toDateString()} 4:00:00pm`;
    if(document.getElementById("tourLocation"))document.getElementById("tourLocation").innerText =
      `${tourdate[nearest].location}`;


    //countdown to next tour date
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

}
    

if (title == "tour monitor"){
  // get the tourdates and then edit it to only include the time in the Dates object
  let tourdate = await getTourDate()
  let dates = editDate(tourdate)

  // check for nearest date in the future, get the info, and update the dashboard
  let nearest = nearestDate(dates);
  let days = tourdate[nearest]


  // Update location
  let time = toTimestamp(tourdate[nearest]["time"]);
  if(document.getElementById("nextTourDate"))document.getElementById("nextTourDate").innerText =
    `${time.toDateString()} ${time.toLocaleTimeString()}`;
  if(document.getElementById("tourLocation"))document.getElementById("tourLocation").innerText =
    `${tourdate[nearest].location}`;

  // Get the livestreams for the date
  if (document.getElementById("livestreams") != undefined) {

    // Check if currently it is in the time period(10 hours before to midnight the next day) where live streams will show, if not, update to have the info for the user.
    if(new Date(days['time']).getTime() - new Date().getTime() > (10 * 60 * 60 * 1000) || (new Date(days['time']).getTime() + (8 * 60 * 60 * 1000)) < new Date().getTime()){ 
      let tempTimeStart = new Date(new Date(days['time']).getTime() - (10 * 60 * 60 * 1000))
      let tempTimeEnd = new Date(new Date(days['time']).getTime() + (8 * 60 * 60 * 1000))
      document.getElementById("livestreams").innerHTML = `Live streams for the next stop will start appearing here at: ${tempTimeStart.toLocaleDateString()} ${tempTimeStart.toLocaleTimeString()}<br />Live streams for the next stop will disappear at: ${tempTimeEnd.toLocaleDateString()} ${tempTimeEnd.toLocaleTimeString()}`
      return;
    }

    // if in the time zone, get the live streams information
    let streams = await getLive()

    // If none was found, reply with no livestream found
    if (streams == undefined || streams[0] == undefined || streams.length == 0){
      document.getElementById("livestreams").innerHTML = "No livestreams has been entered. Please checkback later!";
      return
    };

    // reset the livestream text for safekeeping
    document.getElementById("livestreams").innerHTML = "";

    // add the streams text to the info box.
    for (i in streams) {
      document.getElementById("livestreams").innerHTML +=
        `<a href="#" onclick="openLink('${streams[i]["url"]}')">${streams[i]["name"]}</a><br />`;
    }
  }
  };
}


/**
 * Get the nearest day in an array
 *
 * @param {Array[Date]} dates An array of Date objects
 * @param {Date} target A time to find the closest date of, defaults to right now
 * @return {Number} Returns the index of dates that contains the closest date. 
 */
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

/**
 * Opens a link in the default browser
 *
 * @param {String} url A url to open
 * @return {void} 
 */
function openLink(url) {
  if (!url) return;
  require("electron").shell.openExternal(url);
}

/**
 * Get the tour date of the eras tour
 *
 * @return {Array[Object]} An array of objects containing info for each show
 */
async function getTourDate(){
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://tsconnect.github.io/contents/TSConnect/TheErasTourDates.json",
    headers: {
      "Content-Type": "application/json",
    },
  };

  let tourdate = await axios.request(config);

  return tourdate.data;

}


/**
 * Edit the date to have only the time in the Date format
 *
 * @param {Array[Object]} tourdate an array of object describing the tourdate
 * @return {Array[Date]} An array of date object
 */
function editDate(tourdate) {

    let dates = [];
    for (i in tourdate) {
      dates.push(new Date(toTimestamp(tourdate[i].time).getTime() + (8 * 60 * 60 * 1000)));
    }

    return dates
}

/**
 * Get an object of all the lives on a date
 *
 * @return {Object} An object containing the livestreams on a date 
 */
async function getLive(){

  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: "https://tsconnect.github.io/contents/TSConnect/livestreams.json",
    headers: {
      "Content-Type": "application/json",
    },
  };
  let streams = await axios.request(config);
  return streams.data;
}


/**
 * Convert to timestamp in the Date format
 *
 * @param {string} dateString A string that can be taken into a Date class
 * @return {Date} returns the Date class coresponding to the date string
 */
function toTimestamp(dateString) {
  return new Date(dateString);
}