/**
Copyright 2018 Autonomous Vision Group

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/**
    utils.js
    Purpose: utility functions for i/o
*/ 


function idleTimeout(){
   window.location = '/index?curr_task=' + taskId;
}


/**
 * Save the annotation XML file locally 
 * Only for testing
 * Will be deprecated
 */
function saveLogs()
{
  var str = writeData();
  var blob = new Blob(str, {type: 'text/plain'});
  saveAs(blob, 'log.xml');
  alert('data saved...');
}


/**
 * send the annotation XML file manually
 * Only for testing
 * Will be deprecated
 */
function sendLogs()
{
  if (readOnly > 0) {
    window.location = getId('save_user').href; 
    return;
  }
  var str = writeData();
  console.log('sendData...');

  var stamp = Date.now();

  $.ajax({
    url: "../send_xml_data", 
    type: "POST",  // type should be POST
              
    data: { "data": str, "task_id": taskId, "user_id": userId},     // send the string directly
    success: function(response){
      window.location = getId('save_user').href; 
      //$("#render_messages").html(response);
    },
    error: function(response) {
      $("#render_messages").html(response);  
     }
  });
}



/**
 * send the annotation XML file automatically
 * with a preset time interval
 */
function sendAutoLogs(force)
{

  // log out automatically if reach the inactivate time limit
  if (idle > LOGOUT_THRES/INTERVAL){
  	idleTimeout();
       return false;
  }	

  if (force === undefined) {
    force = false;
  }	 

  if (readOnly > 0) return false;

  var backupOn=0;
  if (backupTime%(BACKUP_INTERVAL/INTERVAL) == 0){
      backupOn = 1;
      force = true;
  }
  backupTime=backupTime+1;

  var str = writeData();

  if (prevXmlstr == null) {
    prevXmlstr = str;
  }
  else {
    // annotation does not change
    if ( prevXmlstr.localeCompare(str) == 0 && !force){
      if (!isAdmin) {
        idle = idle + 1;
        if (idle <= (IDLE_THRES/INTERVAL)) {
               workTime = workTime + INTERVAL/1000;
               sendWorkingTime();
        }
        updateTimer(controlHandler.showTimer);
      }
      return false;
      }

    // update working time only if user is not admin
    // and not in the force mode
    if (!isAdmin && !force) {
      idle = 0;
      workTime = workTime + INTERVAL/1000;
      updateTimer(controlHandler.showTimer);
    }

    var test = (prevXmlstr == str);
    
    prevXmlstr = str;
  }

  // then flash out the above msg to display last stack
  var currTime = new Date();
  var h = currTime.getHours();
  var m = currTime.getMinutes();
  var s = currTime.getSeconds();

  var lastSaved = 'Last Saved on ' + ('00'+ h).slice(-2) + ':' + ('00'+ m).slice(-2) 
                    + ':'+ ('00'+ s).slice(-2);
  var myTimer = setTimeout(function () {
          document.getElementById('bottomMsg').innerHTML = lastSaved; 
      }, 1500);


  var stamp = Date.now();

  if (!isAdmin) {
    sendWorkingTime(); 
  }
 
   $.ajax({
       url: "../send_xml_log",

       type: "POST",  // type should be POST       
       data: { "data": str, "task_id": taskId, "time_stamp": stamp, "user_id": userId, "backup":backupOn},     // send the string directly
 			 success: function(response){
          if (!finished) {
            displayMsg('bottomMsg', 'Saving data ... ');
          }
       }
      	
    });
   
   return true;
}

/**
 * send the taskid to the server 
 * to delete the lockfile
 */
function sendUnlock(){
   $.ajax({
       url: "../unlock",

       type: "POST",  // type should be POST       
       data: { "task_id": taskId},     // send the string directly
 			 success: function(response){
          if (!finished) {
            displayMsg('bottomMsg', 'Unlocking ... ');
          }
       }
      	
    });
}

/**
 * send the canvas as a png 
 * to the server
 */
