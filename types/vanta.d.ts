declare module "vanta/dist/vanta.clouds.min" {
  import type * as THREE from "three";

  type VantaCloudsInstance = { destroy: () => void };

  type VantaCloudsOptions = {
    el: HTMLElement | string;
    THREE: typeof THREE;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
  };

  function CLOUDS(options: VantaCloudsOptions): VantaCloudsInstance;

  export default CLOUDS;
}
