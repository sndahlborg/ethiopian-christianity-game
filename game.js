// ============================================================
// REFORMERS QUEST --Ethiopian Christianity & the Reformation
// A Pokemon Kanto-style educational adventure
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

//  Global State 
const TILE = 32;
const COLS = 25;
const ROWS = 18;

let gameState = 'title'; // title, prologue, overworld, dialogue, battle, battleIntro, victory, diploma, mapTransition, doorOpening, libraryEntrance, artifactPopup
let keys = {};
let frameCount = 0;
let playerData = {
    x: 5, y: 8,
    dir: 'down',
    moving: false,
    moveProgress: 0,
    targetX: 5, targetY: 8,
    xp: 0,
    level: 1,
    hp: 100,
    maxHp: 100,
    wisdom: 10,
    questionsAnswered: 0,
    correctAnswers: 0,
    defeatedBosses: [],
    inventory: [],
    currentMap: 'aksum',
    name: 'Young Scholar',
    hasScroll: false,
    visitedArtifacts: [],
    talkedToNpcs: []
};

let currentDialogue = null;
let dialogueIndex = 0;
let dialogueCharIndex = 0;
let dialogueTimer = 0;
let dialogueComplete = false;
let dialogueCallback = null;

let battleState = null;
let titleSelection = 0;
let titleBlink = 0;

let mapTransitionAlpha = 0;
let mapTransitionDir = 0;
let mapTransitionTarget = null;

let screenShake = 0;
let particles = [];

// Prologue state
let prologueStep = 0;
let prologueTimer = 0;
let prologueTextIndex = 0;
let prologueTextTimer = 0;
let prologueComplete = false;

// Diploma state
let diplomaTimer = 0;
let diplomaPhase = 0;

// Door opening state
let doorOpenTimer = 0;
let doorOpenPhase = 0; // 0=luther speaks, 1=doors opening, 2=walk through

// Artifact popup state
let activeArtifact = null;

// Codex/Index state
let codexOpen = false;
let codexScroll = 0;
let codexTab = 0; // 0=characters, 1=mission/story

const codexCharacters = [
    { name: 'You -- The Young Scholar', desc: 'A young scholar from the Kingdom of Aksum, chosen by the church elders to carry a sacred scroll to Martin Luther.', colors: { body: '#2050a0', skin: '#f0c8a0', hair: '#4a2010', legs: '#203060', shoes: '#402020', satchel: true }, map: 'Aksum' },
    { name: 'Elder Abba Salama', desc: 'Keeper of the sacred texts in Aksum. He entrusts you with the scroll documenting Ethiopian Christian practices.', colors: { body: '#f5f5dc', skin: '#8d5524', hair: '#e0e0e0', legs: '#d4c4a0', shoes: '#8B4513', cross: '#ffd700', hat: '#f5f5dc' }, map: 'Aksum' },
    { name: 'Brother Ezra', desc: 'A monk who teaches about vernacular Scripture -- reading the Bible in Ge\'ez, the people\'s own language.', colors: { body: '#8b0000', skin: '#8d5524', hair: '#1a1a1a', legs: '#4a2020', shoes: '#2a1010', cross: '#c0c0c0' }, map: 'Aksum' },
    { name: 'Father Tekle', desc: 'A married priest with three children. He explains how Ethiopian clergy can marry, unlike Catholic priests.', colors: { body: '#daa520', skin: '#8d5524', hair: '#1a1a1a', legs: '#8B6914', shoes: '#654321' }, map: 'Aksum' },
    { name: 'Debtera Yohannes', desc: 'A church scholar who studies ancient texts. He knows Ethiopia may be the first Christian kingdom in history.', colors: { body: '#4a3080', skin: '#8d5524', hair: '#2a2a2a', legs: '#2a2050', shoes: '#1a1040', scroll: true }, map: 'Aksum' },
    { name: 'Michael the Deacon', desc: 'An Ethiopian cleric preparing to travel to Wittenberg. In 1534, he will meet Luther and receive full communion.', colors: { body: '#c8a050', skin: '#8d5524', hair: '#1a1a1a', legs: '#6a5020', shoes: '#4a3010', cross: '#c0c0c0' }, map: 'Lalibela' },
    { name: 'Master Builder Gebre', desc: 'Tells the story of Lalibela\'s rock-hewn churches -- carved DOWN into solid rock in the 12th century.', colors: { body: '#a0522d', skin: '#8d5524', hair: '#3a3a3a', legs: '#5a3a1a', shoes: '#3a2a0a' }, map: 'Lalibela' },
    { name: 'Sister Miriam', desc: 'A nun who explains why Ethiopia rejected Purgatory, indulgences, and the Pope\'s supreme authority.', colors: { body: '#f0f0f0', skin: '#8d5524', hair: '#1a1a1a', legs: '#a0a0a0', shoes: '#505050', hat: '#f0f0f0' }, map: 'Lalibela' },
    { name: 'Hans the Townsman', desc: 'A citizen of Wittenberg who witnessed Luther nail his 95 Theses to the church door in 1517.', colors: { body: '#6a7a4a', skin: '#f0c8a0', hair: '#5a3a1a', legs: '#4a5a2a', shoes: '#3a2a1a' }, map: 'Wittenberg' },
    { name: 'Student Katarina', desc: 'A theology student who explains how Ethiopia validated Luther\'s reforms -- the "proof of concept."', colors: { body: '#a04040', skin: '#f0c8a0', hair: '#2a1a0a', legs: '#603030', shoes: '#402020', quill: true }, map: 'Wittenberg' },
    { name: 'Martin Luther', desc: 'The German monk who sparked the Protestant Reformation in 1517. He praised Ethiopia as "uncorrupted by Roman papacy."', colors: { body: '#1a1a1a', skin: '#f0c8a0', hair: '#3a2a1a', legs: '#1a1a1a', shoes: '#0a0a0a', scroll: true }, map: 'Wittenberg' }
];

const codexStory = [
    { title: 'YOUR MISSION', text: 'Carry the Sacred Scroll from Ethiopia to Martin Luther in Wittenberg, Germany. The scroll documents Ethiopian Christian practices that predate the Reformation by over 1,000 years.' },
    { title: 'THE REFORMATION', text: 'In 1517, Martin Luther nailed 95 complaints to a church door, protesting Catholic corruption -- especially the selling of indulgences (paying money for forgiveness). This sparked the Protestant Reformation.' },
    { title: 'ETHIOPIAN CHRISTIANITY', text: 'The Ethiopian Orthodox Church has practiced Christianity since the 4th century. They already had everything Luther fought for: vernacular scripture, married clergy, communion in both kinds, no Pope, no indulgences.' },
    { title: 'WHY IT MATTERS', text: 'Ethiopia did not copy Luther -- Luther\'s ideas were validated BY Ethiopia. The Ethiopian Church proved that Christianity could thrive for 1,000+ years without a Pope, without indulgences, and without forced celibacy.' },
    { title: 'THE MEETING OF 1534', text: 'Michael the Deacon traveled from Ethiopia to Wittenberg and met Luther in person. Luther gave him full communion -- an honor he denied to many other groups -- recognizing Ethiopia as true Christianity.' }
];

// Artifact data per region
const artifacts = {
    aksum: [
        {
            id: 'artifact_monks',
            x: 9, y: 8,
            title: 'Ethiopian Orthodox Monks',
            description: 'Ethiopian monks have kept the faith alive since the 4th century, preserving sacred texts and traditions in remote monasteries across the highlands.'
        },
        {
            id: 'artifact_geez',
            x: 15, y: 8,
            title: 'Ge\'ez Bible Manuscript',
            description: 'The Ethiopian Bible was written in Ge\'ez -- the sacred language of the people. While Europe read Scripture only in Latin, Ethiopians could understand their own Bible for over a thousand years.'
        },
        {
            id: 'artifact_meskel',
            x: 7, y: 10,
            title: 'Meskel -- Festival of the True Cross',
            description: 'Meskel is a major Ethiopian Orthodox festival celebrating the finding of the True Cross. Bonfires are lit and thousands gather -- a tradition stretching back over 1,600 years.'
        }
    ],
    lalibela: [
        {
            id: 'artifact_beta_giorgis',
            x: 8, y: 9,
            title: 'Beta Giorgis -- Church of St. George',
            description: 'The most famous of Lalibela\'s rock-hewn churches, carved in the shape of a perfect cross. It was chiseled straight DOWN into solid rock in the 12th century -- an engineering marvel.'
        },
        {
            id: 'artifact_illuminated',
            x: 16, y: 9,
            title: 'Ethiopian Illuminated Manuscript',
            description: 'Ethiopian scribes created stunning illuminated manuscripts with vivid colors and unique artistic styles, blending African and Christian imagery in ways found nowhere else in the world.'
        }
    ],
    wittenberg: [
        {
            id: 'artifact_theses_door',
            x: 12, y: 7,
            title: 'The 95 Theses Door',
            description: 'On October 31, 1517, Martin Luther nailed his 95 Theses to the door of the Castle Church in Wittenberg. This single act of protest against indulgences sparked the Protestant Reformation.'
        },
        {
            id: 'artifact_press',
            x: 8, y: 9,
            title: 'The Printing Press',
            description: 'Gutenberg\'s printing press (invented c. 1440) allowed Luther\'s ideas to spread like wildfire. Without it, the Reformation might never have reached beyond Wittenberg.'
        }
    ]
};

// Draw pixel art illustration for each artifact in the popup
function drawArtifactImage(ctx, artifactId, x, y, w, h) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Background fill
    ctx.fillStyle = '#d4c4a0';
    ctx.fillRect(x, y, w, h);

    const cx = x + w / 2;
    const cy = y + h / 2;

    switch (artifactId) {
        case 'artifact_monks': {
            // Sky
            ctx.fillStyle = '#6090c0';
            ctx.fillRect(x, y, w, h * 0.55);
            // Ground
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(x, y + h * 0.55, w, h * 0.45);
            // Stone church (right side)
            ctx.fillStyle = '#9a8a6a';
            ctx.fillRect(cx + 30, cy - 40, 60, 70);
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(cx + 35, cy - 50, 50, 15);
            // Cross on church
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx + 57, cy - 62, 4, 16);
            ctx.fillRect(cx + 50, cy - 56, 18, 4);
            // Door
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(cx + 50, cy + 4, 16, 26);
            // Monks in white robes (3 figures)
            for (let i = 0; i < 3; i++) {
                const mx = cx - 50 + i * 30;
                const my = cy + 5;
                // White robe
                ctx.fillStyle = '#f0ece0';
                ctx.fillRect(mx - 6, my - 10, 12, 28);
                ctx.fillRect(mx - 8, my - 2, 16, 20);
                // Head
                ctx.fillStyle = '#8d5524';
                ctx.fillRect(mx - 4, my - 20, 8, 10);
                // White hood/hat
                ctx.fillStyle = '#f0ece0';
                ctx.fillRect(mx - 5, my - 24, 10, 6);
                // Small cross held
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(mx + 7, my - 8, 2, 12);
                ctx.fillRect(mx + 4, my - 4, 8, 2);
            }
            break;
        }
        case 'artifact_geez': {
            // Dark background like a scriptorium
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(x, y, w, h);
            // Book stand / table
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - 70, cy + 30, 140, 12);
            ctx.fillRect(cx - 10, cy + 42, 20, 30);
            // Open book
            ctx.fillStyle = '#f0dbb8';
            ctx.fillRect(cx - 60, cy - 40, 55, 70);
            ctx.fillRect(cx + 5, cy - 40, 55, 70);
            // Spine
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(cx - 3, cy - 42, 6, 74);
            // Golden illuminated border on left page
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx - 58, cy - 38, 2, 66);
            ctx.fillRect(cx - 58, cy - 38, 51, 2);
            ctx.fillRect(cx - 58, cy + 26, 51, 2);
            ctx.fillRect(cx - 9, cy - 38, 2, 66);
            // Golden border on right page
            ctx.fillRect(cx + 7, cy - 38, 2, 66);
            ctx.fillRect(cx + 7, cy - 38, 51, 2);
            ctx.fillRect(cx + 7, cy + 26, 51, 2);
            ctx.fillRect(cx + 56, cy - 38, 2, 66);
            // Ge'ez-like script lines (left page)
            ctx.fillStyle = '#2a1a0a';
            for (let l = 0; l < 7; l++) {
                const lw = 30 + (l * 7 % 13);
                ctx.fillRect(cx - 52, cy - 30 + l * 9, lw, 2);
            }
            // Ge'ez-like script lines (right page)
            for (let l = 0; l < 7; l++) {
                const lw = 28 + (l * 11 % 15);
                ctx.fillRect(cx + 12, cy - 30 + l * 9, lw, 2);
            }
            // Small illuminated letter on left page
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(cx - 52, cy - 32, 10, 10);
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx - 51, cy - 31, 8, 8);
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(cx - 49, cy - 29, 4, 4);
            break;
        }
        case 'artifact_meskel': {
            // Night sky
            ctx.fillStyle = '#0a0a2a';
            ctx.fillRect(x, y, w, h);
            // Stars
            ctx.fillStyle = '#ffffcc';
            for (let s = 0; s < 12; s++) {
                ctx.fillRect(x + (s * 23 + 7) % w, y + (s * 11 + 3) % (h * 0.3), 2, 2);
            }
            // Ground
            ctx.fillStyle = '#3a3020';
            ctx.fillRect(x, y + h * 0.7, w, h * 0.3);
            // Bonfire (large central)
            ctx.fillStyle = '#8B4513';
            // Logs
            ctx.fillRect(cx - 20, cy + 15, 40, 6);
            ctx.fillRect(cx - 15, cy + 10, 6, 20);
            ctx.fillRect(cx + 10, cy + 10, 6, 20);
            // Fire
            ctx.fillStyle = '#ff4500';
            ctx.fillRect(cx - 14, cy - 20, 28, 35);
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(cx - 10, cy - 30, 20, 30);
            ctx.fillStyle = '#ffdd00';
            ctx.fillRect(cx - 6, cy - 36, 12, 22);
            ctx.fillStyle = '#ffffaa';
            ctx.fillRect(cx - 3, cy - 32, 6, 12);
            // Sparks
            ctx.fillStyle = '#ffaa00';
            ctx.fillRect(cx - 16, cy - 40, 3, 3);
            ctx.fillRect(cx + 12, cy - 44, 3, 3);
            ctx.fillRect(cx + 2, cy - 50, 2, 2);
            // People gathered around (silhouettes with crosses raised)
            for (let p = 0; p < 6; p++) {
                const px2 = cx - 80 + p * 30;
                const py2 = cy + 30;
                if (Math.abs(px2 - cx) < 22) continue;
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(px2 - 4, py2 - 12, 8, 16);
                ctx.fillRect(px2 - 3, py2 - 18, 6, 6);
                // Raised cross
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(px2 + 4, py2 - 28, 2, 14);
                ctx.fillRect(px2 + 1, py2 - 24, 8, 2);
            }
            break;
        }
        case 'artifact_beta_giorgis': {
            // Top-down view of cross-shaped church carved in rock
            // Rocky terrain
            ctx.fillStyle = '#a09070';
            ctx.fillRect(x, y, w, h);
            // Carved pit (dark shadow around cross shape)
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(cx - 50, cy - 50, 100, 100);
            // Cross shape carved out (the church roof seen from above)
            ctx.fillStyle = '#c4a060';
            // Vertical bar
            ctx.fillRect(cx - 18, cy - 42, 36, 84);
            // Horizontal bar
            ctx.fillRect(cx - 42, cy - 18, 84, 36);
            // Slightly lighter inner cross
            ctx.fillStyle = '#d4b070';
            ctx.fillRect(cx - 12, cy - 36, 24, 72);
            ctx.fillRect(cx - 36, cy - 12, 72, 24);
            // Cross detail on roof
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx - 2, cy - 14, 4, 28);
            ctx.fillRect(cx - 10, cy - 2, 20, 4);
            // Shadow lines showing depth
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(cx - 42, cy - 50, 4, 100);
            ctx.fillRect(cx - 50, cy - 42, 100, 4);
            // Surrounding cliff texture
            ctx.fillStyle = '#8a7a5a';
            ctx.fillRect(x, y, w, y + h * 0.1 - y);
            ctx.fillRect(x, y + h * 0.9, w, h * 0.1);
            ctx.fillRect(x, y, w * 0.1, h);
            ctx.fillRect(x + w * 0.9, y, w * 0.1, h);
            break;
        }
        case 'artifact_illuminated': {
            // Dark parchment background
            ctx.fillStyle = '#3a2a1a';
            ctx.fillRect(x, y, w, h);
            // Manuscript page
            ctx.fillStyle = '#f0dbb8';
            ctx.fillRect(cx - 60, cy - 60, 120, 130);
            // Colorful border (Ethiopian style - red, blue, green, gold)
            const borderColors = ['#8b0000', '#1a3a8a', '#2a6a2a', PAL.gold];
            for (let b = 0; b < 4; b++) {
                ctx.fillStyle = borderColors[b];
                // Top
                ctx.fillRect(cx - 58 + b * 28, cy - 58, 24, 4);
                // Bottom
                ctx.fillRect(cx - 58 + b * 28, cy + 64, 24, 4);
                // Left
                ctx.fillRect(cx - 58, cy - 54 + b * 30, 4, 26);
                // Right
                ctx.fillRect(cx + 54, cy - 54 + b * 30, 4, 26);
            }
            // Inner border pattern
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx - 54, cy - 54, 108, 2);
            ctx.fillRect(cx - 54, cy + 60, 108, 2);
            ctx.fillRect(cx - 54, cy - 54, 2, 116);
            ctx.fillRect(cx + 52, cy - 54, 2, 116);
            // Saint figure (simple pixel art person with halo)
            // Halo
            ctx.fillStyle = PAL.gold;
            ctx.beginPath();
            ctx.arc(cx, cy - 24, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#f0dbb8';
            ctx.beginPath();
            ctx.arc(cx, cy - 24, 10, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.fillStyle = '#8d5524';
            ctx.fillRect(cx - 6, cy - 30, 12, 14);
            // Eyes
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(cx - 4, cy - 26, 3, 3);
            ctx.fillRect(cx + 1, cy - 26, 3, 3);
            // Body/robe
            ctx.fillStyle = '#8b0000';
            ctx.fillRect(cx - 10, cy - 16, 20, 30);
            ctx.fillStyle = '#daa520';
            ctx.fillRect(cx - 8, cy - 14, 16, 26);
            // Cross held
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(cx + 10, cy - 12, 3, 18);
            ctx.fillRect(cx + 6, cy - 6, 10, 3);
            // Text lines below
            ctx.fillStyle = '#2a1a0a';
            for (let l = 0; l < 3; l++) {
                ctx.fillRect(cx - 40, cy + 24 + l * 8, 80 - l * 10, 2);
            }
            break;
        }
        case 'artifact_theses_door': {
            // Stone wall background
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(x, y, w, h);
            // Stone blocks
            ctx.fillStyle = '#7a7a7a';
            for (let by = 0; by < 8; by++) {
                for (let bx = 0; bx < 6; bx++) {
                    const ox = (by % 2) * 20;
                    ctx.fillRect(x + bx * 42 + ox + 1, y + by * 22 + 1, 40, 20);
                }
            }
            // Large wooden door
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - 40, cy - 55, 80, 120);
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(cx - 36, cy - 50, 72, 110);
            // Door planks
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(cx - 2, cy - 50, 4, 110);
            // Iron hinges
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(cx - 36, cy - 40, 30, 4);
            ctx.fillRect(cx - 36, cy + 10, 30, 4);
            ctx.fillRect(cx + 6, cy - 40, 30, 4);
            ctx.fillRect(cx + 6, cy + 10, 30, 4);
            // Door handle
            ctx.fillStyle = '#2a2a2a';
            ctx.beginPath();
            ctx.arc(cx - 10, cy - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            // Paper/scroll nailed to door (the 95 Theses)
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(cx - 14, cy - 36, 28, 36);
            // Nail
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(cx - 1, cy - 38, 3, 4);
            // Text lines on paper
            ctx.fillStyle = '#1a1a1a';
            for (let l = 0; l < 8; l++) {
                ctx.fillRect(cx - 10, cy - 30 + l * 4, 20 - (l % 3) * 2, 1);
            }
            // Arch above door
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(cx - 44, cy - 58, 88, 6);
            break;
        }
        case 'artifact_press': {
            // Workshop background
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(x, y, w, h);
            // Wooden floor
            ctx.fillStyle = '#6a5030';
            ctx.fillRect(x, y + h * 0.65, w, h * 0.35);
            // Printing press frame (wooden)
            ctx.fillStyle = '#5a3a1a';
            // Vertical posts
            ctx.fillRect(cx - 40, cy - 50, 10, 90);
            ctx.fillRect(cx + 30, cy - 50, 10, 90);
            // Top beam
            ctx.fillRect(cx - 42, cy - 55, 84, 10);
            // Bottom platform
            ctx.fillRect(cx - 45, cy + 35, 90, 10);
            // Screw mechanism
            ctx.fillStyle = '#6a6a6a';
            ctx.fillRect(cx - 3, cy - 50, 6, 30);
            // Handle bar
            ctx.fillStyle = '#7a5a3a';
            ctx.fillRect(cx - 20, cy - 48, 40, 6);
            // Press plate
            ctx.fillStyle = '#5a5a5a';
            ctx.fillRect(cx - 28, cy - 15, 56, 8);
            // Paper on platform
            ctx.fillStyle = '#f5f0dc';
            ctx.fillRect(cx - 25, cy - 5, 50, 35);
            // Text being printed
            ctx.fillStyle = '#1a1a1a';
            for (let l = 0; l < 5; l++) {
                ctx.fillRect(cx - 18, cy + 2 + l * 6, 36 - (l % 2) * 6, 2);
            }
            // Paper coming out to the side
            ctx.fillStyle = '#f5f0dc';
            ctx.fillRect(cx + 28, cy + 5, 40, 30);
            // Printed text on output paper
            ctx.fillStyle = '#1a1a1a';
            for (let l = 0; l < 4; l++) {
                ctx.fillRect(cx + 32, cy + 10 + l * 6, 30 - (l % 3) * 4, 2);
            }
            break;
        }
    }

    ctx.restore();
    // Border around image area
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
}

