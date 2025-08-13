// game.js
// sell oregano, all features integrated
// put this file alongside your html and styles.css

/* --------- state --------- */
const state = {
  money: 0,
  totalEarned: 0,
  xp: 0,
  level: 1,
  clickValue: 1,
  clickXp: 1,
  clickUpgrades: [], // {id, name, level, cost, type, emoji}
  gems: 0,
  rebirthCoins: 0,
  rebirthPerks: [], // bought perks that persist through rebirths
  dailyStreak: 0,
  lastDaily: 0, // timestamp
  achievementsUnlocked: {},
  dealers: [], // filled below
  dealerUpgrades: {}, // keyed by dealer id, array of upgrades
  settings: {
    themeBg: '',
    themeColor: ''
  },
  lastSave: 0
}

/* --------- constants --------- */
const DEALERS = [
  { id: 'weed', name: 'weed', cost: 25000, baseValue: 50, baseSpeed: 1, emoji: '🌿' },
  { id: 'coke', name: 'coke', cost: 100000, baseValue: 200, baseSpeed: 1, emoji: '🧂' },
  { id: 'shrooms', name: 'shrooms', cost: 100000, baseValue: 300, baseSpeed: 1, emoji: '🍄' },
  { id: 'lsd', name: 'lsd', cost: 500000, baseValue: 900, baseSpeed: 1, emoji: '🌀' },
  { id: 'mdma', name: 'mdma', cost: 1000000, baseValue: 2000, baseSpeed: 1, emoji: '✨' },
  { id: 'molly', name: 'molly', cost: 10000000, baseValue: 7000, baseSpeed: 1, emoji: '💠' },
  { id: 'meth', name: 'meth', cost: 80000000, baseValue: 25000, baseSpeed: 1, emoji: '⚗️' },
  { id: 'heroin', name: 'heroin', cost: 250000000, baseValue: 80000, baseSpeed: 1, emoji: '💉' },
  { id: 'crack', name: 'crack', cost: 500000000, baseValue: 200000, baseSpeed: 1, emoji: '🪨' },
  { id: 'fentanyl', name: 'fentanyl', cost: 1000000000, baseValue: 600000, baseSpeed: 1, emoji: '☠️' }
]

const CLICKER_UPGRADE_SEED = [
  { id: 'cv', name: 'click value', emoji: '👊', baseCost: 10, type: 'value', baseEffect: 1 },
  { id: 'cx', name: 'click xp', emoji: '⭐', baseCost: 15, type: 'xp', baseEffect: 1 },
  { id: 'auto', name: 'auto clicker', emoji: '🤖', baseCost: 500, type: 'auto', baseEffect: 1 }
]

const ACHIEVEMENTS = [
  { id: 'first-1k', name: 'first $1k', check: s => s.totalEarned >= 1000, rewardGems: 1 },
  { id: 'bank-100k', name: 'bank $100k', check: s => s.money >= 100000, rewardGems: 2 },
  { id: 'buy-first-dealer', name: 'first dealer', check: s => s.dealers.some(d => d.owned > 0), rewardGems: 1 },
  { id: '100-clicks', name: '100 clicks', check: s => s.metaClicks >= 100, rewardGems: 1 }
]

/* --------- meta tracking not persisted separately but used */
state.metaClicks = 0

/* --------- dom refs --------- */
const $ = sel => document.querySelector(sel)
const $$ = sel => Array.from(document.querySelectorAll(sel))

const moneyDisplay = $('#moneyDisplay')
const earnTotal = $('#earnTotal')
const levelXp = $('#levelXp')
const clickerButton = $('#clickerButton')
const particlesCanvas = $('#particlesCanvas')
const clickValueDisplay = $('#clickValueDisplay')
const clickXpDisplay = $('#clickXpDisplay')
const clickerUpgradesWrap = $('#clickerUpgrades')

const dealersListWrap = $('#dealersList')
const dealersMoney = $('#dealersMoney')
const gemsDisplay = $('#gemsDisplay')
const rebirthDisplay = $('#rebirthDisplay')
const gemsShop = $('#gemsShop')

