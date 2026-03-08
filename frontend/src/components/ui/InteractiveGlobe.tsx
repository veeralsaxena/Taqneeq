"use client";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export function InteractiveGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const onResize = () => {
        if (canvasRef.current) {
            width = canvasRef.current.offsetWidth;
        }
    };
    window.addEventListener('resize', onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.2, // slightly lower to see the curve
      dark: 1, // dark mode
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.15],
      markerColor: [0.13, 0.82, 0.93], // cyan
      glowColor: [0.15, 0.15, 0.25],
      markers: [
        // Representing our major hubs (Delhi, Bangalore, Kolkata, Mumbai)
        { location: [28.6139, 77.2090], size: 0.08 },
        { location: [12.9716, 77.5946], size: 0.1 },
        { location: [22.5726, 88.3639], size: 0.05 },
        { location: [19.0760, 72.8777], size: 0.07 },
      ],
      onRender: (state) => {
        // Automatically rotate the globe slowly
        state.phi = phi + 0.5; // Offset to center near India
        phi += 0.003;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div className="w-full max-w-[600px] aspect-square relative mx-auto flex items-center justify-center">
        <canvas
            ref={canvasRef}
            className="w-full h-full object-contain drop-shadow-[0_0_50px_rgba(34,211,238,0.2)]"
            style={{ width: "100%", height: "100%" }}
        />
        {/* Glow behind globe */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1)_0%,transparent_60%)] -z-10" />
    </div>
  );
}
