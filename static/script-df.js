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

var myRequest = new Request('http://localhost:5000/data', myInit);

var baus = []
var marcadores = []

function converte(onibus,num){
  return {
    id: num,
    lat: onibus.GPS_Latitude,
    long: onibus.GPS_Longitude,
    id: onibus.Prefixo,
    linha: onibus.Linha,
    velo: onibus.Velocidade
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function atualiza(ms) {
  while (1==1){
  
  await sleep(ms);
  
  fetch(myRequest)
  .then(function(response) {
    myJson = response.json()
    return myJson;
  })
  .then(function(myJson) {
    baus = []
    for(var i in myJson){
      //console.log(myJson[i]);
      bau = converte(myJson[i],i)
      baus.push(bau)
    }
    for(ix in marcadores){
      //console.log([baus[ix].lat, baus[ix].long])
      marcadores[ix].moveTo([baus[ix].lat, baus[ix].long], 8000);
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
    }
    //console.log(baus)

    for(ix in baus){
      //console.log(baus[ix])
      var marcador = L.Marker.movingMarker([[baus[ix].lat, baus[ix].long],[baus[ix].lat, baus[ix].long]],
             [1000], {autostart: true}).addTo(map);
      marcador.bindPopup("<b>id:</b>"+baus[ix].id +
      "<br><b>linha:</b>"+ baus[ix].linha
    )
      marcadores.push(marcador)
    }

    //console.log(marcadores)

    atualiza(5000, marcadores);


  });