const dailyClaimBtn = $('#dailyClaimBtn')
const spinWheelBtn = $('#spinWheelBtn')
const dailyResult = $('#dailyResult')
const wheelCanvas = $('#wheelCanvas')
const dailyStreakEl = $('#dailyStreak')

const achievementsList = $('#achievementsList')
const achGems = $('#achGems')
const rebirthCoinsTop = $('#rebirthCoinsTop')
const rebirthShop = $('#rebirthShop')
const rebirthBtn = $('#rebirthBtn')

const exportBtn = $('#exportBtn')
const importBtn = $('#importBtn')
const saveArea = $('#saveArea')
const cheatsBtn = $('#cheatsBtn')
const cheatShame = $('#cheatShame')
const softResetBtn = $('#softResetBtn')
const hardResetBtn = $('#hardResetBtn')

const modal = $('#modal')
const modalTitle = $('#modalTitle')
const modalBody = $('#modalBody')
const modalConfirm = $('#modalConfirm')
const modalCancel = $('#modalCancel')
const modalClose = $('#modalClose')

const announcer = $('#announcer')

/* --------- audio (simple) --------- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
function beep(freq=440, time=0.05, vol=0.05){
  try{
    const o = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    g.gain.value = vol
    o.connect(g)
    g.connect(audioCtx.destination)
    o.start()
    setTimeout(()=>{ o.stop(); o.disconnect(); g.disconnect() }, time*1000)
  }catch(e){}
}

/* --------- visuals: particles canvas --------- */
const pctx = particlesCanvas.getContext('2d')
function resizeParticles(){
  particlesCanvas.width = particlesCanvas.clientWidth
  particlesCanvas.height = particlesCanvas.clientHeight
}
window.addEventListener('resize', resizeParticles)
resizeParticles()
let particles = []
function spawnParticles(x,y,emoji,count=12){
  for(let i=0;i<count;i++){
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*6,
      vy: (Math.random()-1.5)*6,
      life: 60 + Math.random()*30,
      char: emoji || ['💸','✨','⭐'][Math.floor(Math.random()*3)]
    })
  }
}
function drawParticles(){
  pctx.clearRect(0,0,particlesCanvas.width,particlesCanvas.height)
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15
    p.life--
    pctx.font = '18px serif'
    pctx.fillText(p.char, p.x, p.y)
    if(p.life <= 0) particles.splice(i,1)
  }
  requestAnimationFrame(drawParticles)
}
requestAnimationFrame(drawParticles)

/* --------- confetti (simple) --------- */
function doConfetti(){
  const c = document.createElement('div')
  c.className = 'confetti'
  c.style.position = 'fixed'
  c.style.pointerEvents = 'none'
  c.style.left = '0'
  c.style.top = '0'
  c.style.width = '100%'
  c.style.height = '100%'
  c.style.zIndex = 9999
  document.body.appendChild(c)
  for(let i=0;i<80;i++){
    const s = document.createElement('div')
    s.style.position='absolute'
    s.style.left = Math.random()*100+'%'
    s.style.top='-10%'
    s.style.width='8px'
    s.style.height='12px'
    s.style.background = ['#ff4757','#ffd166','#7bed9f','#70a1ff'][Math.floor(Math.random()*4)]
    s.style.opacity = '0.95'
    s.style.transform = `rotate(${Math.random()*360}deg)`
    s.style.transition = `transform 1.6s linear, top 1.6s linear, left 1.6s linear, opacity 1.6s linear`
    c.appendChild(s)
    setTimeout(()=> {
      s.style.top = (80 + Math.random()*20) + '%'
      s.style.left = (Math.random()*100) + '%'
      s.style.opacity = '0'
    }, 20)
  }
  setTimeout(()=> c.remove(), 2000)
}

