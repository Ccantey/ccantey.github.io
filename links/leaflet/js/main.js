//Global variables
var map; //map object
var csvData; //array of objects
var altData;
var markersLayer; //markers layer group object
var crimesLayer;
var timestamp = 10; //initial timestamp
var scaleFactor = 40; //scale factor for proportional symbol--maeker area
var timer; //timer object for animation
var timerInterval = 500; //initial animation speed in milliseconds


//the 1st function called once the html is loaded
function initialize() {
	setMap();
	//processCSV();
	setIU();
}

//set basemap parameters
function setMap(){
	//set initial view
	map = L.map('map').setView([43.05,-89.385], 12);
		
	//add the tile layer to the map
	var layer = L.tileLayer(
		'http://{s}.acetate.geoiq.com/tiles/acetate/{z}/{x}/{y}.png',
		{
			attribution: 'Acetate tileset from GeoIQ'
		}).addTo(map);	
		processCSV();
		
		//animateMap();
		sequenceInteractions();		
};

function setIU(){  //I think we want to add map elements her using L.map.control from leaflet js

	// create Leaflet control
	var uiControl = L.Control.extend({
		initialize: function (legend, options) {
			L.Util.setOptions(this, options);
		},
		onAdd: function (map) {
			return L.DomUtil.get(legend);
		}
	});

	// add the legendControl to the map and pass options into the constructor (initializer)
	map.addControl(new uiControl('', { position: 'bottomright' }));
}
function processCSV(){

	var csv = 'data/csvData.csv'; 
		
	var processCSV = new ProcessCSV; 

	processCSV.addListener("complete", function() {
		var csvData = processCSV.getCSV(); 
		
		var csv2 = 'data/IndividualCrimes.csv';
		var processCSV2 = new ProcessCSV;
		processCSV2.addListener("complete", function() {
			var csvData2 = processCSV2.getCSV(); 
			createMarkers([csvData, csvData2]);
		});
		processCSV2.process(csv2);
	});
		
	processCSV.process(csv);
};
function createMarkers(inData){
	//marker style object see L.Path @ leaflet docs
	var markerStyle = {
		fillColor: "#700000",
		fillOpacity: 0.4,
		stroke: true,
		color: "#700000",
		opacity: 0.2,		
	};	
	var markerStyle2 = {
		fillColor: "black",
		fillOpacity: 0.4,
		stroke: true,
		color: "#700000",
		opacity: 0.2,		
	};	
	
	//create array to hold markers
	
	for(var l=0 in inData){
		var markersArray = [];	
	//crate a circle marker for each object in the inData array
		for (var i=0; i<inData[l].length; i++){
			var feature ={};
			feature.properties = inData[l][i];
			var lat = Number(feature.properties.Latitude);
			var lng = Number(feature.properties.Longitude);
			var marker = L.circleMarker([lat,lng], markerStyle);
			//if (l=1){var marker = L.circleMarker([lat,lng], markerStyle2);};
			marker.feature = feature;
			markersArray.push(marker);
		};
		if(l == 0){ 
			//create a markers layer with all of the circle markers
			markersLayer = L.featureGroup(markersArray);
			map.addLayer(markersLayer);	
		} else {
			crimesLayer = L.featureGroup(markersArray);
			//crimesLayer.addTo(map);
		}
	}
	console.log(crimesLayer);
	$('#cc').click(function(){			//Button
		if(map.hasLayer(markersLayer)){
			map.removeLayer(markersLayer);
			map.addLayer(crimesLayer);
			$('#cc').css('color','#700000');
		} else if(map.hasLayer(crimesLayer)){
			map.removeLayer(crimesLayer);
			map.addLayer(markersLayer);
			$('#cc').css('color','black');
		}
	});
	
	updateLayers();	
};

function onEachFeature(layer){
	//<-createMarkers()
	
	//calculate the area based on the data for that timestamp
	var area = layer.feature.properties[timestamp] * scaleFactor;
	
	//calculate the radius
	var radius = Math.sqrt(area/Math.PI);
	
	//set the symbol radius
	layer.setRadius(radius);
	
	//console.log(layer);
	var month;
		 if (timestamp==1){month = 'January'};
		 if (timestamp==2){month = 'February'};
		 if (timestamp==3){month = 'March'};
		 if (timestamp==4){month = 'April'};
		 if (timestamp==5){month = 'May'};
		 if (timestamp==6){month = 'June'};
		 if (timestamp==7){month = 'July'};
		 if (timestamp==8){month = 'August'};
		 if (timestamp==9){month = 'September'};
		 if (timestamp==10){month = 'October'};
		 if (timestamp==11){month = 'November'};
		 if (timestamp==12){month = 'December'};
	//create and style the HTML in the information popup
	 var popupHTML = "<b>" + layer.feature.properties[timestamp] +
					 " gun related crimes</b><br>" +
					 "<i> " + layer.feature.properties.Neighborhood + //change so it says neighborhood in jan/feb/etc.. rather than undefined in 2
					 " Neighborhood through " + month + "</i>";

	 //bind the popup to the feature
	 layer.bindPopup(popupHTML, {
		offset: new L.Point(0,-radius)
	 });

	 //information popup on hover
	 layer.on({
		 mouseover: function(){
			 layer.openPopup();
			 this.setStyle({radius: radius, fillColor: 'red', color: 'white'}); 
	 },
	 mouseout: function(){
		 layer.closePopup();
		 this.setStyle({fillColor: "#700000", color: '#700000'});
	 }
	 });
	return radius;
	

}

