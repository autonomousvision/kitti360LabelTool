/**
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
    processing.js
    Purpose: Processing the user's action
*/ 
function activateColorPicking(){
	enablePick = true;
	var bt = getId('brush');
	bt.disabled = true;
	bt = getId('drawpath');
	bt.disabled = true;
	resetDrawtool();
}


/**
 * Cancel ondrawing shape;
 */
function removeCurrentShape(){
	// use an over-large count to delete all items from the start point
	var splice_cnt = path.u.length;
	path.u.splice(path_cnt, splice_cnt);
	path.v.splice(path_cnt, splice_cnt);
	path.pause.splice(path_cnt, splice_cnt);
	path.color.splice(path_cnt, splice_cnt);

	path_s.u.splice(path_cnt, splice_cnt);
	path_s.v.splice(path_cnt, splice_cnt);
	path_s.pause.splice(path_cnt, splice_cnt);
	path_s.color.splice(path_cnt, splice_cnt);
	
	path_cnt = path.u.length;
	path_start = null;
	if (controlHandler.canv_scale==1.0)
  	  sendCanvas();
}


function initDrawtoolButton () {
	getId( 'newinstance' ).addEventListener( 'click', function(){
		enableNewInstance = true;
		resetButtonStyle();
	})  

	getId( 'brush' ).addEventListener( 'click', function(){
		drawMode = 'brush';
		removeCurrentShape();
		resetDrawtool();
	})  

	getId( 'drawpath' ).addEventListener( 'click', function(){
		drawMode = 'shape';
		removeCurrentShape();
		resetDrawtool();
	})  

	getId( 'pickcolor' ).addEventListener( 'click', function(){
		removeCurrentShape();
		activateColorPicking();
	})  
}

function resetDrawtool(){
	if (drawMode == 'brush'){
		var bt = getId('brush');
    		bt.innerHTML = '&#9679 &#9679 &#9679 brush &#9679 &#9679 &#9679';
    		bt.style.fontWeight = '900';
    		bt.style.color = '#000';

		var bt = getId('drawpath'); 
    		bt.innerHTML = 'polygon';
    		bt.style.fontWeight = 'normal';
    		bt.style.color = '#fff';
	}
	else{
		var bt = getId('drawpath'); 
    		bt.innerHTML = '&#151 &#151 &#151 polygon &#151 &#151 &#151 ';
    		bt.style.fontWeight = '900';
    		bt.style.color = '#000';

		var bt = getId('brush'); 
    		bt.innerHTML = 'brush';
    		bt.style.fontWeight = 'normal';
    		bt.style.color = '#fff';
	}
	if (enablePick){
		var bt = getId('pickcolor');
    		bt.style.color = '#000';
    		bt.style.fontWeight = '900';
    		bt.innerHTML = '>>> picking color <<<';
	}else{
		var bt = getId('pickcolor');
    		bt.style.color = '#fff';
    		bt.style.fontWeight = 'normal';
    		bt.innerHTML = 'color picked';
	}

}

/**
 * Category button call back functions
 * @param classId id of the catergory button
 */
function initClassButton (classId) {
 
	// button controls
	getId( classId ).addEventListener( 'click', function() {

		if(readOnly == 1)  return;

		// dynamicSeq is the dynamic sequence which object belongs to
		// dynamicIdx is the index of spline control object in current sequence
		//            assigned with -2 for all automatically generated bboxes 
		// timestamp is the specific frame which bbox belongs to
		// all values valid when dynamic == 1
		//

		// Replace current activated primitive with specified new class
		if (controlHandler.replaceClass){
			var isinstance_pre = INTERSECTED.name.category=='instance';
			var isinstance_new = $('#' + classId).hasClass('instance');
			if ( isinstance_pre != isinstance_new ){
				alert('Cannot replace classes across instance and stuff objects!');;
				toggleReplaceClass(false);
				return;
			}
			if (classId == 'treeSphere') {
				alert('Cannot replace classes as treeSphere!');;
				toggleReplaceClass(false);
				return;
			}
			if (INTERSECTED.name.dynamic==0){
				INTERSECTED.name.label = category[classId].type;
				INTERSECTED.name.buttonId = classId;
				INTERSECTED.material.color = new THREE.Color(category[classId].colors);
			}else{
				var currSeq = INTERSECTED.name.dynamicSeq;
				for (var i=0; i<labels.length; i++){
					if (labels[i].name.dynamicSeq == currSeq) {
						labels[i].name.label = category[classId].type;
						labels[i].name.buttonId = classId;
						labels[i].material.color = new THREE.Color(category[classId].colors);
					}
				}
			}
    			changed_labels = true;
			toggleReplaceClass(false);
			currentBtn = classId;
			resetButtonStyle();
			changeButtonStyle(classId);
			return;
		}

		var info = {
				label : category[classId].type,
				category: '',
				level_min : paras.level_min,
				level_max : paras.level_max,
				buttonId: classId,
				stack: [],
				dynamic: 0,
				dynamicSeq: -1,
				dynamicIdx: -1,
				timestamp: -1,
                                globalIndex: -1,
			}


		displayMsg('status', 'create a shape with label ' + category[classId].type);


		// when a new obj annotation starts, enable the view3D control mode
		if (INTERSECTED) 
			attachControlCubes(INTERSECTED, [], false);
		
		controlHandler.activeView3D = 1;
		changeActiveView(controlHandler.activeView3D);

		// if the previous annotation for stuff hasn't finished yet. Delete it directly.
		if (idxPts > 0) {
			// clear data
			polygonPts.vertices = [];
			polygonPts_line.vertices = [];
			idxPts = 0;

			scene.remove(pointcloud);
			scene.remove(line);
		}


		// instance mode
		if ($('#' + classId).hasClass('instance') && controlHandler.birdviewAnnotation == false)
		{
			
			// if current in the stuff mode, change to normal mode
			if (controlHandler.dispMode == 2)
				changeDispMode(0);

			mode = 1;
			info.category = 'instance';
			var cube;
			if (classId == 'treeSphere') {
				cube = addTreePrimitive(classId, info);
			}

			else {
				var cubeGeometry = new THREE.BoxGeometry( 1, 1, 1);

				var trans = info.dynamic ? dynamicopacity : category[classId].opacity;
				cube = new THREE.Mesh( cubeGeometry, new THREE.MeshBasicMaterial( { color: category[classId].colors, wireframe: 0, 
				wireframeLinewidth: 2, transparent: true, opacity: trans, side: THREE.DoubleSide} ));    //wireframe: true
				cube.scale.set (category[classId].scale[0], category[classId].scale[1], category[classId].scale[2]);
				
				cube.name = info;
				cube.geometry.computeBoundingBox();
				cube.geometry.computeBoundingSphere();
				
				labels.push(cube);
				scene.add(cube);	
				// Marks it as changed.
    				changed_labels = true;

				// also add the edge helper
				var wireframe = new THREE.EdgesHelper(cube, WIREFRAME_COLOR[info.dynamic]);
				wireframe.material.linewidth = 2;
				wireframe.updateMatrixWorld();
				labels_helper.push(wireframe);	
				scene.add(wireframe);

				// allocate for stuff planes
				planes.push(0);
					  plane_helpers.push(0);
					  
			}


			if (INTERSECTED) {
				labels[currentIdx].name.level_min = paras.level_min;
				labels[currentIdx].name.level_max = paras.level_max;
				labels_helper[currentIdx].material.linewidth = 1;

				INTERSECTED.visible = controlHandler.showAnnotation;
				labels_helper[currentIdx].visible = controlHandler.showAnnotation;
				labels_arrow[currentIdx].visible = controlHandler.showAnnotation;
				
				// also clear the state stack
				INTERSECTED.name.stack = [];
				// push the current transformation to the stack
				category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();

				// TODO: CHANGES NEEDED
				// not nan
				//if (INTERSECTED.name.level_min !==  INTERSECTED.name.level_min)
				category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
				category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;
				
				INTERSECTED = null;
			}

			// at this point, INTERSECTED is always null 
			switchToView('perspective');

			INTERSECTED = cube;
			currentIdx = labels.length - 1;

			var center = new THREE.Vector3(controlsPerspective.marker3D.matrixWorld.elements[12], 
							   controlsPerspective.marker3D.matrixWorld.elements[13],
							   controlsPerspective.marker3D.matrixWorld.elements[14]);
			var currentPos = computeGround(center);

			// compute the rotation angle of the nearest camera w.r.t. wcs
			// not the optimal solution, but a good way for hacking
			var tz = new THREE.Vector3(currentPos.mx.elements[8], currentPos.mx.elements[9], currentPos.mx.elements[10]);
			var theta = Math.atan(tz.y/tz.x);
			cube.rotation.z = theta;


			if (category[classId].stack.matrix != null) {
				var position = new THREE.Vector3();
				var quaternion = new THREE.Quaternion();
				var scale = new THREE.Vector3();

				category[classId].stack.matrix.decompose( position, quaternion, scale );
				
				cube.quaternion.copy(quaternion);
				cube.scale.copy(scale);

				// copy sea level
				cube.name.level_min = category[classId].stack.level_min;
				cube.name.level_max = category[classId].stack.level_max;
				switchToView(view);
			}


			// at last, change the position
			cube.position.setFromMatrixPosition(controlsPerspective.marker3D.matrixWorld);
			cube.position.z = currentPos.height + cube.geometry.boundingBox.max.z*cube.scale.z;			

			// add an arrow to indicate orientation
			var arrow = addArrow(info.label);
			updateArrow(arrow, cube.quaternion, cube.scale, cube.position);
			labels_arrow.push(arrow);

			// always attach at last
			attachControlCubes(cube, "translate", true);


			// re-centralize 
			if (centralizeOn) {
				centralize();
			}
		}

		// line to primitive mode
		else if ($('#' + classId).hasClass('instance') && controlHandler.birdviewAnnotation == true){
			mode = 3;
			birdviewClassId = classId;
			info.category = 'instance';
			birdviewInfo = info;
		}


		// stuff mode
		else if ($('#' + classId).hasClass('stuff'))
		{
			
			// if current in the instance mode, change to normal mode
			if (controlHandler.dispMode == 1)
				changeDispMode(0);

			mode = 2;

			if (INTERSECTED) {

				labels[currentIdx].name.level_min = paras.level_min;
				labels[currentIdx].name.level_max = paras.level_max;
				labels_helper[currentIdx].material.linewidth = 1;

				// since we have disabled the centralization function for the stuffs,
				// we first turn off the centralization function for the stuff objs
				resetParas(true);

				INTERSECTED.visible = controlHandler.showAnnotation;
				labels_helper[currentIdx].visible = controlHandler.showAnnotation;
				labels_arrow[currentIdx].visible = controlHandler.showAnnotation;

				INTERSECTED.name.stack = [];
				// push the current transformation to the stack
				category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();


				category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
				category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;
			}	

			INTERSECTED = null;

			// change to orthographic view for annotation
			switchToView('orth');

			// copy sea level
			if (category[info.buttonId].stack.matrix != null) {
								
				paras.level_min = shaderMaterial.uniforms.threshold_min.value;
				paras.level_max = shaderMaterial.uniforms.threshold_max.value;
			}

			if (centralizeOn) {
				resetParas(true);
			}

		}

		currentBtn = classId;
		resetButtonStyle();
		changeButtonStyle(classId);

		// defocus the button
		$('#' + classId).blur();
	}, 

	false );
}


function addArrow(label)
{

	var dir = new THREE.Vector3( 1, 0, 0 );
	var origin = new THREE.Vector3(0, 0, 0);
	var arrow = new THREE.ArrowHelper( dir, origin, 4, 0xff0000 );

 	for (var i = 0; i<orientedObj.length; i++) {
 		if (label == orientedObj[i]) {
 			scene3D.add(arrow);
 		}
 	}

	return arrow;
}


function updateArrow(arrow, quaternion, scale, position)
{
	arrow.quaternion.copy(quaternion);
	arrow.position.copy(position);
	arrow.rotation.z -= Math.PI/2;
}




function rotate90deg()
{
	if (INTERSECTED && readOnly != 1) {
		INTERSECTED.rotation.z += Math.PI/2;
		if (INTERSECTED.rotation.z>Math.PI) {
			INTERSECTED.rotation.z -= Math.PI * 2;
		}
		if (INTERSECTED.rotation.z<-Math.PI) {
			INTERSECTED.rotation.z += Math.PI * 2;
		}
		var tmp = INTERSECTED.scale.x;
		INTERSECTED.scale.x = INTERSECTED.scale.y;
		INTERSECTED.scale.y = tmp;
		var q = new THREE.Quaternion();
		q.setFromEuler(INTERSECTED.rotation);

		INTERSECTED.matrixWorldNeedsUpdate = true;
		displayMsg('status', 'roate the shape in 90 deg counterclockwise');

		var state = {position: INTERSECTED.position.clone(), quaternion: q.clone(), 
			scale: INTERSECTED.scale.clone()};
		INTERSECTED.name.stack.push(state);
	}
}



/**
 * Copy the current selcted shape to the current camera position
 * @params position specify the position of new added object, the same with the selected shape if undefined
 * @params rotation specify the rotation of new added object, the same with the selected shape if undefined
 */
function copyShape(position, rotation)
{
	if (INTERSECTED && readOnly != 1) {

		var shape = INTERSECTED.clone();
		var zValue = INTERSECTED.position.z;

		// deep copy if shape.name is an object
		if (isObject(shape.name))
		{
			shape.name = $.extend(true, {}, INTERSECTED.name);
		}
		labels[currentIdx].name.level_min = paras.level_min;
		labels[currentIdx].name.level_max = paras.level_max;
		labels_helper[currentIdx].material.linewidth = 1;
		

		shape.name.stack = [];
		shape.name.timestamp = -1;
		INTERSECTED.name.stack = [];
		// push the current transformation to the stack
		category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();
		category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
		category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;

		attachControlCubes(INTERSECTED, [], false);
		controlHandler.activeView3D = 1;

		INTERSECTED.visible = controlHandler.showAnnotation;
		labels_helper[currentIdx].visible = controlHandler.showAnnotation;
		labels_arrow[currentIdx].visible = controlHandler.showAnnotation;

		INTERSECTED = shape;
		INTERSECTED.geometry.computeBoundingBox();

		//shape.position.getPositionFromMatrix(currSideCam.matrixWorld);
		shape.position.setFromMatrixPosition(controlsPerspective.marker3D.matrixWorld);
		// also align the z axis with the previous selected object
		shape.position.z = zValue;

		if (position) {
			shape.position.copy(position);
		}
		if (rotation) {
			shape.rotation.copy(rotation);
		}

		// copy sea level
		INTERSECTED.name.level_min = category[INTERSECTED.name.buttonId].stack.level_min;
		INTERSECTED.name.level_max = category[INTERSECTED.name.buttonId].stack.level_max;
		switchToView(view);

		labels.push(shape);
		scene.add(shape);
		// Marks it as changed.
		changed_labels = true;

		// edge helper
		var wireframe = new THREE.EdgesHelper(shape, WIREFRAME_COLOR[INTERSECTED.name.dynamic]);
		wireframe.material.linewidth = 2;
		wireframe.updateMatrixWorld();
		labels_helper.push(wireframe);	
		scene.add(wireframe);	

		// arrow
		var arrow = addArrow(INTERSECTED.name.label);
		updateArrow(arrow, shape.quaternion, shape.scale, shape.position);
		labels_arrow.push(arrow);

		currentIdx = labels.length - 1;

		var mode = currControlCube.getMode();
		attachControlCubes(shape, mode, true);

		// under the centralization mode, centralize again
		if (centralizeOn) {
			centralize();
		}

		displayMsg('status', 'copy the current shape');

		return shape;

	}

}


/**
 * Action after done button is activated
 */
function initDoneButton () 
{
	getId('save_user').addEventListener( 'click', function(event) {
		event.preventDefault();
		finishAnnotationSingle();
		stopAutoSave();
		
		finished = true;
		sendLogs();
    return false;
	}
  );
}	


function defocusButtons(c)
{
	for( var c in category ) 
	{
		if (c != 'unknown') {	
			$('#' + c).blur();
		}
	}
}


/**
 * Action when an edition is finished
 */
function finishAnnotationSingle()
{
	if (INTERSECTED) {

		labels[currentIdx].name.level_min = paras.level_min;
		labels[currentIdx].name.level_max = paras.level_max;
		labels_helper[currentIdx].material.linewidth = 1;
		
		if (!controlHandler.showAnnotation) {
			controlHandler.showAnnotation = true;
		}
		changeDispMode();
		

		resetParas(true);

		INTERSECTED.name.stack = [];
		// push the current transformation to the stack
		category[INTERSECTED.name.buttonId].stack.matrix= INTERSECTED.matrixWorld.clone();
		category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
		category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;

		if (readOnly != 1) {
			attachControlCubes(INTERSECTED, [], false);
		}

		INTERSECTED = null;
		currentIdx = -1;
		mode = 0;
		resetButtonStyle();


		resetSeaLevel();
	}
}

function resetSeaLevel(){
	// make the sea level to normal
	if (view == 'perspective') {
		shaderMaterial.uniforms.threshold_min.value = GROUND_POS.initial.perspective;
		shaderMaterial.uniforms.threshold_max.value = SKY_POS.initial.perspective;
	}

	else if(view == 'orth') {
		switchToView('orth');
	}

	paras.level_min = shaderMaterial.uniforms.threshold_min.value;
	paras.level_max = shaderMaterial.uniforms.threshold_max.value;
}


/**
 * Action when annotations are cleared
 */
function clearAnnotation()
{
	if(confirm('Are you sure to swipe all the annotated data?')) {
		for (var i = 0; i<labels.length; i++) {
			scene.remove(labels[i]);
			scene.remove(labels_helper[i]);
			scene.remove(line);
			scene.remove(line); 
			scene.remove(pointcloud);

			scene3D.remove(labels_arrow[i]);
		}

		if (!controlHandler.showAnnotation) {
			controlHandler.showAnnotation = true;
		}
		changeDispMode(0);

		if (INTERSECTED) {
		 	
		 	attachControlCubes(INTERSECTED, [], false);
		 	resetParas();
		 	
			currentIdx = -1;
			mode = 0;
			//changeManipulationStyle(false, 'center');
			
			INTERSECTED.name.stack = [];
			// push the current transformation to the stack
			category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();
			category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
			category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;

			INTERSECTED = null;
		}

		resetButtonStyle();
		labels = [];
		labels_helper = [];
		polygonPts.vertices = [];
		polygonPts_line.vertices = [];
		labels_arrow = [];

		// clear spline
		for (var i = 0; i<splineCurves.length; i++){
			scene.remove(splineCurves[i].mesh);
		}
		splineCurves = [];
		splinePositions = [];
		splineIsAutoBoxed = [];
		currDynamicSeq = -1;
		currDynamicIdx = -1;

		// reset to original perspective view
		switchToView('perspective');
	}
}

/**
 * Action when annotations of current activated class are cleared
 */
function clearAnnotationbyClass()
{
	if(confirm('Are you sure to swipe all the \'\'' + appearedLabels[showClassId] + '\'\'?')) {
		for (var i=labels.length-1; i>=0; i--) {
                        if (labels[i].name['buttonId'].indexOf(appearedLabels[showClassId]) > -1){
				scene.remove(labels[i]);
				scene.remove(labels_helper[i]);
				scene3D.remove(labels_arrow[i]);

				labels.splice(i, 1);
				labels_helper.splice(i, 1);
				labels_arrow.splice(i, 1);
			}
		}

		if (!controlHandler.showAnnotation) {
			controlHandler.showAnnotation = true;
		}
		changeDispMode(0);

		if (INTERSECTED) {
		 	
		 	attachControlCubes(INTERSECTED, [], false);
		 	resetParas();
		 	
			currentIdx = -1;
			mode = 0;
			//changeManipulationStyle(false, 'center');
			
			INTERSECTED.name.stack = [];
			// push the current transformation to the stack
			category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();
			category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
			category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;

			INTERSECTED = null;
		}

		resetButtonStyle();
	}
}


function clearDict( dict ){
	var keys = Object.keys(dict);
	for (var i=0; i<keys.length; i++){
		dict[keys[i]] = [];
	}
}


/**
 * Change the display image in a bundle manner
 * @param currName the name of the image to be displayed (without '.jpg')
 */
function changeImg(currName)
{
	// load images
	loadAllImgs(frame.frame_perspective, frame.frame_fisheye, currName);

	// load poses
	var pose = new THREE.Matrix4();

	pose = camPoses.poseP[currName];
	setupCameraProjection(pose, cameraProjection.cameraP);

	pose = camPoses.poseF1[currName];
	setupCameraProjection(pose, cameraProjection.cameraF1);

	pose = camPoses.poseF2[currName];
	setupCameraProjection(pose, cameraProjection.cameraF2);

	var filename0 = String('0000000000' + currName).slice(-10);
	var curr = $.grep(camGroup.wireFrame, function(e){ return e.name == filename0; });
    var currLeft = $.grep(camGroup.leftCamera, function(e){ return e.name == filename0; });
    var currRight = $.grep(camGroup.rightCamera, function(e){ return e.name == filename0; });
    
    changeGroupVisbility(camGroup.wireFrame, false);
    
    curr[0].visible = true;
}


/**
 * Change the display image
 * @param currName the name of the image to be displayed (without '.jpg')
 */