// Spirit guide hint cycle tracking
let spiritHintIndex = {};

// NPC walk sequence state
let npcWalkSequence = null; // { npc, steps: [{x,y}], stepIndex, moveProgress, callback, dialogueAfter }

const prologueSlides = [
    {
        title: 'Europe, Early 1500s',
        text: 'The Catholic Church rules all of Christendom. The Pope in Rome holds supreme power. To question him is to question God.',
        bg: 'dark'
    },
    {
        title: 'Corruption Spreads...',
        text: 'The Church sells "indulgences" --pay money, and your sins are forgiven. Pay more, and your dead relatives escape Purgatory. The poor suffer while the Church grows rich.',
        bg: 'red'
    },
    {
        title: 'A Monk Takes a Stand',
        text: 'In 1517, a German monk named Martin Luther nails 95 complaints to a church door in Wittenberg. He demands reform: Scripture in local languages, communion for all, married clergy. This act sparks the Protestant Reformation.',
        bg: 'gold'
    },
    {
        title: 'But far away, in Africa...',
        text: 'The Ethiopian Orthodox Church has practiced Christianity since the 4th century --over 1,000 years before Luther was born. They already have everything Luther is fighting for.',
        bg: 'green'
    },
    {
        title: 'Your Quest Begins',
        text: 'You are a young scholar in the Kingdom of Aksum, Ethiopia. The church elders have chosen you for a sacred mission: carry a scroll documenting Ethiopian Christian practices to Martin Luther in Wittenberg. Your journey will change history.',
        bg: 'blue'
    }
];

//  Color Palette (Kanto-inspired) 
const PAL = {
    bg: '#1a1a2e',
    grass: '#3a7d44',
    grassLight: '#4a9d54',
    path: '#c4a35a',
    pathLight: '#d4b36a',
    water: '#2e6b9e',
    waterLight: '#4e8bbe',
    wall: '#6b5b4e',
    wallTop: '#8b7b6e',
    roof: '#b83030',
    roofLight: '#d84040',
    door: '#4a3520',
    sand: '#e8d5a3',
    rock: '#7a7a7a',
    tree: '#2a5a2a',
    treeTop: '#3a8a3a',
    church: '#d4c4a0',
    churchCross: '#ffd700',
    npcRobe: '#8b0000',
    npcSkin: '#c68642',
    white: '#ffffff',
    black: '#000000',
    textBg: '#181830',
    textBorder: '#5858a8',
    hpGreen: '#30c830',
    hpYellow: '#d8d830',
    hpRed: '#d83030',
    xpBlue: '#3070d8',
    gold: '#ffd700',
    purple: '#7848a8',
    parchment: '#f5e6c8',
    ink: '#2a1a0a',
    cobblestone: '#8a7a6a',
    cobbleLight: '#9a8a7a',
};

//  Sprite Drawing (Pixel Art) 
function drawPixelChar(x, y, dir, isNpc, colors, bobOffset = 0, isMoving = false) {
    const px = Math.floor(x);
    const py = Math.floor(y + bobOffset);
    const s = 2;
    const bodyColor = colors.body || '#3060b0';
    const skinColor = colors.skin || '#f0c8a0';
    const hairColor = colors.hair || '#402010';
    const eyeColor = colors.eyes || '#202020';

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(px + 6, py + 28, 20, 4);

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + 8, py + 14, 16, 12);

    // Arms with walk animation
    const armSwing = isMoving ? Math.sin(frameCount * 0.3) * 3 : 0;
    ctx.fillRect(px + 4, py + 14 + armSwing, 4, 10);
    ctx.fillRect(px + 24, py + 14 - armSwing, 4, 10);

    // Legs
    const legSwing = isMoving ? Math.sin(frameCount * 0.3) * 2 : 0;
    ctx.fillStyle = colors.legs || '#203060';
    ctx.fillRect(px + 10, py + 26 + legSwing, 5, 4);
    ctx.fillRect(px + 17, py + 26 - legSwing, 5, 4);

    // Feet
    ctx.fillStyle = colors.shoes || '#402020';
    ctx.fillRect(px + 9, py + 28 + legSwing, 6, 3);
    ctx.fillRect(px + 17, py + 28 - legSwing, 6, 3);

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(px + 9, py + 2, 14, 13);

    // Hair
    ctx.fillStyle = hairColor;
    if (dir === 'down' || dir === 'left' || dir === 'right') {
        ctx.fillRect(px + 8, py, 16, 5);
        ctx.fillRect(px + 8, py + 2, 3, 8);
        ctx.fillRect(px + 21, py + 2, 3, 8);
    } else {
        ctx.fillRect(px + 8, py, 16, 6);
        ctx.fillRect(px + 8, py + 2, 16, 10);
    }

    // Face
    if (dir === 'down') {
        ctx.fillStyle = eyeColor;
        ctx.fillRect(px + 12, py + 7, 3, 3);
        ctx.fillRect(px + 18, py + 7, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 12, py + 7, 2, 2);
        ctx.fillRect(px + 18, py + 7, 2, 2);
        ctx.fillStyle = skinColor;
        ctx.fillRect(px + 14, py + 11, 5, 2);
    } else if (dir === 'up') {
        // back of head
    } else if (dir === 'left') {
        ctx.fillStyle = eyeColor;
        ctx.fillRect(px + 11, py + 7, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 11, py + 7, 2, 2);
    } else {
        ctx.fillStyle = eyeColor;
        ctx.fillRect(px + 19, py + 7, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(px + 20, py + 7, 2, 2);
    }

    // Special items
    if (colors.hat) {
        ctx.fillStyle = colors.hat;
        ctx.fillRect(px + 6, py - 2, 20, 4);
        ctx.fillRect(px + 10, py - 6, 12, 5);
    }
    if (colors.cross) {
        ctx.fillStyle = colors.cross;
        ctx.fillRect(px + 14, py + 15, 4, 10);
        ctx.fillRect(px + 10, py + 18, 12, 3);
    }
    if (colors.scroll) {
        ctx.fillStyle = '#f5e6c8';
        ctx.fillRect(px + 26, py + 16, 6, 8);
        ctx.fillStyle = '#c8a878';
        ctx.fillRect(px + 26, py + 15, 6, 2);
        ctx.fillRect(px + 26, py + 24, 6, 2);
    }
    if (colors.crown) {
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(px + 10, py - 4, 12, 4);
        ctx.fillRect(px + 10, py - 7, 3, 3);
        ctx.fillRect(px + 15, py - 7, 3, 3);
        ctx.fillRect(px + 20, py - 7, 3, 3);
    }
    if (colors.satchel) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(px + 24, py + 16, 7, 9);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(px + 25, py + 17, 5, 7);
        // scroll peeking out
        if (playerData.hasScroll) {
            ctx.fillStyle = '#f5e6c8';
            ctx.fillRect(px + 26, py + 14, 3, 4);
        }
    }
    if (colors.quill) {
        ctx.fillStyle = '#f5f5dc';
        ctx.fillRect(px + 27, py + 10, 2, 12);
        ctx.fillStyle = '#1a1a4a';
        ctx.fillRect(px + 27, py + 20, 2, 4);
    }
    if (colors.miter) {
        // Bishop/Pope hat
        ctx.fillStyle = colors.miter;
        ctx.fillRect(px + 9, py - 6, 14, 8);
        ctx.fillRect(px + 12, py - 12, 8, 8);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(px + 9, py - 1, 14, 2);
    }
}

//  Map Data 
const maps = {
    aksum: {
        name: 'Kingdom of Aksum --Ethiopia',
        width: 25, height: 18,
        playerStart: { x: 12, y: 14 },
        tiles: generateAksumMap(),
        npcs: [
            {
                id: 'elder',
                x: 12, y: 8,
                dir: 'down',
                colors: { body: '#f5f5dc', skin: '#8d5524', hair: '#e0e0e0', legs: '#d4c4a0', shoes: '#8B4513', cross: PAL.gold, hat: '#f5f5dc' },
                name: 'Elder Abba Salama',
                questGiver: true,
                dialogue: [
                    'Ah, you have arrived, young scholar. I have been expecting you.',
                    'I am Abba Salama, keeper of the sacred texts here in the Kingdom of Aksum.',
                    'Our Ethiopian Orthodox Church is one of the oldest in the world --we have followed Christ since the 4th century!',
                    'Long before Europe built its great cathedrals, we had our own Bible, our own sacred language called Ge\'ez, and our own traditions.',
                    'Now listen carefully... A monk in faraway Germany named Martin Luther is challenging the Catholic Church.',
                    'He demands reforms that WE have practiced for over a THOUSAND years!',
                    'I am entrusting you with this sacred scroll. It documents our practices --communion in both kinds, Scripture in our own language, and married clergy.',
                    'You must carry it across the world to Martin Luther in Wittenberg, Germany.',
                    'But first --speak to the others here in Aksum. Learn what makes our church special. You will need this knowledge on your journey.',
                    ' You received the SACRED SCROLL! '
                ],
                onComplete: () => {
                    playerData.hasScroll = true;
                    playerData.inventory.push('Sacred Scroll');
                }
            },
            {
                id: 'monk_ezra',
                x: 6, y: 5,
                dir: 'right',
                colors: { body: '#8b0000', skin: '#8d5524', hair: '#1a1a1a', legs: '#4a2020', shoes: '#2a1010', cross: '#c0c0c0' },
                name: 'Brother Ezra',
                dialogue: [
                    'Welcome! I am Brother Ezra, a monk of the Ethiopian Orthodox Church.',
                    'Come --follow me to the scriptorium! I want to show you something.'
                ],
                walkAfterDialogue: {
                    steps: [{ x: 6, y: 7 }, { x: 8, y: 7 }, { x: 8, y: 9 }],
                    dialogue: [
                        { name: 'Brother Ezra', text: 'Here --look at these sacred texts. We read Scripture in Ge\'ez, our own language.' },
                        { name: 'Brother Ezra', text: 'Every believer can hear God\'s word in a tongue they understand!' },
                        { name: 'Brother Ezra', text: 'In Europe, the Catholic Church forces everyone to read the Bible only in Latin --a language most people cannot understand!' },
                        { name: 'Brother Ezra', text: 'Martin Luther is fighting to change that. But we have done it here for over a thousand years!' },
                        { name: 'Brother Ezra', text: 'This is called "vernacular Scripture" --using the people\'s own language. Remember this!' }
                    ]
                }
            },
            {
                id: 'priest_tekle',
                x: 18, y: 6,
                dir: 'left',
                colors: { body: '#daa520', skin: '#8d5524', hair: '#1a1a1a', legs: '#8B6914', shoes: '#654321' },
                name: 'Father Tekle',
                dialogue: [
                    'Greetings, young one! I am Father Tekle. Yes --FATHER. I have a wife and three children!',
                    'In our Ethiopian Church, priests are allowed to marry. We see marriage as a BLESSING, not a barrier to serving God.',
                    'But in the Catholic Church of Europe? Priests are forbidden from marrying! They call it "celibacy."',
                    'Luther believes this rule is unnatural and harmful. He argues that clergy should be free to marry.',
                    'When he makes this argument, he is asking for something we Ethiopian Christians have practiced for centuries!',
                    'Also --when we celebrate communion, ALL believers receive both the bread AND the wine.',
                    'In the Roman Catholic Church, only priests get the wine! Regular people only receive bread. Luther calls this deeply wrong.'
                ]
            },
            {
                id: 'scholar_yohannes',
                x: 3, y: 12,
                dir: 'right',
                colors: { body: '#4a3080', skin: '#8d5524', hair: '#2a2a2a', legs: '#2a2050', shoes: '#1a1040', scroll: true },
                name: 'Debtera Yohannes',
                dialogue: [
                    'I am a debtera --a scholar of the church. I spend my days studying our ancient texts.',
                    'Did you know? The Ethiopian eunuch in the Book of Acts is believed to be the FIRST non-Jewish person to convert to Christianity!',
                    'This makes Ethiopia potentially the first Christian kingdom in all of history!',
                    'Our faith is not some copy of European Christianity. It is OLDER. It is ORIGINAL.',
                    'Luther himself mentions Ethiopia at least 85 times in his writings. He calls our church "uncorrupted by the Roman papacy."',
                    'When you reach Wittenberg, tell Luther that our practices are proof his reforms have a historical AND biblical foundation!'
                ]
            },
            {
                id: 'spirit_aksum',
                x: 22, y: 9,
                dir: 'down',
                isSpirit: true,
                colors: { body: 'rgba(106,42,170,0.7)', skin: 'rgba(180,160,220,0.8)', hair: '#4a1070', legs: 'rgba(80,30,140,0.7)', shoes: 'rgba(60,20,100,0.7)' },
                name: 'Spirit of Aksum'
            }
        ],
        warps: [
            { x: 24, y: 9, target: 'lalibela', tx: 0, ty: 9, requires: 'quiz1' }
        ]
    },
    lalibela: {
        name: 'Lalibela --City of Rock Churches',
        width: 25, height: 18,
        playerStart: { x: 1, y: 9 },
        tiles: generateLalibelaMap(),
        npcs: [
            {
                id: 'michael',
                x: 12, y: 6,
                dir: 'down',
                colors: { body: '#c8a050', skin: '#8d5524', hair: '#1a1a1a', legs: '#6a5020', shoes: '#4a3010', cross: '#c0c0c0' },
                name: 'Michael the Deacon',
                dialogue: [
                    'You there! Young scholar! Come closer.',
                    'I am Michael --Michael the Deacon. I am preparing for a very long journey.',
                    'Walk with me --let me show you the church where I received my calling.'
                ],
                walkAfterDialogue: {
                    steps: [{ x: 12, y: 8 }, { x: 14, y: 8 }, { x: 14, y: 9 }],
                    dialogue: [
                        { name: 'Michael the Deacon', text: 'The church elders have asked me to travel to Europe --to Wittenberg, Germany.' },
                        { name: 'Michael the Deacon', text: 'There is a monk there named Martin Luther who is shaking the foundations of the Catholic Church!' },
                        { name: 'Michael the Deacon', text: 'In the year 1534, I will meet him face to face. And when I do...' },
                        { name: 'Michael the Deacon', text: 'Luther will give me full communion --both bread AND wine. A great honor he denies to many other groups!' },
                        { name: 'Michael the Deacon', text: 'He will see in me --in OUR church --living proof that his ideas are not radical new inventions...' },
                        { name: 'Michael the Deacon', text: 'But ancient Christian traditions that the Catholic Church in Rome abandoned long ago!' },
                        { name: 'Michael the Deacon', text: 'Our meeting will prove that a church can thrive WITHOUT a Pope, WITHOUT indulgences, WITHOUT forced celibacy!' },
                        { name: 'Michael the Deacon', text: 'Carry your scroll well, young scholar. We are both messengers of the same truth.' }
                    ]
                }
            },
            {
                id: 'builder',
                x: 6, y: 12,
                dir: 'right',
                colors: { body: '#a0522d', skin: '#8d5524', hair: '#3a3a3a', legs: '#5a3a1a', shoes: '#3a2a0a' },
                name: 'Master Builder Gebre',
                dialogue: [
                    'Ha! Watch your step, young one! You stand before one of the wonders of the world!',
                    'I am Gebre, master builder. Well --not me personally. King Lalibela built these in the 12th century.',
                    'These churches were carved straight DOWN into solid rock! Not built UP --carved DOWN!',
                    'The most famous is Bete Giyorgis --the Church of St. George --shaped like a perfect cross.',
                    'King Lalibela built them as a "New Jerusalem" so Ethiopian Christians would not need to travel to the Holy Land.',
                    'These churches prove that Ethiopia had a rich, independent Christian civilization hundreds of years before Europeans arrived.',
                    'When people say Christianity is a "European religion"... show them Lalibela!'
                ]
            },
            {
                id: 'nun_miriam',
                x: 19, y: 8,
                dir: 'left',
                colors: { body: '#f0f0f0', skin: '#8d5524', hair: '#1a1a1a', legs: '#a0a0a0', shoes: '#505050', hat: '#f0f0f0' },
                name: 'Sister Miriam',
                dialogue: [
                    'Peace be with you, young scholar. I am Sister Miriam.',
                    'Let me tell you about two things the Catholic Church teaches that we Ethiopians have NEVER accepted.',
                    'First: PURGATORY. The Catholics teach there is a place of punishment after death, before heaven.',
                    'They tell people: "Pay the Church money, and we will pray your loved ones OUT of Purgatory!" These payments are called INDULGENCES.',
                    'Luther was FURIOUS about indulgences. His famous 95 Theses were largely a protest against them!',
                    'Second: the PRIMACY OF THE POPE. Catholics believe the Pope --the Bishop of Rome --is supreme ruler of ALL Christians.',
                    'We Ethiopians never accepted this. We have our own leader --the Abuna. We answer to God, not to Rome.',
                    'When Luther challenges the Pope\'s authority, he is walking a path we have walked for centuries.',
                    'Continue west to Wittenberg, young scholar. Luther needs to hear what you have learned!'
                ]
            },
            {
                id: 'spirit_lalibela',
                x: 23, y: 9,
                dir: 'down',
                isSpirit: true,
                colors: { body: 'rgba(90,60,20,0.7)', skin: 'rgba(180,160,220,0.8)', hair: '#604010', legs: 'rgba(90,60,30,0.7)', shoes: 'rgba(60,40,10,0.7)' },
                name: 'Spirit of Lalibela'
            }
        ],
        warps: [
            { x: 0, y: 9, target: 'aksum', tx: 23, ty: 9 },
            { x: 24, y: 9, target: 'wittenberg', tx: 0, ty: 9, requires: 'quiz2' }
        ]
    },
    wittenberg: {
        name: 'Wittenberg --Germany, 1534',
        width: 25, height: 18,
        playerStart: { x: 1, y: 9 },
        tiles: generateWittenbergMap(),
        npcs: [
            {
                id: 'townsperson',
                x: 5, y: 12,
                dir: 'right',
                colors: { body: '#6a7a4a', skin: '#f0c8a0', hair: '#5a3a1a', legs: '#4a5a2a', shoes: '#3a2a1a' },
                name: 'Hans the Townsman',
                dialogue: [
                    'You look like you\'ve traveled a long way! Welcome to Wittenberg!',
                    'Things have been... exciting here lately. Have you heard of Martin Luther?',
                    'Seventeen years ago, in 1517, he nailed a list of 95 complaints to the door of the Castle Church!',
                    'He was protesting the Catholic Church\'s corruption --especially the selling of indulgences.',
                    'They called him a heretic! The Pope himself condemned him! But Luther would not back down.',
                    'His act sparked what we now call the Protestant Reformation --"Protestant" because we are PROTESTING!',
                    'Luther says the Bible should be in German, not just Latin. He says priests should marry. He says the Pope is not supreme.',
                    'Many people agree with him. But the Catholic Church is powerful and dangerous...',
                    'If you seek Luther, he is at the university. But be warned --he is a busy man!'
                ]
            },
            {
                id: 'student_katarina',
                x: 20, y: 6,
                dir: 'left',
                colors: { body: '#a04040', skin: '#f0c8a0', hair: '#2a1a0a', legs: '#603030', shoes: '#402020', quill: true },
                name: 'Student Katarina',
                dialogue: [
                    'Oh! Are you the scholar from Ethiopia? Luther has been hoping someone like you would come!',
                    'I study theology here at the university. Let me help you understand something important.',
                    'Many people think Luther just woke up one day and decided to rebel. But that\'s not the whole story.',
                    'Luther studied the Bible deeply. He came to believe that Christianity had been corrupted over centuries.',
                    'But here is the question scholars debate: was Ethiopian Christianity Luther\'s BLUEPRINT? Or his VALIDATION?',
                    'Luther didn\'t copy Ethiopia --he developed his own ideas from the Bible.',
                    'But learning about Ethiopia CONFIRMED his reforms. It proved they could work in practice!',
                    'Ethiopia was the "proof of concept" --a church that thrived for centuries doing exactly what Luther proposed.',
                    'Think about it: if the Ethiopian Church existed for 1,000+ years without a Pope, without indulgences... then Luther\'s ideas weren\'t radical at all!',
                    'That is why your scroll matters so much. Go speak to Luther himself!'
                ]
            },
            {
                id: 'luther',
                x: 12, y: 4,
                dir: 'down',
                colors: { body: '#1a1a1a', skin: '#f0c8a0', hair: '#3a2a1a', legs: '#1a1a1a', shoes: '#0a0a0a', scroll: true },
                name: 'Martin Luther',
                dialogue: [
                    '...',
                    'Another visitor? I am very busy preparing my --wait.',
                    'That satchel... is that a scroll from Ethiopia?!',
                    'Come closer! I am Martin Luther, professor of theology here at the University of Wittenberg.',
                    'In 1517, I posted my 95 Theses on the church door, demanding reform of the Catholic Church.',
                    'I called for communion in both kinds! Scripture in the common tongue! The right of clergy to marry!',
                    'The Pope called me a HERETIC. Kings wanted me arrested. I was forced into hiding.',
                    'But then I heard whispers of the Ethiopian Church... a church that already practiced everything I was fighting for!',
                    'When the Ethiopian Michael the Deacon visited me here in Wittenberg, he confirmed what I had hoped:',
                    'Your Ethiopian Church has been "uncorrupted by the Roman papacy" for over a THOUSAND years!',
                    'Your practices of communion, vernacular Scripture, married clergy --these are not MY innovations.',
                    'They are a RETURN to how Christianity was always meant to be practiced!',
                    'The Church of Ethiopia has more fidelity --more TRUTH --to the Christian tradition than Rome!',
                    'Your church is proof that my reforms have both a biblical AND a historical basis!',
                    'Now, young scholar... let me test your knowledge. If you have truly learned on your journey, you will earn something special!'
                ],
                isBoss: true
            },
            {
                id: 'spirit_wittenberg',
                x: 11, y: 5,
                dir: 'down',
                isSpirit: true,
                colors: { body: 'rgba(40,60,140,0.7)', skin: 'rgba(180,160,220,0.8)', hair: '#1a2a5a', legs: 'rgba(30,40,100,0.7)', shoes: 'rgba(20,20,80,0.7)' },
                name: 'Spirit of Wittenberg'
            }
        ],
        warps: [
            { x: 0, y: 9, target: 'lalibela', tx: 23, ty: 9 }
        ]
    },
    library: {
        name: 'The Scholar\'s Hall',
        width: 25, height: 18,
        playerStart: { x: 12, y: 16 },
        tiles: generateLibraryMap(),
        npcs: [
            {
                id: 'elder_final',
                x: 12, y: 6,
                dir: 'down',
                colors: { body: '#f5f5dc', skin: '#8d5524', hair: '#e0e0e0', legs: '#d4c4a0', shoes: '#8B4513', cross: PAL.gold, hat: '#f5f5dc' },
                name: 'Elder Abba Salama',
                dialogue: [
                    'You have returned, young scholar! And you carry with you the knowledge of THREE lands!',
                    'From Aksum, you learned of our ancient traditions. From Lalibela, of our enduring faith.',
                    'And from Wittenberg, you learned that our practices helped validate the Reformation itself.',
                    'The Ethiopian Church was never a footnote in history --it was a FOUNDATION.',
                    'Now receive your certificate --proof of your mastery of this sacred history!'
                ],
                questGiver: true
            }
        ],
        warps: []
    }
};

