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

var myInit = { method: 'GET',
               headers: myHeaders,
               mode: 'cors',
               cache: 'default' };

//dev
//var myRequest = new Request('http://localhost/data', myInit);
//prod
var myRequest = new Request('http://cademeubau.com.br/data', myInit);

var baus = []
var bausDict = []
var marcadores = []
var marcadoresDict = []
var layerBus;

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

async function atualiza(ms,marcadoresDict) {
  while (1==1){
  
  await sleep(ms);
  
  fetch(myRequest)
  .then(function(response) {
    myJson = response.json()
    return myJson;
  })
  .then(function(myJson) {
    baus = []
    bausDict = []
    for(var i in myJson){
      //console.log(myJson[i]);
      bau = converte(myJson[i],i)
      baus.push(bau)
      bausDict[bau.prefixo] = bau
    }

    for (var key in marcadoresDict) {
      //console.log([bausDict[key].lat,bausDict[key].long])
      // console.log(key)
      // console.log(bausDict[key])

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
  });

}
}

map.addLayer(layer);

initialLoad()

function initialLoad() {
  fetch(myRequest)
    .then(function(response) {
      myJson = response.json()
      return myJson;
    })
    .then(function(myJson) {

      for(var i in myJson){
        //console.log(myJson[i]);
        bau = converte(myJson[i],i)
        baus.push(bau)
        bausDict[bau.prefixo] = bau
      }
      //console.log(bausDict)

      for(ix in baus){
        var busAngle = Math.abs(parseFloat(baus[ix].angulo))
        var busIcon = L.icon({iconUrl: 'static/img/bus.png', iconSize: [14, 32], iconAnchor: [7, 18]})
        //console.log(busAngle)

        var marcador = L.Marker.movingMarker([[baus[ix].lat, baus[ix].long],[baus[ix].lat, baus[ix].long]],
          [1000], {autostart: true, rotationAngle: busAngle, icon: busIcon, title: baus[ix].linha});
        marcador.bindPopup("<b>id:</b>"+baus[ix].prefixo +
          "<br><b>linha:</b>"+ baus[ix].linha
        )
        marcadores.push(marcador)
        //marcadoresDict.push({key: bau.prefixo, obj: marcador})
        marcadoresDict[baus[ix].prefixo] = marcador
      }
      layerBus= L.layerGroup(marcadores)
      map.addLayer(layerBus)

      atualiza(5000, marcadoresDict);

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
