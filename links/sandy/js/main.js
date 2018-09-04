//global variables
var hexTweetTotalPairsArray = []; //stores the total number of tweets in each hexagon for the entire searchable database of tweets. Calculated once upon load of the application. Used to normalize the number of tweets in each hex that satisfy the query. 
var mapEntered = false;
var frequenciesArray = []; 
var freqPairsArray = []; 
var jsonHexes;
var boroughsButton = document.getElementById("boroughsButton");
var displayBoroughs = true;
var controlsButton = document.getElementById("controlsButton");
var displayControls = true;
var twitterButton = document.getElementById("twitterButton");
var displayTweets = true;

//move to front function
d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
}; 

//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize(){
        $('#loading').hide();
	
	async.series([
		getAllTweets(),
		setMap()
	]);	
	//event listener for submission of word to map (bindData called)- triggers movement of control panel to side and disappearing of welcome text	
 };
 
 function getAllTweets() {
 //grab the results of a query for every tweet in database 
	d3.json("https://gis.leg.mn/iMaps/cantey_queryAll.php", function(phpData) {
		// console.log("phpData length: ",phpData.length);
		var allTweets = phpData;
		// console.log("total tweets: ",allTweets.length);
		//array to store pairs of [hexgon id, total number of tweets in that hex]
		hexTweetTotalPairsArray = countQueryTweetsByHex(allTweets); 
		console.log("hexagons with a tweet: ",hexTweetTotalPairsArray.length);
	}); //end d3.json function for total tweets
	 
 }

//set choropleth map parameters
function setMap(){ 
       
	console.log("start setMap");
/*setMap:------------------ Map Frame Setup ------------------------*/
        
	//map frame dimensions 
	var width = 900;
	var height = 1200; 
	
	//create a new svg element with the above dimensions
	var map = d3.select ("#mapContainer") 
		.append("svg") 
		.attr("width", width)
		.attr("height", height)
		.attr("class", "map"); //class for styling
		
	//create New York City projection, centered on NYC 
	var projection = d3.geo.azimuthalEqualArea()
		.center([0,40.7])
		.rotate([73.90, 0, 0])
		.scale(210000)
		.translate([width/2, height/2]); 
		
	//create svg path generator using the projection 
	var path = d3.geo.path()
		.projection(projection);
		
/*setMap:----------------- end Map Frame Setup ------------------------*/

/*setMap: ++++++++++++++++++ Draw Geography ++++++++++++++++++*/
	//retrieve and process topojson file containing hexagons
	d3.json("data/hexagons_topo.json", function(error, NYC) { 
		
		//grab all the hexagons in the json
		jsonHexes = NYC.objects.hexagons.geometries;
		
		//add shape below basemap to show water
		var water = map.append("rect") //create rectangle element 
			.attr("width","840px")
			.attr("height","1020px") 
			.attr("x","20px") //pixels from the left side
			.attr("y","27px") //pixels from the top 
			.attr("class", "water") //class for styling
			.style("fill", "#001C1D");

		//add hexagons to the map
		var hexagons = map.selectAll(".hexbins")
			.data(topojson.object(NYC, 
						NYC.objects.hexagons).geometries) 
			.enter()
			.append("path") 
			.attr("class", "hexbins") //class name for styling
			.style("fill", "black")
			.style("stroke", "#444444") //stroke is grey 
			.attr("d", path) //project data as geometry in svg
			.on("mouseover", function (d){
				highlight(this, d);
			})
			.on("mouseout", function (d){
				dehighlight(this, d);
			})
			.on("mousemove", moveLabel)
			; 
	}); //end d3.json function for hexagons
		
	//retrieve and process topojson file containing boroughs
	d3.json("data/boroughs_topo.json", function(error, NYC) { 
		var boroughs = map.selectAll(".boroughs")
			.data(topojson.object(NYC, 
						NYC.objects.boroughs).geometries) 
			.enter()
			.append("path") 
			.attr("class", "boroughs") //class name for styling
			.style("fill", "none")
			.style("stroke","white")			
			.attr("d", path); //project data as geometry in svg

	}); //end d3.json function for boroughs
	
/*setMap: ++++++++++++++++++ end Draw Geography ++++++++++++++++++*/

	cloudMake();		//This is calling the wordcloud	
	
} //end setMap