function sendCanvas(){
  // then flash out the above msg to display last stack
  var currTime = new Date();
  var h = currTime.getHours();
  var m = currTime.getMinutes();
  var s = currTime.getSeconds();

  var lastSaved = 'Canvas Saved on ' + ('00'+ h).slice(-2) + ':' + ('00'+ m).slice(-2) 
                    + ':'+ ('00'+ s).slice(-2);
  var myTimer = setTimeout(function () {
          document.getElementById('bottomMsg').innerHTML = lastSaved; 
      }, 1500);

  //if (controlHandler.refineview==1){ 
  //        url_to_send = canv.toDataURL();
  //}else if(controlHandler.refineview==2){
  //        url_to_send = canv.toDataURL();
  //        url_to_send_s = canv_s.toDataURL();
  //}

   $.ajax({
       url: "../send_png_data",

       type: "POST",  // type should be POST       
       data: { "data": url_to_send, "task_id": taskId, "user_id": userId, "frame": parseInt(currPersCam.name.substring(1)), "mode": controlHandler.refineview},     // send the string directly
        		 success: function(response){
          if (!finished) {
            displayMsg('bottomMsg', 'Saving png ... ');
          }
       }
      	
    });

   // also send the semantic result when label on the instance result 
   if (controlHandler.refineview == 2){
       $.ajax({
           url: "../send_png_data",

           type: "POST",  // type should be POST       
           data: { "data": url_to_send_s, "task_id": taskId, "user_id": userId, "frame": parseInt(currPersCam.name.substring(1)), "mode": controlHandler.refineview+1},     // send the string directly
            		 success: function(response){
              if (!finished) {
                displayMsg('bottomMsg', 'Saving png ... ');
              }
           }
          	
        });
   }

   canv_saved=true;

}

/**
 * send the instance and semantic colormap 
 * to the server
 */
function sendColormap(){
   $.ajax({
       url: "../send_colormap",

       type: "POST",  // type should be POST       
       data: { "data": instance2semantic.toString(), "task_id": taskId, "user_id": userId, "frame": parseInt(currPersCam.name.substring(1)), "mode": controlHandler.refineview},     // send the string directly
       success: function(response){
          if (!finished) {
            displayMsg('bottomMsg', 'New instance saved ... ');
          }
       }
      	
    });
}


function sendWorkingTime(){

  $.ajax({
       url: "../send_work_time",

       type: "POST",  // type should be POST       
       data: {"task_id": taskId, "user_id": userId, "time_interval": INTERVAL/1000},     // send the string directly
        
    });
}

/**
 * write the xml data
 */
function writeData()
{
  var str = '<?xml version="1.0"?>' + '\n';

  // temporary in opencv storage
  str = str.concat('<opencv_storage>')  + '\n';

  // version
  str = str.concat('<version>', '1', '</version>')  + '\n';

  // task id
  // need to add the quote, so that opencv can parse the string
  str = str.concat('<taskID>', '"', taskId.toString(), '"', '</taskID>')  + '\n';

  // user id
  // need to add the quote, so that opencv can parse the string
  str = str.concat('<userId>', '"', userId, '"', '</userId>')  + '\n';

  // data content
  for (var i = 0; i < labels.length; i++) {
      str = str.concat('<object', (i+1).toString(), '>')  + '\n';                                             // header
      str = str.concat('<index>', (i+1).toString(), '</index>')  + '\n';                                    // index
      str = str.concat('<label>', labels[i].name.label, '</label>')  + '\n';                                // label
      str = str.concat('<category>', labels[i].name.category, '</category>')  + '\n';                       // category
      str = str.concat('<level_min>', labels[i].name.level_min.toString(), '</level_min>')  + '\n';         // level_min
      str = str.concat('<level_max>', labels[i].name.level_max.toString(), '</level_max>') + '\n';         // level_max 
      str = str.concat('<dynamic>', labels[i].name.dynamic.toString(), '</dynamic>') + '\n';         // if it is a dynamic obj
      str = str.concat('<dynamicSeq>', labels[i].name.dynamicSeq.toString(), '</dynamicSeq>') + '\n';         // the number of dynamic sequence 
      str = str.concat('<dynamicIdx>', labels[i].name.dynamicIdx.toString(), '</dynamicIdx>') + '\n';         // index in the dynamic sequence 
      str = str.concat('<timestamp>', labels[i].name.timestamp.toString(), '</timestamp>') + '\n';         // timestamp of dynamic object 

      str = str.concat('<color>', '0x' + ('00000' + (category[labels[i].name.buttonId].colors | 0).toString(16)).substr(-6), '</color>')  + '\n';         // color

      str = str.concat('<transform type_id="opencv-matrix">', '<rows>4</rows>', '<cols>4</cols>', '<dt>f</dt>', '<data>');
      var matrix = labels[i].matrix.clone();
      matrix.transpose();
      
      for (var j = 0; j < 16; j++) {
        str = str.concat(matrix.elements[j].toString(), ' ');
      } 
      str = str.concat('</data>', '</transform>', '\n');                                                  // transform

      str = str.concat('<vertices type_id="opencv-matrix">', '<rows>', labels[i].geometry.vertices.length.toString(),
                        '</rows>', '<cols>3</cols>', '<dt>f</dt>', '<data>');
      for (var j = 0; j < labels[i].geometry.vertices.length.toString(); j++) {
        str = str.concat(labels[i].geometry.vertices[j].x.toString(), ' ', labels[i].geometry.vertices[j].y.toString(), ' ',
                        labels[i].geometry.vertices[j].z.toString(), ' ');
      } 
      str = str.concat('</data>', '</vertices>', '\n');                                                   // vertices

      str = str.concat('<faces type_id="opencv-matrix">', '<rows>', labels[i].geometry.faces.length.toString(),
                        '</rows>', '<cols>3</cols>', '<dt>u</dt>', '<data>');
      for (var j = 0; j < labels[i].geometry.faces.length.toString(); j++) {
        str = str.concat(labels[i].geometry.faces[j].a.toString(), ' ', labels[i].geometry.faces[j].b.toString(), ' ',
                        labels[i].geometry.faces[j].c.toString(), ' ');
      } 
      str = str.concat('</data>', '</faces>', '\n');                                                    // faces

      // write middle plane for stuff object
      if (labels[i].name.category == 'stuff' && planes[i]!=0){
          str = str.concat('<transform_plane type_id="opencv-matrix">', '<rows>4</rows>', '<cols>4</cols>', '<dt>f</dt>', '<data>');
          var matrix = planes[i].matrix.clone();
          matrix.transpose();
          
          for (var j = 0; j < 16; j++) {
            str = str.concat(matrix.elements[j].toString(), ' ');
          } 
          str = str.concat('</data>', '</transform_plane>', '\n');                                                  // transform

          str = str.concat('<vertices_plane type_id="opencv-matrix">', '<rows>', planes[i].geometry.vertices.length.toString(),
                            '</rows>', '<cols>3</cols>', '<dt>f</dt>', '<data>');
          for (var j = 0; j < planes[i].geometry.vertices.length.toString(); j++) {
            str = str.concat(planes[i].geometry.vertices[j].x.toString(), ' ', planes[i].geometry.vertices[j].y.toString(), ' ',
                            planes[i].geometry.vertices[j].z.toString(), ' ');
          } 
          str = str.concat('</data>', '</vertices_plane>', '\n');                                                   // vertices

          str = str.concat('<faces_plane type_id="opencv-matrix">', '<rows>', planes[i].geometry.faces.length.toString(),
                            '</rows>', '<cols>3</cols>', '<dt>u</dt>', '<data>');
          for (var j = 0; j < planes[i].geometry.faces.length.toString(); j++) {
            str = str.concat(planes[i].geometry.faces[j].a.toString(), ' ', planes[i].geometry.faces[j].b.toString(), ' ',
                            planes[i].geometry.faces[j].c.toString(), ' ');
          } 
          str = str.concat('</data>', '</faces_plane>', '\n');                                                    // faces
      }

      str = str.concat('</object', (i+1).toString(), '>') + '\n';                                              // end of header
  }

  str = str.concat('</opencv_storage>');

  return str;
}



