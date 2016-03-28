var election = {}; //Trying not to pollute the global namespace : )
election.keyArray = ["Population", "MedianAge", "NonWhitePct", "PctWin", "MarginOvictory", "ObamaWin", "RomneyWin"];
election.expressed = election.keyArray[3]; // ****initial attribute SET BACK TO ZERO CHRIS*********
election.obamaWon = election.keyArray[5];

//begin script when window loads
window.onload = initialize();

//the funciton called once the html is loaded
function initialize(){
	setMap();
};

d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
	this.parentNode.appendChild(this);
	});
};

//set choropleth map parameters
function setMap(){	
	//map frame dimensions
	var width = 450;
	var height = 450;
	
	//create a new svg element with the above dimensions
	var map = d3.select("#map-container")	//cannot seem to put it in container
				.append("svg")
				.attr("width", width)
				.attr("height", height);
				
	//create MN centered albers equal area conic projection
	var projection = d3.geo.albers()
						.center([0, 46]) //seem to move the x,y pixel location
						.rotate([94,0, 0]) //centering it 94 degrees from center(0,46)
						.parallels([43.5, 49]) //standard parallels
						.scale(3800) //smaller = smaller
						.translate([width/2, height/2]); // x/y location of display 
	
	//create svg path generator using the projection
	var path = d3.geo.path()
				 .projection(projection);		
				 
	//retrieve data in csv data file for coloring choropleth
	d3.csv("data/Minnesota.csv", function(csvData){ //callback #1
			var recolorMap = colorScale(csvData);
			var base = baseMap(csvData);
			drawPcp(csvData);

			//console.log("recolorMap", colorScale(csvData));//NOTHING HERE "scale(x)" from D3 quantiles
			
			// Create basemap (I just have solid Minnesota)
			d3.json("data/Minnesota.json", function (error,state){ //callback #2
				
				//variables for csv to json data transfer
				//moved var keyArray to global
				var jsonCounties = state.objects.MnCounties.geometries;
				//console.log(state);
				//loop through csv to assign each csv values to json counties
				for (var i=0; i<csvData.length; i++){
					var csvCounties = csvData[i]; //current counties
					var csvFIPS = csvCounties.FIPS; //FIPS ID from csv
					
					//console.log(csvFIPS);
					
					//loop through json counties to find right county
					for (var a=0; a<jsonCounties.length; a++){
						//where FIPS codes match, attach csv to json objerct
						if (jsonCounties[a].properties.FIPS == csvFIPS){
							//assign all five key/value pairs
							for (var b=0; b<election.keyArray.length;b++){
								var key = election.keyArray[b];
								var val = parseFloat(csvCounties[key]);
								jsonCounties[a].properties[key] = val;
								//console.log('jsonCounties: ',jsonCounties[0]);
						};
						jsonCounties[a].properties.name = csvCounties.NameCounty; //set property
						break; //stop looking through the json counties
						};					
					};
				};				
				
				//state = map.append creates the MN basemap

								
				//add counties to basemap as enumeration units-make them selectable
				var counties = map.selectAll(".counties")
								  .data(topojson.object(state,
														state.objects.MnCounties).geometries) //
								  .enter() //create elements
								  .append("path") // append elements to SVG
								  .attr("class", "counties") // stylesheet
								  .attr("id", function(d){return d.properties.FIPS})
								  .attr("d", path) //project data s geometery in svg
								  .style("fill", function(d){
										return opacitator(d, base); //color basemap (I have names opac. and choro backwards... they shoudl logically flip
								  })
								  .style("fill-opacity", function(d){//value by alpha
										return choropleth(d, recolorMap);
										})
									.on("mouseover",highlight)
									.on("mouseout",dehighlight)
									.on("mousemove",moveLabel)
									.append("desc")	//append the current color
										.text(function(d){
											return choropleth(d,recolorMap);
										});
				var states = map.append("path")//create svg path element
			   .datum(topojson.object(state,
									  state.objects.Minnesota )) //references "state" called in function and Minnesota called in TopoJSON
				.attr("class", "state") //class name for stylesheet
				.attr("d",path);//project data as geometry in SVG
				//console.log(state);
										
				}); // end d3.json
	}); // end d3.csv	
};

