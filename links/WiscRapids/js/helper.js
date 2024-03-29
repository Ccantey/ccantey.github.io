$(document).ready(function () {

    $('#searchTab  .btn').click(function () {
        $('.results.identify').hide();
        if (this.id == 'ownerGo') {
		    //alert('dadfs');
            SearchParcelByAttribute("Owner");
        }
        else if (this.id == "addressGo") {
            SearchParcelByAttribute("Address");
        }
        else {
            SearchParcelByAttribute("PID");
        }
    });

    //Autocomplete helper: press enter to complete function			
	$( "#requestByaddress" ).keypress(function(event) {
		if(event.keyCode == 13){
		     RequestByLocation();
	        //console.log( "Pressed the Enter Key." );
			};
	});
	$( "#owner" ).keypress(function(event) {
		if(event.keyCode == 13){
		     SearchParcelByAttribute('Owner');
	        //console.log( "Pressed the Enter Key." );
			};
	});
	$( "#addresses" ).keypress(function(event) {
		if(event.keyCode == 13){
		     SearchParcelByAttribute('Address');
	        //console.log( "Pressed the Enter Key." );
			};
	});
	$( "#pid" ).keypress(function(event) {
		if(event.keyCode == 13){
		     SearchParcelByAttribute('PID');
	        //console.log( "Pressed the Enter Key." );
			};
	});	
	
    $("#multiptleBufferItem").on('mouseover', 'tr', function (e) {
        tempGraphicLayer.clear();
        //Changed the fill
        var sfs = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
												new dojo.Color([0, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.7]));
        var row = $(this).parent().children().index($(this));		
        var zoomGraphic = selectedFeatures.features[row];
        zoomGraphic.setSymbol(sfs);
        tempGraphicLayer.add(zoomGraphic);
    });

    $("#multiptleBufferItem,#multipleItem").on('mouseout', 'tr', function (e) {
        tempGraphicLayer.clear();
    });

    $("#multiptleItem").on('click', 'tr', function (e) {
        tempGraphicLayer.clear();
        //Changed the fill
        var sfs = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
												new dojo.Color([0, 0, 0]), 2), new dojo.Color([255, 0, 0]));
        var row = $(this).parent().children().index($(this));
        var zoomGraphic = selectedFeatures.features[row];
        var extent = esri.graphicsExtent([zoomGraphic]);
        var extentParcel = extent.expand(2);
        map.setExtent(extentParcel, true);
        zoomGraphic.setSymbol(sfs);
        tempGraphicLayer.add(zoomGraphic);
        doneIdentifyParcel(zoomGraphic);
    });

	$("#multiptleItem").on('mouseover', 'tr', function (e) {
        tempGraphicLayer.clear();
        //Changed the fill
        var sfs = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
												new dojo.Color([0, 0, 0]), 2), new dojo.Color([255, 0, 0, 0.7]));
        var row = $(this).parent().children().index($(this));
		console.log(row);
        var zoomGraphic = selectedFeatures.features[row];
        zoomGraphic.setSymbol(sfs);
        tempGraphicLayer.add(zoomGraphic);
    });

    $('#map-tools .middle').click(function () {
        navEvent("resetMap");
    });

    $('#map-tools .first').click(function () {
        navEvent("gps");
    });

    $('#dPoint').click(function () {
        $('#draw-tab .size-row th').html('Size');
    });

    $('#dFreePoly').click(function () {
        $('#draw-tab .size-row th').html('Opacity');
    });

    $('#dFreeLine').click(function () {
        $('#draw-tab .size-row th').html('Width');
    });

    $('#dText').click(function () {
        $('#draw-tab .size-row th').html('Size');
    });

});