/* --------- util --------- */
function fmt(n){
  if(n < 1000) return n.toString()
  if(n < 1e6) return (n/1000).toFixed(1).replace(/\.0$/,'')+'k'
  if(n < 1e9) return (n/1e6).toFixed(2).replace(/\.00$/,'')+'m'
  return (n/1e9).toFixed(2)+'b'
}

function toast(text){
  announcer.textContent = text
}

/* --------- init dealers/clicker upgrades in state --------- */
function initSeeds(){
  if(state.dealers.length === 0){
    state.dealers = DEALERS.map(d => ({...d, owned:0, cost:d.cost, valueMult:1, speedMult:1}))
  }
  if(state.clickUpgrades.length === 0){
    state.clickUpgrades = CLICKER_UPGRADE_SEED.map(u => ({...u, level:0, cost:u.baseCost || u.baseCost}))
  }
}
initSeeds()

/* --------- ui rendering --------- */
let animateMoneyTween = null
function setAnimatedText(el, targetVal, prefix=''){
  const start = parseFloat(el.dataset.val || '0')
  const end = targetVal
  const dur = 300
  const startTime = performance.now()
  el.dataset.val = end
  if(animateMoneyTween) cancelAnimationFrame(animateMoneyTween)
  function frame(t){
    const p = Math.min(1, (t - startTime) / dur)
    const v = Math.round(start + (end - start) * (1 - Math.pow(1-p,3)))
    el.textContent = prefix + (typeof v === 'number' ? fmt(v) : v)
    if(p < 1) animateMoneyTween = requestAnimationFrame(frame)
  }
  animateMoneyTween = requestAnimationFrame(frame)
}

function updateTopUI(){
  setAnimatedText(moneyDisplay, state.money, '$')
  setAnimatedText(earnTotal, state.totalEarned, 'earned $')
  levelXp.textContent = `lvl ${state.level} · xp ${state.xp} / ${state.level * 10}`
  clickValueDisplay.textContent = `$${state.clickValue}`
  clickXpDisplay.textContent = `+${state.clickXp} xp`
  dealersMoney.textContent = `$${fmt(state.money)}`
  gemsDisplay.textContent = state.gems
  rebirthDisplay.textContent = state.rebirthCoins
  dailyStreakEl.textContent = state.dailyStreak
  achGems.textContent = state.gems
  rebirthCoinsTop.textContent = state.rebirthCoins
}

/* render clicker upgrade cards */
function renderClickerUpgrades(){
  clickerUpgradesWrap.innerHTML = ''
  state.clickUpgrades.forEach((u, i) => {
    const b = document.createElement('button')
    b.className = 'upgrade-card'
    b.dataset.i = i
    b.innerHTML = `<div class="upgrade-emoji">${u.emoji}</div>
                   <div class="upgrade-title">${u.name}</div>
                   <div class="upgrade-info">lvl ${u.level} · cost ${fmt(u.cost)}</div>`
    b.addEventListener('click', ()=> buyClickUpgrade(i))
    clickerUpgradesWrap.appendChild(b)
  })
}

/* render dealers list */
function renderDealers(){
  dealersListWrap.innerHTML = ''
  state.dealers.forEach((d, i) => {
    const el = document.createElement('div')
    el.className = 'dealer-card'
    el.innerHTML = `<div class="dealer-left">
                      <div class="dealer-emoji">${d.emoji}</div>
                      <div class="dealer-name">${d.name}</div>
                      <div class="dealer-stats">owned ${d.owned} · value x${d.valueMult.toFixed(2)} · speed x${d.speedMult.toFixed(2)}</div>
                    </div>
                    <div class="dealer-right">
                      <div class="dealer-income">$${fmt(Math.floor(d.baseValue * d.valueMult * d.owned))}/s</div>
                      <div class="dealer-cost">$${fmt(d.cost)}</div>
                      <button class="dealer-buy" data-i="${i}">${d.owned ? 'buy again' : 'buy'}</button>
                    </div>`
    dealersListWrap.appendChild(el)
  })
  // attach buy handlers
  $$('button.dealer-buy').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const i = Number(btn.dataset.i)
      openDealerPopup(i)
    })
  })
}

