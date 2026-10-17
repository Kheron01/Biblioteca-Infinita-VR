import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/webxr/VRButton.js';

const statusEl = document.querySelector('#status');
const helpEl = document.querySelector('#help');
const toastEl = document.querySelector('#toast');
const vrRoot = document.querySelector('#vr-root');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080a10);
scene.fog = new THREE.FogExp2(0x080a10, 0.015);

const cameraRig = new THREE.Group();
scene.add(cameraRig);
const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 180);
camera.position.set(0, 1.65, 0);
cameraRig.add(camera);
cameraRig.position.set(0, 0, 3.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.insertBefore(renderer.domElement, document.querySelector('#hud'));
renderer.domElement.setAttribute('aria-label', 'Ambiente 3D da Biblioteca Infinita');

const vrButton = VRButton.createButton(renderer, { optionalFeatures: ['local-floor', 'bounded-floor'] });
vrRoot.appendChild(vrButton);
vrButton.textContent = 'ENTRAR EM VR';

scene.add(new THREE.HemisphereLight(0x9caccb, 0x21150f, 1.35));
const mainLight = new THREE.DirectionalLight(0xffdfab, 1.4);
mainLight.position.set(-3, 9, 4);
scene.add(mainLight);
const aisleLight = new THREE.PointLight(0xe6b76f, 22, 28, 2);
aisleLight.position.set(0, 3.5, -12);
scene.add(aisleLight);
const farLight = new THREE.PointLight(0x4c9f9d, 15, 24, 2);
farLight.position.set(0, 3.2, -31);
scene.add(farLight);

const mat = {
  floor: new THREE.MeshStandardMaterial({ color: 0x211b1c, roughness: 0.38, metalness: 0.16 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x33241e, roughness: 0.83, metalness: 0.02 }),
  woodEdge: new THREE.MeshStandardMaterial({ color: 0x60442b, roughness: 0.72, metalness: 0.05 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb78b46, roughness: 0.32, metalness: 0.65, emissive: 0x291704, emissiveIntensity: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x11131b, roughness: 0.58, metalness: 0.24 }),
  pedestal: new THREE.MeshStandardMaterial({ color: 0x29242a, roughness: 0.31, metalness: 0.4 }),
  bookCover: new THREE.MeshStandardMaterial({ color: 0xb58a4b, roughness: 0.55, metalness: 0.15, emissive: 0x33200b, emissiveIntensity: 0.8 }),
  page: new THREE.MeshStandardMaterial({ color: 0xe0d0a8, roughness: 0.95 }),
};

const floor = new THREE.Mesh(new THREE.PlaneGeometry(180, 190), mat.floor);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -0.04, -72);
scene.add(floor);

// Inset marble lines make the floor easier to read in VR without expensive textures.
const floorLines = new THREE.Group();
const lineMat = new THREE.MeshStandardMaterial({ color: 0x6e543b, roughness: 0.55, metalness: 0.35, emissive: 0x140b04, emissiveIntensity: 0.4 });
for (let x = -14; x <= 14; x += 3.5) {
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 170), lineMat);
  line.position.set(x, -0.012, -70);
  floorLines.add(line);
}
for (let z = 12; z >= -150; z -= 6) {
  const line = new THREE.Mesh(new THREE.BoxGeometry(38, 0.008, 0.018), lineMat);
  line.position.set(0, -0.01, z);
  floorLines.add(line);
}
scene.add(floorLines);

const bookColors = [0x6f2527, 0x233e3e, 0x283754, 0x72532d, 0x46304f, 0x7b6a4c, 0x263c2b, 0x9a793e, 0x5a252b, 0x39404b, 0x7d4936];
const bookGeometry = new THREE.BoxGeometry(1, 1, 1);
const boardGeometry = new THREE.BoxGeometry(0.58, 0.085, 2.28);
const uprightGeometry = new THREE.BoxGeometry(0.58, 4.55, 0.105);
const trimGeometry = new THREE.BoxGeometry(0.64, 0.075, 2.32);
const rowsX = [-10.0, -3.55, 3.55, 10.0];
const moduleLength = 18;
const moduleCount = 7;
const modules = [];
let seed = 72831;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

