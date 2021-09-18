/**
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
    style.js
    Purpose: configuration of the projection
*/ 

var VERSION = 'Version 3.0 Copyright @ 2021';


// be careful! this value will be shared by the tansformcontrol.js
var currMode;

var gui;

// paras 
var PARTICLE_SIZE = { current: 1.0, max: 10, min: 1.0, step: 0.5}

var FAKE_LIGHT = { current: 1.0, max: 2.0, min: 0.5, step: 0.05}

// invertal for automatically send xml, 10s
var INTERVAL = 1000 * 10;

// backup interval, 15 min
var BACKUP_INTERVAL = 1000 * 900;

// idle time threshold for automatically logging out, 30 min 
var LOGOUT_THRES = 1000 * 1800;

// idle time threshold for logging working time, 3 min 
var IDLE_THRES = 1000 * 180;

// vertical space between two canvas
var V_SPACE = 10;

// the following are temp values

var LEVEL = 115.0;
var CARHEIGHT = 0.9;
var GROUND_POS = { 
    min: LEVEL-CARHEIGHT-2.0, 
    max: LEVEL-CARHEIGHT + 2.0, 
    step: 0.01, 
    initial: {
        perspective: 100,
        othographic: 100
    }
}

var SKY_POS = { 
    min: LEVEL-CARHEIGHT-0.5, 
    max: {
        perspective: 500,
        othographic: 500
    } ,
    step: 0.01,
    initial: {
        perspective: 500,
        othographic: 500
    }
}

var OPACITY = {
    min: 0, max: 0.95, step: 0.05, current: 0.8
}

var TIMESTAMP = {
    center: {
        min: 0,
        max: 10000 
    },
    winsize: 1 
}

var ARC_SEGMENTS = 600;

var MAX_DENSE_FRAME = 80;

var SPLINE_COLOR = [];
SPLINE_COLOR.push(0x00FF00);
SPLINE_COLOR.push(0xFF7E00);

HORIZONTAOL_DELTA = 0.3;
HORIZONTAOL_DELTA_EPS = 0.02;
VERTICAL_HEIGHT_MAX = 8;
VERTICAL_HEIGHT_MIN = 2;

MIN_DIST = 2;

// below will be deprecated 
var POS_PerspectiveCAM = {x: 1290, y: 3887, z: 210};

var POS_OrthoCAM = {
    x: 30+1250, y: 0, z: 11+200,
    viewSize: 60, ratio: 1.6
};

var TARGET_CONTROL = {
    perspective: {x: 1320, y: 3887, z: 120},
    orth: {x: 30, y: 0, z:-1},
}

// TODO: need to change
var INTRINSIC = {
    f: 552,
    fVirtual: 160,    // 160
 }
 
var LINE_PTS = 200;
var SAMPLE = 5;
var DAT_GUI_SIZE = 300;
var AUTO_THRESHOLD = 0.6;
var NEAR = 0.5;
var FAR = 30000;

/*-----------------TO MODIFY---------------*/
var FOV_SCALE = 30;
/*-----------------TO MODIFY---------------*/

var FOV = 37;

var FOV_FISH = 150;

// display size of the 2D marker (pixel)
var BALL_SIZE = 10;

var FILTER_DIST = 20.0;

var enableAdvanceControl = false;

var WIREFRAME_COLOR = [];
WIREFRAME_COLOR.push(0x00FF00);
WIREFRAME_COLOR.push(0x808080);
WIREFRAME_COLOR.push(0x00FFFF);

var CAMERA_HEIGHT = 1.55;

var FISHEYE_OFF_X = {
    min: -400,
    max: 800,
    median: 200
}


var FISHEYE_OFF_Y = {
    min: -400,
    max: 800,
    median: 200
}

var BOTTOM_MSG = 20;
 
var labelOpacity = 0.5;
var dynamicopacity = 0.8;


var category = [];
var mapping = {};
var ready = 0;
var orientedObj = ['building', 'garage', 'car', 'van', 'truck', 'trailer', 'caravan'];