function bindData (searchWord){
	console.log("start bindData");
	if (mapEntered == false) { 	
		//do this if it's the first time entering the map this session.
		document.getElementById("legend").style.display = "inherit";
		document.getElementById("controlPanel").style.opacity = "0.5";
		document.getElementById("controlPanel").style.left = "calc(5% + 1135px)";
		document.getElementById("controlPanel").style.top = "55px";
		document.getElementById("controlPanel").style.margin = "0px";
		document.getElementById("cover").style.display = "none";
		document.getElementById("welcome-text").style.display = "none";
		document.getElementById("tweetsContainer").style.display = "block";
		mapEntered = true;
	}
	
	//if there is no word submitted, use the word 'Sandy'
	if (!searchWord){ 	
		searchWord = 'Sandy';
		document.getElementById("keyword").innerHTML = searchWord;
	}

	console.log("jsonHexes:",jsonHexes.length);
	
	//clear the properties to clear previous data from map
	for (var a=0; a<jsonHexes.length; a++) {
		jsonHexes[a].properties.frequency = null;
		jsonHexes[a].properties.fillcolor = null;
	};
	$('#loading').show();
	//grab the query tweets from the php file 
	d3.json("https://gis.leg.mn/iMaps/cantey.php?x="+searchWord, function(queryData) {
	    // console.log("query items length: ",queryData.length);
		// console.log("query items: ",queryData[0]);
		var queryTweets = queryData; //why does 'evacuate return empty, but display colors on map???? 
		//console.log("queryTweets: ", queryTweets); 
		
		//console.log(queryTweets[0].USERID);	
		
		//output the first four tweets that actually have body text...
		//first, create a variable to store the ul element. 
		var tweetFeed = document.getElementById("tweets");
		
		//clear out the unordered list. 
		tweetFeed.innerHTML = "";
		
		//start with a index variable, which will increment every time we TRY to add a tweet. 
		var index = 0;
		
		//loop using a variable (k) to keep track of how many tweets have actually been added to the feed. 
		for (var k=0; k<4; ){
			//console.log("k: ",k);
			if (!queryTweets[index]){
				if (index == 0){
					// console.log('index == 0');
					tweetFeed.innerHTML = "<p>no tweets match <br/>your search</p>";
				}
				//if undefined, break out of the loop. 
				break;
			} else if (queryTweets[index].body == null){
				// console.log('body == null');
				//any tweet that starts with a quote sign will have a null body, so it shouldn't be included. 
				index++; //both cases increment index 
				// console.log(queryTweets[index].BODY);
			} else {
				// console.log(queryTweets[index].body);
				//if the tweet body exists and isn't null...
				var li=document.createElement("li");
				var tweetBody = queryTweets[index].body+" --@"+queryTweets[index].meta_profileabout;
				// console.log(tweetBody);
				li.innerHTML = replaceURLWithHTMLLinks(tweetBody);
				tweetFeed.appendChild(li);
				index++; //both cases increment index 
				k++; //only increment k in this case. 
			}; //end if/else statement 
		    $('#loading').hide();	
		};//end for loop		 	
		
		//count the tweets per hex that meet the query: 
		var queryCountsArray = countQueryTweetsByHex(queryTweets);
		
		//normalize the query tweets by total tweets for each hexagon. 
		//store the frequency values in an array of pair arrays [hexID, freq] 
		freqPairsArray = normalizeTweets(queryCountsArray, hexTweetTotalPairsArray);
		
		frequenciesArray = isolateSecondItemOfPair(freqPairsArray);

		//binds the data values and colors the map, called from mouseover of hexagons. 
		var recolorMap = colorScale(frequenciesArray);		
		
		//loop through frequency pairs array to assign each frequency value to its json hex 
		for (var i=0; i<freqPairsArray.length;i++){
			// for each freq/hex pair in the array... 
			//store the array pair's hexID and frequency as variables
			var arrayHex = freqPairsArray[i][0];
			var arrayFreq = freqPairsArray[i][1];			
			
			//loop through json Hexes  
			for (var a=0; a<jsonHexes.length; a++) {

				//where id codes match, set the fill style of the hexagon
				if (jsonHexes[a].properties.hexagonID == arrayHex){
					
					//create a new property of the json hex called 'frequency'
					jsonHexes[a].properties.frequency = arrayFreq;
					
					//create a new property of the json hex called 'fillcolor'
					jsonHexes[a].properties.fillcolor = recolorMap(arrayFreq); 
					
					break; //stop looking through the json hexagons 
				
				}; //end if statement 
									
			}; //end for loop for finding the proper json hexbin
		
		}; //end for loop for finding array hex value
		
		var hexagons = d3.selectAll(".hexbins")
			.style("fill", function (d) { //color enumeration units
				if (d.properties.fillcolor) {
					return d.properties.fillcolor; //returns one color 
				} else {
					return "black"; //black fill if no data
				};
			} ); //end style fill				
	}); //end d3.json for query tweets	
}

