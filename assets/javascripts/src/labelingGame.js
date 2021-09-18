/**
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
    labelingGame.js
    Purpose: main function for webgl rendering
*/ 


/**
 * Resize the rendering window when browser window size changes
 */
function onWindowResize() {

	console.log(container.parentElement);
	// need to modify if we have different layouts
	container.style.height = $(window).height() - container.parentElement.offsetTop - BOTTOM_MSG + 'px';

	var ratio = (width_fishseye+width_p)/width_h;
	setupViewport(container.clientWidth, container.clientHeight, ratio);

	// update the perspective camera paras
	cameraPerspective.aspect = container.clientWidth*views['view3D'].width / (container.clientHeight*views['view3D'].height);
	cameraPerspective.updateProjectionMatrix();
	
	// update the ortho camera paras
	cameraOrth.aspect = container.clientWidth*views['view3D'].width / (container.clientHeight*views['view3D'].height);
	// var ratio = container.clientWidth*views['view3D'].width / (container.clientHeight*views['view3D'].height);
	cameraOrth.left = -1*cameraOrth.aspect * POS_OrthoCAM.viewSize/2;
	cameraOrth.right = cameraOrth.aspect * POS_OrthoCAM.viewSize/2;
	
	controlsOrth.setBorder(cameraOrth.left, cameraOrth.right)
	
	cameraOrth.updateProjectionMatrix();

	renderer.setSize( container.clientWidth, container.clientHeight );

	var guiSize = $(window).width() - container.parentElement.offsetLeft - container.parentElement.clientWidth;
	if (gui) {
		gui.width = Math.min(guiSize, DAT_GUI_SIZE);
		gui.onResize();
	}
}


/**
 * Init function
 */
