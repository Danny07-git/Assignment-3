// Simple browser-based adventure game script
// Hooks into an index.html by attaching to #game or document.body

;(function(){
	const root = document.getElementById('game') || document.body;

	// Inject minimal styles
	const style = document.createElement('style');
	style.textContent = `#adventure{font-family:system-ui,Segoe UI,Helvetica,Arial;padding:12px;max-width:720px;margin:16px auto;background:#f6f8fa;border-radius:8px;border:1px solid #e1e4e8} #adventure h2{margin:0 0 8px} #adventure .log{min-height:120px;background:#fff;padding:10px;border-radius:6px;border:1px solid #e6edf3;overflow:auto} #adventure .choices{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap} #adventure button{padding:8px 10px;border-radius:6px;border:1px solid #cbd5e1;background:#0078d4;color:#fff;cursor:pointer} #adventure button.secondary{background:#6b7280} #adventure .row{display:flex;justify-content:space-between;align-items:center;margin-top:8px}`;
	document.head.appendChild(style);

	// Create UI
	const app = document.createElement('div');
	app.id = 'adventure';
	app.innerHTML = `
		<h2>Adventure</h2>
		<div class="log" id="log"></div>
		<div class="row">
			<div id="status">HP: <span id="hp">10</span> | Gold: <span id="gold">0</span></div>
			<div id="inventory">Inventory: <span id="items">-</span></div>
		</div>
		<div class="choices" id="choices"></div>
	`;
	root.appendChild(app);

	// Game state
	const state = {
		hp: 10,
		gold: 0,
		items: [],
		scene: 'start'
	};

	const logEl = document.getElementById('log');
	const choicesEl = document.getElementById('choices');
	const hpEl = document.getElementById('hp');
	const goldEl = document.getElementById('gold');
	const itemsEl = document.getElementById('items');

	function save() { localStorage.setItem('adventure_save', JSON.stringify(state)); }
	function load(){
		const raw = localStorage.getItem('adventure_save');
		if(raw) Object.assign(state, JSON.parse(raw));
	}

	function renderStatus(){ hpEl.textContent = state.hp; goldEl.textContent = state.gold; itemsEl.textContent = state.items.join(', ') || '-'; }

	function write(text){ const p = document.createElement('div'); p.textContent = text; logEl.appendChild(p); logEl.scrollTop = logEl.scrollHeight; }

	// Scenes
	const scenes = {
		start(){
			write('You stand at the crossroads of a small village. A forest lies to the north, a cave to the east.');
			choicesEl.innerHTML = '';
			addChoice('Go to the forest', ()=> go('forest'));
			addChoice('Enter the cave', ()=> go('cave'));
			addChoice('Check your pack', ()=> go('pack'));
			addChoice('Save game', ()=>{ save(); write('Game saved.'); }, 'secondary');
		},

		pack(){
			write('You check your pack.'); renderStatus(); scenes.start();
		},

		forest(){
			write('The forest is quiet. You find a pouch of gold but a wolf emerges.');
			choicesEl.innerHTML = '';
			addChoice('Fight the wolf', ()=> fight(3, ()=>{ state.gold += 5; write('You defeated the wolf and took 5 gold.'); go('start'); }));
			addChoice('Run away', ()=>{ state.hp -= 1; write('You escape but injure yourself (-1 HP).'); go('start'); });
		},

		cave(){
			write('The cave is dark. A glint of something valuable is deeper inside.');
			choicesEl.innerHTML = '';
			addChoice('Search deeper', ()=>{
				if(Math.random() < 0.5){ state.items.push('Ancient Coin'); write('You find an Ancient Coin!'); }
				else{ state.hp -= 2; write('A trap injures you (-2 HP).'); }
				go('start');
			});
			addChoice('Leave the cave', ()=> go('start'));
		}
	};

	function addChoice(label, handler, cls){ const btn = document.createElement('button'); if(cls) btn.classList.add(cls); btn.textContent = label; btn.addEventListener('click', ()=>{ handler(); renderStatus(); save(); }); choicesEl.appendChild(btn); }

	function fight(damage, onWin){ state.hp -= Math.max(0, damage - (state.items.includes('Shield')?1:0)); if(state.hp <= 0){ write('You have fallen. Game over.'); choicesEl.innerHTML = ''; addChoice('Restart', ()=>restart(), 'secondary'); } else onWin(); }

	function go(scene){ state.scene = scene; if(scenes[scene]) scenes[scene](); }

	function restart(){ state.hp = 10; state.gold = 0; state.items = []; state.scene = 'start'; localStorage.removeItem('adventure_save'); logEl.innerHTML=''; renderStatus(); scenes.start(); }

	// Init: try load
	load(); renderStatus(); if(state.scene && scenes[state.scene]) scenes[state.scene](); else scenes.start();

	// Expose minimal console helpers for debugging
	window.adventure = { state, save, load, restart };
})();