function changeImgSingle(currName)
{

	var filename0 = String('0000000000' + currName.substring(1)).slice(-10); 
	var curr = $.grep(camGroup.wireFrame, function(e){ return e.name == currName; });
	var currCam = curr[0];
	

	var pose = new THREE.Matrix4();

	if (currName[0] == 'p') {
		// perspective camera
		var f = String('image_00/');
		var imgName = sequence.folderName.concat(f);
		loadImgPerspective(imgName + filename0 +'.jpg', frame.frame_perspective) ;

		// clear refinement annotation of the previous image 
		path_start = null;
		path_cnt = 0;

		clearDict(scribble);
		clearDict(path);
		
		clearDict(scribble_s);
		clearDict(path_s);

		canv_changed = false;
		canv_saved = false;

		pose = camPoses.poseP[filename0];
		setupCameraProjection(pose, cameraProjection.cameraP);

		changeGroupVisbility(camGroup.wireFrame, false, 'p');
		currCam.visible = true;
		currPersCam = curr[0];

		return false;
	}

	else if (currName[0] == 'l') {
		// left fisheye camera
		f = String('image_02/');
		imgName = sequence.folderName.concat(f);
		loadImgFish(imgName + filename0 +'.jpg', frame.frame_fisheye, 'fisheye1');

		pose = camPoses.poseF1[filename0];
		setupCameraProjection(pose, cameraProjection.cameraF1);

		camSide = 'left';

		changeGroupVisbility(camGroup.wireFrame, false, 'l');
		changeGroupVisbility(camGroup.wireFrame, false, 'r');
		currCam.visible = true;

		if (currSideCam === curr[0]) return false;
		currSideCam = curr[0];
	}

	else if (currName[0] == 'r') {
		// right fisheye camera
		f = String('image_03/');
		imgName = sequence.folderName.concat(f);
		loadImgFish(imgName + filename0 +'.jpg', frame.frame_fisheye, 'fisheye2') ;

		pose = camPoses.poseF2[filename0];
		setupCameraProjection(pose, cameraProjection.cameraF2);

		camSide = 'right';

		changeGroupVisbility(camGroup.wireFrame, false, 'l');
		changeGroupVisbility(camGroup.wireFrame, false, 'r');
		currCam.visible = true;

		if (currSideCam === curr[0]) return false;
		currSideCam = curr[0];
	}

	return true;
}



/**
 * generate random colors
 * @params: size of the color number
 */
function getRandomColor(size) {
    if (!size) size = 0;
    var letters = '0123456789ABCDEF'.split('');
    var color = '0x';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.max(size, Math.random() * 16))];
    }
    return parseInt(color,16);
}


/**
 * Control button call back functions
 * @params buttonId id of the control button
*/
function initControlButton (buttonId) {
 
	getId( buttonId ).addEventListener( 'click', function() {
		
		// image next/prev action
		if ($('#' + buttonId).hasClass('imageLoader')) {

			if (buttonId == 'prev') {
				var ind = frame.currImg - SAMPLE;
				frame.currImg = Math.max(sequence.firstFrame, ind);
			} 
			else if (buttonId == 'next') {
				var ind = frame.currImg + SAMPLE;
				frame.currImg = Math.min(sequence.lastFrame, ind);
			}

			changeImg(String('0000000000' + frame.currImg).slice(-10));
			
		}		
	}, 

	false );
}


/**
 * Construct the tree 3D primitives 
 * @params classId id of tree (sphere)
 * @params name of tree (sphere)
 * @return tree sphere primitve
*/
function addTreePrimitive(classId, info) {
	
	var sphereGeometry = new THREE.SphereGeometry( 1 );
	var leaf = new THREE.Mesh(sphereGeometry, new THREE.MeshBasicMaterial( { color: category[classId].colors, wireframe: 0, 
				wireframeLinewidth: 2, transparent: true, opacity: category[classId].opacity, side: THREE.DoubleSide} ));
	leaf.position.set(0, 0.15, 0);
	leaf.scale.set (category[classId].scale[0], category[classId].scale[1], category[classId].scale[2]);
    leaf.name = info;
    leaf.geometry.computeBoundingBox();

    labels.push(leaf);
    scene.add(leaf);
    // Marks it as changed.
    changed_labels = true;

    // also add the edge helper
	var wireframe = new THREE.EdgesHelper(leaf, WIREFRAME_COLOR[info.dynamic]);
	wireframe.material.linewidth = 2;
	wireframe.updateMatrixWorld();
	labels_helper.push(wireframe);	
	scene.add(wireframe);	


	
	return leaf;
}


/**
 * Auto close condition detection for ground shape polygon completion
*/
function autoClose()
{
	if (idxPts > 2) {
		if (polygonPts_line.vertices[0] != polygonPts_line.vertices[idxPts-1]) {
			// close the loop
			polygonPts_line.vertices[idxPts] = polygonPts_line.vertices[0];
			line.geometry.verticesNeedUpdate = true;
			// make the left points in polygonPts to be the same with the last valid point
			for (var i = idxPts+1; i<LINE_PTS; i++) { 
			polygonPts_line.vertices[i] = 
				new THREE.Vector3( polygonPts_line.vertices[idxPts].x, polygonPts_line.vertices[idxPts].y, 
								   polygonPts_line.vertices[idxPts].z);
			}
			idxPts ++;
		}

		scene.remove(line);
		scene.remove(pointcloud);

		// allocate for stuff planes
		planes.push(0);
		plane_helpers.push(0);

		// Hard coding below
		var wireframe;
		if (controlHandler.autoGround) {
			wireFrame = createGroundShapeFlexible(polygonPts_line, idxPts, HORIZONTAOL_DELTA, currentBtn);
		}
		else {
			wireFrame = createGroundShape(polygonPts_line, idxPts, paras.level_min, paras.level_max, currentBtn);
		}
		mode = 0;

		var info = {
			label : category[currentBtn].type,
			category : 'stuff',
			level_min : paras.level_min,
			level_max : paras.level_max,
			buttonId: currentBtn,
			stack: [],
			dynamic: 0,
			dynamicSeq: -1,
			dynamicIdx: -1,
			timestamp: -1 
		}
		
		groundShape = wireFrame.mesh;
		groundShape.name = info;
		labels.push(groundShape);
		groundShape.visible = !controlHandler.planarStuff;
		scene.add( groundShape );
		getMiddlePlane(groundShape);
		// Marks it as changed.
    		changed_labels = true;
		
		wireframe = new THREE.EdgesHelper_adv(groundShape, WIREFRAME_COLOR[0], MIN_DIST);		 
		wireframe.material.linewidth = 2;
		wireframe.updateMatrixWorld();
		labels_helper.push(wireframe);	
		wireframe.visible = !controlHandler.planarStuff;
		scene.add(wireframe);

		// arrow
		var arrow = addArrow(info.label);
 		groundShape.geometry.computeBoundingBox();
		updateArrow(arrow, groundShape.quaternion, groundShape.scale, groundShape.position);
		labels_arrow.push(arrow);

		groundShape.geometry.computeBoundingBox();
		
		currentIdx = labels.length - 1;

		if (groundShape.visible==true){
			INTERSECTED = groundShape;
			attachControlCubes(groundShape, 'translate', true);
			objController.controlCube.space = 'world';

			// change to perspective view automatically
			objController.controlCube.enabled = true;
			switchToView('perspective');			
		}
		else{
			activatedPlane = currentIdx;
			controlHandler.updateStuff=true;
			updateStuffObject(activatedPlane);			
		}

			

		// clear data
		polygonPts.vertices = [];
		polygonPts_line.vertices = [];
		idxPts = 0;

	} 

	else {
		// todo: output an error msg
	}

}

/**
 * Construct a 3D primitive given a line
*/
function autoLineToBox(){

	scene.remove(birdviewCurve);
	scene.remove(birdviewPointcloud);

	// sanity check
	var dx = birdviewPts.vertices[0].x - birdviewPts.vertices[1].x;
	var dy = birdviewPts.vertices[0].y - birdviewPts.vertices[1].y;
	var minDis = 2.0;
	if (birdviewInfo.label == 'pedestrian' || birdviewInfo.label == 'smallPole' || birdviewInfo.label == 'bigPole'){
		minDis = 0.3;
	}
	if (Math.sqrt(dx*dx + dy*dy) < minDis){
		birdviewPts.vertices = [];
		birdviewLine.vertices = [];
		birdviewPtsCnt = 0;
		return;
	}

	var cubeGeometry = new THREE.BoxGeometry( 1, 1, 1);

	var trans = category[birdviewClassId].opacity;
	cube = new THREE.Mesh( cubeGeometry, new THREE.MeshBasicMaterial( { color: category[birdviewClassId].colors, wireframe: 0, 
	wireframeLinewidth: 2, transparent: true, opacity: trans, side: THREE.DoubleSide} ));    //wireframe: true
	cube.scale.set (category[birdviewClassId].scale[0], category[birdviewClassId].scale[1], category[birdviewClassId].scale[2]);
	
	cube.name = birdviewInfo;
	cube.geometry.computeBoundingBox();
	cube.geometry.computeBoundingSphere();
	
	labels.push(cube);
	scene.add(cube);	
	// Marks it as changed.
	changed_labels = true;

	// also add the edge helper
	var wireframe = new THREE.EdgesHelper(cube, WIREFRAME_COLOR[birdviewInfo.dynamic]);
	wireframe.material.linewidth = 2;
	wireframe.updateMatrixWorld();
	labels_helper.push(wireframe);	
	scene.add(wireframe);

	// allocate for stuff planes
	planes.push(0);
	plane_helpers.push(0);
	

	// rotation
	var theta = Math.atan2((birdviewPts.vertices[1].y - birdviewPts.vertices[0].y), (birdviewPts.vertices[1].x - birdviewPts.vertices[0].x));
	cube.rotation.z = theta;

	// position
	cube.position.x = (birdviewPts.vertices[0].x + birdviewPts.vertices[1].x)/2;
	cube.position.y = (birdviewPts.vertices[0].y + birdviewPts.vertices[1].y)/2;
	cube.position.z = (birdviewPts.vertices[0].z + birdviewPts.vertices[1].z)/2;

	// scale, hacky heuristic initialization for y and z, better idea?
	cube.scale.x = Math.sqrt(dx*dx + dy*dy);
	if (birdviewInfo.label == 'car' || birdviewInfo.label == 'trailer'){
		cube.scale.y = cube.scale.x*0.55;
		cube.scale.z = cube.scale.x*0.4;
		console.log('cube.scale.y', cube.scale.y);
		console.log('cube.scale.z', cube.scale.z);
	}
	else if(birdviewInfo.label == 'caravan'){
		cube.scale.y = cube.scale.x*0.55;
		cube.scale.z = cube.scale.x*0.5;
	}
	else if(birdviewInfo.label == 'truck'){
		cube.scale.y = 6.0;
		cube.scale.z = 3.5;
	}
	else if(birdviewInfo.label == 'motorcycle' || birdviewInfo.label == 'bicycle'){
		cube.scale.y = cube.scale.x*0.3;
		cube.scale.z = cube.scale.x*0.6;
	}
	else if (birdviewInfo.label == 'bigPole'){
		cube.scale.y = cube.scale.x;
		cube.scale.z = 10.0;
	}
	else if (birdviewInfo.label == 'pedestrian' || birdviewInfo.label == 'smallPole'){
		cube.scale.y = cube.scale.x;
		cube.scale.z = cube.scale.x * 4.0;
	}
	else{ // box, trashbin
		cube.scale.y = cube.scale.x;
		cube.scale.z = cube.scale.x;
	}
	
	// align the bottom of the cube and the ground
	var currentPos = computeGround(cube.position);
	cube.position.z = currentPos.height + cube.geometry.boundingBox.max.z*cube.scale.z;		

	cube.updateMatrixWorld();

	// shrink cube to fit point cloud
	cube = autoFitPointCloud(cube, currentPos);

	// // add an arrow to indicate orientation
	var arrow = addArrow(birdviewInfo.label);
	updateArrow(arrow, cube.quaternion, cube.scale, cube.position);
	labels_arrow.push(arrow);

	// always attach at last
	// attachControlCubes(cube, "translate", true);

	// clear data
	birdviewPts.vertices = [];
	birdviewLine.vertices = [];
	birdviewPtsCnt = 0;


}

function autoFitPointCloud(cube, currentPos){
	// iteratively shrink the bounding box till converge
	var pointsInCubeIndexPre = null;
	var pointsInCubeIndex = getPointsInCubeSparse(pointsInCubeIndexPre, cube);
	var pointsCntFull = pointsInCubeIndex.length;

	// shrink x-axis
	var iter_cnt=0;
	while (true){
		cube.scale.x = cube.scale.x * 0.98;
		cube.updateMatrixWorld();
		pointsInCubeIndexPre = pointsInCubeIndex;
		pointsInCubeIndex = getPointsInCubeSparse(pointsInCubeIndexPre, cube);
		pointsCnt = pointsInCubeIndex.length;

		// recover the last scale
		if (pointsCnt < pointsCntFull * 0.99){
			cube.scale.x = cube.scale.x * (1 / 0.98) * 1.01;
			pointsInCubeIndex = pointsInCubeIndexPre;
			break;
		}

		if (iter_cnt>20){
			break;
		}

		iter_cnt++;
	}

	// shrink y-axis
	iter_cnt = 0;
	pointsCntFull = pointsInCubeIndex.length;

	while (true){
		cube.scale.y = cube.scale.y * 0.98;
		cube.updateMatrixWorld();
		pointsInCubeIndexPre = pointsInCubeIndex;
		pointsInCubeIndex = getPointsInCubeSparse(pointsInCubeIndexPre, cube);
		pointsCnt = pointsInCubeIndex.length;

		// recover the last scale
		if (pointsCnt < pointsCntFull * 0.99){
			cube.scale.y = cube.scale.y * (1 / 0.98) * 1.01;
			pointsInCubeIndex = pointsInCubeIndexPre;
			break;
		}

		if (iter_cnt>40){
			break;
		}

		iter_cnt++;
	}

	// shrink z-axis
	iter_cnt = 0;
	pointsCntFull = pointsInCubeIndex.length;
	while (true){
		cube.scale.z = cube.scale.z * 0.98;
		cube.position.z = currentPos.height + cube.geometry.boundingBox.max.z*cube.scale.z;		
		cube.updateMatrixWorld();
		pointsInCubeIndexPre = pointsInCubeIndex;
		pointsInCubeIndex = getPointsInCubeSparse(pointsInCubeIndexPre, cube);
		pointsCnt = pointsInCubeIndex.length;

		// recover the last scale and enlarge a bit
		if (pointsCnt < pointsCntFull * 0.99){
			cube.scale.z = cube.scale.z * (1 / 0.98) * 1.01;
			cube.position.z = currentPos.height + cube.geometry.boundingBox.max.z*cube.scale.z;	
			pointsInCubeIndex = pointsInCubeIndexPre;	
			break;
		}

		if (iter_cnt>80){
			break;
		}

		iter_cnt++;
	}	

	return cube;
}


/**
 * Construct a 3D ground shape primitive
 * @params: controlPts control points of the polygon
 * @params: idxPts number of points of the polygon
 * @params: zmin minimal level
 * @params: zmax maximal level
 * @params: class id of the shape
 * @return: ground 3d shape
*/
function createGroundShape(controlPts, idxPts, zmin, zmax, classId)
{
	// first compute the center
	var anchorPts = [];
	var center = {x: 0, y: 0, z: (zmax+zmin)*0.5}; 
	for (var i = 0; i<idxPts; i++) {
		center.x += controlPts.vertices[i].x;
		center.y += controlPts.vertices[i].y;
	}

	center.x /= idxPts;
	center.y /= idxPts;

	// first offset the center
	for (var i = 0 ;i<idxPts; i++) {
		anchorPts.push(new THREE.Vector2 (controlPts.vertices[i].x-center.x, controlPts.vertices[i].y-center.y));
	}
	// get the faces information
	var geometry = new THREE.ShapeGeometry( new THREE.Shape( anchorPts ));

	var geometry_top = geometry.clone();
	var geometry_bottom = geometry.clone();

	var geometry_total = new THREE.Geometry();
	geometry_total = geometry_top.clone();
	geometry_total.vertices = geometry_top.vertices.concat(geometry_bottom.vertices);
	geometry_total.faces = geometry_top.faces.concat(geometry_bottom.faces);


	//vertices
	var numV = geometry_top.vertices.length;
	for (var i = 0; i < numV; i++) {
		geometry_total.vertices[i].y = geometry_total.vertices[i].y;
		geometry_total.vertices[i+numV].y = geometry_total.vertices[i+numV].y;
		geometry_total.vertices[i].z = zmax-center.z
		geometry_total.vertices[i+numV].z = zmin-center.z;
	}

	// faces
	var numF = geometry_top.faces.length;
	for (var i = 0; i < numF; i++) {
		geometry_total.faces[i+numF].a += numV;
		geometry_total.faces[i+numF].b += numV;
		geometry_total.faces[i+numF].c += numV;
	}
	
	// faces bettwen two layers
	for (var i = 0; i < numV-1; i++) {
		geometry_total.faces.push(new THREE.Face3( i, i+1, i+numV));
		geometry_total.faces.push(new THREE.Face3( i+1, i+1+numV, i+numV));
	}
	geometry_total.faces.push(new THREE.Face3( 0, numV-1, numV));
	geometry_total.faces.push(new THREE.Face3( numV-1, numV, 2*numV-1));

	var mesh = new THREE.Mesh( geometry_total, new THREE.MeshBasicMaterial( { color: category[classId].colors, side: THREE.DoubleSide, 
		ireframe: 0, wireframeLinewidth: 2, transparent: true, opacity: category[classId].opacity}) );  
	
	// move to the centroid
	mesh.position.set(center.x, center.y, center.z);

	return {mesh: mesh, center: center};
}



/**
 * Rebuild a 3D ground shape primitive after updating from vertices or from the previous geometry
 * @params: vertices_top The vertices of the top face of the stuff object
 * @params: vertices_bottom The vertices of the botthom face of the stuff object
 * @params: obj The object to be updated
 * @return: the updated geometry
*/
function updateGroundGeometry(vertices_top, vertices_bottom, obj)
{
	if (vertices_top == undefined) {
		var numV = obj.geometry.vertices.length/2;
		vertices_top = obj.geometry.vertices.slice(0, numV);
		vertices_bottom = obj.geometry.vertices.slice(numV, 2*numV);
	} else {
		var numV = vertices_top.length;
	}
	if (obj == undefined){
		obj = labels[currentIdx];
	}
	var geometry_total = new THREE.Geometry();

	// update the face by reconstructing an object 
	var geometry_top = new THREE.ShapeGeometry( new THREE.Shape( vertices_top ));
	var geometry_bottom = geometry_top.clone();
	geometry_total.vertices = vertices_top;
	geometry_total.vertices = geometry_total.vertices.concat(vertices_bottom);

	var numF_new = geometry_top.faces.length;

	// update the faces 
	geometry_total.faces = geometry_top.faces;
	geometry_total.faces = geometry_top.faces.concat(geometry_bottom.faces);
	for (var i = 0; i < numF_new; i++) {
		geometry_total.faces[i+numF_new].a += numV;
		geometry_total.faces[i+numF_new].b += numV;
		geometry_total.faces[i+numF_new].c += numV;
	}

	// reconstruct the between faces
	for (var i = 0; i < numV-1; i++) {
		geometry_total.faces.push(new THREE.Face3( i, i+1, i+numV));
		geometry_total.faces.push(new THREE.Face3( i+1, i+1+numV, i+numV));
	}
	geometry_total.faces.push(new THREE.Face3( 0, numV-1, numV));
	geometry_total.faces.push(new THREE.Face3( numV-1, numV, 2*numV-1));

	geometry_total.computeBoundingBox();
	geometry_total.computeBoundingSphere();
	geometry_total.verticesNeedUpdate = true;	
	geometry_total.elementsNeedUpdate = true;	
	obj.geometry = geometry_total;
	
	// update the labels_helper by reconstructing
	// TODO: update the vertices directly 
	scene.remove(labels_helper[currentIdx]);
	//labels_helper.splice(activatedPlane, 1);	
	wireframe = new THREE.EdgesHelper_adv(obj, WIREFRAME_COLOR[0], MIN_DIST);		 
	wireframe.material.linewidth = 2;
	wireframe.updateMatrixWorld();
	labels_helper.splice(currentIdx, 1, wireframe);	
	wireframe.visible = !controlHandler.planarStuff;
	scene.add(wireframe);

}

/**
 * Insert or delete control points of stuff objects
 * @params: geometry The geometry of the 3D ground shape to be updated 
 * @params: sign If positive then add a point, if negative then delete the point
*/
function updateGroundControlPoints(sign)
{
	if (!activeVertex || activatedPlane<0) {
		console.log(activeVertex, activatedPlane);
		return;
	}
	geometry = planes[activatedPlane].geometry;
	var numV = geometry.vertices.length;
	if (numV <= 3 && sign<0) {
		return;
	}
	console.log('updateGroundControlPoints');

	changed_labels = true;

	var idx1 = vertexHelpers.indexOf(activeVertex);
	if (idx1<numV-1) {
		var idx2 = idx1 + 1;
	}else{
		var idx2 = 0;
	}

	// update the vertices
	var vertices_top = labels[activatedPlane].geometry.vertices.slice(0, numV);
	var vertices_bottom = labels[activatedPlane].geometry.vertices.slice(numV, 2*numV);
	var vertices = planes[activatedPlane].geometry.vertices.slice(0, numV);

	if (sign > 0) {
		// update the middle plane
		var median_pos = new THREE.Vector3();
		median_pos.x = (vertices[idx1].x + vertices[idx2].x)*0.5;
		median_pos.y = (vertices[idx1].y + vertices[idx2].y)*0.5;
		median_pos.z = (vertices[idx1].z + vertices[idx2].z)*0.5;
		vertices.splice(idx2, 0, median_pos);

		// also update vertexHelper to the global pos
		var position = {x: 0, y: 0, z: 0}; 
		position.x = median_pos.x + planes[activatedPlane].position.x; 
		position.y = median_pos.y + planes[activatedPlane].position.y; 
		position.z = median_pos.z + planes[activatedPlane].position.z; 
		var vertexHelper = addVertexHelper(position);

		// update the 3D primitive
		var median_pos_ = new THREE.Vector3();
		median_pos_.x = (vertices_top[idx1].x + vertices_top[idx2].x)*0.5;
		median_pos_.y = (vertices_top[idx1].y + vertices_top[idx2].y)*0.5;
		median_pos_.z = (vertices_top[idx1].z + vertices_top[idx2].z)*0.5;
		vertices_top.splice(idx2, 0, median_pos);

		median_pos = new THREE.Vector3();
		median_pos.x = (vertices_bottom[idx1].x + vertices_bottom[idx2].x)*0.5;
		median_pos.y = (vertices_bottom[idx1].y + vertices_bottom[idx2].y)*0.5;
		median_pos.z = (vertices_bottom[idx1].z + vertices_bottom[idx2].z)*0.5;
		vertices_bottom.splice(idx2, 0, median_pos);
		numV = numV +1;
		
		vertexHelpers.splice(idx2, 0, vertexHelper);
	}else if(sign < 0){
		vertices_top.splice(idx1, 1);
		vertices_bottom.splice(idx1,1);
		vertices.splice(idx1,1);
		numV = numV -1;
		// also update vertexHelper
		scene.remove(vertexHelpers[idx1]);
		vertexHelpers.splice(idx1, 1);
	}
	updateMiddlePlane(vertices);
	updateGroundGeometry(vertices_top, vertices_bottom);


}

