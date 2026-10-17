/* Independent scratch paper for each practice section. Coordinates stay normalized on resize. */
(() => {
  document.querySelectorAll('.question-area').forEach((area, index) => {
    const board = document.createElement('details');
    board.className = 'scratch-board';
    board.innerHTML = `<summary>✎ Scratch whiteboard</summary><div class="scratch-tools" role="group" aria-label="Whiteboard tools"><button type="button" data-tool="pen" aria-pressed="true">Pen</button><button type="button" data-tool="eraser" aria-pressed="false">Eraser</button><button type="button" data-action="undo">Undo</button><button type="button" data-action="clear">Clear</button></div><p class="scratch-help" id="scratch-help-${index}">Work it out here with your finger, stylus, or mouse. Your work stays until you clear it or leave this page.</p><canvas aria-label="Scratch whiteboard for handwritten calculations" aria-describedby="scratch-help-${index}"></canvas>`;
    area.append(board);
    const canvas = board.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const strokes = [];
    let tool = 'pen', active = null, pointer = null, width = 1, height = 260;
    const undo = board.querySelector('[data-action="undo"]');
    const clear = board.querySelector('[data-action="clear"]');
    function draw(stroke) {
      ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = '#4d3544'; ctx.fillStyle = '#4d3544';
      ctx.lineWidth = stroke.tool === 'eraser' ? 24 : 2.5;
      ctx.lineCap = ctx.lineJoin = 'round';
      const points = stroke.points;
      ctx.beginPath();
      if (points.length === 1) {
        ctx.arc(points[0].x * width, points[0].y * height, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.moveTo(points[0].x * width, points[0].y * height);
        points.slice(1).forEach(p => ctx.lineTo(p.x * width, p.y * height)); ctx.stroke();
      }
    }
    function render() {
      ctx.clearRect(0, 0, width, height);
      strokes.forEach(draw);
      undo.disabled = clear.disabled = strokes.length === 0;
    }
    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      width = rect.width; height = rect.height;
      const scale = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0); render();
    }
    function point(e) {
      const r = canvas.getBoundingClientRect();
      return {x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))};
    }
    function finish(e) {
      if (e && e.pointerId !== pointer) return;
      active = null; pointer = null;
    }
    // Safari can start native selection/callouts independently of pointer events.
    canvas.addEventListener('dblclick', e => e.preventDefault());
    board.addEventListener('selectstart', e => e.preventDefault());
    board.addEventListener('contextmenu', e => e.preventDefault());
    ['touchstart', 'touchmove', 'touchend'].forEach(type => canvas.addEventListener(type, e => e.preventDefault(), {passive: false}));
    canvas.addEventListener('pointerdown', e => {
      if (pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); pointer = e.pointerId; canvas.setPointerCapture(pointer);
      active = {tool, points: [point(e)]}; strokes.push(active); render();
    });
    canvas.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== pointer) return;
      e.preventDefault(); active.points.push(point(e)); render();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, finish));
    board.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
      finish(); tool = button.dataset.tool;
      board.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    }));
    undo.addEventListener('click', () => { finish(); strokes.pop(); render(); });
    clear.addEventListener('click', () => { finish(); strokes.length = 0; render(); });
    board.addEventListener('toggle', () => { if (board.open) resize(); });
    new ResizeObserver(resize).observe(canvas);
    undo.disabled = clear.disabled = true;
  });
})();