function generateLibraryMap() {
    let m = [];
    for (let y = 0; y < 18; y++) {
        let row = [];
        for (let x = 0; x < 25; x++) {
            if (y === 0) row.push(2); // top wall
            else if (y === 17) row.push(y === 17 && x === 12 ? 10 : 2); // bottom wall with entrance
            else if (x === 0 || x === 24) row.push(2); // side walls
            // Bookshelves along walls
            else if (y === 1 && x >= 2 && x <= 22) row.push(11); // bookshelf top
            else if ((x === 1 || x === 23) && y >= 2 && y <= 15) row.push(11); // side bookshelves
            // Central carpet/path
            else if (x >= 10 && x <= 14 && y >= 4) row.push(12); // red carpet
            // Reading tables
            else if ((x === 5 || x === 6) && (y === 6 || y === 7)) row.push(13); // table
            else if ((x === 18 || x === 19) && (y === 6 || y === 7)) row.push(13); // table
            // Candelabras
            else if ((x === 4 && y === 3) || (x === 20 && y === 3) || (x === 4 && y === 12) || (x === 20 && y === 12)) row.push(14); // candelabra
            else row.push(10); // cobblestone floor
        }
        m.push(row);
    }
    // entrance tile
    m[17][12] = 10;
    return m;
}

function generateAksumMap() {
    let m = [];
    for (let y = 0; y < 18; y++) {
        let row = [];
        for (let x = 0; x < 25; x++) {
            if (y === 0 || y === 17) row.push(4);
            else if (x === 0 || x === 24) row.push(y === 9 ? 1 : 4);
            else if (y >= 7 && y <= 10 && x >= 2) row.push(1); // main path
            else if (x >= 11 && x <= 13 && y >= 5 && y <= 14) row.push(1); // vertical path
            else if (x >= 5 && x <= 9 && y >= 3 && y <= 7) row.push(1); // left area
            else if (x >= 5 && x <= 7 && y >= 3 && y <= 4) row.push(5); // church
            else if (x >= 16 && x <= 20 && y >= 4 && y <= 8) row.push(1); // right area
            else if (x >= 17 && x <= 19 && y >= 4 && y <= 5) row.push(5); // church 2
            else if (y >= 14 && y <= 16 && x >= 16 && x <= 22) row.push(3); // lake
            else if (Math.random() < 0.06) row.push(7);
            else if (Math.random() < 0.1 && !(y >= 6 && y <= 11 && x >= 1 && x <= 23) && !(y >= 11 && y <= 15 && x >= 10 && x <= 14)) row.push(4);
            else row.push(0);
        }
        m.push(row);
    }
    return m;
}

function generateLalibelaMap() {
    let m = [];
    for (let y = 0; y < 18; y++) {
        let row = [];
        for (let x = 0; x < 25; x++) {
            if (y === 0 || y === 17) row.push(7);
            else if (x === 0 || x === 24) row.push(y === 9 ? 1 : 7);
            else if (y >= 8 && y <= 10 && x >= 0) row.push(1);
            else if (x >= 10 && x <= 14 && y >= 3 && y <= 8) row.push(1);
            else if (x >= 10 && x <= 14 && y >= 3 && y <= 5) row.push(2); // rock church
            else if (x >= 4 && x <= 8 && y >= 10 && y <= 15) row.push(1);
            else if (x >= 4 && x <= 7 && y >= 10 && y <= 11) row.push(2);
            else if (x >= 17 && x <= 21 && y >= 6 && y <= 10) row.push(1);
            else if (x >= 17 && x <= 21 && y >= 6 && y <= 7) row.push(2);
            else if (Math.random() < 0.15) row.push(7);
            else if (Math.random() < 0.06) row.push(4);
            else row.push(8);
        }
        m.push(row);
    }
    return m;
}

function generateWittenbergMap() {
    let m = [];
    for (let y = 0; y < 18; y++) {
        let row = [];
        for (let x = 0; x < 25; x++) {
            if (y === 0 || y === 17) row.push(2);
            else if (x === 0) row.push(y === 9 ? 1 : 2);
            else if (x === 24) row.push(2);
            else if (y >= 8 && y <= 10) row.push(10); // cobblestone
            else if (x >= 10 && x <= 14 && y >= 1 && y <= 8) row.push(10);
            else if (x >= 10 && x <= 14 && y >= 1 && y <= 3) row.push(5); // church
            else if (x >= 2 && x <= 6 && y >= 2 && y <= 5) row.push(2);
            else if (x >= 18 && x <= 22 && y >= 2 && y <= 5) row.push(2);
            else if (x >= 2 && x <= 6 && y >= 12 && y <= 15) row.push(2);
            else if (x >= 18 && x <= 22 && y >= 12 && y <= 15) row.push(2);
            else if (Math.random() < 0.04) row.push(4);
            else row.push(0);
        }
        m.push(row);
    }
    return m;
}

//  Quiz Questions 
const quizSets = {
    quiz1: {
        enemy: 'Guardian Spirit of Aksum',
        enemyColors: { body: '#6a2090', skin: '#b090d0', hair: '#4a1070', legs: '#4a1060', shoes: '#3a0a50', crown: true },
        questions: [
            {
                q: 'Since what century has the Ethiopian Church practiced Christianity?',
                options: ['4th century', '10th century', '16th century', '1st century'],
                correct: 0,
                explain: 'The Ethiopian Church has practiced Christianity since the 4th century --over 1,600 years!'
            },
            {
                q: 'What does "communion in both kinds" mean?',
                options: ['Bread AND wine for all', 'Two church services', 'Praying twice daily', 'Both singing and reading'],
                correct: 0,
                explain: 'Communion in both kinds means ALL believers receive both bread and wine, not just priests.'
            },
            {
                q: 'What was special about Ethiopian clergy that Luther also wanted for Europe?',
                options: ['They could marry', 'They wore gold robes', 'They could travel freely', 'They spoke Latin'],
                correct: 0,
                explain: 'Ethiopian priests were allowed to marry. Luther fought for this same right for European clergy.'
            },
            {
                q: 'What sacred language did Ethiopia use so believers could understand Scripture?',
                options: ['Ge\'ez', 'Latin', 'Greek', 'Arabic'],
                correct: 0,
                explain: 'Ethiopia used Ge\'ez, their sacred vernacular language, so all believers could understand Scripture.'
            }
        ]
    },
    quiz2: {
        enemy: 'Guardian Spirit of Lalibela',
        enemyColors: { body: '#906020', skin: '#b090d0', hair: '#604010', legs: '#604020', shoes: '#403010', crown: true },
        questions: [
            {
                q: 'Who was the Ethiopian cleric that visited Luther in 1534?',
                options: ['Michael the Deacon', 'King Lalibela', 'Abba Salama', 'Emperor Zara'],
                correct: 0,
                explain: 'Michael the Deacon traveled from Ethiopia to Wittenberg and met Luther in 1534.'
            },
            {
                q: 'What honor did Luther give Michael the Deacon?',
                options: ['Full communion', 'A golden cross', 'A university degree', 'A royal title'],
                correct: 0,
                explain: 'Luther extended full communion to Michael --an honor he withheld from many other reform groups!'
            },
            {
                q: 'What are "indulgences" that Luther protested against?',
                options: ['Payments to reduce punishment in Purgatory', 'Special prayers at night', 'Church decorations', 'Holiday celebrations'],
                correct: 0,
                explain: 'Indulgences were payments to the Church that supposedly reduced time in Purgatory. Luther saw this as corruption.'
            },
            {
                q: 'Why are Lalibela\'s churches considered a wonder?',
                options: ['They were carved down into solid rock', 'They were made of gold', 'They float on water', 'They were the tallest buildings'],
                correct: 0,
                explain: 'Lalibela\'s churches were carved straight DOWN into solid rock --incredible 12th century engineering!'
            },
            {
                q: 'The Ethiopian Church never accepted the authority of which figure?',
                options: ['The Pope', 'Moses', 'King Solomon', 'The Emperor'],
                correct: 0,
                explain: 'Ethiopia never accepted Papal authority --the Pope in Rome had no power over the Ethiopian Church.'
            }
        ]
    },
    quiz3: {
        enemy: 'Martin Luther',
        enemyColors: { body: '#1a1a1a', skin: '#f0c8a0', hair: '#3a2a1a', legs: '#1a1a1a', shoes: '#0a0a0a', scroll: true },
        isBoss: true,
        questions: [
            {
                q: 'In what year did Luther post his 95 Theses?',
                options: ['1517', '1492', '1776', '1534'],
                correct: 0,
                explain: 'Luther posted his famous 95 Theses in 1517, sparking the Protestant Reformation.'
            },
            {
                q: 'Why is it called the "Protestant" Reformation?',
                options: ['They were protesting the Catholic Church', 'They lived in a province', 'They were professional teachers', 'It was the name of their church'],
                correct: 0,
                explain: 'Protestant comes from "protest" --they were protesting the corruption of the Catholic Church!'
            },
            {
                q: 'Luther called the Ethiopian Church...',
                options: ['Uncorrupted by Roman papacy', 'A dangerous heresy', 'Too old to matter', 'A European colony'],
                correct: 0,
                explain: 'Luther praised Ethiopia as "uncorrupted by the Roman papacy" --a model of true Christianity.'
            },
            {
                q: 'How many times did Luther mention Ethiopia in his writings?',
                options: ['At least 85 times', 'Only once', 'Never', 'Exactly 10 times'],
                correct: 0,
                explain: 'Luther mentioned Ethiopia at least 85 times in his writings --it was clearly important to him!'
            },
            {
                q: 'What is the BEST way to describe Ethiopian Christianity\'s role in the Reformation?',
                options: ['It validated and proved Luther\'s reforms could work', 'Luther directly copied Ethiopia', 'They had no connection at all', 'Ethiopia copied Luther\'s ideas'],
                correct: 0,
                explain: 'Ethiopian Christianity VALIDATED Luther\'s ideas --proving his reforms had both biblical and historical basis!'
            },
            {
                q: 'Which practices did BOTH Ethiopian Christianity and Luther\'s reforms share?',
                options: ['Vernacular scripture, married clergy, communion in both kinds', 'Paying indulgences and obeying the Pope', 'Only reading in Latin', 'Believing in Purgatory'],
                correct: 0,
                explain: 'Both shared vernacular scripture, married clergy, and communion in both kinds --the cornerstones of the Reformation!'
            }
        ]
    }
};

// Shuffle answers
Object.values(quizSets).forEach(set => {
    set.questions.forEach(q => {
        const correctText = q.options[q.correct];
        for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
        }
        q.correct = q.options.indexOf(correctText);
    });
});