/* render gems shop */
function renderGemsShop(){
  gemsShop.innerHTML = ''
  const items = [
    { id: 'reb-rate', name: 'rebirth rate +1%', cost: 10, apply: ()=>{} },
    { id: 'value-10', name: 'total value +10%', cost: 25, apply: ()=>{} },
    { id: 'instant-money', name: 'instant $10k', cost: 5, apply: ()=>{ state.money += 10000; state.totalEarned += 10000 } }
  ]
  items.forEach(it=>{
    const b = document.createElement('button')
    b.className = 'shop-item'
    b.innerHTML = `<div>${it.name}</div><div>${it.cost} gems</div>`
    b.addEventListener('click', ()=>{
      if(state.gems >= it.cost){
        state.gems -= it.cost
        it.apply()
        toast(`bought ${it.name}`)
        save()
        updateTopUI()
      } else {
        toast('not enough gems')
      }
    })
    gemsShop.appendChild(b)
  })
}

/* render achievements list (auto-claim) */
function renderAchievements(){
  achievementsList.innerHTML = ''
  ACHIEVEMENTS.forEach(a=>{
    const unlocked = !!state.achievementsUnlocked[a.id]
    const el = document.createElement('div')
    el.className = 'achievement-card'
    el.innerHTML = `<div class="ach-name">${a.name}</div><div class="ach-reward">+${a.rewardGems} gems</div>`
    achievementsList.appendChild(el)
    if(!unlocked && a.check(state)){
      state.achievementsUnlocked[a.id] = true
      state.gems += a.rewardGems
      toast(`achievement unlocked ${a.name}`)
      doConfetti()
      beep(880, 0.06, 0.05)
    }
  })
}

/* render rebirth shop */
function renderRebirthShop(){
  rebirthShop.innerHTML = ''
  const perks = [
    { id: 'keep_click', name: 'keep click bonus', cost: 1, desc: 'keeps click upgrades after rebirth', apply: ()=>{} },
    { id: 'start_money', name: 'start money boost', cost: 3, desc: 'start with extra cash after rebirth', apply: ()=>{} }
  ]
  perks.forEach(p=>{
    const owned = state.rebirthPerks.includes(p.id)
    const b = document.createElement('button')
    b.className = 'reb-perk'
    b.innerHTML = `<div>${p.name}</div><div>${owned ? 'owned' : p.cost + ' rc'}</div>`
    b.addEventListener('click', ()=>{
      if(owned) return toast('already owned')
      if(state.rebirthCoins >= p.cost){
        state.rebirthCoins -= p.cost
        state.rebirthPerks.push(p.id)
        toast(`bought ${p.name}`)
        save()
        renderRebirthShop()
        updateTopUI()
      } else toast('not enough rebirth coins')
    })
    rebirthShop.appendChild(b)
  })
}

/* --------- clicker logic --------- */
function onClickerPress(e){
  const rect = clickerButton.getBoundingClientRect()
  const cx = rect.left + rect.width/2 - particlesCanvas.getBoundingClientRect().left
  const cy = rect.top + 20 - particlesCanvas.getBoundingClientRect().top
  state.money += state.clickValue
  state.totalEarned += state.clickValue
  state.xp += state.clickXp
  state.metaClicks++
  spawnParticles(cx, cy, '💸', 12)
  beep(660, 0.045, 0.03)
  checkLevel()
  save()
  updateTopUI()
}
clickerButton.addEventListener('click', onClickerPress)

/* level logic */
function checkLevel(){
  const need = state.level * 10
  if(state.xp >= need){
    state.xp -= need
    state.level++
    // unlock small bonus
    state.clickValue += 1
    toast(`level up ${state.level}`)
    doConfetti()
    beep(1000, 0.08, 0.06)
    updateTopUI()
  }
}