function replaceURLWithHTMLLinks(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,"<a href='$1' target='_blank'><b>Photograph/Link</b></a> "); 
}

/*+++++++++++++++ process php output after query +++++++++++++++*/ 

function countQueryTweetsByHex(queryTweets) {
       
	//this function tallies the number of query tweets in each hexagon. 
	
	//create an empty array to hold the hexagon id of every tweet. 
	var queryHexagons = [];
	//create an array to store arrays of [hexID, count] 
	var hexCountPairsArray = []; 	
	
	//populate the arrays 
	for (var i=0; i<queryTweets.length; i++){
	//for every tweet that matches the query... 
		//store its hexagon id as var hexID
		var hexID = queryTweets[i].hex;
		//find the index of that hexID value within the queryHexagons array. 
		//Returns -1 if it doesn't exist!! 
		var existingIndex = queryHexagons.indexOf(hexID);
		
		//If the hexID isn't in the hexagon array already (has an index of -1),  
		if (existingIndex == -1){ 
			//add it to the hexgons array...
			queryHexagons.push(hexID);
			
			//then, build an array of hexID and count of 1 and add it to the pairs array.
			var hexCountPair = [hexID, 1];
			hexCountPairsArray.push(hexCountPair);			
			
		} else { 
			//if it's already in the hexagons array, increment the 'count' element or second element of the hex-count pair. 
			hexCountPairsArray[existingIndex][1]=  hexCountPairsArray[existingIndex][1] + 1;
			var count = hexCountPairsArray[existingIndex][1];
		};		
	};
	
	return hexCountPairsArray;	 
}

function normalizeTweets(queryCountsArray, hexTweetTotalPairsArray){
	
	var freqPairsArray = [];
	
	for (k = 0; k<queryCountsArray.length; k++){
		for (j=0; j<hexTweetTotalPairsArray.length; j++){
			if (queryCountsArray[k][0] == hexTweetTotalPairsArray[j][0]){
				
				var numerator = queryCountsArray[k][1];
				var denominator = hexTweetTotalPairsArray[j][1];
				if (numerator < denominator){
				   var freq =  numerator/denominator ;
				   } else{
				   var freq =  1 ;
				   
				   }
				
				freqPairsArray.push([queryCountsArray[k][0], freq])
				
			};
		};
	};
	return freqPairsArray; //return an array of hexgon ids paired with their frequency of tweets meeting the query (range of 0 to 1) 
	
} //end normalizeTweets function 

