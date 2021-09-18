/**
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
    config.js
    Purpose: configuration of the 3D/2D scene
*/ 


/**
	Interface with python
*/
//var taskId; 					// HOOK <taskName>  @taskName, string that contains the name of the selected task

//var userId; 					// HOOK username (<%= current_user.email %>), string with the username of the user (if you needed)

//var isAdmin;					// if is admin or not

//var timerOffset;			// time spent on this task when opening the page 

//var userDrawnDataUrl; //string with an url to the xml file on the server containind the initial user drawn objects

//var isGtTask; 				// if the mini-task is ground truth annotation 

//var refinemode;       // refine or normal mode

timerOffset = parseInt(timerOffset);
isAdmin = parseInt(isAdmin);
isGtTask = parseInt(isGtTask);

var gtTask = 5;


var interfaceTest = true;
var renderId;
var autoSendLog = true;

var idle = 0;
var workTime = 0;
var backupTime = 0;

var framerate = 60;
var finished = false;
var sceneRotation = {x: 0, y:1, z: 0};  // assume y is up

var  numPoses = 0;

var kdtree;
var rootDir = '/static/data/';
var staticDir = '/static/';

var sequence = {

	folderName: rootDir + taskId +"/",
	dirName: rootDir + taskId +"/",
	camMode: 0, // default to display the left camera
	groundTrans: null,
	localPlane: null
}


// frames
var frame = {
	currImg: -1,
	frame_perspective: {
	    width: 1408,
	    height: 376, 
	    offset: {x: 703, y:250},
	},

	frame_fisheye: {
		fVirtual: INTRINSIC.fVirtual,
	    width: 400,
	    height: 400, 
	    offset: {x: 200, y: 200},
	}
}

var viewRatio = 
{
	'perspective': frame.frame_perspective.width/frame.frame_perspective.height,
	'fisheye' : frame.frame_fisheye.width/frame.frame_fisheye.height
}


var controlHandler = {
	orthographic: false,
	meshView: false,
	showAnnotation: true,
	showCam: true,
	imageOpacity: OPACITY.current,
	activeView3D: 1,
	autoCenter: true,
	autoGround: true,
	ptSizescaleFactor: 18,
	dispMode: 0,
	showInstance: true,
	showStuff: true,
	showDynamicPcd: false,
	slidingPcd: false,
	startFrame: TIMESTAMP.center.min,
	endFrame: TIMESTAMP.center.max,
	updateStuff: false,
	planarStuff: false,
	showTimer: true,
	showFrame: false,
	birdviewAnnotation: false,
	refineview: 0,
	refinezoom: false,
	replaceClass: false,
	canv_scale: 1.0,
	canv_offsetx: 0.0,
	canv_offsety: 0.0
};

var paras = {
	level_min:       GROUND_POS.initial.perspective,
	level_max:       SKY_POS.initial.perspective,
	orthographicCam: false
};


// controllers
var controlsOrth;
var controlsPerspective;

var currControlCube = null;
var objController = {
	controlCube: null,
	controlCube2D: null,
	controlCubeFish1: null,
	controlCubeFish2: null,
}


// cameras
var camera; 
var cameraOrth;
var cameraPerspective; 
var cameraPlane;
var cameraPlaneFish;
var cameraProjectionFish;
var view;

var origin;
var axisHelper;

var cameraProjection = {
	cameraP: null,
	cameraF1: null,
	cameraF2: null,
}
var camList; 	//list of string 
var fullCamList;//list of int
var numKeyframes; 

// renders 
var scene;
var sceneBg;
var scene3D;
var scene2D;    // only contain controllers
var stats;

var background = {
	scene: {bgP: {}, bgF1: {}, bgF2: {}},
	currImage: {imgP: null, imgF1: null, imgF2: null},
}

var inference = {
	scene: {bgP: {}, sparseP: {}},
	currImage: {imgP: null, imgS: null},
}
 
var renderer;
var container;

// refinement
var canv;
var canv_s;
var context;
var context_s;
var canv_saved=false;
var canv_changed=false;
var label_png;
var label_png_s;
var scribble = {
	u: [],
	v: [],
	drag: [],
	color: [],
	scale: [],
};
var path = {
	u: [],
	v: [],
	pause: [],
	color: [],
	scale: [],
};
var scribble_s = jQuery.extend(true, {}, scribble);
var path_s = jQuery.extend(true, {}, path);
var enableScribble;
var currColor;
var currColorSemantic;
var eraserColor = 'rgba(0,0,0,1.0)';
var erasing = false;
var buffColor;
var buffColorSemantic;
var button_refine = ['building', 'treeCube', 'sky'];
var instanceColor;
var instance2semantic;

var url_to_send;
var url_to_send_s;
var enableNewInstance=false;
var polygonButtonInit=false;

var zoomWidth;

var texturePerspective;

// draw tool
var enableBrush = true;
var enablePath = false;
var enablePick = false;
var drawMode = 'brush';
var pickData;
var pickColor;
var path_start=null;
var path_cnt=0;

// objs
var labels;
var labels_helper;
var labels_arrow;
var changed_labels;


// virtual cameras
var currSideCam;
var currPersCam;
var activeCam = null;
var camSide = 'right';

// camera poses
var camPoses =
{
	poseP: [],
	poseF1: [],
	poseF2: [],
	poseGround: []
}

var camGroup = {
	wireFrame: [],
	vCamera: [],
	leftCamera: [],
	rightCamera: [],
	localPlane: []
}

var shaderMaterial;
var imgMaterial1, imgMaterial2;

// indexes
var idxPts = 0;
var currentIdx = -1;
var currentBtn;
var INTERSECTED;


// stuff
//0: null state, 1: instance, 2: stuff, 3: birdeye view annotation
var mode = 0;
var polygonPts;
var polygonPts_line;
var pointcloud;
var line;
var myTimer;

// birdeye view annotation
var birdviewPtsCnt=0;
var birdviewPts;
var birdviewLine;
var birdviewClassId;
var birdviewCurve;
var birdviewPointcloud;
var onHoldingBirdview = false;
var birdviewClasses = ['car', 'truck', 'trailer', 'caravan', 'motorcycle', 'bicycle', 'pedestrian', 'box', 'trashbin', 'bigPole', 'smallPole'];

// spline
var currSpline;
var splinePositions = [];
var splineCurves = [];
var splineIsAutoBoxed = [];
var currDynamicSeq = -1;
var currDynamicIdx = -1;
var dynamicVisibilitybyTime = false;
var gridSize = 0.2;
var visibleSeq;
var plyToLoad;
var onHoldingSpline = false;
var scaleUpdated = false;

// load dense pcd
var plyParticleBuffer = [];
var plyVerticeBuffer = [];
var denseLoadingTimestamp = [];
var denseLoadedTimestamp = [];
var uniformsShare;

// particles
var plyParticles;
var plyTimestamp;
var dynamicVertices;
var dynamicTimestamp; 
var dynamicDetected;

// update stuff
var vertexHelpers = [];
var activeVertex;
var clickedVertex;
var controller_stuff;

// planar stuff
var planes = [];
var plane_helpers = [];
var activatedPlane = -1;

var hideAnnClass = [];

// a boolean bit to indicate whether the centralization function is on
var centralizeOn = false;
var centralizeOn_m = false;
var enableCentralize = false;

// a boolean bit to indicate whether to start drawing spline for dynamic object
var dynamicOn = false;

// history
var prevXmlstr = null;

// show one class at one time
var showClassId = 0;
var appearedLabels = [];


var label_color_list;

function loadXmlIntrinsic(baseDir, index)
{
  
  var filename = baseDir + 'intrinsics_' + index.toString() + '.xml';
  var xmlDoc_calb = loadXMLDoc(filename).data;

  
  // perspective camera
  if (index < 2) {
    INTRINSIC.f = Number(xmlDoc_calb.getElementsByTagName('fx')[0].childNodes[0].nodeValue);
    frame.frame_perspective.offset.x = Number(xmlDoc_calb.getElementsByTagName('ox')[0].childNodes[0].nodeValue);
    frame.frame_perspective.offset.y = Number(xmlDoc_calb.getElementsByTagName('oy')[0].childNodes[0].nodeValue);
    frame.frame_perspective.width = Number(xmlDoc_calb.getElementsByTagName('width')[0].childNodes[0].nodeValue);
    frame.frame_perspective.height = Number(xmlDoc_calb.getElementsByTagName('height')[0].childNodes[0].nodeValue);
  }
  // fisheye camera_1
  else if (index >= 2) {
    intrinsic_fish0[index - 2].offset.x = Number(xmlDoc_calb.getElementsByTagName('u0')[0].childNodes[0].nodeValue);
    intrinsic_fish0[index - 2].offset.y = Number(xmlDoc_calb.getElementsByTagName('v0')[0].childNodes[0].nodeValue);
    
    intrinsic_fish0[index - 2].f.x = Number(xmlDoc_calb.getElementsByTagName('gamma1')[0].childNodes[0].nodeValue);
    intrinsic_fish0[index - 2].f.y = Number(xmlDoc_calb.getElementsByTagName('gamma2')[0].childNodes[0].nodeValue);
    
    intrinsic_fish0[index - 2].k.k1 = Number(xmlDoc_calb.getElementsByTagName('k1')[0].childNodes[0].nodeValue);
    intrinsic_fish0[index - 2].k.k2 = Number(xmlDoc_calb.getElementsByTagName('k2')[0].childNodes[0].nodeValue);

    intrinsic_fish0[index - 2].xi = Number(xmlDoc_calb.getElementsByTagName('xi')[0].childNodes[0].nodeValue);
  }
}