function makeModule(index) {
  const group = new THREE.Group();
  group.position.z = -9 - index * moduleLength;

  for (const rowX of rowsX) {
    const boardMatrices = [];
    const trimMatrices = [];
    const uprightMatrices = [];
    const bookEntries = [];
    const dummy = new THREE.Object3D();
    const bayCenters = [];
    for (let bay = 0; bay < 8; bay++) bayCenters.push(7.78 - bay * 2.22);

    for (const bayZ of bayCenters) {
      // Shelf boards and decorative front edges, six levels per bay.
      for (let level = 0; level < 6; level++) {
        const y = 0.58 + level * 0.69;
        dummy.position.set(rowX, y, bayZ);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix(); boardMatrices.push(dummy.matrix.clone());
        dummy.position.set(rowX, y + 0.05, bayZ);
        dummy.scale.set(1, 1, 1); dummy.updateMatrix(); trimMatrices.push(dummy.matrix.clone());

        for (const face of [-1, 1]) {
          let zOffset = -1.02;
          while (zOffset < 1.02) {
            const width = 0.085 + rand() * 0.105;
            const height = 0.36 + rand() * 0.25;
            const depth = 0.16 + rand() * 0.09;
            const z = bayZ + zOffset + width * 0.5;
            bookEntries.push({ x: rowX + face * 0.15, y: y + 0.085 + height * 0.5, z, width, height, depth, color: bookColors[Math.floor(rand() * bookColors.length)], lean: (rand() - 0.5) * 0.06 });
            zOffset += width + 0.012;
          }
        }
      }
      // Uprights frame the bays.
      for (const offset of [-1.12, 1.12]) {
        dummy.position.set(rowX, 2.28, bayZ + offset);
        dummy.scale.set(1, 1, 1); dummy.updateMatrix(); uprightMatrices.push(dummy.matrix.clone());
      }
    }

    const boards = new THREE.InstancedMesh(boardGeometry, mat.wood, boardMatrices.length);
    boardMatrices.forEach((m, i) => boards.setMatrixAt(i, m));
    boards.instanceMatrix.needsUpdate = true;
    boards.castShadow = false; boards.receiveShadow = true;
    group.add(boards);

    const trims = new THREE.InstancedMesh(trimGeometry, mat.woodEdge, trimMatrices.length);
    trimMatrices.forEach((m, i) => trims.setMatrixAt(i, m));
    trims.instanceMatrix.needsUpdate = true;
    group.add(trims);

    const uprights = new THREE.InstancedMesh(uprightGeometry, mat.wood, uprightMatrices.length);
    uprightMatrices.forEach((m, i) => uprights.setMatrixAt(i, m));
    uprights.instanceMatrix.needsUpdate = true;
    group.add(uprights);

    const books = new THREE.InstancedMesh(bookGeometry, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.76, metalness: 0.04 }), bookEntries.length);
    bookEntries.forEach((b, i) => {
      dummy.position.set(b.x, b.y, b.z);
      dummy.rotation.set(0, b.lean, 0);
      dummy.scale.set(b.depth, b.height, b.width);
      dummy.updateMatrix();
      books.setMatrixAt(i, dummy.matrix);
      books.setColorAt(i, new THREE.Color(b.color));
    });
    books.instanceMatrix.needsUpdate = true;
    if (books.instanceColor) books.instanceColor.needsUpdate = true;
    books.castShadow = false;
    group.add(books);
  }

  // A gilded arch marks each repeating hall segment.
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.28, 0.075, 7, 48, Math.PI), mat.gold);
  arch.position.set(0, 0.05, 8.72);
  group.add(arch);
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.23), mat.gold);
  leftFoot.position.set(-3.28, 0.18, 8.72); group.add(leftFoot);
  const rightFoot = leftFoot.clone(); rightFoot.position.x = 3.28; group.add(rightFoot);

  // Lanterns are emissive meshes; only the first two point lights illuminate the scene.
  for (const x of [-2.95, 2.95]) {
    const lantern = new THREE.Group();
    const cage = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.28, 0.18), mat.gold);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd99a }));
    lantern.add(cage, core);
    lantern.position.set(x, 3.15, 7.95);
    group.add(lantern);
  }

  scene.add(group);
  return group;
}

for (let i = 0; i < moduleCount; i++) modules.push(makeModule(i));