/**
 * Adjust the height of the stuff objects
 * @params: sign If positive then increase the heights, if negative then decrease the height
*/
function updateGroundHeight(sign){
	if (!INTERSECTED) {return; }
	if (INTERSECTED.name.category != 'stuff' ) {return;}

	changed_labels = true;

	geometry = INTERSECTED.geometry;
	var numV = geometry.vertices.length/2;

	// update the vertices
	var vertices_top = geometry.vertices.slice(0, numV);
	var vertices_bottom = geometry.vertices.slice(numV, 2*numV);	

	if ( sign<0 && ( vertices_top[0].z -  vertices_bottom[0].z ) < (2 * HORIZONTAOL_DELTA_EPS) ) {return;}
	for (var i = 0; i<numV; i++){

		vertices_top[i].z = vertices_top[i].z + sign * HORIZONTAOL_DELTA_EPS;
		vertices_bottom[i].z = vertices_bottom[i].z - sign * HORIZONTAOL_DELTA_EPS;
	}
	updateGroundGeometry(vertices_top, vertices_bottom, INTERSECTED);
}

function createGroundShapeFlexible(controlPts, idxPts, delta, classId)
{
	// first compute the center
	var anchorPts = [];
	var center = {x: 0, y: 0, z: 0}; 
	for (var i = 0; i<idxPts; i++) {
		center.x += controlPts.vertices[i].x;
		center.y += controlPts.vertices[i].y;
		//center.z += controlPts.vertices[i].z - delta;
		center.z += controlPts.vertices[i].z;
	}

	center.x /= idxPts;
	center.y /= idxPts;
	center.z /= idxPts;


	// first offset the center
	var mControls = [];
	for (var i = 0 ;i<idxPts; i++) {
		anchorPts.push(new THREE.Vector2 (controlPts.vertices[i].x-center.x, controlPts.vertices[i].y-center.y));
		// don't includ the last one
		if (i < idxPts-1) mControls.push(controlPts.vertices[i]);
	}

	var reverse = ! THREE.Shape.Utils.isClockWise( anchorPts );
	if (reverse) {
		mControls = mControls.reverse();
	}
	
	// we first use a plane to get the face information
	var geometry = new THREE.ShapeGeometry( new THREE.Shape( anchorPts ));

	// faces hacking
	var numV = geometry.vertices.length;
	var geometry_top = geometry.clone();
	var geometry_bottom = geometry.clone();

	var geometry_total = new THREE.Geometry();
	geometry_total = geometry_top.clone();
	geometry_total.vertices = geometry_top.vertices.concat(geometry_bottom.vertices);
	geometry_total.faces = geometry_top.faces.concat(geometry_bottom.faces);


	//vertices
	for (var i = 0; i < numV; i++) {
		geometry_total.vertices[i].z = mControls[i].z - center.z + delta;
		geometry_total.vertices[i+numV].z = mControls[i].z - center.z - delta;
	}

	// faces
	var numF = geometry_top.faces.length;
	for (var i = 0; i < numF; i++) {
		geometry_total.faces[i+numF].a += numV;
		geometry_total.faces[i+numF].b += numV;
		geometry_total.faces[i+numF].c += numV;
	}
	
	//faces bettwen two layers
	for (var i = 0; i < numV-1; i++) {
		geometry_total.faces.push(new THREE.Face3( i, i+1, i+numV));
		geometry_total.faces.push(new THREE.Face3( i+1, i+1+numV, i+numV));
	}
	geometry_total.faces.push(new THREE.Face3( 0, numV-1, numV));
	geometry_total.faces.push(new THREE.Face3( numV-1, numV, 2*numV-1));

	var mesh = new THREE.Mesh( geometry_total, new THREE.MeshBasicMaterial( { color: category[classId].colors, side: THREE.DoubleSide, 
		wireframe: 0, wireframeLinewidth: 2, transparent: true, opacity: category[classId].opacity}));  
	
	// move to the centroid
	mesh.position.set(center.x, center.y, center.z);


	return {mesh: mesh, center: center};
}


/**
 * Check whether the cursor is on the canvas 
 * @params x0 x coordinate
 * @params y0 y coordinate
 * return onCanvas current cursor is on canvas or not 
*/

function checkCurrentViewRefine(x0, y0){
	var _x1 = x0, _y1 = y0;

	var rect0 = canv.getBoundingClientRect();
	x0 -= rect0.left;
	y0 -= rect0.top;


	var onCanvas = false;
	if (x0 < canv.width && x0 > 0 && y0 < canv.height && y0 > 0){
		onCanvas = true;
	}
	return onCanvas;
}

/**
 * Check whether the current view is changed
 * @params x0 x coordinate
 * @params y0 y coordinate
 * @initState previous view state
 * return is3d current view is in 3D or not
*/

// the value of is3d
// 1: 3D view
// 0: 2D center view
// -1: 2D left view

function checkCurrentView(x0, y0, initState, checkDrag)
{

	var _x1 = x0, _y1 = y0;
	var _x2 = x0, _y2 = y0;
	var _x3 = x0, _y3 = y0;

	var is3d = initState;

	_x1 -= container.offsetWidth*(views['view3D'].widthOffset);
	_y1 -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

	_x1 /= container.offsetWidth*views['view3D'].width;
	_y1 /= container.offsetHeight*views['view3D'].height;

	if (_x1 > 0 && _y1 > 0 && _x1 < 1 && _y1 < 1) {
		is3d = 1;
	}

	_x2 -= container.offsetWidth*(views['view2D'].widthOffset);
	_y2 -= container.offsetHeight*(1.0 - views['view2D'].height - views['view2D'].heightOffset);

	_x2 /= container.offsetWidth*views['view2D'].width;
	_y2 /= container.offsetHeight*views['view2D'].height;

	if (_x2 > 0 && _y2 > 0 && _x2 < 1 && _y2 < 1) {
		is3d = 0;
	}

	_x3 -= container.offsetWidth*(views['view2D_left'].widthOffset);
	_y3 -= container.offsetHeight*(1.0 - views['view2D_left'].height - views['view2D_left'].heightOffset);

	_x3 /= container.offsetWidth*views['view2D_left'].width;
	_y3 /= container.offsetHeight*views['view2D_left'].height;

	if (_x3 > 0 && _y3 > 0 && _x3 < 1 && _y3 < 1) {
		is3d = -1;
	}

	if (is3d != initState) {
		if (checkDrag) {
			var drag = currControlCube.getDragging();
			var mode = currControlCube.getMode();

			if (drag) {
				needSwitch = true;
				console.log('need switch');
				return initState;
			}
		}
		changeActiveView(is3d);
	}

	return is3d;

}



function onDocumentMouseOver(event)
{
	event.preventDefault();

	var xx = event.clientX;
	var yy = event.clientY;

	var rect0 = renderer.domElement.getBoundingClientRect();
	xx -= rect0.left;
	yy -= rect0.top;

	controlHandler.activeView3D = checkCurrentView(xx, yy, controlHandler.activeView3D, true);

	if (controlHandler.activeView3D == 1) {
		xx -= container.offsetWidth*(views['view3D'].widthOffset);
		yy -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

		xx /= container.offsetWidth*views['view3D'].width;
		yy /= container.offsetHeight*views['view3D'].height;

		// check current intersected camera
		if (controlHandler.showCam) {
			var mouse = { x : 1, y : 1};
			mouse.x = xx*2-1;
			mouse.y = -yy*2+1;
			vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);

			var raycaster = new THREE.Raycaster();

			if (view == 'perspective') {
				vector.unproject(cameraPerspective);
				raycaster.ray.set( cameraPerspective.position, vector.sub( cameraPerspective.position ).normalize() );
			}
			else if (view == 'orth') {
				raycaster.ray = pickingRay(vector, cameraOrth);
			}

			var intersects = raycaster.intersectObjects( camGroup.vCamera);

			if (activeCam){
				document.body.style.cursor = 'default';
				activeCam.material.color.setHex(0xffffff);
				activeCam = null;
			}

			if ( intersects.length > 0 ) {
				document.body.style.cursor = 'pointer';
				activeCam = intersects[0].object;
				activeCam.material.color.setHex(0xffa500);
			}

		}

		else if (activeCam) {
			document.body.style.cursor = 'default';
			activeCam.material.color.setHex(0xffbf00);
			activeCam = null;
		}
		
		if (onHoldingSpline && event.button!=2) {
 			// find out the intersection with the plane
			var mouse = { x : 1, y : 1};
			mouse.x = xx*2-1;
			mouse.y = -yy*2+1;
			vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);
			var ray;
			if (view == 'perspective') {
				vector.unproject(cameraPerspective);
				ray = new THREE.Ray(cameraPerspective.position, vector.sub(cameraPerspective.position).normalize());
			}
			else if (view == 'orth') {
				ray = pickingRay ( vector, cameraOrth ) 
			}
	 		var intersection = planeIntersectZ(INTERSECTED.position.z, ray.origin, ray.direction);
			var intersectPoint = new THREE.Vector3( intersection.x, intersection.y, intersection.z);

			// always update the last point
        		var currPos = splinePositions[currDynamicSeq]; 
			currPos[currPos.length-1] = intersectPoint;
        		updateSplineOutline(splineCurves[currDynamicSeq]);
		}

		if (onHoldingBirdview){
 			// find out the intersection with the plane
			var mouse = { x : 1, y : 1};
			mouse.x = xx*2-1;
			mouse.y = -yy*2+1;
			vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);
			var ray;
			if (view == 'perspective') {
				vector.unproject(cameraPerspective);
				ray = new THREE.Ray(cameraPerspective.position, vector.sub(cameraPerspective.position).normalize());
			}
			else if (view == 'orth') {
				ray = pickingRay ( vector, cameraOrth ) 
			}
			var intersection = planeIntersectZ(paras.level_min, ray.origin, ray.direction);
			var intersectPoint = new THREE.Vector3( intersection.x, intersection.y, intersection.z);

			birdviewCurve.geometry.vertices[1] = intersectPoint;
			birdviewCurve.geometry.verticesNeedUpdate = true;
		}

		if (clickedVertex){

			var idx = vertexHelpers.indexOf(clickedVertex);		
			var numV = planes[activatedPlane].geometry.vertices.length;

 			// find out the intersection with the plane
			var mouse = { x : 1, y : 1};
			mouse.x = xx*2-1;
			mouse.y = -yy*2+1;
			vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);
			var intersection = getPlaneIntersection(mouse);
			//intersection.z = intersection.z - 0.7*HORIZONTAOL_DELTA;


			// update the 2D stuff plane
			var z_delta = (intersection.z-planes[activatedPlane].position.z) - planes[activatedPlane].geometry.vertices[idx].z;

			var position = new THREE.Vector3(intersection.x-planes[activatedPlane].position.x, intersection.y-planes[activatedPlane].position.y, 
			 		intersection.z-planes[activatedPlane].position.z);
			planes[activatedPlane].geometry.vertices[idx].copy(position); 
			planes[activatedPlane].geometry.verticesNeedUpdate = true;

			// also update the edge helper
			plane_helpers[activatedPlane].geometry.vertices[idx].copy(position); 
			plane_helpers[activatedPlane].geometry.vertices[vertexHelpers.length].copy( plane_helpers[activatedPlane].geometry.vertices[0] ); 
			plane_helpers[activatedPlane].geometry.verticesNeedUpdate = true;

			// update the 3D stuff object
			var position_top = new THREE.Vector3(intersection.x-labels[activatedPlane].position.x, intersection.y-labels[activatedPlane].position.y, 
					labels[activatedPlane].geometry.vertices[idx].z + z_delta);
			console.log('activatedPlane', activatedPlane);
			console.log(labels[activatedPlane].geometry.vertices.length);
			console.log('idx', idx, 'numV', numV);
			var position_bottom = new THREE.Vector3(intersection.x-labels[activatedPlane].position.x, intersection.y-labels[activatedPlane].position.y, 
					labels[activatedPlane].geometry.vertices[idx+numV].z + z_delta);
			labels[activatedPlane].geometry.vertices[idx].copy(position_top); 
			labels[activatedPlane].geometry.vertices[idx+numV].copy(position_bottom); 

			// also update the vertexHelper
			clickedVertex.position.copy(intersection);

			return;
		}
		if (controlHandler.updateStuff == true){
			var mouse = { x : 1, y : 1};
			mouse.x = xx*2-1;
			mouse.y = -yy*2+1;
			vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);

			var raycaster = new THREE.Raycaster();

			if (view == 'perspective') {
				vector.unproject(cameraPerspective);
				raycaster.ray.set( cameraPerspective.position, vector.sub( cameraPerspective.position ).normalize() );
			}
			else if (view == 'orth') {
				raycaster.ray = pickingRay(vector, cameraOrth);
			}

			var intersects = raycaster.intersectObjects( vertexHelpers );

			if (activeVertex){
				document.body.style.cursor = 'default';
				activeVertex.material.color.setHex(0xffbf00);
				activeVertex.scale.set(1.0, 1.0, 1.0);
				activeVertex = null;
			}

			if ( intersects.length > 0 ) {
				document.body.style.cursor = 'pointer';
				activeVertex = intersects[0].object;
				activeVertex.material.color.setHex(0xff3300);
				activeVertex.scale.set(1.3, 1.3, 1.3);
			}
		}
	}
} 


function onDocumentMouseDown(event) 
 {
	idle = 0;
	if (event.button == 2){
	     return;
	}
	
 	event.preventDefault();

	var xx = event.clientX;
	var yy = event.clientY;

	var rect0 = renderer.domElement.getBoundingClientRect();
	xx -= rect0.left;
	yy -= rect0.top;

	// defocus the text input when mouse click in this area
	var _x = xx/rect0.width;
	var _y = xx/rect0.height;
	if (_x < 1 || _y < 1 || _x > 0 || _y > 0) {
		$('#newLabel').blur();
	}

	var xx0 = xx - container.offsetWidth*(views['view3D'].widthOffset);
	var yy0 = yy - container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

	xx0 /= container.offsetWidth*views['view3D'].width;
	yy0 /= container.offsetHeight*views['view3D'].height;

	// check if out of range, just diable the controlers
	if (xx0 < 0 || yy0 < 0 || xx0 > 1 || yy0 > 1) {
		if (view == 'orth') {
			controlsOrth.enabled = false;
		}
		else if (view == 'perspective')
			controlsPerspective.enabled = false;
	} 
	else {
		if (view == 'orth'){
			controlsOrth.enabled = true;
		}
		else if (view == 'perspective')
			controlsPerspective.enabled = true;
	}

 	// click a camera
 	if (activeCam) {
	 	frame.currImg = activeCam.name;
		var newCam = changeImgSingle(activeCam.name);
		if (newCam) resetParas(true);
		updateFrameId(controlHandler.showFrame);
 	}

	// click a control point of stuff object
 	// activated under orthogonal view 
	else if (activeVertex && controlsOrth.enabled ) {
		clickedVertex = activeVertex;
	}

 	// click pts for stuff objs
 	// activated under orthogonal view 
 	else if (mode == 2 && event.button != 2 && controlsOrth.enabled && dynamicOn==false)
	{
		xx -= container.offsetWidth*(views['view3D'].widthOffset);
		yy -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

		var mouse = { x : 1, y : 1};
		mouse.x = ( xx / (container.offsetWidth*views['view3D'].width) ) * 2 - 1;
		mouse.y = - ( yy / (container.offsetHeight*views['view3D'].height)) * 2 + 1;

 		// find out the intersection with the plane
		intersection = getPlaneIntersection(mouse);

 		// initialize
 		if (idxPts == 0) {

 			// pre-allocate array with fixed sized
 			for (var i = 0; i<LINE_PTS; i++) { 
				polygonPts.vertices.push(new THREE.Vector3( intersection.x, intersection.y, intersection.z ));
				polygonPts_line.vertices.push(new THREE.Vector3( intersection.x, intersection.y, intersection.z ));
			}

			// can not share the same control points
			pointcloud = new THREE.PointCloud( polygonPts, new THREE.PointCloudMaterial({size: 5, color: 0xffbf00, sizeAttenuation:false}) );
			line = new THREE.Line( polygonPts_line, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } ) );

			pointcloud.geometry.verticesNeedUpdate = true;
 			line.geometry.verticesNeedUpdate = true;

 			pointcloud.geometry.computeBoundingSphere();
 			line.geometry.computeBoundingSphere();


			scene.add(line); 
			scene.add(pointcloud);
 		}

 		else {
 			polygonPts.vertices[idxPts] = new THREE.Vector3( intersection.x, intersection.y, intersection.z );
 			polygonPts_line.vertices[idxPts] = new THREE.Vector3( intersection.x, intersection.y, intersection.z );
 			pointcloud.geometry.verticesNeedUpdate = true;
 			line.geometry.verticesNeedUpdate = true;
			// disable depth check to make sure the line is always visible
			line.material.depthTest = false;

 			// make the left points in polygonPts to be the same with the last valid point
 			for (var i = idxPts+1; i<LINE_PTS; i++) { 
				polygonPts_line.vertices[i] = new THREE.Vector3( intersection.x, intersection.y, intersection.z);
			}
 		}

 		pointcloud.geometry.computeBoundingSphere();
 		line.geometry.computeBoundingSphere();



 		if ( idxPts > 1 && polygonPts.vertices[0].distanceTo(polygonPts.vertices[idxPts]) <  AUTO_THRESHOLD) {
 			autoClose();
 		}

 		idxPts ++;
 	}
	 

	// click pts for annotating objects in birdeye view
	else if (mode == 3 && event.button != 2 && controlsOrth.enabled && dynamicOn==false)
	{
		xx -= container.offsetWidth*(views['view3D'].widthOffset);
		yy -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

		var mouse = { x : 1, y : 1};
		mouse.x = ( xx / (container.offsetWidth*views['view3D'].width) ) * 2 - 1;
		mouse.y = - ( yy / (container.offsetHeight*views['view3D'].height)) * 2 + 1;	

 		// find out the intersection with the plane
		intersection = getPlaneIntersection(mouse);		

 		// initialize
 		//if (birdviewPtsCnt == 0) {

			// pre-allocate array with fixed sized
			for (var i = 0; i<2; i++) { 
				birdviewPts.vertices.push(new THREE.Vector3( intersection.x, intersection.y, intersection.z ));
			   	birdviewLine.vertices.push(new THREE.Vector3( intersection.x, intersection.y, intersection.z ));
		   	}

			// can not share the same control points
			birdviewPointcloud = new THREE.PointCloud( birdviewPts, new THREE.PointCloudMaterial({size: 8, color: category[birdviewClassId].colors, sizeAttenuation:false}) );
			birdviewCurve = new THREE.Line( birdviewLine, new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 10 } ) );

			birdviewPointcloud.geometry.verticesNeedUpdate = true;
			birdviewCurve.geometry.verticesNeedUpdate = true;

			birdviewCurve.material.depthTest = false;

			birdviewPointcloud.geometry.computeBoundingSphere();
			birdviewCurve.geometry.computeBoundingSphere();

			scene.add(birdviewCurve); 
			scene.add(birdviewPointcloud);

			onHoldingBirdview = true;
		//}


		//else {


		//}

		birdviewPointcloud.geometry.computeBoundingSphere();
		birdviewCurve.geometry.computeBoundingSphere();

		//birdviewPtsCnt ++;

		// create a bounding box given the line
		//if (birdviewPtsCnt==2){
		//	onHoldingBirdview = false;

		//}
	}

 	// click pts for spline control 
 	// activated in dynamic mode 
 	else if (INTERSECTED && event.button != 2 && dynamicOn == true)
	{
		xx -= container.offsetWidth*(views['view3D'].widthOffset);
		yy -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

		var mouse = { x : 1, y : 1};
		mouse.x = ( xx / (container.offsetWidth*views['view3D'].width) ) * 2 - 1;
		mouse.y = - ( yy / (container.offsetHeight*views['view3D'].height)) * 2 + 1;


		var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);
		var ray;
		if (view == 'perspective') {
			vector.unproject(cameraPerspective);
			ray = new THREE.Ray(cameraPerspective.position, vector.sub(cameraPerspective.position).normalize());
		}
		else if (view == 'orth') {
			ray = pickingRay ( vector, cameraOrth ) 
		}

 		// find out the intersection with the plane
 		var intersection;
	 	intersection = planeIntersectZ(INTERSECTED.position.z, ray.origin, ray.direction);
		var intersectPoint = new THREE.Vector3( intersection.x, intersection.y, intersection.z);

	        // align the bottom of the cube and the ground
	        var currentPos = computeGround(intersectPoint);
		console.log('before ground, ', intersectPoint.x, intersectPoint.y, intersectPoint.z);
	        intersectPoint.z = currentPos.height + INTERSECTED.geometry.boundingBox.max.z*INTERSECTED.scale.z;		
		console.log('after ground, ', intersectPoint.x, intersectPoint.y, intersectPoint.z);

		
		// update the spline control points
		// push the position of the added object, so that the spline can be controlled by these objects
		var currPos = splinePositions[currDynamicSeq];
		var addObj = addSplineObject(intersectPoint);
		currPos[currPos.length - 1] = addObj.position;
		currPos.push(addObj.position);
        	//splinePositions[currDynamicSeq].push(addSplineObject(intersectPoint).position); 
        	updateSplineOutline(splineCurves[currDynamicSeq]);

		currDynamicIdx = currDynamicIdx+1;
		INTERSECTED.name.dynamicSeq = currDynamicSeq;
		labels[currentIdx].name.dynamicIdx = currDynamicIdx;
	}
 }