/**
 * App entr
 */
function startApp()
{
	// load the label info
	var labelColorFile = staticDir + 'colorList.txt';
	getLabels(labelColorFile);

	var mappingFile = staticDir + 'mapping.txt';
	getMappings(mappingFile);
}



/** 
 * parse user's info and assign folders
 */
function readMeta()
{
	var camMode = [0, 2, 3];
	for (var i = 0; i<camMode.length; i++) {
		loadXmlIntrinsic(sequence.folderName, camMode[i]);
	}

	init();
	autoLoad();

	setupStat();

	animate();	
}



/**
 * Load a single camera pose
 * @params dir pose matrix dir
 * @params filename pose matrix file name
 * @params index index of the pose to be loaded
 * @params mode camera mode (0: perspective 2 left fish_eye 3 right fish_eye)
 */
function loadCameraParaSingle(dir, filename, index, mode, len, visible) {     
	var poses;
	var poseName = dir + filename + '_' + mode + '.txt';
	jQuery.get(poseName, function(data) 
	{
		var d = data;         
		d = d.replace(/\s+/g,' ').trim();         
		poses = d.split(" ");

		var matrixInitial = new THREE.Matrix4();
		
		for (var c in poses) {
			if (c < 16) {
				matrixInitial.elements[c] = poses[c];
			}
			else break;
		}

		// also parse the plane paras
		// Ax + By + Cz  + 1 = 0
		var planePara = new THREE.Vector3(parseFloat(poses[16]), parseFloat(poses[17]), 
			parseFloat(poses[18]));


		// take transpose beause of data streaming order
		matrixInitial.transpose();
		var m = matrixInitial;
		var g = sequence.groundTrans.clone();
		g.multiply(m);

		if (mode == 0) {
			camPoses.poseP[filename] = g;

			var vituralCam = setupVirtualCameras(g);
				
			vituralCam.vCamera.name = 'p'+filename;
			vituralCam.wireFrame.name = 'p' + filename;

			if (typeof visible == 'undefined') {
				vituralCam.vCamera.visible = controlHandler.showCam;
			}
			else {
				vituralCam.vCamera.visible = visible;
			}
			vituralCam.wireFrame.visible = false;

			camGroup.wireFrame.push(vituralCam.wireFrame);
			camGroup.vCamera.push(vituralCam.vCamera);

			scene3D.add(vituralCam.wireFrame);
			scene3D.add(vituralCam.vCamera);


			// also load the ground info
			camPoses.poseGround[filename] = planePara;

			/*********For debugging purpose*************/
			var region = new THREE.Mesh(new THREE.CircleGeometry( 5, 32 ), 
				new THREE.MeshBasicMaterial( {color: 0xffff00, transparent: true, opacity: 0.5, 
											  side: THREE.DoubleSide}));
			// position
			var intersection = planeInterset(planePara, vituralCam.vCamera.position, planePara);
			region.position.set(intersection.x, 
								intersection.y, 
								intersection.z);
			region.visible = false;
			region.name = 'p'+filename;
			// rotation
			region.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), 
												new THREE.Vector3(planePara.x/planePara.length(), 
																  planePara.y/planePara.length(), 
																  planePara.z/planePara.length()));
			camGroup.localPlane.push(region);
			scene3D.add(region);	
			/*********For debugging purpose**************/

			numPoses ++;

			// check if load finished
			if (numPoses == len) {
				// if so, compute the height for ground and sky
				computeRange();
			}

		}

		else if (mode == 2) {
			camPoses.poseF1[filename] = g;

			// configure sideview cameras
			var sideCam = setupSideviewCameras(g, 'left');
			sideCam.vCamera.name = 'l'+filename;
			sideCam.wireFrame.name = 'l'+filename;

			if (typeof visible == 'undefined') {
				sideCam.vCamera.visible = controlHandler.showCam;
			}
			else {
				sideCam.vCamera.visible = visible;
			}
			sideCam.wireFrame.visible = false;

			camGroup.wireFrame.push(sideCam.wireFrame);
			camGroup.vCamera.push(sideCam.vCamera);
			
			scene3D.add(sideCam.wireFrame);
			scene3D.add(sideCam.vCamera);
		}

		else if (mode == 3) {

			camPoses.poseF2[filename] = g;

			// configure sideview cameras
			var sideCam = setupSideviewCameras(g, 'right');
			sideCam.vCamera.name = 'r'+filename;
			sideCam.wireFrame.name = 'r'+filename;

			if (typeof visible == 'undefined') {
				sideCam.vCamera.visible = controlHandler.showCam;
			}
			else {
				sideCam.vCamera.visible = visible;
			}
			sideCam.wireFrame.visible = false;

			camGroup.wireFrame.push(sideCam.wireFrame);
			camGroup.vCamera.push(sideCam.vCamera);
			
			scene3D.add(sideCam.wireFrame);
			scene3D.add(sideCam.vCamera);
		}

		if (index == 0) {
			
			if (mode == 0) {

				currPersCam = vituralCam.wireFrame;
				currPersCam.visible = true;

				cameraProjection.cameraP = new THREE.PerspectiveCamera( FOV, width_p/width_h, NEAR, FAR);
				configCameraProj(g, cameraProjection.cameraP, frame.frame_perspective, INTRINSIC.f);

				objController.controlCube2D = new THREE.TransformControls( cameraProjection.cameraP, renderer.domElement, views['view2D'], false, enableAdvanceControl);
				objController.controlCube2D.addEventListener( 'change', render );
				scene2D.add( objController.controlCube2D );

				objController.controlCube2D.enabled = false;
				objController.controlCube2D.setSize(objController.controlCube2D.size*30);	

				// place the axis to the origin
				origin = new THREE.Vector3(g.elements[12], g.elements[13], g.elements[14]);
				//axisHelper.position.copy(origin); 

				// we also need to estimate the camera angle of the first perspective camera
				sceneRotation.x = g.elements[8];
				sceneRotation.y = g.elements[9];
				sceneRotation.z = g.elements[10];		
			}

			else if (mode == 2) {
				cameraProjection.cameraF1 = new THREE.PerspectiveCamera( FOV, width_fishseye/width_h, NEAR, FAR);
				configCameraProj(g, cameraProjection.cameraF1, frame.frame_fisheye, INTRINSIC.fVirtual);

				// setup controller
				objController.controlCubeFish1= new THREE.TransformControls( cameraProjection.cameraF1, renderer.domElement, views['view2D_left'], false, enableAdvanceControl);
				objController.controlCubeFish1.addEventListener( 'change', render );
				scene2D.add( objController.controlCubeFish1 );

				objController.controlCubeFish1.enabled = false;
				objController.controlCubeFish1.setSize(objController.controlCubeFish1.size*30);	

				objController.controlCubeFish1.setHandlerSize (300/INTRINSIC.fVirtual);
			}

			else if (mode == 3) {
				cameraProjection.cameraF2 = new THREE.PerspectiveCamera( FOV, width_fishseye/width_h, NEAR, FAR);
				configCameraProj(g, cameraProjection.cameraF2, frame.frame_fisheye, INTRINSIC.fVirtual);
				sideCam.wireFrame.visible = true;

				camSide = 'right';
				currSideCam = sideCam.wireFrame;

				// setup controller
				objController.controlCubeFish2 = new THREE.TransformControls( cameraProjection.cameraF2, renderer.domElement, views['view2D_left'], false, enableAdvanceControl);
				objController.controlCubeFish2.addEventListener( 'change', render );
				scene2D.add( objController.controlCubeFish2 );

				objController.controlCubeFish2.enabled = false;
				objController.controlCubeFish2.setSize(objController.controlCubeFish2.size*30);	

				objController.controlCubeFish2.setHandlerSize (300/INTRINSIC.fVirtual);
			}
		}
	})
}


/**
 * Load multiple camera poses at a time
 * @params dir pose files dir
 * @params filename file name of a list of camera names to be loaded
 */
function loadCameraParaMultiple(dir, filename) {     

	// load ground transform
	sequence.groundTrans = new THREE.Matrix4();
	sequence.groundTrans.identity ();

	// load poses
	jQuery.get(filename, function(data) 
	{
		var d = data;         
		d = d.replace(/\s+/g,' ').trim();         
		camList = d.split(" ");
		numKeyframes = camList.length;

		var modes = [0, 2, 3];
		for (var m = 0; m<modes.length; m++) {
			for (var i = 0; i<camList.length; i++) {
				loadCameraParaSingle(dir, camList[i], i, modes[m], camList.length);
				if (i == 0) {
					frame.currImg = Number(camList[i]);
				} 
			}
		}
	})

	.done(function() {
		loadAllImgs(frame.frame_perspective, frame.frame_fisheye, frame.currImg);
	});
}

/**
 * Load all available frames
 * @params filename fine name of all available camera frames
 */
function loadFullCamList(filename) {
	return jQuery.get(filename, function(data) 
	{
		var d = data;         
		d = d.replace(/\s+/g,' ').trim();         
		fullCamList = d.split(" ").map(Number);
	})
}

/**
 * Load all available camera poses at dynamic frames for checking dynamic objects 
 * @params dir pose files dir
 * @params filename file name of a list of camera names to be loaded
 * @params startframe where dynamic object appears
 * @params endframe where dynamic object disappears
 * @params visible whether the virtual cameras is visible or not
 */
