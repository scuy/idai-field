import {Component, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import * as THREE from 'three';

@Component({
    moduleId: module.id,
    selector: 'threed',
    templateUrl: './threed.html'
})

/**
 * @author Sebastian Cuy
 */
export class ThreedComponent implements AfterViewInit {

  @ViewChild('container') container: ElementRef;

  private renderer: THREE.Renderer;
  private cube: THREE.Mesh;
  private camera: THREE.Camera;
  private scene: THREE.Scene;

  ngOnInit() {
  }

  ngAfterViewInit() {

      let containerElem = this.container.nativeElement;

      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color(0xdddddd);
      this.scene.add( new THREE.AmbientLight( 0xffffff, 0.3 ) );
			var light = new THREE.DirectionalLight( 0xffffff, 0.35 );
			light.position.set( 1, 1, 1 ).normalize();
			this.scene.add( light );

			this.camera = new THREE.PerspectiveCamera( 75,
        containerElem.clientWidth/containerElem.clientHeight, 0.1, 1000 );

			this.renderer = new THREE.WebGLRenderer();
			this.renderer.setSize(containerElem.clientWidth, containerElem.clientHeight);
      containerElem.appendChild(this.renderer.domElement);

			var geometry = new THREE.BoxGeometry( 1, 1, 1 );
			var material = new THREE.MeshLambertMaterial( { color: 0x00ff00 } );
			this.cube = new THREE.Mesh( geometry, material );
			this.scene.add(this.cube);

			this.camera.position.z = 5;

			this.animate();
  }

  private animate() {

    requestAnimationFrame(this.animate.bind(this));
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    this.renderer.render(this.scene, this.camera);
  };

}
