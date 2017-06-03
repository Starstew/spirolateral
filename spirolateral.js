var cvs, // canvas
	ctx, // context
	march_interval_id;


var getPathArray = function(spirolateral_profile) {
	var path_array = [],
		x = spirolateral_profile.x,
		y = spirolateral_profile.y,
		amp = spirolateral_profile.amp,
		reps = spirolateral_profile.reps
		sequence = spirolateral_profile.sequence,
		angle = spirolateral_profile.angle,
		color = spirolateral_profile.color || "#000",
		spin = spirolateral_profile.spin,
		min_x = 1000,
		min_y = 1000,
		max_x = 0,
		max_y = 0;

	var is_spiral = $("#togglerepspiral")[0].checked;
	var original_amp = amp;
	for (var j=0; j<reps; j++) {
		for (var i=0; i<sequence.length; i++) {
			var len = sequence[i] * amp;
			var adjusted_angle = angle * (i+j);
			var newcoord = getLineToCoords(x,y,len,(adjusted_angle)%360,spin);
			
			// set the new start pos
			x = newcoord.x;
			y = newcoord.y;

			path_array.push({x:x,y:y,rep:j,seqindex:i});

			// record min/max
			min_x = min_x ? Math.min(x,min_x) : x;
			min_y = min_y ? Math.min(y,min_y) : y;
			max_x = max_x ? Math.max(x,max_x) : x;
			max_y = max_y ? Math.max(y,max_y) : y;
		}
		if (is_spiral) {
			amp += original_amp/10;
		}
	}

	return path_array;
};

var drawSpirolateral = function(spirolateral_profile) {
	ctx.clearRect(0, 0, cvs.width, cvs.height);
	ctx.fillStyle = $("#bgcolor").val();
	ctx.fillRect(0,0,cvs.width,cvs.height);
	ctx.beginPath();
	var x = spirolateral_profile.x,
		y = spirolateral_profile.y,
		amp = spirolateral_profile.amp,
		reps = spirolateral_profile.reps
		sequence = spirolateral_profile.sequence,
		angle = spirolateral_profile.angle,
		color = spirolateral_profile.color || "#000",
		spin = spirolateral_profile.spin,
		min_x = 1000,
		min_y = 1000,
		max_x = 0,
		max_y = 0;

	amp = amp != null ? amp :  1;
	var original_amp = amp;
	reps = parseInt(reps);
	ctx.moveTo(x,y);
	ctx.strokeStyle = color;
	ctx.lineWidth = $("#linewidth").val();
	var is_curve = $("#togglecurve")[0].checked;
	var path_array = getPathArray(spirolateral_profile);
	for (var i=0; i<path_array.length; i++) {
		var newcoord = path_array[i];
		if (is_curve) {
			var len = sequence[i%spirolateral_profile.sequence.length] * amp;
			var adjusted_angle = angle * (newcoord.seqindex + newcoord.rep);
			var curveamount = parseInt($("#curveamount").val());
			var curvecontrolcoord = getLineToCoords(newcoord.x,newcoord.y,len*.5,(adjusted_angle+curveamount)%360,spin);
			ctx.quadraticCurveTo(curvecontrolcoord.x,curvecontrolcoord.y,newcoord.x,newcoord.y);
		} else {
			ctx.lineTo(newcoord.x,newcoord.y); // draw the line
		}
	}
	ctx.stroke();

	// add sequence, angle note
	ctx.font = "12px Arial";
	ctx.fillStyle = spirolateral_profile.color;
	var curvenote = $("#togglecurve").prop("checked") ? " Curve:" + parseInt($("#curveamount").val()) : "";
	var spiralnote = $("#togglerepspiral").prop("checked") ? " Spiral" : "";
	ctx.fillText("[" + spirolateral_profile.sequence.toString() + "]  " + spirolateral_profile.angle + "\xB0 x" + spirolateral_profile.reps + curvenote + spiralnote,5,15);

	drawSpirolateralSvg(spirolateral_profile);
};

var drawSpirolateralSvg = function(spirolateral_profile) {
	var path_array = getPathArray(spirolateral_profile);
	var svg = $("#spiro_svg")[0];
	$("#spiro_svg").empty();
	$("#spiro_svg").css("background-color",$("#bgcolor").val());
	var svg_path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
	var d = "M " + spirolateral_profile.x + " " + spirolateral_profile.y + " L ";
	for (var i=0; i<path_array.length; i++) {
		d += path_array[i].x + " " + path_array[i].y + " ";
	}
	svg_path.setAttribute("d",d);
	svg_path.style.stroke = spirolateral_profile.color || "#000";
	svg_path.style.strokeWidth = $("#linewidth").val() + "px";
	svg_path.style.fill = "rgba(0,0,0,0.2)";
	svg.appendChild(svg_path);
};