function loadCameraParaMultipleDense(dir, filename, startframe, endframe, visible) {     

	var offset = 5;
	startframe = startframe - offset;
	endframe = endframe + offset;

	var addFrames = [];

	if (startframe < fullCamList[0]) {
		startframe = fullCamList[0];
	}
	if (endframe > fullCamList[fullCamList.length-1]) {
		endframe = fullCamList[fullCamList.length-1];
	}
	var startIdx = fullCamList.indexOf(startframe);
	var endIdx = fullCamList.indexOf(endframe);

	// in case the frame list is not continuous, search in a fixed range
	var iter = 0;
	while(startIdx < 0 && iter<5){
		startframe = startframe+1;	
		startIdx = fullCamList.indexOf(startframe);
		iter = iter+1;
	}
	var iter = 0;
	while(endIdx < 0 && iter<5){
		endframe = endframe-1;	
		endIdx = fullCamList.indexOf(endframe);
		iter = iter+1;
	}

	if (startIdx < 0 || endIdx < 0) {
		return;
	}
	
	var modes = [0, 2, 3];
	for (var m = 0; m<modes.length; m++) {
		for (var i = startIdx; i < endIdx; i++) {
			// skip loaded ones
			var framestring = String('0000000000' + fullCamList[i].toString()).slice(-10);
			if (camList.indexOf(framestring) > -1) {continue};
			loadCameraParaSingle(dir, framestring, i, modes[m], -1, visible);
			if (m==0) {
				addFrames.push(framestring);
			}
		}		
	}
	camList = camList.concat(addFrames);
}

function computeRange()
{
	var z_min = 10000, z_max = 0;
	for ( var i in camPoses.poseP) {
		if (camPoses.poseP[i].elements[14] < z_min) z_min = camPoses.poseP[i].elements[14];
		if (camPoses.poseP[i].elements[14] > z_max) z_max = camPoses.poseP[i].elements[14];
	}

	// compute ground range
	GROUND_POS.min = z_min - CARHEIGHT - VERTICAL_HEIGHT_MIN;
	GROUND_POS.max = z_max - CARHEIGHT + VERTICAL_HEIGHT_MIN; 
	GROUND_POS.initial.perspective =  GROUND_POS.min;
	GROUND_POS.initial.othographic =  GROUND_POS.min;

	// compute sky range
	SKY_POS.min = z_min - CARHEIGHT;
	SKY_POS.max = z_max + VERTICAL_HEIGHT_MAX; 
	SKY_POS.initial.perspective =  SKY_POS.max;
	SKY_POS.initial.othographic =  SKY_POS.min;

	// material uniform
	shaderMaterial.uniforms.threshold_min.value = GROUND_POS.initial.perspective;
	shaderMaterial.uniforms.threshold_max.value = SKY_POS.initial.perspective;
}



function setupRenderer ()
{
	// renderer
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( container.clientWidth, container.clientHeight );
	container.appendChild( renderer.domElement );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;

	renderer.domElement.addEventListener( 'dblclick', onDocumentDoubleClick, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseOver, false );
}


/**
 * Setup layout of the scene (called everytime when browser size is changed)
 * @params fullWidth container width
 * @params fullHeight container height
 * @params ratio 2d image width-to-height ratio (should be fixed to avoid distortion)
 */
function setupViewport(fullWidth, fullHeight, ratio)
{

	//var aspectRatio = container.clientWidth / (container.clientHeight*h);

	var width2D = fullWidth*(views['view2D_init'].width + views['view2D_left_init'].width + views['view2D_right_init'].width)
	var height2D = fullHeight*views['view2D_init'].height;

	if (width2D > height2D*ratio) width2D = height2D*ratio;
	else if (width2D < height2D*ratio) height2D = width2D/ratio;

	views['view2D'].width = width2D/fullWidth*views['view2D_init'].width;
	views['view2D'].height = height2D/fullHeight;

	views['view2D_left'].width = width2D/fullWidth*views['view2D_left_init'].width;
	views['view2D_left'].height = height2D/fullHeight;

	views['view2D_right'].width = 0; //width2D/fullWidth*views['view2D_right_init'].width;
	views['view2D_right'].height = height2D/fullHeight;

	// width space
	wSpace = (1.0- views['view2D'].width - views['view2D_left'].width - views['view2D_right'].width)/3;  //4
	views['view2D_left'].widthOffset = wSpace;
	views['view2D'].widthOffset = wSpace + views['view2D_left'].width + views['view2D_left'].widthOffset;
	views['view2D_right'].widthOffset = wSpace + views['view2D'].width + views['view2D'].widthOffset;

	// height space
	views['view2D'].heightOffset = views['view2D_init'].heightOffset + 
	 	(views['view2D_init'].height- views['view2D'].height)/2;
	views['view2D_left'].heightOffset = views['view2D'].heightOffset;
	views['view2D_right'].heightOffset = views['view2D'].heightOffset;

	// refine view
	views['refine_upper'].width = width2D/fullWidth*views['refine_init'].width;
	views['refine_upper'].height = height2D/fullHeight;
	views['refine_upper'].widthOffset = wSpace + views['refine_init'].widthOffset;
	views['refine_upper'].heightOffset = views['view2D_init'].heightOffset + 
	 	(views['view2D_init'].height- views['refine_upper'].height)/2;

	views['refine_middle'].width = width2D/fullWidth*views['refine_init'].width;
	views['refine_middle'].height = height2D/fullHeight;
	views['refine_middle'].widthOffset = wSpace + views['refine_init'].widthOffset;
	views['refine_middle'].heightOffset = views['view2D_init'].heightOffset - views['refine_upper'].height - 0.005  + 
	 	(views['view2D_init'].height- views['refine_middle'].height)/2;

	views['refine_bottom'].width = width2D/fullWidth*views['refine_init'].width;
	views['refine_bottom'].height = height2D/fullHeight;
	views['refine_bottom'].widthOffset = wSpace + views['refine_init'].widthOffset;
	views['refine_bottom'].heightOffset = views['view2D_init'].heightOffset - 2*views['refine_upper'].height - 0.01 + 
	 	(views['view2D_init'].height- views['refine_bottom'].height)/2;
	
}


function setupCamera()
{
	setupCameraPerspective();
	setupCameraOrth();
	view = 'perspective';
	viewOld = view;
}


/**
 * Setup projection-to-2d cameras
 * @params poses camera pose
 * @params cameraProj projection camera to be configured
 */
function setupCameraProjection(poses, cameraProj) {
	
	// very important! tranform camera cs -> opengl cs
	matrixInitial = poses.clone();
	var matrixUpside = new THREE.Matrix4();
	matrixUpside.set(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);
	matrixInitial.multiply(matrixUpside);

	var position = new THREE.Vector3();
	var quaternion = new THREE.Quaternion();
	var scale = new THREE.Vector3();

	matrixInitial.decompose( position, quaternion, scale );

	cameraProj.quaternion.copy( quaternion );
	cameraProj.position.copy( position);
	cameraProj.scale.copy(scale);
	cameraProj.updateProjectionMatrix();
}


/**
 * Setup 3d perspective cameras and 2D image plannar projection camera
 */
function setupCameraPerspective() {

	// image camera -- perpective
	cameraPlane = new THREE.PerspectiveCamera( FOV, viewRatio['perspective'], NEAR, FAR );
	var depth = frame.frame_perspective.height/(2*Math.tan((FOV*Math.PI)/(2*180)));
	cameraPlane.position.set(0, 0, depth);  
	cameraPlane.lookAt(new THREE.Vector3(0, 0, 1)); 

	// image camera -- fisheye
	cameraPlaneFish = new THREE.PerspectiveCamera( FOV,  viewRatio['fisheye'], NEAR, FAR );
    cameraPlaneFish.setLens ( INTRINSIC.f, frame.frame_fisheye.height);
    cameraPlaneFish.position.z = INTRINSIC.f;
    cameraPlaneFish.lookAt(new THREE.Vector3(0, 0, 1)); 

	// perspective camera in 3D
	var viewRatio3D = 1.0;
	cameraPerspective = new THREE.PerspectiveCamera( FOV/FOV_SCALE, viewRatio3D, NEAR*(FOV_SCALE), FAR );
	cameraPerspective.up.set(0, 0, 1);
	cameraPerspective.position.set( POS_PerspectiveCAM.x, POS_PerspectiveCAM.y, POS_PerspectiveCAM.z);
	cameraPerspective.updateProjectionMatrix();
}	


function setCamPosition(center)
{
	// perspective camera
	cameraPerspective.position.set(center.x, center.y, center.z+100*FOV_SCALE);
	controlsPerspective.target.copy(center);

	// orthogonal camera
	cameraOrth.position.set(center.x, center.y, center.z+100);
	controlsOrth.target.copy(center);
}


/**
 * Perspective cameras configuration
 * @params poses camera pose
 * @params cam camera to be configured
 * @params frame camera view info
 * @params focal focal length of the camera
 */
function configCameraProj(poses, cam, frame, focal) {
	cam.setViewOffset( frame.width, frame.height, 0, 0, frame.offset.x, frame.offset.y );
	cam.setLens (focal, frame.height );
	setupCameraProjection(poses, cam);
} 


