import { useEffect, useRef } from 'react';

/**
 * InteractiveBg — canvas particle network that reacts to mouse movement.
 * Reads data-theme from <html> to adapt colors for dark / light mode.
 */
export default function InteractiveBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let mouse = { x: -9999, y: -9999 };

    // ── helpers ──────────────────────────────────────────────
    const isDark = () =>
      document.documentElement.getAttribute('data-theme') !== 'light';

    const getRole = () =>
      document.documentElement.getAttribute('data-role') || 'default';

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    // ── particles ────────────────────────────────────────────
    const COUNT = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 12000));
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.2 + 0.8,
    }));

    // ── draw ─────────────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = isDark();
      const role = getRole();

      // Role-aware palettes
      const palettes = {
        teacher: {
          dot:   dark ? 'rgba(99,102,241,'  : 'rgba(79,70,229,',
          line:  dark ? 'rgba(129,140,248,' : 'rgba(99,102,241,',
          mouse: dark ? 'rgba(167,139,250,' : 'rgba(139,92,246,',
        },
        student: {
          dot:   dark ? 'rgba(34,211,153,'  : 'rgba(5,150,105,',
          line:  dark ? 'rgba(16,185,129,'  : 'rgba(5,150,105,',
          mouse: dark ? 'rgba(52,211,153,'  : 'rgba(16,185,129,',
        },
        default: {
          dot:   dark ? 'rgba(34,211,153,'  : 'rgba(5,150,105,',
          line:  dark ? 'rgba(96,165,250,'  : 'rgba(99,102,241,',
          mouse: dark ? 'rgba(167,139,250,' : 'rgba(139,92,246,',
        },
      };
      const pal = palettes[role] || palettes.default;
      const dotColor   = pal.dot;
      const lineColor  = pal.line;
      const mouseColor = pal.mouse;
      const CONNECT_DIST = 130;
      const MOUSE_DIST   = 160;

      // update positions
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * (dark ? 0.18 : 0.12);
            ctx.strokeStyle = lineColor + alpha + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // mouse attraction lines
        const p = particles[i];
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < MOUSE_DIST) {
          const alpha = (1 - mdist / MOUSE_DIST) * (dark ? 0.5 : 0.35);
          ctx.strokeStyle = mouseColor + alpha + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // draw dots
      particles.forEach(p => {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        const boost = mdist < MOUSE_DIST ? 1 + (1 - mdist / MOUSE_DIST) * 1.5 : 1;
        const alpha = dark ? 0.7 : 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * boost, 0, Math.PI * 2);
        ctx.fillStyle = dotColor + alpha + ')';
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    // ── events ────────────────────────────────────────────────
    const onMove = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
    />
  );
}