function parseTimeStamp(timestamp)
{
  // create a new javascript Date object based on the timestamp
  // multiplied by 1000 so that the argument is in milliseconds, not seconds
  var date = new Date(timestamp*1000);
  
  var hours = date.getHours();
  var minutes = "0" + date.getMinutes();
  var seconds = "0" + date.getSeconds();

  // will display time in 10:30:23 format
  var formattedTime = hours + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);
  console.log(formattedTime);
}

/**
 * Load the xml file and parse it to annotation information
 * @params filename file name of the xml file
 */
function loadXmlData(filename)
{
    var xmlParser = loadXMLDoc(filename);
    if (xmlParser.status == 404) {
      //alert('404 Not Found!');
      return;
    }

    var xmlDoc = xmlParser.data;
    var objs = xmlDoc.getElementsByTagName('index');
    var repeat = 3;
    var dynamicSeqCnt = -1;
    var dynamicObjs = [];
    var dynamicObjsAuto = [];
    var startFrames = [];
    var endFrames = [];
    var offset = 0;
    var step = 0;

    var middle = xmlDoc.getElementsByTagName('vertices_plane').length; 

    // TODO: add new button
    for (var i = 0; i < objs.length; i++) {
      var obj = xmlDoc.getElementsByTagName('object' + (i+1).toString())[0];
      
      // attributes
      var info = {
        label : obj.getElementsByTagName('label')[0].childNodes[0].nodeValue,
        category: obj.getElementsByTagName('category')[0].childNodes[0].nodeValue,
        level_min : parseFloat(obj.getElementsByTagName('level_min')[0].childNodes[0].nodeValue),
        level_max : parseFloat(obj.getElementsByTagName('level_max')[0].childNodes[0].nodeValue),
        buttonId: [],
        dynamic: 0,
	dynamicSeq: -1,
	dynamicIdx: -1,
	timestamp: -1 
      }
      if (typeof xmlDoc.getElementsByTagName('dynamic')[i] !== 'undefined') {
        info.dynamic = parseInt(xmlDoc.getElementsByTagName('dynamic')[i].childNodes[0].nodeValue);
	if (typeof xmlDoc.getElementsByTagName('dynamicSeq')[i] !== 'undefined') {
		if (info.dynamic>0 ){
			info.dynamicSeq = parseInt(xmlDoc.getElementsByTagName('dynamicSeq')[i].childNodes[0].nodeValue);
			info.dynamicIdx = parseInt(xmlDoc.getElementsByTagName('dynamicIdx')[i].childNodes[0].nodeValue);
			info.timestamp = parseInt(xmlDoc.getElementsByTagName('timestamp')[i].childNodes[0].nodeValue);
			// seperate the spline control objects and the automaticly generated boxes
			if ( info.dynamicIdx>-1 ){
				dynamicObjs.push( i );
			}
			else {
				dynamicObjsAuto.push(i);
			}
			if ( info.dynamicSeq > dynamicSeqCnt ){
				dynamicSeqCnt = info.dynamicSeq;
			}
		}
	}
      }
      // change the dynamic status if it is generated with the previous version 
      if (info.dynamic==1 && info.dynamicSeq==-1){
	      info.dynamic = 0;
      }

      // geometry
      var cubeGeometry = new THREE.Geometry();
      var transformMx = new THREE.Matrix4();

      // transform
      var transform = obj.getElementsByTagName('transform');
      if (transform.length != 1) continue;
      var row = parseInt(transform[0].getElementsByTagName('rows')[0].childNodes[0].nodeValue);
      var col = parseInt(transform[0].getElementsByTagName('cols')[0].childNodes[0].nodeValue);
      var d = transform[0].getElementsByTagName('data')[0].childNodes[0].nodeValue;

      d = d.replace(/\s+/g,' ').trim();
      var mx = d.split(" ");
      var isValid = true;
      for (var j = 0; j < row*col; j++) {
        if (isNaN(parseFloat(mx[j]))) {
          // if the xml data constains NAN, then don't push this item
          isValid = false;
          break;
        }
        transformMx.elements[j] = parseFloat(mx[j]);
      }
      transformMx.transpose();
      if (!isValid) continue;

      // find nearest camera, don't push the item if it is too far 
      // for partial N/A tasks
      //if (refinemode == 'refine'){
      //    var objPose = new THREE.Vector3(transformMx.elements[12], transformMx.elements[13], transformMx.elements[14]);
      //    var candidateMX = findNearestCam(objPose);
      //    if (candidateMX.poseP==null) continue;
      //    var camPose = new THREE.Vector3(candidateMX.poseP.elements[12], candidateMX.poseP.elements[13], candidateMX.poseP.elements[14]);
      //    var dist2D = (camPose.x - objPose.x)*(camPose.x - objPose.x) + (camPose.y - objPose.y)*(camPose.y - objPose.y);
      //    if (dist2D > 1200) continue;
      //}

      // vertices
      var vertices = obj.getElementsByTagName('vertices');
      if (vertices.length != 1) continue;
      row = vertices[0].getElementsByTagName('rows')[0].childNodes[0].nodeValue;
      col = vertices[0].getElementsByTagName('cols')[0].childNodes[0].nodeValue;
      d = vertices[0].getElementsByTagName('data')[0].childNodes[0].nodeValue;
      d = d.replace(/\s+/g,' ').trim();
      var vs = d.split(" ");
      var center = new THREE.Vector3( 0, 0, 0 );
      for (var j = 0; j <row*col; j = j + 3) {
        cubeGeometry.vertices.push(new THREE.Vector3( parseFloat(vs[j]), parseFloat(vs[j+1]), parseFloat(vs[j+2])));

        center.x += parseFloat(vs[j]);
        center.y += parseFloat(vs[j+1]);
        center.z += parseFloat(vs[j+2]);
      }
      center.x /= row;
      center.y /= row;
      center.z /= row;


      if (info.label in mapping) {
          info.label = mapping[info.label];
      }
      // to fix previous bug
      else if (info.label == 'treeCube') {
          info.label = 'vegetation';
      }

      // tree case
      // this nis used to remove some bugs in the previous version
      if (info.label == 'vegetation') {
        if (cubeGeometry.vertices.length == 8) {
          info.buttonId = 'treeCube';
        }
        else {
          info.buttonId = 'treeSphere';
        }
      }
      else {
          info.buttonId = info.label;
      }

      info.stack = [];
      
      for (var j = 0; j < cubeGeometry.vertices.length; j++) {
        cubeGeometry.vertices[j].x -= center.x;
        cubeGeometry.vertices[j].y -= center.y;
        cubeGeometry.vertices[j].z -= center.z;
      }

      // faces 
      var faces = obj.getElementsByTagName('faces');
      if (faces.length != 1) continue;
      row = faces[0].getElementsByTagName('rows')[0].childNodes[0].nodeValue;
      col = faces[0].getElementsByTagName('cols')[0].childNodes[0].nodeValue;
      d = faces[0].getElementsByTagName('data')[0].childNodes[0].nodeValue;
      d = d.replace(/\s+/g,' ').trim();
      var fs = d.split(" ");
      for (var j = 0; j <row*col; j = j + 3) {
        cubeGeometry.faces.push(new THREE.Face3( parseInt(fs[j]), parseInt(fs[j+1]), parseInt(fs[j+2])));
      }

      var trans = info.dynamic ? dynamicopacity : category[info.buttonId].opacity;
      var mesh = new THREE.Mesh( cubeGeometry, new THREE.MeshBasicMaterial( { color: category[info.buttonId].colors, side: THREE.DoubleSide, 
                ireframe: 0, wireframeLinewidth: 2, transparent: true, opacity: trans}) ); 

      mesh.name = info;
      mesh.applyMatrix(transformMx);

      center.applyMatrix4(transformMx);
      mesh.position.set(center.x, center.y, center.z);
      mesh.matrixWorldNeedsUpdate = true;

      // to fix bug generated from "update stuff"
      if (mesh.name.category == 'stuff'){
      	var numV = cubeGeometry.vertices.length/2;
      	var numF = (cubeGeometry.faces.length - 2*numV)/2;
      	if (cubeGeometry.faces[0].a==cubeGeometry.faces[numF].a){
      		for (var j=0; j<numF; j++){
      			cubeGeometry.faces[j].a -= numV;
      			cubeGeometry.faces[j].b -= numV;
      			cubeGeometry.faces[j].c -= numV;
      		}
      	}
      }
      if (mesh.name.category=='stuff' && !checkValidStuff(cubeGeometry.vertices)) continue;

      //// middle plane for stuff objects 
      //row = parseInt(xmlDoc.getElementsByTagName('rows')[i*repeat+3].childNodes[0].nodeValue);
      //col = parseInt(xmlDoc.getElementsByTagName('cols')[i*repeat+3].childNodes[0].nodeValue);
      //d = xmlDoc.getElementsByTagName('data')[i*repeat+3].childNodes[0].nodeValue;

      //apply it to stack
      // the stack is over written by the laset object in this category
      category[info.buttonId].stack.matrix = transformMx;
      category[info.buttonId].stack.level_min = info.level_min;
      category[info.buttonId].stack.level_max = info.level_max;

      labels.push(mesh);
      scene.add(mesh);
      changed_labels = 1;

      // also add the edge helper
      var wireframe;
      if (mesh.name.category == 'stuff')
        wireframe = new THREE.EdgesHelper_adv(mesh, WIREFRAME_COLOR[0], MIN_DIST);
      else if (info.timestamp<0 || info.dynamicIdx==-2)
        wireframe = new THREE.EdgesHelper(mesh, WIREFRAME_COLOR[info.dynamic]);
      else
        wireframe = new THREE.EdgesHelper(mesh, WIREFRAME_COLOR[2]);
      wireframe.material.linewidth = 1;
      wireframe.updateMatrixWorld();
      labels_helper.push(wireframe); 
      scene.add(wireframe);

       // add the arrow
      var arrow = addArrow(info.label);
      mesh.geometry.computeBoundingBox();
      updateArrow(arrow, mesh.quaternion, mesh.scale, mesh.position, 
      mesh.geometry.boundingBox.max.z*mesh.scale.z);
      labels_arrow.push(arrow);

      // allocate the stuff plance
      // middle planes will be generated right after loading camera data
      planes.push(0);
      plane_helpers.push(0);

    }

      // dynamic objects
      if (!dynamicObjs) { return; }
      dynamicObjs = sortDynamicObjs(dynamicObjs);

      // splinePositions and timestamps
      var positions = [];
      var startFrame = 1e+8;
      var endFrame = -1;
      for (i=0; i<dynamicObjs.length; i++){
	positions.push(labels[dynamicObjs[i]].position);
	if (startFrame > labels[dynamicObjs[i]].name.timestamp) { startFrame = labels[dynamicObjs[i]].name.timestamp; }
	if (endFrame < labels[dynamicObjs[i]].name.timestamp) { endFrame = labels[dynamicObjs[i]].name.timestamp; }
	if (i<dynamicObjs.length-1){
          if (labels[dynamicObjs[i+1]].name.dynamicSeq!=labels[dynamicObjs[i]].name.dynamicSeq){
            splinePositions.push(positions);
	    positions = [];
	    startFrames.push(startFrame);
	    endFrames.push(endFrame);
	    startFrame = 1e+8;
            endFrame = -1;
	  }
	}
	else if(i==dynamicObjs.length-1){
          splinePositions.push(positions);
	  startFrames.push(startFrame);
	  endFrames.push(endFrame);
	}
      } 

      // splineCurves
      for (i=0; i<splinePositions.length; i++){
	var splineGeometry = new THREE.Geometry();
	for ( var j = 0; j < ARC_SEGMENTS; j ++ ) {
        	splineGeometry.vertices.push( new THREE.Vector3() );
	}
	currDynamicSeq = currDynamicSeq + 1;
        var curve = new THREE.CatmullRomCurve3( splinePositions[i] );
        curve.type = 'catmullrom';
        curve.mesh = new THREE.Line( splineGeometry.clone(), new THREE.LineBasicMaterial( {
                color: SPLINE_COLOR[0],
                opacity: 0.35,
                linewidth: 2
                } ) );
	scene.add(curve.mesh);
	updateSplineOutline(curve);
	splineCurves.push(curve);
	splineIsAutoBoxed.push(0);	
      }

      // densely load cameras for dynamic frames
      // TODO: loadFullCamList() runs twice
	var listName = String('poses/');
	listName = sequence.folderName.concat(listName);
	var frameName = sequence.folderName + 'cameraIndex.txt';
	jQuery.when( loadFullCamList(frameName) ).done(function (){
		for (var i=0; i<dynamicSeqCnt+1; i++) {
			if (startFrames[i]>-1 && endFrames[i]>-1) {
				loadCameraParaMultipleDense(listName, frameName, startFrames[i], endFrames[i], false);     
			}
		}
	});


      // splineIsAutoBoxed
      for (var i=0; i<dynamicObjsAuto.length; i++){
	      splineIsAutoBoxed[labels[dynamicObjsAuto[i]].name.dynamicSeq] = 1;
      }
      for (var i=0; i<splineIsAutoBoxed.length; i++){ 
	    var curve = splineCurves[i];
	    curve.mesh.material.color = new THREE.Color(SPLINE_COLOR[splineIsAutoBoxed[i]]);
      }
      changeGroupVisbilitybyLabel(false, 'dynamicIdx', -2);
      

    // to prevent wrting the data at the very beginning
    prevXmlstr = writeData();
}

