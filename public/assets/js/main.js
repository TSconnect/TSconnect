function toTimestamp(dateString){
    return new Date(dateString)
}

window.onload = async () => {

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://tsconnect.github.io/contents/TSConnect/TheErasTourDates.json',
      headers: { 
        'Content-Type': 'application/json'
      }
    };

    let data = await axios.request(config)
    data = data.data
     console.log(`Requested data: ${JSON.stringify(data)}`)
    
    let dates = []
    for(i in data){
        dates.push(toTimestamp(data[i].date))
    }
   let nearest = nearestDate(dates)
    document.getElementById("nextTourDate").innerText = `${data[nearest].date}`
    document.getElementById("tourLocation").innerText = `${data[nearest].location}`


}

function nearestDate (dates, target) {
  if (!target) {
    target = Date.now()
  } else if (target instanceof Date) {
    target = target.getTime()
  }

  let nearest = Infinity
  let winner = -1

  dates.forEach(function (date, index) {
    if (date instanceof Date) {
      date = date.getTime()
    }
    let distance = Math.abs(date - target)
    if (distance < nearest) {
      nearest = distance
      winner = index
    }
  })

  return winner
}