function getPlaneIntersection(mouse){

		var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);
		var ray;
		if (view == 'perspective') {
			vector.unproject(cameraPerspective);
			ray = new THREE.Ray(cameraPerspective.position, vector.sub(cameraPerspective.position).normalize());
		}
		else if (view == 'orth') {
			ray = pickingRay ( vector, cameraOrth ) 
		}

 		// find out the intersection with the plane
 		var intersection;

 		if (controlHandler.autoGround) {

	 		// 1. Find the closest pose
	 		var temp = planeIntersectZ(paras.level_min, ray.origin, ray.direction);
	 		var candidateMX = findNearestCam(new THREE.Vector3(temp.x, temp.y, 0));

	 		// 2. Perform interaction
	 		intersection = planeInterset(candidateMX.poseGround, ray.origin, ray.direction);
	 		
	 		// instead, implement a kd tree based method: search for the nearest neighbors
	 		var posRange = kdtree.nearest([intersection.x, intersection.y, intersection.z], 30, 3);

	 		if (posRange.length > 0) {
	 			var candidate = [];
		 		for (var i = 0; i < posRange.length; i++) {
		 			candidate.push(posRange[i][0].obj);
		 		}
		 		// sort according to z
		 		candidate.sort(function(a, b){return a[2]-b[2]});

		 		// choose the one with the 1/3 lowest z value
		 		intersection = new THREE.Vector3().fromArray( candidate[Math.round(candidate.length/3)] );
		 		intersection.x = ray.origin.x;
		 		intersection.y = ray.origin.y;
			}

			//intersection.z += 0.7*HORIZONTAOL_DELTA;
	 	}
	 	else {
	 		intersection = planeIntersectZ(paras.level_max, ray.origin, ray.direction);
	 	}
		return intersection;
}


/**
 * Check if it is a valid stuff object
 * Invalid stuff object has 6 vertices in format of [x,x,x,y,y,y] 
 */
function checkValidStuff(vec){
	var numV = vec.length/2;
	var vertices_top = vec.slice(0, numV);
	var vertices_bottom = vec.slice(numV, 2*numV);	

	if (numV>3){
		return true;
	}
	for (var i=0; i < numV; i++){
		for (var j=i; j < numV; j++){
			if (vertices_top[i].x!=vertices_top[i].x) return true;
			if (vertices_top[i].y!=vertices_top[i].y) return true;
			if (vertices_top[i].z!=vertices_top[i].z) return true;
			if (vertices_bottom[i].x!=vertices_bottom[i].x) return true;
			if (vertices_bottom[i].y!=vertices_bottom[i].y) return true;
			if (vertices_bottom[i].z!=vertices_bottom[i].z) return true;
		}
	}
	return false;
}

/**
 * Calculate the intersection with the ground given the stuff object
 */
function getMiddlePlane(object, level_min){
	var idx = labels.indexOf(object);

	if (level_min==undefined){
		level_min = object.name.level_min;
	}
	var geometry = object.geometry.clone();
	var vec = geometry.vertices;
	var numV = vec.length/2;
	var vertices_top = vec.slice(0, numV);
	var vertices_bottom = vec.slice(numV, 2*numV);	


	// local to global coordinate
	for (var i=0; i < numV; i++){
		vertices_top[i].x = vertices_top[i].x + object.position.x;
		vertices_top[i].y = vertices_top[i].y + object.position.y;
		vertices_top[i].z = vertices_top[i].z + object.position.z;
		vertices_bottom[i].x = vertices_bottom[i].x + object.position.x;
		vertices_bottom[i].y = vertices_bottom[i].y + object.position.y;
		vertices_bottom[i].z = vertices_bottom[i].z + object.position.z;
	}

	// get the intersection with the plane
	var vertices_middle = [];
	for (var i=0; i < numV; i++){
		var dir = vertices_bottom[i].clone();

		var ray = new THREE.Ray(vertices_bottom[i], dir.sub(vertices_top[i]).normalize());

 		// 1. Find the closest pose
 		var temp = planeIntersectZ(level_min, ray.origin, ray.direction);
 		var candidateMX = findNearestCam(new THREE.Vector3(temp.x, temp.y, 0));
 		
 		// skip if cannot find the camera
 		if (!candidateMX.poseGround){
 			return;
 		}

 		// 2. Perform interaction
 		var interaction;
 		intersection = planeInterset(candidateMX.poseGround, ray.origin, ray.direction);
 		
 		// instead, implement a kd tree based method: search for the nearest neighbors
 		var posRange = kdtree.nearest([intersection.x, intersection.y, intersection.z], 30, 3);
 		if (posRange.length > 0) {

 			var candidate = [];
	 		for (var j = 0; j < posRange.length; j++) {
	 			candidate.push(posRange[j][0].obj);
	 		}
	 		// sort according to z
	 		candidate.sort(function(a, b){return a[2]-b[2]});
	 		// choose the one with the 1/3 lowest z value
	 		intersection = new THREE.Vector3().fromArray( candidate[Math.round(candidate.length/3)] );
	 		intersection.x = ray.origin.x;
		 	intersection.y = ray.origin.y;	
	 	}

	 	if (intersection.z < vertices_bottom[i].z || intersection.z > vertices_top[i].z){
	 		intersection.z = (vertices_top[i].z + vertices_bottom[i].z) * 0.5;
	 	}
	 
	 	vertices_middle.push(intersection);	
	}

	// global to local coordinate
	for (var i=0; i<vertices_middle.length; i++){
		vertices_middle[i].x = vertices_middle[i].x - object.position.x;
		vertices_middle[i].y = vertices_middle[i].y - object.position.y;
		vertices_middle[i].z = vertices_middle[i].z - object.position.z;
	}
	var geometry_middle  = new THREE.ShapeGeometry( new THREE.Shape( vertices_middle ));
	for (var i=0; i<vertices_middle.length; i++){
		geometry_middle.vertices[i].z = vertices_middle[i].z;
	}

	var plane = new THREE.Mesh( geometry_middle, new THREE.MeshBasicMaterial( {color: object.material.color, side: THREE.DoubleSide,
	 	wireframe: 0, wireframeLinewidth: 2, transparent: true, opacity: 0.5}));  
	plane.position.set(object.position.x, object.position.y, object.position.z);

	if (planes[idx]!=0){
		scene.remove(planes[idx]);
		scene.remove(plane_helpers[idx]);
	}

	planes.splice(idx, 1, plane);
	plane.visible = controlHandler.planarStuff;
	scene.add( plane );


	// also add the edge helper
	var material = new THREE.LineBasicMaterial({
		color: 0x00ffff
	});
	var geometry_line = new THREE.Geometry();
	geometry_line.vertices = vertices_middle;
	geometry_line.vertices.push(vertices_middle[0]);
	var wireframe = new THREE.Line( geometry_line, material );
	wireframe.position.set(object.position.x, object.position.y, object.position.z);

	wireframe.material.linewidth = 2;
	wireframe.updateMatrixWorld();
	plane_helpers.splice(idx, 1, wireframe);
	wireframe.visible = controlHandler.planarStuff;
	scene.add(wireframe);

}

function getMiddlePlaneBatch(){
	for (var i=0; i<labels.length; i++){
	  // add middle plane for stuff objects
          if (labels[i].name.category == 'stuff' ){
  	    console.log(i);
            getMiddlePlane(labels[i], labels[i].name.level_min);
          }
	}
}



function updateMiddlePlane(vertices){
	// update the face by reconstruction
	var geometry = new THREE.ShapeGeometry( new THREE.Shape( vertices ));
	for (var i=0; i<vertices.length; i++){
		geometry.vertices[i].z = vertices[i].z;
	}
	planes[activatedPlane].geometry = geometry;
	planes[activatedPlane].geometry.computeBoundingBox();
	planes[activatedPlane].geometry.computeBoundingSphere();
	planes[activatedPlane].geometry.verticesNeedUpdate = true;	
	planes[activatedPlane].geometry.elementsNeedUpdate = true;	

	// also update the edge helper by reconstructing
	// Line object doesn't support dynamic update
	scene.remove(plane_helpers[activatedPlane]);
	var material = new THREE.LineBasicMaterial({
		color: 0x00ffff
	});
	var geometry_line = new THREE.Geometry();
	geometry_line.vertices = vertices;
	geometry_line.vertices.push(vertices[0]);
	var wireframe = new THREE.Line( geometry_line, material );
	wireframe.position.set(plane_helpers[activatedPlane].position.x, plane_helpers[activatedPlane].position.y, plane_helpers[activatedPlane].position.z);

	wireframe.material.linewidth = 2;
	wireframe.updateMatrixWorld();
	plane_helpers.splice(activatedPlane, 1, wireframe);
	wireframe.visible = controlHandler.planarStuff;
	scene.add(plane_helpers[activatedPlane]);

}

 function onDocumentMouseUp(event)
 {
 	//if (INTERSECTED) {
 	//	changed_labels = true;
 	//}
 	if (view == 'perspective') {
 		controlsPerspective.enabled = true;
 	}

 	if (needSwitch) {
 		var xx = event.clientX;
		var yy = event.clientY;

		var rect0 = renderer.domElement.getBoundingClientRect();
		xx -= rect0.left;
		yy -= rect0.top;

 		controlHandler.activeView3D = checkCurrentView(xx, yy, controlHandler.activeView3D, false);
 		needSwitch = false;
 	}

	if (clickedVertex){
		updateMiddlePlane(planes[activatedPlane].geometry.vertices);
		updateGroundGeometry(undefined,undefined,labels[activatedPlane]);	
		// update geometry elements 
		labels[activatedPlane].geometry.computeBoundingBox();
		labels[activatedPlane].geometry.computeBoundingSphere();

		labels[activatedPlane].geometry.verticesNeedUpdate = true;	
		labels[activatedPlane].geometry.elementsNeedUpdate = true;	
		//INTERSECTED.geometry = geometry.clone();
		clickedVertex = null;
		changed_labels = true;

	}

	if (onHoldingBirdview){

		onHoldingBirdview = false;

		var xx = event.clientX;
		var yy = event.clientY;

		var rect0 = renderer.domElement.getBoundingClientRect();
		xx -= rect0.left;
		yy -= rect0.top;

		xx -= container.offsetWidth*(views['view3D'].widthOffset);
		yy -= container.offsetHeight*(1.0 - views['view3D'].height - views['view3D'].heightOffset);

		var mouse = { x : 1, y : 1};
		mouse.x = ( xx / (container.offsetWidth*views['view3D'].width) ) * 2 - 1;
		mouse.y = - ( yy / (container.offsetHeight*views['view3D'].height)) * 2 + 1;	

 		// find out the intersection with the plane
		intersection = getPlaneIntersection(mouse);		

		birdviewPts.vertices[1] = new THREE.Vector3( intersection.x, intersection.y, intersection.z );
		birdviewLine.vertices[1] = new THREE.Vector3( intersection.x, intersection.y, intersection.z );
		birdviewPointcloud.geometry.verticesNeedUpdate = true;
		birdviewCurve.geometry.verticesNeedUpdate = true;
		
		   
		// // make the left points in polygonPts to be the same with the last valid point
		//  for (var i = idxPts+1; i<LINE_PTS; i++) { 
		// 	birdviewLine.vertices[i] = new THREE.Vector3( intersection.x, intersection.y, intersection.z);
		// }
		// console.log('birdviewPts', birdviewPts.vertices[0].x);

		autoLineToBox();

	}
 } 


/**
 * Double click the mouse in order to active/de-activate the 3D shape
 */

function onDocumentDoubleClick(event) {
	event.preventDefault();

	//if (readOnly) return;
	
	var xx = event.clientX;
	var yy = event.clientY;

	var rect0 = renderer.domElement.getBoundingClientRect();
	xx -= rect0.left;
	yy -= rect0.top;

	var curView;
	if (controlHandler.activeView3D == 1) {
		curView = views['view3D'];
	}
	else if (controlHandler.activeView3D == 0) {
		curView = views['view2D'];
	}
	else if (controlHandler.activeView3D == -1) {
		curView = views['view2D_left'];
	}

	xx -= container.offsetWidth*(curView.widthOffset);
	yy -= container.offsetHeight*(1.0 - curView.height - curView.heightOffset);

	var mouse = { x : 1, y : 1};
	mouse.x = ( xx / (container.offsetWidth*curView.width) ) * 2 - 1;
	mouse.y = - ( yy / (container.offsetHeight*curView.height)) * 2 + 1;

	vector = new THREE.Vector3( mouse.x, mouse.y, 0.5);

	var raycaster = new THREE.Raycaster();

	if (controlHandler.activeView3D == 0) {
		vector.unproject(cameraProjection.cameraP);
		raycaster.ray.set( cameraProjection.cameraP.position, vector.sub( cameraProjection.cameraP.position ).normalize() );
	}

	else if (controlHandler.activeView3D == -1) {
		if (camSide == 'left') {
			vector.unproject(cameraProjection.cameraF1);
			raycaster.ray.set( cameraProjection.cameraF1.position, vector.sub( cameraProjection.cameraF1.position ).normalize() );
		}
		else if (camSide == 'right') {
			vector.unproject(cameraProjection.cameraF2);
			raycaster.ray.set( cameraProjection.cameraF2.position, vector.sub( cameraProjection.cameraF2.position ).normalize() );
		}
	}

	else {
		if (view == 'perspective') {
			vector.unproject(cameraPerspective);
			raycaster.ray.set( cameraPerspective.position, vector.sub( cameraPerspective.position ).normalize() );
		}
		else if (view == 'orth') {
			// since it is orthogonal camera
			raycaster.ray = pickingRay( vector, cameraOrth);
		}
	}

	var intersects = raycaster.intersectObjects( labels );

	if (intersects.length == 0) return;
	

	for (var index = 0; index < intersects.length; index++)
	{
		
		if (!intersects[index].object.visible){
			var index_global = labels.indexOf(intersects[index].object);
			console.log(planes);
			console.log(planes[index_global]);
			console.log(index_global);
			if (planes[index_global]==0 || planes[index_global]==undefined){
				continue;
			}
			if (planes[index_global].visible==false){
				continue;
			}
			else{
				// update stuff object
				if (activatedPlane!=index_global){
					if (activatedPlane!=-1){
						detachVertexHelper(activatedPlane);
					}
					activatedPlane = index_global;
					currentIdx = index_global;
					controlHandler.updateStuff=true;
					updateStuffObject(activatedPlane);
				}
				// exist updating stuff object
				else{
					controlHandler.updateStuff=false;
					updateStuffObject(activatedPlane);
					activatedPlane=-1;
				}	
				break;
			}
		}


		// if (controlHandler.updateStuff==true){
		// 	controlHandler.updateStuff=false;
		// 	console.log('index_global', index_global);
    			

		// 	// need to update checkbox manually
		// 	// otherwise the status of checkbox would only change after two clicks
		// 	controller_stuff.updateDisplay();
		// 	controller_stuff.__prev = controller_stuff.__checkbox.checked;
		// }
		

		if (INTERSECTED != intersects[ index ].object) {
			// set a new property for the double clicked object
			intersects[ index ].object.material.wireframeLinewidth = 2;
			
			if (INTERSECTED) {
	
				//push the state for the old object
				labels[currentIdx].name.level_min = paras.level_min;
				labels[currentIdx].name.level_max = paras.level_max;
				labels_helper[currentIdx].material.linewidth = 1;

				attachControlCubes(INTERSECTED, [], false);
				//resetParas();

				INTERSECTED.name.stack = [];

				category[INTERSECTED.name.buttonId].stack.matrix = INTERSECTED.matrixWorld.clone();
				category[INTERSECTED.name.buttonId].stack.level_min = INTERSECTED.name.level_min;
				category[INTERSECTED.name.buttonId].stack.level_max = INTERSECTED.name.level_max;

				INTERSECTED = null;
			}

			INTERSECTED = intersects[ index ].object;
			INTERSECTED.geometry.computeBoundingBox();

			resetButtonStyle();
			changeButtonStyle(INTERSECTED.name.buttonId);
			currentBtn = INTERSECTED.name.buttonId;

			// TODO: 
			// still have problems ?? due to a bug in three.js
			/*----------------------------------------*/
			INTERSECTED.renderDepth = 0;
			/*----------------------------------------*/

			displayMsg('status', 'Select the obejct ' + INTERSECTED.name.label);
			
			if (INTERSECTED.name.level_min != INTERSECTED.name.level_min)
				INTERSECTED.name.level_min = paras.level_min;
			else {
				paras.level_min = INTERSECTED.name.level_min;
				shaderMaterial.uniforms.threshold_min.value = INTERSECTED.name.level_min;
			}

			if (INTERSECTED.name.level_max != INTERSECTED.name.level_max)
				INTERSECTED.name.level_max = paras.level_max;
			else {
				paras.level_max = INTERSECTED.name.level_max;
				shaderMaterial.uniforms.threshold_max.value = INTERSECTED.name.level_max;
			}

			// we need also to check the index of the selected object
			// by traversing all the objects in the labels group
			for (var i in labels) 
			{
				if (INTERSECTED.id == labels[i].id) 
				{
					currentIdx = i;
					break;
				}
			}

			labels_helper[currentIdx].material.linewidth = 2;

			// activate the spline if the seletecd object is a spline control object
			if (INTERSECTED.name.dynamic == 1 && INTERSECTED.name.dynamicIdx>-1){
				if (INTERSECTED.name.timestamp > -1) {
					displayMsg('status','Object assigned with timestamp: '+INTERSECTED.name.timestamp.toString());
				}
				currSpline = splineCurves[INTERSECTED.name.dynamicSeq];
			}

			if (readOnly != 1) {
				currControlCube.enabled = false;
				
				attachControlCubes(intersects[ index ].object, 'translate', true);
				//changeManipulationStyle(true, 'center');
				currControlCube.enabled = true;
			}
		}

		// finish annotation on that object
		else {

			displayMsg('status', 'Detach the obejct ' + INTERSECTED.name.label);

			finishAnnotationSingle();

			switchToView(view);

		}

		break;

	} 
}


/**
 * keyboard event
 */
function onDocumentDown(event) {
		
	// DELETE key
	if (event.keyCode == 46) {
		
		if(readOnly != 1) { 
			// delete the current selected annotation
			if (INTERSECTED) {
				// if stuff object is updating
				if (controlHandler.updateStuff==true){
					controlHandler.updateStuff=false;
    					updateStuffObject();
				}

				//update spline if the object is a spline control object
				if (INTERSECTED.name.dynamic==1){
					if ( INTERSECTED.name.dynamicIdx>-1 ) {
						if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1){
							alert('ClearAutoBox before deleting spline control objects');;
							return;
						}
						else{
							removeSplineObject(INTERSECTED);
						}
					}
					else {
						alert('Automatically generated bounding box should not be removed alone. Use ClearAutoBox instead.');	
						return;
					} 
				}

				resetParas(true);
				//labels.remove(INTERSECTED);
				labels.splice(currentIdx, 1);

				scene.remove(INTERSECTED);
				scene.remove(labels_helper[currentIdx]);
    				changed_labels = true;

				scene3D.remove(labels_arrow[currentIdx]);

				labels_helper.splice(currentIdx, 1);
				labels_arrow.splice(currentIdx, 1);

				if (INTERSECTED.name.category == 'stuff'){
					scene.remove(planes[currentIdx]);
					scene.remove(plane_helpers[currentIdx]);
					clickedVertex = null;
					activeVertex = null;
				}
				planes.splice(currentIdx, 1);
				plane_helpers.splice(currentIdx, 1);

				attachControlCubes(INTERSECTED, [], false);
				INTERSECTED = null;
				currentIdx = -1;

				// make the sea level to normal
				if (view == 'perspective') {
					shaderMaterial.uniforms.threshold_min.value = GROUND_POS.initial.perspective;
					shaderMaterial.uniforms.threshold_max.value = SKY_POS.initial.perspective;
				}

				else if(view == 'orth') {					
					// shaderMaterial.uniforms.threshold_min.value = GROUND_POS.initial.othographic;
					// shaderMaterial.uniforms.threshold_max.value = SKY_POS.initial.othographic;
					shaderMaterial.uniforms.threshold_min.value = GROUND_POS.min; //currentPos.height - VERTICAL_HEIGHT_MIN;
					shaderMaterial.uniforms.threshold_max.value = GROUND_POS.max; //currentPos.height + VERTICAL_HEIGHT_MIN;
				}

				paras.level_min = shaderMaterial.uniforms.threshold_min.value;
				paras.level_max = shaderMaterial.uniforms.threshold_max.value;

				// also change the current button into normal state
				resetButtonStyle();
			}
		}
	}

	// undo (only valid for 3D polygon primitive )
	else if (event.keyCode == 90 && event.ctrlKey) {
		

		if (INTERSECTED && readOnly != 1) {
				undoMove();
		}

		if (mode == 2) {

			if (idxPts > 1) {
				polygonPts.vertices[idxPts-1] = new THREE.Vector3( polygonPts.vertices[idxPts-2].x, 
					                                               polygonPts.vertices[idxPts-2].y, polygonPts.vertices[idxPts-2].z );
	 			polygonPts_line.vertices[idxPts-1] = new THREE.Vector3( polygonPts.vertices[idxPts-2].x, 
	 				                                               polygonPts.vertices[idxPts-2].y, polygonPts.vertices[idxPts-2].z );
	 			pointcloud.geometry.verticesNeedUpdate = true;
	 			line.geometry.verticesNeedUpdate = true;

	 			pointcloud.geometry.computeBoundingSphere();
 				line.geometry.computeBoundingSphere();

	 			idxPts --;
	 			// make the left points in polygonPts to be the same with the last valid point
	 			for (var i = idxPts+1; i<LINE_PTS; i++) { 
					polygonPts_line.vertices[i] = new THREE.Vector3( polygonPts.vertices[idxPts-1].x, 
						                                             polygonPts.vertices[idxPts-1].y, polygonPts.vertices[idxPts-1].z);
					polygonPts.vertices[i] = new THREE.Vector3( polygonPts.vertices[idxPts-1].x, 
						                                             polygonPts.vertices[idxPts-1].y, polygonPts.vertices[idxPts-1].z);
				}

				displayMsg('status', 'Remove the current selected points');
			}

			else {
				polygonPts.vertices = [];
				polygonPts_line.vertices = [];
				scene.remove(line); 
				scene.remove(pointcloud);

				resetButtonStyle();

				idxPts = 0;
			}
		}
	}
}

