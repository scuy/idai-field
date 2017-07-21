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

      this.scene = new THREE.Scene();
			this.camera = new THREE.PerspectiveCamera( 75,
        containerElem.clientWidth/containerElem.clientHeight, 0.1, 1000 );

			this.renderer = new THREE.WebGLRenderer();
			this.renderer.setSize(containerElem.clientWidth, containerElem.clientHeight);
      containerElem.appendChild(this.renderer.domElement);

			var geometry = new THREE.BoxGeometry( 1, 1, 1 );
			var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
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