// self defined class
THREE.EdgesHelper_adv = function ( object, hex, dist ) {

    var color = ( hex !== undefined ) ? hex : 0xffffff;
    var minDist = ( dist !== undefined ) ? dist : 1;
    var numV = object.geometry.vertices.length;

    // pick control points
    var pts_mid = [];
    pts_mid.push(0);

    var prev = object.geometry.vertices[0].clone();
    for (var i = 1; i < numV/2; i++)
    {
        var curr = object.geometry.vertices[i].clone();
        var d = new THREE.Vector3();
        d.x = curr.x - prev.x;
        d.y = curr.y - prev.y;
        d.z = curr.z - prev.z;
        var l = d.length();
        if (l > minDist) {
            pts_mid.push(i);
            prev = curr;
        }
    }

    // constuct edges
    var geometry = new THREE.BufferGeometry();
    var coords = new Float32Array( (numV + pts_mid.length) * 2 * 3 );

    var index = 0;
    var i;

    // top part
    for (i = 0; i < numV/2-1; i++) {
        coords[index ++] = object.geometry.vertices[i].x;
        coords[index ++] = object.geometry.vertices[i].y;
        coords[index ++] = object.geometry.vertices[i].z;

        coords[index ++] = object.geometry.vertices[i+1].x;
        coords[index ++] = object.geometry.vertices[i+1].y;
        coords[index ++] = object.geometry.vertices[i+1].z;
    }

    // head and tail connection
    coords[index ++] = object.geometry.vertices[i].x;
    coords[index ++] = object.geometry.vertices[i].y;
    coords[index ++] = object.geometry.vertices[i].z;

    coords[index ++] = object.geometry.vertices[0].x;
    coords[index ++] = object.geometry.vertices[0].y;
    coords[index ++] = object.geometry.vertices[0].z;

    // bottom part
    for (i = numV/2; i < numV-1; i++) {
        coords[index ++] = object.geometry.vertices[i].x;
        coords[index ++] = object.geometry.vertices[i].y;
        coords[index ++] = object.geometry.vertices[i].z;

        coords[index ++] = object.geometry.vertices[i+1].x;
        coords[index ++] = object.geometry.vertices[i+1].y;
        coords[index ++] = object.geometry.vertices[i+1].z;
    }

    // head and tail connection
    coords[index ++] = object.geometry.vertices[numV/2].x;
    coords[index ++] = object.geometry.vertices[numV/2].y;
    coords[index ++] = object.geometry.vertices[numV/2].z;

    coords[index ++] = object.geometry.vertices[i].x;
    coords[index ++] = object.geometry.vertices[i].y;
    coords[index ++] = object.geometry.vertices[i].z;

    // mid part
    for (i = 0; i < pts_mid.length; i++) {
        coords[index ++] = object.geometry.vertices[pts_mid[i]].x;
        coords[index ++] = object.geometry.vertices[pts_mid[i]].y;
        coords[index ++] = object.geometry.vertices[pts_mid[i]].z;

        coords[index ++] = object.geometry.vertices[pts_mid[i]+numV/2].x;
        coords[index ++] = object.geometry.vertices[pts_mid[i]+numV/2].y;
        coords[index ++] = object.geometry.vertices[pts_mid[i]+numV/2].z;
    }


    geometry.addAttribute( 'position', new THREE.BufferAttribute( coords, 3 ) );

    THREE.Line.call( this, geometry, new THREE.LineBasicMaterial( { color: color } ), THREE.LinePieces );

    this.matrix = object.matrixWorld;
    this.matrixAutoUpdate = false;

};

THREE.EdgesHelper_adv.prototype = Object.create( THREE.Line.prototype );




    
function rgb2hex(r, g, b)
{
    //var hex = (b | (g << 8) | (r << 16));
    var rhex = r.toString(16);
    var ghex = g.toString(16);
    var bhex = b.toString(16);

    var color = '0x' + String('00' + rhex).slice(-2) + String('00' + ghex).slice(-2) + 
                    String('00' + bhex).slice(-2);
    var hex = parseInt(color,16);

    return hex; 

}

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function getLabels(labelColorFile) {
    jQuery.get(labelColorFile, function(data) {        
        var d = data.trim();
        var lines = d.split("\n");

        var labelData = [];

        for (var i = 0; i< lines.length; i++) {
            var info = lines[i].split(" ");
            if (info[0].indexOf("!:") > -1) {
                continue;
            }
            labelData[info[0]] = [];
            labelData[info[0]].colors = rgb2hex(parseInt(info[1]), parseInt(info[2]), parseInt(info[3]));
            labelData[info[0]].instance = parseInt(info[4]);
        }

        crateCategory(labelData);
    })

        .done(function () {
            if (ready) {
                insertLabel();
                readMeta();
            }
            else ready = 1;
    });
}