function undoMove() {

	console.log('stack', INTERSECTED.name.stack);
	if (INTERSECTED.name.stack.length > 1) {
		var state = {position: {}, quaternion: {}, scale: {}};
		state.position = INTERSECTED.name.stack[INTERSECTED.name.stack.length-2].position.clone();
		state.quaternion = INTERSECTED.name.stack[INTERSECTED.name.stack.length-2].quaternion.clone();
		state.scale = INTERSECTED.name.stack[INTERSECTED.name.stack.length-2].scale.clone();
	
		INTERSECTED.position.copy(state.position);
		INTERSECTED.quaternion.copy(state.quaternion);
		INTERSECTED.scale.copy(state.scale);
	
		INTERSECTED.updateMatrixWorld( true );
	
		INTERSECTED.name.stack.splice(INTERSECTED.name.stack.length-1, 1);
	
		if (INTERSECTED.name.dynamic==1 && INTERSECTED.name.dynamicIdx>-1) {
			updateSplineOutline(splineCurves[INTERSECTED.name.dynamicSeq]);
		}
	}
}


function getZ(planePara, center)
{
	// ax + by +cz + d = 0
	// z = (-d - ax - by)/c

	// what if  c = 0 ?
	var a = planePara.x;
	var b = planePara.y;
	var c = planePara.z;
	var d = 1;
	return (-d - a*center.x - b * center.y)/c;
}



/** 
 * find out interaction with the plane Y
 * @params ylevel y value of the plane to be intersected
 * @params origin ray origin
 * @params direction ray direction
 * @return intersection 
 */
function planeIntersectY(yLevel, origin, direction)
{
  var dir = direction.normalize();
  var t = (yLevel - origin.y)/direction.y;
  return {
    x: origin.x + t*dir.x,
    y: yLevel,
    z: origin.z + t*dir.z
  };
}

/** 
 * find out interaction with the plane Z
 * @params zlevel z value of the plane to be intersected
 * @params origin ray origin
 * @params direction ray direction
 * @return intersection
 */
function planeIntersectZ(zLevel, origin, direction)
{
  var dir = direction.normalize();
  var t = (zLevel - origin.z)/dir.z;
  return {
    x: origin.x + t*dir.x,
    y: origin.y + t*dir.y,
    z: zLevel
  };
}


function planeInterset(planePara, origin, direction)
{

	/*
	Compute the plane intersection according to the following math
	ray: 
	x' = x + t*dx
	y' = y + t*dy
	z' = z + t*dz
	plane: ax + by + cz + d = 0
	a(x + t*dx) + b(y + t*dy) + c(z + t*dz) = d
	-> solve for t
	*/
	var a = planePara.x;
	var b = planePara.y;
	var c = planePara.z;
	var d = 1;

	var t = -1*(a*origin.x + b*origin.y + c*origin.z+d)/(a*direction.x + b*direction.y + c*direction.z);

	return {
		x: origin.x + t*direction.x,
    	y: origin.y + t*direction.y,
    	z: origin.z + t*direction.z
	}
}


/** 
 * Ray intersection for orthographic camera
 * @params vector ray vector
 * @params camera current camera
 * @return resultant ray
 */
function pickingRay ( vector, camera ) 
{
	// set two vectors with opposing z values
	vector.z = - 1.0;
	var end = new THREE.Vector3( vector.x, vector.y, 1.0 );

	vector.unproject(camera);
	end.unproject(camera);

	// find direction from vector to end
	end.sub( vector ).normalize();

	return new THREE.Ray( vector, end );
}


/** 
 * Detach the controller under a certain view
 * @params is3d true if in the 3d view
 * @params obj object to be detached
 */
function detachControllers(is3d, obj)
{
	if (is3d) {

	}
	currControlCube.detach(obj);
}

/** 
 * Attach the controller under a certain view
 * @params is3d true if in the 3d view
 * @params obj object to be attached
 */
function attachControlers(is3d, obj)
{
	if (is3d == 1) currControlCube = objController.controlCube;
	else if (is3d == 0) currControlCube = objController.controlCube2D;
	else if (is3d == -1) {
		if (camSide == 'left')
			currControlCube = objController.controlCubeFish1;
		if (camSide == 'right')
			currControlCube = objController.controlCubeFish2;
	}

	currControlCube.attach( obj, 'translate');

}

/** 
 * Detach the vertexHelper to stuff objects
 */
function detachVertexHelper()
{
	//if (INTERSECTED.name.category == 'stuff' && readOnly != 1) {
		for (var i=0; i<vertexHelpers.length; i++){
			scene.remove(vertexHelpers[i]);
		}
		vertexHelpers = [];
		clickedVertex = null;
	//}
}

/** 
 * Attach the vertexHelper to stuff objects
 */
function attachVertexHelper_old()
{
	var vertices = INTERSECTED.geometry.vertices;
	for (var i=0; i<vertices.length/2; i++){
		// get the global position
		var position = {x: 0, y: 0, z: 0}; 
		position.x = vertices[i].x + INTERSECTED.position.x; 
		position.y = vertices[i].y + INTERSECTED.position.y; 
		position.z = vertices[i].z + INTERSECTED.position.z; 

		// create vertexHelpers
		vertexHelpers.push(addVertexHelper(position));
	}
}

/** 
 * Attach the vertexHelper to stuff objects
 */
function attachVertexHelper(idx)
{
	//var idx = labels.indexOf(INTERSECTED);
	var vertices = planes[idx].geometry.vertices;
	for (var i=0; i<vertices.length; i++){
		// get the global position
		var position = {x: 0, y: 0, z: 0}; 
		position.x = vertices[i].x + planes[idx].position.x; 
		position.y = vertices[i].y + planes[idx].position.y; 
		position.z = vertices[i].z + planes[idx].position.z; 

		// create vertexHelpers
		vertexHelpers.push(addVertexHelper(position));
	}

}

function addVertexHelper(position){
	var vertexHelper=new THREE.Mesh(
			new THREE.SphereGeometry(.3,.3,.3,8,8),
			new THREE.MeshBasicMaterial({color:0xffbf00})
		   );
	vertexHelper.position.copy(position);
	vertexHelper.visible = true;
	scene.add(vertexHelper);	
	return vertexHelper;
}

/** 
 * Process of adding a new user customized class
 * @params classname class name
 * @params color color accosiated with this class
 */
function addNewClass(classname, color)
{
    if (!classname) {
        alert('Name of new class cannot be empty');
        return;
    }

    if (category[classname] != undefined) {
        alert('Name of new class already exits!');
        return;
    }

    var button = document.createElement('button');
    button.setAttribute('type','button');
    button.id = classname;
    button.classList.add('label');
    button.classList.add('instance');

    button.appendChild(document.createTextNode(classname));
    document.getElementById('category').appendChild(button);

    category[classname] = category['unknown'];
    category[classname].type = classname;
    category[classname].colors = color;

    // add call back func
    initClassButton (classname);
}


/** 
 * Auto select the nearest fisheye camera
 * @params center the center of the focused object
 */
function selectFisheyeCam(center)
{
	var minDist = 100;    // threshold
	var closestCam = null;
	
	// TODO:
	// set a threshold to limit the distance from the object to the camera

	for ( var i = 0; i<camGroup.vCamera.length; i++) {
		var c = camGroup.vCamera[i];
		if (c.name[0] == 'p') continue;
		var camPose = new THREE.Vector3(c.matrixWorld.elements[12], c.matrixWorld.elements[13], c.matrixWorld.elements[14]);
		var dir = new THREE.Vector3(c.matrixWorld.elements[8], c.matrixWorld.elements[9], c.matrixWorld.elements[10]);
		var d = new THREE.Vector3(center.x - camPose.x, center.y - camPose.y, center.z - camPose.z);
		var dn = new THREE.Vector3(d.x, d.y, d.z);
		dn.normalize();
		dir.normalize();

		var dotProduct = dn.dot ( dir );
		if (dotProduct < Math.cos(THREE.Math.degToRad(FOV_FISH*0.5))) {
			continue;
		}

		var length = d.lengthSq();
		var n = d.projectOnVector(dir).length();

		// projection length
		var distance = length - n*n;
		if (distance <minDist) {
			minDist = distance;
			closestCam = c;
		}
	}

	// This function returns null if
	// the object is on the back side of both of the fisheye cameras

	return closestCam;
}


/** 
 * Find the nearest perspective camera w.r.t. the center
 * @params center the target
 */
function findNearestCam(center)
{
	var dist = 100000;
	var candidateMx = {
		poseP: null,
		poseGround: null
	};

	for ( var i in camPoses.poseP) {
		var c = camPoses.poseP[i];

		if (i == 0) {
			candidateMx.poseP = camPoses.poseP[i].clone();
			candidateMx.poseGround = camPoses.poseGround[i].clone();
		}
		// compute camera projection
		var camPose = new THREE.Vector3(c.elements[12], c.elements[13], c.elements[14]);
		var dist2D = (camPose.x - center.x)*(camPose.x - center.x) + (camPose.y - center.y)*(camPose.y - center.y);
		if (dist2D < dist) {
			dist = dist2D;
			//candidateMx = c.clone();

			candidateMx.poseP = camPoses.poseP[i].clone();
			candidateMx.poseGround = camPoses.poseGround[i].clone();
		}
	}

	return candidateMx;
}




/** 
 * Compute the height of the target wr.t. the gorund
 * @params center the target
 */
function computeGround(center)
{
	var candidateMX = findNearestCam(center);

	var obj;

	// old version
	if (candidateMX.poseGround.x == 0 && candidateMX.poseGround.y == 0 && candidateMX.poseGround.z == 0) {
		
		var initHeight = new THREE.Vector3(candidateMX.poseP.elements[12], candidateMX.poseP.elements[13], 
			candidateMX.poseP.elements[14]);
		initHeight.z -= CAMERA_HEIGHT;

		obj = {
			mx: candidateMX.poseP,
			height: initHeight.z
		}

		return obj;
	}
	// curr version
	var initHeight = getZ(candidateMX.poseGround, new THREE.Vector2(candidateMX.poseP.elements[12], candidateMX.poseP.elements[13]));


	obj = {
		mx: candidateMX.poseP,
		height: initHeight
	}
	return obj;
}


/** 
 * Auto select the perspective camera in which the focused object can be entirely seen
 * @params center the center of the focused object
 * @params obj the focused object
 */
function selectPerspectCam(center, obj)
{
	var closestCam = null;
	var index = -1;
	var indexMin = 10000000, closestCamMin = null, angleMax = 0;
	var minDist = 30;    // threshold

	for ( var i = 0; i<camGroup.vCamera.length; i++) {
		var c = camGroup.vCamera[i];
		if (c.name[0] == 'r' || c.name[0] == 'l') continue;

		// compute camera projection
		var camPose = new THREE.Vector3(c.matrixWorld.elements[12], c.matrixWorld.elements[13], c.matrixWorld.elements[14]);

		var d = new THREE.Vector3(center.x - camPose.x, center.y - camPose.y, center.z - camPose.z);
		if (d.length() > minDist) {
			continue;
		}

		var camMx = new THREE.Matrix4();
		var cam2Laser = new THREE.Matrix4();
		camMx.set(0, 1, 0, 0, -Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, 0, -Math.sqrt(2)/2, 0, Math.sqrt(2)/2, 0, 0, 0, 0, 1);
		camMx.getInverse(camMx);
		cam2Laser.set(0, 0, 1, 0, -1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 1);

		var currMx = c.matrixWorld.clone();
		currMx.multiply(camMx);
		currMx.multiply(cam2Laser);
		var camDir = new THREE.Vector3(currMx.elements[8], currMx.elements[9], currMx.elements[10]);
		camDir.normalize();


		var dir = new THREE.Vector3(1, 0, 0);
		
		
		var dotProduct = d.dot ( camDir );
		if (dotProduct < 0) continue;

		var inside = true;
		for (var j = 0; j<obj.geometry.vertices.length; j++) {
			var d = new THREE.Vector3(obj.geometry.vertices[j].x*obj.scale.x - camPose.x, 
				obj.geometry.vertices[j].y * obj.scale.y - camPose.y, 
				obj.geometry.vertices[j].z * obj.scale.z - camPose.z);

			d.add(obj.position);			
			var camDir_y = new THREE.Vector3(currMx.elements[4], currMx.elements[5], currMx.elements[6]);
			
			camDir_y.normalize();
			var yy = d.dot(camDir_y);

			var camDir_x = new THREE.Vector3(currMx.elements[0], currMx.elements[1], currMx.elements[2]);
			camDir_x.normalize();
			var xx = d.dot(camDir_x);

			var costheta = d.dot(camDir);
			if (costheta < 0) {
				inside = false; 
				break;
			}

 			var z = d.projectOnVector(camDir).length();
			var p = new THREE.Vector2(xx, yy);
			p.multiplyScalar(INTRINSIC.f/z).add(frame.frame_perspective.offset);

			if (p.x < 0 || p.x > frame.frame_perspective.width || p.y < 0 || p.y > frame.frame_perspective.height) {
				inside = false; 
				break;
			}
		}

		if (inside) {
			if (parseInt(c.name.substring(1)) > index) {
				index = parseInt(c.name.substring(1));
				closestCam = c;
			}
		}

		// get the camera with smallest viewing angle
		var dNorm = d.normalize();
		var cosTheta = dNorm.dot (camDir);
		if ( cosTheta > angleMax) {
			angleMax = cosTheta;
			closestCamMin = c;
		}
	}

	// This function returns null if
	// the object is on the back side of all the cameras

	if (index < 0) return closestCamMin;
	else return closestCam;
}



/** auto-config the virtual camera paras (focal length and offset) 
 * accorading to the annotated object bounding box
 */
function centralize()
{
	
	var factor = 1.5;
	var boundingCenter = new THREE.Vector3();
	var boundingRadius;
	var currCenter;
	var objMode = true;
	var lookAtCenter = new THREE.Vector3();

	if (INTERSECTED) {
		currCenterObj = INTERSECTED;
		// disable centralization for class stuff
		if (INTERSECTED.name.category == 'stuff') {
			alert('You cannot centralize the stuff object!');
			return;
		}
	}
	else {
		currCenterObj = controlsPerspective.pickerSphere;
		objMode = false;
	}

	currCenterObj.geometry.computeBoundingBox();

	// get bounding box radius
	boundingRadius = currCenterObj.geometry.boundingSphere.radius*Math.max(currCenterObj.scale.x, 
		currCenterObj.scale.y, currCenterObj.scale.z);
	var l_x = (currCenterObj.geometry.boundingBox.max.x-currCenterObj.geometry.boundingBox.min.x)/2*currCenterObj.scale.x;
	var l_y = (currCenterObj.geometry.boundingBox.max.y-currCenterObj.geometry.boundingBox.min.y)/2*currCenterObj.scale.y;
	var l_z = (currCenterObj.geometry.boundingBox.max.z-currCenterObj.geometry.boundingBox.min.z)/2*currCenterObj.scale.z;
	boundingRadius = Math.sqrt(l_x*l_x + l_y*l_y + l_z*l_z);
	boundingRadius *= factor;

	boundingCenter.addVectors(currCenterObj.geometry.boundingSphere.center, currCenterObj.position);
	lookAtCenter.copy(boundingCenter);

	
	// in the jetmode, calculte the max z of the obj
	var maxZ = currCenterObj.geometry.boundingBox.max.z*currCenterObj.scale.z + currCenterObj.position.z;
	var minZ = currCenterObj.geometry.boundingBox.min.z*currCenterObj.scale.z + currCenterObj.position.z;
	
	// if not in the object centrix mode, we manually adjust the height of the center.
	if (!objMode) {
		//boundingCenter.z = LEVEL;
	}


	if (controlHandler.autoCenter) {
		// auto selctec perspective view camera
		var tmp = selectPerspectCam(boundingCenter, currCenterObj);

		if (!(tmp === null)) currPersCam = tmp;
		var newCam = changeImgSingle(currPersCam.name);

		// auto selctec side view camera
		var tmpFish = selectFisheyeCam(boundingCenter);
		if(!( tmpFish=== null)){
			currSideCam = tmpFish;
			var newCam = changeImgSingle(currSideCam.name);
		}

		// in other situations such as no camera can see the object (dotproduct < 0)
		if  (tmp === null) {
			alert('Centralization fails: the object cannot be seen in the perspective camera');
			return;
		}
		
		if (tmpFish === null) {
			alert('Centralization fails: the object cannot be seen in the fisheye cameras.');
			return;
		}

		displayMsg('status', 'Centralization the current object automatically');
	}

	else {
		displayMsg('status', 'Centralization the current object manually');
	}

	// pose of the fisheye camera
	var camPose = new THREE.Vector3(currSideCam.matrixWorld.elements[12], 
		currSideCam.matrixWorld.elements[13], currSideCam.matrixWorld.elements[14]);

	// project the distance to the normal vector
	var dir = new THREE.Vector3(currSideCam.matrixWorld.elements[8], currSideCam.matrixWorld.elements[9], 
		currSideCam.matrixWorld.elements[10]);
	var distAbs = new THREE.Vector3(boundingCenter.x-camPose.x, boundingCenter.y-camPose.y, boundingCenter.z-camPose.z); 
	var dist = distAbs.projectOnVector(dir).length();

	// choose the wrong camera
	if (distAbs.dot(dir) < 0) {
		alert('You choose a wrong side view camera. Please choose a correct camera!');
		return;
	}

	if (!controlHandler.autoCenter) {
		// compute if the object is in the range of fov
		var camPose = new THREE.Vector3(currSideCam.matrixWorld.elements[12], 
			currSideCam.matrixWorld.elements[13], currSideCam.matrixWorld.elements[14]);
		var dir = new THREE.Vector3(currSideCam.matrixWorld.elements[8], currSideCam.matrixWorld.elements[9], 
			currSideCam.matrixWorld.elements[10]);
		var d = new THREE.Vector3(boundingCenter.x - camPose.x, boundingCenter.y - camPose.y, boundingCenter.z - camPose.z);
		d.normalize();
		dir.normalize();

		var dotProduct = d.dot ( dir );
		if (dotProduct < Math.cos(FOV_FISH/2)) 
			displayMsg('status', 'Warning: The object is out of range of the current selected fisheye camera.');
	}

	// adjust the look at angle
	// TODO:
	// bug#1: centralized twice -> previous target is updated
	controlsPerspective.setTarget(lookAtCenter, !centralizeOn);
		
	// auto-configure the focal length
	var f;
	if (objMode) {
		f = Math.max(frame.frame_fisheye.height*dist/(boundingRadius*2), 
		frame.frame_fisheye.height/(2*Math.tan( THREE.Math.degToRad(FOV_FISH*0.5))));
	}
	else {
		// in the non-object centric mode, use a fixed focal length
		f = INTRINSIC.fVirtual;
	}

	INTRINSIC.fVirtual = f;
	changeVirtualFocal(f);

	// auto configure the virtual image offset
	// TODO
	var delta3D = new THREE.Vector3(boundingCenter.x-camPose.x, boundingCenter.y-camPose.y, 
		boundingCenter.z-camPose.z);

	var dirY = new THREE.Vector3(currSideCam.matrixWorld.elements[0], currSideCam.matrixWorld.elements[1], 
		currSideCam.matrixWorld.elements[2]);
	dirY.normalize();
	var dirX = new THREE.Vector3(currSideCam.matrixWorld.elements[4], currSideCam.matrixWorld.elements[5], 
		currSideCam.matrixWorld.elements[6]);
	dirX.normalize();

	var delta =  new THREE.Vector2(delta3D.dot(dirX), delta3D.dot(dirY));

	var offset = new THREE.Vector2();
	offset.x = (delta.x)*f/dist; 
	offset.y = (delta.y)*f/dist;  

	// we also need set the max/min offset in this case to prevent large distortions
	// assume fov = x deg
	// the max scene size that can be seen = 2*(tan(x/2)*f
	var p = Math.tan(THREE.Math.degToRad(FOV_FISH/2));

	if (camSide == 'right') {
		frame.frame_fisheye.offset.x = Math.max(Math.min(p*f, frame.frame_fisheye.width/2+offset.x), 
			frame.frame_fisheye.width - p*f); 
		frame.frame_fisheye.offset.y = Math.max(Math.min(p*f, frame.frame_fisheye.height/2+offset.y), 
			frame.frame_fisheye.height - p*f);
	}

	else if (camSide == 'left') {
		frame.frame_fisheye.offset.x = Math.max(Math.min(p*f, frame.frame_fisheye.width/2+offset.x), 
			frame.frame_fisheye.width - p*f);
		frame.frame_fisheye.offset.y = Math.max(Math.min(p*f, frame.frame_fisheye.height/2-offset.y), 
			frame.frame_fisheye.height - p*f);
	}

	changeVirtualOffset(frame.frame_fisheye.offset.x, 'x');
	changeVirtualOffset(frame.frame_fisheye.offset.y, 'y');

	// also the range should be within the range of the slider bar? (do we need to)
	frame.frame_fisheye.offset.x = Math.min(Math.max(frame.frame_fisheye.offset.x, FISHEYE_OFF_X.min), FISHEYE_OFF_X.max);
	frame.frame_fisheye.offset.y = Math.min(Math.max(frame.frame_fisheye.offset.y, FISHEYE_OFF_Y.min), FISHEYE_OFF_Y.max);


	if (objMode) {
		centralizeOn = true;
		shaderMaterial.uniforms.filterOn.value = 1;
		shaderMaterial.uniforms.center.value = boundingCenter.clone();
		shaderMaterial.uniforms.dir.value = dir.clone();
		shaderMaterial.uniforms.radius.value = boundingRadius/1.2;
		shaderMaterial.uniforms.jet_max.value = maxZ;
		shaderMaterial.uniforms.jet_min.value = minZ;
	}
	else {
		centralizeOn_m = true;
	}
 
  	currSideCam.visible = controlHandler.showCam;
  	currPersCam.visible = controlHandler.showCam;
  	
  	if (INTERSECTED) {
  		changeGroupVisbility(labels, false);
  		changeGroupVisbility(labels_helper, false);
  		changeGroupVisbility(labels_arrow, false);

      	INTERSECTED.visible = true;
      	labels_helper[currentIdx].visible = true;
      	labels_arrow[currentIdx].visible = true;

      	displayMsg('mode', 'Centralization Mode (object-centered)');
    }
    
  	currControlCube.update();
}

