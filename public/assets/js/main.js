function toTimestamp(dateString) {
  return new Date(dateString);
}
const { contextBridge, ipcRenderer } = require("electron");

window.onload = async () => {
let days;
  if (document.getElementById("timezone") != undefined) {
    document.getElementById("timezone").innerText =
      `Dashboard (All times are in ${new Date()
        .toLocaleDateString(undefined, { day: "2-digit", timeZoneName: "long" })
        .substring(4)
        .match(/\b(\w)/g)
        .join("")})`;
  }
    
if (document.getElementById("tourMonitorTimezone") != undefined) {
    document.getElementById("tourMonitorTimezone").innerText =
      `Tour Monitor (All times are in ${new Date()
        .toLocaleDateString(undefined, { day: "2-digit", timeZoneName: "long" })
        .substring(4)
        .match(/\b(\w)/g)
        .join("")} unless specified)`;
  }

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
      dates.push(toTimestamp(tourdate[i].time));
    }
    let nearest = nearestDate(dates);
    console.log(nearest, tourdate[nearest])
     days = tourdate[nearest]
    let time = toTimestamp(tourdate[nearest]["time"]);
    document.getElementById("nextTourDate").innerText =
      `${time.toLocaleDateString()} ${time.toLocaleTimeString()}`;
    document.getElementById("tourLocation").innerText =
      `${tourdate[nearest].location}`;
  } 
    
// needs the tour info to execute before this will work
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