function sortDynamicObjs(dynamicObjs){
    var tmp;
    for(i = 0; i<dynamicObjs.length - 1; i++){
	for (j = 0; j<dynamicObjs.length - 1 - i; j++){
		if (labels[dynamicObjs[j]].name.dynamicSeq < labels[dynamicObjs[j+1]].name.dynamicSeq){
			continue;
		}
		else if (labels[dynamicObjs[j]].name.dynamicSeq == labels[dynamicObjs[j+1]].name.dynamicSeq){
			if (labels[dynamicObjs[j]].name.dynamicIdx < labels[dynamicObjs[j+1]].name.dynamicIdx){
				continue;
			}
		}
		tmp = dynamicObjs[j];
		dynamicObjs[j] = dynamicObjs[j+1];
		dynamicObjs[j+1] = tmp;
	}
    }
    return dynamicObjs;
}

/**
 * Load a set of images (perspective + 2*fish_eye)
 * @params frame1 perspective image info
 * @params frame1 fisheye image info
 * @params frameNum current frame number to be loaded
 */
function loadAllImgs(frame1, frame2, frameNum)
{
  
  var filename0 = String('0000000000' + frameNum).slice(-10);  
  // load perpective img
  var f = String('image_00/');
  var imgName = sequence.folderName.concat(f);
  loadImgPerspective(imgName + filename0 +'.jpg', frame1) ;

  // load fisheye img1
  f = String('image_02/');
  imgName = sequence.folderName.concat(f);
  loadImgFish(imgName + filename0 +'.jpg', frame2, 'fisheye1') ;

  // load fisheye img2
  f = String('image_03/');
  imgName = sequence.folderName.concat(f);
  loadImgFish(imgName + filename0 +'.jpg', frame2, 'fisheye2') ;

  if (controlHandler.refineview){
      // load inference img
      f = String('inference_00/');
      var inferenceName = sequence.folderName.concat(f);
      var mode = 1;
      loadInferencePerspective(inferenceName + filename0 +'.png', frame1, mode) ;

      // load sparse projected img
      f = String('sparse_00/');
      mode = 2;
      loadInferencePerspective(inferenceName + 's_' + filename0 +'.png', frame1, mode) ;

      // load scribble annotation
      loadPngData(frameNum);
  }

}