/** 
 * reset the auto-configuration of the virtual camera
 */
function resetParas(noReset)
{
		
	var _noReset;
	if (noReset == 'undefined') _noReset = false;
	_noReset = noReset;

	if (!_noReset) {

		INTRINSIC.fVirtual = frame.frame_fisheye.fVirtual;
		changeVirtualFocal(INTRINSIC.fVirtual);

		frame.frame_fisheye.offset.x = frame.frame_fisheye.width/2;
		frame.frame_fisheye.offset.y = frame.frame_fisheye.height/2;

		changeVirtualOffset(frame.frame_fisheye.offset.x, 'x');
		changeVirtualOffset(frame.frame_fisheye.offset.y, 'y');
	}

	if (!centralizeOn && !centralizeOn_m) return;
	
	displayMsg('status', 'Reset centralization mode');

	centralizeOn = false;
	centralizeOn_m = false;

	currSideCam.visible = true;
    	currPersCam.visible = true;

	shaderMaterial.uniforms.filterOn.value = 0;
	showObjectsbyClass(controlHandler.dispMode);

}


function moveCameras(dir) {

	var selectCam = [];
	selectCam[currPersCam.name[0]] = {
		nearestCam: parseInt(currPersCam.name.substring(1)) + dir,
		minDist: 500,
		minCam: currPersCam
	}

	selectCam[currSideCam.name[0]] = {
		nearestCam: parseInt(currSideCam.name.substring(1)) + dir,
		minDist: 500,
		minCam: currSideCam
	}
	
	for (var i = 0; i<camGroup.vCamera.length; i++) {
		var c = camGroup.vCamera[i];
		if (c.name[0] != currPersCam.name[0] && c.name[0] != currSideCam.name[0]) continue;
		
		var cameraIdx = c.name[0];
		if (dir*(parseInt(c.name.substring(1)) - selectCam[cameraIdx].nearestCam) > 0 
			&& dir*(parseInt(c.name.substring(1)) - selectCam[cameraIdx].nearestCam) < selectCam[cameraIdx].minDist) {
			
			selectCam[cameraIdx].minDist = dir*(parseInt(c.name.substring(1)) - selectCam[cameraIdx].nearestCam);
			selectCam[cameraIdx].minCam = c;
		}
	}

	currPersCam = selectCam[currPersCam.name[0]].minCam;
	currSideCam = selectCam[currSideCam.name[0]].minCam;

	changeImgSingle(currPersCam.name);
	changeImgSingle(currSideCam.name);
	
	shaderMaterial.uniforms.timestamp_center.value = parseInt(currPersCam.name.substring(1)); 

	if (dynamicVisibilitybyTime == true) {
		changeVisibilitybyTime(parseInt(currPersCam.name.substring(1)));
	}
	
	updateFrameId(controlHandler.showFrame);
}

/**
 * move all cameras to the specified time and show point clouds at the specified time 
 * @params time Target timestamp
 * @dir Direction of moving, in case there is no frames at the target timestamp
 */
function moveCamerasToTime(time, dir){
	
	if (!dir) {
		dir = 1;
	}
	while (fullCamList.indexOf(time)<0 && time>fullCamList[0] && time<fullCamList[fullCamList.length-1]){
		time = time + dir;
	}
	shaderMaterial.uniforms.timestamp_center.value = time;
	var selectCam = [];
	selectCam[currPersCam.name[0]] = {
		nearestCam: time, 
		minDist: 100,
		minCam: currPersCam
	}

	selectCam[currSideCam.name[0]] = {
		nearestCam: time,
		minDist: 100,
		minCam: currSideCam
	}
	
	for (var i = 0; i<camGroup.vCamera.length; i++) {
		var c = camGroup.vCamera[i];
		if (c.name[0] != currPersCam.name[0] && c.name[0] != currSideCam.name[0]) continue;
		
		var cameraIdx = c.name[0];
		if ( Math.abs(parseInt(c.name.substring(1)) - selectCam[cameraIdx].nearestCam) < selectCam[cameraIdx].minDist) {
			
			selectCam[cameraIdx].minDist = Math.abs(parseInt(c.name.substring(1)) - selectCam[cameraIdx].nearestCam);
			selectCam[cameraIdx].minCam = c;
		}
	}
	if (currPersCam.name!=selectCam[currPersCam.name[0]].minCam.name) {
		currPersCam = selectCam[currPersCam.name[0]].minCam;
		changeImgSingle(currPersCam.name);
	}
	if (currSideCam.name!=selectCam[currSideCam.name[0]].minCam.name) {
		currSideCam = selectCam[currSideCam.name[0]].minCam;
		changeImgSingle(currSideCam.name);
	}
	if (dynamicVisibilitybyTime == true) {
		changeVisibilitybyTime(time);
	}

}

/** 
 * change visibility of dynamic object w.r.t. to timestamp
 */
function changeVisibilitybyTime(time){
	// if current selected object is on the spline 
	if (INTERSECTED) {
		// detach object if the spline has autoboxes for clear view 
		if (INTERSECTED.name.dynamic == 1 && splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1){ 
			labels[currentIdx].name.level_min = paras.level_min;
			labels[currentIdx].name.level_max = paras.level_max;
			labels_helper[currentIdx].material.linewidth = 1;
			attachControlCubes(INTERSECTED, [], false);
		}
	}
	for (var i=0; i<labels.length; i++){
		if (labels[i].name.dynamic==0) { continue; }
		// visible if timestamp of the object is equal to the speficied time 
		if (labels[i].name.timestamp == time){
			labels[i].visible = controlHandler.showAnnotation;
			labels_helper[i].visible = controlHandler.showAnnotation;
			labels_arrow[i].visible = controlHandler.showAnnotation;
		}
		// visible if autoBox is not toggled 
		else if (splineIsAutoBoxed[labels[i].name.dynamicSeq] == 0){
			labels[i].visible = controlHandler.showAnnotation;
			labels_helper[i].visible = controlHandler.showAnnotation;
			labels_arrow[i].visible = controlHandler.showAnnotation;
		}
		else {
			labels[i].visible = false;
			labels_helper[i].visible = false;
			labels_arrow[i].visible = false;
		}

		// if visibleSeq is specified, hide the other objects in different seqs
		if (controlHandler.dispMode==5 && labels[i].name.dynamicSeq!=visibleSeq) {
			labels[i].visible = false;
			labels_helper[i].visible = false;
			labels_arrow[i].visible = false;
		}
	}

}

/** 
 * change the dynamic status of currect object
 * status can only be changed when the selected object is not a spline control object, nor an autobbox
 */
function toggleDynamic()
{
	if (INTERSECTED && readOnly != 1) {
		if (INTERSECTED.name.dynamic == 1 && INTERSECTED.name.dynamicIdx==-2) {
			alert('Cannot change dynamic status of automatically generated bounding boxes');
			return;
		}
		if (INTERSECTED.name.dynamic == 1 && splineCurves[INTERSECTED.name.dynamicSeq]!=undefined){
			alert('Cannot change dynamic status of spline control points. Try remove spline at first.');
			return;
		}
		onHoldingSpline = true;
		INTERSECTED.name.dynamic = 1 - INTERSECTED.name.dynamic;
		labels_helper[currentIdx].material.color.setHex(WIREFRAME_COLOR[INTERSECTED.name.dynamic]);
		if (INTERSECTED.name.dynamic)
			labels[currentIdx].material.opacity = dynamicopacity;
		else 
			labels[currentIdx].material.opacity = labelOpacity;
		dynamicOn = !dynamicOn;
		// dynamic sequence should always be initialized by toggle dynamic button on an idependent object
		// i.e. object not belonging to a spline
		if (INTERSECTED.name.dynamic == 1 ){
			currDynamicSeq = currDynamicSeq + 1;
			currDynamicIdx = 0;
			INTERSECTED.name.dynamicSeq = currDynamicSeq;
			INTERSECTED.name.dynamicIdx = 0;

		// initialize the sline
		if (currDynamicIdx == 0 ) {
			
			var splineGeometry = new THREE.Geometry();
			for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
			        splineGeometry.vertices.push( new THREE.Vector3() );
			
			}
			var positions = [];
			positions.push(INTERSECTED.position);		

			// initialize an additional point for onMouseOver
			var newpos = new THREE.Vector3();
			newpos.x = INTERSECTED.position.x;
			newpos.y = INTERSECTED.position.y;
			newpos.z = INTERSECTED.position.z;
			positions.push(newpos);		
                        var curve = new THREE.CatmullRomCurve3( positions );
                        curve.type = 'catmullrom';
                        curve.mesh = new THREE.Line( splineGeometry.clone(), new THREE.LineBasicMaterial( {
                                color: SPLINE_COLOR[0],
                                opacity: 0.35,
                                linewidth: 2
                                } ) );
                        curve.mesh.castShadow = true;
			curve.mesh.material.depthTest = false;
			scene.add(curve.mesh);
			console.log('curve', curve);

			splineCurves.push(curve);
			splinePositions.push(positions);
			splineIsAutoBoxed.push(0); 
        		updateSplineOutline(splineCurves[currDynamicSeq]);
		}

		}
		else {
			currDynamicSeq = currDynamicSeq - 1;
			currDynamicIdx = -1;
			INTERSECTED.name.dynamicSeq = -1;
			INTERSECTED.name.dynamicIdx = -1;
		}
	}
}

/** 
 * activated when toggle SlidingWindow
 * also set the colorMode and dispMode for better visualization of dynamic objects 
 */
function slidingPointCloud()
{
	if (controlHandler.slidingPcd == true) {
		shaderMaterial.uniforms.slidingPcdOn.value = 1;
		moveCamerasToTime(shaderMaterial.uniforms.timestamp_center.value);
		//show dense pcd
		controlHandler.showDynamicPcd = true;
		shaderMaterial.uniforms.densePcdOn.value = 1;
		//colorMode
	//	shaderMaterial.uniforms.jetMode.value = 1;
		//dispMode
	//	controlHandler.dispMode = 4;
	//	changeDispMode();
	}
	else{
		shaderMaterial.uniforms.slidingPcdOn.value = 0;
		//hide dense pcd
	    	shaderMaterial.uniforms.densePcdOn.value = controlHandler.showDynamicPcd;
		//dispMode
	//	controlHandler.dispMode = 0;
	//	changeDispMode();
	}
}

function addSplineObject( position ) {
	var object = copyShape(position);
        return object;
}

function removeSplineObject(object) {
	var numPoints=0;	
	var currSeq = object.name.dynamicSeq;
	for (var i=0; i<labels.length; i++){
		if (labels[i].name.dynamicSeq == currSeq) {
			numPoints = numPoints+1;
			if (labels[i].name.dynamicIdx > object.name.dynamicIdx) {
				labels[i].name.dynamicIdx = labels[i].name.dynamicIdx - 1;
			}
		}
	}
	// delete the spline and reset the dynamic status if there is only one object left
	if (numPoints == 2){
		scene.remove(splineCurves[object.name.dynamicSeq].mesh);
		splinePositions.splice(object.name.dynamicSeq,1);
		splineCurves.splice(object.name.dynamicSeq,1);	
		splineIsAutoBoxed.splice(object.name.dynamicSeq,1); 
		for (var i=0; i<labels.length; i++){
			if (labels[i].name.dynamic == 0) {continue;}
			if ( labels[i].name.dynamicSeq>currSeq) {
					labels[i].name.dynamicSeq = labels[i].name.dynamicSeq - 1;	
			}
			else if (labels[i].name.dynamicSeq==currSeq) {
				labels[i].name.dynamic = 0;
				labels[i].name.dynamicSeq = -1;
				labels[i].name.dynamicIdx = -1;
				labels_helper[i].material.color.setHex(WIREFRAME_COLOR[labels[i].name.dynamic]);
				labels[i].material.opacity = labelOpacity;
			}
		}
		currDynamicSeq = currDynamicSeq - 1;	
	}
	else{
		splinePositions[object.name.dynamicSeq].splice(object.name.dynamicIdx,1);
		updateSplineOutline(splineCurves[object.name.dynamicSeq]);
	}
}

/**
 * Insert a control object after the selected control object
 */
function insertSplineObject() {
	if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
		alert('ClearAutoBox before changing object');
		return;
	}
	if (INTERSECTED.name.dynamicIdx>-1) {
		
		var idx = INTERSECTED.name.dynamicIdx;
		var seq = INTERSECTED.name.dynamicSeq;
		// return if the last object on the spline is chosen 
		if (idx == splinePositions[seq].length-1) {
			return;	
		}

		// update indices
		var positions = splinePositions[seq];
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamicSeq==INTERSECTED.name.dynamicSeq
				&& labels[i].name.dynamicIdx > idx) {
				console.log('Idx', labels[i].name.dynamicIdx);
				labels[i].name.dynamicIdx = labels[i].name.dynamicIdx+1;
				console.log('updatedIdx', labels[i].name.dynamicIdx);
			}
		}

		// compute median pos
		var medianPos = new THREE.Vector3();	
		medianPos.x = (positions[idx].x + positions[idx+1].x) * 0.5;
		medianPos.y = (positions[idx].y + positions[idx+1].y) * 0.5;
		medianPos.z = (positions[idx].z + positions[idx+1].z) * 0.5;

	        // align the bottom of the cube and the ground
	        var currentPos = computeGround(medianPos);
	        medianPos.z = currentPos.height + INTERSECTED.geometry.boundingBox.max.z*INTERSECTED.scale.z;		
		console.log('medianPos', medianPos);

		// update spline
		var obj = copyShape(medianPos);
		positions.splice(idx+1, 0, obj.position);
		obj.name.dynamicIdx = idx+1;
		obj.name.timestamp = -1;
		updateSplineOutline(splineCurves[INTERSECTED.name.dynamicSeq]);
			
	}
}

/**
 * Insert a control object within each two consecutive control objects 
 */
function doubleSplineObject() {
	if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
		alert('ClearAutoBox before changing control object');
		return;
	}
	if (INTERSECTED.name.dynamicIdx>-1) {
		var positions = splinePositions[INTERSECTED.name.dynamicSeq];
		var medianPoses = [];

		// update indices
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamicSeq==INTERSECTED.name.dynamicSeq
					&& labels[i].name.dynamicIdx > -1) {
				console.log('Idx', labels[i].name.dynamicIdx);
				labels[i].name.dynamicIdx = labels[i].name.dynamicIdx*2;
				console.log('updatedIdx', labels[i].name.dynamicIdx);
			}
		}

		// compute median poses
		for (var i=0; i<positions.length-1; i++){
			var medianPos = new THREE.Vector3();	
			medianPos.x = (positions[i].x + positions[i+1].x) * 0.5;
			medianPos.y = (positions[i].y + positions[i+1].y) * 0.5;
			medianPos.z = (positions[i].z + positions[i+1].z) * 0.5;
			console.log('medianPos', medianPos);
			medianPoses.push(medianPos);
		}	

		// update spline
		for (var i=0; i<medianPoses.length; i++){
			var obj = copyShape(medianPoses[i]);
			positions.splice(i*2+1, 0, obj.position);
			obj.name.dynamicIdx = i*2+1;
			obj.name.timestamp = -1;
			updateSplineOutline(splineCurves[INTERSECTED.name.dynamicSeq]);
			
		}
	}
}

/**
 * find the nearest point on the spline if the automatically generated box is transformed
 */
function fixedOnSpline(event) {
	console.log('running fixedOnSpline');
	var curve = splineCurves[INTERSECTED.name.dynamicSeq];
	var vertices = curve.mesh.geometry.vertices;
	var minDis = 10000;
	var minInd;
	// search the closest point on spline
	for (var i=0; i<vertices.length; i++){
		var l_x = INTERSECTED.position.x-vertices[i].x;
		var l_y = INTERSECTED.position.y-vertices[i].y;
		var l_z = INTERSECTED.position.z-vertices[i].z;
		var distance = Math.sqrt(l_x*l_x + l_y*l_y + l_z*l_z);
		if (distance < minDis) {
			minDis = distance;
			minInd = i;	
		}
	}

	// position
	INTERSECTED.position.copy(vertices[minInd]); 

	// rotation
	// first find the nearest spline control points
	var rotation = new THREE.Euler();
	var forwardDis = 10000;
	var backwardDis = 10000;
	var forwardIdx;
	var backwardIdx;
	for (i=0; i<labels.length; i++){
		if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq &&
				labels[i].name.dynamicIdx > -1) {
			var dis = labels[i].name.timestamp - INTERSECTED.name.timestamp;
			if (dis > 0 && dis < forwardDis){
				forwardDis = dis;
				forwardIdx = i;
			}
			else if (dis < 0 && -dis < backwardDis) {
				backwardDis = -dis;
				backwardIdx = i;
			}
		}	
	}
	var startVertice = getVectorIndex(vertices, labels[forwardIdx].position, 0.2);
	var endVertice = getVectorIndex(vertices, labels[backwardIdx].position, 0.2);

	// then compute the rotation of the object
	var startRotation = labels[forwardIdx].rotation;
	var endRotation = labels[backwardIdx].rotation;
	var rotationZRange = endRotation.z - startRotation.z; 
	if ((Math.abs(rotationZRange))>Math.PI){
		rotationZRange = 2*Math.PI - rotationZRange; 	
	}
	var ratio = (minInd-startVertice)/(endVertice-startVertice);
	if (ratio < 0 || ratio > 1) {
		undoMove();
		alert('Invalid move. Object should be within the correct range.')
	}
	console.log('ratio',ratio);
	rotation.x = ratio*(endRotation.x-startRotation.x) + startRotation.x;
	rotation.y = ratio*(endRotation.y-startRotation.y) + startRotation.y;
	rotation.z = ratio*rotationZRange + startRotation.z;
	INTERSECTED.rotation.copy(rotation); 

	//update stack
	INTERSECTED.name.stack[INTERSECTED.name.stack.length-1].position = vertices[minInd];
	
}

function updateSplineOutline(spline) {

	if(!spline) { return; } 
        var p;
        splineMesh = spline.mesh;
        for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
                p = splineMesh.geometry.vertices[ i ];
                p.copy( spline.getPoint( i /  ( ARC_SEGMENTS - 1 ) ) );
        }
        splineMesh.geometry.verticesNeedUpdate = true;
}


/**
 * Update the scale of all control cubes
 */
function updateControlCubesScale(event){
	if (INTERSECTED){
		var currSeq = INTERSECTED.name.dynamicSeq;
		var currIdx = INTERSECTED.name.dynamicIdx;
		for (var i=0; i<labels.length; i++){
			if (labels[i].name.dynamicSeq == currSeq && labels[i].name.dynamicIdx != currIdx) {
				var prev_sz = labels[i].scale.z;
				labels[i].scale.set(INTERSECTED.scale.x, INTERSECTED.scale.y, INTERSECTED.scale.z);
				// keep the bottom surface fixed 
				labels[i].position.z = labels[i].position.z + labels[i].geometry.boundingBox.max.z * (labels[i].scale.z - prev_sz);
				labels[i].geometry.computeBoundingBox();
			}
		}
		scaleUpdated = true;

	}
}


/**
 * compute the points at a given timestamp
 *
 * Version3: compute bbox based on the detected dense dynamic point cloud 
 */
function getPointsAtTime(index, frame){
	var points = [];
	for( var v = 0,  vl = index.length; v < vl; v++ ) {
		if (dynamicTimestamp[index[v]] == frame){
			points.push(dynamicVertices[index[v]]);
		}	
	}
	return points;
}

/**
 * compute the points at a given timestamp
 *
 * Version1: compute bbox based on the sparse accumulated point cloud 
 */
function getPointsAtTimeOld(index, frame){
	var index_out = [];
	for( var v = 0,  vl = index.length; v < vl; v++ ) {
		if (plyTimestamp[index[v]] == frame){
			index_out.push(index[v]);
		}	
	}
	return index_out;
}

/**
 * compute the points inside a given cube
 * @params index Pre-computed subset index of interested points
 * @params object Cube
 * @params grid If given, check the con-occurrance
 *
 * Version2: compute bbox based on the dense cloud per frame
 * Version3: compute bbox based on the detected dense dynamic point cloud 
 */
function getPointsInCube(pos, object, grid){
	var points = {
		index : [],
		gridIndex: [],
	};
	var bbox = object.geometry.boundingBox;
	for( var v = 0,  vl = pos.length; v < vl; v++ ) {
		var local_pos = object.worldToLocal(pos[v]); 
		if (local_pos.x<bbox.max.x && local_pos.x>bbox.min.x &&
		local_pos.y<bbox.max.y && local_pos.y>bbox.min.y &&
		local_pos.z<bbox.max.z && local_pos.z>bbox.min.z){
			if (!grid) {
				points.index.push(v);
				gridIndex = posToIndex(bbox, local_pos, gridSize);
				points.gridIndex.push(gridIndex);
			}
			else{
				gridIndex = posToIndex(bbox, local_pos, gridSize);
				if (grid[gridIndex]==1){
					points.index.push(v);
					points.gridIndex.push(gridIndex);
				}
			}

		}	
		object.localToWorld(pos[v]);
	}	

	return points;
}
/**
 * compute the points inside a given cube
 * @params index Pre-computed subset index of interested points
 * @params object Cube
 * @params grid If given, check the con-occurrance
 * @return indices of points inside the cube
 * Version1: compute bbox based on the accumulated point cloud 
 */
