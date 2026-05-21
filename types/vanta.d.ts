declare module "vanta/dist/vanta.topology.min" {
  import type p5 from "p5";

  type VantaTopologyInstance = { destroy: () => void };

  type VantaTopologyOptions = {
    el: HTMLElement | string;
    p5: typeof p5;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
  };

  function TOPOLOGY(options: VantaTopologyOptions): VantaTopologyInstance;

  export default TOPOLOGY;
}