// The reading pedestal and enchanted book are a small first interaction.
const relic = new THREE.Group();
relic.position.set(1.55, 0, -5.3);
scene.add(relic);
const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.22, 12), mat.pedestal);
pedestalBase.position.y = 0.11; relic.add(pedestalBase);
const pedestalColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.39, 0.88, 10), mat.pedestal);
pedestalColumn.position.y = 0.65; relic.add(pedestalColumn);
const pedestalTop = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.12, 12), mat.gold);
pedestalTop.position.y = 1.15; relic.add(pedestalTop);
const book = new THREE.Group();
const cover = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.075, 0.47), mat.bookCover);
cover.position.y = 1.42; book.add(cover);
const pages = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.035, 0.41), mat.page);
pages.position.set(0, 1.462, 0); book.add(pages);
const coverL = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.035, 0.45), mat.bookCover);
coverL.position.set(-0.16, 1.49, 0); coverL.rotation.z = -0.18; book.add(coverL);
const coverR = coverL.clone(); coverR.position.x = 0.16; coverR.rotation.z = 0.18; book.add(coverR);
relic.add(book);
const runeRing = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.017, 6, 48), new THREE.MeshBasicMaterial({ color: 0x70d5c5 }));
runeRing.rotation.x = Math.PI / 2; runeRing.position.y = 1.62; relic.add(runeRing);
const relicGlow = new THREE.PointLight(0x5ccfbc, 9, 5, 2); relicGlow.position.set(0, 1.8, 0); relic.add(relicGlow);

// In-world confirmation panel: unlike the HTML toast, this is rendered in 3D
// and remains visible inside the Quest headset while an immersive session is active.
const messageCanvas = document.createElement('canvas');
messageCanvas.width = 1024;
messageCanvas.height = 360;
const messageContext = messageCanvas.getContext('2d');
const messageTexture = new THREE.CanvasTexture(messageCanvas);
messageTexture.colorSpace = THREE.SRGBColorSpace;
const worldMessage = new THREE.Sprite(new THREE.SpriteMaterial({
  map: messageTexture,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  opacity: 1,
}));
worldMessage.scale.set(2.55, 0.9, 1);
worldMessage.position.set(relic.position.x, 2.25, relic.position.z);
worldMessage.renderOrder = 10;
worldMessage.visible = false;
scene.add(worldMessage);
let worldMessageHideAt = 0;
let activeXRSession = null;