function isolateSecondItemOfPair(freqPairsArray){
	var freqArray = [];
	for (b=0;b<freqPairsArray.length;b++){
		freqArray.push(freqPairsArray[b][1]);
	};
	return freqArray;
}
/*+++++++++++++++ end process php output after query +++++++++++++++*/ 

/* ================ Coloring ================ */
function colorScale(frequenciesArray){ 
	//accepts an array of all frequency values and defines the class breaks based on the lowest and highest 
	
	//create quantile classes with color scale 
	var color = d3.scale.pow() //designate quantile scale 
		.range ([
		        "#000",
			//"#302C29", //grey-ish
			//"#45455C",			
			//"#4C61A2", 
			"#057FFE" //bright blue
		]); 
	
	//set min and max data values as domain 
	color.domain ( //[0,1]
		[
			d3.min(frequenciesArray), //lowest 
			d3.max(frequenciesArray) //highest 
		]
	); 
	
	//var low = d3.min(frequenciesArray); //lowest 
	//var high = d3.max(frequenciesArray); //highest 
	//console.log("colorscale:"+low+" to "+high);
	
	return color; //return the color scale generator 	
}


/* ================ end Coloring ================ */ 

/*------------------- highlighting -------------------*/

function highlight (data, d){	
	if (d.properties.fillcolor){ //if the hexagon has a value, allow highlight
		
		var freq = d.properties.frequency;
	
		//style label
		data.style.stroke = "white"; 
		data.parentNode.appendChild(data); //move to front
		d3.selectAll(".boroughs")
			.moveToFront(); //move the boroughs to front so they arent blocked 
		
		//label content: expressed variable, value, id of hexagon
		var labelAttribute = 	
		"<br/><h2>"+Math.round(freq*10000)/100+"%</h2><p>of tweets in this area <br/>contain the keyword.</p>";
		//create info label div
		var infolabel = d3.select("body").append("div") 
			.attr("class","infolabel") //class for styling label 
			.attr("id", d.properties.hexagonID+"label") //id for label div
			.html(labelAttribute); //add text
	};	
};

function dehighlight (data, d) {	
	//reset hexagon style
	data.style.stroke = "#444444";
	
	//remove the information label
	labelID = String(d.properties.hexagonID+"label");
	infoLabel = document.getElementById(labelID);
	d3.select(infoLabel).remove();
	d3.selectAll(".boroughs")
		.moveToFront();
};

function moveLabel() {	
	var x = d3.event.clientX+20; //horizontal label coordinate 
	var y = d3.event.clientY-15; //vertical label coordinate 	
	d3.select(".infolabel") //select the label div for moving 
		.style("left", x+"px") //reposition label horizontal 
		.style("top", y+"px"); //reposition label vertical 
};		

/*------------------- end highlighting -------------------*/
		


/*~~~~~~~~~~~~~~~~~~~~~~~~ Sequence ~~~~~~~~~~~~~~~~~~~~~~~~*/ 
function sequence (csvData) {
	console.log("call sequence");
	//recolor the map 
	d3.selectAll(".hexbins") //select every hexagon 
		.style("fill", function(d) { //color enumeration units 
			return choropleth(d, colorScale(csvData)); 
		})
		
};

/*~~~~~~~~~~~~~~~~~~~~~~~~ end Sequence ~~~~~~~~~~~~~~~~~~~~~~~~*/ 


/*______ Buttons ______*/


boroughsButton.onclick = function () {

	if (displayBoroughs == false){
		d3.selectAll(".boroughs")
			.style("display", "inherit")
			.moveToFront();
		d3.select("#boroughLabels")
			.style("display","inherit");
		boroughsButton.innerHTML = "<p>hide boroughs</p>";
		displayBoroughs = true;
	} else {
		d3.selectAll(".boroughs")
			.style("display", "none");
		d3.select("#boroughLabels")
			.style("display","none");
		boroughsButton.innerHTML = "<p>show boroughs</p>";
		displayBoroughs = false;
	}
	
};