//  Tile Rendering 
function drawTile(x, y, type, mapName) {
    const px = x * TILE;
    const py = y * TILE;

    switch (type) {
        case 0: // grass
            ctx.fillStyle = PAL.grass;
            ctx.fillRect(px, py, TILE, TILE);
            if ((x + y) % 3 === 0) {
                ctx.fillStyle = PAL.grassLight;
                ctx.fillRect(px + 4, py + 4, 3, 2);
                ctx.fillRect(px + 18, py + 14, 3, 2);
            }
            if ((x * 7 + y * 13) % 5 === 0) {
                ctx.fillStyle = '#4aad54';
                ctx.fillRect(px + 12, py + 8, 2, 4);
                ctx.fillRect(px + 10, py + 10, 6, 2);
            }
            break;
        case 1: // path
            ctx.fillStyle = PAL.path;
            ctx.fillRect(px, py, TILE, TILE);
            if ((x + y) % 4 === 0) {
                ctx.fillStyle = PAL.pathLight;
                ctx.fillRect(px + 8, py + 8, 6, 4);
            }
            ctx.fillStyle = 'rgba(0,0,0,0.05)';
            ctx.fillRect(px, py, TILE, 1);
            break;
        case 2: // wall/building
            ctx.fillStyle = PAL.wall;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = PAL.wallTop;
            ctx.fillRect(px, py, TILE, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let by = 0; by < 4; by++) {
                const offset = by % 2 === 0 ? 0 : TILE / 2;
                ctx.fillRect(px + offset, py + by * 8, 1, 8);
                ctx.fillRect(px + offset + TILE / 2, py + by * 8, 1, 8);
                ctx.fillRect(px, py + by * 8, TILE, 1);
            }
            break;
        case 3: // water
            ctx.fillStyle = PAL.water;
            ctx.fillRect(px, py, TILE, TILE);
            const waveOff = Math.sin((frameCount + x * 3 + y * 5) * 0.05) * 2;
            ctx.fillStyle = PAL.waterLight;
            ctx.fillRect(px + 4 + waveOff, py + 8, 12, 2);
            ctx.fillRect(px + 8 - waveOff, py + 20, 10, 2);
            break;
        case 4: // tree
            ctx.fillStyle = PAL.grass;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(px + 12, py + 18, 8, 14);
            ctx.fillStyle = PAL.tree;
            ctx.fillRect(px + 4, py + 4, 24, 18);
            ctx.fillStyle = PAL.treeTop;
            ctx.fillRect(px + 6, py + 2, 20, 10);
            ctx.fillRect(px + 8, py, 16, 6);
            ctx.fillStyle = '#4aaa4a';
            ctx.fillRect(px + 8, py + 4, 6, 4);
            break;
        case 5: // church
            ctx.fillStyle = PAL.church;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = PAL.roof;
            ctx.fillRect(px, py, TILE, 8);
            ctx.fillStyle = PAL.roofLight;
            ctx.fillRect(px + 4, py, TILE - 8, 4);
            ctx.fillStyle = PAL.churchCross;
            ctx.fillRect(px + 14, py - 4, 4, 8);
            ctx.fillRect(px + 10, py - 2, 12, 3);
            break;
        case 7: // rock
            ctx.fillStyle = mapName === 'lalibela' ? '#c4a880' : PAL.grass;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = PAL.rock;
            ctx.fillRect(px + 4, py + 8, 24, 20);
            ctx.fillStyle = '#8a8a8a';
            ctx.fillRect(px + 6, py + 6, 20, 14);
            ctx.fillStyle = '#9a9a9a';
            ctx.fillRect(px + 8, py + 8, 8, 6);
            break;
        case 8: // sand
            ctx.fillStyle = PAL.sand;
            ctx.fillRect(px, py, TILE, TILE);
            if ((x + y) % 3 === 0) {
                ctx.fillStyle = '#d8c593';
                ctx.fillRect(px + 6, py + 10, 4, 2);
            }
            break;
        case 9: // bridge
            ctx.fillStyle = '#7a5a2a';
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#6a4a1a';
            ctx.fillRect(px, py, TILE, 4);
            ctx.fillRect(px, py + TILE - 4, TILE, 4);
            break;
        case 10: // cobblestone (for Wittenberg/Library)
            ctx.fillStyle = PAL.cobblestone;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = PAL.cobbleLight;
            for (let cx = 0; cx < 4; cx++) {
                for (let cy = 0; cy < 4; cy++) {
                    const ox = cx * 8 + (cy % 2) * 4;
                    ctx.fillRect(px + ox + 1, py + cy * 8 + 1, 6, 6);
                }
            }
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(px, py, TILE, 1);
            break;
        case 11: // bookshelf
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(px, py + 8, TILE, 2);
            ctx.fillRect(px, py + 20, TILE, 2);
            // Books
            const bookColors = ['#8b0000', '#1a3a6a', '#2a6a2a', '#6a2a6a', '#b8860b', '#4a0000', '#003366'];
            for (let b = 0; b < 6; b++) {
                ctx.fillStyle = bookColors[(x * 3 + y * 7 + b) % bookColors.length];
                ctx.fillRect(px + b * 5 + 1, py + 1, 4, 7);
                ctx.fillRect(px + b * 5 + 1, py + 11, 4, 8);
                ctx.fillRect(px + b * 5 + 1, py + 23, 4, 8);
            }
            break;
        case 12: // red carpet
            ctx.fillStyle = '#8b1a1a';
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#a02020';
            ctx.fillRect(px + 2, py, TILE - 4, TILE);
            // Gold trim
            ctx.fillStyle = '#c8a040';
            ctx.fillRect(px, py, 2, TILE);
            ctx.fillRect(px + TILE - 2, py, 2, TILE);
            // Pattern
            if ((x + y) % 2 === 0) {
                ctx.fillStyle = '#7a1414';
                ctx.fillRect(px + 8, py + 8, 16, 16);
            }
            break;
        case 13: // reading table
            ctx.fillStyle = PAL.cobblestone;
            ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#6a4a2a';
            ctx.fillRect(px + 2, py + 4, TILE - 4, TILE - 8);
            ctx.fillStyle = '#7a5a3a';
            ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12);
            // Books on table
            ctx.fillStyle = '#f5e6c8';
            ctx.fillRect(px + 8, py + 10, 10, 8);
            ctx.fillStyle = '#2a1a0a';
            ctx.fillRect(px + 10, py + 12, 6, 1);
            ctx.fillRect(px + 10, py + 14, 5, 1);
            break;
        case 14: // candelabra
            ctx.fillStyle = PAL.cobblestone;
            ctx.fillRect(px, py, TILE, TILE);
            // Stand
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(px + 13, py + 12, 6, 18);
            ctx.fillRect(px + 10, py + 28, 12, 4);
            // Arms
            ctx.fillRect(px + 6, py + 10, 20, 3);
            // Candles
            ctx.fillStyle = '#f5f0dc';
            ctx.fillRect(px + 7, py + 4, 4, 6);
            ctx.fillRect(px + 14, py + 4, 4, 6);
            ctx.fillRect(px + 21, py + 4, 4, 6);
            // Flames
            const flicker = Math.sin(frameCount * 0.15 + x * 5) * 1;
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(px + 8, py + 1 + flicker, 2, 3);
            ctx.fillRect(px + 15, py + 1 - flicker, 2, 3);
            ctx.fillRect(px + 22, py + 1 + flicker, 2, 3);
            ctx.fillStyle = '#ffdd00';
            ctx.fillRect(px + 8, py + 2 + flicker, 2, 1);
            ctx.fillRect(px + 15, py + 2 - flicker, 2, 1);
            ctx.fillRect(px + 22, py + 2 + flicker, 2, 1);
            break;
    }
}

function isSolid(mapKey, x, y) {
    const map = maps[mapKey];
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
    const tile = map.tiles[y][x];
    if ([2, 3, 4, 5, 7, 11, 13, 14].includes(tile)) return true;
    for (const npc of map.npcs) {
        if (npc.x === x && npc.y === y) {
            // Defeated spirits are passable
            if (npc.isSpirit) {
                const quizKey = mapKey === 'aksum' ? 'quiz1' : mapKey === 'lalibela' ? 'quiz2' : 'quiz3';
                if (playerData.defeatedBosses.includes(quizKey)) continue;
            }
            return true;
        }
    }
    // Artifacts are solid objects
    const regionArtifacts = artifacts[mapKey] || [];
    for (const art of regionArtifacts) {
        if (art.x === x && art.y === y) return true;
    }
    return false;
}

//  Input 
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

function keyJustPressed(key) {
    if (keys[key] && !keys['_prev_' + key]) {
        keys['_prev_' + key] = true;
        return true;
    }
    if (!keys[key]) keys['_prev_' + key] = false;
    return false;
}

//  Particles 
function spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4 - 2,
            life: 30 + Math.random() * 20,
            maxLife: 50,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

//  NPC Walk Sequences 
// Triggered by dialogue --NPC says "Follow me!" then walks to a spot, stops, and continues talking
function startNpcWalk(npc, steps, dialogueAfter) {
    npcWalkSequence = {
        npc,
        steps, // [{x, y}, ...]
        stepIndex: 0,
        moveProgress: 0,
        startX: npc.x,
        startY: npc.y,
        dialogueAfter
    };
    gameState = 'npcWalking';
}

function updateNpcWalk() {
    if (!npcWalkSequence) return;
    const seq = npcWalkSequence;
    const target = seq.steps[seq.stepIndex];

    seq.moveProgress += 0.08;
    if (seq.moveProgress >= 1) {
        seq.npc.x = target.x;
        seq.npc.y = target.y;
        seq.startX = target.x;
        seq.startY = target.y;
        seq.moveProgress = 0;
        seq.stepIndex++;

        if (seq.stepIndex >= seq.steps.length) {
            // Walk done --show follow-up dialogue
            const dlg = seq.dialogueAfter;
            npcWalkSequence = null;
            gameState = 'overworld';
            if (dlg) {
                startDialogue(dlg);
            }
            return;
        }
        // Update facing for next step
        const next = seq.steps[seq.stepIndex];
        if (next.x > seq.npc.x) seq.npc.dir = 'right';
        else if (next.x < seq.npc.x) seq.npc.dir = 'left';
        else if (next.y > seq.npc.y) seq.npc.dir = 'down';
        else if (next.y < seq.npc.y) seq.npc.dir = 'up';
    } else {
        // Update facing direction
        if (target.x > seq.startX) seq.npc.dir = 'right';
        else if (target.x < seq.startX) seq.npc.dir = 'left';
        else if (target.y > seq.startY) seq.npc.dir = 'down';
        else if (target.y < seq.startY) seq.npc.dir = 'up';
    }
}

function getNpcWalkInterp() {
    if (!npcWalkSequence) return null;
    const seq = npcWalkSequence;
    const target = seq.steps[seq.stepIndex];
    return {
        npc: seq.npc,
        x: seq.startX + (target.x - seq.startX) * seq.moveProgress,
        y: seq.startY + (target.y - seq.startY) * seq.moveProgress
    };
}

//  Title Screen 
function updateTitle() {
    titleBlink++;
    if (keyJustPressed(' ') || keyJustPressed('Enter')) {
        gameState = 'prologue';
        prologueStep = 0;
        prologueTimer = 0;
        prologueTextIndex = 0;
        prologueTextTimer = 0;
        prologueComplete = false;
    }
}

function drawTitle() {
    ctx.fillStyle = '#0a0a20';
    ctx.fillRect(0, 0, 800, 600);

    // Animated stars
    for (let i = 0; i < 60; i++) {
        const sx = (i * 137 + frameCount * 0.3) % 800;
        const sy = (i * 97 + Math.sin(frameCount * 0.02 + i) * 20) % 600;
        ctx.fillStyle = `rgba(255,255,200,${0.3 + Math.sin(frameCount * 0.05 + i) * 0.3})`;
        ctx.fillRect(sx, sy, 2, 2);
    }

    // Ethiopian cross
    ctx.save();
    ctx.translate(400, 150);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(-6, -40, 12, 80);
    ctx.fillRect(-30, -6, 60, 12);
    ctx.fillRect(-34, -10, 8, 20);
    ctx.fillRect(26, -10, 8, 20);
    ctx.fillRect(-10, -44, 20, 8);
    ctx.fillRect(-10, 36, 20, 8);
    ctx.fillStyle = '#b8960a';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();

    // Glow
    const glowAlpha = 0.15 + Math.sin(frameCount * 0.03) * 0.1;
    ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(400, 150, 70, 0, Math.PI * 2);
    ctx.fill();

    // Title
    ctx.fillStyle = PAL.gold;
    ctx.font = '28px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText("REFORMERS", 400, 270);
    ctx.fillText("QUEST", 400, 310);

    ctx.fillStyle = '#a0a0c0';
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText('Ethiopian Christianity & the Protestant Reformation', 400, 350);

    // Scroll icon animation
    const scrollBob = Math.sin(frameCount * 0.06) * 5;
    ctx.fillStyle = PAL.parchment;
    ctx.fillRect(370, 380 + scrollBob, 60, 30);
    ctx.fillStyle = '#c8a878';
    ctx.fillRect(370, 378 + scrollBob, 60, 4);
    ctx.fillRect(370, 408 + scrollBob, 60, 4);
    ctx.fillStyle = PAL.ink;
    ctx.fillRect(380, 388 + scrollBob, 40, 2);
    ctx.fillRect(380, 394 + scrollBob, 35, 2);
    ctx.fillRect(380, 400 + scrollBob, 38, 2);

    // Blink prompt
    if (Math.floor(titleBlink / 30) % 2 === 0) {
        ctx.fillStyle = '#6060a0';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('PRESS SPACE OR ENTER', 400, 480);
    }

    ctx.fillStyle = '#404060';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('ARROWS: Move    SPACE: Interact', 400, 560);

    ctx.textAlign = 'left';
}

//  Prologue 
function updatePrologue() {
    prologueTimer++;

    const slide = prologueSlides[prologueStep];
    if (!prologueComplete) {
        prologueTextTimer++;
        if (prologueTextTimer % 2 === 0) {
            prologueTextIndex++;
            if (prologueTextIndex >= slide.text.length) {
                prologueComplete = true;
            }
        }
    }

    if (keyJustPressed(' ') || keyJustPressed('Enter')) {
        if (!prologueComplete) {
            prologueTextIndex = slide.text.length;
            prologueComplete = true;
        } else {
            prologueStep++;
            if (prologueStep >= prologueSlides.length) {
                // Start game
                gameState = 'overworld';
                const map = maps[playerData.currentMap];
                playerData.x = map.playerStart.x;
                playerData.y = map.playerStart.y;
                playerData.targetX = playerData.x;
                playerData.targetY = playerData.y;
                return;
            }
            prologueTextIndex = 0;
            prologueTextTimer = 0;
            prologueComplete = false;
            prologueTimer = 0;
        }
    }
}

function drawPrologue() {
    const slide = prologueSlides[prologueStep];

    // Background based on theme
    const bgColors = {
        dark: ['#0a0a1a', '#1a1a3a'],
        red: ['#1a0a0a', '#3a1a1a'],
        gold: ['#1a1a0a', '#3a3a1a'],
        green: ['#0a1a0a', '#1a3a1a'],
        blue: ['#0a0a1a', '#1a1a4a']
    };
    const [c1, c2] = bgColors[slide.bg] || bgColors.dark;
    const grad = ctx.createLinearGradient(0, 0, 0, 600);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Ambient particles
    for (let i = 0; i < 20; i++) {
        const px = (i * 41 + frameCount * 0.5) % 800;
        const py = (i * 31 + Math.sin(frameCount * 0.01 + i) * 30) % 600;
        const themeColors = { dark: '150,150,200', red: '200,100,100', gold: '255,215,0', green: '100,200,100', blue: '100,150,255' };
        ctx.fillStyle = `rgba(${themeColors[slide.bg] || '150,150,200'}, ${0.2 + Math.sin(frameCount * 0.03 + i) * 0.15})`;
        ctx.fillRect(px, py, 2, 2);
    }

    // Scene illustrations
    drawPrologueScene(slide.bg, prologueStep);

    // Slide counter
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(`${prologueStep + 1} / ${prologueSlides.length}`, 400, 30);

    // Title
    const titleAlpha = Math.min(1, prologueTimer / 30);
    ctx.fillStyle = `rgba(255, 215, 0, ${titleAlpha})`;
    ctx.font = '16px "Press Start 2P"';
    ctx.fillText(slide.title, 400, 340);

    // Text box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(60, 370, 680, 150);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 370, 680, 150);

    const displayText = slide.text.substring(0, prologueTextIndex);
    ctx.fillStyle = '#d0d0e0';
    ctx.font = '9px "Press Start 2P"';
    ctx.textAlign = 'left';
    wrapText(displayText, 80, 398, 620, 20);

    // Continue prompt
    if (prologueComplete && Math.floor(frameCount / 20) % 2 === 0) {
        ctx.fillStyle = '#8080b0';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(prologueStep === prologueSlides.length - 1 ? 'PRESS SPACE TO BEGIN YOUR QUEST' : 'PRESS SPACE TO CONTINUE', 400, 540);
    }

    // Progress dots
    for (let i = 0; i < prologueSlides.length; i++) {
        ctx.fillStyle = i === prologueStep ? PAL.gold : 'rgba(255,255,255,0.3)';
        ctx.fillRect(370 + i * 16, 570, i === prologueStep ? 10 : 6, i === prologueStep ? 6 : 4);
    }

    ctx.textAlign = 'left';
}