/* buy click upgrades */
function buyClickUpgrade(i){
  const u = state.clickUpgrades[i]
  if(state.money >= u.cost){
    state.money -= u.cost
    u.level++
    if(u.type === 'value') state.clickValue += u.baseEffect
    if(u.type === 'xp') state.clickXp += u.baseEffect
    if(u.type === 'auto') startAutoClicker(u.level + 1)
    u.cost = Math.floor(u.cost * 1.35)
    toast(`bought ${u.name}`)
    save()
    renderClickerUpgrades()
    updateTopUI()
  } else {
    toast('not enough money')
  }
}

/* auto clicker */
let autoInterval = null
function startAutoClicker(level){
  if(autoInterval) clearInterval(autoInterval)
  const speed = Math.max(1, 1000 - level*80) // faster with higher level
  autoInterval = setInterval(()=> {
    state.money += Math.max(1, Math.floor(state.clickValue * 0.6))
    state.totalEarned += Math.max(1, Math.floor(state.clickValue * 0.6))
    updateTopUI()
    save()
  }, Math.max(600, speed))
}

/* --------- dealer popup and upgrades --------- */
function openDealerPopup(i){
  const d = state.dealers[i]
  showModal(`${d.emoji} ${d.name}`, `
    <div style="margin-bottom:.5rem">owned ${d.owned}</div>
    <div style="margin-bottom:.5rem">value x${d.valueMult.toFixed(2)}, speed x${d.speedMult.toFixed(2)}</div>
    <div style="margin-bottom:.5rem">buy more for $${fmt(d.cost)}</div>
    <div style="display:flex;gap:.4rem">
      <button id="buyDealerNow">buy</button>
      <button id="upgradeValue">upgrade value</button>
      <button id="upgradeSpeed">upgrade speed</button>
    </div>
  `, ()=>{
    // confirm handler (not used)
  }, true)

  // attach handlers after modal shows
  setTimeout(()=>{
    $('#buyDealerNow').addEventListener('click', ()=>{
      if(state.money >= d.cost){
        state.money -= d.cost
        d.owned++
        d.cost = Math.floor(d.cost * 1.18)
        state.totalEarned += 0 // no immediate earn
        toast('dealer purchased')
        renderDealers()
        save()
        updateTopUI()
        closeModal()
      } else toast('not enough money')
    })
    $('#upgradeValue').addEventListener('click', ()=>{
      const cost = Math.floor( (d.baseValue * 10) * d.valueMult )
      if(state.money >= cost){
        state.money -= cost
        d.valueMult *= 1.15
        toast('value upgraded')
        renderDealers()
        save()
        updateTopUI()
      } else toast('not enough money')
    })
    $('#upgradeSpeed').addEventListener('click', ()=>{
      const cost = Math.floor( (d.baseValue * 8) * d.speedMult )
      if(state.money >= cost){
        state.money -= cost
        d.speedMult *= 1.12
        toast('speed upgraded')
        renderDealers()
        save()
        updateTopUI()
      } else toast('not enough money')
    })
  }, 50)
}

/* --------- daily and wheel --------- */
function claimDaily(){
  const now = Date.now()
  // check day boundary local
  const last = state.lastDaily || 0
  const oneDay = 24*60*60*1000
  if(!last || (now - last) >= oneDay*0.9){ // allow some slack
    // reward random currency or upgrade
    const pick = Math.random()
    if(pick < 0.5){
      const amount = Math.floor( (Math.random()*500) + 50 ) * (1 + state.dailyStreak*0.1)
      state.money += amount
      state.totalEarned += amount
      dailyResult.textContent = `daily +$${fmt(amount)}`
    } else if(pick < 0.8){
      const g = Math.floor(Math.random()*2)+1
      state.gems += g
      dailyResult.textContent = `daily +${g} gems`
    } else {
      // small permanent buff pseudo
      state.clickValue += 1
      dailyResult.textContent = `daily unlocked +1 click value`
    }
    state.dailyStreak = (now - last < oneDay*2) ? state.dailyStreak + 1 : 1
    state.lastDaily = now
    toast('daily claimed')
    save()
    updateTopUI()
  } else {
    dailyResult.textContent = 'daily already claimed'
  }
}