function getMappings(mappingFile)
{
    jQuery.get(mappingFile, function(data) {   
        var d = data.trim();
        var lines = d.split("\n");

        for (var i = 0; i< lines.length; i++) {
            var info = lines[i].split(" ");
            mapping[info[0]] = info[1];
        }
    })
      
    .done(function () {
            if (ready) {
                insertLabel();
                readMeta();
            }
            else ready = 1;
    });
}

function resetDrawButtonStyle(){
     
    if (polygonButtonInit == false && controlHandler.refineview == 2){
        initDrawTool();
        initDrawtoolButton();
        polygonButtonInit = true;
    }
    else if(polygonButtonInit == true && controlHandler.refineview != 2){
        removeDrawTool();
        polygonButtonInit = false;
    }
    console.log(polygonButtonInit);
}

function initDrawTool(){
    var table = document.getElementById('drawTool');
    var row = table.insertRow(0);

    // new instance botton
    var bt = document.createElement('button');
    bt.type = 'button';
    bt.id = 'newinstance';
    var backColor = '#a9a9a9';
    bt.style.backgroundColor = backColor;
    bt.style.color = '#fff'; 
    bt.style.fontSize = '12px'; 
    bt.innerHTML = 'new instance';
    bt.className += ' btn btn-block labelbutton';

    var cell = row.insertCell(0);
    cell.appendChild(bt);
    cell.style.width = '12.5%';
    cell.id = 'newinstanceCell';
    cell.height = '12px';

    // brush botton
    var bt = document.createElement('button');
    bt.type = 'button';
    bt.id = 'brush';
    var backColor = '#c0c0c0';
    bt.style.backgroundColor = backColor;
    bt.style.color = '#fff'; 
    bt.style.fontSize = '12px'; 
    bt.innerHTML = 'brush';
    bt.className += ' btn btn-block labelbutton';

    var cell = row.insertCell(1);
    cell.appendChild(bt);
    cell.style.width = '12.5%';
    cell.id = 'brushCell';
    cell.height = '12px';

    // path drawing button
    var bt = document.createElement('button');
    bt.type = 'button';
    bt.id = 'drawpath';
    var backColor = '#a9a9a9';
    bt.style.backgroundColor = backColor;
    bt.style.color = '#fff'; 
    bt.style.fontSize = '12px'; 
    bt.innerHTML = 'polygon';
    bt.className += ' btn btn-block labelbutton';

    var cell = row.insertCell(2);
    cell.appendChild(bt);
    cell.style.width = '12.5%';
    cell.id = 'drawpathCell';
    cell.height = '12px';

    // color picking button
    var bt = document.createElement('button');
    bt.type = 'button';
    bt.id = 'pickcolor';
    var backColor = '#c0c0c0';
    bt.style.backgroundColor = backColor;
    bt.style.color = '#fff'; 
    bt.style.fontSize = '12px'; 
    bt.innerHTML = 'picking color';
    bt.className += ' btn btn-block labelbutton';

    var cell = row.insertCell(3);
    cell.appendChild(bt);
    cell.style.width = '12.5%';
    cell.id = 'pickcolorCell';
    cell.height = '12px';
}

function removeDrawTool()
{
    var element = document.getElementById('newinstance');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('brush');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('drawpath');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('pickcolor');
    if (element) element.parentNode.removeChild(element);

    var element = document.getElementById('newinstanceCell');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('brushCell');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('drawpathCell');
    if (element) element.parentNode.removeChild(element);
    var element = document.getElementById('pickcolorCell');
    if (element) element.parentNode.removeChild(element);

    var table = document.getElementById('drawTool');
    table.insertRow(-1);

    console.log('removeDrawTool v3!');
}