function drawPrologueScene(bg, step) {
    ctx.save();
    ctx.translate(400, 180);

    switch (step) {
        case 0: // Catholic Church power
            // Big imposing church
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(-60, -40, 120, 80);
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(-50, -60, 100, 30);
            ctx.fillStyle = '#6a6a7a';
            ctx.fillRect(-20, -90, 40, 40);
            // Pope crown
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(-8, -100, 16, 12);
            ctx.fillRect(-4, -108, 8, 10);
            // Cross on top
            ctx.fillRect(-2, -120, 4, 16);
            ctx.fillRect(-8, -112, 16, 4);
            // Small people at base
            for (let i = -3; i <= 3; i++) {
                ctx.fillStyle = '#808090';
                ctx.fillRect(i * 15 - 3, 40, 6, 10);
                ctx.fillStyle = '#a0a0b0';
                ctx.fillRect(i * 15 - 2, 34, 4, 6);
            }
            break;

        case 1: // Corruption
            // Coins / indulgences
            for (let i = 0; i < 8; i++) {
                const cx = Math.sin(i * 0.8 + frameCount * 0.02) * 80;
                const cy = Math.cos(i * 1.1 + frameCount * 0.02) * 40 - 20;
                ctx.fillStyle = PAL.gold;
                ctx.beginPath();
                ctx.arc(cx, cy, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#b8960a';
                ctx.fillRect(cx - 3, cy - 4, 6, 2);
            }
            // Sad figures
            ctx.fillStyle = '#606060';
            ctx.fillRect(-40, 30, 8, 14);
            ctx.fillRect(30, 30, 8, 14);
            ctx.fillStyle = '#808080';
            ctx.fillRect(-39, 24, 6, 6);
            ctx.fillRect(31, 24, 6, 6);
            break;

        case 2: // Luther nailing theses
            // Church door
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(-40, -50, 80, 100);
            ctx.fillStyle = '#4a2a0a';
            ctx.fillRect(-35, -45, 70, 90);
            // Paper on door
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(-15, -30, 30, 40);
            ctx.fillStyle = '#1a1a1a';
            for (let l = 0; l < 6; l++) {
                ctx.fillRect(-10, -24 + l * 6, 20, 1);
            }
            // Luther figure
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(50, -10, 12, 18);
            ctx.fillStyle = '#f0c8a0';
            ctx.fillRect(52, -18, 8, 10);
            // Hammer
            ctx.fillStyle = '#8a7a6a';
            ctx.fillRect(44, -12, 3, 14);
            ctx.fillStyle = '#5a4a3a';
            ctx.fillRect(40, -14, 8, 5);
            break;

        case 3: // Ethiopia
            // Ethiopian church (cross-shaped from above)
            ctx.fillStyle = '#c4a060';
            ctx.fillRect(-15, -60, 30, 80);
            ctx.fillRect(-40, -30, 80, 30);
            // Cross on top
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(-3, -72, 6, 16);
            ctx.fillRect(-10, -66, 20, 4);
            // Ethiopian figures celebrating
            const colors = ['#8b0000', '#daa520', '#f5f5dc', '#4a3080'];
            for (let i = 0; i < 4; i++) {
                const fx = -50 + i * 35;
                const bob = Math.sin(frameCount * 0.08 + i) * 3;
                ctx.fillStyle = colors[i];
                ctx.fillRect(fx, 30 + bob, 10, 16);
                ctx.fillStyle = '#8d5524';
                ctx.fillRect(fx + 1, 22 + bob, 8, 8);
            }
            break;

        case 4: // Your quest
            // Scholar with scroll
            ctx.fillStyle = '#2050a0';
            ctx.fillRect(-6, -10, 12, 18);
            ctx.fillStyle = '#f0c8a0';
            ctx.fillRect(-4, -20, 8, 12);
            ctx.fillStyle = '#4a2010';
            ctx.fillRect(-5, -24, 10, 6);
            // Satchel with scroll
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(8, -4, 8, 10);
            ctx.fillStyle = PAL.parchment;
            ctx.fillRect(10, -8, 4, 6);
            // Path stretching ahead
            ctx.fillStyle = PAL.path;
            ctx.fillRect(-10, 20, 20, 6);
            for (let i = 1; i < 8; i++) {
                const w = 20 + i * 10;
                ctx.fillStyle = `rgba(196, 163, 90, ${1 - i * 0.12})`;
                ctx.fillRect(-w / 2, 20 + i * 10, w, 6);
            }
            // Arrow pointing forward
            const arrowBob = Math.sin(frameCount * 0.08) * 4;
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(-2, 90 + arrowBob, 4, 15);
            ctx.fillRect(-6, 100 + arrowBob, 12, 4);
            break;
    }

    ctx.restore();
}

//  Overworld 
function updateOverworld() {
    // Toggle codex with 'c' or 'i' key
    if (keyJustPressed('c') || keyJustPressed('i')) {
        codexOpen = !codexOpen;
        codexScroll = 0;
        return;
    }
    if (codexOpen) {
        if (keyJustPressed('ArrowLeft')) codexTab = 0;
        if (keyJustPressed('ArrowRight')) codexTab = 1;
        if (keys['ArrowUp']) codexScroll = Math.max(0, codexScroll - 4);
        if (keys['ArrowDown']) codexScroll += 4;
        if (keyJustPressed(' ') || keyJustPressed('Enter') || keyJustPressed('Escape')) {
            codexOpen = false;
        }
        return;
    }

    const map = maps[playerData.currentMap];

    if (playerData.moving) {
        playerData.moveProgress += 0.15;
        if (playerData.moveProgress >= 1) {
            playerData.x = playerData.targetX;
            playerData.y = playerData.targetY;
            playerData.moving = false;
            playerData.moveProgress = 0;

            for (const warp of (map.warps || [])) {
                if (playerData.x === warp.x && playerData.y === warp.y) {
                    if (warp.requires && !playerData.defeatedBosses.includes(warp.requires)) {
                        startDialogue([{
                            name: 'System',
                            text: 'The path is blocked! Defeat the Guardian Spirit to proceed.'
                        }]);
                        playerData.x = warp.x + (warp.target === 'lalibela' || warp.target === 'wittenberg' ? -1 : 1);
                        playerData.y = warp.y;
                        playerData.targetX = playerData.x;
                        playerData.targetY = playerData.y;
                        return;
                    }
                    startMapTransition(warp.target, warp.tx, warp.ty);
                    return;
                }
            }
        }
    } else {
        let dx = 0, dy = 0;
        if (keys['ArrowUp']) { dy = -1; playerData.dir = 'up'; }
        else if (keys['ArrowDown']) { dy = 1; playerData.dir = 'down'; }
        else if (keys['ArrowLeft']) { dx = -1; playerData.dir = 'left'; }
        else if (keys['ArrowRight']) { dx = 1; playerData.dir = 'right'; }

        if (dx !== 0 || dy !== 0) {
            const nx = playerData.x + dx;
            const ny = playerData.y + dy;
            if (!isSolid(playerData.currentMap, nx, ny)) {
                playerData.targetX = nx;
                playerData.targetY = ny;
                playerData.moving = true;
                playerData.moveProgress = 0;
            }
        }

        // Interact
        if (keyJustPressed(' ') || keyJustPressed('Enter')) {
            const facingX = playerData.x + (playerData.dir === 'left' ? -1 : playerData.dir === 'right' ? 1 : 0);
            const facingY = playerData.y + (playerData.dir === 'up' ? -1 : playerData.dir === 'down' ? 1 : 0);

            let npcHandled = false;
            for (const npc of map.npcs) {
                if (npc.x === facingX && npc.y === facingY) {
                    npcHandled = true;
                    // Turn NPC to face player
                    if (playerData.dir === 'up') npc.dir = 'down';
                    else if (playerData.dir === 'down') npc.dir = 'up';
                    else if (playerData.dir === 'left') npc.dir = 'right';
                    else npc.dir = 'left';

                    // Track NPC conversation
                    if (!playerData.talkedToNpcs.includes(npc.id)) {
                        playerData.talkedToNpcs.push(npc.id);
                    }

                    // Dynamic dialogue for special NPCs
                    let dialogueLines;
                    if (npc.id === 'elder_final') {
                        // Library elder --show dialogue then diploma
                        dialogueLines = npc.dialogue.map(text => ({ name: npc.name, text }));
                        startDialogue(dialogueLines, () => {
                            gameState = 'diploma';
                            diplomaTimer = 0;
                            diplomaPhase = 0;
                        });
                        break;
                    }

                    // Spirit guide handler
                    if (npc.isSpirit) {
                        const region = playerData.currentMap;
                        const quizKey = region === 'aksum' ? 'quiz1' : region === 'lalibela' ? 'quiz2' : 'quiz3';

                        if (playerData.defeatedBosses.includes(quizKey)) {
                            startDialogue([{ name: npc.name, text: 'You have already proven yourself here. Continue your journey, young scholar.' }]);
                        } else {
                            const comp = getRegionCompletion(region);
                            if (comp.isComplete) {
                                // Ready for battle
                                const readyLines = [
                                    { name: npc.name, text: 'The spirits of this land have watched you learn. You are ready. Face the trial of knowledge!' }
                                ];
                                startDialogue(readyLines, () => startBattle(quizKey));
                            } else {
                                // Cryptic hints -- cycle through them
                                const spiritKey = npc.id;
                                if (!spiritHintIndex[spiritKey]) spiritHintIndex[spiritKey] = 0;

                                const crypticHints = getSpiritHints(region, comp);
                                const hintIdx = spiritHintIndex[spiritKey] % crypticHints.length;
                                spiritHintIndex[spiritKey]++;

                                const progressStr = '(' + comp.npcsDone + '/' + comp.npcsTotal + ' seekers met, ' + comp.artifactsDone + '/' + comp.artifactsTotal + ' relics found)';

                                startDialogue([
                                    { name: npc.name, text: crypticHints[hintIdx] },
                                    { name: npc.name, text: progressStr }
                                ]);
                            }
                        }
                        break;
                    }

                    // Regular NPC handling
                    dialogueLines = npc.dialogue.map(text => ({ name: npc.name, text }));

                    if (npc.questGiver && npc.onComplete && !playerData.hasScroll) {
                        startDialogue(dialogueLines, () => { npc.onComplete(); });
                    } else if (npc.questGiver && playerData.hasScroll) {
                        startDialogue([
                            { name: npc.name, text: 'You carry the scroll! Now go --speak to the monks, learn all you can, then head to Lalibela!' },
                            { name: npc.name, text: 'The knowledge you gather here will be crucial when you finally reach Martin Luther.' }
                        ]);
                    } else if (npc.walkAfterDialogue && !npc._hasWalked) {
                        const walkData = npc.walkAfterDialogue;
                        startDialogue(dialogueLines, () => {
                            npc._hasWalked = true;
                            startNpcWalk(npc, walkData.steps, walkData.dialogue);
                        });
                    } else {
                        startDialogue(dialogueLines);
                    }
                    break;
                }
            }

            // Artifact interaction: check if player is FACING an artifact tile
            if (!npcHandled) {
                const currentArtifacts = artifacts[playerData.currentMap] || [];
                for (const art of currentArtifacts) {
                    if (facingX === art.x && facingY === art.y) {
                        if (!playerData.visitedArtifacts.includes(art.id)) {
                            playerData.visitedArtifacts.push(art.id);
                        }
                        activeArtifact = art;
                        gameState = 'artifactPopup';
                        break;
                    }
                }
            }
        }
    }
}

function drawOverworld() {
    const map = maps[playerData.currentMap];

    const interpX = playerData.x + (playerData.targetX - playerData.x) * playerData.moveProgress;
    const interpY = playerData.y + (playerData.targetY - playerData.y) * playerData.moveProgress;
    const camX = Math.max(0, Math.min(map.width * TILE - 800, interpX * TILE - 400 + TILE / 2));
    const camY = Math.max(0, Math.min(map.height * TILE - 600, interpY * TILE - 300 + TILE / 2));

    ctx.save();
    if (screenShake > 0) {
        ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
        screenShake *= 0.9;
        if (screenShake < 0.5) screenShake = 0;
    }
    ctx.translate(-camX, -camY);

    const startCol = Math.floor(camX / TILE);
    const startRow = Math.floor(camY / TILE);
    const endCol = Math.min(map.width, startCol + 26);
    const endRow = Math.min(map.height, startRow + 20);

    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            drawTile(x, y, map.tiles[y][x], playerData.currentMap);
        }
    }

    // Artifact markers -- unique sprites per artifact
    const regionArtifacts = artifacts[playerData.currentMap] || [];
    regionArtifacts.forEach(art => {
        const ax = art.x * TILE;
        const ay = art.y * TILE;
        const visited = playerData.visitedArtifacts.includes(art.id);
        const pulse = Math.sin(frameCount * 0.06 + art.x * 2) * 0.3 + 0.7;

        // Gold glow halo
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(ax + 16, ay + 16, 14 + Math.sin(frameCount * 0.08) * 2, 0, Math.PI * 2);
        ctx.fill();

        switch (art.id) {
            case 'artifact_monks': {
                // Small stone church/chapel
                ctx.fillStyle = '#9a8a6a';
                ctx.fillRect(ax + 6, ay + 10, 20, 18);
                ctx.fillStyle = '#8a7a5a';
                ctx.fillRect(ax + 4, ay + 6, 24, 6);
                // Peaked roof
                ctx.fillStyle = '#7a6a4a';
                ctx.fillRect(ax + 8, ay + 3, 16, 5);
                ctx.fillRect(ax + 12, ay + 1, 8, 4);
                // Cross on top
                ctx.fillStyle = PAL.gold;
                ctx.fillRect(ax + 14, ay - 4, 4, 6);
                ctx.fillRect(ax + 11, ay - 2, 10, 3);
                // Door
                ctx.fillStyle = '#4a3520';
                ctx.fillRect(ax + 13, ay + 18, 6, 10);
                break;
            }
            case 'artifact_geez': {
                // Book on a stand
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(ax + 12, ay + 20, 8, 10);
                ctx.fillRect(ax + 8, ay + 28, 16, 3);
                // Open book
                ctx.fillStyle = '#f0dbb8';
                ctx.fillRect(ax + 4, ay + 6, 12, 16);
                ctx.fillRect(ax + 17, ay + 6, 12, 16);
                // Spine
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(ax + 15, ay + 5, 3, 18);
                // Text lines
                ctx.fillStyle = '#2a1a0a';
                for (let l = 0; l < 3; l++) {
                    ctx.fillRect(ax + 6, ay + 9 + l * 4, 8, 1);
                    ctx.fillRect(ax + 19, ay + 9 + l * 4, 8, 1);
                }
                break;
            }
            case 'artifact_meskel': {
                // Bonfire / flame
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(ax + 8, ay + 22, 16, 4);
                ctx.fillRect(ax + 6, ay + 24, 20, 4);
                // Fire
                ctx.fillStyle = '#ff4500';
                ctx.fillRect(ax + 10, ay + 10, 12, 14);
                ctx.fillStyle = '#ff8c00';
                ctx.fillRect(ax + 12, ay + 6, 8, 14);
                ctx.fillStyle = '#ffdd00';
                ctx.fillRect(ax + 13, ay + 3, 6, 10);
                ctx.fillStyle = '#ffffaa';
                ctx.fillRect(ax + 14, ay + 2, 4, 6);
                // Sparks
                const spark1 = Math.sin(frameCount * 0.15) * 2;
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(ax + 10, ay + spark1, 2, 2);
                ctx.fillRect(ax + 20, ay + 2 - spark1, 2, 2);
                break;
            }
            case 'artifact_beta_giorgis': {
                // Cross carved into stone (top-down view)
                ctx.fillStyle = '#8a7a5a';
                ctx.fillRect(ax + 4, ay + 4, 24, 24);
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(ax + 6, ay + 6, 20, 20);
                // Cross shape carved out
                ctx.fillStyle = '#c4a060';
                ctx.fillRect(ax + 13, ay + 7, 6, 18);
                ctx.fillRect(ax + 9, ay + 11, 14, 6);
                // Gold cross detail
                ctx.fillStyle = PAL.gold;
                ctx.fillRect(ax + 15, ay + 10, 2, 10);
                ctx.fillRect(ax + 12, ay + 13, 8, 2);
                break;
            }
            case 'artifact_illuminated': {
                // Glowing scroll
                // Glow effect
                ctx.fillStyle = `rgba(255, 235, 180, ${pulse * 0.3})`;
                ctx.beginPath();
                ctx.arc(ax + 16, ay + 14, 10, 0, Math.PI * 2);
                ctx.fill();
                // Scroll body
                ctx.fillStyle = '#f0dbb8';
                ctx.fillRect(ax + 8, ay + 6, 16, 20);
                // Scroll rolls
                ctx.fillStyle = '#c8a878';
                ctx.fillRect(ax + 6, ay + 4, 20, 4);
                ctx.fillRect(ax + 6, ay + 24, 20, 4);
                // Colorful illumination marks
                ctx.fillStyle = '#8b0000';
                ctx.fillRect(ax + 10, ay + 10, 4, 4);
                ctx.fillStyle = '#1a3a8a';
                ctx.fillRect(ax + 16, ay + 10, 4, 4);
                ctx.fillStyle = PAL.gold;
                ctx.fillRect(ax + 10, ay + 16, 10, 2);
                ctx.fillStyle = '#2a6a2a';
                ctx.fillRect(ax + 12, ay + 20, 6, 2);
                break;
            }
            case 'artifact_theses_door': {
                // Wooden door
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(ax + 8, ay + 4, 16, 24);
                ctx.fillStyle = '#4a2a0a';
                ctx.fillRect(ax + 10, ay + 6, 12, 20);
                // Door planks line
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(ax + 15, ay + 6, 2, 20);
                // Iron hinges
                ctx.fillStyle = '#3a3a3a';
                ctx.fillRect(ax + 10, ay + 10, 6, 2);
                ctx.fillRect(ax + 10, ay + 18, 6, 2);
                // Door handle
                ctx.fillStyle = '#2a2a2a';
                ctx.fillRect(ax + 13, ay + 15, 2, 2);
                // Paper nailed to it
                ctx.fillStyle = '#f5f5dc';
                ctx.fillRect(ax + 12, ay + 8, 6, 8);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(ax + 14, ay + 7, 2, 2);
                // Arch
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(ax + 6, ay + 2, 20, 4);
                break;
            }
            case 'artifact_press': {
                // Wooden machine shape
                // Frame
                ctx.fillStyle = '#5a3a1a';
                ctx.fillRect(ax + 6, ay + 6, 4, 22);
                ctx.fillRect(ax + 22, ay + 6, 4, 22);
                ctx.fillRect(ax + 4, ay + 4, 24, 4);
                ctx.fillRect(ax + 4, ay + 26, 24, 4);
                // Screw/press mechanism
                ctx.fillStyle = '#6a6a6a';
                ctx.fillRect(ax + 14, ay + 6, 4, 10);
                // Handle
                ctx.fillStyle = '#7a5a3a';
                ctx.fillRect(ax + 10, ay + 5, 12, 3);
                // Paper
                ctx.fillStyle = '#f5f0dc';
                ctx.fillRect(ax + 11, ay + 18, 10, 8);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(ax + 13, ay + 20, 6, 1);
                ctx.fillRect(ax + 13, ay + 23, 5, 1);
                break;
            }
        }

        if (visited) {
            // Checkmark overlay (pixel drawn, not font)
            ctx.fillStyle = '#70d070';
            ctx.fillRect(ax + 10, ay + 2, 3, 3);
            ctx.fillRect(ax + 13, ay + 5, 3, 3);
            ctx.fillRect(ax + 16, ay + 2, 3, 3);
            ctx.fillRect(ax + 19, ay - 1, 3, 3);
            ctx.fillRect(ax + 22, ay - 4, 3, 3);
        }
    });

    // Warp indicators
    (map.warps || []).forEach(warp => {
        const wx = warp.x * TILE;
        const wy = warp.y * TILE;
        const pulse = Math.sin(frameCount * 0.08) * 0.3 + 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.3})`;
        ctx.fillRect(wx, wy, TILE, TILE);
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        const arrowDir = warp.target === 'aksum' ? -1 : 1;
        const arrowX = arrowDir > 0 ? wx + 24 : wx + 4;
        ctx.fillRect(arrowX, wy + 12, 8, 4);
    });

    // Draw NPCs
    const walkInterp = getNpcWalkInterp();
    map.npcs.forEach(npc => {
        // Use interpolated position if this NPC is currently walking
        let drawX = npc.x * TILE;
        let drawY = npc.y * TILE;
        let isWalking = false;
        if (walkInterp && walkInterp.npc === npc) {
            drawX = walkInterp.x * TILE;
            drawY = walkInterp.y * TILE;
            isWalking = true;
        }

        const bob = isWalking ? 0 : Math.sin(frameCount * 0.05 + npc.x * 3) * 2;

        // Spirit NPCs render translucent with ethereal glow
        if (npc.isSpirit) {
            const spiritPulse = Math.sin(frameCount * 0.04) * 0.15 + 0.55;
            ctx.globalAlpha = spiritPulse;
            // Ethereal glow beneath
            ctx.fillStyle = 'rgba(140, 100, 220, 0.25)';
            ctx.beginPath();
            ctx.arc(drawX + 16, drawY + 16, 18 + Math.sin(frameCount * 0.06) * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        drawPixelChar(drawX, drawY, npc.dir, true, npc.colors, bob, isWalking);
        if (npc.isSpirit) {
            ctx.globalAlpha = 1;
        }

        // Name tag
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = '7px "Press Start 2P"';
        const nameW = ctx.measureText(npc.name).width + 8;
        ctx.fillRect(drawX + 16 - nameW / 2, drawY - 8, nameW, 12);
        ctx.fillStyle = npc.isSpirit ? '#c0a0ff' : npc.isBoss ? '#ff8080' : npc.questGiver ? PAL.gold : '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, drawX + 16, drawY);
        ctx.textAlign = 'left';

        // Interaction indicator
        const dist = Math.abs(playerData.x - npc.x) + Math.abs(playerData.y - npc.y);
        if (dist <= 2) {
            const indicBob = Math.sin(frameCount * 0.1) * 4;
            ctx.fillStyle = npc.questGiver ? PAL.gold : '#ffffff';
            // Exclamation mark for quest giver, speech bubble for others
            if (npc.questGiver && !playerData.hasScroll) {
                ctx.font = '10px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText('!', npc.x * TILE + 16, npc.y * TILE - 14 + indicBob);
                ctx.textAlign = 'left';
            } else {
                ctx.fillRect(npc.x * TILE + 12, npc.y * TILE - 18 + indicBob, 8, 2);
                ctx.fillRect(npc.x * TILE + 14, npc.y * TILE - 16 + indicBob, 4, 4);
            }
        }
    });

    // Draw player
    const px = interpX * TILE;
    const py = interpY * TILE;
    const playerColors = { body: '#2050a0', skin: '#f0c8a0', hair: '#4a2010', legs: '#203060', shoes: '#402020', satchel: true };
    drawPixelChar(px, py, playerData.dir, false, playerColors, 0, playerData.moving);

    drawParticles();
    ctx.restore();

    drawHUD(map.name);
}

function drawHUD(mapName) {
    // Top bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 800, 36);
    ctx.fillStyle = PAL.gold;
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(mapName, 10, 24);

    // Level & XP
    ctx.fillStyle = '#a0a0d0';
    ctx.textAlign = 'right';
    ctx.fillText(`LV ${playerData.level}  XP ${playerData.xp}/${playerData.level * 50}`, 790, 24);

    // Score
    ctx.fillStyle = '#70d070';
    ctx.textAlign = 'center';
    ctx.fillText(`${playerData.correctAnswers}/${playerData.questionsAnswered} correct`, 400, 24);
    ctx.textAlign = 'left';

    // Quest tracker
    const bosses = playerData.defeatedBosses;
    const questY = 46;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(580, questY, 210, 60);
    ctx.strokeStyle = PAL.textBorder;
    ctx.strokeRect(580, questY, 210, 60);
    ctx.fillStyle = '#8888bb';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('SCROLL QUEST', 590, questY + 14);
    ctx.fillStyle = playerData.hasScroll ? '#70d070' : '#606080';
    ctx.fillText(playerData.hasScroll ? ' Scroll received' : ' Get scroll', 590, questY + 28);
    ctx.fillStyle = bosses.includes('quiz1') ? '#70d070' : '#606080';
    ctx.fillText(bosses.includes('quiz1') ? ' Aksum' : ' Aksum', 590, questY + 40);
    ctx.fillStyle = bosses.includes('quiz2') ? '#70d070' : '#606080';
    ctx.fillText(bosses.includes('quiz2') ? ' Lalibela' : ' Lalibela', 680, questY + 40);
    ctx.fillStyle = bosses.includes('quiz3') ? '#70d070' : '#606080';
    ctx.fillText(bosses.includes('quiz3') ? ' Luther' : ' Luther', 590, questY + 52);

    // Codex button hint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 46, 120, 20);
    ctx.strokeStyle = PAL.textBorder;
    ctx.strokeRect(10, 46, 120, 20);
    ctx.fillStyle = '#8888bb';
    ctx.font = '7px "Press Start 2P"';
    ctx.fillText('[C] CODEX', 20, 60);
}

// -- Codex / Index Overlay --
function drawCodex() {
    if (!codexOpen) return;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, 800, 600);

    // Main panel
    ctx.fillStyle = '#141428';
    ctx.fillRect(40, 30, 720, 540);
    ctx.strokeStyle = PAL.gold;
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 30, 720, 540);

    // Title
    ctx.fillStyle = PAL.gold;
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('CODEX', 400, 60);

    // Tabs
    const tabs = ['CHARACTERS', 'STORY & MISSION'];
    for (let t = 0; t < 2; t++) {
        const tx = 160 + t * 280;
        ctx.fillStyle = codexTab === t ? 'rgba(88, 88, 168, 0.6)' : 'rgba(40, 30, 70, 0.6)';
        ctx.fillRect(tx - 80, 72, 180, 24);
        if (codexTab === t) {
            ctx.strokeStyle = PAL.gold;
            ctx.lineWidth = 1;
            ctx.strokeRect(tx - 80, 72, 180, 24);
        }
        ctx.fillStyle = codexTab === t ? PAL.gold : '#6060a0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText(tabs[t], tx + 10, 88);
    }

    ctx.textAlign = 'left';

    // Clip content area
    ctx.save();
    ctx.beginPath();
    ctx.rect(50, 100, 700, 450);
    ctx.clip();

    if (codexTab === 0) {
        drawCodexCharacters();
    } else {
        drawCodexStory();
    }

    ctx.restore();

    // Controls hint
    ctx.fillStyle = '#505070';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('LEFT/RIGHT: Tab    UP/DOWN: Scroll    SPACE/C: Close', 400, 580);
    ctx.textAlign = 'left';
}

function drawCodexCharacters() {
    let y = 110 - codexScroll;

    codexCharacters.forEach((char, idx) => {
        if (y > 560 || y < 60) { y += 75; return; } // skip off-screen

        // Card background
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(40, 30, 70, 0.5)' : 'rgba(30, 25, 55, 0.5)';
        ctx.fillRect(60, y, 680, 68);
        ctx.strokeStyle = 'rgba(88, 88, 168, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(60, y, 680, 68);

        // Character sprite
        drawPixelChar(70, y + 16, 'down', true, char.colors, 0, false);

        // Name
        ctx.fillStyle = PAL.gold;
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText(char.name, 110, y + 18);

        // Location tag
        ctx.fillStyle = '#70a070';
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText(char.map, 110, y + 32);

        // Description
        ctx.fillStyle = '#b0b0d0';
        ctx.font = '7px "Press Start 2P"';
        wrapText(char.desc, 110, y + 48, 610, 14);

        y += 75;
    });

    // Max scroll
    const maxScroll = Math.max(0, codexCharacters.length * 75 - 420);
    if (codexScroll > maxScroll) codexScroll = maxScroll;
}

function drawCodexStory() {
    let y = 110 - codexScroll;

    codexStory.forEach((section, idx) => {
        if (y > 560 || y < 40) { y += 100; return; }

        // Section background
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(40, 30, 70, 0.5)' : 'rgba(30, 25, 55, 0.5)';
        ctx.fillRect(60, y, 680, 90);
        ctx.strokeStyle = 'rgba(88, 88, 168, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(60, y, 680, 90);

        // Title
        ctx.fillStyle = PAL.gold;
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText(section.title, 75, y + 20);

        // Text
        ctx.fillStyle = '#b0b0d0';
        ctx.font = '7px "Press Start 2P"';
        wrapText(section.text, 75, y + 40, 640, 14);

        y += 100;
    });

    const maxScroll = Math.max(0, codexStory.length * 100 - 420);
    if (codexScroll > maxScroll) codexScroll = maxScroll;
}

//  Dialogue System 
function startDialogue(lines, callback = null) {
    gameState = 'dialogue';
    currentDialogue = lines;
    dialogueIndex = 0;
    dialogueCharIndex = 0;
    dialogueTimer = 0;
    dialogueComplete = false;
    dialogueCallback = callback;
}

function updateDialogue() {
    if (!currentDialogue) return;

    const line = currentDialogue[dialogueIndex];
    if (!dialogueComplete) {
        dialogueTimer++;
        if (dialogueTimer % 2 === 0) {
            dialogueCharIndex++;
            if (dialogueCharIndex >= line.text.length) {
                dialogueComplete = true;
            }
        }
    }

    if (keyJustPressed(' ') || keyJustPressed('Enter') || keyJustPressed('z')) {
        if (!dialogueComplete) {
            dialogueCharIndex = line.text.length;
            dialogueComplete = true;
        } else {
            dialogueIndex++;
            if (dialogueIndex >= currentDialogue.length) {
                gameState = 'overworld';
                currentDialogue = null;
                if (dialogueCallback) {
                    dialogueCallback();
                    dialogueCallback = null;
                }
                return;
            }
            dialogueCharIndex = 0;
            dialogueTimer = 0;
            dialogueComplete = false;
        }
    }
}

function drawDialogue() {
    if (!currentDialogue) return;
    const line = currentDialogue[dialogueIndex];
    const displayText = line.text.substring(0, dialogueCharIndex);

    const boxY = 440;
    const boxH = 140;

    ctx.fillStyle = PAL.textBg;
    ctx.fillRect(20, boxY, 760, boxH);
    ctx.strokeStyle = PAL.textBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(20, boxY, 760, boxH);

    // Name plate
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = PAL.textBorder;
    const nameWidth = ctx.measureText(line.name).width + 30;
    ctx.fillRect(30, boxY - 16, nameWidth, 24);
    ctx.fillStyle = PAL.gold;
    ctx.fillText(line.name, 42, boxY);

    // Text
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '11px "Press Start 2P"';
    wrapText(displayText, 42, boxY + 30, 720, 22);

    // Continue indicator
    if (dialogueComplete) {
        const blinkOn = Math.floor(frameCount / 15) % 2 === 0;
        if (blinkOn) {
            ctx.fillStyle = PAL.gold;
            ctx.fillRect(740, boxY + boxH - 20, 8, 4);
            ctx.fillRect(744, boxY + boxH - 16, 4, 4);
        }
    }

    // Page indicator
    ctx.fillStyle = '#606090';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText(`${dialogueIndex + 1}/${currentDialogue.length}`, 760, boxY + boxH - 8);
    ctx.textAlign = 'left';
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line.trim(), x, currentY);
            line = word + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    });
    ctx.fillText(line.trim(), x, currentY);
}

function getWrappedLineCount(text, maxWidth, font) {
    ctx.font = font;
    const words = text.split(' ');
    let line = '';
    let lines = 1;
    words.forEach(word => {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
            line = word + ' ';
            lines++;
        } else {
            line = testLine;
        }
    });
    return lines;
}

//  Battle System 
function startBattle(quizKey) {
    const quiz = quizSets[quizKey];
    gameState = 'battleIntro';
    battleState = {
        quizKey,
        enemy: quiz.enemy,
        enemyColors: quiz.enemyColors,
        isBoss: quiz.isBoss || false,
        questions: [...quiz.questions],
        currentQuestion: 0,
        selectedAnswer: 0,
        playerHp: playerData.hp,
        playerMaxHp: playerData.maxHp,
        enemyHp: 100,
        enemyMaxHp: 100,
        phase: 'intro',
        introTimer: 0,
        resultTimer: 0,
        correct: false,
        showExplain: false,
        explainText: '',
        flashTimer: 0,
        won: false,
        battleLog: '',
        answerLocked: false
    };
}

function updateBattle() {
    if (!battleState) return;

    if (gameState === 'battleIntro') {
        battleState.introTimer++;
        if (battleState.introTimer > 90) {
            gameState = 'battle';
            battleState.phase = 'question';
        }
        return;
    }

    switch (battleState.phase) {
        case 'question':
            if (!battleState.answerLocked) {
                if (keyJustPressed('ArrowUp')) battleState.selectedAnswer = (battleState.selectedAnswer + 3) % 4;
                if (keyJustPressed('ArrowDown')) battleState.selectedAnswer = (battleState.selectedAnswer + 1) % 4;
                if (keyJustPressed('ArrowLeft')) battleState.selectedAnswer = battleState.selectedAnswer < 2 ? battleState.selectedAnswer + 2 : battleState.selectedAnswer - 2;
                if (keyJustPressed('ArrowRight')) battleState.selectedAnswer = battleState.selectedAnswer < 2 ? battleState.selectedAnswer + 2 : battleState.selectedAnswer - 2;
                if (keyJustPressed(' ') || keyJustPressed('Enter') || keyJustPressed('z')) {
                    const q = battleState.questions[battleState.currentQuestion];
                    battleState.correct = battleState.selectedAnswer === q.correct;
                    battleState.answerLocked = true;
                    battleState.phase = 'answered';
                    battleState.flashTimer = 30;
                    battleState.explainText = q.explain;
                    playerData.questionsAnswered++;

                    if (battleState.correct) {
                        playerData.correctAnswers++;
                        battleState.enemyHp -= battleState.isBoss ? 17 : 25;
                        playerData.xp += 15;
                        battleState.battleLog = 'SUPER EFFECTIVE! Your knowledge strikes true!';
                        screenShake = 8;
                        spawnParticles(580, 200, PAL.gold, 15);
                    } else {
                        battleState.playerHp -= 15;
                        playerData.hp = battleState.playerHp;
                        battleState.battleLog = 'Incorrect... You take damage!';
                        screenShake = 5;
                        spawnParticles(200, 350, '#ff4040', 10);
                    }
                }
            }
            break;

        case 'answered':
            battleState.flashTimer--;
            if (battleState.flashTimer <= 0) {
                battleState.phase = 'result';
                battleState.resultTimer = 0;
                battleState.showExplain = true;
            }
            break;

        case 'result':
            battleState.resultTimer++;
            if (keyJustPressed(' ') || keyJustPressed('Enter') || keyJustPressed('z')) {
                if (battleState.enemyHp <= 0) {
                    battleState.won = true;
                    playerData.defeatedBosses.push(battleState.quizKey);
                    playerData.xp += battleState.isBoss ? 100 : 50;
                    checkLevelUp();

                    if (battleState.isBoss) {
                        // Go to door opening sequence!
                        gameState = 'doorOpening';
                        doorOpenTimer = 0;
                        doorOpenPhase = 0;
                    } else {
                        gameState = 'victory';
                        battleState.resultTimer = 0;
                    }
                } else if (battleState.playerHp <= 0) {
                    playerData.hp = playerData.maxHp;
                    battleState = null;
                    gameState = 'overworld';
                    startDialogue([{ name: 'System', text: 'You were defeated... Study more and try again!' }]);
                } else {
                    battleState.currentQuestion++;
                    if (battleState.currentQuestion >= battleState.questions.length) {
                        battleState.currentQuestion = 0;
                        battleState.questions.forEach(q => {
                            const correctText = q.options[q.correct];
                            for (let i = q.options.length - 1; i > 0; i--) {
                                const j = Math.floor(Math.random() * (i + 1));
                                [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
                            }
                            q.correct = q.options.indexOf(correctText);
                        });
                    }
                    battleState.selectedAnswer = 0;
                    battleState.phase = 'question';
                    battleState.answerLocked = false;
                    battleState.showExplain = false;
                    battleState.battleLog = '';
                }
            }
            break;
    }
}

function drawBattle() {
    if (!battleState) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#1a1030');
    bgGrad.addColorStop(1, '#0a0820');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Battle floor lines
    ctx.fillStyle = 'rgba(80, 60, 120, 0.3)';
    for (let i = 0; i < 20; i++) {
        const lineY = 300 + i * 15 + Math.sin(frameCount * 0.02 + i) * 3;
        ctx.fillRect(0, lineY, 800, 2);
    }

    // Energy particles
    for (let i = 0; i < 15; i++) {
        const px = (i * 57 + frameCount * 1.5) % 800;
        const py = 200 + Math.sin(frameCount * 0.03 + i * 2) * 100;
        ctx.fillStyle = `rgba(150, 100, 255, ${0.3 + Math.sin(frameCount * 0.05 + i) * 0.2})`;
        ctx.fillRect(px, py, 3, 3);
    }

    if (gameState === 'battleIntro') {
        const progress = battleState.introTimer / 90;
        const slideIn = Math.min(1, progress * 2);

        const enemyX = 800 - slideIn * 250;
        drawPixelChar(enemyX, 120, 'left', true, battleState.enemyColors, Math.sin(frameCount * 0.05) * 3, false);

        const playerX = -50 + slideIn * 200;
        drawPixelChar(playerX, 300, 'right', false, { body: '#2050a0', skin: '#f0c8a0', hair: '#4a2010', legs: '#203060', shoes: '#402020', satchel: true }, 0, false);

        if (progress > 0.5) {
            const scale = Math.min(1, (progress - 0.5) * 4);
            ctx.save();
            ctx.translate(400, 240);
            ctx.scale(scale, scale);
            ctx.fillStyle = PAL.gold;
            ctx.font = '40px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('VS', 0, 15);
            ctx.restore();
        }

        if (progress > 0.3) {
            ctx.fillStyle = battleState.isBoss ? '#ff4040' : PAL.purple;
            ctx.font = battleState.isBoss ? '16px "Press Start 2P"' : '12px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(battleState.enemy, 400, 80);
            if (battleState.isBoss) {
                ctx.fillStyle = PAL.gold;
                ctx.font = '10px "Press Start 2P"';
                ctx.fillText(' FINAL BOSS ', 400, 100);
            }
        }
        ctx.textAlign = 'left';
        return;
    }

    ctx.save();
    if (screenShake > 0) {
        ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
    }

    // Enemy platform
    ctx.fillStyle = 'rgba(100, 80, 150, 0.4)';
    ctx.beginPath();
    ctx.ellipse(580, 220, 80, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    const enemyBob = Math.sin(frameCount * 0.05) * 3;
    const enemyShake = battleState.phase === 'answered' && battleState.correct && battleState.flashTimer > 15 ? (Math.random() - 0.5) * 10 : 0;
    if (battleState.enemyHp > 0) {
        drawPixelChar(560 + enemyShake, 140 + enemyBob, 'left', true, battleState.enemyColors, 0, false);
    }

    // Player platform
    ctx.fillStyle = 'rgba(50, 80, 150, 0.4)';
    ctx.beginPath();
    ctx.ellipse(200, 400, 80, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    const playerShake = battleState.phase === 'answered' && !battleState.correct && battleState.flashTimer > 15 ? (Math.random() - 0.5) * 8 : 0;
    drawPixelChar(180 + playerShake, 320, 'right', false, { body: '#2050a0', skin: '#f0c8a0', hair: '#4a2010', legs: '#203060', shoes: '#402020', satchel: true }, 0, false);

    ctx.restore();

    // HP bars
    drawHpBar(480, 80, 250, 'Enemy', battleState.enemyHp, battleState.enemyMaxHp, battleState.enemy);
    drawHpBar(20, 350, 250, 'You', battleState.playerHp, battleState.playerMaxHp, playerData.name);

    // Battle log
    if (battleState.battleLog) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(20, 280, 760, 30);
        ctx.fillStyle = battleState.correct ? '#70ff70' : '#ff7070';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(battleState.battleLog, 400, 300);
        ctx.textAlign = 'left';
    }

    // Question area
    if (battleState.phase === 'question' || battleState.phase === 'answered') {
        const q = battleState.questions[battleState.currentQuestion];

        // Pre-calculate layout to determine total height needed
        ctx.font = '8px "Press Start 2P"';
        const answerBoxes = [];
        for (let i = 0; i < 4; i++) {
            const answerText = `${['A', 'B', 'C', 'D'][i]}. ${q.options[i]}`;
            ctx.font = '8px "Press Start 2P"';
            const needsWrap = ctx.measureText(answerText).width > 320;
            answerBoxes.push({ text: answerText, needsWrap });
        }
        const row0Needs2 = answerBoxes[0].needsWrap || answerBoxes[2].needsWrap;
        const row0H = row0Needs2 ? 38 : 26;
        const row1Needs2 = answerBoxes[1].needsWrap || answerBoxes[3].needsWrap;
        const row1H = row1Needs2 ? 38 : 26;

        ctx.font = '10px "Press Start 2P"';
        const qLines = getWrappedLineCount(q.q, 720, '10px "Press Start 2P"');
        const totalAnswerH = row0H + 6 + row1H;
        const totalContentH = qLines * 18 + 10 + totalAnswerH + 30;
        const boxY = 600 - totalContentH;
        const boxH = totalContentH;

        ctx.fillStyle = 'rgba(20, 15, 40, 0.95)';
        ctx.fillRect(20, boxY, 760, boxH);
        ctx.strokeStyle = PAL.textBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(20, boxY, 760, boxH);

        ctx.fillStyle = '#e0e0ff';
        ctx.font = '10px "Press Start 2P"';
        const qStartY = boxY + 24;
        wrapText(q.q, 40, qStartY, 720, 18);

        const answerBaseY = qStartY + qLines * 18 + 10;

        for (let i = 0; i < 4; i++) {
            const col = i < 2 ? 0 : 1;
            const row = i % 2;
            const ax = 40 + col * 370;
            const ay = answerBaseY + (row === 0 ? 0 : row0H + 6);
            const bH = row === 0 ? row0H : row1H;

            let bgColor = 'rgba(40, 30, 70, 0.8)';
            let textColor = '#c0c0e0';

            if (battleState.phase === 'answered') {
                if (i === q.correct) {
                    bgColor = 'rgba(0, 150, 0, 0.6)';
                    textColor = '#70ff70';
                } else if (i === battleState.selectedAnswer && !battleState.correct) {
                    bgColor = 'rgba(150, 0, 0, 0.6)';
                    textColor = '#ff7070';
                }
            } else if (i === battleState.selectedAnswer) {
                bgColor = 'rgba(80, 60, 150, 0.8)';
                textColor = PAL.gold;
            }

            ctx.fillStyle = bgColor;
            ctx.fillRect(ax - 5, ay - 12, 350, bH);

            if (i === battleState.selectedAnswer && battleState.phase === 'question') {
                ctx.strokeStyle = PAL.gold;
                ctx.strokeRect(ax - 5, ay - 12, 350, bH);
            }

            ctx.fillStyle = textColor;
            ctx.font = '8px "Press Start 2P"';
            const answerText = answerBoxes[i].text;
            if (answerBoxes[i].needsWrap) {
                const words = answerText.split(' ');
                let line1 = '';
                let line2 = '';
                let onLine2 = false;
                for (const word of words) {
                    const test = line1 + (line1 ? ' ' : '') + word;
                    ctx.font = '8px "Press Start 2P"';
                    if (!onLine2 && ctx.measureText(test).width <= 320) {
                        line1 = test;
                    } else {
                        onLine2 = true;
                        line2 += (line2 ? ' ' : '') + word;
                    }
                }
                ctx.fillText(line1, ax + 5, ay + 4, 338);
                if (line2) ctx.fillText(line2, ax + 5, ay + 18, 338);
            } else {
                ctx.fillText(answerText, ax + 5, ay + (bH > 26 ? 8 : 4), 338);
            }
        }

        ctx.fillStyle = '#606090';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText(`Q${battleState.currentQuestion + 1}/${battleState.questions.length}`, 770, boxY + 16);
        ctx.textAlign = 'left';
    }

    // Explanation
    if (battleState.showExplain && battleState.phase === 'result') {
        ctx.fillStyle = 'rgba(20, 15, 40, 0.95)';
        ctx.fillRect(20, 420, 760, 175);
        ctx.strokeStyle = battleState.correct ? '#30a030' : '#a03030';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 420, 760, 175);

        ctx.fillStyle = battleState.correct ? '#70ff70' : '#ff7070';
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(battleState.correct ? ' CORRECT!' : ' INCORRECT!', 40, 460);

        ctx.fillStyle = '#c0c0e0';
        ctx.font = '9px "Press Start 2P"';
        wrapText(battleState.explainText, 40, 490, 720, 18);

        if (Math.floor(frameCount / 20) % 2 === 0) {
            ctx.fillStyle = '#8080b0';
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('Press SPACE to continue', 400, 580);
            ctx.textAlign = 'left';
        }
    }

    drawParticles();
}

function drawHpBar(x, y, width, label, hp, maxHp, name) {
    ctx.fillStyle = 'rgba(20, 15, 40, 0.85)';
    ctx.fillRect(x, y, width + 20, 50);
    ctx.strokeStyle = '#4040a0';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width + 20, 50);

    ctx.fillStyle = '#e0e0ff';
    ctx.font = '9px "Press Start 2P"';
    ctx.fillText(name, x + 10, y + 16);

    ctx.fillStyle = '#202040';
    ctx.fillRect(x + 10, y + 24, width - 10, 12);

    const hpRatio = Math.max(0, hp / maxHp);
    const hpColor = hpRatio > 0.5 ? PAL.hpGreen : hpRatio > 0.25 ? PAL.hpYellow : PAL.hpRed;
    ctx.fillStyle = hpColor;
    ctx.fillRect(x + 10, y + 24, (width - 10) * hpRatio, 12);

    ctx.fillStyle = '#fff';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, hp)}/${maxHp}`, x + width + 5, y + 44);
    ctx.textAlign = 'left';
}