function updateLayers(){

	var radiusArray = [];
	//upon changing the timestamp, call onEachFeature to update the display
	markersLayer.eachLayer(function (layer){
		var r = onEachFeature(layer);
		radiusArray.push(r);
	});
	crimesLayer.eachLayer(function (layer){
		var r = onEachFeature(layer);
		radiusArray.push(r);
	});
	updateLegend(radiusArray);
}

function updateLegend(rArray){
	var month;
		if (timestamp==1){month = 'January'};
		 if (timestamp==2){month = 'February'};
		 if (timestamp==3){month = 'March'};
		 if (timestamp==4){month = 'April'};
		 if (timestamp==5){month = 'May'};
		 if (timestamp==6){month = 'June'};
		 if (timestamp==7){month = 'July'};
		 if (timestamp==8){month = 'August'};
		 if (timestamp==9){month = 'September'};
		 if (timestamp==10){month = 'October'};
		 if (timestamp==11){month = 'November'};
		 if (timestamp==12){month = 'December'};

	// select the legendTitle html element and insert the current value of 
	// timestamp between two header tags 
	document.getElementById("legendTitle").innerHTML = "<h3>Cumaltive Gun Crime: Madison, WI 2012</h3>";
	document.getElementById("legendYear").innerHTML = "<h3>"+month+"</h3>";
	
	// select legendSymbols html element and store reference within JS var 
	var legendSymbols = document.getElementById('legendSymbols');
	
	var maxrad = Math.max.apply(null, rArray); // --  thnx Carl Sack
	var minrad = Math.min.apply(null, rArray);
		
	var midrad = (maxrad - minrad)/2;
	var legendArray = [maxrad, midrad, minrad];
	console.log(legendArray);
	legendSymbols.innerHTML = '';  // clear the contents of legendSymbols elements (from last iteration)
	
	// create container svg element and append to legendSymbols 
	var legendSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	legendSvg.setAttribute("version", "1.2");
	legendSvg.setAttribute("baseProfile", "tiny");
	legendSymbols.appendChild(legendSvg);
	
	for (var i=0; i < legendArray.length; i++) {		
		var c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); // create element
		if (i == 0){c.setAttribute("cx", 40);c.setAttribute("cy", legendArray[i]+30)};
		if (i == 1){c.setAttribute("cx", 80);c.setAttribute("cy", legendArray[i]+55)};
		if (i == 2){c.setAttribute("cx", 110);c.setAttribute("cy", legendArray[i]+65)}; 		
		c.setAttribute("r", legendArray[i]);
		c.setAttribute("fill", "rgba(112, 0, 0, .7)");
		c.setAttribute("stroke", "rgba(112, 0, 0, .7)");
		c.setAttribute("stroke-width", 2);
		//c.setAttribute("transform","scale(1,-1)");
		legendSvg.appendChild(c);
	}

	
	//reverse-calculate the legend marker radius to store values --  thnx Carl Sack
	var maximum = Math.round((Math.pow(maxrad,2)*Math.PI)/scaleFactor);
	var median = Math.round((Math.pow(midrad,2)*Math.PI)/scaleFactor);
	var minimum = Math.round((Math.pow(minrad,2)*Math.PI)/scaleFactor);
	var legendValues = [maximum, median, minimum];
	
	var legendData = document.getElementById("legendData");
	legendData.innerHTML = ' ';
	// loop through legendValues array values and insert each within legendData html div element
	for (var j=0;j < legendValues.length; j++){
		legendData.innerHTML += "<div> crimes "+legendValues[j]+"</div>"
	} 
}

function sequenceInteractions(){
	$(".pause").hide();
	
	//play behaivior
	$(".play").click(function(){
		$(".pause").show();
		$(".play").hide();
		animateMap();
	});
	
	//pause behaivior
	$(".pause").click(function(){
		$(".pause").hide();
		$(".play").show();
		stopMap();
	});
	
	//step behavior
	$(".step").click(function(){
		step();
	});
	
	//step-full behavior
	$(".step-full").click(function(){
		jump(10); //update parameter with last timestamp from csv
	});
	
	//back behavior
	$(".back").click(function(){
		back();
	});
	
	//back-full behavior
	$(".back-full").click(function(){
		jump(1); //update parameter with last timestamp from csv
	});
	
	$("#temporalSlider").slider({
		min: 1,
		max: 10,
		step:1,
		animate: "fast",
		slide: function(e,ui){
			stopMap();
			timestamp = ui.value;
			updateLayers();
		}
	});
}

function animateMap(){
	timer = setInterval(function(){
		step();//->
	}, timerInterval);
};

function stopMap(){
	clearInterval(timer);
}

function step(){
	//<-animate map
	
	//cycle through years
	if (timestamp <10){ //10 is the last stamp header
		timestamp++;
	}else {
		timestamp = 1; //loop back to january
	};	
	updateLayers();
	updateSlider();
}


function jump(t){
	//set the timestamp to the value passed in the parameter
	timestamp = t;
	
	//upon changing the timestamp, call onEachFeature to update the display
	updateLayers();
	updateSlider();
}

function back(){
	//cycle through years
	if (timestamp > 1){ //update with last timestamp header
		timestamp--;
	} else {
		timestamp = 10; //update with first timestamp header
	};

	updateLayers();
	updateSlider();
}

function updateSlider(){
	var sliderval = timestamp;
	//Move the slider to the appropriate value
	$("#temporalSlider").slider("value",sliderval);
}



//begin script when window loads
window.onload = initialize(); 





