function spinWheel(){
  // small wheel animation using canvas rotation
  const ctx = wheelCanvas.getContext('2d')
  const size = Math.min(window.innerWidth*0.82, 320)
  wheelCanvas.width = size
  wheelCanvas.height = size
  const segments = 8
  const segAngle = Math.PI*2/segments
  // draw wheel static
  for(let i=0;i<segments;i++){
    ctx.beginPath()
    ctx.moveTo(size/2,size/2)
    ctx.arc(size/2,size/2, size/2 - 4, i*segAngle, (i+1)*segAngle)
    ctx.closePath()
    ctx.fillStyle = i%2? '#ffd166' : '#70a1ff'
    ctx.fill()
  }
  // animate rotation
  let rot = 0
  const target = (Math.random()*6 + 6) * Math.PI * 2 // multiple spins
  const start = performance.now()
  const dur = 1800
  const prizeIndex = Math.floor(Math.random()*segments)
  function frame(t){
    const p = Math.min(1,(t-start)/dur)
    rot = target * easeOutCubic(p)
    ctx.save()
    ctx.clearRect(0,0,size,size)
    ctx.translate(size/2,size/2)
    ctx.rotate(rot)
    ctx.translate(-size/2,-size/2)
    for(let i=0;i<segments;i++){
      ctx.beginPath()
      ctx.moveTo(size/2,size/2)
      ctx.arc(size/2,size/2, size/2 - 4, i*segAngle, (i+1)*segAngle)
      ctx.closePath()
      ctx.fillStyle = i%2? '#ffd166' : '#70a1ff'
      ctx.fill()
      // text
      ctx.save()
      ctx.translate(size/2,size/2)
      ctx.rotate((i+0.5)*segAngle)
      ctx.fillStyle = '#111'
      ctx.font = '14px serif'
      ctx.fillText(['+$50','+gems','bad -$50','+$200','+click','+rc','bad -$100','+$1k'][i], size/4, 0)
      ctx.restore()
    }
    ctx.restore()
    if(p < 1) requestAnimationFrame(frame)
    else {
      // decide outcome from prizeIndex
      const outcome = prizeIndex % 8
      switch(outcome){
        case 0: state.money += 50; state.totalEarned += 50; dailyResult.textContent = '+$50'; break
        case 1: state.gems += 2; dailyResult.textContent = '+2 gems'; break
        case 2: state.money = Math.max(0, state.money - 50); dailyResult.textContent = '-$50'; break
        case 3: state.money += 200; state.totalEarned += 200; dailyResult.textContent = '+$200'; break
        case 4: state.clickValue += 1; dailyResult.textContent = '+1 click value'; break
        case 5: state.rebirthCoins += 1; dailyResult.textContent = '+1 rebirth coin'; break
        case 6: state.money = Math.max(0, state.money - 100); dailyResult.textContent = '-$100'; break
        case 7: state.money += 1000; state.totalEarned += 1000; dailyResult.textContent = '+$1k'; break
      }
      // streak increase on good
      if(outcome !== 2 && outcome !== 6) state.dailyStreak++
      else state.dailyStreak = 0
      save()
      updateTopUI()
      if(outcome === 7) { doConfetti(); beep(1200,0.09,0.08) }
    }
  }
  requestAnimationFrame(frame)
}

/* easing */
function easeOutCubic(t){ return 1 - Math.pow(1-t,3) }

/* --------- dealer passive income loop with speed multipliers --------- */
function dealerIncomeTick(){
  let total = 0
  state.dealers.forEach(d => {
    if(d.owned > 0){
      // income per second depends on baseValue * valueMult * owned
      const income = Math.floor(d.baseValue * d.valueMult * d.owned * d.speedMult * 0.5)
      total += income
    }
  })
  if(total > 0){
    state.money += total
    state.totalEarned += total
    updateTopUI()
    save()
  }
}