function baseMap(csvData){
	var color = d3.scale.quantile() //designate quantile scale generator
					  .range([
						"rgb(255,0,0)",
						"rgb(0,0,255)",
					  ]);
	
	//set min and max data values as domain
	color.domain([
		d3.min(csvData, function(d) {return Number(d[election.obamaWon]);}),
		d3.max(csvData, function(d) {return Number(d[election.obamaWon]);})
	]);
	return color; //return the color generator
	//console.log("color: ", color.domain);//nothing
}

function colorScale (csvData){
	//create quantile classes with opacity color scale

	var opacity = d3.scale.quantile() //designate quantile scale generator 
					  .range([
						".1",
						".3",
						".4",
						".6",
						".8",
						"1",	
					  ]);
	
	//set min and max data values as domain
	opacity.domain([
		d3.min(csvData, function(d) {return Number(d[election.expressed]);}),
		d3.max(csvData, function(d) {return Number(d[election.expressed]);})
	]);
	return opacity; //return the color generator
	//console.log("color: ", color.domain);//nothing
};

function opacitator (d, base){
	var winner = d.properties[election.obamaWon];
	return base(winner);
}
function choropleth(d, recolorMap){
	//get data value
	var value = d.properties[election.expressed];
	//if value exists, assign it a color; otherwise assign gray
	return recolorMap(value);

};

function highlight(data){
	var props = datatest(data); //standardized json or csv data
	//console.log('props: ',props); //Prints the value of hover state county
	
	d3.select("#"+props.FIPS) // select the current county in the DOM
		.style("stroke","yellow") //set the selection fill color
		.style("stroke-width", 4)
		.moveToFront();
		
	//highlight corresponding pcp line
	d3.selectAll(".pcpLines") //selct the pcp lines
		.select("#"+props.FIPS) //select the right pcp line
		.style("stroke", "yellow") //restyle the pcp line
		.style("stroke-width", 4)
		.moveToFront();
	
	var labelAttribute = "<h3>"+election.expressed+
						  "</h3><br><b>"+props[election.expressed]+"</b>"; //label content
						  //console.log("election.expressed",election.expressed);
						  //console.log("props",props[election.expressed])
	
	var labelName = props.name; //nameCounty? perhaps..if its calling the csv

	var infolabel = d3.select("#map-container").append("div")
			.attr("class", "infolabel") //styling for label
			//.attr("class", props.FIPS+"label") //for styling label
			.html(labelAttribute) //add text
			.append("div") //add child div for feature name
			.attr("class", "labelname") //for styling name
			.html(labelName); //add feature name to label
};

function datatest(data){
	if (data.properties){ //if json data
			return data.properties;
		} else { // if csv data
			return data;
		};
};

function moveLabel(){
	var x = d3.event.clientX-150; //horiz label coord
	var y = d3.event.clientY-150; //vert label coord
	
	d3.select(".infolabel") //select the label div for moving
			.style("margin-left",x+"px") //reposition
			.style("margin-top", y+"px"); //repostion
};

function dehighlight(data){
	var props = datatest(data);	//standardize json or csv data

	var prov = d3.select("#"+props.FIPS); //designate selector variable for brevity
	var fillcolor = prov.select("desc").text(); //access original color from desc
	prov.style("stroke", '#000')
		.style("stroke-width", 1); //reset enumeration unit to orginal color		
	
	//dehighlight corresponding pcp line
	d3.selectAll(".pcpLines") //select the pcp lines
		.select("#"+props.FIPS) //select the right pcp line
		.style("stroke","#FFF") //restyle the line
		.style("stroke-width", .5); //restyle the line width
		
	d3.select(".state") //make sure the state underlay comes back to the front
		.moveToFront();
	
	d3.select(".infolabel").remove(); //remove info label
};