function init() {


	displayMsg('status', 'View Mode');
	currMode = 'View Mode';

	// Version Number
	document.getElementById('versionMsg').innerHTML = VERSION; 

	// setup secne
	/*-------------------------------------------------*/
	scene = new THREE.Scene();
	scene3D = new THREE.Scene();
	scene2D = new THREE.Scene();

	background.scene.bgP = new THREE.Scene();
	background.scene.bgF1 = new THREE.Scene();
	background.scene.bgF2 = new THREE.Scene();

	inference.scene.bgP = new THREE.Scene();
	inference.scene.sparseP = new THREE.Scene();

	// geometry for stuff shapes
	polygonPts = new THREE.Geometry();
	polygonPts_line = new THREE.Geometry();
	birdviewPts =  new THREE.Geometry();
	birdviewLine = new THREE.Geometry();
	labels = [];
	labels_helper = [];
	labels_arrow= [];
	changed_labels = false;
	/*-------------------------------------------------*/

	container = document.getElementById( 'container1' );
	console.log(container.parentElement);
	container.style.height = $(window).height() - container.parentElement.offsetTop - BOTTOM_MSG + 'px';


	// locad camera list and setup cameras
	/*-------------------------------------------------*/
	var listName = String('poses/');
	listName = sequence.folderName.concat(listName);
	if (userId == 'dynamicgt'){
		var frameName = sequence.folderName + 'framesDynamicGt.txt';
	}else{
		var frameName = sequence.folderName + 'frames.txt';
	}

	var fullFrameName = sequence.folderName + 'cameraIndex.txt';

	// axisHelper = new THREE.AxisHelper(10);
	// scene3D.add( axisHelper );
	
	loadCameraParaMultiple(listName, frameName);
	loadFullCamList(fullFrameName);
	setupCamera();
	/*-------------------------------------------------*/


	// load point cloud object
	/*-------------------------------------------------*/
	var attributes = {
		customColor: { type: 'c', value: [] },
		cartoonColor: { type: 'c', value: [] },
		zVar: {type: 'f', value: []},
		timestamp: {type: 'f', value: []},
		insideCube: {type: 'f', value: []}
	};

	uniformsShare = {
		color:   { type: 'c', value: new THREE.Color( 0xffffff ) },
		size:    { type: 'f', value: PARTICLE_SIZE.current},
		threshold_max: 	{type: 'f', value: SKY_POS.initial.perspective},
		threshold_min: 	{type: 'f', value: GROUND_POS.initial.perspective},
		jet_max: 	{type: 'f', value: SKY_POS.initial.perspective},
		jet_min: 	{type: 'f', value: GROUND_POS.initial.perspective},
		timestamp_center: 	{type: 'f', value: TIMESTAMP.center.min},
		timestamp_winsize: 	{type: 'f', value: TIMESTAMP.winsize},
		fakeLight: {type: 'f', value: FAKE_LIGHT.current},
		filterOn: {type: 'i', value: 0},
		jetMode: {type: 'i', value: 0},
		slidingPcdOn: {type: 'i', value: 0},
		densePcdOn: {type: 'i', value: 0},
		hideAnnPcdOn: {type: 'i', value: 0},
		center: {type: 'v3', value: new THREE.Vector3( 0.0, 0.0, 0.0)},
		dir: {type: 'v3', value: new THREE.Vector3( 0.0, 1.0, 0.0)},
		radius: {type: 'f', value: FILTER_DIST},
	};

	// put the geomery into shader
	shaderMaterial = new THREE.ShaderMaterial( {
		uniforms: uniformsShare,
		attributes: attributes,
		vertexShader: document.getElementById( 'vertexshader' ).textContent,
		fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
		alphaTest: 0.9,
		side: THREE.DoubleSide,
	} );

	var loadingDone = new Event('done');
	var loader = new THREE.PLYLoader();

	loader.addEventListener( 'load', function ( event ) {

		var plyObj = event.content;
		var geometry = plyObj.Geometry;
		var zVar = plyObj.Zvar;
		var CartoonColor = plyObj.CartoonColor;
		plyTimestamp = plyObj.Timestamp;
		console.log('plyTimestamp',plyTimestamp);
		computeTimeRange(plyTimestamp);

		var particles = new THREE.PointCloud( geometry, shaderMaterial );
		plyParticles = particles;

		//colors
		var values_color = attributes.customColor.value;
		var vertices = particles.geometry.vertices;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			values_color[ v ] = geometry.colors[v];
		}

		//cartoon colors
		var cartoon_color = attributes.cartoonColor.value;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			cartoon_color[ v ] = CartoonColor[v];
		}
		if (cartoon_color[0] === undefined) {
			attributes.cartoonColor.value = values_color;
		}
		// if (cartoon_color[0] === undefined) {
		// 	attributes.cartoonColor.value = values_color;
		// }

		// zvar
		var values_zvar = attributes.zVar.value;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			if (zVar.length > 0)
				values_zvar[v] = zVar[v];
			else 
				values_zvar[v] = 0.5;
		}

		// timestamp and insidecube 
		var values_timestamp = attributes.timestamp.value;
		var values_insideCube = attributes.insideCube.value;
		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			values_insideCube[v] = 0;
			values_timestamp[v] = plyTimestamp[v];
		}
		
		particles.position.set( 0, 0, 0);
		scene3D.add( particles );

		document.dispatchEvent(loadingDone);

		console.log(particles.geometry.vertices.length);

		// Transform the vertices directly
		// also find the center of the point cloud
		var center = new THREE.Vector3(0, 0, 0);
		var subsample = 1;
		var pos = new Float32Array(particles.geometry.vertices.length*3 / subsample);

		for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
			vertices[v].applyMatrix4(sequence.groundTrans);
			center.add(vertices[v]);
			pos[v*3 + 0] = vertices[v].x;
			pos[v*3 + 1] = vertices[v].y;
			pos[v*3 + 2] = vertices[v].z;
		}
		center.divideScalar(vertices.length);
		setCamPosition(center);

		// construc the kdtree
		console.log('Constructing a KDtree');
		var measureStart = new Date().getTime();
		var distanceFunction = function(a, b){
			return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2);
		};
		kdtree = new THREE.TypedArrayUtils.Kdtree( pos, distanceFunction, 3 );
		console.log('TIME building kdtree', new Date().getTime() - measureStart);

		// setup camera possition
		particles.updateMatrixWorld( true );


		// generate middle planes
		getMiddlePlaneBatch();
		console.log(planes);
	} );

	loader.addEventListener( 'progress', function ( event ) {
		console.log(event.loaded + '/' + event.total);
	});

	loader.addEventListener('error', function () {
		alert('fail to load the point cloud' + url);
	});

	var f;

	// _new: original point cloud
	f = String('points.ply'); 
	loader.load( sequence.folderName.concat(f));

	// load dynamic points
	loadPlyDynamic();
	/*-------------------------------------------------*/

	// if (isAdmin || isGtTask){
	//     initDrawTool();
	//     initDrawtoolButton();
	// }

	// set up render 
	/*-------------------------------------------------*/
	setupRenderer();
	setupControllers();
	onWindowResize();
	setupKeyboard();
	/*-------------------------------------------------*/


	/*-------------------------------------------------*/

	for( var c in category ) {
        if (c != 'unknown') {
            initClassButton(c);
            if (readOnly == 1) {
                disableButton(c);
            }
        }
    }

    // it seems that the done button has not been hooked up
	initDoneButton();
	/*-------------------------------------------------*/

		
	updateTimer(true);
	
	// signals
	/*-------------------------------------------------*/
	window.addEventListener( 'resize', onWindowResize, false );
	document.addEventListener('keydown', onDocumentDown, false);
	document.addEventListener("done", loadFinished, false);

	window.addEventListener('focus', focused, false);
	window.addEventListener('blur', blurred, false);

	$(window).on('beforeunload', function() { 
		sendAutoLogs();
		sendUnlock();
	});
	/*-------------------------------------------------*/

	// timer for every 20s (for debug only)
 	if (autoSendLog) {
		setTimeout( setTimeOut(INTERVAL), 5000);
		//setTimeOut(INTERVAL);
	}
	
	// add canvas for scribbling
	canv = document.createElement('canvas');
	canv.id = 'canvas';
        canv.width = 200;
	canv.height = 200;
        canv.style.bottom = "100px";
        canv.style.position = "absolute";
	//canv.style.border = "1px solid";
	context = canv.getContext("2d");
	// avoid smoothing
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;
	context.imageSmoothingEnabled = false; /// future

	// disable the default right click
	$('body').on('contextmenu', '#canvas', function(e){ return false; });

	// add canvas for show semantic from instance
	canv_s = document.createElement('canvas');
	canv_s.id = 'canvas_semantic';
        canv_s.width = 200;
	canv_s.height = 200;
        canv_s.style.bottom = "100px";
        canv_s.style.position = "absolute";
	//canv_s.style.border = "3px solid";
	context_s = canv_s.getContext("2d");
	context_s.webkitImageSmoothingEnabled = false;
	context_s.mozImageSmoothingEnabled = false;
	context_s.imageSmoothingEnabled = false; /// future

	// disable the default right click
	$('body').on('contextmenu', '#canvas_semantic', function(e){ return false; });
}