//  Victory Screen (non-boss) 
function drawVictory() {
    if (!battleState) return;

    ctx.fillStyle = '#0a0820';
    ctx.fillRect(0, 0, 800, 600);

    for (let i = 0; i < 30; i++) {
        const sx = (i * 27 + frameCount * 2) % 800;
        const sy = (i * 43 + frameCount * 1) % 600;
        const bright = Math.sin(frameCount * 0.1 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${bright})`;
        ctx.fillRect(sx, sy, 3, 3);
    }

    battleState.resultTimer++;
    const t = Math.min(1, battleState.resultTimer / 60);

    ctx.fillStyle = PAL.gold;
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', 400, 80 * t + 60);

    ctx.fillStyle = '#c0c0e0';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillText(`${battleState.enemy} defeated!`, 400, 160);

    ctx.fillStyle = PAL.xpBlue;
    ctx.font = '14px "Press Start 2P"';
    ctx.fillText(`+${battleState.isBoss ? 100 : 50} XP`, 400, 220);

    ctx.fillStyle = '#a0a0d0';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText(`Level: ${playerData.level}`, 400, 280);
    ctx.fillText(`Total Correct: ${playerData.correctAnswers}/${playerData.questionsAnswered}`, 400, 310);

    ctx.fillStyle = PAL.gold;
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('KEY LEARNING:', 400, 370);

    ctx.fillStyle = '#c0c0e0';
    ctx.font = '9px "Press Start 2P"';
    const learnings = {
        quiz1: 'Ethiopian Christianity practiced communion in\nboth kinds, married clergy, and vernacular\nScripture for centuries before Luther.',
        quiz2: 'Michael the Deacon\'s 1534 visit to Luther\nproved Ethiopian Christianity could thrive\nwithout a Pope, indulgences, or Purgatory.'
    };
    const lines = (learnings[battleState.quizKey] || '').split('\n');
    lines.forEach((line, i) => {
        ctx.fillText(line, 400, 400 + i * 20);
    });

    // Next area hint
    if (battleState.resultTimer > 60) {
        ctx.fillStyle = '#70d070';
        ctx.font = '10px "Press Start 2P"';
        const hints = {
            quiz1: 'The path to Lalibela is now open! ',
            quiz2: 'The road to Wittenberg awaits! '
        };
        ctx.fillText(hints[battleState.quizKey] || '', 400, 480);
    }

    if (battleState.resultTimer > 60 && Math.floor(frameCount / 20) % 2 === 0) {
        ctx.fillStyle = '#8080b0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('Press SPACE to continue', 400, 560);
    }

    ctx.textAlign = 'left';

    if (battleState.resultTimer > 60 && (keyJustPressed(' ') || keyJustPressed('Enter'))) {
        battleState = null;
        gameState = 'overworld';
        playerData.hp = playerData.maxHp;
    }

    drawParticles();
}

//  Diploma Screen 
function updateDiploma() {
    diplomaTimer++;

    if (diplomaPhase === 0 && diplomaTimer > 60) {
        diplomaPhase = 1; // Scroll unrolling
    }
    if (diplomaPhase === 1 && diplomaTimer > 120) {
        diplomaPhase = 2; // Text appearing
    }
    if (diplomaPhase === 2 && diplomaTimer > 240) {
        diplomaPhase = 3; // Fully visible
    }
}

function drawDiploma() {
    // Grand background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#0a0820');
    bgGrad.addColorStop(0.5, '#1a1040');
    bgGrad.addColorStop(1, '#0a0820');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Celebration particles
    if (frameCount % 5 === 0 && diplomaPhase >= 1) {
        spawnParticles(Math.random() * 800, -10, ['#ffd700', '#ff4040', '#4040ff', '#40ff40'][Math.floor(Math.random() * 4)], 3);
    }

    // Stars
    for (let i = 0; i < 40; i++) {
        const sx = (i * 21 + frameCount * 0.8) % 800;
        const sy = (i * 17 + frameCount * 0.3) % 600;
        const bright = Math.sin(frameCount * 0.08 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 215, 0, ${bright * 0.7})`;
        ctx.fillRect(sx, sy, 3, 3);
    }

    ctx.textAlign = 'center';

    if (diplomaPhase === 0) {
        // Luther presenting
        ctx.fillStyle = PAL.gold;
        ctx.font = '16px "Press Start 2P"';
        const alpha = Math.min(1, diplomaTimer / 40);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.fillText('Martin Luther says:', 400, 200);
        ctx.fillStyle = `rgba(224, 224, 240, ${alpha})`;
        ctx.font = '11px "Press Start 2P"';
        ctx.fillText('"Young Scholar, you have proven yourself worthy!"', 400, 250);
        ctx.fillText('"I present to you this diploma..."', 400, 280);
    }

    if (diplomaPhase >= 1) {
        // Diploma parchment
        const unrollProgress = Math.min(1, (diplomaTimer - 60) / 60);
        const diplomaH = 420 * unrollProgress;
        const diplomaW = 520;
        const dx = 400 - diplomaW / 2;
        const dy = 60;

        // Parchment shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(dx + 6, dy + 6, diplomaW, diplomaH);

        // Parchment body
        const parchGrad = ctx.createLinearGradient(dx, dy, dx + diplomaW, dy + diplomaH);
        parchGrad.addColorStop(0, '#f5e6c8');
        parchGrad.addColorStop(0.5, '#faf0dc');
        parchGrad.addColorStop(1, '#f0dbb8');
        ctx.fillStyle = parchGrad;
        ctx.fillRect(dx, dy, diplomaW, diplomaH);

        // Parchment border
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 4;
        ctx.strokeRect(dx, dy, diplomaW, diplomaH);

        // Inner border
        ctx.strokeStyle = '#c8a050';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx + 10, dy + 10, diplomaW - 20, diplomaH - 20);

        // Corner decorations
        if (diplomaH > 100) {
            const corners = [[dx + 15, dy + 15], [dx + diplomaW - 25, dy + 15], [dx + 15, dy + diplomaH - 25], [dx + diplomaW - 25, dy + diplomaH - 25]];
            corners.forEach(([cx, cy]) => {
                if (cy < dy + diplomaH - 10) {
                    ctx.fillStyle = PAL.gold;
                    ctx.fillRect(cx, cy, 10, 10);
                    ctx.fillStyle = '#b8960a';
                    ctx.fillRect(cx + 2, cy + 2, 6, 6);
                }
            });
        }

        // Top scroll roll
        ctx.fillStyle = '#d4b68a';
        ctx.fillRect(dx - 10, dy - 8, diplomaW + 20, 16);
        ctx.fillStyle = '#c4a67a';
        ctx.fillRect(dx - 10, dy - 4, diplomaW + 20, 8);

        // Bottom scroll roll
        if (unrollProgress >= 1) {
            ctx.fillStyle = '#d4b68a';
            ctx.fillRect(dx - 10, dy + diplomaH - 8, diplomaW + 20, 16);
            ctx.fillStyle = '#c4a67a';
            ctx.fillRect(dx - 10, dy + diplomaH - 4, diplomaW + 20, 8);
        }
    }

    if (diplomaPhase >= 2) {
        const textAlpha = Math.min(1, (diplomaTimer - 120) / 60);
        const dx = 400;
        const dy = 60;

        ctx.globalAlpha = textAlpha;

        // Ethiopian cross at top
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(dx - 3, dy + 25, 6, 30);
        ctx.fillRect(dx - 12, dy + 35, 24, 6);

        // Diploma text
        ctx.fillStyle = '#2a1a0a';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('CERTIFICATE OF', dx, dy + 80);
        ctx.fillText('KNOWLEDGE', dx, dy + 105);

        ctx.fillStyle = '#4a3020';
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText('This diploma is presented to', dx, dy + 140);

        ctx.fillStyle = '#8b0000';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText('THE YOUNG SCHOLAR', dx, dy + 170);

        ctx.fillStyle = '#4a3020';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('For successfully completing the quest to', dx, dy + 200);
        ctx.fillText('deliver the Sacred Scroll from Ethiopia', dx, dy + 218);
        ctx.fillText('to Wittenberg and demonstrating mastery of', dx, dy + 236);

        ctx.fillStyle = '#2a1a0a';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('Ethiopian Christianity &', dx, dy + 264);
        ctx.fillText('the Protestant Reformation', dx, dy + 284);

        // Stats box
        const pct = playerData.questionsAnswered > 0 ? Math.round(playerData.correctAnswers / playerData.questionsAnswered * 100) : 0;
        ctx.fillStyle = '#4a3020';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText(`Score: ${playerData.correctAnswers}/${playerData.questionsAnswered} (${pct}%)`, dx, dy + 310);
        ctx.fillText(`Level: ${playerData.level}   XP: ${playerData.xp + playerData.level * 50}`, dx, dy + 328);

        // Grade
        let grade = 'F';
        if (pct >= 95) grade = 'A+';
        else if (pct >= 90) grade = 'A';
        else if (pct >= 80) grade = 'B';
        else if (pct >= 70) grade = 'C';
        else if (pct >= 60) grade = 'D';
        ctx.fillStyle = pct >= 90 ? '#2a6a2a' : pct >= 70 ? '#4a3020' : '#8b0000';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(`Grade: ${grade}`, dx, dy + 355);

        // Divider line
        ctx.strokeStyle = '#c8a050';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx - 230, dy + 370);
        ctx.lineTo(dx + 230, dy + 370);
        ctx.stroke();

        // Seal (bottom left)
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(dx - 140, dy + 395, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a01010';
        ctx.beginPath();
        ctx.arc(dx - 140, dy + 395, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = PAL.gold;
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText('SEAL', dx - 140, dy + 398);

        // Luther's signature (bottom right)
        ctx.fillStyle = '#1a0a0a';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'right';
        ctx.fillText('Martin Luther', dx + 200, dy + 390);
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText('Wittenberg, 1534', dx + 200, dy + 405);
        ctx.textAlign = 'left';

        ctx.globalAlpha = 1;
    }

    if (diplomaPhase === 3) {
        // Congratulations message below diploma
        ctx.fillStyle = PAL.gold;
        ctx.font = '12px "Press Start 2P"';
        const congBob = Math.sin(frameCount * 0.05) * 3;
        ctx.fillText('QUEST COMPLETE!', 400, 510 + congBob);

        ctx.fillStyle = '#a0a0d0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('Ethiopian Christianity was the forerunner', 400, 538);
        ctx.fillText('of the European Reformation.', 400, 554);

        if (Math.floor(frameCount / 25) % 2 === 0) {
            ctx.fillStyle = '#8080b0';
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText('Press SPACE to continue', 400, 575);
        }

        if (keyJustPressed(' ') || keyJustPressed('Enter')) {
            diplomaPhase = 4;
            diplomaTimer = 0;
        }
    }

    if (diplomaPhase === 4) {
        // Further Reading page
        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = PAL.gold;
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('FURTHER READING', 400, 60);

        ctx.strokeStyle = '#c8a050';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(200, 72);
        ctx.lineTo(600, 72);
        ctx.stroke();

        ctx.fillStyle = '#c0c0e0';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('To learn more about Ethiopian Christianity', 400, 100);
        ctx.fillText('and the Protestant Reformation:', 400, 118);

        ctx.textAlign = 'left';
        ctx.font = '7px "Press Start 2P"';
        let readingY = 160;
        furtherReading.forEach((source, idx) => {
            ctx.fillStyle = '#a0a0d0';
            ctx.fillText((idx + 1) + '.', 100, readingY);
            ctx.fillStyle = '#d0d0e0';
            // Wrap long titles
            const lines = [];
            const words = source.split(' ');
            let line = '';
            words.forEach(word => {
                const test = line + (line ? ' ' : '') + word;
                if (ctx.measureText(test).width > 560 && line) {
                    lines.push(line);
                    line = word;
                } else {
                    line = test;
                }
            });
            if (line) lines.push(line);
            lines.forEach((l, li) => {
                ctx.fillText(l, 130, readingY + li * 16);
            });
            readingY += lines.length * 16 + 12;
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#8888bb';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('Thank you for playing Reformers Quest!', 400, 500);

        if (Math.floor(frameCount / 25) % 2 === 0) {
            ctx.fillStyle = '#8080b0';
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText('Press SPACE to play again', 400, 560);
        }

        if (keyJustPressed(' ') || keyJustPressed('Enter')) {
            resetGame();
            gameState = 'title';
        }
    }

    ctx.textAlign = 'left';
    drawParticles();
}

//  Door Opening Sequence (after beating Luther) 
function updateDoorOpening() {
    doorOpenTimer++;

    if (doorOpenPhase === 0 && doorOpenTimer > 10) {
        // Luther's speech auto-advances
    }
    if (doorOpenPhase === 0 && (keyJustPressed(' ') || keyJustPressed('Enter') || doorOpenTimer > 180)) {
        doorOpenPhase = 1; // Doors start opening
        doorOpenTimer = 0;
    }
    if (doorOpenPhase === 1 && doorOpenTimer > 120) {
        doorOpenPhase = 2; // Walk through prompt
        doorOpenTimer = 0;
    }
    if (doorOpenPhase === 2 && (keyJustPressed(' ') || keyJustPressed('Enter'))) {
        // Transition to library
        doorOpenPhase = 3;
        doorOpenTimer = 0;
    }
    if (doorOpenPhase === 3) {
        doorOpenTimer++;
        if (doorOpenTimer > 60) {
            // Enter library map
            playerData.currentMap = 'library';
            playerData.x = 12;
            playerData.y = 16;
            playerData.targetX = 12;
            playerData.targetY = 16;
            playerData.dir = 'up';
            gameState = 'overworld';
            battleState = null;
            playerData.hp = playerData.maxHp;
            // Reset elder dialogue so player can interact
        }
    }
}

function drawDoorOpening() {
    // Dark grand hall background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#0a0820');
    bgGrad.addColorStop(0.5, '#1a1040');
    bgGrad.addColorStop(1, '#0a0820');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 600);

    // Torch particles
    if (frameCount % 3 === 0) {
        spawnParticles(150, 200, '#ff8c00', 2);
        spawnParticles(650, 200, '#ff8c00', 2);
    }

    // Torches on walls
    for (const tx of [130, 670]) {
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(tx, 180, 8, 30);
        ctx.fillStyle = '#ff8c00';
        const flick = Math.sin(frameCount * 0.2 + tx) * 3;
        ctx.fillRect(tx - 2, 168 + flick, 12, 12);
        ctx.fillStyle = '#ffdd00';
        ctx.fillRect(tx, 170 + flick, 8, 6);
    }

    ctx.textAlign = 'center';

    // Luther sprite at center
    drawPixelChar(380, 280, 'down', true, { body: '#1a1a1a', skin: '#f0c8a0', hair: '#3a2a1a', legs: '#1a1a1a', shoes: '#0a0a0a', scroll: true }, Math.sin(frameCount * 0.04) * 2, false);

    // Grand doors behind Luther
    const doorY = 80;
    const doorH = 220;
    const doorCenterX = 400;

    if (doorOpenPhase === 0) {
        // Doors closed
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(doorCenterX - 80, doorY, 75, doorH);
        ctx.fillRect(doorCenterX + 5, doorY, 75, doorH);
        // Door frame
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 4;
        ctx.strokeRect(doorCenterX - 84, doorY - 4, 168, doorH + 8);
        // Arch
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(doorCenterX - 84, doorY - 20, 168, 20);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(doorCenterX - 60, doorY - 14, 120, 10);
        // Door handles
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(doorCenterX - 15, doorY + doorH / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(doorCenterX + 15, doorY + doorH / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Luther's speech
        const alpha = Math.min(1, doorOpenTimer / 40);
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('Martin Luther:', doorCenterX, 360);
        ctx.fillStyle = `rgba(224, 224, 240, ${alpha})`;
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('"You have mastered the journey', doorCenterX, 400);
        ctx.fillText('of the Reformation!"', doorCenterX, 425);
        ctx.fillStyle = `rgba(160, 160, 200, ${alpha})`;
        ctx.font = '9px "Press Start 2P"';
        ctx.fillText('"Now proceed to your prize..."', doorCenterX, 460);

        if (doorOpenTimer > 60 && Math.floor(frameCount / 20) % 2 === 0) {
            ctx.fillStyle = '#8080b0';
            ctx.font = '8px "Press Start 2P"';
            ctx.fillText('Press SPACE', doorCenterX, 540);
        }
    } else if (doorOpenPhase >= 1) {
        // Doors opening animation
        const openProgress = doorOpenPhase === 1 ? Math.min(1, doorOpenTimer / 100) : 1;
        const leftDoorX = doorCenterX - 80 - openProgress * 80;
        const rightDoorX = doorCenterX + 5 + openProgress * 80;

        // Light behind doors
        const lightAlpha = openProgress * 0.6;
        const lightGrad = ctx.createRadialGradient(doorCenterX, doorY + doorH / 2, 10, doorCenterX, doorY + doorH / 2, 200);
        lightGrad.addColorStop(0, `rgba(255, 235, 180, ${lightAlpha})`);
        lightGrad.addColorStop(1, `rgba(255, 200, 100, 0)`);
        ctx.fillStyle = lightGrad;
        ctx.fillRect(doorCenterX - 80, doorY, 160, doorH);

        // Library preview through door
        if (openProgress > 0.3) {
            const previewAlpha = (openProgress - 0.3) * 1.4;
            ctx.globalAlpha = previewAlpha;
            // Bookshelves visible through door
            const shelfW = 160 * openProgress;
            ctx.fillStyle = '#5a3a1a';
            ctx.fillRect(doorCenterX - shelfW / 2, doorY + 10, shelfW, doorH - 20);
            ctx.fillStyle = '#4a2a0a';
            for (let sy = 0; sy < 5; sy++) {
                ctx.fillRect(doorCenterX - shelfW / 2, doorY + 15 + sy * 40, shelfW, 2);
                // Books
                const bookCols = ['#8b0000', '#1a3a6a', '#2a6a2a', '#6a2a6a', '#b8860b'];
                for (let bx = 0; bx < shelfW / 8; bx++) {
                    ctx.fillStyle = bookCols[bx % bookCols.length];
                    ctx.fillRect(doorCenterX - shelfW / 2 + bx * 8 + 1, doorY + 17 + sy * 40, 6, 18);
                }
            }
            // Red carpet leading in
            ctx.fillStyle = '#8b1a1a';
            ctx.fillRect(doorCenterX - 20, doorY + doorH - 40, 40, 40);
            ctx.fillStyle = '#c8a040';
            ctx.fillRect(doorCenterX - 20, doorY + doorH - 40, 2, 40);
            ctx.fillRect(doorCenterX + 18, doorY + doorH - 40, 2, 40);
            ctx.globalAlpha = 1;
        }

        // Door frame
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 4;
        ctx.strokeRect(doorCenterX - 84, doorY - 4, 168, doorH + 8);
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(doorCenterX - 84, doorY - 20, 168, 20);
        ctx.fillStyle = PAL.gold;
        ctx.fillRect(doorCenterX - 60, doorY - 14, 120, 10);

        // Left door
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(leftDoorX, doorY, 75, doorH);
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(leftDoorX + 65, doorY + doorH / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Right door
        ctx.fillStyle = '#4a2a0a';
        ctx.fillRect(rightDoorX, doorY, 75, doorH);
        ctx.fillStyle = PAL.gold;
        ctx.beginPath();
        ctx.arc(rightDoorX + 10, doorY + doorH / 2, 6, 0, Math.PI * 2);
        ctx.fill();
    }

    if (doorOpenPhase === 2) {
        ctx.fillStyle = PAL.gold;
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText('The Scholar\'s Hall awaits...', doorCenterX, 380);

        if (Math.floor(frameCount / 20) % 2 === 0) {
            ctx.fillStyle = '#8080b0';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('Press SPACE to enter', doorCenterX, 540);
        }
    }

    if (doorOpenPhase === 3) {
        // Fade to white
        const fadeAlpha = Math.min(1, doorOpenTimer / 50);
        ctx.fillStyle = `rgba(255, 235, 180, ${fadeAlpha})`;
        ctx.fillRect(0, 0, 800, 600);
    }

    ctx.textAlign = 'left';
    drawParticles();
}

function checkLevelUp() {
    const xpNeeded = playerData.level * 50;
    while (playerData.xp >= xpNeeded) {
        playerData.xp -= xpNeeded;
        playerData.level++;
        playerData.maxHp += 10;
        playerData.hp = playerData.maxHp;
        playerData.wisdom += 5;
        spawnParticles(400, 300, PAL.gold, 30);
    }
}

//  Map Transitions 
function startMapTransition(targetMap, tx, ty) {
    gameState = 'mapTransition';
    mapTransitionAlpha = 0;
    mapTransitionDir = 1;
    mapTransitionTarget = { map: targetMap, x: tx, y: ty };
}

function updateMapTransition() {
    mapTransitionAlpha += mapTransitionDir * 0.04;
    if (mapTransitionAlpha >= 1 && mapTransitionDir === 1) {
        playerData.currentMap = mapTransitionTarget.map;
        playerData.x = mapTransitionTarget.x;
        playerData.y = mapTransitionTarget.y;
        playerData.targetX = playerData.x;
        playerData.targetY = playerData.y;
        mapTransitionDir = -1;
    }
    if (mapTransitionAlpha <= 0 && mapTransitionDir === -1) {
        mapTransitionAlpha = 0;
        gameState = 'overworld';
    }
}

function drawMapTransition() {
    drawOverworld();
    ctx.fillStyle = `rgba(0, 0, 0, ${mapTransitionAlpha})`;
    ctx.fillRect(0, 0, 800, 600);

    if (mapTransitionAlpha > 0.5 && mapTransitionTarget) {
        ctx.fillStyle = `rgba(255, 215, 0, ${(mapTransitionAlpha - 0.5) * 2})`;
        ctx.font = '14px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(maps[mapTransitionTarget.map].name, 400, 290);

        // Flavor text for each area
        ctx.fillStyle = `rgba(160, 160, 200, ${(mapTransitionAlpha - 0.5) * 2})`;
        ctx.font = '9px "Press Start 2P"';
        const flavors = {
            aksum: 'The ancient heart of Ethiopian Christianity...',
            lalibela: 'Where churches are carved from living rock...',
            wittenberg: 'Where a monk dared to challenge the world...',
            library: 'The Scholar\'s Hall --your prize awaits...'
        };
        ctx.fillText(flavors[mapTransitionTarget.map] || '', 400, 320);
        ctx.textAlign = 'left';
    }
}

//  Reset Game 
function resetGame() {
    playerData = {
        x: 5, y: 8,
        dir: 'down',
        moving: false,
        moveProgress: 0,
        targetX: 5, targetY: 8,
        xp: 0,
        level: 1,
        hp: 100,
        maxHp: 100,
        wisdom: 10,
        questionsAnswered: 0,
        correctAnswers: 0,
        defeatedBosses: [],
        inventory: [],
        currentMap: 'aksum',
        name: 'Young Scholar',
        hasScroll: false,
        visitedArtifacts: [],
        talkedToNpcs: []
    };
    activeArtifact = null;
    battleState = null;
    currentDialogue = null;
    npcWalkSequence = null;
    spiritHintIndex = {};
    titleSelection = 0;
    titleBlink = 0;
    diplomaTimer = 0;
    diplomaPhase = 0;
    doorOpenTimer = 0;
    doorOpenPhase = 0;
    codexOpen = false;
    codexScroll = 0;
    codexTab = 0;
    particles = [];
    // Reset NPC walk states
    Object.values(maps).forEach(map => {
        map.npcs.forEach(npc => {
            npc._hasWalked = false;
            npc._pendingQuiz = null;
        });
    });
    // Regenerate maps for fresh layout
    maps.aksum.tiles = generateAksumMap();
    maps.lalibela.tiles = generateLalibelaMap();
    maps.wittenberg.tiles = generateWittenbergMap();
    maps.library.tiles = generateLibraryMap();
    // Re-shuffle quiz answers
    Object.values(quizSets).forEach(set => {
        set.questions.forEach(q => {
            const correctText = q.options[q.correct];
            for (let i = q.options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
            }
            q.correct = q.options.indexOf(correctText);
        });
    });
}

// Further reading sources for diploma
const furtherReading = [
    'Getatchew Haile, "The Ethiopian Orthodox Church\'s Tradition" (2004)',
    'Matteo Ferrara, "Ethiopian Christianity and the Reformation" (2017)',
    'David Daniels, "Luther and the Ethiopian Deacon" (2018)',
    'Wendy Belcher, "The African Foundations of the Protestant Reformation" (2020)',
    'Sergew Hable Selassie, "Ancient and Medieval Ethiopian History to 1270" (1972)',
    'Martin Luther, "Table Talk" -- entries referencing Ethiopian Christianity (1534)'
];

// Region completion helper for spirit guide logic
function getRegionCompletion(region) {
    const map = maps[region];
    if (!map) return { npcsTotal: 0, npcsDone: 0, npcsRemaining: [], artifactsTotal: 0, artifactsDone: 0, artifactsRemaining: [], isComplete: false };

    // Regular NPCs: not spirits, not guards
    const regularNpcs = map.npcs.filter(n => !n.isSpirit && n.id !== 'guard_aksum');
    const npcsTotal = regularNpcs.length;
    const npcsDone = regularNpcs.filter(n => playerData.talkedToNpcs.includes(n.id)).length;
    const npcsRemaining = regularNpcs.filter(n => !playerData.talkedToNpcs.includes(n.id)).map(n => n.name);

    const regionArtifacts = artifacts[region] || [];
    const artifactsTotal = regionArtifacts.length;
    const artifactsDone = regionArtifacts.filter(a => playerData.visitedArtifacts.includes(a.id)).length;
    const artifactsRemaining = regionArtifacts.filter(a => !playerData.visitedArtifacts.includes(a.id)).map(a => a.title);

    let isComplete = (npcsDone >= npcsTotal) && (artifactsDone >= artifactsTotal);
    // For aksum, also require hasScroll
    if (region === 'aksum') {
        isComplete = isComplete && playerData.hasScroll;
    }

    return { npcsTotal, npcsDone, npcsRemaining, artifactsTotal, artifactsDone, artifactsRemaining, isComplete };
}

// Generate cryptic spirit hints based on what remains in the region
function getSpiritHints(region, comp) {
    const hints = [];

    if (region === 'aksum') {
        if (!playerData.hasScroll) {
            hints.push('A keeper of ancient wisdom waits at the heart of Aksum. He holds something you must carry far...');
            hints.push('The journey cannot begin without the parchment. Seek the elder who guards the sacred texts.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Ezra') >= 0)) {
            hints.push('One who carries a sacred scroll should first learn what makes it sacred. Seek the monk in the scriptorium.');
            hints.push('A crimson-robed brother knows why the tongue of the people matters more than the tongue of scholars.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Tekle') >= 0)) {
            hints.push('A priest with a family has much to teach you about our ways. Not all who serve God must walk alone.');
            hints.push('To the east, a father tends both his flock and his children. His life itself is a lesson.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Yohannes') >= 0)) {
            hints.push('A scholar pores over texts in the southern quarter. He knows secrets older than Rome itself.');
            hints.push('The debtera keeps count of the centuries. He can tell you why our faith is no copy.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Monks') >= 0)) {
            hints.push('White-robed figures keep watch near a stone chapel. Their story is worth knowing.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Ge\'ez') >= 0)) {
            hints.push('An ancient book rests on a stand, its pages filled with a script older than Latin Bibles.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Meskel') >= 0)) {
            hints.push('A flame burns in the highlands each year to celebrate the True Cross. Have you witnessed it?');
        }
    }

    if (region === 'lalibela') {
        if (comp.npcsRemaining.some(n => n.indexOf('Michael') >= 0)) {
            hints.push('A deacon prepares for a journey that will echo through the centuries. He waits near the great church.');
            hints.push('The one who will meet Luther face to face stands among us. Seek him before he departs.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Gebre') >= 0)) {
            hints.push('A builder speaks of wonders carved downward into the earth. His knowledge runs as deep as the stone.');
            hints.push('The master of rock and chisel lingers in the lower quarters. He has stories the stones themselves remember.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Miriam') >= 0)) {
            hints.push('A woman in white knows what Rome teaches that Ethiopia never accepted. She speaks plainly of what others fear to say.');
            hints.push('The sister who rejected Purgatory has wisdom about the Pope that Luther would envy.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Giorgis') >= 0)) {
            hints.push('The earth itself was carved into a cross here -- a wonder you should see with your own eyes.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Illuminated') >= 0)) {
            hints.push('A manuscript glows with colors found nowhere else in the world. It waits to be examined.');
        }
    }

    if (region === 'wittenberg') {
        if (comp.npcsRemaining.some(n => n.indexOf('Hans') >= 0)) {
            hints.push('A townsman saw the hammer strike the door. He remembers the day the world changed.');
            hints.push('Near the southern road, a common man carries uncommon memories of a monk and his theses.');
        }
        if (comp.npcsRemaining.some(n => n.indexOf('Katarina') >= 0)) {
            hints.push('A student of theology connects the threads between Africa and Germany. She reads what others overlook.');
            hints.push('The scholar\'s road to understanding runs through a young woman who asks the right questions.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Theses') >= 0)) {
            hints.push('A door with a paper nailed to it changed the world. Stand before it and understand why.');
        }
        if (comp.artifactsRemaining.some(a => a.indexOf('Press') >= 0)) {
            hints.push('A wooden machine gave words the power to fly. Without it, one monk\'s protest would have died in silence.');
        }
    }

    // Fallback if no specific hints matched
    if (hints.length === 0) {
        hints.push('There is more to discover here. Look carefully -- not all wisdom stands in plain sight.');
        hints.push('The land still holds secrets. Wander with purpose, young scholar.');
    }

    return hints;
}

