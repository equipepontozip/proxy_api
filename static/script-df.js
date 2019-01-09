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

var myRequest = new Request('http://cademeubau.com.br/data', myInit);

var baus = []
var bausDict = []
var marcadores = []
var marcadoresDict = []

function converte(onibus,num){
  return {
    id: num,
    lat: onibus.GPS_Latitude,
    long: onibus.GPS_Longitude,
    prefixo: onibus.Prefixo,
    linha: onibus.Linha,
    velo: onibus.Velocidade,
    angulo: onibus.GPS_Direcao
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    //for(ix in marcadores){
      //console.log([baus[ix].lat, baus[ix].long])
      //marcadores[ix].moveTo([baus[ix].lat, baus[ix].long], 8000);
    //}
    for (var key in marcadoresDict) {
      console.log([bausDict[key].lat,bausDict[key].long])
      marcadoresDict[key].moveTo([bausDict[key].lat,bausDict[key].long],8000)
    }
  });

}
}

map.addLayer(layer);

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
      var busAngle = Math.abs(parseFloat(baus[ix].angulo.replace(/,/, '.')))
      var busIcon = L.icon({iconUrl: 'static/img/bus.png', iconSize: [14, 32], iconAnchor: [7, 18]})
      console.log(busAngle)
      var marcador = L.Marker.movingMarker([[baus[ix].lat, baus[ix].long],[baus[ix].lat, baus[ix].long]],
        [1000], {autostart: true, rotationAngle: busAngle, icon: busIcon}).addTo(map);
      marcador.bindPopup("<b>id:</b>"+baus[ix].prefixo +
      "<br><b>linha:</b>"+ baus[ix].linha
    )
      marcadores.push(marcador)
      //marcadoresDict.push({key: bau.prefixo, obj: marcador})
      marcadoresDict[baus[ix].prefixo] = marcador
    }

    console.log(marcadoresDict)

    //atualiza(5000, marcadores);
    atualiza(5000, marcadoresDict);

  });
