"use client";
import { useEffect, useRef } from "react";

// Animated truck journey from Point A (Factory) to Point B (Customer)
// A single truck moves along a winding road with milestones
export default function LogisticsNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Define the road as a series of waypoints (percentage-based)
    const waypoints = [
      { x: 0.06, y: 0.55 },  // A: Factory
      { x: 0.15, y: 0.40 },
      { x: 0.25, y: 0.50 },
      { x: 0.35, y: 0.35 },
      { x: 0.45, y: 0.55 },
      { x: 0.55, y: 0.40 },
      { x: 0.65, y: 0.50 },
      { x: 0.75, y: 0.35 },
      { x: 0.85, y: 0.45 },
      { x: 0.94, y: 0.55 },  // B: Customer
    ];

    // Milestones along the road
    const milestones = [
      { idx: 0, label: "Factory", icon: "🏭" },
      { idx: 3, label: "Warehouse", icon: "📦" },
      { idx: 5, label: "Hub", icon: "🔄" },
      { idx: 7, label: "Distribution", icon: "🏬" },
      { idx: 9, label: "Customer", icon: "🏠" },
    ];

    // Get point along the road at parameter t (0-1)
    const getPointOnPath = (t: number, w: number, h: number) => {
      const totalSegments = waypoints.length - 1;
      const segFloat = t * totalSegments;
      const segIdx = Math.min(Math.floor(segFloat), totalSegments - 1);
      const segT = segFloat - segIdx;

      const p0 = waypoints[Math.max(0, segIdx - 1)];
      const p1 = waypoints[segIdx];
      const p2 = waypoints[Math.min(totalSegments, segIdx + 1)];
      const p3 = waypoints[Math.min(totalSegments, segIdx + 2)];

      // Catmull-Rom spline for smooth curves
      const tt = segT;
      const tt2 = tt * tt;
      const tt3 = tt2 * tt;

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * tt +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * tt2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * tt3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * tt +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * tt2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * tt3
      );

      return { x: x * w, y: y * h };
    };

    // Truck state
    let truckProgress = 0;
    const truckSpeed = 0.0012;

    // Trail particles left by the truck
    const trailParticles: { x: number; y: number; opacity: number; size: number }[] = [];

    // Ambient floating particles
    const ambientParticles = Array.from({ length: 25 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0002,
      vy: (Math.random() - 0.5) * 0.0002,
      size: 0.5 + Math.random() * 1,
      opacity: 0.05 + Math.random() * 0.12,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Draw ambient particles
      ambientParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.fill();
      });

      // Draw road glow (wide soft line)
      ctx.beginPath();
      const firstPt = getPointOnPath(0, w, h);
      ctx.moveTo(firstPt.x, firstPt.y);
      for (let t = 0.01; t <= 1; t += 0.01) {
        const pt = getPointOnPath(t, w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(34, 211, 238, 0.05)";
      ctx.lineWidth = 30;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Draw road (dashed center line)
      ctx.beginPath();
      ctx.moveTo(firstPt.x, firstPt.y);
      for (let t = 0.01; t <= 1; t += 0.01) {
        const pt = getPointOnPath(t, w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw milestone nodes
      milestones.forEach((m) => {
        const segPos = m.idx / (waypoints.length - 1);
        const pt = getPointOnPath(segPos, w, h);

        // Outer glow ring
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 25);
        grad.addColorStop(0, "rgba(34, 211, 238, 0.12)");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Node dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 211, 238, 0.6)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fill();

        // Label
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.textAlign = "center";
        ctx.fillText(m.label, pt.x, pt.y + 22);

        // Emoji
        ctx.font = "16px sans-serif";
        ctx.fillText(m.icon, pt.x, pt.y - 16);
      });

      // Update truck position
      truckProgress += truckSpeed;
      if (truckProgress > 1) truckProgress = 0;

      const truckPt = getPointOnPath(truckProgress, w, h);

      // Add trail particle
      trailParticles.push({
        x: truckPt.x,
        y: truckPt.y,
        opacity: 0.6,
        size: 3,
      });

      // Draw and fade trail particles
      for (let i = trailParticles.length - 1; i >= 0; i--) {
        const tp = trailParticles[i];
        tp.opacity -= 0.008;
        tp.size *= 0.995;
        if (tp.opacity <= 0) {
          trailParticles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, tp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${tp.opacity})`;
        ctx.fill();
      }

      // Draw truck glow
      const truckGlow = ctx.createRadialGradient(truckPt.x, truckPt.y, 0, truckPt.x, truckPt.y, 35);
      truckGlow.addColorStop(0, "rgba(34, 211, 238, 0.25)");
      truckGlow.addColorStop(0.5, "rgba(34, 211, 238, 0.05)");
      truckGlow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(truckPt.x, truckPt.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = truckGlow;
      ctx.fill();

      // Draw truck emoji
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚛", truckPt.x, truckPt.y);

      // Draw progress indicator line at bottom
      const progressBarY = h - 30;
      const progressBarX = w * 0.1;
      const progressBarW = w * 0.8;

      ctx.beginPath();
      ctx.moveTo(progressBarX, progressBarY);
      ctx.lineTo(progressBarX + progressBarW, progressBarY);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(progressBarX, progressBarY);
      ctx.lineTo(progressBarX + progressBarW * truckProgress, progressBarY);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // A and B labels
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("A", progressBarX, progressBarY - 8);
      ctx.fillText("B", progressBarX + progressBarW, progressBarY - 8);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}
