// initialize the map on the "map" div with a given center and zoom
var map = new L.Map('map').setView([-15.7836, -47.8850],12);

// create a new tile layer
var tileUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
layer = new L.TileLayer(tileUrl,
{
    attribution: 'Maps © <a href=\"www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors',
    maxZoom: 18
});

var myHeaders = new Headers();

var myInit = { 
    method: 'GET',
    headers: myHeaders,
    mode: 'cors',
    cache: 'default' 
};

// Create a function to generate a new Request each time
function createRequest() {
    //dev
    return new Request('http://localhost/data', myInit);
    //prod
    //return new Request('http://cademeubau.com.br/data', myInit);
}

var baus = []
var bausDict = []
var marcadores = []
var marcadoresDict = []
var layerBus;

// Add global flag to prevent multiple update loops
var updateIntervalId = null;

function converte(onibus,num){
  return {
    id: num,
    lat: onibus.GPS_Latitude,
    long: onibus.GPS_Longitude,
    prefixo: onibus.numero,
    linha: onibus.linha,
    velo: 0,
    angulo: onibus.direcao
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAtan2(y, x) {
  return Math.atan2(y, x);
};

// Updated atualiza function using setInterval instead of infinite loop
function startUpdates(ms, marcadoresDict) {
  // Stop any existing update loop
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
  
  updateIntervalId = setInterval(() => {
    console.log('Fetching bus updates...');
    
    // Create a new Request for each fetch
    fetch(createRequest())
    .then(function(response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(function(myJson) {
      baus = []
      bausDict = []
      for(var i in myJson){
        bau = converte(myJson[i],i)
        baus.push(bau)
        bausDict[bau.prefixo] = bau
      }

      for (var key in marcadoresDict) {
        // checks if the bus is in the new request, sometimes buses vanish from request to request
        // If it vanishes, leave the bus in the same location on the map for now
        if(key in bausDict){
          marcadoresDict[key].moveTo([bausDict[key].lat,bausDict[key].long],8000)

          var oldPos = marcadoresDict[key].getLatLng()

          endLng = bausDict[key].long
          endLat = bausDict[key].lat
          startLng = oldPos.lng
          startLat = oldPos.lat

          var radians = getAtan2((endLng - startLng), (endLat - startLat));
          
          var busAngle = radians * (180 / Math.PI)

          //caso haja mudança de localização, atualiza a rotação
          if(busAngle != 0){
            marcadoresDict[key].setRotationAngle(busAngle)
          }
        }
      }
      console.log('Bus positions updated successfully');
    })
    .catch(function(error) {
      console.error('Error fetching bus data:', error);
    });
  }, ms);
}

map.addLayer(layer);

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initialLoad();
});

function initialLoad() {
  // Stop any existing update loop first
  if (updateIntervalId) {
    console.log('Stopping existing update loop...');
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
  
  console.log('Starting initial load...');
  
  // Create a new Request for the initial fetch
  fetch(createRequest())
    .then(function(response) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(function(myJson) {
      // Clear existing data
      baus = []
      bausDict = []
      marcadores = []
      marcadoresDict = []
      
      // Remove existing layer if it exists
      if (layerBus) {
        map.removeLayer(layerBus);
      }

      for(var i in myJson){
        bau = converte(myJson[i],i)
        baus.push(bau)
        bausDict[bau.prefixo] = bau
      }

      for(ix in baus){
        var busAngle = Math.abs(parseFloat(baus[ix].angulo))
        var busIcon = L.icon({iconUrl: 'static/img/bus.png', iconSize: [14, 32], iconAnchor: [7, 18]})

        var marcador = L.Marker.movingMarker([[baus[ix].lat, baus[ix].long],[baus[ix].lat, baus[ix].long]],
          [1000], {autostart: true, rotationAngle: busAngle, icon: busIcon, title: baus[ix].linha});
        marcador.bindPopup("<b>id:</b>"+baus[ix].prefixo +
          "<br><b>linha:</b>"+ baus[ix].linha
        )
        marcadores.push(marcador)
        marcadoresDict[baus[ix].prefixo] = marcador
      }
      layerBus = L.layerGroup(marcadores)
      map.addLayer(layerBus)

      console.log('Initial load completed, starting updates...');
      // Start the update loop with 5 second interval
      startUpdates(5000, marcadoresDict);
    })
    .catch(function(error) {
      console.error('Error in initial load:', error);
    });
}

function filterRemoveInactive() {
	var marcadoresAtivos = [];

	for(ix in marcadores){
		if(marcadores[ix].options.title !== ''){
			marcadoresAtivos.push(marcadores[ix])
		} 
	}

	marcadoresAtivos = L.layerGroup(marcadores_ativos)

	map.removeLayer(layerBus)
	map.addLayer(marcadoresAtivos)
}

function filter_specfic_lines(busLine) {
	var filteredLines = []

	for(ix in marcadores){
		if(marcadores[ix].options.title === busLine){
			filteredLines.push(marcadores[ix])
		}
	}

	filteredLines = L.layerGroup(filteredLines)

    map.removeLayer(layerBus)
	map.addLayer(filteredLines)
}

function filterBox() {
  var searchContent = document.getElementById('filter-bus-line').value
  filter_specfic_lines(searchContent)
}