/**
 * Load perspective image
 * @params filenameImg filename
 * @params frame image info
 */
function loadImgPerspective(filenameImg, frame) 
{
  var loaderImg = new THREE.TextureLoader();
  loaderImg.load( filenameImg, function ( texture ) 
  { 
      var geometry = new THREE.PlaneBufferGeometry( frame.width, frame.height, 20, 20);
      var material = new THREE.MeshBasicMaterial( { map: texture, transparent: 1, opacity: controlHandler.imageOpacity} );

      texturePerspective = texture;
      if (controlHandler.refineview==2){
	      changeCanvScale();
      }

      var image = new THREE.Mesh( geometry, material );
      image.material.depthTest = false;
      image.material.depthWrite = false;

      if (background.currImage.imgP)  
        background.scene.bgP.remove(background.currImage.imgP);

      background.scene.bgP.add( image );
      background.currImage.imgP = image;
  },
  function () {},
  function (event) {
    alert('Error to load the image ' + event.target.src);}
  );
}

/**
 * Load perspective image
 * @params filenameImg filename
 * @params frame image info
 */
function loadImgPerspective_test(filenameImg, frame) 
{
  var loaderImg = new THREE.TextureLoader();
  loaderImg.load( filenameImg, function ( texture ) 
  { 
      var vertShader = document.getElementById('vertexShaderPerspective').textContent;
      var fragShader = document.getElementById('fragmentShaderPerspective').textContent;

      var intrinsic_fish;
      if (mode == 'fisheye1') {
        intrinsic_fish = intrinsic_fish0[0];
      }
      else if (mode == 'fisheye2') {
        intrinsic_fish = intrinsic_fish0[1];
      }

      var uniforms = {
          texture: { type: "t", value: THREE.ImageUtils.loadTexture( filenameImg) },
          
          sizeVirtual: {type: "v2", value: new THREE.Vector2( frame.width, frame.height)},
          focalVirtual: {type: "v2", value: new THREE.Vector2( INTRINSIC.fVirtual, INTRINSIC.fVirtual)},
          offsetVirtual: {type: "v2", value: new THREE.Vector2( frame.width/2, frame.height/2)},

          focalFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.f.x, intrinsic_fish.f.y)},
          sizeFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.size.width, intrinsic_fish.size.height)},
          offsetFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.offset.x, intrinsic_fish.offset.y)},

          k1: {type: "f", value: intrinsic_fish.k.k1},
          k2: {type: "f", value: intrinsic_fish.k.k2},
          xi: {type: "f", value: intrinsic_fish.xi},

          opacity: {type: "f", value: controlHandler.imageOpacity},
      };

      var image = new THREE.Mesh( geometry, material );
      image.material.depthTest = false;
      image.material.depthWrite = false;

      if (background.currImage.imgP)  
        background.scene.bgP.remove(background.currImage.imgP);

      background.scene.bgP.add( image );
      background.currImage.imgP = image;
  },
  function () {},
  function (event) {
    alert('Error to load the image ' + event.target.src);}
  );
}