function getPointsInCubeSparse(index, object, grid){
	// var points = {
	// 	index : [],
	// 	gridIndex: [],
	// };
	var points_index = [];
	var vertices = plyParticles.geometry.vertices;
	var bbox = object.geometry.boundingBox;
	var numVertice;

	// for debugging
	label_color_list = new Array(vertices.length);

	// neglect points near the ground
	var z_offset = 0.15;

	// if not pre-computed subset is given, then iterate through all points
	if (!index){
		numVertice = vertices.length;
	}else{
		numVertice = index.length;
	}
	for( var v = 0,  vl = numVertice; v < vl; v++ ) {
		var vind;
		if (!index){
			vind = v;
		}else{
			vind = index[v];
		}
		var local_pos = object.worldToLocal(vertices[vind]); 

		if (local_pos.x<bbox.max.x && local_pos.x>bbox.min.x &&
		local_pos.y<bbox.max.y && local_pos.y>bbox.min.y &&
		local_pos.z<bbox.max.z && local_pos.z>bbox.min.z + z_offset){
			points_index.push(vind);
			label_color_list[vind] = new THREE.Color(0.9, 0.1, 0.1);
			// if (!grid) {
			// 	points.index.push(vind);
			// 	gridIndex = posToIndex(bbox, local_pos, gridSize);
			// 	points.gridIndex.push(gridIndex);
			// }
			// else{
			// 	gridIndex = posToIndex(bbox, local_pos, gridSize);
			// 	if (grid[gridIndex]==1){
			// 		points.index.push(vind);
			// 		points.gridIndex.push(gridIndex);
			// 	}
			// }

		}
		else{
			label_color_list[vind] = new THREE.Color(1.0, 1.0, 1.0);
		}
		
		object.localToWorld(vertices[vind]);
	}

	// shaderMaterial.attributes.cartoonColor.value = label_color_list;
	// shaderMaterial.attributes.cartoonColor.needsUpdate = true;

	return points_index;
}

/**
 * pre-compute the point cloud subset which lies in the vinicity of the current activated spline 
 *
 * Version3: compute bbox based on the detected dense dynamic point cloud 
 */
function getPointsOnSpline(){
	var range = {
		max_x: -1e6,
		min_x: 1e6,
		max_y: -1e6,
		min_y: 1e6, 
		max_z: -1e6,
		min_z: 1e6, 
		radius: 0	
	}
	var positions = splinePositions[INTERSECTED.name.dynamicSeq];	
	for (var i=0; i<positions.length; i++){
		if (range.max_x < positions[i].x) {range.max_x = positions[i].x; }
		if (range.min_x > positions[i].x) {range.min_x = positions[i].x; }
		if (range.max_y < positions[i].y) {range.max_y = positions[i].y; }
		if (range.min_y > positions[i].y) {range.min_y = positions[i].y; }
		if (range.max_z < positions[i].z) {range.max_z = positions[i].z; }
		if (range.min_z > positions[i].z) {range.min_z = positions[i].z; }
	}

	var l_x = (INTERSECTED.geometry.boundingBox.max.x-INTERSECTED.geometry.boundingBox.min.x)/2*INTERSECTED.scale.x;
	var l_y = (INTERSECTED.geometry.boundingBox.max.y-INTERSECTED.geometry.boundingBox.min.y)/2*INTERSECTED.scale.y;
	var l_z = (INTERSECTED.geometry.boundingBox.max.z-INTERSECTED.geometry.boundingBox.min.z)/2*INTERSECTED.scale.z;
	range.radius = Math.sqrt(l_x*l_x + l_y*l_y + l_z*l_z);
		
	var index = [];
	var pos = [];
	var vertices = dynamicVertices;
	var max_x = range.max_x + range.radius;
	var min_x = range.min_x - range.radius;
	var max_y = range.max_y + range.radius;
	var min_y = range.min_y - range.radius;
	var max_z = range.max_z + range.radius;
	var min_z = range.min_z - range.radius;
	// TODO: use height of the ground, rather than zvar
	for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
		if (vertices[v].x < max_x && vertices[v].x > min_x &&
		vertices[v].y < max_y && vertices[v].y > min_y &&
		vertices[v].z < max_z && vertices[v].z > min_z ){
			index.push(v);
			pos.push(vertices[v]);
		}	
	}	
	return index;
}

/**
 * pre-compute the point cloud subset which lies in the vinicity of the current activated spline 
 *
 * Version1: compute bbox based on the sparse accumulated point cloud 
 */
function getPointsOnSplineOld(){
	var range = {
		max_x: -1e6,
		min_x: 1e6,
		max_y: -1e6,
		min_y: 1e6, 
		max_z: -1e6,
		min_z: 1e6, 
		radius: 0	
	}
	var positions = splinePositions[INTERSECTED.name.dynamicSeq];	
	for (var i=0; i<positions.length; i++){
		if (range.max_x < positions[i].x) {range.max_x = positions[i].x; }
		if (range.min_x > positions[i].x) {range.min_x = positions[i].x; }
		if (range.max_y < positions[i].y) {range.max_y = positions[i].y; }
		if (range.min_y > positions[i].y) {range.min_y = positions[i].y; }
		if (range.max_z < positions[i].z) {range.max_z = positions[i].z; }
		if (range.min_z > positions[i].z) {range.min_z = positions[i].z; }
	}

	var l_x = (INTERSECTED.geometry.boundingBox.max.x-INTERSECTED.geometry.boundingBox.min.x)/2*INTERSECTED.scale.x;
	var l_y = (INTERSECTED.geometry.boundingBox.max.y-INTERSECTED.geometry.boundingBox.min.y)/2*INTERSECTED.scale.y;
	var l_z = (INTERSECTED.geometry.boundingBox.max.z-INTERSECTED.geometry.boundingBox.min.z)/2*INTERSECTED.scale.z;
	range.radius = Math.sqrt(l_x*l_x + l_y*l_y + l_z*l_z);
		
	var index = [];
	var pos = [];
	var vertices = plyParticles.geometry.vertices;
	var max_x = range.max_x + range.radius;
	var min_x = range.min_x - range.radius;
	var max_y = range.max_y + range.radius;
	var min_y = range.min_y - range.radius;
	var max_z = range.max_z + range.radius;
	var min_z = range.min_z - range.radius;
	// TODO: use height of the ground, rather than zvar
	var values_zvar = shaderMaterial.attributes.zVar.value;
	for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
		if (vertices[v].x < max_x && vertices[v].x > min_x &&
		vertices[v].y < max_y && vertices[v].y > min_y &&
		vertices[v].z < max_z && vertices[v].z > min_z &&
		values_zvar[v] > 0.3){
			index.push(v);
			pos.push(vertices[v]);
		}	
	}	
	return index;
}

/**
 * pre-compute the point cloud subset which lies in the vinicity of the current activated spline 
 *
 * Version2: compute bbox based on the dense cloud per frame
 */
function getPointsOnSplineAtTime(timestamp){
	var range = {
		max_x: -1e6,
		min_x: 1e6,
		max_y: -1e6,
		min_y: 1e6, 
		max_z: -1e6,
		min_z: 1e6, 
		radius: 0	
	}
	var positions = splinePositions[INTERSECTED.name.dynamicSeq];	
	for (var i=0; i<positions.length; i++){
		if (range.max_x < positions[i].x) {range.max_x = positions[i].x; }
		if (range.min_x > positions[i].x) {range.min_x = positions[i].x; }
		if (range.max_y < positions[i].y) {range.max_y = positions[i].y; }
		if (range.min_y > positions[i].y) {range.min_y = positions[i].y; }
		if (range.max_z < positions[i].z) {range.max_z = positions[i].z; }
		if (range.min_z > positions[i].z) {range.min_z = positions[i].z; }
	}

	var l_x = (INTERSECTED.geometry.boundingBox.max.x-INTERSECTED.geometry.boundingBox.min.x)/2*INTERSECTED.scale.x;
	var l_y = (INTERSECTED.geometry.boundingBox.max.y-INTERSECTED.geometry.boundingBox.min.y)/2*INTERSECTED.scale.y;
	var l_z = (INTERSECTED.geometry.boundingBox.max.z-INTERSECTED.geometry.boundingBox.min.z)/2*INTERSECTED.scale.z;
	range.radius = Math.sqrt(l_x*l_x + l_y*l_y + l_z*l_z);
		
	var index = [];
	var pos = [];
	var ind = denseLoadedTimestamp.indexOf(timestamp);
	var vertices = plyVerticeBuffer[ind];
	var max_x = range.max_x + range.radius;
	var min_x = range.min_x - range.radius;
	var max_y = range.max_y + range.radius;
	var min_y = range.min_y - range.radius;
	var max_z = range.max_z + range.radius;
	var min_z = range.min_z - range.radius;
	// TODO: use height of the ground, rather than zvar
	//var values_zvar = shaderMaterial.attributes.zVar.value;
	for( var v = 0,  vl = vertices.length; v < vl; v++ ) {
		if (vertices[v].x < max_x && vertices[v].x > min_x &&
		vertices[v].y < max_y && vertices[v].y > min_y &&
		vertices[v].z < max_z && vertices[v].z > min_z ){
			index.push(v);
			pos.push(vertices[v]);
		}	
	}	
	return pos;
}

/**
 * Given the spline and the corresponding spline control objects, automatically generated 
 * the bounding boxes at each timestamp
 *
 * Version3: compute bbox based on the detected dense dynamic point cloud 
 */
function autoDynamicBbox(){
	if (INTERSECTED.name.dynamicSeq>-1 && readOnly != 1) {
		if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
			alert('AutoBox is already generated for this spline');
			return;
		} 
          	document.getElementById('bottomMsg').innerHTML = 'Computing auto boxes...'; 
		// double check if dynamicOn is turned off
		if (dynamicOn == true) {
			dynamicOn = false;
		}
		var bbox = INTERSECTED.geometry.boundingBox;
		var range_x = Math.round((bbox.max.x - bbox.min.x)/gridSize);	
		var range_y = Math.round((bbox.max.y - bbox.min.y)/gridSize);	
		var range_z = Math.round((bbox.max.z - bbox.min.z)/gridSize);	
		// find startframe and endframe
		var startFrame = INTERSECTED.name.timestamp;
		var endFrame = INTERSECTED.name.timestamp;
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamic == 0) { continue; }
			if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq){
				if (labels[i].name.timestamp==-1) {
					alert('All spline control objects should be assigned with timestamp at first');
					return;
				}
				if (labels[i].name.timestamp > endFrame) {
					endFrame = labels[i].name.timestamp;
				}
				else if (labels[i].name.timestamp < startFrame) {
					startFrame = labels[i].name.timestamp;
				}
			}
		}
		if (startFrame == endFrame) {
        		alert('At least two dynamic objects are required');
			return;
		}

		//generate a binary grid map counting objects in all labeled frames 
		var grid = new Array(range_x * range_y * range_z).fill(0);	
		var labeledFrames = [];
		var labeledPoses = [];
		var labeledRotations = [];
		if (dynamicVertices!=undefined) {
			var indexOnSpline = getPointsOnSpline();
		}
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamic == 0) { continue; }
			if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq){
				labeledFrames.push(labels[i].name.timestamp);
				labeledPoses.push(labels[i].position);
				labeledRotations.push(labels[i].rotation);
				// automatically detected dense data
				if (dynamicVertices!=undefined) {
					var framePoints = getPointsAtTime(indexOnSpline, labels[i].name.timestamp);
					var cubePoints = getPointsInCube(framePoints, labels[i]);
					for (var j = 0; j<cubePoints.gridIndex.length; j++){
						grid[cubePoints.gridIndex[j]] = 1;
					}
				}
				// usr loaded dense data
				if (denseLoadedTimestamp.indexOf(labels[i].name.timestamp)>-1) {
					var splinePoints = getPointsOnSplineAtTime(labels[i].name.timestamp);
					var cubePoints = getPointsInCube(splinePoints, labels[i]);
					for (var j = 0; j<cubePoints.gridIndex.length; j++){
						grid[cubePoints.gridIndex[j]] = 1;
					}
				}
			}
		}

		// if no dense points found in the labeled frames
		console.log('grid: ',grid);
		var gridsum = grid.reduce(function(a,b){
			return a+b;
		}, 0);
		if (gridsum == 0) {
			alert('No dense points detected! Please download dense point cloud if they were not pre-downloaded.')
			return;
		}

		var sortedFrames = labeledFrames.concat([]); //deep copy
		sortedFrames.sort(function(a, b) { return a-b });
		var sortedPoses = [];
		var sortedRotations = [];
		for (var i=0; i<sortedFrames.length; i++){
			var idx = labeledFrames.indexOf(sortedFrames[i]);
			sortedPoses.push(labeledPoses[idx]);
			sortedRotations.push(labeledRotations[idx]);
		}
		

		//go through each timestamp to search the most matching bbox on the spline 
		var curve = splineCurves[INTERSECTED.name.dynamicSeq];
		var vertices = curve.mesh.geometry.vertices;
		var shape = INTERSECTED.clone();
		var dis = Math.sqrt((sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x)*(sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x) + 
				(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y)*(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y) ); 
		var eps = dis/ARC_SEGMENTS*2;
		var startVertice = getVectorIndex(vertices, sortedPoses[0], eps);
		var endVertice;
		var endRotation;
		var missbox = false;
		// assume we have only forward motion
		var vertice_min_pre = 0;
		for (var i=0; i<sortedFrames.length-1; i++){
			endVertice = getVectorIndex(vertices, sortedPoses[i+1], eps);
			console.log('startVertice', startVertice, 'endVertice', endVertice);
			var startRotation = sortedRotations[i]; 
			var endRotation = sortedRotations[i+1]; 
				var rotationZRange = endRotation.z - startRotation.z; 
				if (rotationZRange>Math.PI){
					rotationZRange = rotationZRange - 2*Math.PI; 	
				}
				else if(rotationZRange<-Math.PI){
					rotationZRange = 2*Math.PI + rotationZRange; 	
				}
			var rotationList = Array.apply(null, {length: endVertice-startVertice}).map(Number.call, Number);
			// split the spline w.r.t. to the control objects
			var vertice_min = 0;
			var vertice_max = ARC_SEGMENTS;	
			for (var f = sortedFrames[i]; f < sortedFrames[i+1]; f++){
				if (labeledFrames.indexOf(f) > -1 || fullCamList.indexOf(f) < 0) {continue;}
				var detectedPoints = [];
				// automatically detected dense data
				if (dynamicVertices!=undefined) {
					var points = getPointsAtTime(indexOnSpline, f);
					detectedPoints = detectedPoints.concat(points);
				}
				// usr loaded dense data
				if (denseLoadedTimestamp.indexOf(f)>-1) {
					var splinePoints = getPointsOnSplineAtTime(f);
					detectedPoints = detectedPoints.concat(splinePoints);
				}
				var max_count = 0;
				var fit_position; 
				var fit_rotation = new THREE.Euler();
				var fit_vertice_ind = 0;
				// initialize the estimation according to timestamp
				var initEstimation = Math.round((f-sortedFrames[i])/(sortedFrames[i+1]-sortedFrames[i])*(endVertice-startVertice)) + startVertice;
				if (sortedFrames.length>2){
					vertice_min = Math.max(0, initEstimation-Math.round(ARC_SEGMENTS/10));
					vertice_max = Math.min(ARC_SEGMENTS, initEstimation+Math.round(ARC_SEGMENTS/10));
				}
				vertice_min = Math.max(vertice_min, startVertice);
				vertice_max = Math.min(vertice_max, endVertice);
				if (vertice_min_pre>vertice_min){
					vertice_min = vertice_min_pre;
				}
				// search optimal position within fixed range
				for (var v = vertice_min; v<=vertice_max; v++){
				 	if (endVertice>startVertice){
	      			 		var ratio = (v-startVertice)/(endVertice-startVertice);
				 	}else{
				 		var ratio = 0; // endVertice==startVertice
				 	}
				 	shape.position.copy( vertices[v] );
				 	shape.rotation.z = ratio*rotationZRange	+ startRotation.z; 
				 	shape.updateMatrixWorld();
				 	var points = getPointsInCube(detectedPoints, shape, grid);
				 	if (points.index.length > max_count) {
	      					max_count = points.index.length;
	      					fit_position = vertices[v];
						fit_vertice_ind = v;
	      					fit_rotation.x = ratio*(endRotation.x-startRotation.x) + startRotation.x;
	      					fit_rotation.y = ratio*(endRotation.y-startRotation.y) + startRotation.y;
	      					fit_rotation.z = ratio*rotationZRange + startRotation.z;
				 	}	
				}
				if (max_count==0) {
					missbox = true;
					//continue;
					v = initEstimation;
	      				var ratio = (v-startVertice)/(endVertice-startVertice);
					fit_vertice_ind = v;
					fit_position = vertices[v];
	      				fit_rotation.x = ratio*(endRotation.x-startRotation.x) + startRotation.x;
	      				fit_rotation.y = ratio*(endRotation.y-startRotation.y) + startRotation.y;
	      				fit_rotation.z = ratio*rotationZRange + startRotation.z;
				}
				vertice_min_pre = fit_vertice_ind;
				
				var object = copyShape(fit_position, fit_rotation);
				object.name.timestamp = f;
				object.name.dynamicIdx = -2; //doesn't belong to control point 
			}
			startVertice = endVertice;
		}	
	}	


	//change the display mode for better visualization
	resetParas(true);
	setTimeout(function (){
		changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
		curve.mesh.material.color = new THREE.Color(SPLINE_COLOR[1]);
	}, 600)

	if (missbox==true){
		alert('Matching failed at some frames!');
	}
	if (controlHandler.dispMode==4 || controlHandler.dispMode==5){
		setTimeout(function (){
			shaderMaterial.uniforms.timestamp_center.value = startFrame;
			slidingPointCloud();
		}, 1200)
	}
	// densely load the images for dynamic frames
	var listName = String('poses/');
	listName = sequence.folderName.concat(listName);
	var frameName = sequence.folderName + 'cameraIndex.txt';
	loadCameraParaMultipleDense(listName, frameName, startFrame, endFrame, false);     

	splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]=1;

//	setTimeout(function (){
//		if (controlHandler.dispMode!=4 && controlHandler.dispMode!=5){
//			changeDispMode(4);
//		}
//		shaderMaterial.uniforms.timestamp_center.value = startFrame;
//		shaderMaterial.uniforms.jetMode.value = 1;
//		slidingPointCloud();
//       		document.getElementById('bottomMsg').innerHTML = ''; 
//	}, 1200)
}

/**
 * Given the spline and the corresponding spline control objects, automatically generated 
 * the bounding boxes at each timestamp
 *
 * Version2: compute bbox based on the dense cloud per frame
 */
function autoDynamicBboxDenseOld(){
	if (INTERSECTED.name.dynamicSeq>-1 && readOnly != 1) {
		if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
			alert('AutoBox is already generated for this spline');
			return;
		} 
          	document.getElementById('bottomMsg').innerHTML = 'Computing auto boxes...'; 
		// double check if dynamicOn is turned off
		if (dynamicOn == true) {
			dynamicOn = false;
		}
		var bbox = INTERSECTED.geometry.boundingBox;
		var range_x = Math.round((bbox.max.x - bbox.min.x)/gridSize);	
		var range_y = Math.round((bbox.max.y - bbox.min.y)/gridSize);	
		var range_z = Math.round((bbox.max.z - bbox.min.z)/gridSize);	
		// find startframe and endframe
		var startFrame = INTERSECTED.name.timestamp;
		var endFrame = INTERSECTED.name.timestamp;
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamic == 0) { continue; }
			if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq){
				if (labels[i].name.timestamp==-1) {
					alert('All spline control objects should be assigned with timestamp at first');
					return;
				}
				if (labels[i].name.timestamp > endFrame) {
					endFrame = labels[i].name.timestamp;
				}
				else if (labels[i].name.timestamp < startFrame) {
					startFrame = labels[i].name.timestamp;
				}
			}
		}
		if (startFrame == endFrame) {
        		alert('At least two dynamic objects are required');
			return;
		}

		//load dense data if it is not loaded
		var isloaded = true;
		if (denseLoadedTimestamp.length == 0){
			isloaded = false;
		}
		else {
			for (var i = startFrame; i<=endFrame; i++){
				if ( denseLoadedTimestamp.indexOf(i) < 0 ) {
					isloaded = false;	
					break;
				}	
			}
		}
		if (isloaded == false) {
			console.log(denseLoadedTimestamp);
			alert('LoadDenseData before generating auto box');
			return;
		}


		//generate a binary grid map counting objects in all labeled frames 
		var grid = new Array(range_x * range_y * range_z).fill(0);	
		var labeledFrames = [];
		var labeledPoses = [];
		var labeledRotations = [];
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamic == 0) { continue; }
			if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq){
				labeledFrames.push(labels[i].name.timestamp);
				labeledPoses.push(labels[i].position);
				labeledRotations.push(labels[i].rotation);
				var splinePoints = getPointsOnSplineAtTime(labels[i].name.timestamp);
				var cubePoints = getPointsInCube(splinePoints, labels[i]);
				for (var j = 0; j<cubePoints.gridIndex.length; j++){
					grid[cubePoints.gridIndex[j]] = 1;
				}
			}
		}
		var sortedFrames = labeledFrames.concat([]); //deep copy
		sortedFrames.sort(function(a, b) { return a-b });
		var sortedPoses = [];
		var sortedRotations = [];
		for (var i=0; i<sortedFrames.length; i++){
			var idx = labeledFrames.indexOf(sortedFrames[i]);
			sortedPoses.push(labeledPoses[idx]);
			sortedRotations.push(labeledRotations[idx]);
		}
		

		//go through each timestamp to search the most matching bbox on the spline 
		var curve = splineCurves[INTERSECTED.name.dynamicSeq];
		var vertices = curve.mesh.geometry.vertices;
		var shape = INTERSECTED.clone();
		var dis = Math.sqrt((sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x)*(sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x) + 
				(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y)*(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y) ); 
		var eps = dis/ARC_SEGMENTS;
		var startVertice = getVectorIndex(vertices, sortedPoses[0], eps);
		var endVertice;
		var endRotation;
		for (var i=0; i<sortedFrames.length-1; i++){
			endVertice = getVectorIndex(vertices, sortedPoses[i+1], eps);
			var startRotation = sortedRotations[i]; 
			var endRotation = sortedRotations[i+1]; 
			var rotationList = Array.apply(null, {length: endVertice-startVertice}).map(Number.call, Number);
			// split the spline w.r.t. to the control objects
			var vertice_min = 0;
			var vertice_max = ARC_SEGMENTS;	
			for (var f = sortedFrames[i]; f < sortedFrames[i+1]; f++){
				if (labeledFrames.indexOf(f) > -1 || fullCamList.indexOf(f) < 0) {continue;}
				var splinePoints = getPointsOnSplineAtTime(f);
				var max_count = 0;
				var fit_position; 
				var fit_rotation = new THREE.Euler();
				// initialize the estimation according to timestamp
				var initEstimation = Math.round((f-sortedFrames[i])/(sortedFrames[i+1]-sortedFrames[i])*(endVertice-startVertice)) + startVertice;
				if (sortedFrames.length>2){
					vertice_min = Math.max(0, initEstimation-Math.round(ARC_SEGMENTS/10));
					vertice_max = Math.min(ARC_SEGMENTS, initEstimation+Math.round(ARC_SEGMENTS/10));
				}
				var rotationZRange = endRotation.z - startRotation.z; 
				if ((Math.abs(rotationZRange))>Math.PI){
					rotationZRange = 2*Math.PI - rotationZRange; 	
				}
				// search optimal position within fixed range
				for (var v = vertice_min; v<vertice_max; v++){
	      			var ratio = (v-startVertice)/(endVertice-startVertice);
					shape.position.copy( vertices[v] );
					shape.rotation.z = ratio*rotationZRange	+ startRotation.z; 
					shape.updateMatrixWorld();
					var points = getPointsInCube(splinePoints, shape, grid);
					if (points.index.length > max_count) {
	      				max_count = points.index.length;
	      				fit_position = vertices[v];
	      				fit_rotation.x = ratio*(endRotation.x-startRotation.x) + startRotation.x;
	      				fit_rotation.y = ratio*(endRotation.y-startRotation.y) + startRotation.y;
	      				fit_rotation.z = ratio*rotationZRange + startRotation.z;
					}	
				}
				var object = copyShape(fit_position, fit_rotation);
				object.name.timestamp = f;
				object.name.dynamicIdx = -2; //doesn't belong to control point 
			}
			startVertice = endVertice;
		}	
	}	

	//change the display mode for better visualization
	resetParas(true);
	setTimeout(function (){
		changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
		curve.mesh.material.color = new THREE.Color(SPLINE_COLOR[1]);
	}, 600)
	setTimeout(function (){
		if (controlHandler.dispMode!=4 && controlHandler.dispMode!=5){
			changeDispMode(4);
		}
		shaderMaterial.uniforms.timestamp_center.value = startFrame;
		shaderMaterial.uniforms.jetMode.value = 1;
		slidingPointCloud();
       		document.getElementById('bottomMsg').innerHTML = ''; 
	}, 1200)

	splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]=1;
}