function changeCameraProjLen(focal, frame0) {

	var f = frame0.height/(2*Math.tan( THREE.Math.degToRad( cameraProjection.cameraF1.fov * 0.5 ) ));

	cameraProjection.cameraF1.setLens (focal, frame0.height );
	cameraProjection.cameraF2.setLens (focal, frame0.height );

	// also need to change the offset correspondently
	frame.frame_fisheye.offset.x = (frame.frame_fisheye.offset.x- frame.frame_fisheye.width/2) *focal/f + 
									frame.frame_fisheye.width/2;
	frame.frame_fisheye.offset.y = (frame.frame_fisheye.offset.y- frame.frame_fisheye.height/2) *focal/f + 
									frame.frame_fisheye.height/2;

	changeVirtualOffset(frame.frame_fisheye.offset.x, 'x');
	changeVirtualOffset(frame.frame_fisheye.offset.y, 'y');

	cameraProjection.cameraF1.updateProjectionMatrix();
	cameraProjection.cameraF2.updateProjectionMatrix();
}



/**
 * Setup orthographical projection camera
 */
function setupCameraOrth() {
	var viewSize = POS_OrthoCAM.viewSize;
	var rect = container.getBoundingClientRect();
	
	var ratio = POS_OrthoCAM.ratio*container.clientWidth / container.clientHeight;
	cameraOrth = new THREE.OrthographicCamera( -ratio*viewSize/2, ratio*viewSize/2, viewSize/2, -viewSize/2, NEAR, FAR);

	cameraOrth.position.set(POS_OrthoCAM.x, POS_OrthoCAM.y, POS_OrthoCAM.z); 
	cameraOrth.updateProjectionMatrix();
}


/**
 * Setup virtual camera which is displayed in the 3D scene
 * @params matrixInitial pose of the camera corresponding to the virtual camera
 * @return virtual camera consisting of the wireframe and pyramid shaped geometry
 */
function setupVirtualCameras(matrixInitial) {

	var transformMx = matrixInitial.clone();

	var camGeo = new THREE.CylinderGeometry( 1, 0, 1.5, 4);
	var singleCam = new THREE.Mesh( camGeo, new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5}));
	
	var camMx = new THREE.Matrix4();
	var cam2Laser = new THREE.Matrix4();
	camMx.set(0, 1, 0, 0, -Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2, 0, 0, 0, 0, 1);
	var tmp = new THREE.Matrix4();
	tmp.set(0, 0, 1, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 1);
	cam2Laser.getInverse(tmp);

	// rotate to get the right pose
	transformMx.multiply(cam2Laser);
	transformMx.multiply(camMx);

	singleCam.applyMatrix(transformMx);
	singleCam.updateMatrixWorld();
	
	var egh = new THREE.EdgesHelper(singleCam, 0xff0000);
	egh.updateMatrixWorld();

	return {wireFrame: egh, vCamera: singleCam};
}



/**
 * Config the sideveiw camaras
 * @params matrixInitial camera position
 * @params dir camera look at direction, could be 'left' or 'right'
 */
function setupSideviewCameras(matrixInitial, dir) {

	var fishGeo = new THREE.SphereGeometry(0.75, 8, 8, 0, Math.PI);
	var sideCam = new THREE.Mesh( fishGeo, new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5}));
	var camMx = new THREE.Matrix4();
	if (dir == 'right') {
		camMx.set(1, 0, 0, 0, 0, 0, -1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
	}
	else {
		camMx.set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);
	}

	var transformMx = matrixInitial.clone();
	var tmp = new THREE.Matrix4();
	tmp.set(0, 0, 1, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 1);
	var cam2Laser = new THREE.Matrix4();
	cam2Laser.getInverse(tmp);

	// rotate to get the right pose
	transformMx.multiply(camMx);
	transformMx.multiply(cam2Laser);


	sideCam.applyMatrix(transformMx);
	sideCam.updateMatrixWorld();

	var egh = new THREE.EdgesHelper(sideCam, 0xff0000);
	egh.updateMatrixWorld();

	return {wireFrame: egh, vCamera: sideCam};
}


/**
 * Setup statistic controllers
 */
function setupStat()
{
	stats = new Stats();
	document.getElementById( 'panel' ).appendChild( stats.domElement );
}


/**
 * Setup controllers 
 */
function setupControllers()
{

	// conterol 1 (3D sence orbit control under perspective view)
	controlsPerspective = new THREE.OrbitControls(cameraPerspective, renderer.domElement, views['view3D']);
	controlsPerspective.target.set(TARGET_CONTROL.perspective.x, TARGET_CONTROL.perspective.y, TARGET_CONTROL.perspective.z);
	cameraPerspective.updateProjectionMatrix();


	scene3D.add(controlsPerspective.marker3D);
	scene3D.add(controlsPerspective.pickerSphere);
	scene2D.add(controlsPerspective.marker2D);

	controlsOrth = new THREE.OrthographicControlsMINE(cameraOrth, renderer.domElement);
	controlsOrth.target.set(TARGET_CONTROL.orth.x, TARGET_CONTROL.orth.y, TARGET_CONTROL.orth.z);
	controlsOrth.enabled = false;
	cameraOrth.updateProjectionMatrix();

	
	// object controller
	objController.controlCube = new THREE.TransformControls( cameraPerspective, renderer.domElement, views['view3D'], 
									true, enableAdvanceControl); //
	objController.controlCube.addEventListener( 'change', render );
	scene3D.add( objController.controlCube );
	currControlCube = objController.controlCube;
}



/** 
* setup timer to automatic send data
*/
function setTimeOut(interval)
{
	 var myTimer = setInterval(function () {sendAutoLogs()}, interval);
}



function stopAutoSave() {
    clearInterval(myTimer);
}
/**
 * search for if exist temp files at the beginning, if yes, automatically load it
 */