/**
 * Load inference image of perspective view
 * @params filenameImg filename
 * @params frame image info
 * @params mode (dense inference/spare projection)
 */
function loadInferencePerspective(filenameImg, frame, mode) 
{
  var loaderImg = new THREE.TextureLoader();
  loaderImg.load( filenameImg, function ( texture ) 
  { 
      var geometry = new THREE.PlaneBufferGeometry( frame.width, frame.height, 20, 20);
      var material = new THREE.MeshBasicMaterial( { map: texture, transparent: 1, opacity: 0.9} ); // TODO: change opacity

      var image = new THREE.Mesh( geometry, material );
      image.material.depthTest = false;
      image.material.depthWrite = false;

      if (mode == 1){
      	if (inference.currImage.imgP)  
      	  inference.scene.bgP.remove(inference.currImage.imgP);

      	inference.scene.bgP.add( image );
      	inference.currImage.imgP = image;
      } else if (mode == 2){
      	if (inference.currImage.imgS)  
      	  inference.scene.sparseP.remove(inference.currImage.imgS);

      	inference.scene.sparseP.add( image );
      	inference.currImage.imgS = image;
      }
  },
  function () {},
  function (event) {}
  );
}

/**
 * Load fisheye image  (deprecated)
 * Original method: using sawp buffers
 * need to be deprecated
 * @params filenameImg filename
 * @params frame image info
 * @params mode (fisheye1/fisheye2)
 */