controlsButton.onclick = function () {

	if (displayControls == true){
		document.getElementById("control-right-triangle").style.display = "inline-block";
		document.getElementById("control-down-triangle").style.display = "none";
		document.getElementById("controlsContent").style.display = "none";
		document.getElementById("controlPanel").style.height = "25px";
		
		displayControls = false;
	} else {
		document.getElementById("control-right-triangle").style.display = "none";
		document.getElementById("control-down-triangle").style.display = "inline-block";
		document.getElementById("controlsContent").style.display = "block";
		document.getElementById("controlPanel").style.height = "500px";
		
		displayControls = true;
	}
	
};

twitterButton.onclick = function () {

	if (displayTweets == true){
		document.getElementById("twitter-left-triangle").style.display = "inline-block";
		document.getElementById("twitter-down-triangle").style.display = "none";
		document.getElementById("twitterContent").style.display = "none";
	
		displayTweets = false;
	} else {
		document.getElementById("twitter-left-triangle").style.display = "none";
		document.getElementById("twitter-down-triangle").style.display = "inline-block";
		document.getElementById("twitterContent").style.display = "block";
		displayTweets = true;
	}
	
};

/*______ end Buttons ______*/

/*--------------------Word Cloud Stuffs------------------*/
 $("#newCloudButton").click(function(){
	document.getElementById("wordcloud").innerHTML = ""; //clear the previous word-cloud
	cloudMake(); 
});

var fill = d3.scale.category20();

function cloudMake(){ 		//called at end of setMap !
	console.log("start cloudMake");
	 var wordArray = [
		"power", "water", "train", "Obama", "Romney", "work", "Sandy", "hurricane", "storm", "mayor","crane", "cold", "New York", "subway", "crazy", "vote", "evacuate"/*, "rain",  "lights", "dark", "Frankenstorm", "battery park", "climate", "batteries", "store", "supplies", "danger", "food", "subway", "MTA", "park",  "tree", "ConEd"*/];
	 d3.layout.cloud().size([300, 300])
		.words(wordArray.map(function(d) {
			return {text: d, size: 4 + Math.random() * 90};
			}))
		.rotate(function() { return ~~(Math.random() * 2) * 90; })
		.font("Impact")
		.fontSize(function(d) { return d.size; })
		.on("end", draw)
		.start();
	}; 
  function draw(words) {
    d3.select("#wordcloud").append("svg")
        .attr("width", 300)
        .attr("height", 300)
      .append("g")
        .attr("transform", "translate(150,150)")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
		.style("fill", "white")
       
        .attr("text-anchor", "middle")
		.attr("class", "words")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; })
		.on("click", function (d){
			selectWord(d.text);
			//recolor hexagons
		});
  }
  
function selectWord(t) {
	
	var selectedWord = t;
	console.log("you selected:", selectedWord); 
	
	document.getElementById("keyword").innerHTML = selectedWord;
	
	//clear all words
	d3.selectAll(".words")
		.style("fill","white");
	//color the selected word 
	d3.select(t)
		.style("fill", "#FABA0E");
		
	bindData(selectedWord);
} 
  
  /*------------------End Word Cloud-------------------*/
  

  
  /*++++++++++++++++++++++ Search Box event listeners ++++++++++++++++++++++*/ 
  
$("#submitButton").click(function(){
	submitWord();
});

$(searchBox).keypress(function(e) {
    if(e.which == 13) {
        submitWord();
    }
});

function submitWord(){
	var submittedWord = $('#searchBox').val();

	//clear the wordcloud highlight 
	d3.selectAll(".words")
		.style("fill","white");

	//change the displayed keyword in the title
	document.getElementById("keyword").innerHTML = submittedWord;
  
	bindData(submittedWord);
}
  
/*++++++++++++++++++++++ end Search Box event listeners ++++++++++++++++++++++*/
  