function setupKeyboard()
{
	window.addEventListener( 'keydown', function ( event ) {

        if (document.activeElement.type === 'text') return;

        switch ( event.keyCode ) {
	        
        	/*---------------Translate-----------------*/
	        case 87: // W
	            setControlCubes('translate');
	        	break;
	        /*---------------Translate-----------------*/
	 		
	 		/*---------------Rotation-----------------*/
	 		case 69: // E
	            setControlCubes('rotate');
	            break;
	        /*---------------Rotation-----------------*/

			/*---------------Scale-----------------*/
			case 82: // R
	            setControlCubes('scale');
	            break;
			/*---------------Scale-----------------*/

	      	/*---------------toggle Annotation-----------------*/
	      	case 65:  // A
	          	controlHandler.showAnnotation = !controlHandler.showAnnotation;
	          	changeDispMode();
	          	break;
	      	/*---------------toggle Annotation-----------------*/
	      	
			/*---------------toggle Orthographic-----------------*/
	      	case 86:  // V
	          	controlHandler.orthographic = !controlHandler.orthographic;
	          	changeView(controlHandler.orthographic);
	          	break;
	        /*---------------toggle Orthographic-----------------*/

	        /*---------------toggle camera-----------------*/
	    	case 67:  // C
	          	controlHandler.showCam = !controlHandler.showCam;
	          	changeGroupVisbility(camGroup.vCamera, controlHandler.showCam);
			hideDenseCamera(true);
	          	currSideCam.visible = (!centralizeOn) || controlHandler.showCam; 
	          	currPersCam.visible = (!centralizeOn) || controlHandler.showCam; 
	          	break;
	        /*---------------toggle camera-----------------*/

	        /*---------------centralize-----------------*/
	        case 83:   // S -> centralize
			// change stuff to sidewalk
	          	centralize();
	          	break;
	         /*---------------centralize-----------------*/

	         /*---------------reset-----------------*/
	        case 68:   // D -> reset
			// change stuff to driveway 
	        	resetParas();
	        	break;
	        /*---------------reset-----------------*/

	        /*---------------toggle jet mode-----------------*/
	        case 70:   // F -> Feedback Mode
	        	shaderMaterial.uniforms.jetMode.value = 3;
    			checkInsidePrimitive(true);
	        	break;
	        /*---------------toggle jet mode-----------------*/

	        /*---------------toggle z-var mode-----------------*/
	       	case 71:   // G -> toggle var mode
			// change stuff to unknownGround
	        	var index = (shaderMaterial.uniforms.jetMode.value + 1) % 4;
	        	shaderMaterial.uniforms.jetMode.value = index;
	        	break;
	        /*---------------toggle z-var mode-----------------*/

	     	/*---------------finish annotation-----------------*/
	     	case 32:  // space
	     		event.preventDefault();
	     		event.stopPropagation(); 
	     		finishAnnotationSingle();
	          	break;
	    	case 13:  // enter
	          	event.preventDefault();
	          	finishAnnotationSingle();
	          	break;
	        /*---------------finish annotation-----------------*/

	      	/*---------------copy shape-----------------*/
	      	case 80: // P -> copy
			copyShape();
	      		break;
	      	/*---------------copy shape-----------------*/

	      	/*---------------rotate 90 deg-----------------*/
	      	case 81: // Q
	      		rotate90deg();
	      		break;
	      	/*---------------rotate 90 deg-----------------*/

	      	/*---------------stop dynamic-----------------*/
	      	case 16:  // Shift 
			if (dynamicOn == true) {
				// if there is only one object, change its dynamic status
				if (currDynamicIdx == 0) {
					toggleDynamic();
				}
				// end the spline drawing
				else{
					dynamicOn = false;
					attachControlCubes(INTERSECTED, [], false);
					onHoldingSpline = false;
        				splinePositions[currDynamicSeq].pop(); 
        				updateSplineOutline(splineCurves[currDynamicSeq]);
				}
			}
	          	break;
	      	/*---------------stop dynamic-----------------*/

	      	/*---------------Show next class-----------------*/
	      	case 74: // J 
			showSingleClass(1);
	      		break;
	      	/*---------------Show next class-----------------*/

	      	/*---------------Show prev class-----------------*/
	      	case 75: // K 
			showSingleClass(-1);
	      		break;
	      	/*---------------Show prev class-----------------*/

	      	case 33: // pageup
			if (controlHandler.slidingPcd == true){
				if (shaderMaterial.uniforms.timestamp_center.value > TIMESTAMP.center.min){
					shaderMaterial.uniforms.timestamp_center.value = shaderMaterial.uniforms.timestamp_center.value-1;	
				}
				else {
					break;
				}
				moveCamerasToTime(shaderMaterial.uniforms.timestamp_center.value, -1);
			}
			else {
	      			moveCameras(-1);
			}	
	      		break; 
	      	case 34: // pagedown
			if (controlHandler.slidingPcd == true){
				if (shaderMaterial.uniforms.timestamp_center.value < TIMESTAMP.center.max){
					shaderMaterial.uniforms.timestamp_center.value = shaderMaterial.uniforms.timestamp_center.value+1;	
				}
				else {
					break;
				}
				moveCamerasToTime(shaderMaterial.uniforms.timestamp_center.value, +1);
			}
			else {
	      			moveCameras(+1);
			}
	      		break; 

	      	/*---------------update stuff-----------------*/
	        case 85: // U -> Update stuff, switch to planar mode
	          	controlHandler.planarStuff = !controlHandler.planarStuff;
	          	changeStuffMode();
			controller_planar.updateDisplay();
			controller_planar.__prev = controller_planar.__checkbox.checked;

	          	break;
	        /*---------------update stuff-----------------*/

	        /*--------hide annotation and point cloud stuff--------*/
	        case 66: // B -> Hide class
			changeCloudVisbility();
			shaderMaterial.uniforms.hideAnnPcdOn.value=1;	
	          	break;

	        case 89: // Y -> Reset class
			gui.closed = false;
	        	resetCloudVisbility();
			showObjectsbyClass(controlHandler.dispMode);
	          	break;
	        /*--------hide annotation and point cloud stuff--------*/

	        /*-------------update stuff control points-------------*/
	        case 187: // = -> insert stuff control points
	        	updateGroundControlPoints(+1);
	        	break;
	        case 189: // - -> insert stuff control points
	        	updateGroundControlPoints(-1);
	        	break;	
	        /*-------------update stuff control points-------------*/     

	        /*-------------update stuff object heights-------------*/
	        case 48: // 0 -> increase the height of stuff objects
	        	updateGroundHeight(+1);
	        	break;
	        case 57: // 9 -> decrease the height of stuff objects
	        	updateGroundHeight(-1);
	        	break;	
	        /*-------------update stuff object heights-------------*/     


	        /*---------------------x offset-----------------------*/     
	        case 49: // 1 -> decrease the x offset 
			frame.frame_fisheye.offset.x = Math.max( FISHEYE_OFF_X.min, frame.frame_fisheye.offset.x - 10);
			changeVirtualOffset(frame.frame_fisheye.offset.x, 'x');
	        	break;
	        case 50: // 2 -> increase the x offset 
			frame.frame_fisheye.offset.x = Math.min( FISHEYE_OFF_X.max, frame.frame_fisheye.offset.x + 10);
			changeVirtualOffset(frame.frame_fisheye.offset.x, 'x');
	        	break;	

		case 39: // right arrow
	        	break;
		case 37: // left arrow
	        	break;	

	        /*---------------------x offset-----------------------*/     

	        /*---------------------y offset-----------------------*/     
	        case 51: // 3 -> decrease the y offset 
			frame.frame_fisheye.offset.y = Math.max( FISHEYE_OFF_Y.min, frame.frame_fisheye.offset.y - 10);
			changeVirtualOffset(frame.frame_fisheye.offset.y, 'y');
	        	break;
	        case 52: // 4 -> increase the y offset 
			frame.frame_fisheye.offset.y = Math.min( FISHEYE_OFF_Y.max, frame.frame_fisheye.offset.y + 10);
			changeVirtualOffset(frame.frame_fisheye.offset.y, 'y');
	        	break;	

	        case 40: // down arrow 
	        	break;
	        case 38: // up arrow 
	        	break;		

	        /*---------------------y offset-----------------------*/     

	        /*-------------------focal length---------------------*/     
	        case 53: // 5 -> decrease the focal length 
    				var min_focal = frame.frame_fisheye.height/(2*Math.tan( THREE.Math.degToRad(FOV_FISH*0.5)));
						INTRINSIC.fVirtual = Math.max(min_focal, INTRINSIC.fVirtual - 3);
    				changeVirtualFocal(INTRINSIC.fVirtual);
	        	break;

	        case 54: // 6 -> increase the focal length 
						INTRINSIC.fVirtual = Math.min(600, INTRINSIC.fVirtual + 3);
    				changeVirtualFocal(INTRINSIC.fVirtual);
	        	break;	
	        /*-------------------focal length---------------------*/     

		
	        /*-----------------switch draw mode-------------------*/     
	        case 76: // L  
		        if (drawMode == 'brush') drawMode = 'shape';
			else drawMode = 'brush';
			removeCurrentShape();
		        resetDrawtool();
			break;

	        /*-----------------switch draw mode-------------------*/     

	        /*-----------------change opacity-------------------*/     
	        case 79: // o  
			controlHandler.imageOpacity = (controlHandler.imageOpacity + 0.25) % 1;
			background.currImage.imgP.material.opacity = controlHandler.imageOpacity;
			background.currImage.imgF1.material.uniforms.opacity.value = controlHandler.imageOpacity;
			background.currImage.imgF2.material.uniforms.opacity.value = controlHandler.imageOpacity;
			break;

	        /*-----------------change opacity-------------------*/     

	        /*-----------------change opacity-------------------*/     
	        case 27: // Esc  
			removeCurrentShape();
			break;

	        /*-----------------change opacity-------------------*/     

	    }       
	});      
}


/**
 * dynamically change the virtual focal lengh
 * @params newValue new value of the focal length
 */
function changeVirtualFocal(newValue)
{
	// change the right and left camera at the same time

	imgMaterial1.uniforms.focalVirtual.value.x = newValue;
	imgMaterial1.uniforms.focalVirtual.value.y = newValue;

	imgMaterial2.uniforms.focalVirtual.value.x = newValue;
	imgMaterial2.uniforms.focalVirtual.value.y = newValue;

	// change the img plane camera projection
	changeCameraProjLen(newValue, frame.frame_fisheye);
	objController.controlCubeFish1.setHandlerSize (300/newValue);
	objController.controlCubeFish2.setHandlerSize (300/newValue);
}


/**
 * dynamically change the virtual camera offset
 * @params newValue new value of the offsets
 * @params dir direction of the offset, could be 'x' or 'y'
 */
function changeVirtualOffset(newValue, dir)
{
	// change the right and left camera at the same time
	if (dir == 'x') {	

		cameraProjection.cameraF1.setViewOffset( frame.frame_fisheye.width, frame.frame_fisheye.height, 
				0, 0, newValue, frame.frame_fisheye.offset.y );
		imgMaterial1.uniforms.offsetVirtual.value.x = newValue;
		
		cameraProjection.cameraF2.setViewOffset( frame.frame_fisheye.width, frame.frame_fisheye.height, 
				0, 0, newValue, frame.frame_fisheye.offset.y );
		imgMaterial2.uniforms.offsetVirtual.value.x = newValue;
	}	
	else if (dir == 'y') {

		cameraProjection.cameraF1.setViewOffset( frame.frame_fisheye.width, frame.frame_fisheye.height, 
				0, 0, frame.frame_fisheye.offset.x, newValue);
		imgMaterial1.uniforms.offsetVirtual.value.y = newValue;

		cameraProjection.cameraF2.setViewOffset( frame.frame_fisheye.width, frame.frame_fisheye.height, 
				0, 0, frame.frame_fisheye.offset.x, newValue);
		imgMaterial2.uniforms.offsetVirtual.value.y = newValue;
	}

	cameraProjection.cameraF1.updateProjectionMatrix();
	cameraProjection.cameraF2.updateProjectionMatrix();
} 


function changeStuffMode(show){
	if (show==undefined){
		show=controlHandler.showAnnotation;
	}

	getMiddlePlaneBatch();

	
	if (controlHandler.planarStuff==true){
		if (INTERSECTED && INTERSECTED.name.category=='stuff'){
				attachControlCubes(INTERSECTED, [], false);
				// update current stuff object
				activatedPlane = currentIdx;
				controlHandler.updateStuff=true;
				updateStuffObject(activatedPlane);
		}
		changeGroupVisbilitybyLabel(false, 'category', 'stuff');
		for (var i=0; i<planes.length; i++){
			if (planes[i]!=0){
				planes[i].visible = show;
				plane_helpers[i].visible = show;
			}
		}
	}
	else{
		if (INTERSECTED && INTERSECTED.name.category=='stuff'){
				// exist updating stuff object
				controlHandler.updateStuff=false;
				updateStuffObject(activatedPlane);
				activatedPlane=-1;				
				attachControlCubes(INTERSECTED, "translate", true);
		}		
		if (controlHandler.updateStuff==true){
			controlHandler.updateStuff=false;
			updateStuffObject(activatedPlane);
		}
		changeGroupVisbilitybyLabel(show, 'category', 'stuff');
		for (var i=0; i<planes.length; i++){
			if (planes[i]!=0){
				planes[i].visible = false;
				plane_helpers[i].visible = false;
			}
		}
	}		
}

/**
 * Setup DAT.GUI controller
 */