function loadImgFish_original(filenameImg, frame, mode) 
{
  var loaderImg = new THREE.TextureLoader();
  loaderImg.load( filenameImg, function ( texture ) 
  { 
      var vertShader = document.getElementById('vertexShaderFisheye').textContent;
      var fragShader = document.getElementById('fragmentShaderFisheye').textContent;

      var intrinsic_fish;
      if (mode == 'fisheye1') {
        intrinsic_fish = intrinsic_fish0[0];
      }
      else if (mode == 'fisheye2') {
        intrinsic_fish = intrinsic_fish0[1];
      }

      var uniforms = {
          texture: { type: "t", value: THREE.ImageUtils.loadTexture( filenameImg) },
          
          sizeVirtual: {type: "v2", value: new THREE.Vector2( frame.width, frame.height)},
          focalVirtual: {type: "v2", value: new THREE.Vector2( INTRINSIC.fVirtual, INTRINSIC.fVirtual)},
          offsetVirtual: {type: "v2", value: new THREE.Vector2( frame.width/2, frame.height/2)},

          focalFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.f.x, intrinsic_fish.f.y)},
          sizeFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.size.width, intrinsic_fish.size.height)},
          offsetFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.offset.x, intrinsic_fish.offset.y)},

          k1: {type: "f", value: intrinsic_fish.k.k1},
          k2: {type: "f", value: intrinsic_fish.k.k2},
          xi: {type: "f", value: intrinsic_fish.xi},

          opacity: {type: "f", value: controlHandler.imageOpacity},
      };

      imgMaterial = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertShader,
          fragmentShader: fragShader,
          transparent: true,
      });

      var geometry = new THREE.PlaneBufferGeometry( frame.width, frame.height, 20, 20);
      var image = new THREE.Mesh( geometry, imgMaterial );
      image.material.depthTest = false;
      image.material.depthWrite = false;

      if (mode == 'fisheye1') {
        if (background.currImage.imgF1)
          background.scene.bgF1.remove(background.currImage.imgF1);
          background.scene.bgF1.add( image );
          background.currImage.imgF1 = image;
      }

      else if (mode == 'fisheye2') {
        if (background.currImage.imgF2)
          background.scene.bgF2.remove(background.currImage.imgF2);
          background.scene.bgF2.add( image );
          background.currImage.imgF2 = image;
      }

    }
  );
}


