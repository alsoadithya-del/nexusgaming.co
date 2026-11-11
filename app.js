const games = [
  {id:'riftbound',name:'Riftbound',genre:'Adventure',modes:['Solo','Co-op'],rating:'4.9',players:'1–3 players',tag:'EDITOR’S PICK',poster:'rift',label:'RIFT\nBOUND',description:'Explore a fractured planet and uncover the signal beneath the surface.',duration:'25–40 min',popular:99,detail:'A strange signal is pulling explorers toward the edge of a forgotten system. Scout alien terrain, build your loadout, and decide what deserves to survive. Play alone or bring two friends along for the expedition.'},
  {id:'neon-drift',name:'Neon Drift',genre:'Racing',modes:['Solo','Multiplayer'],rating:'4.8',players:'1–8 players',tag:'TRENDING',poster:'racer',label:'NEON\nDRIFT',description:'Own the night in high-speed races through a living neon city.',duration:'8–12 min',popular:96,detail:'A fast, futuristic street racer built around tight corners, bold shortcuts, and a city that never sleeps. Set a personal best in solo time trials or challenge the lobby.'},
  {id:'verdant-protocol',name:'Verdant Protocol',genre:'Strategy',modes:['Solo','Co-op'],rating:'4.7',players:'1–4 players',tag:'NEW WORLD',poster:'tactics',label:'VERDANT\nPROTOCOL',description:'Build, adapt, and defend the last green frontier.',duration:'30–60 min',popular:91,detail:'Lead a small outpost on a wild and beautiful frontier. Balance resources, research, and defense as the environment changes around you. Co-op lets each player specialize.'},
  {id:'pulse-arena',name:'Pulse Arena',genre:'Action',modes:['Multiplayer'],rating:'4.9',players:'2–10 players',tag:'LIVE MATCHES',poster:'arena',label:'PULSE\nARENA',description:'Quick-fire team battles where every second changes the score.',duration:'6–10 min',popular:98,detail:'Jump into compact, high-energy arenas with clear objectives and quick rounds. Team up, coordinate abilities, and climb the community ladder.'},
  {id:'blue-hour',name:'Blue Hour',genre:'Adventure',modes:['Solo','Co-op'],rating:'4.6',players:'1–2 players',tag:'COZY QUEST',poster:'drift',label:'BLUE\nHOUR',description:'Sail quiet oceans, solve curious puzzles, and find your way home.',duration:'20–35 min',popular:85,detail:'A calm exploration adventure for winding down. Chart islands, uncover gentle environmental puzzles, and collect stories scattered across a luminous sea.'},
  {id:'echoes-of-ember',name:'Echoes of Ember',genre:'Sports',modes:['Solo','Multiplayer'],rating:'4.7',players:'1–6 players',tag:'COMMUNITY FAV',poster:'echo',label:'ECHOES\nOF EMBER',description:'A fresh take on arena sport: timing, teamwork, and wild comebacks.',duration:'10–15 min',popular:89,detail:'A kinetic team sport that rewards smart positioning as much as quick reactions. Practice in solo challenges, then take your skills into a live squad match.'},
  {id:'neon-runner',name:'Neon Runner',genre:'Action',modes:['Solo'],rating:'NEW',players:'1 player',tag:'PLAYABLE NOW',poster:'arena',label:'NEON\nRUNNER',description:'Jump, dodge and collect energy orbs in a neon endless-runner challenge.',duration:'1–5 min',popular:100,detail:'A free browser arcade game. Use Space, Arrow Up, W or tap to jump over barriers and collect energy orbs. Your best score is saved in your NEXUS player profile.'}
];