function setupGui() {
	

	var guiSize = $(window).width() - container.parentElement.offsetLeft - container.parentElement.clientWidth;
	gui = new dat.GUI({ width: Math.min(guiSize, DAT_GUI_SIZE)/*; font-size: 10px*/});

	gui.add(controlHandler, 'ptSizescaleFactor', 0, 30, 1).name( 'pointSize' ).listen();

	gui.add( shaderMaterial.uniforms.fakeLight, 'value', FAKE_LIGHT.min, FAKE_LIGHT.max, FAKE_LIGHT.step ).name( 'brightness' );

    var min_focal = frame.frame_fisheye.height/(2*Math.tan( THREE.Math.degToRad(FOV_FISH*0.5)));
    var controller_f = gui.add( INTRINSIC, 'fVirtual', min_focal, 600, 1).name( 'focalLength' ).listen();

    controller_f.onChange(function (newValue) {
    	    changeVirtualFocal(newValue);
    })

	var controller_x = gui.add( frame.frame_fisheye.offset, 'x', FISHEYE_OFF_X.min, FISHEYE_OFF_X.max, 10).name( 'x_offset' ).listen();
	var controller_y = gui.add( frame.frame_fisheye.offset, 'y', FISHEYE_OFF_Y.min, FISHEYE_OFF_Y.max, 10).name( 'y_offset' ).listen();

    controller_x.onChange(function (newValue) {
    	changeVirtualOffset(newValue, 'x');
    })

    controller_y.onChange(function (newValue) {
    	changeVirtualOffset(newValue, 'y');
    })

	var controller_g = gui.add( shaderMaterial.uniforms.threshold_min, 'value', GROUND_POS.min, GROUND_POS.max, 0.01).step(0.01).name('groundPos').listen();
	controller_g.onChange(function (newValue) {
		paras.level_min = newValue;
	})

    var controller_s = gui.add( shaderMaterial.uniforms.threshold_max, 'value', SKY_POS.min, SKY_POS.max, 0.01).step(0.01).name( 'skyPos' ).listen();

	controller_s.onChange(function (newValue) {
		paras.level_max = newValue;
	})

	var controller_t = gui.add( controlHandler, 'imageOpacity', OPACITY.min, OPACITY.max, OPACITY.step).name( 'opacity' ).listen();

	controller_t.onChange(function (newValue) {
		background.currImage.imgP.material.opacity = controlHandler.imageOpacity;
		background.currImage.imgF1.material.uniforms.opacity.value = controlHandler.imageOpacity;
		background.currImage.imgF2.material.uniforms.opacity.value = controlHandler.imageOpacity;
	})

	// DEPRECATED: fov control
	/*var controller_fov = gui.add(cameraPerspective, 'fov', 1, 50, 1).name('fov').listen();
	controller_fov.onChange(function (newValue) {
		cameraPerspective.updateProjectionMatrix();
	})*/

	cameraPerspective.fov = 1;

	var controller_colorMode = gui.add(shaderMaterial.uniforms.jetMode, 'value', 0, 3).step(1).name('colorMode').listen();
	
	var controller_dispyMode = gui.add(controlHandler, 'dispMode', 0, 6).step(1).name('dispMode').listen();
	controller_dispyMode.onChange(function (newValue) {
    	changeDispMode(newValue);
    })

    var controller_timer = gui.add(controlHandler, 'showTimer').name('Show Timer').listen();
    controller_timer.onChange(function (newValue){
    	updateTimer(controlHandler.showTimer);
    })

    var controller_frame = gui.add(controlHandler, 'showFrame').name('Show Frame').listen();
    controller_frame.onChange(function (newValue){
    	updateFrameId(controlHandler.showFrame);
    })

	var controller_birdview = gui.add( controlHandler, 'birdviewAnnotation').name('orthographic').listen();
    controller_birdview.onChange(function (newValue) {
		changeView(controlHandler.birdviewAnnotation);
		resetButtonStyle();
    })

    var controller_a = gui.add( controlHandler, 'showAnnotation').name('All Annotation').listen();	
    controller_a.onChange(function (newValue) {
    	changeDispMode();
    })

    var controller_c = gui.add( controlHandler, 'showCam').name('Cameras (C)').listen();
    controller_c.onChange(function (newValue) {
    	changeGroupVisbility(camGroup.vCamera, controlHandler.showCam);
	hideDenseCamera(true);
    	currSideCam.visible = (!centralizeOn) || controlHandler.showCam; 
	    currPersCam.visible = (!centralizeOn) || controlHandler.showCam; 
    })

  // Default autoCenter on
	// gui.add( controlHandler, 'autoCenter').name('Auto Center').listen();
	

    controller_planar = gui.add( controlHandler, 'planarStuff').name('Planar Stuff').listen().onFinishChange(function () {
    		changeStuffMode();
    });

    // clear annotation
    var obj = { Clear:function() { 
	    	if (readOnly == 1) {
	    		alert('You are currently in view only mode!');
	    		return;
	    	} 
	    	// clear all annotation 
	        if (controlHandler.dispMode!=6){
	    		clearAnnotation ();
		}else
		// clear annotation by class
	    	{
	    		clearAnnotationbyClass ();
		}
    	}
    };
	gui.add(obj,'Clear');

	// Centralize button
    var obj = { Centralize:function() {  
    	centralize();
    	}
    };
	gui.add(obj,'Centralize');

	// reset centralization button
    var obj = { Reset:function() {  
    	resetParas();
    	}
    };
	gui.add(obj,'Reset');

    gui.add(this, "full_screen").name("Full screen");

    var obj = { FeedBack:function() { 
    		shaderMaterial.uniforms.jetMode.value = 3;
    		checkInsidePrimitive(true);
    	}
    };
    gui.add(obj,'FeedBack').name("FeedBack (F)");
	

    var obj = { HideClass:function() { 
		changeCloudVisbility();
		shaderMaterial.uniforms.hideAnnPcdOn.value=1;	
	    }
    };
    gui.add(obj, 'HideClass').name("Hide Class (B)");

    var obj = { ResetClass:function() { 
	        resetCloudVisbility();
		showObjectsbyClass(controlHandler.dispMode);
	    }
    };
    gui.add(obj, 'ResetClass').name("Reset Class (Y)");

    var obj = { ReplaceClass:function() { 
	    	toggleReplaceClass(true);
	    }
    };
    gui.add(obj, 'ReplaceClass').name("Replace Class");

    var obj = { info:function() {  
    		show_about(true);
    	}
    };
    gui.add(obj, 'info').name('Short Cuts').listen();

    var dynamicFolder = gui.addFolder('Dynamic');

    dynamicFolder.add(controlHandler, 'startFrame', TIMESTAMP.center.min, TIMESTAMP.center.max).step(1);
    dynamicFolder.add(controlHandler, 'endFrame', TIMESTAMP.center.min, TIMESTAMP.center.max).step(1);

	var controller_tc = dynamicFolder.add( shaderMaterial.uniforms.timestamp_center, 'value', TIMESTAMP.center.min, TIMESTAMP.center.max, 1).step(1).name('timestamp').listen();
    	controller_tc.onChange(function (newValue) {
    		moveCamerasToTime(newValue);
		//updateDensePly();
    	})

    var controller_spcd = dynamicFolder.add( controlHandler, 'slidingPcd' ).name('sliding pointcloud').listen();
    controller_spcd.onChange(function (newValue) {
	slidingPointCloud();
    })

    var controller_suggestion = dynamicFolder.add(controlHandler, 'showDynamicPcd').name('dynamic suggestion').listen();
    controller_suggestion.onChange(function (newValue){
	    shaderMaterial.uniforms.densePcdOn.value = newValue;
    })
    // toggle dynamic button
    var obj = { IsDynamic:function() { 
    		toggleDynamic();
    	}
    };
    dynamicFolder.add(obj,'IsDynamic');
    // insert a spline control obj after the selected obj 
    var obj = { InsertBox:function() { 
    		insertSplineObject();
    	}
    };
    dynamicFolder.add(obj,'InsertBox');

    // assign timestamp to bounding boxes 
    var obj = { AssignTime:function() {  
    	assignTimestamp();
    	}
    };
	dynamicFolder.add(obj,'AssignTime');
    // automatically compute the bboxes for dynamic objects 
    var obj = { AutoBox:function() {  
    	autoDynamicBbox();
    	}
    };
	dynamicFolder.add(obj,'AutoBox');
    // remove the automatically generated bboxes 
    var obj = { ClearAutoBox:function() {  
    	clearAutoDynamicBbox();
    	}
    };
	dynamicFolder.add(obj,'ClearAutoBox');
    // load dense point cloud for dynamic frames
    var obj = { LoadDenseData:function() {
	   loadPlyMultipleFrame(controlHandler.startFrame, controlHandler.endFrame);
    	} 
    } 
    dynamicFolder.add(obj, 'LoadDenseData');
}


/** 
 * Change the transparency of the bounding box (on/off)
 */
function changeBoundingBoxProperty(on)
{
	for (var i = 0; i<labels.length; i++) {
		labels[i].material.transparent = on;
	}
}


/** 
 * Change the visibility of a specified group
 */
function changeGroupVisbility(group, show, keyword)
{
	if (keyword) {
		for (var i = 0; i<group.length; i++) {
			if (group[i].name.indexOf(keyword) > -1)
				group[i].visible = show;
		}
	}
	else {
		for (var i = 0; i<group.length; i++) {
			group[i].visible = show;
		}
	}
}