// Artifact popup update/draw
function updateArtifactPopup() {
    if (keyJustPressed(' ') || keyJustPressed('Enter')) {
        activeArtifact = null;
        gameState = 'overworld';
    }
}

function drawArtifactPopup() {
    if (!activeArtifact) return;

    // Semi-transparent backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, 800, 600);

    // Parchment panel
    const panelX = 100;
    const panelY = 60;
    const panelW = 600;
    const panelH = 480;

    ctx.fillStyle = PAL.parchment;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 4;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#c8a050';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX + 8, panelY + 8, panelW - 16, panelH - 16);

    // Draw pixel art illustration for this artifact
    const imgX = panelX + (panelW - 240) / 2;
    const imgY = panelY + 30;
    const imgW = 240;
    const imgH = 180;

    drawArtifactImage(ctx, activeArtifact.id, imgX, imgY, imgW, imgH);

    // Title in gold
    ctx.fillStyle = '#8B6914';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(activeArtifact.title, panelX + panelW / 2, imgY + imgH + 35);

    // Description
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4a3020';
    ctx.font = '9px "Press Start 2P"';
    wrapText(activeArtifact.description, panelX + 30, imgY + imgH + 60, panelW - 60, 18);
    ctx.textAlign = 'center';

    // Close prompt
    if (Math.floor(frameCount / 25) % 2 === 0) {
        ctx.fillStyle = '#8B6914';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('Press SPACE to close', panelX + panelW / 2, panelY + panelH - 20);
    }

    ctx.textAlign = 'left';
}

