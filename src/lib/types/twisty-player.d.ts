declare global {
  interface TwistyPlayerElement extends HTMLElement {
    experimentalDragInput: string;
    cameraLatitude: number;
    cameraLongitude: number;
    flash: () => void;
    jumpToStart: () => void;
    timestamp: number;
    alg?: string;
    puzzle?: string;
    controlPanel?: string;
    visualization?: string;
    background?: string;
    experimentalStickeringMaskOrbits?: string;
    experimentalSetupAlg?: string;
    hintFacelets?: string;
  }

  namespace JSX {
    interface IntrinsicElements {
      "twisty-player": import("react").DetailedHTMLProps<
        import("react").HTMLAttributes<TwistyPlayerElement>,
        TwistyPlayerElement
      >;
    }
  }

  namespace React.JSX {
    interface IntrinsicElements {
      "twisty-player": import("react").DetailedHTMLProps<
        import("react").HTMLAttributes<TwistyPlayerElement>,
        TwistyPlayerElement
      >;
    }
  }
}

export { };