function drawPcp(csvData){
	//pcp dimensions
	var width = 960;
	var height = 200;
		
	//create attribute names array for pcp axes
	var keys = [], attributes = [];
	//fill keys array with all property names
	for (var key in csvData[0]){
		keys.push(key);
	};
	//fill attributes array with only the attribute names
	for (var i=3; i<keys.length; i++){
		attributes.push(keys[i]);
	};
	
	//create horizontal pcp coordinate generator
	var coordinates = d3.scale.ordinal() //create an ordinal scale for plotting axes
		.domain(attributes) //horizontally space each attribute's axis evenly
		.rangePoints([0, width]); //set the horizontal scale width as the SVG width
		
    var axis = d3.svg.axis() //create axis generator
		.orient("left"); //orient generated axes vertically
	
	//create vertical pcp scale
	scales = {}; //object to hold scale generators
	attributes.forEach(function(att){ //for each attribute
    	scales[att] = d3.scale.linear() //create a linear scale generator for the attribute
        	.domain(d3.extent(csvData, function(data){ //compute the min and max values of the scale
				return +data[att]; //create array of data values to compute extent from
			})) 
        	.range([height, 0]); //set the height of each axis as the SVG height
	});
	
	var line = d3.svg.line(); //create line generator
	
	//create a new svg element with the above dimensions
	var pcplot = d3.select("#map-container")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "pcplot") //for styling
		.style("clear","both")
		.append("g") //append container element
		.attr("transform", d3.transform( //change the container size/shape
			"scale(0.8, 0.6),"+ //shrink
			"translate(96, 50)")); //move
			
	var pcpBackground = pcplot.append("rect") //background for the pcp ******Maybe use this for legend!!!!!!!!
		.attr("x", "-30")
		.attr("y", "-35")
		.attr("width", "1020")
		.attr("height", "270")
		.attr("rx", "15")
		.attr("ry", "15")
		.attr("class", "pcpBackground");
	
	//add lines
	var pcpLines = pcplot.append("g") //append a container element
		.attr("class", "pcpLines") //class for styling lines
		.selectAll("path") //prepare for new path elements
		.data(csvData) //bind data
		.enter() //create new path for each line
		.append("path") //append each line path to the container element
		.attr("id", function(d){
			return d.FIPS; //id each line by FIPS
		})
		.attr("d", function(d){
			return line(attributes.map(function(att){ //map coordinates for each line to arrays object for line generator
				return [coordinates(att), scales[att](d[att])]; //x and y coordinates for line at each axis
			}));
		})
		.on("mouseover", highlight)
		.on("mouseout", dehighlight)
		.on("mousemove", moveLabel);
	
	//add axes	
	var axes = pcplot.selectAll(".attribute") //prepare for new elements
		.data(attributes) //bind data (attribute array)
		.enter() //create new elements
		.append("g") //append elements as containers
		.attr("class", "axes") //class for styling
		.attr("transform", function(d){
			return "translate("+coordinates(d)+")"; //position each axis container
		})
		.each(function(d){ //invoke the function for each axis container element
			d3.select(this) //select the current axis container element
				.call(axis //call the axis generator to create each axis path
					.scale(scales[d]) //generate the vertical scale for the axis
					.ticks(0) //no ticks
					.tickSize(0) //no ticks, I mean it!
				)
				.attr("id", d) //assign the attribute name as the axis id for restyling
				.style("stroke-width", "5px") //style each axis		
				.on("click", function(){ //click listener
					sequence(this, csvData);
				});	
		});
		
	pcplot.select("#"+election.expressed) //select the expressed attribute's axis for special styling
		.style("stroke-width", "10px");
}

function sequence(axis, csvData) {
	//restyle the axis
	d3.selectAll(".axes") //select every axis
		.style("stroke","#fff")
		.style("stroke-width", "5px"); 
	
	axis.style.strokeWidth = "10px"; //change selected axis style
	
	election.expressed = axis.id; //change the class-level att value
	//console.log(election.expressed);
	
	//recolor the map
	d3.selectAll(".counties") //select every province
		.style("fill-opacity", function(d) { //color enumeration units
			return choropleth(d, colorScale(csvData)); 				
		})
		.select("desc") //replace the text in each province's desc element
		.text(function(d) {
			return choropleth(d, colorScale(csvData)); 
		});		
};

