//  Main Game Loop
function update() {
    frameCount++;
    updateParticles();

    switch (gameState) {
        case 'title': updateTitle(); break;
        case 'prologue': updatePrologue(); break;
        case 'overworld': updateOverworld(); break;
        case 'npcWalking': updateNpcWalk(); break;
        case 'dialogue': updateDialogue(); break;
        case 'artifactPopup': updateArtifactPopup(); break;
        case 'battleIntro':
        case 'battle': updateBattle(); break;
        case 'victory': break;
        case 'diploma': updateDiploma(); break;
        case 'doorOpening': updateDoorOpening(); break;
        case 'mapTransition': updateMapTransition(); break;
    }
}

function draw() {
    ctx.clearRect(0, 0, 800, 600);

    switch (gameState) {
        case 'title': drawTitle(); break;
        case 'prologue': drawPrologue(); break;
        case 'overworld': drawOverworld(); drawCodex(); break;
        case 'npcWalking': drawOverworld(); break;
        case 'dialogue':
            drawOverworld();
            drawDialogue();
            break;
        case 'artifactPopup':
            drawOverworld();
            drawArtifactPopup();
            break;
        case 'battleIntro':
        case 'battle': drawBattle(); break;
        case 'victory': drawVictory(); break;
        case 'diploma': drawDiploma(); break;
        case 'doorOpening': drawDoorOpening(); break;
        case 'mapTransition': drawMapTransition(); break;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