function focused()
{
	framerate = 60;
}


function blurred()
{
	// when window is blurred, lower down the framerate
	framerate = 10;
}


function closeWindow()
{
	var needUpdate = sendAutoLogs(true);

	if (needUpdate) {
		return 'Last changes have not been saved.';
	}
}

/** 
	Automatic load the annotation from userDrawnDataUrl (if not empty)
*/
function autoLoad()
{
	if (userDrawnDataUrl) {
		loadXmlData(userDrawnDataUrl);
	}
}


function loadFinished()
{
    console.log('finish');
    document.getElementById('page-loader').style.display='none';

    setupGui(); 

}



function animate() {

	setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / framerate );

	render();

	stats.update();
}


/**
 * Rendering function
 */
function render() {

	if (renderer == undefined) return;

	// view 2D
	var fullWidth = container.clientWidth;
	var fullHeight = container.clientHeight;
	switchRenderView('left');
	renderer.autoClear = false;

	updateControlCubes();

	/* configuration
	---------------------------------------
	|    F1    |  |      Perspective      |
	|          |  |                	      |
	=======================================
	|                                     |
	|                 3D                  |
	|                                     |
	---------------------------------------
	*/

	// left view
	/*---------------------------------------------------*/
	// adjust the marker size to the 
	if (currSideCam) {
		var camPos = new THREE.Vector3(currSideCam.matrixWorld.elements[12], currSideCam.matrixWorld.elements[13], 
				currSideCam.matrixWorld.elements[14]);
		var globalScale_left = camPos.distanceTo(controlsPerspective.target)*BALL_SIZE/INTRINSIC.fVirtual;
		controlsPerspective.marker2D.scale.copy(new THREE.Vector3(globalScale_left, 
			globalScale_left, globalScale_left));
	}

	var w = fullWidth*views['view2D_left'].width;
	var h = fullHeight*views['view2D_left'].height;
	var l = fullWidth*views['view2D_left'].widthOffset;
	var b = fullHeight*views['view2D_left'].heightOffset;

	renderer.setViewport(l, b, w, h);
	renderer.setScissor( l, b, w, h );
	renderer.enableScissorTest ( true );
	//renderer.setClearColor( views['view2D_left'].background );

	//if (controlCube2D) controlCube2D.visible = false;
	renderer.clear();
	if (camSide == 'left' && cameraProjection.cameraF1) {
		renderer.render( scene, cameraProjection.cameraF1);
		renderer.render( background.scene.bgF1, cameraPlaneFish);
		renderer.render( scene2D, cameraProjection.cameraF1 );
	}
	else if (camSide == 'right' && cameraProjection.cameraF2) {
		renderer.render( scene, cameraProjection.cameraF2);
		renderer.render( background.scene.bgF2, cameraPlaneFish);
		renderer.render( scene2D, cameraProjection.cameraF2 );
	}
	/*---------------------------------------------------*/


	// center view
	/*---------------------------------------------------*/
	if (currPersCam) {
		camPos = new THREE.Vector3(currPersCam.matrixWorld.elements[12], currPersCam.matrixWorld.elements[13], 
				currPersCam.matrixWorld.elements[14]);
		var globalScale_center = camPos.distanceTo(controlsPerspective.target)*BALL_SIZE/INTRINSIC.f;
		controlsPerspective.marker2D.scale.copy(new THREE.Vector3(globalScale_center, 
			globalScale_center, globalScale_center));
	}

	switchRenderView('center');
	w = fullWidth*views['view2D'].width;
	h = fullHeight*views['view2D'].height;
	l = fullWidth*views['view2D'].widthOffset;
	b = fullHeight*views['view2D'].heightOffset;


	renderer.setViewport(l, b, w, h);
	renderer.setScissor( l, b, w, h );
	renderer.enableScissorTest ( true );
	//renderer.setClearColor( views['view2D'].background );
	//if (controlCube2D) controlCube2D.visible = true;

	renderer.clear();
	if (cameraProjection.cameraP) {
		renderer.render( scene, cameraProjection.cameraP);
		renderer.render( background.scene.bgP, cameraPlane );
		renderer.render( scene2D, cameraProjection.cameraP );
	}
	/*---------------------------------------------------*/


	// view 3D
	switchRenderView('down');
	
	b = fullHeight*views['view3D'].heightOffset;
	h = fullHeight*views['view3D'].height;
	l = fullWidth*views['view3D'].widthOffset;
	w = fullWidth*views['view3D'].width;
	renderer.setViewport(l, b, w, h);
	renderer.setScissor( l, b, w, h );
	renderer.enableScissorTest ( true );
	//renderer.setClearColor( views['view3D'].background );

	renderer.clear();

	updateArrows();

	var globalScale = cameraPerspective.position.distanceTo(controlsPerspective.target)/6.0;
	

	if (view == 'perspective') {
		
		renderer.render( scene3D, cameraPerspective);	
		renderer.render( scene, cameraPerspective);	
		
		controlsPerspective.update(); 
		globalScale = cameraPerspective.position.distanceTo(controlsPerspective.target)/6.0/FOV_SCALE;


		var delta = new THREE.Vector3();
		delta.subVectors(controlsOrth.object.position, controlsOrth.target);
		controlsOrth.target.copy(controlsPerspective.target);
		controlsOrth.object.position.addVectors(controlsOrth.target, delta);
		
	}

	else if (view == 'orth') {
		renderer.render( scene3D, cameraOrth);
		renderer.render( scene, cameraOrth);

		controlsOrth.update(); 
		globalScale = controlsOrth.getZoomFactor()*10.0;

		controlsPerspective.setTarget(controlsOrth.target, false);
	}

	shaderMaterial.uniforms.size.value = controlHandler.ptSizescaleFactor/globalScale;	
}