function changeGroupVisbilitybyLabel(show, property, keyword)
{
	for (var i = 0; i<labels.length; i++) {
		if ((typeof labels[i].name[property]  === 'string' && labels[i].name[property].indexOf(keyword) > -1) || 
			(typeof labels[i].name[property]  !== 'string' && labels[i].name[property] == keyword)) 
		{
			labels[i].visible = show;
			labels_helper[i].visible = show;
			labels_arrow[i].visible = show;
		}
	}
}

/** 
 * Change the visibility of the spline
 * @params seq Change the specified spline if is given, otherwise
 * 	       change the visibility of all splines 
 */
function changeSplineVisbility(show, seq) {
	if (splineCurves) {
		if (typeof seq !== 'undefined' && seq >= 0) {
			splineCurves[seq].mesh.visible = show;
		}
		else{
		for (var i=0; i<splineCurves.length; i++) {
			splineCurves[i].mesh.visible = show;
		}
		}
	}
}

/** 
 * Switch between perepective and orthographic view
 * @params isOrthographic true if in the orthographic view
*/
function changeView(isOrthographic)
{

	if (!isOrthographic) {
		view = 'perspective';
		displayMsg('status', 'Change to perespctive view mode');
	}
	else {
		view = 'orth';
		displayMsg('status', 'Change to orthographic view mode');
	}
	switchToView(view);
	paras.orthographicCam = isOrthographic;
}

/** 
 * Processes when switch between perspective view and othographical view
 * @params view the view to switch to
 */
function switchToView(view0)
{
	
	view = view0;
	var mode = objController.controlCube.getMode();
	if (view == 'perspective') {
		controlHandler.orthographic = false;
		controlsPerspective.enabled = true;
		controlsOrth.enabled = false;
		objController.controlCube.enabled = true;

		if (INTERSECTED) {
			shaderMaterial.uniforms.threshold_min.value = INTERSECTED.name.level_min;
			shaderMaterial.uniforms.threshold_max.value = INTERSECTED.name.level_max;
		}
		else {
			shaderMaterial.uniforms.threshold_min.value = GROUND_POS.initial.perspective;
			shaderMaterial.uniforms.threshold_max.value = SKY_POS.initial.perspective;
		}	

		paras.level_min = shaderMaterial.uniforms.threshold_min.value;
		paras.level_max = shaderMaterial.uniforms.threshold_max.value;
	}

	else if (view == 'orth') {

		// first find the closest camera
		var center = new THREE.Vector3(controlsPerspective.marker3D.matrixWorld.elements[12], 
							   controlsPerspective.marker3D.matrixWorld.elements[13],
							   controlsPerspective.marker3D.matrixWorld.elements[14]);
		
		controlHandler.orthographic = true;
		controlsPerspective.enabled = false;
		controlsOrth.enabled = true;
		objController.controlCube.enabled = false;

		if (INTERSECTED) {
			shaderMaterial.uniforms.threshold_min.value = INTERSECTED.name.level_min;
			shaderMaterial.uniforms.threshold_max.value = INTERSECTED.name.level_max;
		}
		else {
			shaderMaterial.uniforms.threshold_min.value = GROUND_POS.min; //currentPos.height - VERTICAL_HEIGHT_MIN;
			shaderMaterial.uniforms.threshold_max.value = GROUND_POS.max; //currentPos.height + VERTICAL_HEIGHT_MIN;
		}

		paras.level_min = shaderMaterial.uniforms.threshold_min.value;
		paras.level_max = shaderMaterial.uniforms.threshold_max.value;
	}

	viewOld = view;
}


/** 
 * Switch between 3D and 2D view
 * @params isOrthographic true if in the orthographic view
*/
var needSwitch = false;
function changeActiveView(is3d)
{		
	if ( currControlCube===null)
		return;

	currControlCube.enabled = false;
	
	// 3d view
	if (is3d == 1) {
		currControlCube = objController.controlCube;
		currControlCube.enabled = (view != 'orth');
	}
	// center view
	else if (is3d == 0) {
		currControlCube = objController.controlCube2D;
		currControlCube.enabled = true;
	}
	//left view
	else if (is3d == -1) {
		if (camSide == 'left') {
			currControlCube = objController.controlCubeFish1;
		}
		else {
			currControlCube = objController.controlCubeFish2;
		}
		currControlCube.enabled = true;
	}
}

/** 
 * Attach/detach all the control cubes in different views
 * @params obj object to be attached/detached
 * @params mode mode after attaching the object
 * @params isAttach atatch the object if true and detach the object if false
*/
function attachControlCubes(obj, mode, isAttach)
{
	for (var c in  objController) {
		if (isAttach) {
			objController[c].attach(obj, mode);
			objController[c].update();
			objController[c].addEventListener( 'mouseUp', function(e) {
				changed_labels = true;
			});
			if (obj.name.dynamic==1 && obj.name.dynamicIdx>-1 && currSpline){
				objController[c].addEventListener( 'objectChange', function(e){
					updateSplineOutline(currSpline);
				});
				objController[c].addEventListener( 'objectScale', updateControlCubesScale);
				if (splineIsAutoBoxed[obj.name.dynamicSeq]==1) {
					objController[c].addEventListener( 'mouseUp', fixedControlObj);
				}
			}
			else if (obj.name.dynamic==1 && obj.name.dynamicIdx==-2){
				objController[c].addEventListener( 'mouseUp', fixedOnSpline);
			}
		}
		else {
			if (obj.name.dynamic==1 && obj.name.dynamicIdx>-1 ){
				objController[c].removeEventListener( 'objectChange', function(e){
					updateSplineOutline(currSpline);
				});
				objController[c].removeEventListener( 'mouseUp', fixedControlObj);
				objController[c].removeEventListener( 'objectScale', updateControlCubesScale);
			}
			else if (obj.name.dynamic==1 && obj.name.dynamicIdx==-2){
				objController[c].removeEventListener( 'mouseUp', fixedOnSpline);
			}
			objController[c].detach(obj);
			objController[c].update();
		}
	}
}

/**
 * Undo modification on control cubes if it is not scaling
 */
function fixedControlObj(event){
	if (scaleUpdated == true){
		scaleUpdated = false;
	}else{
		undoMove();
		alert('ClearAutoBox before transforming the control object');
	}
}

function updateArrows()
{
	if (INTERSECTED)
		updateArrow(labels_arrow[currentIdx], INTERSECTED.quaternion, INTERSECTED.scale, INTERSECTED.position);
}


/** 
 * Set the property of all the control cubes in different views
 * @params mode mode to be set
*/
function setControlCubes(mode)
{
	for (var c in  objController) {
		objController[c].setMode(mode);
	}
}


/** 
 * update all the control cubes in different views
*/
function updateControlCubes()
{
	for (var c in  objController) {
		if (objController[c]) objController[c].update();
	}
}


function showAll(show)
{
	changeGroupVisbility(labels, show);
	changeGroupVisbility(labels_helper, show);
	changeGroupVisbility(labels_arrow, show);
	changeSplineVisbility(show);
}



/**
 * change the visibility of bounding box
 */
function changeAnnotationVis()
{
	// disable this function under centralization mode
	if (!centralizeOn) {

		showAll(controlHandler.showAnnotation);
		changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
		dynamicVisibilitybyTime = false;

		// always hide the classes in hideAnnClass list
		for (var i=0; i<hideAnnClass.length; i++){
			changeGroupVisbilitybyLabel(false, 'label', hideAnnClass[i]);
		}


		if (INTERSECTED && !controlHandler.showAnnotation) {
    		INTERSECTED.visible = true;
    		labels_helper[currentIdx].visible = true;
    		labels_arrow[currentIdx].visible = true;
    	}

		if (controlHandler.dispMode == 1) {
			changeGroupVisbilitybyLabel(false, 'category', 'stuff');
			changeStuffMode(false);
		}
		else if (controlHandler.dispMode == 2) {
			changeGroupVisbilitybyLabel(false, 'category', 'instance');
			changeStuffMode();
		}
		else if (controlHandler.dispMode == 3) {
			changeGroupVisbilitybyLabel(false, 'dynamic', 1);
			changeSplineVisbility(false);
			changeStuffMode();
		}
		else if (controlHandler.dispMode == 4) {
			dynamicVisibilitybyTime = true;
			changeGroupVisbilitybyLabel(false, 'dynamic', 0);
			changeVisibilitybyTime(shaderMaterial.uniforms.timestamp_center.value);
		}
		else if (controlHandler.dispMode == 5) {
			showAll(false);
			visibleSeq = INTERSECTED?INTERSECTED.name.dynamicSeq:-2;
			changeSplineVisbility(true, visibleSeq);
			changeGroupVisbilitybyLabel(true, 'dynamicSeq', visibleSeq);
			changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
			dynamicVisibilitybyTime = true;
		}
		else if (controlHandler.dispMode == 6) {
			showSingleClass();
		}

		if (controlHandler.dispMode != 6){
			resetButtonStyle();
		}
    }
}


function showObjectsbyClass(newvalue)
{
	if (centralizeOn) return;
	changeAnnotationVis();
}