function setWorldMessage(title, body, duration = 4600) {
  const ctx = messageContext;
  ctx.clearRect(0, 0, messageCanvas.width, messageCanvas.height);
  const radius = 34;
  ctx.fillStyle = 'rgba(8, 10, 16, 0.94)';
  ctx.strokeStyle = 'rgba(217, 185, 120, 0.98)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(radius, 12);
  ctx.lineTo(messageCanvas.width - radius, 12);
  ctx.quadraticCurveTo(messageCanvas.width - 12, 12, messageCanvas.width - 12, radius);
  ctx.lineTo(messageCanvas.width - 12, messageCanvas.height - radius);
  ctx.quadraticCurveTo(messageCanvas.width - 12, messageCanvas.height - 12, messageCanvas.width - radius, messageCanvas.height - 12);
  ctx.lineTo(radius, messageCanvas.height - 12);
  ctx.quadraticCurveTo(12, messageCanvas.height - 12, 12, messageCanvas.height - radius);
  ctx.lineTo(12, radius);
  ctx.quadraticCurveTo(12, 12, radius, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e6c982';
  ctx.font = 'bold 38px Segoe UI, Arial, sans-serif';
  ctx.fillText(title, messageCanvas.width / 2, 100, messageCanvas.width - 90);
  ctx.fillStyle = '#f4eee2';
  ctx.font = '30px Segoe UI, Arial, sans-serif';
  ctx.fillText(body, messageCanvas.width / 2, 188, messageCanvas.width - 90);
  ctx.fillStyle = 'rgba(217, 185, 120, 0.75)';
  ctx.fillRect(270, 250, 484, 2);
  ctx.fillStyle = '#bdb6aa';
  ctx.font = '22px Segoe UI, Arial, sans-serif';
  ctx.fillText('PALÁCIO DAS MEMÓRIAS', messageCanvas.width / 2, 294, messageCanvas.width - 90);
  messageTexture.needsUpdate = true;
  worldMessage.position.set(relic.position.x, 2.25, relic.position.z);
  worldMessage.visible = true;
  worldMessageHideAt = performance.now() + duration;
}

// A readable in-world book spread: the content is rendered onto a canvas texture
// so it remains visible in both desktop mode and the immersive Quest browser.
const bookPages = [
  {
    leftTitle: 'O primeiro corredor',
    leftText: 'A biblioteca não possui uma entrada única. Toda porta abre para uma estante, e toda estante parece guardar a sombra de outra.',
    rightTitle: 'A regra do infinito',
    rightText: 'Aqui, a distância não é medida apenas em passos. Cada descoberta pode revelar um novo caminho. Não tenha pressa: observe os sinais dourados.'
  },
  {
    leftTitle: 'O que os livros guardam',
    leftText: 'Alguns volumes preservam fatos. Outros guardam perguntas que ninguém teve coragem de fazer. Nem todas as páginas precisam ser lidas de uma vez.',
    rightTitle: 'O bibliotecário',
    rightText: 'Quem chega deve tratar cada memória com cuidado. O conhecimento não é apenas aquilo que se recorda, mas aquilo que se escolhe compreender.'
  },
  {
    leftTitle: 'O próximo salão',
    leftText: 'Ao atravessar o arco seguinte, procure a luz azul. Ela indica uma passagem para setores ainda não catalogados.',
    rightTitle: 'Fim do registro',
    rightText: 'Estas são as primeiras páginas do Palácio das Memórias. O livro voltará a abrir quando você estiver pronto para continuar.'
  }
];

const bookPageCanvas = document.createElement('canvas');
bookPageCanvas.width = 1400;
bookPageCanvas.height = 720;
const bookPageContext = bookPageCanvas.getContext('2d');
const bookPageTexture = new THREE.CanvasTexture(bookPageCanvas);
bookPageTexture.colorSpace = THREE.SRGBColorSpace;
const bookPagePanel = new THREE.Sprite(new THREE.SpriteMaterial({
  map: bookPageTexture,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  opacity: 1,
}));
bookPagePanel.scale.set(2.75, 1.42, 1);
bookPagePanel.position.set(relic.position.x, 2.25, relic.position.z);
bookPagePanel.renderOrder = 11;
bookPagePanel.visible = false;
scene.add(bookPagePanel);
let isBookOpen = false;
let bookPageIndex = 0;

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 8) {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(line, x, y);
}

function drawBookSpread(pageIndex) {
  const ctx = bookPageContext;
  const w = bookPageCanvas.width;
  const h = bookPageCanvas.height;
  const page = bookPages[pageIndex];
  ctx.clearRect(0, 0, w, h);

  // Dark leather frame with a restrained gold border.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.98)';
  ctx.fillRect(8, 8, w - 16, h - 16);
  ctx.strokeStyle = '#d9b978';
  ctx.lineWidth = 7;
  ctx.strokeRect(12, 12, w - 24, h - 24);

  // Two parchment pages.
  const left = { x: 36, y: 36, w: 650, h: 648 };
  const right = { x: 714, y: 36, w: 650, h: 648 };
  for (const p of [left, right]) {
    ctx.fillStyle = '#e9dec2';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#ab8e5e';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 8, p.y + 8, p.w - 16, p.h - 16);
  }

  ctx.fillStyle = '#8d6b39';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(`PALÁCIO DAS MEMÓRIAS · REGISTRO ${String(pageIndex + 1).padStart(2, '0')}`, left.x + 34, 90);
  ctx.textAlign = 'right';
  ctx.fillText('ARQUIVO VIVO', right.x + right.w - 34, 90);

  ctx.strokeStyle = '#b79a69';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(left.x + 34, 112); ctx.lineTo(left.x + left.w - 34, 112); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(right.x + 34, 112); ctx.lineTo(right.x + right.w - 34, 112); ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#33291d';
  ctx.font = 'bold 34px Georgia, serif';
  wrapCanvasText(ctx, page.leftTitle, left.x + 34, 168, left.w - 68, 40, 2);
  ctx.font = '27px Georgia, serif';
  wrapCanvasText(ctx, page.leftText, left.x + 34, 232, left.w - 76, 42, 8);

  ctx.fillStyle = '#33291d';
  ctx.font = 'bold 34px Georgia, serif';
  wrapCanvasText(ctx, page.rightTitle, right.x + 34, 168, right.w - 68, 40, 2);
  ctx.font = '27px Georgia, serif';
  wrapCanvasText(ctx, page.rightText, right.x + 34, 232, right.w - 76, 42, 8);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#8d6b39';
  ctx.font = 'bold 19px Segoe UI, Arial, sans-serif';
  ctx.fillText('PRESSIONE O GATILHO (VR) OU E (PC) PARA AVANÇAR', w / 2, 654);
  bookPageTexture.needsUpdate = true;
}