/** 
 * Switch between up and bottom viewport for renderer
 * @params pos the viewport to switch to
*/
function switchRenderView(pos)
{
	if (pos == 'left') {
		if (objController.controlCubeFish2 ) objController.controlCubeFish2.visible = (camSide == 'right');
		if (objController.controlCubeFish1) objController.controlCubeFish1.visible = (camSide == 'left');
		if (objController.controlCube2D) objController.controlCube2D.visible = false;

		changeBoundingBoxProperty(false);
		
		if (labels.length > 0 || polygonPts.vertices.length > 0) 
		{
			if (background.currImage.imgP) {
				background.currImage.imgP.material.transparent = true;
			}

			if (background.currImage.imgF1) {
				background.currImage.imgF1.material.transparent = true;
			}

			if (background.currImage.imgF2) {
				background.currImage.imgF2.material.transparent = true;
			}
		}

		else {
			if (background.currImage.imgP) {
				background.currImage.imgP.material.transparent = false;
			}

			if (background.currImage.imgF1) {
				background.currImage.imgF1.material.transparent = false;
			}

			if (background.currImage.imgF2) {
				background.currImage.imgF2.material.transparent = false;
			}
		}
	}

	else if (pos == 'center') {

		if (objController.controlCube2D) objController.controlCube2D.visible = true;
		if (objController.controlCubeFish2) objController.controlCubeFish2.visible = false;
		if (objController.controlCubeFish1) objController.controlCubeFish1.visible = false;

		changeBoundingBoxProperty(false);
	}

	else if (pos == 'down') {

		if (objController.controlCube2D) objController.controlCube2D.visible = false;
		if (objController.controlCubeFish2) objController.controlCubeFish2.visible = false;
		if (objController.controlCubeFish1) objController.controlCubeFish1.visible = false;

		changeBoundingBoxProperty(true);	
	}	
}