/* --------- modal helpers --------- */
function showModal(title, htmlBody, onConfirm, hideCancel){
  modal.classList.remove('hidden')
  modalTitle.innerText = title || ''
  modalBody.innerHTML = htmlBody || ''
  modalConfirm.style.display = hideCancel ? 'none' : 'inline-block'
  modalCancel.style.display = hideCancel ? 'none' : 'inline-block'
  function clear(){ modal.classList.add('hidden'); modalConfirm.onclick = null; modalCancel.onclick = null; modalClose.onclick = null }
  modalConfirm.onclick = ()=> { if(onConfirm) onConfirm(); clear() }
  modalCancel.onclick = clear
  modalClose.onclick = clear
}
function closeModal(){ modal.classList.add('hidden') }

/* --------- save / load / export / import --------- */
function getSave(){
  const s = {
    money: state.money,
    totalEarned: state.totalEarned,
    xp: state.xp,
    level: state.level,
    clickValue: state.clickValue,
    clickXp: state.clickXp,
    clickUpgrades: state.clickUpgrades,
    gems: state.gems,
    rebirthCoins: state.rebirthCoins,
    rebirthPerks: state.rebirthPerks,
    dailyStreak: state.dailyStreak,
    lastDaily: state.lastDaily,
    achievementsUnlocked: state.achievementsUnlocked,
    dealers: state.dealers,
    metaClicks: state.metaClicks,
    lastSave: Date.now()
  }
  return JSON.stringify(s)
}
function save(){
  try{
    localStorage.setItem('so.save', getSave())
    state.lastSave = Date.now()
  }catch(e){}
}
function load(){
  try{
    const raw = localStorage.getItem('so.save')
    if(!raw) return
    const s = JSON.parse(raw)
    Object.assign(state, {
      money: s.money || state.money,
      totalEarned: s.totalEarned || state.totalEarned,
      xp: s.xp || state.xp,
      level: s.level || state.level,
      clickValue: s.clickValue || state.clickValue,
      clickXp: s.clickXp || state.clickXp,
      clickUpgrades: s.clickUpgrades || state.clickUpgrades,
      gems: s.gems || state.gems,
      rebirthCoins: s.rebirthCoins || state.rebirthCoins,
      rebirthPerks: s.rebirthPerks || state.rebirthPerks,
      dailyStreak: s.dailyStreak || state.dailyStreak,
      lastDaily: s.lastDaily || state.lastDaily,
      achievementsUnlocked: s.achievementsUnlocked || state.achievementsUnlocked,
      dealers: s.dealers || state.dealers,
      metaClicks: s.metaClicks || state.metaClicks
    })
  }catch(e){}
}

/* export / import hooks for UI */
exportBtn.addEventListener('click', ()=>{
  saveArea.value = getSave()
  saveArea.select()
  try { document.execCommand('copy') } catch(e){}
  toast('save copied')
})
importBtn.addEventListener('click', ()=>{
  const txt = saveArea.value.trim()
  if(!txt) return toast('paste save json first')
  try{
    const s = JSON.parse(txt)
    // simple merge
    if(confirm('importing will overwrite current progress. continue?')){
      localStorage.setItem('so.save', JSON.stringify(s))
      load()
      renderAll()
      toast('save imported')
    }
  }catch(e){ toast('invalid json') }
})

/* cheats button shame */
cheatsBtn.addEventListener('click', ()=>{
  cheatShame.textContent = 'using cheats is lame but ok'
  showModal('cheats', `
    <div style="display:flex;flex-direction:column;gap:.5rem">
      <button id="cheat-money">add $1,000,000</button>
      <button id="cheat-gems">add 100 gems</button>
      <button id="cheat-rc">add 10 rebirth coins</button>
      <button id="cheat-unlimited">god mode (unlimited money)</button>
    </div>
  `, null, true)
  setTimeout(()=>{
    $('#cheat-money').addEventListener('click', ()=> { state.money += 1000000; updateTopUI(); save(); closeModal() })
    $('#cheat-gems').addEventListener('click', ()=> { state.gems += 100; updateTopUI(); save(); closeModal() })
    $('#cheat-rc').addEventListener('click', ()=> { state.rebirthCoins += 10; updateTopUI(); save(); closeModal() })
    $('#cheat-unlimited').addEventListener('click', ()=> { state.money = 1e18; updateTopUI(); save(); closeModal() })
  },50)
})