var getLineToCoords = function(startx,starty,len,angle,spin) {
	var coords = {x:startx,y:starty};
	angle += spin;
	angle = angle * Math.PI/180;
	var newx = startx + len * Math.cos(angle);
	var newy = starty + len * Math.sin(angle);
	coords.x = newx;
	coords.y = newy;
	return coords;
};

var getSpirolateralProfileFromForm = function() {
	var sp = {
		x: parseInt($("#start_x").val()),
		y: parseInt($("#start_y").val()),
		sequence: $("#sequence").val().split(","),
		angle: parseFloat($("#angle").val()),
		reps: parseInt($("#reps").val()),
		amp: parseFloat($("#size").val()),
		color: $("#color").val(),
		spin: parseInt($("#spin").val())
	};
	return sp;
};

var startAngleMarch = function(delay) {
	if (march_interval_id) {
		clearInterval(march_interval_id);
		march_interval_id = null;
		return;
	}
	delay = delay || 40;
	march_interval_id = window.setInterval(function(){
		var a = ($("#angle").val() % 179) + 1;
		a = Math.max(Math.min(a,180),40);
		$("#angle").val(a);
		$("#settings").submit();
	},delay);
};

var startCurveMarch = function(delay) {
	$("#togglecurve").prop("checked","checked");
	if (march_interval_id) {
		clearInterval(march_interval_id);
		march_interval_id = null;
		return;
	}
	delay = delay || 40;
	march_interval_id = window.setInterval(function(){
		var c = ($("#curveamount").val() % 360) + 1;
		$("#curveamount").val(c);
		$("#settings").submit();
	},delay);
};

var startSpinMarch = function(delay) {
	$("#togglespin").prop("checked","checked");
	if (march_interval_id) {
		clearInterval(march_interval_id);
		march_interval_id = null;
		return;
	}
	delay = delay || 40;
	march_interval_id = window.setInterval(function(){
		var c = ($("#spin").val() % 360) + 1;
		$("#spin").val(c);
		$("#settings").submit();
	},delay);
};

var triggerDraws = function() {
	var spirolateral_profile = getSpirolateralProfileFromForm();
	drawSpirolateral(spirolateral_profile);
	offsetToCorner();
}

var offsetToCorner = function(offset) {
	if ($("#togglemanpos")[0].checked) {
		offset = offset || 25;
		var sp = getSpirolateralProfileFromForm();
		sp.x = sp.x - min_x + offset;
		sp.y = sp.y - min_y + offset;
		drawSpirolateral(sp);
	}
};

var refreshUi = function() {
	// alignment
	if ($("#togglemanpos")[0].checked) {
		$("#start_x, #start_y").spinner("disable");
	} else {
		$("#start_x, #start_y").spinner("enable");
	}

	//curve
	if ($("#togglecurve")[0].checked) {
		$("#curveamount").spinner("enable");
	} else {
		$("#curveamount").spinner("disable");
	}
};

$(function(){
	// init canvas
	cvs = document.getElementById("spiro_canvas");
	ctx = cvs.getContext("2d");

	// init form
	$("#angle").spinner({
		max: 359,
		min: -359,
		step: .5
	});
	$("#start_x, #start_y").spinner({
		max: 1000,
		min: 1
	});
	$("#size, #linewidth").spinner({
		max: 50,
		min: .1,
		step: .1
	});
	$("#reps").spinner({
		max: 1000,
		min: 1
	});
	$("#curveamount, #spin").spinner({
		min: -359,
		max: 359
	})
	$("#settings").on("submit",function(e){
		e.preventDefault();
		triggerDraws();
		return false;
	});
	$("#ssanglemarch").on("click",function(e){
		startAngleMarch();
	});
	$("#curvemarch").on("click",function(e){
		startCurveMarch();
	});
	$("#spinmarch").on("click",function(e){
		startSpinMarch();
	});
	$("#settings input").on("keyup",function(e){
		triggerDraws();
	});
	$("#togglecurve, #togglemanpos, #togglerepspiral").on("click", function(e){
		refreshUi();
		triggerDraws();
	});

	// trigger the form
	$("#settings").submit();
});