function insertLabel()
{
    var table = document.getElementById('labelCateogy');
    var rowStuff = table.insertRow(0);
    var rowInstance;

    var numInstance = 0,  numStuff = 0;
    var labelperRow = 9;

    for (var label in category) {
        var bt = document.createElement('button');
        bt.type = 'button';
        bt.id = label;
        bt.className += 'label';
        bt.innerHTML = label;
        var backColor = '#' + String('000000' + category[label].colors.toString(16)).slice(-6);
        bt.style.backgroundColor = backColor;
        bt.style.color = '#fff'; 
        bt.style.fontSize = '12px'; 
        bt.className += ' btn btn-block labelbutton';
	if (label == 'sky'){
		bt.disabled = true;
	}
        
        var cell;
        if (category[label].instance) {
            if (numInstance%labelperRow == 0) {
                var numRow = Math.floor(numInstance/labelperRow) + 1;
                rowInstance = table.insertRow(numRow);
            }
            cell = rowInstance.insertCell(numInstance%labelperRow);
            numInstance ++;
            bt.className += ' instance';
        }
        else {
            cell = rowStuff.insertCell(numStuff%labelperRow);
            numStuff ++;
            bt.className += ' stuff';
        }

        //cell.style.backgroundColor = backColor;
        cell.appendChild(bt);
        cell.style.width = '11.2%';
        cell.id = 'labelCell';
        cell.height = '16px';
    }
}


function crateCategory(labelData)
{
    for (var name in labelData) {
        category[name] = [];
        category[name].scale = [5, 5, 5];
        category[name].colors = labelData[name].colors;
        category[name].opacity = labelOpacity;
        category[name].objects = [];
        if (name == 'treeSphere' || name == 'treeCube') category[name].type = 'vegetation';
        else category[name].type = name;
        category[name].stack = {matrix: null, level_min: 0, level_max: 0};
        category[name].instance = labelData[name].instance;
    }
}

// intrinsics
var intrinsic_fish0 = [

    {
        offset: {x: 716.2, y: 705.5},
        f: {x: 1277.3, y: 1276.9},
        k: {k1: -0.01478, k2: 1.077},
        xi: 2.0796,
        size: {width: 1400, height: 1400}
    },

    {
        offset: {x: 700.8, y: 698.2},
        f: {x: 1309.4, y: 1309.0},
        k: {k1: 0.01071, k2: 1.299},
        xi: 2.1458,
        size: {width: 1400, height: 1400}
    }
]


var h = 0.7; 
var w_offset = 1/5.6;
var width_fishseye = 1.0
var width_p = 2.5;
var width_h = 1;
var space = 0.005;

var width_fix = 1408;
var height_fix = 376;

var views = {
    'view3D': {
        heightOffset: 0,
        height: h,
        widthOffset: 0,
        width: 1.0,
        backgound: new THREE.Color().setRGB( 0.5, 0.5, 0.7 ),
    },

    'view2D' : {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: width_fishseye/(width_fishseye+width_p),//w_offset,
        width: width_p/(width_fishseye+width_p), //1.0 - w_offset*2
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
    },


    'view2D_left' : {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: width_fishseye/(width_fishseye+width_p), //w_offset,
        background: new THREE.Color().setRGB( 0.5, 0.7, 0.7 ),
    },

    'refine_upper': {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: 1.0, 
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
    },

    'refine_middle': {
        heightOffset: 0,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: 1.0, 
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
    },

    'refine_bottom': {
        heightOffset: 0,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: 1.0, 
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
    },

    'refine_init': {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: 1.0, 
        background: new THREE.Color().setRGB( 0.7, 0.5, 0.5 ),
    },

    // deprecated
    'view2D_right' : {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 1.0, //1.0 - w_offset,
        width: 0.0, //w_offset,
    },


    'view2D_init' : {
        heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: width_fishseye/(width_fishseye+width_p),//w_offset,
        width: width_p/(width_fishseye+width_p), //1.0 - w_offset*2
    },

    'view3D_init' : {
        heightOffset: 0,
        height: h,
        widthOffset: 0,
        width: 1.0,
    },

    'view2D_left_init' : {
         heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 0,
        width: width_fishseye/(width_fishseye+width_p), //w_offset,
    },

    'view2D_right_init' : {
         heightOffset: h+space,
        height: 1-h-space,    //0.22
        widthOffset: 1.0 - width_fishseye/(width_fishseye+width_p), //1.0 - w_offset,
        width: 0, //w_offset,
    }

}


function getId( id ) { return document.getElementById( id ); }