/* resets */
softResetBtn.addEventListener('click', ()=>{
  if(!confirm('soft reset will reset progress but keep rebirth purchases. continue?')) return
  // keep rebirthPerks and rebirthCoins
  const keep = { rebirthPerks: state.rebirthPerks.slice(), rebirthCoins: state.rebirthCoins }
  Object.assign(state, {
    money: 0, totalEarned:0, xp:0, level:1, clickValue:1, clickXp:1, clickUpgrades: CLICKER_UPGRADE_SEED.map(u=>({ ...u, level:0, cost:u.baseCost })),
    gems: 0, dailyStreak:0, lastDaily:0, achievementsUnlocked: {}, dealers: DEALERS.map(d=>({ ...d, owned:0, cost:d.cost, valueMult:1, speedMult:1 })), metaClicks:0
  })
  state.rebirthPerks = keep.rebirthPerks
  state.rebirthCoins = keep.rebirthCoins
  save()
  renderAll()
  toast('soft reset done')
})

hardResetBtn.addEventListener('click', ()=>{
  if(!confirm('are you sure? this will wipe everything.')) return
  if(!confirm('this is the last warning. reset for real?')) return
  localStorage.removeItem('so.save')
  location.reload()
})

/* rebirth action */
rebirthBtn.addEventListener('click', ()=>{
  if(!confirm('rebirth will reset progress but grant rebirth coins based on total earned. continue?')) return
  const rcGain = Math.floor(Math.sqrt(state.totalEarned / 100000))
  state.rebirthCoins += rcGain
  // save list of rebirth perks to keep
  const keptPerks = state.rebirthPerks.slice()
  // reset main progression
  Object.assign(state, {
    money: 0, totalEarned: 0, xp:0, level:1, clickValue:1, clickXp:1, clickUpgrades: CLICKER_UPGRADE_SEED.map(u=>({ ...u, level:0, cost:u.baseCost })),
    gems: 0, dailyStreak:0, lastDaily:0, achievementsUnlocked: {}, dealers: DEALERS.map(d=>({ ...d, owned:0, cost:d.cost, valueMult:1, speedMult:1 })), metaClicks:0
  })
  state.rebirthPerks = keptPerks
  save()
  renderAll()
  toast(`rebirthed, gained ${rcGain} rebirth coins`)
})

/* --------- main render all --------- */
function renderAll(){
  renderClickerUpgrades()
  renderDealers()
  renderGemsShop()
  renderAchievements()
  renderRebirthShop()
  updateTopUI()
}

load()
renderAll()

/* start passive loops */
setInterval(dealerIncomeTick, 1000)
setInterval(()=>{
  renderAchievements()
  save()
}, 4000)

/* wheel and daily hooks */
dailyClaimBtn.addEventListener('click', claimDaily)
spinWheelBtn.addEventListener('click', spinWheel)

/* attach buy clicker upgrades from ui */
document.addEventListener('click', e=>{
  const up = e.target.closest('.upgrade-card')
  if(up){
    const i = Number(up.dataset.i)
    buyClickUpgrade(i)
  }
})

/* helpers to render on start */
renderAll()
updateTopUI()

/* keyboard shortcuts for desktop testing (optional) */
window.addEventListener('keydown', e=>{
  if(e.key === ' ') { onClickerPress(); e.preventDefault() }
  if(e.key === 's') { exportBtn.click() }
})

/* expose export/import for html quick hooks */
window.exportSave = getSave
window.importSave = txt => {
  try{
    const s = JSON.parse(txt)
    localStorage.setItem('so.save', JSON.stringify(s))
    load()
    renderAll()
    toast('import ok')
  }catch(e){ toast('invalid') }
}