/**
 * @author arodic / https://github.com/arodic
 */
 /*jshint sub:true*/

 var print = 0;

(function () {

	'use strict';

	var GizmoMaterial = function ( parameters ) {

		THREE.MeshBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.side = THREE.DoubleSide;
		this.transparent = true;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setRGB( 1, 1, 0 );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;
			}

		};

	};

	GizmoMaterial.prototype = Object.create( THREE.MeshBasicMaterial.prototype );

	var GizmoLineMaterial = function ( parameters ) {

		THREE.LineBasicMaterial.call( this );

		this.depthTest = false;
		this.depthWrite = false;
		this.transparent = true;
		this.linewidth = 3;

		this.setValues( parameters );

		this.oldColor = this.color.clone();
		this.oldOpacity = this.opacity;

		this.highlight = function( highlighted ) {

			if ( highlighted ) {

				this.color.setRGB( 1, 1, 0 );
				this.opacity = 1;

			} else {

				this.color.copy( this.oldColor );
				this.opacity = this.oldOpacity;
			}

		};

	};

	GizmoLineMaterial.prototype = Object.create( THREE.LineBasicMaterial.prototype );

	THREE.TransformGizmo = function () {

		var scope = this;
		var showPickers = false; //debug
		var showActivePlane = false; //debug

		this.init = function () {

			THREE.Object3D.call( this );

			this.handles = new THREE.Object3D();
			this.pickers = new THREE.Object3D();

			this.planes = new THREE.Object3D();

			this.add(this.handles);
			this.add(this.pickers);
			this.add(this.planes);

			//// PLANES

			var planeGeometry = new THREE.PlaneGeometry( 50, 50, 2, 2 );
			var planeMaterial = new THREE.MeshBasicMaterial( { wireframe: 1 } );
			planeMaterial.side = THREE.DoubleSide;

			var planes = {
				"XY":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"YZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XZ":   new THREE.Mesh( planeGeometry, planeMaterial ),
				"XYZE": new THREE.Mesh( planeGeometry, planeMaterial )
			};

			this.activePlane = planes["XYZE"];

			planes["YZ"].rotation.set( 0, Math.PI/2, 0 );
			planes["XZ"].rotation.set( -Math.PI/2, 0, 0 );

			for (var i in planes) {
				planes[i].name = i;
				this.planes.add(planes[i]);
				this.planes[i] = planes[i];
				planes[i].visible = false;
			}

			//// HANDLES AND PICKERS

			var setupGizmos = function( gizmoMap, parent ) {

				for ( var name in gizmoMap ) {

					for ( i = gizmoMap[name].length; i--;) {
						
						var object = gizmoMap[name][i][0];
						var position = gizmoMap[name][i][1];
						var rotation = gizmoMap[name][i][2];

						object.name = name;

						if ( position ) object.position.set( position[0], position[1], position[2] );
						if ( rotation ) object.rotation.set( rotation[0], rotation[1], rotation[2] );
						
						parent.add( object );

					}

				}

			};

			setupGizmos(this.handleGizmos, this.handles);
			setupGizmos(this.pickerGizmos, this.pickers);

			// reset Transformations

			this.traverse(function ( child ) {
				if (child instanceof THREE.Mesh) {
					child.updateMatrix();

					var tempGeometry = new THREE.Geometry();
					tempGeometry.merge( child.geometry, child.matrix );

					child.geometry = tempGeometry;
					child.position.set( 0, 0, 0 );
					child.rotation.set( 0, 0, 0 );
					child.scale.set( 1, 1, 1 );
				}
			});

		};

		this.hide = function () {
			this.traverse(function( child ) {
				child.visible = false;
			});
		};

		this.show = function () {

			this.traverse(function( child ) {
				child.visible = true;
				if (child.parent == scope.pickers ) child.visible = showPickers;
				if (child.parent == scope.planes ) child.visible = false;
			});
			this.activePlane.visible = showActivePlane;

		};

		this.highlight = function ( axis ) {
			this.traverse(function( child ) {
				if ( child.material && child.material.highlight ){
					if ( child.name == axis ) {
						child.material.highlight( true );
						//displayMsg('Higlighted');
					} else {
						child.material.highlight( false );
						//displayMsg('Not Higlighted');
					}
				}
			});
		};

	};

	THREE.TransformGizmo.prototype = Object.create( THREE.Object3D.prototype );

	THREE.TransformGizmo.prototype.update = function ( rotation, eye ) {

		var vec1 = new THREE.Vector3( 0, 0, 0 );
		var vec2 = new THREE.Vector3( 0, 1, 0 );
		var lookAtMatrix = new THREE.Matrix4();

		this.traverse(function(child) {
			if ( child.name.search("E") != -1 ) {
				child.quaternion.setFromRotationMatrix( lookAtMatrix.lookAt( eye, vec1, vec2 ) );
			} else if ( child.name.search("X") != -1 || child.name.search("Y") != -1 || child.name.search("Z") != -1 ) {
				child.quaternion.setFromEuler( rotation );
			}
		});

	};

	THREE.TransformGizmoTranslate = function (advanced) {

		THREE.TransformGizmo.call( this );

		var adv = (advanced == undefined) ? false: advanced;

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.CylinderGeometry( 0, 0.05, 0.2, 12, 1, false ) );
		mesh.position.y = 0.3;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );
		
		var lineXGeometry = new THREE.Geometry();
		lineXGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0.6, 0, 0 ) );

		var lineYGeometry = new THREE.Geometry();
		lineYGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0.6, 0 ) );

		var lineZGeometry = new THREE.Geometry();
		lineZGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0.6 ) );

		this.handleGizmos = {
			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.3, 0, 0 ], [ 0, 0, -Math.PI/2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],
			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 0.3, 0 ] ],
				[	new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],
			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.3 ], [ Math.PI/2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],
			// XYZ: [
			// 	[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.1, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, 0 ] ]
			// ],
			XY: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.5 } ) ), [ 0.15, 0.15, 0 ] ]   //[ 0.15, 0.15, 0 ]
			],
			YZ: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.5 } ) ), [ 0, 0.15, 0.15 ], [ 0, Math.PI/2, 0 ] ]
			],
			XZ: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.29, 0.29 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.5 } ) ), [ 0.15, 0, 0.15 ], [ -Math.PI/2, 0, 0 ] ]
			]
		};

		if (adv) {
			this.handleGizmos['XYZ'] = [
				[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.1, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, 0 ] ]
			];
		}

		this.pickerGizmos = {
			X: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.1, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0.4, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
			],
			Y: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.1, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0.4, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.1, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.4 ], [ Math.PI/2, 0, 0 ] ]
			],
			// XYZ: [
			// 	[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.2, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			// ],
			XY: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ), [ 0.2, 0.2, 0 ] ]
			],
			YZ: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0x00ffff, opacity: 0.25 } ) ), [ 0, 0.2, 0.2 ], [ 0, Math.PI/2, 0 ] ]
			],
			XZ: [
				[ new THREE.Mesh( new THREE.PlaneGeometry( 0.4, 0.4 ), new GizmoMaterial( { color: 0xff00ff, opacity: 0.25 } ) ), [ 0.2, 0, 0.2 ], [ -Math.PI/2, 0, 0 ] ]
			]
		};

		if (adv) {
			this.pickerGizmos['XYZ'] = [
				[ new THREE.Mesh( new THREE.OctahedronGeometry( 0.2, 0 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			];
		}

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis == "X" ) {
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs(eye.y) > Math.abs(eye.z) ) this.activePlane = this.planes[ "XZ" ];
			}

			if ( axis == "Y" ){
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs(eye.x) > Math.abs(eye.z) ) this.activePlane = this.planes[ "YZ" ];
			}

			if ( axis == "Z" ){
				this.activePlane = this.planes[ "XZ" ];
				if ( Math.abs(eye.x) > Math.abs(eye.y) ) this.activePlane = this.planes[ "YZ" ];
			}

			if ( axis == "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

			if ( axis == "XY" ) this.activePlane = this.planes[ "XY" ];

			if ( axis == "YZ" ) this.activePlane = this.planes[ "YZ" ];

			if ( axis == "XZ" ) this.activePlane = this.planes[ "XZ" ];

			this.hide();
			this.show();

		};

		this.init();

	};

	THREE.TransformGizmoTranslate.prototype = Object.create( THREE.TransformGizmo.prototype );

	THREE.TransformGizmoRotate = function (advanced) {

		var adv = (advanced == undefined) ? false: advanced;

		THREE.TransformGizmo.call( this );

		var CircleGeometry = function ( radius, facing, arc ) {

				var geometry = new THREE.Geometry();
				arc = arc ? arc : 1;
				for ( var i = 0; i <= 64 * arc; ++i ) {
					if ( facing == 'x' ) geometry.vertices.push( new THREE.Vector3( 0, Math.cos( i / 32 * Math.PI ), Math.sin( i / 32 * Math.PI ) ).multiplyScalar(radius) );
					if ( facing == 'y' ) geometry.vertices.push( new THREE.Vector3( Math.cos( i / 32 * Math.PI ), 0, Math.sin( i / 32 * Math.PI ) ).multiplyScalar(radius) );
					if ( facing == 'z' ) geometry.vertices.push( new THREE.Vector3( Math.sin( i / 32 * Math.PI ), Math.cos( i / 32 * Math.PI ), 0 ).multiplyScalar(radius) );
				}

				return geometry;
		};

		this.handleGizmos = {
			X: [
				[ new THREE.Line( new CircleGeometry(0.7,'x',0.5), new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],
			Y: [
				[ new THREE.Line( new CircleGeometry(0.7,'y',0.5), new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],
			Z: [
				[ new THREE.Line( new CircleGeometry(0.7,'z',0.5), new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],
			// E: [
			// 	[ new THREE.Line( new CircleGeometry(1.25,'z',1), new GizmoLineMaterial( { color: 0xcccc00 } ) ) ]
			// ],
			XYZE: [
				[ new THREE.Line( new CircleGeometry(0.7,'z',1), new GizmoLineMaterial( { color: 0x787878 } ) ) ]
			]
		};

		if (adv) {
			this.handleGizmos['E'] =  [
				[new THREE.Line( new CircleGeometry(1.25,'z',1), new GizmoLineMaterial( { color: 0xcccc00 } ) )]
			];
		} 

		this.pickerGizmos = {
			X: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 0.7, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, -Math.PI/2, -Math.PI/2 ] ]
			],
			Y: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 0.7, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ Math.PI/2, 0, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( new THREE.TorusGeometry( 0.7, 0.12, 4, 12, Math.PI ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
			],
			// E: [
			// 	[ new THREE.Mesh( new THREE.TorusGeometry( 1.25, 0.12, 2, 24 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) ) ]
			// ],
			XYZE: [
				[ new THREE.Mesh( new THREE.Geometry() ) ]// TODO
			]
		};

		if (adv) {
			this.pickerGizmos['E'] =  [
				[new THREE.Mesh( new THREE.TorusGeometry( 1.25, 0.12, 2, 24 ), new GizmoMaterial( { color: 0xffff00, opacity: 0.25 } ) )]
			];
		} 

		this.setActivePlane = function ( axis ) {

			if ( axis == "E" ) this.activePlane = this.planes[ "XYZE" ];

			if ( axis == "X" ) this.activePlane = this.planes[ "YZ" ];

			if ( axis == "Y" ) this.activePlane = this.planes[ "XZ" ];

			if ( axis == "Z" ) this.activePlane = this.planes[ "XY" ];

			this.hide();
			this.show();

		};

		this.update = function ( rotation, eye2 ) {

			THREE.TransformGizmo.prototype.update.apply( this, arguments );

			var group = {
				handles: this["handles"],
				pickers: this["pickers"],
			};

			var tempMatrix = new THREE.Matrix4();
			var worldRotation = new THREE.Euler( 0, 0, 1 );
			var tempQuaternion = new THREE.Quaternion();
			var unitX = new THREE.Vector3( 1, 0, 0 );
			var unitY = new THREE.Vector3( 0, 1, 0 );
			var unitZ = new THREE.Vector3( 0, 0, 1 );
			var quaternionX = new THREE.Quaternion();
			var quaternionY = new THREE.Quaternion();
			var quaternionZ = new THREE.Quaternion();
			var eye = eye2.clone();

			worldRotation.copy( this.planes["XY"].rotation );
			tempQuaternion.setFromEuler( worldRotation );

			tempMatrix.makeRotationFromQuaternion( tempQuaternion ).getInverse( tempMatrix );
			eye.applyMatrix4( tempMatrix );

			this.traverse(function(child) {

				tempQuaternion.setFromEuler( worldRotation );

				if ( child.name == "X" ) {
					quaternionX.setFromAxisAngle( unitX, Math.atan2( -eye.y, eye.z ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					child.quaternion.copy( tempQuaternion );
				}

				if ( child.name == "Y" ) {
					quaternionY.setFromAxisAngle( unitY, Math.atan2( eye.x, eye.z ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
					child.quaternion.copy( tempQuaternion );
				}

				if ( child.name == "Z" ) {
					quaternionZ.setFromAxisAngle( unitZ, Math.atan2( eye.y, eye.x ) );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );
					child.quaternion.copy( tempQuaternion );
				}

			});

		};

		this.init();

	};

	THREE.TransformGizmoRotate.prototype = Object.create( THREE.TransformGizmo.prototype );

	THREE.TransformGizmoScale = function (advanced) {

		THREE.TransformGizmo.call( this );

		var adv = (advanced == undefined) ? false: advanced;

		var arrowGeometry = new THREE.Geometry();
		var mesh = new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ) );
		mesh.position.y = 0.4;
		mesh.updateMatrix();

		arrowGeometry.merge( mesh.geometry, mesh.matrix );

		var lineXGeometry = new THREE.Geometry();
		lineXGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0.7, 0, 0 ) );

		var lineYGeometry = new THREE.Geometry();
		lineYGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0.7, 0 ) );

		var lineZGeometry = new THREE.Geometry();
		lineZGeometry.vertices.push( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 0.7 ) );

		this.handleGizmos = {
			X: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0xff0000 } ) ), [ 0.3, 0, 0 ], [ 0, 0, -Math.PI/2 ] ],
				[ new THREE.Line( lineXGeometry, new GizmoLineMaterial( { color: 0xff0000 } ) ) ]
			],
			Y: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x00ff00 } ) ), [ 0, 0.3, 0 ] ],
				[ new THREE.Line( lineYGeometry, new GizmoLineMaterial( { color: 0x00ff00 } ) ) ]
			],
			Z: [
				[ new THREE.Mesh( arrowGeometry, new GizmoMaterial( { color: 0x0000ff } ) ), [ 0, 0, 0.3 ], [ Math.PI/2, 0, 0 ] ],
				[ new THREE.Line( lineZGeometry, new GizmoLineMaterial( { color: 0x0000ff } ) ) ]
			],
			// XYZ: [
			// 	[ new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			// ]
		};

		if (adv) {
			this.handleGizmos['XYZ'] = [
			 	[ new THREE.Mesh( new THREE.BoxGeometry( 0.125, 0.125, 0.125 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			 ];
		}

		this.pickerGizmos = {
			X: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0xff0000, opacity: 0.25 } ) ), [ 0.4, 0, 0 ], [ 0, 0, -Math.PI/2 ] ]
			],
			Y: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0x00ff00, opacity: 0.25 } ) ), [ 0, 0.4, 0 ] ]
			],
			Z: [
				[ new THREE.Mesh( new THREE.CylinderGeometry( 0.2, 0, 0.6, 4, 1, false ), new GizmoMaterial( { color: 0x0000ff, opacity: 0.25 } ) ), [ 0, 0, 0.4 ], [ Math.PI/2, 0, 0 ] ]
			],
			// XYZ: [
			// 	[ new THREE.Mesh( new THREE.BoxGeometry( 0.4, 0.4, 0.4 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			// ]
		};

		if (adv) {
			this.pickerGizmos['XYZ'] = [
				[ new THREE.Mesh( new THREE.BoxGeometry( 0.4, 0.4, 0.4 ), new GizmoMaterial( { color: 0xffffff, opacity: 0.25 } ) ) ]
			];
		}

		this.setActivePlane = function ( axis, eye ) {

			var tempMatrix = new THREE.Matrix4();
			eye.applyMatrix4( tempMatrix.getInverse( tempMatrix.extractRotation( this.planes[ "XY" ].matrixWorld ) ) );

			if ( axis == "X" ) {
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs(eye.y) > Math.abs(eye.z) ) this.activePlane = this.planes[ "XZ" ];
			}

			if ( axis == "Y" ){
				this.activePlane = this.planes[ "XY" ];
				if ( Math.abs(eye.x) > Math.abs(eye.z) ) this.activePlane = this.planes[ "YZ" ];
			}

			if ( axis == "Z" ){
				this.activePlane = this.planes[ "XZ" ];
				if ( Math.abs(eye.x) > Math.abs(eye.y) ) this.activePlane = this.planes[ "YZ" ];
			}

			if ( axis == "XYZ" ) this.activePlane = this.planes[ "XYZE" ];

			this.hide();
			this.show();

		};

		this.init();

	};

	THREE.TransformGizmoScale.prototype = Object.create( THREE.TransformGizmo.prototype );

	THREE.TransformControls = function ( camera, domElement, viewPort, atBottom, advanced) {

		// TODO: Make non-uniform scale and rotate play nice in hierarchies
		// TODO: ADD RXYZ contol

		THREE.Object3D.call( this );

		domElement = ( domElement !== undefined ) ? domElement : document;

		this.advanced = (advanced !== undefined) ? advanced : false;
		this.atBottom = (atBottom !== undefined) ? atBottom : false;

		this.enabled = true;

		this.gizmo = {};
		this.gizmo["translate"] = new THREE.TransformGizmoTranslate(this.advanced);
		this.gizmo["rotate"] = new THREE.TransformGizmoRotate(this.advanced);
		this.gizmo["scale"] = new THREE.TransformGizmoScale();

		this.add(this.gizmo["translate"]);
		this.add(this.gizmo["rotate"]);
		this.add(this.gizmo["scale"]);

		this.gizmo["translate"].hide();
		this.gizmo["rotate"].hide();
		this.gizmo["scale"].hide();

		this.object = undefined;
		this.snap = null;
		this.space = "local";   // world
		this.size = 1;
		this.highlightSize = 1;
		this.handlerSize = 1;
		this.axis = null;

		this.oldRecord = {
			position: {},
			quaternion: {},
			scale: {}
		};

		var views = {
			heightOffset: 0,
			height: 1.0,
			widthOffset: 0,
			width: 1.0
		}

		this.viewPort = (viewPort !== undefined) ? viewPort : views;
		

		var scope = this;
		
		var _dragging = false;
		var _mode = "translate";
		var _plane = "XY";
		var needDetach = false;

		// new added in order to keep record
		var modified;


		var changeEvent = { type: "change" };
		var objectChangeEvent = { type: "objectChange" };
		var objectScaleEvent = { type: "objectScale" };
		var mouseUpEvent = { type: "mouseUp" };

		var ray = new THREE.Raycaster();
		var pointerVector = new THREE.Vector3();

		var point = new THREE.Vector3();
		var offset = new THREE.Vector3();

		var rotation = new THREE.Vector3();
		var offsetRotation = new THREE.Vector3();
		var scale = 1;

		var lookAtMatrix = new THREE.Matrix4();
		var eye = new THREE.Vector3();

		var tempMatrix = new THREE.Matrix4();
		var tempVector = new THREE.Vector3();
		var tempQuaternion = new THREE.Quaternion();
		var unitX = new THREE.Vector3( 1, 0, 0 );
		var unitY = new THREE.Vector3( 0, 1, 0 );
		var unitZ = new THREE.Vector3( 0, 0, 1 );

		var quaternionXYZ = new THREE.Quaternion();
		var quaternionX = new THREE.Quaternion();
		var quaternionY = new THREE.Quaternion();
		var quaternionZ = new THREE.Quaternion();
		var quaternionE = new THREE.Quaternion();

		var oldPosition = new THREE.Vector3();
		var oldScale = new THREE.Vector3();
		var oldRotationMatrix = new THREE.Matrix4();

		var parentRotationMatrix  = new THREE.Matrix4();
		var parentScale = new THREE.Vector3();

		var worldPosition = new THREE.Vector3();
		var worldRotation = new THREE.Euler();
		var worldRotationMatrix  = new THREE.Matrix4();
		var camPosition = new THREE.Vector3();
		var camRotation = new THREE.Euler();

		domElement.addEventListener( "mousedown", onPointerDown, false );
		//domElement.addEventListener( "touchstart", onPointerDown, false );

		domElement.addEventListener( "mousemove", onPointerHover, false );
		//domElement.addEventListener( "touchmove", onPointerHover, false );

		domElement.addEventListener( "mousemove", onPointerMove, false );
		//domElement.addEventListener( "touchmove", onPointerMove, false );

		domElement.addEventListener( "mouseup", onPointerUp, false );
		document.addEventListener( 'mouseup', onMouseUp, false );

		//domElement.addEventListener( "mouseout", onPointerUp, false );

		// domElement.addEventListener( "touchend", onPointerUp, false );
		// domElement.addEventListener( "touchcancel", onPointerUp, false );
		// domElement.addEventListener( "touchleave", onPointerUp, false );

		this.attach = function ( object, mode) {

			scope.object = object;

			if (mode && mode != 'world') this.setMode(mode);

			this.gizmo["translate"].hide();
			this.gizmo["rotate"].hide();
			this.gizmo["scale"].hide();
			this.gizmo[_mode].show();

			// need to clear the array somewhere else
			var state = {position: {}, quaternion: {}, scale: {}};
			recordState(state, scope.object);
			if (scope.object.name.stack.length == 0) {
				scope.object.name.stack.push(state);
			}
			else {
				var _tmp = scope.object.name.stack[scope.object.name.stack.length-1];
				var _same = _tmp.position.equals ( state.position) && _tmp.quaternion.equals ( state.quaternion) 
							&& _tmp.scale.equals ( state.scale);
				if (!_same) {
					scope.object.name.stack.push(state);
				}
			}


			scope.update();

		};

		this.detach = function ( object ) {

			scope.object = undefined;
			this.axis = null;

			this.gizmo["translate"].hide();
			this.gizmo["rotate"].hide();
			this.gizmo["scale"].hide();
		};

		this.setMode = function ( mode ) {

			_mode = mode ? mode : _mode;

			//if ( _mode == "scale" ) 
			scope.space = "local";

			this.gizmo["translate"].hide();
			this.gizmo["rotate"].hide();
			this.gizmo["scale"].hide();	
			if (scope.object != undefined) {
				this.gizmo[_mode].show();
			}

			this.update();
			scope.dispatchEvent( changeEvent );

		};

		this.getMode = function () {
			if (scope.object == undefined)
				return 'world';
			else return _mode;
		}

		this.getDragging = function () {
			if ( scope.object === undefined ) return false;
			return _dragging;
		}


		this.setDragging = function (drag) {
			_dragging = drag;
		}

		this.setSnap = function ( snap ) {

			scope.snap = snap;

		};

		this.setSize = function ( size ) {

			scope.size = size;
			this.update();
			scope.dispatchEvent( changeEvent );
			
		};

		this.setHighlightSize = function ( size ) {

			scope.highlightSize = size;
			this.update();
			scope.dispatchEvent( changeEvent );
			
		};

		this.setHandlerSize = function (size0) {
			
			scope.handlerSize = size0;
			this.update();
			scope.dispatchEvent( changeEvent );
 		}

		this.setSpace = function ( space ) {

			scope.space = space;
			this.update();
			scope.dispatchEvent( changeEvent );

		};

		this.update = function () {

			if ( scope.object === undefined ) return;

			scope.object.updateMatrixWorld();
			worldPosition.setFromMatrixPosition( scope.object.matrixWorld );
			worldRotation.setFromRotationMatrix( tempMatrix.extractRotation( scope.object.matrixWorld ) );

			camera.updateMatrixWorld();
			camPosition.setFromMatrixPosition( camera.matrixWorld );
			camRotation.setFromRotationMatrix( tempMatrix.extractRotation( camera.matrixWorld ) );

			// the scale is w.r.t. camera position
			scale = worldPosition.distanceTo( camPosition ) / 6 * scope.size/FOV_SCALE;
			this.position.copy( worldPosition );


			this.scale.set( scale, scale, scale );

			this.gizmo["translate"].handleGizmos['XY'][0][0].scale.set(scope.highlightSize, scope.highlightSize, scope.highlightSize);
			this.gizmo["translate"].handleGizmos['YZ'][0][0].scale.set(scope.highlightSize, scope.highlightSize, scope.highlightSize);
			this.gizmo["translate"].handleGizmos['XZ'][0][0].scale.set(scope.highlightSize, scope.highlightSize, scope.highlightSize);

			//this.gizmo["scale"].handleGizmos['X'][1][0].material.linewidth = scope.highlightSize*scope.highlightSize;
			//this.gizmo["scale"].handleGizmos['X'][1][0].material.needsUpdate = true;
			//this.gizmo["scale"].handleGizmos['Y'][0][0].scale.set(scope.highlightSize, scope.highlightSize, scope.highlightSize);
			// this.gizmo["scale"].handleGizmos['Z'][0][1].scale.set(scope.highlightSize, scope.highlightSize, scope.highlightSize);

			this.gizmo["translate"].handleGizmos['X'][0][0].scale.set(scope.handlerSize, 1, 1);
			this.gizmo["translate"].handleGizmos['X'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["translate"].pickerGizmos['X'][0][0].scale.set(scope.handlerSize, 1, 1);

			this.gizmo["translate"].handleGizmos['Y'][0][0].scale.set(1, scope.handlerSize, 1);
			this.gizmo["translate"].handleGizmos['Y'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["translate"].pickerGizmos['Y'][0][0].scale.set(1, scope.handlerSize, 1);

			this.gizmo["translate"].handleGizmos['Z'][0][0].scale.set(1, 1, scope.handlerSize);
			this.gizmo["translate"].handleGizmos['Z'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["translate"].pickerGizmos['Z'][0][0].scale.set(1, 1, scope.handlerSize);


			this.gizmo["rotate"].handleGizmos['X'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["rotate"].pickerGizmos['X'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);

			this.gizmo["rotate"].handleGizmos['Y'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["rotate"].pickerGizmos['Y'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);

			this.gizmo["rotate"].handleGizmos['Z'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["rotate"].pickerGizmos['Z'][0][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);



			this.gizmo["scale"].handleGizmos['X'][0][0].scale.set(scope.handlerSize, 1, 1);
			this.gizmo["scale"].handleGizmos['X'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["scale"].pickerGizmos['X'][0][0].scale.set(scope.handlerSize, 1, 1);

			this.gizmo["scale"].handleGizmos['Y'][0][0].scale.set(1, scope.handlerSize, 1);
			this.gizmo["scale"].handleGizmos['Y'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["scale"].pickerGizmos['Y'][0][0].scale.set(1, scope.handlerSize, 1);

			this.gizmo["scale"].handleGizmos['Z'][0][0].scale.set(1, 1, scope.handlerSize);
			this.gizmo["scale"].handleGizmos['Z'][1][0].scale.set(scope.handlerSize, scope.handlerSize, scope.handlerSize);
			this.gizmo["scale"].pickerGizmos['Z'][0][0].scale.set(1, 1, scope.handlerSize);



			eye.copy( camPosition ).sub( worldPosition ).normalize();

			if ( scope.space == "local" )
				this.gizmo[_mode].update( worldRotation, eye );

			else if ( scope.space == "world" )
				this.gizmo[_mode].update( new THREE.Euler(), eye );

			this.gizmo[_mode].highlight( scope.axis );
			// if (scope.axis !=  null)
			// 	this.gizmo[_mode].highlight( 'XYZ' );


			if (atBottom) {
				var p = new THREE.Vector3(0, 0, scope.object.geometry.boundingBox.min.z);
				p.applyMatrix4( scope.object.matrixWorld  );
				var m = new THREE.Matrix4();
				m.getInverse(this.matrixWorld);
				p.applyMatrix4(m)
				this.gizmo["translate"].position.copy(p);
				this.gizmo["scale"].position.copy(p);
			}

		};

		function display(isHilighted, elementID)
		{
			if (isHilighted) {
				currMode = 'Editing Mode: ' + _mode;
				document.getElementById(elementID).innerHTML = currMode;
			}
			else {
				currMode = 'View Mode';
				document.getElementById(elementID).innerHTML = currMode;
			}
		}


		function recordState(summary, obj)
		{
			summary.position = obj.position.clone();
			summary.quaternion = obj.quaternion.clone();
			summary.scale = obj.scale.clone();
		}

		function onPointerHover( event ) {

			if ( scope.object === undefined || _dragging === true || scope.enabled === false) return;

			event.preventDefault();

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			var intersect = intersectObjects( pointer, scope.gizmo[_mode].pickers.children );

			if ( intersect ) {
				scope.axis = intersect.object.name;
				scope.update();
				scope.dispatchEvent( changeEvent );

				// ================ Modification ====================
				// Display the message to the html (for temp usage)
				display(true, 'status');
				// ================ Modification ====================

			}
			else if ( scope.axis !== null ) 
			{
				scope.axis = null;
				scope.update();
				scope.dispatchEvent( changeEvent );

				// ================ Modification ====================
				// Display the message to the html (for temp usage)
				display(false, 'status');
				// ================ Modification ====================
			}

		}

		function onPointerDown( event ) {

			if ( scope.object === undefined ||  _dragging == true || scope.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();

			var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

			if ( pointer.button === 0 || pointer.button === undefined ) {

				var intersect = intersectObjects( pointer, scope.gizmo[_mode].pickers.children );

				if ( intersect ) {

					scope.axis = intersect.object.name;

					scope.update();

					eye.copy( camPosition ).sub( worldPosition ).normalize();

					scope.gizmo[_mode].setActivePlane( scope.axis, eye );

					var planeIntersect = intersectObjects( pointer, [scope.gizmo[_mode].activePlane] );

					oldPosition.copy( scope.object.position );
					oldScale.copy( scope.object.scale );

					oldRotationMatrix.extractRotation( scope.object.matrix );
					worldRotationMatrix.extractRotation( scope.object.matrixWorld );

					parentRotationMatrix.extractRotation( scope.object.parent.matrixWorld );
					parentScale.setFromMatrixScale( tempMatrix.getInverse( scope.object.parent.matrixWorld ) );

					offset.copy( planeIntersect.point );

					modified = true;

				}
			}

			_dragging = true;
		}

		function onPointerMove( event ) {

			if ( scope.object === undefined || scope.axis === null || _dragging === false || scope.enabled === false) return;

			event.preventDefault();
			event.stopPropagation();


			var pointer = event.changedTouches? event.changedTouches[0] : event;
	
			var planeIntersect = intersectObjects( pointer, [scope.gizmo[_mode].activePlane] );

			point.copy( planeIntersect.point );

			if ( _mode == "translate" ) {

				point.sub( offset );

				point.multiply(parentScale);

				if ( scope.space == "local" ) {

					point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					if ( scope.axis.search("X") == -1 ) point.x = 0;
					if ( scope.axis.search("Y") == -1 ) point.y = 0;
					if ( scope.axis.search("Z") == -1 ) point.z = 0;

					point.applyMatrix4( oldRotationMatrix );

					scope.object.position.copy( oldPosition );
					scope.object.position.add( point );
				} 

				if ( scope.space == "world" || scope.axis.search("XYZ") != -1 ) {

					if ( scope.axis.search("X") == -1 ) point.x = 0;
					if ( scope.axis.search("Y") == -1 ) point.y = 0;
					if ( scope.axis.search("Z") == -1 ) point.z = 0;

					point.applyMatrix4( tempMatrix.getInverse( parentRotationMatrix ) );

					scope.object.position.copy( oldPosition );
					scope.object.position.add( point );
				}
				
				if ( scope.snap !== null ) {
				
					if ( scope.axis.search("X") != -1 ) scope.object.position.x = Math.round( scope.object.position.x / scope.snap ) * scope.snap;
					if ( scope.axis.search("Y") != -1 ) scope.object.position.y = Math.round( scope.object.position.y / scope.snap ) * scope.snap;
					if ( scope.axis.search("Z") != -1 ) scope.object.position.z = Math.round( scope.object.position.z / scope.snap ) * scope.snap;
				
				}

			} else if ( _mode == "scale" ) {

				point.sub( offset );
				point.multiply(parentScale);

				if ( scope.space == "local" ) {

					if ( scope.axis == "XYZ") {

						scale = 1 + ( ( point.y ) / 30 );

						scope.object.scale.x = oldScale.x * scale;
						scope.object.scale.y = oldScale.y * scale;
						scope.object.scale.z = oldScale.z * scale;

					} else {

						point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

						if ( scope.axis == "X" ) scope.object.scale.x = oldScale.x * ( 1 + point.x/5);    // /5 /50  *10
 						if ( scope.axis == "Y" ) scope.object.scale.y = oldScale.y * ( 1 + point.y/5);
						if ( scope.axis == "Z" ) {

							var prevScale =  scope.object.scale.z;

							scope.object.scale.z = oldScale.z * ( 1 + point.z/5);
						
							// scale from the bottom
							var delta = scope.object.geometry.boundingBox.min.z *prevScale-
								scope.object.geometry.boundingBox.min.z*scope.object.scale.z;
							var p = new THREE.Vector3(0, 0, delta);
							p.applyMatrix4( oldRotationMatrix );
							scope.object.position.add( p );
						}

					}

				}

			} else if ( _mode == "rotate" ) {

				point.sub( worldPosition );
				point.multiply(parentScale);
				tempVector.copy(offset).sub( worldPosition );
				tempVector.multiply(parentScale);

				if ( scope.axis == "E" ) {

					point.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );
					tempVector.applyMatrix4( tempMatrix.getInverse( lookAtMatrix ) );

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

					quaternionE.setFromAxisAngle( eye, rotation.z - offsetRotation.z );
					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionE );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				} else if ( scope.axis == "XYZE" ) {

					quaternionE.setFromEuler( point.clone().cross(tempVector).normalize() ); // rotation axis

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );
					quaternionX.setFromAxisAngle( quaternionE, - point.clone().angleTo(tempVector) );
					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				} else if ( scope.space == "local" ) {

					point.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					tempVector.applyMatrix4( tempMatrix.getInverse( worldRotationMatrix ) );

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), 
						Math.atan2( tempVector.x, tempVector.z ), 
						Math.atan2( tempVector.y, tempVector.x ) );

					quaternionXYZ.setFromRotationMatrix( oldRotationMatrix );
					quaternionX.setFromAxisAngle( unitX, (rotation.x - offsetRotation.x)/1 );
					quaternionY.setFromAxisAngle( unitY, (rotation.y - offsetRotation.y)/1 );
					quaternionZ.setFromAxisAngle( unitZ, (rotation.z - offsetRotation.z)/1 );

					if ( scope.axis == "X" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionX );
					if ( scope.axis == "Y" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionY );
					if ( scope.axis == "Z" ) quaternionXYZ.multiplyQuaternions( quaternionXYZ, quaternionZ );

					scope.object.quaternion.copy( quaternionXYZ );

				} else if ( scope.space == "world" ) {

					rotation.set( Math.atan2( point.z, point.y ), Math.atan2( point.x, point.z ), Math.atan2( point.y, point.x ) );
					offsetRotation.set( Math.atan2( tempVector.z, tempVector.y ), Math.atan2( tempVector.x, tempVector.z ), Math.atan2( tempVector.y, tempVector.x ) );

					tempQuaternion.setFromRotationMatrix( tempMatrix.getInverse( parentRotationMatrix ) );

					quaternionX.setFromAxisAngle( unitX, rotation.x - offsetRotation.x );
					quaternionY.setFromAxisAngle( unitY, rotation.y - offsetRotation.y );
					quaternionZ.setFromAxisAngle( unitZ, rotation.z - offsetRotation.z );
					quaternionXYZ.setFromRotationMatrix( worldRotationMatrix );

					if ( scope.axis == "X" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionX );
					if ( scope.axis == "Y" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionY );
					if ( scope.axis == "Z" ) tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionZ );

					tempQuaternion.multiplyQuaternions( tempQuaternion, quaternionXYZ );

					scope.object.quaternion.copy( tempQuaternion );

				}

			}

			scope.update();

			scope.dispatchEvent( changeEvent );
			if ( _mode == "scale" ) {
				scope.dispatchEvent( objectScaleEvent );
			}else{
				scope.dispatchEvent( objectChangeEvent );
			}

		}


		function onPointerUp( event ) {

			if (scope.enabled === false ) return;
			_dragging = false;

			if (modified == true) {
				var state = {position: {}, quaternion: {}, scale: {}};
				recordState(state, scope.object);
				
				if (!(scope.object.name.stack[scope.object.name.stack.length-1] === state)) {
					scope.object.name.stack.push(state);
				}
				scope.dispatchEvent( mouseUpEvent );
			}
			
			modified = false;
			onPointerHover( event );

		}

		function onMouseUp(event) {
			if (scope.enabled === false ) return;
			_dragging = false;
			onPointerHover( event );
		}

		function onPointerOut( event ) {

			//console.log('out!');

		}

		function intersectObjects( pointer, objects) {

			// new added
			var rect0 = domElement.getBoundingClientRect();
			var w = rect0.width;
			var h = rect0.height;
			var rect = {
				top: (1.0 - scope.viewPort.height - scope.viewPort.heightOffset)*h + rect0.top,
				left: (scope.viewPort.widthOffset)*w + rect0.left,
				right: (scope.viewPort.widthOffset + scope.viewPort.width)*w + rect0.left,
				bottom: h + rect0.top, 
				height: scope.viewPort.height*h,
				width: scope.viewPort.width*w,
			}

			// old version
			//var rect = domElement.getBoundingClientRect();

			var x = (pointer.clientX - rect.left) / rect.width;
			var y = (pointer.clientY - rect.top) / rect.height;
			pointerVector.set( ( x ) * 2 - 1, - ( y ) * 2 + 1, 0.5 );

			pointerVector.unproject(camera);
			ray.set( camPosition, pointerVector.sub( camPosition ).normalize() );

			var intersections = ray.intersectObjects( objects, true );

			return intersections[0] ? intersections[0] : false;

		}

	};

	THREE.TransformControls.prototype = Object.create( THREE.Object3D.prototype );

}());