const defaultProfile = () => ({xp:0,minutes:0,streak:0,progress:{},favorites:[],achievements:[],lastPlayed:null});
const storage = {
  get(key, fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback;}catch{return fallback;}},
  set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Browser storage is unavailable. Progress may not persist.','!');}}
};
let users = storage.get('nexus_users',{});
let currentEmail = storage.get('nexus_current_user',null);
let profile = defaultProfile();
let activeMode = 'all';
let activeGenre = 'all';
let searchTerm = '';
let sortMode = 'popular';
let currentSession = null;
let sessionStart = null;
let roomCode = null;

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const safe = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getUser(){return currentEmail && users[currentEmail] ? users[currentEmail] : null;}
function profileKey(){return currentEmail ? `nexus_profile_${currentEmail}` : 'nexus_guest_profile';}
function loadProfile(){profile=storage.get(profileKey(),defaultProfile());profile={...defaultProfile(),...profile,progress:profile.progress||{},favorites:profile.favorites||[],achievements:profile.achievements||[]};}
function saveProfile(){storage.set(profileKey(),profile);}
function saveUsers(){storage.set('nexus_users',users);}
function toast(message, icon='✓'){const stack=$('#toastStack');const el=document.createElement('div');el.className='toast';el.innerHTML=`<span>${safe(icon)}</span>${safe(message)}`;stack.append(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),250);},3000);}
function gameProgress(id){return profile.progress[id]||{percent:0,minutes:0};}
function renderGames(){
  let list=games.filter(g=>activeMode==='all'||(activeMode==='solo'?g.modes.includes('Solo'):g.modes.some(mode=>mode==='Multiplayer'||mode==='Co-op')));
  if(activeGenre!=='all')list=list.filter(g=>g.genre===activeGenre);
  if(searchTerm)list=list.filter(g=>(g.name+' '+g.genre+' '+g.description+' '+g.modes.join(' ')).toLowerCase().includes(searchTerm.toLowerCase()));
  if(sortMode==='az')list.sort((a,b)=>a.name.localeCompare(b.name));else list.sort((a,b)=>b.popular-a.popular);
  $('#gameGrid').innerHTML=list.map(g=>{
    const saved=profile.favorites.includes(g.id);const progress=gameProgress(g.id).percent;
    const modeLabel=g.modes.length>1?'SOLO + MULTI':g.modes[0].toUpperCase();
    return `<article class="game-card">
      <div class="game-poster poster-${g.poster}"><div class="poster-art"><div class="poster-shape"></div></div><span class="poster-top">${safe(g.tag)}</span><button class="favorite-button ${saved?'saved':''}" data-favorite="${g.id}" aria-label="${saved?'Remove from':'Add to'} favorites">${saved?'♥':'♡'}</button><div class="poster-label">${safe(g.label).replace('\n','<br>')}</div></div>
      <div class="game-info"><div class="game-info-top"><h3>${safe(g.name)}</h3><span class="game-rating">★ ${g.rating}</span></div><p class="game-description">${safe(g.description)}</p><div class="game-card-foot"><div class="game-tags"><span class="game-tag">${safe(g.genre.toUpperCase())}</span><span class="game-tag">${modeLabel}</span><span class="game-tag free-tag">FREE</span></div><button class="game-launch" data-launch="${g.id}">${progress?'Continue':'Launch'} <span>↗</span></button></div></div>
    </article>`;
  }).join('');
  $('#noResults').hidden=list.length!==0;
  $('#libraryCount').textContent=String(games.length).padStart(2,'0');
}
function renderFavorites(){
  const favorites=games.filter(g=>profile.favorites.includes(g.id));
  $('#collectionList').innerHTML=favorites.length?favorites.map(g=>`<a class="collection-item" href="#library" data-collection="${g.id}"><span class="collection-thumb poster-${g.poster}"></span><span>${safe(g.name)}</span></a>`).join(''):'<div class="collection-empty">Your favorites will appear here.</div>';
}
function renderLobbies(){
  const lobbies=[
    {id:'one',icon:'✦',name:'Riftbound · First Contact',meta:'Exploration · Voice optional',slots:'2 / 3',mode:'one'},
    {id:'two',icon:'↗',name:'Neon Drift · Night Run',meta:'Street circuit · Casual',slots:'5 / 8',mode:'two'},
    {id:'three',icon:'◈',name:'Pulse Arena · Squad Up',meta:'Team battle · Ranked',slots:'7 / 10',mode:'three'}
  ];
  $('#lobbyList').innerHTML=lobbies.map(l=>`<div class="lobby-row"><span class="lobby-icon ${l.mode}">${l.icon}</span><div class="lobby-details"><b>${l.name}</b><small>${l.meta}</small></div><span class="lobby-slots">${l.slots}</span><button class="join-button" data-join="${l.id}">Join</button></div>`).join('');
}
function renderProfile(){
  const user=getUser();
  $('#accountName').textContent=user?user.username:'Guest player';
  $('#accountStatus').textContent=user?'Player account':'Save your progress';
  $('#accountAvatar').textContent=(user?user.username:'G').trim().charAt(0).toUpperCase();
  $('#quickAccountAction').innerHTML=user?'Manage your account <span>→</span>':'Create an account <span>→</span>';
  $('#statXp').textContent=`${profile.xp.toLocaleString()} XP`;
  $('#statHours').textContent=`${Math.floor(profile.minutes/60)}h`;
  const level=Math.floor(profile.xp/500)+1;const inside=profile.xp%500;
  $('#statLevel').textContent=`LEVEL ${String(level).padStart(2,'0')}`;
  $('#statStreak').textContent=`${profile.streak||0} DAY`;
  $('#levelBadge').textContent=String(level).padStart(2,'0');
  $('#levelName').textContent=level>=5?'Legendary pathfinder':level>=3?'Experienced explorer':level>=2?'Rising player':'Rookie explorer';
  $('#xpToNext').textContent=`${inside} / 500 XP`;
  $('#levelTrack').style.width=`${inside/5}%`;
  $('#levelFoot').textContent=`${500-inside} XP until level ${level+1}.`;
  const launched=profile.achievements.includes('first-launch');
  $('#achievementTitle').textContent=launched?'First drop':'First steps';
  $('#achievementText').textContent=launched?'You launched your first cloud session. The journey is on.':'Launch your first game to unlock an achievement.';
  $('#achievementStatus').textContent=launched?'UNLOCKED':'LOCKED';
  $('#achievementStatus').classList.toggle('unlocked',launched);
  const rift=gameProgress('riftbound').percent;
  $('#heroProgress').textContent=`${rift}% COMPLETE`;
  $('#heroProgressBar').style.width=`${rift}%`;
  const last=profile.lastPlayed?games.find(g=>g.id===profile.lastPlayed):null;
  $('#quickGame').querySelector('b').textContent=last?last.name:'Riftbound';
  $('#quickGameMeta').textContent=last?`${gameProgress(last.id).percent}% complete · Continue your session`:'No session yet · Start something new';
  const quickCover=$('#quickGame').querySelector('.quick-cover');quickCover.className=`quick-cover cover-${(last||games[0]).poster}`;
  $('#quickGame').querySelector('[data-launch]').dataset.launch=last?last.id:'riftbound';
  renderFavorites();
  renderGames();
}
function openModal(html){$('#modalBody').innerHTML=html;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';}
function closeModal(){ stopNeonRunner(); $('#modalBackdrop').hidden=true;document.body.style.overflow='';currentSession=null; }
function authModal(tab='register'){
  const isRegister=tab==='register';
  openModal(`<div class="modal-eyebrow">YOUR GAME. YOUR JOURNEY.</div><h2 id="modalTitle">${isRegister?'Create your player account.':'Welcome back, player.'}</h2><p class="modal-sub">${isRegister?'Save your progress, keep your favorites, and pick up right where you left off.':'Sign in to return to your saved worlds and player stats.'}</p>
    <div class="auth-tabs"><button type="button" data-auth-tab="register" class="${isRegister?'active':''}">Create account</button><button type="button" data-auth-tab="login" class="${!isRegister?'active':''}">Sign in</button></div>
    <form id="authForm">${isRegister?`<label class="field"><span>PLAYER NAME</span><input name="username" maxlength="18" placeholder="How should we call you?" required /></label>`:''}
    <label class="field"><span>EMAIL ADDRESS</span><input name="email" type="email" placeholder="you@example.com" required /></label>
    <label class="field"><span>PASSWORD</span><input name="password" type="password" minlength="6" placeholder="At least 6 characters" required /></label>
    <div class="form-error" id="formError"></div><button class="primary-button modal-submit" type="submit">${isRegister?'Create my account':'Sign in'} <span class="button-arrow">↗</span></button></form>
    <p class="modal-footnote">Demo account only: details and saves are kept in this browser. Do not reuse a real-world password. Production authentication needs a secure server.</p>`);
}
async function digestPassword(password,salt){
  if(!window.crypto?.subtle)throw new Error('Secure browser crypto is unavailable. Open this site through localhost or HTTPS to create an account.');
  const data=new TextEncoder().encode(`${salt}:${password}`);
  const hash=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function randomSalt(){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function handleAuth(form){
  const fd=new FormData(form);const email=String(fd.get('email')||'').trim().toLowerCase();const password=String(fd.get('password')||'');const username=String(fd.get('username')||'').trim();const isRegister=!!fd.has('username');const error=$('#formError');error.textContent='';
  try{
    if(isRegister){
      if(username.length<2){error.textContent='Player name must be at least 2 characters.';return;}
      if(users[email]){error.textContent='An account with this email already exists. Sign in instead.';return;}
      const salt=randomSalt();const passwordHash=await digestPassword(password,salt);
      users[email]={email,username,salt,passwordHash,createdAt:new Date().toISOString()};saveUsers();
      const guest=storage.get('nexus_guest_profile',defaultProfile());currentEmail=email;storage.set('nexus_current_user',email);
      const accountProfile=storage.get(profileKey(),defaultProfile());
      profile={...defaultProfile(),...guest,...accountProfile,progress:{...guest.progress,...accountProfile.progress},favorites:[...new Set([...(guest.favorites||[]),...(accountProfile.favorites||[])])],achievements:[...new Set([...(guest.achievements||[]),...(accountProfile.achievements||[])])]};
      saveProfile();toast(`Welcome to NEXUS, ${username}.`);closeModal();renderProfile();
    }else{
      const user=users[email];if(!user){error.textContent='No player account found for that email.';return;}
      const hash=await digestPassword(password,user.salt);if(hash!==user.passwordHash){error.textContent='That password does not match this account.';return;}
      currentEmail=email;storage.set('nexus_current_user',email);loadProfile();closeModal();renderProfile();toast(`Welcome back, ${user.username}.`);
    }
  }catch(err){error.textContent=err.message||'Something went wrong. Please try again.';}
}
function launchGame(id){const game=games.find(g=>g.id===id);if(!game)return;if(id==='neon-runner'){launchNeonRunner(game);return;}currentSession=game;sessionStart=Date.now();
  const art=`<div class="game-modal-art poster-${game.poster}"><div class="poster-art"><div class="poster-shape"></div></div><div class="poster-label">${safe(game.label).replace('\n','<br>')}</div></div>`;
  const p=gameProgress(id).percent;
  openModal(`<div class="modal-eyebrow">CLOUD SESSION INITIALIZING</div><h2 id="modalTitle">${safe(game.name)}</h2><p class="modal-sub">Your free demo session is ready. No payment or subscription required.</p>${art}
  <div class="session-panel"><div class="session-top"><b>STREAM STATUS</b><span class="session-live">CONNECTED</span></div><div class="session-meter"><span style="width:100%"></span></div><div class="session-tips">1080p · Adaptive quality · Session save enabled · Previous progress ${p}%</div></div>
  <div class="game-modal-meta"><span>${safe(game.genre)}</span><span>${safe(game.players)}</span><span>${safe(game.duration)}</span></div>
  <div class="session-actions"><button class="primary-button" id="finishSession">✓ Save & exit</button><button class="secondary-button" id="sessionContinue">Keep playing</button></div>
  <p class="modal-footnote">Prototype session: this simulates a cloud launch. This is a free playable-flow demo, not a live streamed commercial game. No payment is taken.</p>`);
}
function finishSession(){if(!currentSession)return;const game=currentSession;const elapsed=Math.max(1,Math.round((Date.now()-sessionStart)/60000));const minutes=Math.max(15,elapsed);const old=gameProgress(game.id);const gained=game.id==='riftbound'?14:11;const next=Math.min(100,old.percent+gained);
  profile.progress[game.id]={percent:next,minutes:(old.minutes||0)+minutes};profile.xp+=50;profile.minutes+=minutes;profile.lastPlayed=game.id;if(!profile.achievements.includes('first-launch'))profile.achievements.push('first-launch');profile.streak=Math.max(1,profile.streak||0);saveProfile();closeModal();renderProfile();toast(`${game.name} saved · +50 XP · ${next}% complete.`);}

// NEXUS playable mini-game: Neon Runner (runs locally in the browser).
let neonRunnerFrame=0, neonRunnerKeys={}, neonRunnerState=null, neonRunnerLast=0;
function stopNeonRunner(){if(neonRunnerFrame)cancelAnimationFrame(neonRunnerFrame);neonRunnerFrame=0;window.removeEventListener('keydown',neonRunnerKeyDown);window.removeEventListener('keyup',neonRunnerKeyUp);}
function neonRunnerKeyDown(e){if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();neonRunnerKeys.jump=true;if(neonRunnerState&&neonRunnerState.over)restartNeonRunner();}}
function neonRunnerKeyUp(e){if(['Space','ArrowUp','KeyW'].includes(e.code))neonRunnerKeys.jump=false;}
function launchNeonRunner(game){
  currentSession=game;sessionStart=Date.now();
  const best=Number(storage.get('nexus_neon_runner_best',0));
  openModal(`<div class="modal-eyebrow">FREE ARCADE · SOLO</div><h2 id="modalTitle">NEON RUNNER</h2><p class="modal-sub">Jump over barriers and collect glowing energy orbs. Space, ↑, W or tap to jump.</p><div class="runner-hud"><span>SCORE <b id="runnerScore">0</b></span><span>BEST <b id="runnerBest">${best}</b></span><span>ORB <b id="runnerOrbs">0</b></span></div><canvas id="neonRunnerCanvas" class="runner-canvas" width="900" height="340" aria-label="Neon Runner game area"></canvas><div class="runner-controls"><span>SPACE / ↑ / W / TAP = JUMP</span><span id="runnerMessage">Ready? Make your run!</span></div><div class="session-actions runner-actions"><button class="primary-button" id="runnerRestart">↻ Restart</button><button class="secondary-button" id="runnerExit">Save & exit</button></div><p class="modal-footnote">Free browser game. Your best score and NEXUS XP are saved in this browser. No purchase required.</p>`);
  const canvas=$('#neonRunnerCanvas');canvas.addEventListener('pointerdown',()=>{if(neonRunnerState?.over)restartNeonRunner();else neonRunnerKeys.jump=true;});
  window.addEventListener('keydown',neonRunnerKeyDown);window.addEventListener('keyup',neonRunnerKeyUp);
  $('#runnerRestart').addEventListener('click',restartNeonRunner);$('#runnerExit').addEventListener('click',saveNeonRunner);
  restartNeonRunner();
}
function restartNeonRunner(){
  const canvas=$('#neonRunnerCanvas');if(!canvas)return;const best=Number(storage.get('nexus_neon_runner_best',0));
  neonRunnerState={playerY:260,vy:0,ground:260,obstacles:[],orbs:[],score:0,collected:0,speed:6,spawn:0,orbSpawn:55,over:false,best};
  $('#runnerMessage').textContent='Run! Jump over the barriers.';neonRunnerLast=0;if(neonRunnerFrame)cancelAnimationFrame(neonRunnerFrame);neonRunnerFrame=requestAnimationFrame(drawNeonRunner);
}
function drawNeonRunner(time){
  const canvas=$('#neonRunnerCanvas');if(!canvas||!neonRunnerState)return;const ctx=canvas.getContext('2d'),g=neonRunnerState;const dt=Math.min(2,(time-(neonRunnerLast||time))/16.67);neonRunnerLast=time;
  ctx.clearRect(0,0,900,340);const bg=ctx.createLinearGradient(0,0,0,340);bg.addColorStop(0,'#111b35');bg.addColorStop(1,'#080d1b');ctx.fillStyle=bg;ctx.fillRect(0,0,900,340);
  ctx.fillStyle='rgba(105,224,220,.12)';for(let i=0;i<30;i++){const x=(i*83-(g.score*2)%900+900)%900;ctx.fillRect(x,35+(i*47)%175,2,2);}
  ctx.strokeStyle='rgba(85,224,209,.2)';ctx.lineWidth=1;for(let x=0;x<900;x+=45){ctx.beginPath();ctx.moveTo(x,285);ctx.lineTo(x-65,340);ctx.stroke();}ctx.fillStyle='#172b43';ctx.fillRect(0,285,900,55);ctx.strokeStyle='#55e0d1';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,285);ctx.lineTo(900,285);ctx.stroke();
  if(!g.over){if(neonRunnerKeys.jump&&g.playerY>=g.ground-1){g.vy=-15;neonRunnerKeys.jump=false;}g.vy+=.72*dt;g.playerY=Math.min(g.ground,g.playerY+g.vy*dt);if(g.playerY>=g.ground)g.vy=0;
    g.spawn-=dt;if(g.spawn<=0){g.obstacles.push({x:930,w:24+Math.random()*18,h:35+Math.random()*35});g.spawn=68+Math.random()*45;}g.orbSpawn-=dt;if(g.orbSpawn<=0){g.orbs.push({x:930,y:190+Math.random()*55});g.orbSpawn=65+Math.random()*55;}
    g.obstacles.forEach(o=>o.x-=g.speed*dt);g.orbs.forEach(o=>o.x-=g.speed*dt);g.obstacles=g.obstacles.filter(o=>o.x>-60);g.orbs=g.orbs.filter(o=>o.x>-30);g.score+=dt*.16;g.speed=Math.min(11,6+g.score/180);
    const px=125,py=g.playerY-38;for(const o of g.obstacles){if(px+29>o.x&&px<o.x+o.w&&g.playerY>285-o.h){g.over=true;}}
    for(const orb of g.orbs){if(!orb.hit&&Math.hypot(140-orb.x,g.playerY-18-orb.y)<29){orb.hit=true;g.collected++;g.score+=20;}}
    g.orbs=g.orbs.filter(o=>!o.hit);
  }
  // player
  ctx.shadowBlur=20;ctx.shadowColor='#9b7bff';ctx.fillStyle='#a88aff';ctx.fillRect(125,g.playerY-38,29,38);ctx.shadowBlur=0;ctx.fillStyle='#dffefa';ctx.fillRect(145,g.playerY-29,5,5);ctx.fillStyle='#55e0d1';ctx.fillRect(130,g.playerY-5,19,5);
  for(const o of g.obstacles){ctx.shadowBlur=13;ctx.shadowColor='#ff76a8';ctx.fillStyle='#ff76a8';ctx.fillRect(o.x,285-o.h,o.w,o.h);ctx.shadowBlur=0;ctx.fillStyle='#ffd3e1';ctx.fillRect(o.x+4,285-o.h+5,4,Math.max(5,o.h-10));}
  for(const o of g.orbs){ctx.beginPath();ctx.arc(o.x,o.y,8,0,Math.PI*2);ctx.fillStyle='#55e0d1';ctx.shadowBlur=17;ctx.shadowColor='#55e0d1';ctx.fill();ctx.shadowBlur=0;}
  $('#runnerScore').textContent=Math.floor(g.score);$('#runnerOrbs').textContent=g.collected;
  if(g.over){ctx.fillStyle='rgba(5,9,20,.72)';ctx.fillRect(0,0,900,340);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 38px sans-serif';ctx.fillText('RUN OVER',450,145);ctx.fillStyle='#55e0d1';ctx.font='bold 20px sans-serif';ctx.fillText(`SCORE ${Math.floor(g.score)}  ·  ORBS ${g.collected}`,450,184);ctx.fillStyle='#b8c4dc';ctx.font='16px sans-serif';ctx.fillText('Press SPACE or click Restart to play again',450,220);$('#runnerMessage').textContent='Game over — restart for another run.';return;}
  neonRunnerFrame=requestAnimationFrame(drawNeonRunner);
}
function saveNeonRunner(){if(!neonRunnerState)return;const g=neonRunnerState;stopNeonRunner();const score=Math.floor(g.score),best=Math.max(score,Number(storage.get('nexus_neon_runner_best',0)));storage.set('nexus_neon_runner_best',best);profile.progress['neon-runner']={percent:Math.min(100,Math.max(gameProgress('neon-runner').percent,Math.floor(best/5))),minutes:(gameProgress('neon-runner').minutes||0)+Math.max(1,Math.round((Date.now()-sessionStart)/60000))};profile.xp+=Math.max(5,Math.floor(score/5)+g.collected*2);profile.minutes+=Math.max(1,Math.round((Date.now()-sessionStart)/60000));profile.lastPlayed='neon-runner';if(!profile.achievements.includes('first-launch'))profile.achievements.push('first-launch');saveProfile();renderProfile();closeModal();toast(`Neon Runner saved · score ${score} · best ${best} · XP earned.`);neonRunnerState=null;}

function detailsGame(id){const game=games.find(g=>g.id===id);if(!game)return;const art=`<div class="game-modal-art poster-${game.poster}"><div class="poster-art"><div class="poster-shape"></div></div><div class="poster-label">${safe(game.label).replace('\n','<br>')}</div></div>`;
  openModal(`<div class="modal-eyebrow">${safe(game.tag)} · ${safe(game.genre.toUpperCase())}</div><h2 id="modalTitle">${safe(game.name)}</h2>${art}<p class="game-modal-desc">${safe(game.detail)}</p><div class="game-modal-meta"><span>★ ${game.rating} player rating</span><span>${safe(game.players)}</span><span>${game.modes.join(' · ')}</span><span>${safe(game.duration)}</span></div><button class="primary-button modal-submit" id="detailsLaunch">▶ Launch ${safe(game.name)} <span class="button-arrow">↗</span></button>`);
}
function createRoom(){roomCode=Math.random().toString(36).slice(2,8).toUpperCase();openModal(`<div class="modal-eyebrow">SQUAD UP</div><h2 id="modalTitle">Your room is ready.</h2><p class="modal-sub">Share this invite code with your crew. This demo room is local to this browser.</p><div class="room-code">${roomCode}</div><button class="primary-button modal-submit" id="copyRoomCode">Copy invite code ↗</button><p class="modal-footnote">Friends can use “Join a room” to enter this code in the demo.</p>`);}
function joinRoom(lobby){const names={one:'Riftbound · First Contact',two:'Neon Drift · Night Run',three:'Pulse Arena · Squad Up'};toast(`Joining ${names[lobby]}… Matchmaking simulated.`,'↗');}
function joinByCode(){openModal(`<div class="modal-eyebrow">SQUAD UP</div><h2 id="modalTitle">Join a room.</h2><p class="modal-sub">Enter the six-character invite code shared by your friend.</p><form id="joinForm"><label class="field"><span>INVITE CODE</span><input name="code" maxlength="6" placeholder="E.G. 8K2QPX" required /></label><div class="form-error" id="joinError"></div><button class="primary-button modal-submit" type="submit">Join room ↗</button></form>`);}
function profileModal(){const user=getUser();const played=games.filter(g=>gameProgress(g.id).percent>0);const saved=games.filter(g=>profile.favorites.includes(g.id));openModal(`<div class="modal-eyebrow">PLAYER FILE</div><h2 id="modalTitle">${safe(user?user.username:'Guest player')}</h2><p class="modal-sub">${safe(user?user.email:'Guest progress is stored in this browser until you create an account.')}</p><div class="game-modal-meta"><span>${profile.xp} XP earned</span><span>${Math.floor(profile.minutes/60)}h played</span><span>Level ${Math.floor(profile.xp/500)+1}</span></div><h3 style="font:600 12px var(--display);margin:18px 0 8px">RECENT WORLDS</h3>${played.length?played.map(g=>`<div class="lobby-row"><span class="lobby-icon one">◈</span><div class="lobby-details"><b>${safe(g.name)}</b><small>${gameProgress(g.id).percent}% complete · ${gameProgress(g.id).minutes} min played</small></div></div>`).join(''):'<p class="modal-sub">No saved sessions yet. Launch a game to start your player file.</p>'}<h3 style="font:600 12px var(--display);margin:18px 0 8px">FAVORITES</h3><p class="modal-sub">${saved.length?saved.map(g=>safe(g.name)).join(' · '):'No favorites yet.'}</p>${user?'<button class="secondary-button" style="width:100%;margin-top:12px" id="signOutButton">Sign out</button>':'<button class="primary-button modal-submit" id="profileCreateAccount">Create an account ↗</button>'}<p class="modal-footnote">This is a local demo profile. Online sync across devices requires a production account service and database.</p>`);}

// Delegated interactions
$('#gameGrid').addEventListener('click',e=>{const fav=e.target.closest('[data-favorite]');if(fav){const id=fav.dataset.favorite;profile.favorites=profile.favorites.includes(id)?profile.favorites.filter(x=>x!==id):[...profile.favorites,id];saveProfile();renderProfile();toast(profile.favorites.includes(id)?'Added to your collection.':'Removed from your collection.');return;}const launch=e.target.closest('[data-launch]');if(launch){launchGame(launch.dataset.launch);return;}const details=e.target.closest('[data-details]');if(details)detailsGame(details.dataset.details);});
document.addEventListener('click',e=>{
  const launch=e.target.closest('[data-launch]');if(launch&&!$('#gameGrid').contains(launch)){launchGame(launch.dataset.launch);return;}
  const details=e.target.closest('[data-details]');if(details){detailsGame(details.dataset.details);return;}
  const tab=e.target.closest('[data-auth-tab]');if(tab){authModal(tab.dataset.authTab);return;}
  const join=e.target.closest('[data-join]');if(join){joinRoom(join.dataset.join);return;}
  const coll=e.target.closest('[data-collection]');if(coll){e.preventDefault();detailsGame(coll.dataset.collection);}
});
$('#gameGrid').addEventListener('keydown',()=>{});
$('#modalBody').addEventListener?.('click',()=>{});
$('#modalBody').addEventListener('submit',e=>{if(e.target.id==='authForm'){e.preventDefault();handleAuth(e.target);}if(e.target.id==='joinForm'){e.preventDefault();const code=String(new FormData(e.target).get('code')||'').trim().toUpperCase();if(!/^[A-Z0-9]{6}$/.test(code)){$('#joinError').textContent='Enter a valid 6-character code.';return;}closeModal();toast(`Room ${code} found · joining session…`,'↗');}});
$('#modalBody').addEventListener('click',e=>{if(e.target.closest('#finishSession'))finishSession();if(e.target.closest('#sessionContinue')){closeModal();toast('Session is running in demo mode. Save when you are ready.','▶');}if(e.target.closest('#detailsLaunch')){const id=currentSession?.id;/* details modal has no session assigned */const title=$('#modalBody h2')?.textContent;const game=games.find(g=>g.name===title);if(game)launchGame(game.id);}if(e.target.closest('#copyRoomCode')){navigator.clipboard?.writeText(roomCode).then(()=>toast('Invite code copied.')).catch(()=>toast(`Invite code: ${roomCode}`));}if(e.target.closest('#signOutButton')){currentEmail=null;storage.set('nexus_current_user',null);loadProfile();closeModal();renderProfile();toast('Signed out. Guest mode is ready.');}if(e.target.closest('#profileCreateAccount'))authModal('register');});
$('#modalClose').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalBackdrop').hidden)closeModal();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus();}});
$('#accountButton').addEventListener('click',()=>getUser()?profileModal():authModal('register'));
$('#quickAccountAction').addEventListener('click',()=>getUser()?profileModal():authModal('register'));
$('#openProfile').addEventListener('click',profileModal);
$('#globalSearch').addEventListener('input',e=>{searchTerm=e.target.value.trim();renderGames();});
$$('.mode-tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.mode-tab').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false');});btn.classList.add('active');btn.setAttribute('aria-selected','true');activeMode=btn.dataset.mode;renderGames();}));
$('#genreFilter').addEventListener('change',e=>{activeGenre=e.target.value;renderGames();});
$('#sortButton').addEventListener('click',()=>{sortMode=sortMode==='popular'?'az':'popular';$('#sortButton').querySelector('span').textContent=sortMode==='popular'?'Popular':'A–Z';renderGames();});
$('#viewAllGames').addEventListener('click',()=>{$$('.mode-tab').forEach(b=>{b.classList.toggle('active',b.dataset.mode==='all');b.setAttribute('aria-selected',String(b.dataset.mode==='all'));});activeMode='all';activeGenre='all';$('#genreFilter').value='all';searchTerm='';$('#globalSearch').value='';renderGames();});
$('#createRoomButton').addEventListener('click',createRoom);
$('#joinByCodeButton').addEventListener('click',joinByCode);
$('#refreshLobbies').addEventListener('click',()=>{renderLobbies();toast('Lobby list refreshed.');});
$('#notificationButton').addEventListener('click',()=>toast('You’re all caught up. More game drops are on the way.','✦'));
$('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
$$('.nav-link').forEach(link=>link.addEventListener('click',()=>{$$('.nav-link').forEach(x=>x.classList.remove('active'));link.classList.add('active');$('#breadcrumbCurrent').textContent=link.textContent.trim().replace(/\d+/g,'').trim();$('#sidebar').classList.remove('open');}));

// Start in guest mode unless an existing local demo account is selected.
if(currentEmail&&!users[currentEmail]){currentEmail=null;storage.set('nexus_current_user',null);}loadProfile();renderProfile();renderLobbies();
const now=new Date();$('#welcomeDate').textContent=now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}).toUpperCase();