/**
 * Load fisheye image 
 * Current method: using two shader materials (sharing the same vertext/frag shader)
 * @params filenameImg filename
 * @params frame image info
 * @params mode (fisheye1/fisheye2)
 */
function loadImgFish(filenameImg, frame, mode) 
{
  var loaderImg = new THREE.TextureLoader();
  loaderImg.load( filenameImg, function ( texture ) 
  { 
      var vertShader = document.getElementById('vertexShaderFisheye').textContent;
      var fragShader = document.getElementById('fragmentShaderFisheye').textContent;

      var intrinsic_fish;
      if (mode == 'fisheye1') {
        intrinsic_fish = intrinsic_fish0[0];
      }
      else if (mode == 'fisheye2') {
        intrinsic_fish = intrinsic_fish0[1];
      }

      var uniforms = {
          texture: { type: "t", value: THREE.ImageUtils.loadTexture( filenameImg) },
          
          sizeVirtual: {type: "v2", value: new THREE.Vector2( frame.width, frame.height)},
          focalVirtual: {type: "v2", value: new THREE.Vector2( INTRINSIC.fVirtual, INTRINSIC.fVirtual)},
          offsetVirtual: {type: "v2", value: new THREE.Vector2( frame.offset.x, frame.offset.y)},

          focalFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.f.x, intrinsic_fish.f.y)},
          sizeFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.size.width, intrinsic_fish.size.height)},
          offsetFisheye: {type: "v2", value: new THREE.Vector2( intrinsic_fish.offset.x, intrinsic_fish.offset.y)},

          k1: {type: "f", value: intrinsic_fish.k.k1},
          k2: {type: "f", value: intrinsic_fish.k.k2},
          xi: {type: "f", value: intrinsic_fish.xi},

          opacity: {type: "f", value: controlHandler.imageOpacity},
      };


      var geometry = new THREE.PlaneBufferGeometry( frame.width, frame.height, 20, 20);

      if (mode == 'fisheye1') {

        imgMaterial1 = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertShader,
          fragmentShader: fragShader,
          transparent: true,
        });

        if (background.currImage.imgF1)
          background.scene.bgF1.remove(background.currImage.imgF1);
          background.currImage.imgF1 = new THREE.Mesh( geometry, imgMaterial1 );
          background.currImage.imgF1.material.depthTest = false;
          background.currImage.imgF1.material.depthWrite = false;
          background.scene.bgF1.add( background.currImage.imgF1 );
      }

      else if (mode == 'fisheye2') {

         imgMaterial2 = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: vertShader,
          fragmentShader: fragShader,
          transparent: true,
        });

        if (background.currImage.imgF2)
          background.scene.bgF2.remove(background.currImage.imgF2);
          background.currImage.imgF2 = new THREE.Mesh( geometry, imgMaterial2 );
          background.currImage.imgF2.material.depthTest = false;
          background.currImage.imgF2.material.depthWrite = false;
          background.scene.bgF2.add( background.currImage.imgF2 );
      }

    }
  );
}
