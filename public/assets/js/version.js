// Display the current version
let version = window.location.hash.substring(1);
document.getElementById('version').innerText = version;

// Listen for messages
const {ipcRenderer, remote} = require('electron');
ipcRenderer.on('message', function(event, text) {
  var container = document.getElementById('messages');
  var message = document.createElement('div');
  if(text == 'Update not available. Starting TSConnect.'){
    message.innerHTML = text;
    document.getDocumentById("progress").aria-valuenow="100"
      document.getDocumentById("progress").value="100%"
  }else{
    let data = text.split("-")
   if(data[0] == "101"){ document.getDocumentById("progress").aria-valuenow=`${data[1]}`     document.getDocumentById("progress").value=`${data[1]}%`
                       }else{
                           document.getElementById("version").innerText = data[1]
                       }
  }
})