function resetButtonStyle()
{
    var elements = document.getElementsByClassName('label'); 

    for(var i = 0; i < elements.length; i++)  {
        elements[i].style.backgroundColor = '#' + String('000000' + 
            category[elements[i].id].colors.toString(16)).slice(-6);
        elements[i].style.color = '#fff'; 
    	elements[i].style.fontWeight = 'normal';
    	elements[i].innerHTML = elements[i].id; 

	if (controlHandler.refineview==2 ){
		if (enableNewInstance && category[elements[i].id].instance){
			elements[i].disabled = false;
		}else{
			elements[i].disabled = true;
		}
	}
	else if (controlHandler.refineview==1){
	    if (button_refine.indexOf(elements[i].id) < 0) {
	    	elements[i].disabled = true;
	    }else{
	    	elements[i].disabled = false;
	    }	
	}
	else if (controlHandler.refineview==0 && controlHandler.birdviewAnnotation==false){
		if (elements[i].id == 'sky') {
			elements[i].disabled = true;
		}else{
			elements[i].disabled = false;
			if (controlHandler.dispMode == 6){
				if (appearedLabels.indexOf(elements[i].id) == -1){
					elements[i].disabled = true;
				}
			}
		}
    }
    else if (controlHandler.refineview==0 && controlHandler.birdviewAnnotation==true){
	    if (birdviewClasses.indexOf(elements[i].id) < 0) {
	    	elements[i].disabled = true;
	    }else{
	    	elements[i].disabled = false;
	    }	
    }

    }
}


function changeButtonStyle(classId)
{
    getId( classId ).innerHTML = ">> " + classId + " <<"; 
    getId( classId ).style.color = '#000000';
    getId( classId ).style.fontWeight = '900';
}



function disableButton(classId)
{
    // change the cursor style
    if (!$('#' + classId).hasClass('imageLoader')) {
        getId( classId ).style.cursor = 'text';
    }
}


function show_about(visible) 
{
    //alert('clicked');

    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
        document.getElementById("about_box").className = "show";
        document.getElementById("about_box").style.pointerEvents = "all";
    }
    else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("about_box").className = "hide";
        document.getElementById("about_box").style.pointerEvents = "none";
    }
}

function show_loading(visible) 
{
    if (visible) {
        document.getElementById("about_box_bkg").className = "showhalf";
        document.getElementById("feedback").className = "showhalf";
        document.getElementById("feedback").style.pointerEvents = "all";
    }
    else {
        document.getElementById("about_box_bkg").className = "hide";
        document.getElementById("feedback").className = "hide";
        document.getElementById("feedback").style.pointerEvents = "none";
    }
}

function show_bkg(visible) 
{
    //alert('clicked');

    if (visible) {
        document.getElementById("about_box_bkg").className = "show";
    }
    else {
        document.getElementById("about_box_bkg").className = "hide";
    }
}


function full_screen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
    }
}


function changeManipulationStyle(on, buttonId)
{
    if (on) {
        getId( buttonId ).style.backgroundColor = '#000';
        getId( buttonId ).style.cursor = 'pointer';
        getId( buttonId ).style.color = '#fa0'; 
    }

    else {
        getId( buttonId ).style.backgroundColor = '#000';
        getId( buttonId ).style.cursor = 'text';
        getId( buttonId ).style.color = '#808080';
    }

    enableCentralize = on;
}



function displayMsg(id, str)
{
    document.getElementById(id).innerHTML = str;

    // flash out the msg after a time out
    if (id == 'status') {
        var myTimer = setTimeout(function () {
            document.getElementById('status').innerHTML = currMode; 
        }, 2000);
    }
}

function updateTimer(show)
{
    showTime = timerOffset + workTime;
    if (show) {
        var m = Math.floor(showTime / 60) % 60;
        var h = Math.floor(showTime / 3600);
        var timer =  ('00'+ h).slice(-2) + ':' + ('00'+ m).slice(-2); 
    }
    else{
        var timer = '';
    }
    document.getElementById('timer').innerHTML = timer;
}

 
function updateFrameId(show)
{
    var showFrame = '';
    if (show) {
	    showFrame = currPersCam.name.substring(1);
    }
    document.getElementById('frame_id').innerHTML = showFrame;
}

 