function showBookPage(index) {
  bookPageIndex = index;
  drawBookSpread(bookPageIndex);
  worldMessage.visible = false;
  bookPagePanel.position.set(relic.position.x, 2.25, relic.position.z);
  bookPagePanel.visible = true;
}

// A gentle cloud of dust motes adds depth. Points are cheaper than thousands of individual meshes.
const dustCount = 1500;
const dustPositions = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (rand() - 0.5) * 22;
  dustPositions[i * 3 + 1] = rand() * 5.8 + 0.15;
  dustPositions[i * 3 + 2] = 8 - rand() * 165;
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xcdbd96, size: 0.026, transparent: true, opacity: 0.52, depthWrite: false, sizeAttenuation: true }));
scene.add(dust);

const keys = new Set();
let pointerLocked = false;
let pitch = 0;
let lastPlayerZ = cameraRig.position.z;
let lastInteract = 0;
let toastTimeout = 0;
const moveForward = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveTemp = new THREE.Vector3();
const cameraWorldDir = new THREE.Vector3();
const clock = new THREE.Clock();

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3600);
}

function wrapModules() {
  const z = cameraRig.position.z;
  if (z < lastPlayerZ - 0.0001) {
    // Moving deeper into the library: recycle modules that are far behind us.
    let farthest = Math.min(...modules.map(m => m.position.z));
    for (const module of modules) {
      if (module.position.z > z + moduleLength) {
        module.position.z = farthest - moduleLength;
        farthest = module.position.z;
      }
    }
  } else if (z > lastPlayerZ + 0.0001) {
    // The same loop works when walking back toward the entrance.
    let nearest = Math.max(...modules.map(m => m.position.z));
    for (const module of modules) {
      if (module.position.z < z - moduleLength) {
        module.position.z = nearest + moduleLength;
        nearest = module.position.z;
      }
    }
  }
  lastPlayerZ = z;
}

function interact() {
  const distance = Math.hypot(cameraRig.position.x - relic.position.x, cameraRig.position.z - relic.position.z);
  const now = performance.now();
  if (distance < 2.8 && now - lastInteract > 950) {
    lastInteract = now;
    if (!isBookOpen) {
      isBookOpen = true;
      showBookPage(0);
      showToast('O livro se abriu. Interaja novamente para virar a página.');
      book.rotation.y += Math.PI * 0.35;
      runeRing.material.color.setHex(0xffd78a);
      setTimeout(() => runeRing.material.color.setHex(0x70d5c5), 1200);
    } else if (bookPageIndex < bookPages.length - 1) {
      showBookPage(bookPageIndex + 1);
      showToast(`Registro ${bookPageIndex + 1} de ${bookPages.length}.`);
    } else {
      isBookOpen = false;
      bookPagePanel.visible = false;
      showToast('Leitura concluída. O livro aguarda sua próxima visita.');
      setWorldMessage('LEITURA CONCLUÍDA', 'O livro aguarda sua próxima visita.', 3400);
    }
  } else if (distance >= 2.8) {
    showToast('Aproxime-se do livro dourado no pedestal para examiná-lo.');
    setWorldMessage('O LIVRO DAS MEMÓRIAS', 'Aproxime-se para despertar suas páginas.', 2600);
  }
}

renderer.domElement.addEventListener('click', () => {
  if (!renderer.xr.isPresenting && !pointerLocked) renderer.domElement.requestPointerLock?.();
});
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
  statusEl.textContent = renderer.xr.isPresenting ? 'Realidade virtual ativa' : (pointerLocked ? 'Exploração ativa' : 'Modo computador');
});
document.addEventListener('mousemove', (event) => {
  if (!pointerLocked || renderer.xr.isPresenting) return;
  const sensitivity = 0.0021;
  cameraRig.rotation.y -= event.movementX * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * sensitivity, -1.35, 1.35);
  camera.rotation.x = pitch;
});
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.code === 'KeyE' && !event.repeat) interact();
  if (event.code === 'KeyH' && !event.repeat) helpEl.hidden = !helpEl.hidden;
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => keys.clear());