function changeDispMode(newValue) {
	if (typeof newValue !== 'undefined') {
		controlHandler.dispMode = newValue;
	}

	if (!controlHandler.showAnnotation) {
		if (controlHandler.dispMode == 1) displayMsg('mode', 'Highlighted Mode (instance object)');
		else if (controlHandler.dispMode == 2) displayMsg('mode', 'Highlighted Mode (stuff object)');
		else if(controlHandler.dispMode == 3) displayMsg('mode', 'Highlighted Mode (static object)');
		else displayMsg('mode', 'Highlighted Mode');
	}
	else {
		if (controlHandler.dispMode == 1) displayMsg('mode', 'Normal Mode (instance object)');
		else if (controlHandler.dispMode == 2) displayMsg('mode', 'Normal Mode (stuff object)');
		else if (controlHandler.dispMode == 3) displayMsg('mode', 'Normal Mode (static object)');
		else if (controlHandler.dispMode == 4) displayMsg('mode', 'Normal Mode (dynamic object)');
		else if (controlHandler.dispMode == 5) displayMsg('mode', 'Normal Mode (single dynamic object)');
		else displayMsg('mode', '');
	}

	showObjectsbyClass(controlHandler.dispMode);
}


/** 
 * compute max, min and median value of timestamp 
*/
function computeTimeRange(timestamp) {
  TIMESTAMP.center.min = arrayMin(timestamp);
  TIMESTAMP.center.max = arrayMax(timestamp);
  shaderMaterial.uniforms.timestamp_center.value = Math.round((TIMESTAMP.center.min+TIMESTAMP.center.max)*0.5);
  controlHandler.startFrame = shaderMaterial.uniforms.timestamp_center.value;
  controlHandler.endFrame = shaderMaterial.uniforms.timestamp_center.value;
} 

function arrayMin(arr) {
  var len = arr.length, min = Infinity;
  while (len--) {
    if (arr[len] < min) {
      min = arr[len];
    }
  }
  return min;
}

function arrayMax(arr) {
  var len = arr.length, max = -Infinity;
  while (len--) {
    if (arr[len] > max) {
      max = arr[len];
    }
  }
  return max;
}

function loadPlySingleFrame () {
	var l = denseLoadingTimestamp.length;
	if ( l < 1) {
          	document.getElementById('bottomMsg').innerHTML = 'Loading done.'; 
  		setTimeout(function () {
          		document.getElementById('bottomMsg').innerHTML = ''; 
      		}, 1500);

		// densely load the images for dynamic frames
		var listName = String('poses/');
		listName = sequence.folderName.concat(listName);
		var frameName = sequence.folderName + 'cameraIndex.txt';
		loadCameraParaMultipleDense(listName, frameName, controlHandler.startFrame, controlHandler.endFrame, false);     
	        return; 
	}
        displayMsg('bottomMsg', 'Loading dense point cloud ' + (plyToLoad-l+1).toString() + '/' +
		       plyToLoad.toString() +' ... ');
	var frame = denseLoadingTimestamp.pop();
	denseLoadedTimestamp.push(frame);
	var framename = String('00000000' + frame.toString()).slice(-6); 
	var filename = 'points_' + framename + '.ply';
	// load point cloud object
	/*-------------------------------------------------*/
	var attributes = {
		customColor: { type: 'c', value: [] },
		cartoonColor: { type: 'c', value: [] },
		zVar: {type: 'f', value: []},
		timestamp: {type: 'f', value: []},
		insideCube: {type: 'f', value: []}
	};
	

	// another shader for loading point clouds per frame
	var shaderMaterialSingle = new THREE.ShaderMaterial( {
		uniforms: uniformsShare,
		attributes: attributes,
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		alphaTest: 0.9,
		side: THREE.DoubleSide,
	} );
	
	var loadingDone = new Event('singleLoadDone');
	var loaderPlySingleFrame = new THREE.PLYLoader();
	loaderPlySingleFrame.addEventListener( 'load', function ( event ) {
	
		var plyObj = event.content;
		var geometry = plyObj.Geometry;
		var zVar = plyObj.Zvar;
	
		var particles = new THREE.PointCloud( geometry, shaderMaterialSingle );
		plyVerticeBuffer.push(particles.geometry.vertices);
	
		//colors, cartoon_color and timestamp are constant
		var values_color = shaderMaterialSingle.attributes.customColor.value;
		var cartoon_color = shaderMaterialSingle.attributes.cartoonColor.value;
		var values_timestamp = shaderMaterialSingle.attributes.timestamp.value;
		var values_insideCube = shaderMaterialSingle.attributes.insideCube.value;
		var vertices = particles.geometry.vertices;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			values_color[ v ] = new THREE.Color(0xFFFFFF);
			cartoon_color[ v ] = new THREE.Color(0xFFFFFF);
			values_insideCube[ v ] = 0;
			// plus 0.1 to distinguish from the sparse pcd 
			values_timestamp[v] = frame + 0.1;
		}
		
		// zvar
		var values_zvar = shaderMaterialSingle.attributes.zVar.value;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			if (zVar.length > 0)
				values_zvar[v] = zVar[v];
			else 
				values_zvar[v] = 0.5;
		}
		
		particles.position.set( 0, 0, 0);

		// display dense frames no more than the upper bound 
		if (plyToLoad<=MAX_DENSE_FRAME){	
			scene3D.add( particles );
			plyParticleBuffer.push( particles );
		}
		else{
			var interval = Math.max( 2, Math.round(plyToLoad/(plyToLoad - MAX_DENSE_FRAME)));
			if ((plyToLoad-l)%interval > 0 ) {
				scene3D.add( particles );
				plyParticleBuffer.push( particles );
			}
			else {
				console.log('skipping display ', plyToLoad-l);
				// push emtry array to keep the index in consistence with denseLoadedTimestamp
				plyParticleBuffer.push( [] );
			}
		}
		
		console.log(particles.geometry.vertices.length);

		document.dispatchEvent(loadingDone);
	
	} );
	loaderPlySingleFrame.addEventListener( 'progress', function ( event ) {
		console.log(event.loaded + '/' + event.total);
	});
	
	loaderPlySingleFrame.addEventListener('error', function () {
		alert('fail to load the point cloud' + url);
	});

	loaderPlySingleFrame.load( sequence.folderName.concat(filename));
}

/**
 * load dense ply file one by one, avoid effecting the web interface
 * @params startframe Specified start frame
 * @params endframe   Specified end frame
 */
function loadPlyMultipleFrame(startframe, endframe) {
	plyToLoad = endframe-startframe+1;
	if (endframe-startframe <= 0) {
		alert('The endframe should be larger than the startframe!');
		return;	
	}
	if (plyToLoad>MAX_DENSE_FRAME) {
		if(!confirm('Frames more than ' + MAX_DENSE_FRAME.toString() + ' will be sparsified, are you sure to continue?')) {
			return;
		}
	}

	// remove loaded frames not in the range to save space
	for (var i=denseLoadedTimestamp.length-1; i>=0; i--){
		if (denseLoadedTimestamp[i] < startframe || denseLoadedTimestamp[i] > endframe) {
			denseLoadedTimestamp.splice(i, 1);
			scene3D.remove(plyParticleBuffer[i]);	
			plyParticleBuffer.splice(i,1);
			plyVerticeBuffer.splice(i,1);
		}	
	}

	// frames to be loaded
	for (var frame = startframe; frame<=endframe; frame++){
		if (fullCamList.indexOf(frame) > -1 &&
				denseLoadedTimestamp.indexOf(frame) < 0) {
			denseLoadingTimestamp.push(frame);
		}	
	}

	loadPlySingleFrame();	
	document.addEventListener("singleLoadDone", loadPlySingleFrame, false);
}

function loadPlyDynamic () {

	// load point cloud object
	/*-------------------------------------------------*/
	var attributes = {
		customColor: { type: 'c', value: [] },
		cartoonColor: { type: 'c', value: [] },
		zVar: {type: 'f', value: []},
		timestamp: {type: 'f', value: []}
	};
	

	// another shader for loading point clouds per frame
	var shaderMaterialSingle = new THREE.ShaderMaterial( {
		uniforms: uniformsShare,
		attributes: attributes,
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		alphaTest: 0.9,
		side: THREE.DoubleSide,
	} );
	
	var loaderPlyDynamic = new THREE.PLYLoader();
	loaderPlyDynamic.addEventListener( 'load', function ( event ) {
	
		var plyObj = event.content;
		var geometry = plyObj.Geometry;
		dynamicTimestamp = plyObj.Timestamp;
	
		var particles = new THREE.PointCloud( geometry, shaderMaterialSingle );
	
		//colors, cartoon_color and zvar are constant
		//read timestamp from file
		var values_color = shaderMaterialSingle.attributes.customColor.value;
		var cartoon_color = shaderMaterialSingle.attributes.cartoonColor.value;
		var values_zvar = shaderMaterialSingle.attributes.zVar.value;
		var values_timestamp = shaderMaterialSingle.attributes.timestamp.value;
		dynamicVertices = particles.geometry.vertices;
		for( var v = 0,  vl = dynamicVertices.length; v < vl; v++ ) {
			values_color[ v ] = new THREE.Color(0xFFFFFF);
			cartoon_color[ v ] = new THREE.Color(0xFFFFFF);
			values_zvar[v] = 0.5;
			// plus 0.1 to distinguish from the sparse pcd 
			values_timestamp[v] = dynamicTimestamp[v] + 0.1;
		}
		
		particles.position.set( 0, 0, 0);
		scene3D.add( particles );

		console.log(dynamicVertices.length);
	} );
	loaderPlyDynamic.addEventListener( 'progress', function ( event ) {
		console.log(event.loaded + '/' + event.total);
	});
	
	loaderPlyDynamic.addEventListener('error', function () {
		alert('fail to load the point cloud' + url);
	});

	var filename = 'dense_dynamic_points.ply';
	loaderPlyDynamic.load( sequence.folderName.concat(filename));
}
