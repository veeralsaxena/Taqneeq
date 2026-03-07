"use client";
import { useEffect, useRef } from "react";

// Animated truck journey — travels DIAGONALLY from top-left (Factory) to bottom-right (Customer)
// with a glowing trail, bigger truck, and clear milestone labels
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

    // Diagonal waypoints: top-left → bottom-right with gentle S-curve
    const waypoints = [
      { x: 0.05, y: 0.15 },  // A: Factory (top-left)
      { x: 0.15, y: 0.25 },
      { x: 0.25, y: 0.30 },
      { x: 0.35, y: 0.40 },
      { x: 0.45, y: 0.45 },
      { x: 0.55, y: 0.55 },
      { x: 0.65, y: 0.58 },
      { x: 0.75, y: 0.65 },
      { x: 0.85, y: 0.72 },
      { x: 0.95, y: 0.85 },  // B: Customer (bottom-right)
    ];

    const milestones = [
      { idx: 0, label: "FACTORY", emoji: "🏭" },
      { idx: 3, label: "WAREHOUSE", emoji: "📦" },
      { idx: 5, label: "HUB", emoji: "🔄" },
      { idx: 7, label: "DISTRIBUTION", emoji: "🏬" },
      { idx: 9, label: "CUSTOMER", emoji: "🏠" },
    ];

    // Catmull-Rom spline interpolation
    const getPoint = (t: number, w: number, h: number) => {
      const n = waypoints.length - 1;
      const seg = t * n;
      const i = Math.min(Math.floor(seg), n - 1);
      const f = seg - i;

      const p0 = waypoints[Math.max(0, i - 1)];
      const p1 = waypoints[i];
      const p2 = waypoints[Math.min(n, i + 1)];
      const p3 = waypoints[Math.min(n, i + 2)];

      const f2 = f * f, f3 = f2 * f;
      const x = 0.5 * ((2*p1.x) + (-p0.x+p2.x)*f + (2*p0.x-5*p1.x+4*p2.x-p3.x)*f2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*f3);
      const y = 0.5 * ((2*p1.y) + (-p0.y+p2.y)*f + (2*p0.y-5*p1.y+4*p2.y-p3.y)*f2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*f3);
      return { x: x * w, y: y * h };
    };

    let truckT = 0;
    const speed = 0.001;

    // Trail storage
    const trail: { x: number; y: number; opacity: number; size: number }[] = [];

    // Ambient particles
    const particles = Array.from({ length: 20 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00015,
      vy: (Math.random() - 0.5) * 0.00015,
      s: 0.5 + Math.random() * 1, o: 0.04 + Math.random() * 0.08,
    }));

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Ambient particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.o})`;
        ctx.fill();
      });

      // Draw road glow (wide)
      ctx.beginPath();
      const start = getPoint(0, w, h);
      ctx.moveTo(start.x, start.y);
      for (let t = 0.005; t <= 1; t += 0.005) {
        const pt = getPoint(t, w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(34, 211, 238, 0.06)";
      ctx.lineWidth = 40;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      // Draw road dashes
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      for (let t = 0.005; t <= 1; t += 0.005) {
        const pt = getPoint(t, w, h);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Milestones
      milestones.forEach(m => {
        const t = m.idx / (waypoints.length - 1);
        const pt = getPoint(t, w, h);

        // Glow
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 30);
        g.addColorStop(0, "rgba(34,211,238,0.15)");
        g.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 30, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,211,238,0.7)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        // Emoji (large)
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(m.emoji, pt.x, pt.y - 18);

        // Label
        ctx.font = "bold 9px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(m.label, pt.x, pt.y + 24);
      });

      // Truck movement
      truckT += speed;
      if (truckT > 1) truckT = 0;

      const tp = getPoint(truckT, w, h);

      // Trail
      trail.push({ x: tp.x, y: tp.y, opacity: 0.7, size: 4 });
      for (let i = trail.length - 1; i >= 0; i--) {
        const t = trail[i];
        t.opacity -= 0.006;
        t.size *= 0.997;
        if (t.opacity <= 0) { trail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${t.opacity})`;
        ctx.fill();
      }

      // Truck glow (big and visible)
      const tg = ctx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, 50);
      tg.addColorStop(0, "rgba(34,211,238,0.35)");
      tg.addColorStop(0.4, "rgba(34,211,238,0.08)");
      tg.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 50, 0, Math.PI * 2);
      ctx.fillStyle = tg;
      ctx.fill();

      // Truck emoji (LARGE)
      ctx.font = "36px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚛", tp.x, tp.y);

      // "A" and "B" labels
      const aP = getPoint(0, w, h);
      const bP = getPoint(1, w, h);
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillStyle = "rgba(34,211,238,0.5)";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("A", aP.x, aP.y - 35);
      ctx.fillText("B", bP.x, bP.y - 35);

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
      style={{ opacity: 0.75 }}
    />
  );
}