function onXRSelect() {
  if (renderer.xr.isPresenting) interact();
}

renderer.xr.addEventListener('sessionstart', () => {
  activeXRSession = renderer.xr.getSession();
  activeXRSession?.addEventListener('select', onXRSelect);
  camera.position.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);
  statusEl.textContent = 'Realidade virtual ativa';
  helpEl.innerHTML = '<strong>Exploração em VR</strong><div class="row"><span>Use o analógico esquerdo para andar; mova a cabeça naturalmente para olhar ao redor.</span></div><div class="row"><span>Aproxime-se do livro dourado. Pressione o gatilho para abrir e avançar as páginas.</span></div><div class="row"><span>Use o botão de sair do sistema para encerrar a sessão VR.</span></div>';
  showToast('Bem-vindo ao Palácio das Memórias. Caminhe com calma e mantenha a área livre.');
});
renderer.xr.addEventListener('sessionend', () => {
  activeXRSession?.removeEventListener('select', onXRSelect);
  activeXRSession = null;
  worldMessage.visible = false;
  bookPagePanel.visible = false;
  isBookOpen = false;
  camera.position.set(0, 1.65, 0);
  camera.rotation.set(pitch, 0, 0);
  statusEl.textContent = pointerLocked ? 'Exploração ativa' : 'Modo computador';
  helpEl.innerHTML = '<strong>Como explorar</strong><div class="row"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Andar pelos corredores</span></div><div class="row"><kbd>Mouse</kbd><span>Olhar ao redor · clique na cena para capturar o mouse</span></div><div class="row"><kbd>Shift</kbd><span>Andar um pouco mais rápido</span></div><div class="row"><kbd>E</kbd><span>Ler o livro dourado quando estiver perto</span></div><div class="row"><kbd>Esc</kbd><span>Liberar o mouse</span></div>';
});

function updateDesktopMovement(dt) {
  if (renderer.xr.isPresenting) return;
  let x = 0, z = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (x === 0 && z === 0) return;
  moveTemp.set(x, 0, z).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraRig.rotation.y);
  const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight')) ? 5.0 : 2.5;
  cameraRig.position.addScaledVector(moveTemp, speed * dt);
}

function updateVRMovement(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  const xrCamera = renderer.xr.getCamera(camera);
  xrCamera.getWorldDirection(cameraWorldDir);
  cameraWorldDir.y = 0;
  if (cameraWorldDir.lengthSq() < 0.0001) return;
  cameraWorldDir.normalize();
  moveRight.set(-cameraWorldDir.z, 0, cameraWorldDir.x).normalize();
  const speed = 2.0;
  for (const source of session.inputSources) {
    const gamepad = source.gamepad;
    if (!gamepad) continue;
    const axes = gamepad.axes;
    const axisX = axes.length >= 4 ? axes[2] : (axes[0] || 0);
    const axisY = axes.length >= 4 ? axes[3] : (axes[1] || 0);
    if (source.handedness === 'left') {
      if (Math.abs(axisX) > 0.12) cameraRig.position.addScaledVector(moveRight, axisX * speed * dt);
      if (Math.abs(axisY) > 0.12) cameraRig.position.addScaledVector(cameraWorldDir, -axisY * speed * dt);
    }
  }
}

function animate() {
  const dt = Math.min(clock.getDelta(), 0.04);
  updateDesktopMovement(dt);
  updateVRMovement(dt);
  wrapModules();
  floor.position.z = cameraRig.position.z - 68;
  floorLines.position.z = cameraRig.position.z - 3.5;
  if (worldMessage.visible && performance.now() > worldMessageHideAt) worldMessage.visible = false;
  if (relic) {
    const t = performance.now() * 0.001;
    book.position.y = Math.sin(t * 1.35) * 0.035;
    runeRing.rotation.z = t * 0.18;
    runeRing.material.opacity = 0.86 + Math.sin(t * 2) * 0.12;
  }
  dust.rotation.y += dt * 0.003;
  aisleLight.intensity = 20 + Math.sin(performance.now() * 0.0017) * 2.0;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
});

if (!('xr' in navigator)) {
  vrButton.disabled = true;
  vrButton.textContent = 'VR NÃO DETECTADO';
  showToast('O WebXR não está disponível neste navegador. No computador, explore com WASD e mouse.');
}
