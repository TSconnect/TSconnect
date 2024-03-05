// Main JS for the app

// Define neccesary variable and libraries
const { ipcRenderer } = require("electron");


function log(message) {
  console.log(message)
  ipcRenderer.send("logConsole", message)
}


// when the window loads
window.onload = async () => {
  ipcRenderer.send("checkBackendPing")
  // set the document title, needed to execute specific actions
  var title = document.title;

  // convert all to lowercase for safekeeping
  title = title.toLowerCase()

  // if current page is dashboard
  if(title == "dashboard"){
    log("Loading Dashboard")

      // Get announcements data
      let announcements = await getAnnouncements();

      // check if announcements dom exist and check if rn is within the announcement time, if yes, display ot
      if(document.getElementById("announcements")){
        if(new Date(announcements.start).getTime() <= new Date().getTime() && new Date(announcements.end).getTime() >= new Date().getTime()){
          document.getElementById("announcements").innerHTML = `<span><p class="fw-bold">${announcements.title}</p>
  ${announcements.description}</span>`
          document.getElementById("announcements").style.removeProperty("display");
        }
      }



      // get the tourdates and then edit it to only include the time in the Dates object
      let tourdate = await getTourDate()
      let dates = editDate(tourdate)

      // check for nearest date in the future, get the info, and update the dashboard
      let nearest = nearestDate(dates);
      let days = tourdate[nearest]


    // set wording to fit event type
    if(days.type == "tour"){
      if(document.getElementById("localStartTime"))document.getElementById("localStartTime").innerText = "NEXT TOUR DATE'S START TIME (YOUR TIME)"
      if(document.getElementById("eventType"))document.getElementById("eventType").innerText = "Tour Stop"
      if(document.getElementById("location"))document.getElementById("location").innerText = "NEXT TOUR LOCATION"
    
    }else if(days.type == "misc"){
      if(document.getElementById("localStartTime"))document.getElementById("localStartTime").innerText = "NEXT EVENT'S START TIME (YOUR TIME)"
      if(document.getElementById("eventType"))document.getElementById("eventType").innerText = "Miscellaneous"
      if(document.getElementById("location"))document.getElementById("location").innerText = "NEXT VENUE LOCATION"

    }else if(days.type == "awards"){
      if(document.getElementById("localStartTime"))document.getElementById("localStartTime").innerText = "NEXT AWARDS SHOW'S START TIME (YOUR TIME)"
      if(document.getElementById("eventType"))document.getElementById("eventType").innerText = "Awards Show"
      if(document.getElementById("location"))document.getElementById("location").innerText = "NEXT AWARDS SHOW LOCATION"

    }
      // if the page needs nextTourDate
      let time = toTimestamp(days["startTime"]);
      if(document.getElementById("nextTourDate"))document.getElementById("nextTourDate").innerText =
        `${time.toDateString()} ${time.toLocaleTimeString()}`;
      if(document.getElementById("tourLocation"))document.getElementById("tourLocation").innerText =
        `${days.location}`;


    //countdown to next tour date
    if(document.getElementById("countdown") != undefined){
      // Set the date we're counting down to
      var countDownDate = new Date(days['startTime']).getTime();

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
    

if (title == "action monitor"){
  log("Loading Action Monitor")
  // get the tourdates and then edit it to only include the time in the Dates object
  let tourdate = await getTourDate()
  let dates = editDate(tourdate)

  // check for nearest date in the future, get the info, and update the dashboard
  let nearest = nearestDate(dates);
  let days = tourdate[nearest]


  // Update wording to suit type
  let time = toTimestamp(days["startTime"]);

  let endTime = toTimestamp(days["endTime"]);
  if(days.type == "tour"){
    if(document.getElementById("liveExplanation"))document.getElementById("liveExplanation").innerText = `The next tour date will start at ${time.toDateString()} ${time.toLocaleTimeString()} and will end at ${endTime.toDateString()} ${endTime.toLocaleTimeString()}`
    if(document.getElementById("eventInfoTitle"))document.getElementById("eventInfoTitle").innerText = "Next Stop's Information"
  }else if(days.type == "misc"){
    if(document.getElementById("liveExplanation"))document.getElementById("liveExplanation").innerText = `The next event will start at ${time.toDateString()} ${time.toLocaleTimeString()} and will end at ${endTime.toDateString()} ${endTime.toLocaleTimeString()}`
    if(document.getElementById("eventInfoTitle"))document.getElementById("eventInfoTitle").innerText = "Next Event's Information"

  }else if(days.type == "awards"){
    if(document.getElementById("liveExplanation"))document.getElementById("liveExplanation").innerText = `The next awards show will start at ${time.toDateString()} ${time.toLocaleTimeString()} and will end at ${endTime.toDateString()} ${endTime.toLocaleTimeString()}`
    if(document.getElementById("eventInfoTitle"))document.getElementById("eventInfoTitle").innerText = "Next Awards Show's Information"

  }


  // Update location
  if(document.getElementById("nextTourDate"))document.getElementById("nextTourDate").innerText =
    `${time.toDateString()} ${time.toLocaleTimeString()}`;
  if(document.getElementById("tourLocation"))document.getElementById("tourLocation").innerText =
    `${days.location}`;

  // Get the livestreams for the date
  if (document.getElementById("livestreams") != undefined) {

    // Check if currently it is in the time period(10 hours before to midnight the next day) where live streams will show, if not, update to have the info for the user.
    if(new Date(days['startTime']).getTime() - new Date().getTime() > (10 * 60 * 60 * 1000) || (new Date(days['endTime']).getTime() + (2 * 60 * 60 * 1000)) < new Date().getTime()){ 
      let tempTimeStart = new Date(new Date(days['startTime']).getTime() - (10 * 60 * 60 * 1000))
      let tempTimeEnd = new Date(new Date(days['endTime']).getTime() + (2 * 60 * 60 * 1000))


  // Update wording to suit type
      let text;
      if(days.type == "tour"){
        text = `Live streams for the next stop will start appearing here at: ${tempTimeStart.toLocaleDateString()} ${tempTimeStart.toLocaleTimeString()}<br />Live streams for the next stop will disappear at: ${tempTimeEnd.toLocaleDateString()} ${tempTimeEnd.toLocaleTimeString()}`
      }else if(days.type == "misc"){
        text = `Live streams for the next event will start appearing here at: ${tempTimeStart.toLocaleDateString()} ${tempTimeStart.toLocaleTimeString()}<br />Live streams for the next event will disappear at: ${tempTimeEnd.toLocaleDateString()} ${tempTimeEnd.toLocaleTimeString()}`
      }else if(days.type == "awards"){
        text = `Live streams for the next awards show will start appearing here at: ${tempTimeStart.toLocaleDateString()} ${tempTimeStart.toLocaleTimeString()}<br />Live streams for the next awards show will disappear at: ${tempTimeEnd.toLocaleDateString()} ${tempTimeEnd.toLocaleTimeString()}`
      }
      document.getElementById("livestreams").innerHTML = text
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
  return ipcRenderer.sendSync("getTourDate")

}

/**
 * Get the current announcement
 *
 * @return {Object} An objects containing info for the announcement
 */
async function getAnnouncements(){

  return ipcRenderer.sendSync("getAnnouncements");

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
  return ipcRenderer.sendSync("getLive");
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