/**
 * Given the spline and the corresponding spline control objects, automatically generated 
 * the bounding boxes at each timestamp
 * 
 * Version1: compute bbox based on the accumulated point cloud 
 */
function autoDynamicBboxOld(){
	if (INTERSECTED.name.dynamicSeq>-1 && readOnly != 1) {
		if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
			alert('AutoBox is already generated for this spline');
			return;
		} 
		// double check if dynamicOn is turned off
		if (dynamicOn == true) {
			dynamicOn = false;
		}
		var bbox = INTERSECTED.geometry.boundingBox;
		var range_x = Math.round((bbox.max.x - bbox.min.x)/gridSize);	
		var range_y = Math.round((bbox.max.y - bbox.min.y)/gridSize);	
		var range_z = Math.round((bbox.max.z - bbox.min.z)/gridSize);	
		//generate a binary grid map counting objects in all labeled frames 
		var grid = new Array(range_x * range_y * range_z).fill(0);	
		var indexOnSpline = getPointsOnSpline();
		var startFrame = INTERSECTED.name.timestamp;
		var endFrame = INTERSECTED.name.timestamp;
		var labeledFrames = [];
		var labeledPoses = [];
		var labeledRotations = [];
		for (var i=0; i<labels.length; i++) {
			if (labels[i].name.dynamic == 0) { continue; }
			if (labels[i].name.dynamicSeq == INTERSECTED.name.dynamicSeq){
				if (labels[i].name.timestamp==-1) {
					alert('All spline control objects should be assigned with timestamp at first');
					return;
				}
				labeledFrames.push(labels[i].name.timestamp);
				labeledPoses.push(labels[i].position);
				labeledRotations.push(labels[i].rotation);
				var indexFrame = getPointsAtTime(indexOnSpline, labels[i].name.timestamp);
				var points = getPointsInCube(indexFrame, labels[i]);
				for (var j = 0; j<points.gridIndex.length; j++){
					grid[points.gridIndex[j]] = 1;
				}
			}
		}
		var sortedFrames = labeledFrames.concat([]); //deep copy
		sortedFrames.sort(function(a, b) { return a-b });
		startFrame = sortedFrames[0];
		endFrame = sortedFrames[sortedFrames.length-1];
		if (startFrame == endFrame) {
        		alert('At least two dynamic objects are required');
		}
		var sortedPoses = [];
		var sortedRotations = [];
		for (var i=0; i<sortedFrames.length; i++){
			var idx = labeledFrames.indexOf(sortedFrames[i]);
			sortedPoses.push(labeledPoses[idx]);
			sortedRotations.push(labeledRotations[idx]);
		}

		// densely load the images for dynamic frames
		var listName = String('poses/');
		listName = sequence.folderName.concat(listName);
		var frameName = sequence.folderName + 'cameraIndex.txt';
		loadCameraParaMultipleDense(listName, frameName, startFrame, endFrame, false);     

		//go through each timestamp to search the most matching bbox on the spline 
		var curve = splineCurves[INTERSECTED.name.dynamicSeq];
		var vertices = curve.mesh.geometry.vertices;
		var shape = INTERSECTED.clone();
		var dis = Math.sqrt((sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x)*(sortedPoses[0].x-sortedPoses[sortedPoses.length-1].x) + 
				(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y)*(sortedPoses[0].y-sortedPoses[sortedPoses.length-1].y) ); 
		var eps = dis/ARC_SEGMENTS;
		var startVertice = getVectorIndex(vertices, sortedPoses[0], eps);
		var endVertice;
		var endRotation;
		for (var i=0; i<sortedFrames.length-1; i++){
			endVertice = getVectorIndex(vertices, sortedPoses[i+1], eps);
			var startRotation = sortedRotations[i]; 
			var endRotation = sortedRotations[i+1]; 
			var rotationList = Array.apply(null, {length: endVertice-startVertice}).map(Number.call, Number);
			// split the spline w.r.t. to the control objects
			var vertice_min = 0;
			var vertice_max = ARC_SEGMENTS;	
			for (var f = sortedFrames[i]; f < sortedFrames[i+1]; f++){
				if (labeledFrames.indexOf(f) > -1 || fullCamList.indexOf(f) < 0) {continue;}
				var indexFrame = getPointsAtTime(indexOnSpline, f);
				var max_count = 0;
				var fit_position; 
				var fit_rotation = new THREE.Euler();
				// initialize the estimation according to timestamp
				var initEstimation = Math.round((f-sortedFrames[i])/(sortedFrames[i+1]-sortedFrames[i])*(endVertice-startVertice)) + startVertice;
				// Not clear why the vertices are not linearly distributed 
				// when there are only two point, so search the full line 
				// when there are only two points, otherwise search the vicinity 
				// based on the initial estimation 
				if (sortedFrames.length>2){
					vertice_min = Math.max(0, initEstimation-Math.round(ARC_SEGMENTS/10));
					vertice_max = Math.min(ARC_SEGMENTS, initEstimation+Math.round(ARC_SEGMENTS/10));
				}
				var rotationZRange = endRotation.z - startRotation.z; 
				if ((Math.abs(rotationZRange))>Math.PI){
					rotationZRange = 2*Math.PI - rotationZRange; 	
				}
				// search optimal position within fixed range
				for (var v = vertice_min; v<vertice_max; v++){
	      			var ratio = (v-startVertice)/(endVertice-startVertice);
					shape.position.copy( vertices[v] );
					shape.rotation.z = ratio*rotationZRange	+ startRotation.z; 
					shape.updateMatrixWorld();
					var points = getPointsInCube(indexFrame, shape, grid);
					if (points.index.length > max_count) {
	      				max_count = points.index.length;
	      				fit_position = vertices[v];
	      				fit_rotation.x = ratio*(endRotation.x-startRotation.x) + startRotation.x;
	      				fit_rotation.y = ratio*(endRotation.y-startRotation.y) + startRotation.y;
	      				fit_rotation.z = ratio*rotationZRange + startRotation.z;
					}	
				}
				var object = copyShape(fit_position, fit_rotation);
				object.name.timestamp = f;
				object.name.dynamicIdx = -2; //doesn't belong to control point 
			}
			startVertice = endVertice;
		}	
	}	

	//change the display mode for better visualization
	resetParas(true);
	setTimeout(function (){
		changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
		curve.mesh.material.color = new THREE.Color(SPLINE_COLOR[1]);
	}, 600)
	setTimeout(function (){
		if (controlHandler.dispMode!=4 && controlHandler.dispMode!=5){
			changeDispMode(5);
		}
		shaderMaterial.uniforms.timestamp_center.value = startFrame;
		shaderMaterial.uniforms.jetMode.value = 2;
		slidingPointCloud();
	}, 1200)

	splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]=1;
}

/**
 * clear automatically generated bounding boxes
 */
function clearAutoDynamicBbox(){
	if (INTERSECTED.name.dynamicSeq>-1 && readOnly != 1) {
		var currSeq = INTERSECTED.name.dynamicSeq;
		for (var i=labels.length-1; i>=0; i--) {
			if (labels[i].name.dynamic==0) {continue;}
			if (labels[i].name.dynamicSeq==currSeq && labels[i].name.dynamicIdx==-2) {
				scene.remove(labels[i]);
				scene.remove(labels_helper[i]);
				scene3D.remove(labels_arrow[i]);
				labels.splice(i, 1);
				labels_helper.splice(i, 1);
				labels_arrow.splice(i, 1);

			}
		}
		currentIdx = -1;
		
		splineIsAutoBoxed[INTERSECTED.name.dynamicSeq] = 0;
		var curve = splineCurves[INTERSECTED.name.dynamicSeq];
		curve.mesh.material.color = new THREE.Color(0x00ff00);
		//if (controlHandler.dispMode!=4 && controlHandler.dispMode!=5){
		//	changeDispMode(5);
		//}
		attachControlCubes(INTERSECTED, [], false);
		INTERSECTED = null;
		resetParas(true);
		changeVisibilitybyTime(shaderMaterial.uniforms.timestamp_center.value);
	}	
}

/**
 * hide all additioinally loaded cameras for dynamic objects
 */
function hideDenseCamera(isHide) {
	for (var i=numKeyframes*3; i<camGroup.vCamera.length; i++) {
		camGroup.vCamera[i].visible = !isHide;
	} 
}

/**
 * search the closest vector to the given vector on a sequence
 * @params sequence Sequence to be searched, containing a series of vectors
 * @params vector 
 * @params eps Threshold that can be accepted 
 * return the index of the matching vector in the sequence
 */
function getVectorIndex(sequence, vector, eps) {
	var isfind = -1;
	for (var i=0; i<sequence.length; i++){
		vecCurr = sequence[i];
		if (Math.abs(vecCurr.x-vector.x)<eps &&
	 	Math.abs(vecCurr.y-vector.y)<eps && 
		Math.abs(vecCurr.z-vector.z)<eps){
			isfind=1;	
			break;
		}
	}
	return isfind*i;
}

/**
 * assign timestamp to the selected bounding box
 */
function assignTimestamp(){
	if (INTERSECTED && readOnly != 1) {
		if (INTERSECTED.name.dynamic==0) {
			alert('Timestamp should be assigned to dynamic objects');
			return;
		}
		if (INTERSECTED.name.dynamicIdx==-2) {
			alert('Timestamp should be assigned to spline control objects');
			return;
		}
		if (splineIsAutoBoxed[INTERSECTED.name.dynamicSeq]==1) {
			alert('Timestamp cannot be modified after automatic boxes generated. ClearAutoBox at first for modification.');
			return;
		}
		INTERSECTED.name.timestamp = shaderMaterial.uniforms.timestamp_center.value;
		//INTERSECTED.material.opacity = timestampOpacity;
		labels_helper[currentIdx].material.color.setHex(WIREFRAME_COLOR[2]);
      		displayMsg('status','Assign the current object with timestamp ' + shaderMaterial.uniforms.timestamp_center.value.toString());
	}
}

/** 
 * convert the position to grid index w.r.t. a given object
 * @params bbox Bounding box of the given object 
 * @params localPos Position in the local coordinate of the object
 * @params gridSize The number of grids in each dimension
 */
function posToIndex(bbox, localPos, gridSize){
	var range_x = Math.round((bbox.max.x - bbox.min.x)/gridSize);	
	var range_y = Math.round((bbox.max.y - bbox.min.y)/gridSize);	
	var range_z = Math.round((bbox.max.z - bbox.min.z)/gridSize);	
	var x = Math.round((localPos.x-bbox.min.x) / (bbox.max.x-bbox.min.x) * range_x);
	var y = Math.round((localPos.y-bbox.min.y) / (bbox.max.y-bbox.min.y) * range_y);
	var z = Math.round((localPos.z-bbox.min.z) / (bbox.max.z-bbox.min.z) * range_z);
	return x*range_y*range_z + y*range_z + z;
}


/** 
 * if variable is object or not
 */
function isObject(val){
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
}

/**
 * Compute the bound of a list of points.
 */
function computeBound(vertices, matrixWorld)
{
	max_x = max_y = max_z = -1e6
	min_x = min_y = min_z = 1e6
	for (var i = 0; i < vertices.length; i++) {
		var vec = vertices[i].clone()
		vec.applyMatrix4(matrixWorld);
		max_x = Math.max(max_x, vec.x);
		min_x = Math.min(min_x, vec.x);
		max_y = Math.max(max_y, vec.y);
		min_y = Math.min(min_y, vec.y);
		max_z = Math.max(max_z, vec.z);
		min_z = Math.min(min_z, vec.z);
	}
	return {
		lower_bound: new THREE.Vector3(min_x, min_y, min_z),
		higher_bound: new THREE.Vector3(max_x, max_y, max_z)
  	};
}


/**
 * Check if a point is inside a bounding box.
 */
function checkInsideBoundingBox(bound, pt)
{
	if (pt.x < bound.lower_bound.x || pt.x > bound.higher_bound.x) {
		return false;
	}
	if (pt.y < bound.lower_bound.y || pt.y > bound.higher_bound.y) {
		return false;
	}
	if (pt.z < bound.lower_bound.z || pt.z > bound.higher_bound.z) {
		return false;
	} 
	return true;
}

/**
 *Check if the point cloud vertices are inside any bounding primitives.
 */
function checkInsidePrimitive(coloring)
{
	var computingDone = new Event('ComputingDone');

	// If there is no change, then skip.
	if (!changed_labels) {
		if (coloring) {
			shaderMaterial.attributes.cartoonColor.value = label_color_list;	
			shaderMaterial.attributes.cartoonColor.needsUpdate = true;
			displayMsg('status', 'No changes have been made, skip.');
		}
		else {
			document.dispatchEvent(computingDone);
		}
		return;
	}

	show_loading(true);

	setTimeout(function() {

       		var vertices = plyParticles.geometry.vertices;
		label_color_list = new Array(vertices.length);
		var infinity = new THREE.Vector3(1e6, 1e6, 1e6);
		var raycaster = new THREE.Raycaster();

		var boundboxes = new Array(vertices.length);
		for (var i = 0; i < labels.length; i++) {
			boundboxes[i] = computeBound(labels[i].geometry.vertices, labels[i].matrixWorld);
		}

		var insidebb1 = 0;
		var insidebb2 = 0;
		var insidebb11 = 0;
		var insidebb22 = 0;
		for (var v = 0;  v < vertices.length; v++ ) 
		{	
			var collide = false;
			var vec = vertices[v].clone()
			raycaster.ray.set(vertices[v], vec.sub(infinity).normalize());
			for (var i = 0; i < labels.length; i++) {
				if (!checkInsideBoundingBox(boundboxes[i], vertices[v])) {
					continue;
				}
				if (i == labels.length - 1) {
					insidebb1++;
				}
				if (i == labels.length - 2) {
					insidebb11++;
				}
				var collisionResults = raycaster.intersectObjects([labels[i]]);
				if (collisionResults.length % 2) {
					label_color_list[v] = labels[i].material.color;
					collide = true;
					if (i == labels.length - 1) {
						insidebb2++;
					}
					if (i == labels.length - 2) {
						insidebb22++;
					}
					break;
				}
			}
			if (!collide) {
				label_color_list[v] = new THREE.Color(1, 1, 1);
			}
		}

		changed_labels = false;

		// assign colors
		if (coloring) {
			shaderMaterial.attributes.cartoonColor.value = label_color_list;
			shaderMaterial.attributes.cartoonColor.needsUpdate = true;
		}
		else {
			document.dispatchEvent(computingDone);
		}
        
    	show_loading(false);
        }, 
        10);
}

function updateStuffObject(idx){
	//if (INTERSECTED.name.category == 'stuff' && readOnly != 1) {
		if (controlHandler.updateStuff == true){
			if (controlHandler.planarStuff == false){
				controlHandler.planarStuff = true;
			}
			controlHandler.orthographic = true;
    			changeView(controlHandler.orthographic);
			attachVertexHelper(idx);

			
		}
		else{
			controlHandler.orthographic = false;
    			changeView(controlHandler.orthographic);
			detachVertexHelper(idx);
			//attachControlCubes(INTERSECTED, 'translate', true);
		}
	//}
}

function changeCloudVisbility()
{
	if (INTERSECTED) {
		checkInsidePrimitive(false);
	
		document.addEventListener("ComputingDone", function(){
       			var vertices = plyParticles.geometry.vertices;
			var inside_cube_list = shaderMaterial.attributes.insideCube.value;
			var cnt=0;
			for (var v = 0;  v < vertices.length; v++ ){
				if (label_color_list[v].r == INTERSECTED.material.color.r &&
					label_color_list[v].g == INTERSECTED.material.color.g &&
					label_color_list[v].b == INTERSECTED.material.color.b ){
					inside_cube_list[v] = 1.0;
					cnt=cnt+1;
				}
			} 
			shaderMaterial.attributes.insideCube.needsUpdate = true;
			//detach selected object
			attachControlCubes(INTERSECTED, [], false);
			changeGroupVisbilitybyLabel(false, 'label', INTERSECTED.name.label);
			resetSeaLevel();

			hideAnnClass.push(INTERSECTED.name.label);
			INTERSECTED = null;
		});
	}

} 

function resetCloudVisbility()
{
	shaderMaterial.uniforms.hideAnnPcdOn.value=0;	
	var inside_cube_list = shaderMaterial.attributes.insideCube.value;
	for (var v = 0;  v < inside_cube_list.length; v++ ){
		inside_cube_list[v] = 0.0;
	} 
	resetSeaLevel();
	hideAnnClass = [];
	
}

function onlyUnique(value, index, self) {
    	return self.indexOf(value) === index;
}

/**
 * getAppearedLabels
 * Return exist label in current window
 */
function getAppearedLabels(){
	var arr = [] 
	for (var i = 0; i<labels.length; i++) {
		arr.push(labels[i].name.label);
	}
	var appearedLabelsUnsort = arr.filter( onlyUnique );
	// manually add "treeSphere" and "treeCube" as their names are saved as "vegetation"
	appearedLabelsUnsort.push('treeSphere');
	appearedLabelsUnsort.push('treeCube');

	appearedLabels = [];
	for (var label in category) {
		if (appearedLabelsUnsort.indexOf(label)>-1){
			appearedLabels.push(label);
		}
	}
}

function showSingleClass(offset){
	if (controlHandler.dispMode != 6){
		return;
	}
	if (offset != undefined){
		showClassId = showClassId + offset;
	}

	getAppearedLabels();
	showClassId = Math.max(0, showClassId);
	showClassId = Math.min(appearedLabels.length-1, showClassId);

	showAll(false);
	changeGroupVisbilitybyLabel(true, 'buttonId', appearedLabels[showClassId]);
	resetButtonStyle();
	changeButtonStyle(appearedLabels[showClassId]);

	// update opacity
	controlHandler.imageOpacity = 0.5;
	background.currImage.imgP.material.opacity = controlHandler.imageOpacity;
	background.currImage.imgF1.material.uniforms.opacity.value = controlHandler.imageOpacity;
	background.currImage.imgF2.material.uniforms.opacity.value = controlHandler.imageOpacity;

}

function toggleReplaceClass(activated){
	if (activated==true && !INTERSECTED){
		controlHandler.replaceClass = false;
		return;
	}
	if (activated==true && INTERSECTED.name.buttonId=="treeSphere"){
		controlHandler.replaceClass = false;
		return;
	}
	displayMsg('status', 'Replacing object class.');
	controlHandler.replaceClass = activated;
	show_bkg(activated);
}

function replaceStuffClass(classId){
	if (INTERSECTED){
		if (INTERSECTED.name.category!='stuff') return;
		console.log(category[classId]);
		if (category[classId].instance!=0) return;

		INTERSECTED.name.label = category[classId].type;
		INTERSECTED.name.buttonId = classId;
		INTERSECTED.material.color = new THREE.Color(category[classId].colors);
		console.log(INTERSECTED);
	}
}
