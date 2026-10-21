import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Image, Platform, Pressable, ScrollView, Share,
  StatusBar, StyleSheet, Text as NativeText, TextInput as NativeTextInput, View, useWindowDimensions,
} from 'react-native';
import { getPassword, setPassword as storePassword, deletePassword, verifyPassword } from './passwordStore';
import Storage from './storage';

function showAlert(title, message = '', buttons = []) {
  if (Platform.OS === 'web') {
    const action = buttons.find((b) => b.onPress && b.style !== 'cancel');
    if (action && globalThis.confirm([title, message].filter(Boolean).join('\n'))) action.onPress();
    else if (!buttons.length) globalThis.alert([title, message].filter(Boolean).join('\n'));
    return;
  }
  Alert.alert(title, message, buttons);
}

const DB_KEY = 'xinqing-app-v1';
const SENSES = [
  { id: 'sight', label: '看見', icon: '👀', examples: ['蔚藍的大海在陽光下閃閃發亮', '遠處的白色浪花慢慢靠近岸邊', '沙灘上留下一串清晰的腳印', '天空有幾朵柔軟的白雲', '夕陽把海面染成金黃色', '海旁的木長椅上放著我的帆布袋', '身邊的朋友穿著淺色的外套', '岸邊的草叢隨微風吹動', '水面映著一艘白色小船', '我看見自己自在地欣賞海景'] },
  { id: 'sound', label: '聽見', icon: '👂', examples: ['海浪輕輕拍打沙灘的聲音', '海風吹過耳邊的呼呼聲', '遠處傳來海鳥清亮的叫聲', '朋友分享近況時愉快的笑聲', '腳步踩在細沙上的沙沙聲', '樹葉被風吹動的細碎聲音', '附近咖啡店傳來輕柔的音樂', '小船引擎逐漸遠去的聲音', '自己放慢呼吸的節奏', '我們聊天時自然流露的笑聲'] },
  { id: 'feel', label: '感覺', icon: '🤲', examples: ['微暖的陽光落在我的肩膀上', '海風輕輕拂過我的臉頰', '腳底感受到柔軟的細沙', '手裡握著冰涼的水瓶', '身體靠在公園舒適的長椅上', '胸口感到放鬆而平穩', '和朋友並肩散步的自在感', '晚風吹來時手臂感受到清涼', '我感覺自己有餘裕慢慢欣賞', '每走幾步身體都更輕鬆'] },
  { id: 'smell', label: '聞到', icon: '🌿', examples: ['海風帶來清新的鹹味', '沙灘附近淡淡的海藻氣息', '朋友手上咖啡散出的香氣', '海旁草地的青草味', '附近麵包店飄來的烘焙香', '雨後石板路清新的氣味', '手中檸檬水淡淡的果香', '樹木在陽光下散發的自然氣息', '海邊小花的柔和香氣', '空氣聞起來清新又舒服'] },
  { id: 'taste', label: '嚐到', icon: '🍵', examples: ['檸檬水入口時清爽的酸甜', '冰涼白開水的清甜感', '剛吃下的蘋果清脆多汁', '小餅乾淡淡的奶油香', '薄荷茶留在口中的清新味道', '水果的自然甜味', '咖啡入口後溫和的苦香', '海風帶來的微微鹹味', '我慢慢品嚐每一口飲料', '口中留下舒服的清新感'] },
];
const EXAMPLES = [
  '我每天早上起床都有著充分養精蓄銳後的滿滿活力。',
  '我喜歡新工作，與親切的同事共事，讓我獲得許多樂趣。',
  '我開著一輛很棒的車，它讓我每天都感到十分愉快。',
  '我為朋友們做菜，享受當主人的樂趣。',
  '我把自己當成最好的朋友來對待，好好地和自己說話、吃飯。',
  '我每週從事兩次最喜歡的運動，感覺身體狀況十分良好。',
  '我喜歡處在人群中，親切地微笑，享受彼此回應的正能量。',
  '我用心維護新與舊的友誼，珍惜充滿愛心、懂得鼓勵他人的人。',
  '我用許多美好的活動豐富生活，欣慰地看見自己的活動範圍逐週擴展。',
  '我選擇有助於自己更輕鬆、快樂且成功地經營人生的資訊。',
  '我從事符合志趣的工作，享受在帶給我樂趣的職業中獲得收入。',
];
const SCENE_EXAMPLES = [
  '星期六早上，我在海旁慢慢散步，陽光照在水面上，手裡拿著一杯清新的檸檬水。',
  '週末傍晚，我和伴侶坐在戲院看期待已久的電影，手裡拿著爆米花和冰涼飲料。',
  '星期三晚上，我坐在明亮舒適的書桌前完成一項喜歡的工作，桌邊放著溫熱的茶。',
  '星期日中午，我在家中廚房為朋友準備午餐，大家圍坐餐桌分享近況。',
  '星期二下班後，我在公園跟著喜歡的音樂散步，感受微風吹過臉頰。',
  '週六上午，我在寬敞的教室參加興趣課，跟幾位友善的同學一起完成作品。',
  '星期五下午，我在安靜的咖啡店與朋友聊天，桌上放著咖啡和剛出爐的麵包。',
  '星期日早上，我在窗邊伸展身體，陽光落在地板上，房間裡播放輕柔的音樂。',
  '週末下午，我和家人在附近的花園散步，一起欣賞盛開的花朵和綠色樹木。',
  '星期一早上，我精神飽滿地走進明亮的工作空間，親切地和同事打招呼。',
];
const QUOTES = [
  '你有能力把想法拆成小步驟，慢慢完成對自己重要的事。',
  '你已經累積了許多能力，每一次嘗試都讓你更認識自己。',
  '你可以用自己的節奏前進，也有能力為生活作出選擇。',
  '你願意練習和探索，正一步步建立屬於自己的信心。',
  '你能看見自己的需要，也能找到適合自己的下一步。',
];
const CATS = [require('./assets/mascots/cat-1.png'), require('./assets/mascots/cat-2.png'), require('./assets/mascots/cat-3.png'), require('./assets/mascots/cat-4.png'), require('./assets/mascots/cat-5.png')];
const DOGS = [require('./assets/mascots/dog-1.png'), require('./assets/mascots/dog-2.png'), require('./assets/mascots/dog-3.png'), require('./assets/mascots/dog-4.png'), require('./assets/mascots/dog-5.png')];
const MASCOTS = [...CATS, ...DOGS];
const C = { bg: '#eff7fc', white: '#ffffff', card: '#fbfdff', navy: '#122c46', ink: '#1b344d', muted: '#536d83', blue: '#dcecf7', blue2: '#c5e0f1', line: '#d7e7f1', pink: '#f4e7ed', green: '#e6f1eb', yellow: '#fbf2d9' };
const ROUND_FONT = Platform.select({ android: 'sans-serif-rounded', ios: 'Avenir Next', web: 'ui-rounded, "Arial Rounded MT Bold", "PingFang HK", "Microsoft JhengHei", sans-serif', default: undefined });
const blankData = () => ({ visions: [], practices: [], successes: [] });
const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const inThisWeek = (iso) => { const d = new Date(`${iso}T12:00:00`), now = new Date(); const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0); return d >= monday && d <= now; };
const inThisMonth = (iso) => { const d = new Date(`${iso}T12:00:00`), n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); };
const pick = (arr, n) => [...arr].sort(() => Math.random() - .5).slice(0, n);
function promptsFor(senseId, visionText = '') {
  const vision = visionText.replace(/[。.!！?？]+$/g, '').trim() || '我的願景';
  const sea = /海|海邊|海旁|沙灘/.test(vision);
  const cinema = /電影|戲院|影廳|銀幕/.test(vision);
  const food = /煮|做菜|料理|烹飪|餐廳/.test(vision);
  const scenes = {
    sight: sea ? ['蔚藍的大海在陽光下閃閃發亮','遠處白色浪花慢慢靠近岸邊','夕陽把海面染成金黃色','沙灘上清晰的腳印','天空柔軟的白雲','木長椅上的帆布袋','海旁草叢隨風搖動','水面映著白色小船','朋友穿著淺色外套','你最喜歡的海邊景物'] : cinema ? ['大型銀幕上播放的電影畫面','影廳柔和的燈光','座椅前方的銀幕','手中的爆米花袋和飲料','身旁觀眾專注的表情','伴侶期待的笑容','銀幕映在牆上的色彩','電影開始時逐漸暗下的影廳','入口處的電影海報','你最喜歡的演員出現在銀幕上'] : food ? ['桌上新鮮的蔬菜和食材','鍋中正在烹調的菜餚','砧板上切好的食材','餐桌上的碗碟和餐具','朋友坐在桌旁的笑容','剛完成的一道色香俱全的菜','廚房裡溫暖的燈光','盤中不同顏色的蔬菜','桌上盛好的飲料','朋友們享用晚餐的畫面'] : [`「${vision}」場景中的主要地點`,`場景裡最鮮明的顏色和光線`,`你最先注意到的物件`,`畫面中的熟悉人物或身影`,`周圍整齊而舒服的環境`,`你正在進行的具體活動`,`場景裡令你感到愉快的小細節`,`附近的自然景物或室內擺設`,`你當下的表情和姿態`,`這個願景逐步實現時的清晰畫面`],
    sound: sea ? ['海浪輕輕拍打沙灘的聲音','海風吹過耳邊的呼呼聲','遠處海鳥清亮的叫聲','朋友分享近況時的笑聲','腳步踩在細沙上的沙沙聲','樹葉被風吹動的細碎聲音','附近咖啡店的輕柔音樂','小船引擎逐漸遠去的聲音','自己放慢呼吸的節奏','你們聊天時自然流露的笑聲'] : cinema ? ['電影人物清晰的對白','電影配樂和背景音樂','觀眾聽到有趣情節時的笑聲','爆米花袋發出的窸窣聲','手伸進紙袋拿爆米花的聲音','伴侶輕聲分享的有趣評論','座椅輕微的挪動聲','電影開場的音樂','影廳裡安靜專注的氣氛','自己心裡期待電影的聲音'] : food ? ['食材在砧板上切開的聲音','鍋中食物滋滋作響','水流沖洗蔬菜的聲音','餐具輕放在餐桌上的聲音','朋友分享故事時的笑聲','煮食時定時器的提示聲','湯匙碰到碗邊的清脆聲音','廚房抽油煙機的輕聲運轉','朋友稱讚菜餚時的語氣','用餐時自在的交談聲'] : [`「${vision}」場景裡最清晰的環境聲`,`你正在做的事情發出的聲音`,`身邊熟悉人物的說話聲`,`遠處傳來的自然或城市聲音`,`你喜歡的音樂或旋律`,`周圍物件輕微的聲音`,`令你感到舒服的安靜時刻`,`你自然發出的笑聲或回應`,`自己的呼吸和內在對白`,`這個場景裡最愉快的聲音`],
    feel: sea ? ['微暖的陽光落在肩膀上','海風輕輕拂過臉頰','腳底感受到柔軟的細沙','手裡握著冰涼的水瓶','身體靠在舒適的長椅上','胸口感到放鬆而平穩','和朋友並肩散步的自在感','晚風吹來時手臂的清涼','慢慢欣賞海景時的餘裕','每走幾步身體都更輕鬆'] : cinema ? ['戲院舒適座椅承托著身體','影廳宜人的室內溫度','伴侶溫柔的手握著自己的手','手中冰涼可樂瓶的觸感','酥脆爆米花在口中的感覺','電影開演前期待的心情','自在享受休閒活動的輕鬆','喝一口冰涼飲料的清新','和伴侶並肩坐著的安心','專注看電影時逐漸放鬆的身體'] : food ? ['切菜時手握刀柄的穩定感','鍋邊傳來的暖意','手指感受到新鮮食材的觸感','端起菜盤時手上的重量','站在廚房忙碌時身體的活力','朋友到來時心裡的期待','大家圍坐餐桌時的溫暖','忙完後坐下來休息的鬆弛感','朋友品嚐菜餚時的欣慰','享受自己親手準備晚餐的滿足'] : [`「${vision}」帶給身體的放鬆感`,`所在環境的溫度和空氣感`,`雙手正在接觸的物件觸感`,`身體姿勢帶來的穩定感`,`呼吸變得平穩時的感覺`,`參與這件事情時的活力`,`臉上自然浮現的笑容`,`身邊環境帶來的安心感`,`完成一小步後的滿足感`,`留在當下的自在和餘裕`],
    smell: sea ? ['海風吹來清新的鹹味','沙灘附近淡淡的海藻氣息','朋友手上咖啡散出的香氣','海旁草地的青草味','附近麵包店飄來的烘焙香','雨後石板路清新的氣味','檸檬水淡淡的果香','樹木在陽光下的自然氣息','海邊小花的柔和香氣','清新舒服的海邊空氣'] : cinema ? ['新鮮爆米花的香氣','伴侶身上熟悉的香水味','戲院座位布料的氣味','可樂打開時的甜香','大堂裡淡淡的清潔氣味','附近觀眾帶來的淡淡香氣','爆米花上奶油的香味','入口處飄來的飲料香','影廳裡涼爽空調的清新氣息','讓人放鬆的熟悉戲院氣味'] : food ? ['新鮮蔬菜的清香','鍋中湯汁飄出的香味','蒜和香草在熱鍋中的氣息','剛出爐菜餚的誘人香味','水果清新的甜香','煮飯時米飯散出的香氣','餐桌上花朵淡淡的氣味','朋友帶來的小點心香氣','廚房裡溫暖的食物香','自己喜歡的調味料香氣'] : [`「${vision}」附近清新舒服的氣味`,`所在地方熟悉的空間氣息`,`周圍自然景物淡淡的香氣`,`身邊飲品或食物的香味`,`空氣中令人放鬆的清新感`,`熟悉物件帶來的氣味`,`陽光和微風帶來的自然味道`,`附近植物柔和的香氣`,`你喜歡的香水或香氛`,`這個場景裡最舒服的氣味`],
    taste: sea ? ['檸檬水入口時清爽的酸甜','冰涼白開水的清甜感','蘋果清脆多汁的味道','小餅乾淡淡的奶油香','薄荷茶留在口中的清新味道','水果自然的甜味','咖啡溫和的苦香','海風帶來的微微鹹味','慢慢品嚐每一口飲料','口中舒服的清新感'] : cinema ? ['爆米花入口時的香甜和酥脆','冰涼可樂的清爽甜味','餅乾入口時的鬆脆感','飲料留在口中的清新味道','爆米花淡淡的奶油香','慢慢咀嚼零食的滋味','可樂氣泡在舌尖的感覺','一口飲料和一口爆米花的滋味','嘴裡留下的甜香','細細品嚐喜歡零食的愉悅'] : food ? ['剛完成菜餚的鮮美味道','湯汁入口時溫暖的滋味','蔬菜清甜爽脆的口感','香草和調味料融合的香氣','朋友分享的小點心滋味','水果清甜多汁的口感','米飯入口時柔軟的質感','一口熱湯帶來的暖意','慢慢品嚐親手做的晚餐','和朋友分享美食的滿足'] : [`「${vision}」場景裡喜歡的飲品滋味`,`當下入口的食物口感`,`飲料帶來的清新或溫暖感`,`喜歡的水果自然甜味`,`小點心酥脆或柔軟的質感`,`嘴裡熟悉舒服的味道`,`慢慢品嚐時口中的變化`,`食物和飲料搭配的滋味`,`每一口帶來的愉快感受`,`留在口中的清新味道`],
  };
  return scenes[senseId];
}

export default function App() {
  const [data, setData] = useState(blankData);
  const [ready, setReady] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const desktopWeb = Platform.OS === 'web' && windowWidth >= 760;
  // Edge-to-edge Android and notched iPhones draw content behind the status bar.
  // Keep the first heading below the clock on native phone layouts.
  const topInsetPadding = Platform.OS === 'ios'
    ? 78
    : Platform.OS === 'android'
      ? (StatusBar.currentHeight || 24) + 28
      : 18;
  const [password, setPasswordValue] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState('home');
  const [page, setPage] = useState('home');
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [mascot, setMascot] = useState(() => MASCOTS[Math.floor(Math.random() * MASCOTS.length)]);
  const [examples, setExamples] = useState(() => pick(EXAMPLES, 2));
  const [visionText, setVisionText] = useState('');
  const [selectedVisionId, setSelectedVisionId] = useState(null);
  const [editingVisionId, setEditingVisionId] = useState(null);
  const [activeVision, setActiveVision] = useState(null);
  const [sceneText, setSceneText] = useState('');
  const [sceneExamples, setSceneExamples] = useState(() => pick(SCENE_EXAMPLES, 2));
  const [visionComposerOpen, setVisionComposerOpen] = useState(false);
  const [senseIndex, setSenseIndex] = useState(0);
  const [senseValues, setSenseValues] = useState({ sight: Array(10).fill(''), sound: Array(10).fill(''), feel: Array(10).fill(''), smell: Array(10).fill(''), taste: Array(10).fill('') });
  const [successText, setSuccessText] = useState('');
  const [successType, setSuccessType] = useState('工作方面');
  useEffect(() => {
    setMascot((current) => {
      const choices = MASCOTS.filter((image) => image !== current);
      return choices[Math.floor(Math.random() * choices.length)];
    });
  }, [page, tab]);
  const [period, setPeriod] = useState('week');
  const [sort, setSort] = useState('date');
  const [editingPassword, setEditingPassword] = useState(false);
  const passwordDraft = useRef('');
  const [entryPassword, setEntryPassword] = useState('');
  const [backupText, setBackupText] = useState('');
  const [importExpanded, setImportExpanded] = useState(false);
  const [editSuccessId, setEditSuccessId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await Storage.getItem(DB_KEY);
        if (saved) { const loaded = { ...blankData(), ...JSON.parse(saved) }; setData(loaded); }
        setPasswordValue(await getPassword());
      } catch (e) { console.warn('載入本機資料失敗', e); }
      setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) Storage.setItem(DB_KEY, JSON.stringify(data)).catch((e) => console.warn('儲存資料失敗', e)); }, [data, ready]);

  const setItems = (key, value) => setData((d) => ({ ...d, [key]: typeof value === 'function' ? value(d[key]) : value }));
  const go = (newTab, newPage = newTab) => { setTab(newTab); setPage(newPage); };
  const openVisionForm = () => { setExamples(pick(EXAMPLES, 2)); setPage('visions'); };
  const addVision = () => {
    const text = visionText.trim(); if (!text) return;
    if (data.visions.length >= 10) { showAlert('願景已滿十句', '可編輯或刪除現有願景，再加入新句子。'); return; }
    const vision = { id: uid(), text, createdAt: new Date().toISOString() }; setItems('visions', (old) => [...old, vision]); setVisionText(''); setVisionComposerOpen(false);
  };
  const startPracticeFromDraft = () => {
    const text = visionText.trim();
    if (!text) { showAlert('先寫下一個心願', '寫下想練習的小心願，再開始五感練習。'); return; }
    if (data.visions.length >= 10) { showAlert('心願已滿十句', '可先編輯或刪除現有心願，再開始練習。'); return; }
    const vision = { id: uid(), text, createdAt: new Date().toISOString() };
    setItems('visions', (old) => [...old, vision]);
    setVisionText(''); setVisionComposerOpen(false); setActiveVision(vision); setSceneText(''); setSceneExamples(pick(SCENE_EXAMPLES, 2)); setSenseIndex(0);
    setSenseValues({ sight: Array(10).fill(''), sound: Array(10).fill(''), feel: Array(10).fill(''), smell: Array(10).fill(''), taste: Array(10).fill('') });
    setPage('scene');
  };
  const updateVision = (id, text) => setItems('visions', (old) => old.map((v) => v.id === id ? { ...v, text } : v));
  const deleteVision = (id) => showAlert('刪除這句願景？', '相關五感練習和成功日記會保留。', [{ text: '取消' }, { text: '刪除', style: 'destructive', onPress: () => setItems('visions', (old) => old.filter((v) => v.id !== id)) }]);
  const startPractice = (vision) => {
    const current = data.practices.find((p) => p.visionId === vision.id);
    const begin = () => { setActiveVision(vision); setSceneText(current?.sceneText || ''); setSceneExamples(pick(SCENE_EXAMPLES, 2)); setSenseIndex(0); setSenseValues(current?.senses || { sight: Array(10).fill(''), sound: Array(10).fill(''), feel: Array(10).fill(''), smell: Array(10).fill(''), taste: Array(10).fill('') }); setPage('scene'); };
    showAlert('開始五感練習', `準備用五感想像這個願景嗎？\n「${vision.text}」`, [{ text: '稍後', style: 'cancel' }, { text: current ? '查看／修改' : '開始練習', onPress: begin }]);
  };
  const beginSensesPractice = () => {
    if (!sceneText.trim()) { showAlert('先描述具體情景', '寫下這個小心願發生時的具體畫面，再開始五感練習。'); return; }
    setPage('practice');
  };
  const savePractice = (draft = false) => {
    const practice = { id: data.practices.find((p) => p.visionId === activeVision.id)?.id || uid(), visionId: activeVision.id, sceneText: sceneText.trim(), senses: senseValues, status: draft ? 'draft' : 'complete', date: today(), updatedAt: new Date().toISOString() };
    setItems('practices', (old) => [...old.filter((p) => p.visionId !== activeVision.id), practice]); setPage('home'); setTab('home');
    if (!draft) showAlert('🌟 做得很好！', '你用心完成了這次五感想像，這份時間和專注都值得肯定。');
    else showAlert('草稿已保存', '你可以稍後回來繼續修改。');
  };
  const writeSense = (index, text) => setSenseValues((old) => ({ ...old, [SENSES[senseIndex].id]: old[SENSES[senseIndex].id].map((v, i) => i === index ? text : v) }));
  const addSuccess = () => {
    const title = successText.trim(); if (!title) return;
    const row = { id: editSuccessId || uid(), title, type: successType, date: editSuccessId ? data.successes.find((s) => s.id === editSuccessId)?.date || today() : today(), updatedAt: new Date().toISOString() };
    setItems('successes', (old) => editSuccessId ? old.map((s) => s.id === editSuccessId ? row : s) : [row, ...old]); setSuccessText(''); setEditSuccessId(null); setPage('diary'); setTab('diary'); showAlert(editSuccessId ? '已更新成功日記' : '✨ 你做得很好！', '願意記下自己的努力，是很值得肯定的一步。');
  };
  const editSuccess = (item) => { setEditSuccessId(item.id); setSuccessText(item.title); setSuccessType(item.type); setPage('diary'); };
  const removeSuccess = (id) => showAlert('刪除這項記錄？', '', [{ text: '取消' }, { text: '刪除', style: 'destructive', onPress: () => setItems('successes', (old) => old.filter((s) => s.id !== id)) }]);
  const achievements = useMemo(() => {
    const rows = data.successes.filter((s) => period === 'all' || (period === 'week' ? inThisWeek(s.date) : inThisMonth(s.date)));
    return rows.sort((a, b) => sort === 'date' ? b.date.localeCompare(a.date) : a.type.localeCompare(b.type, 'zh-Hant'));
  }, [data.successes, period, sort]);
  const savePassword = async () => {
    const p = passwordDraft.current.trim(); if (p.length < 4) { showAlert('請輸入至少 4 個字元'); return; }
    try { await storePassword(p); setPasswordValue(await getPassword()); setUnlocked(true); setEditingPassword(false); passwordDraft.current = ''; showAlert('密碼已設定', '下次開啟 App 時需要輸入密碼。'); } catch { showAlert('未能設定密碼', '請稍後再試。'); }
  };
  const removePassword = async () => { await deletePassword(); setPasswordValue(null); setUnlocked(true); };
  const unlock = async () => { if (await verifyPassword(entryPassword)) setUnlocked(true); else showAlert('密碼不正確'); };
  const exportData = async () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2);
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `心晴練習室備份-${today()}.json`; a.click(); URL.revokeObjectURL(url); showAlert('備份已匯出', 'JSON 備份已下載到這部裝置。');
    } else await Share.share({ title: '心晴練習室資料備份', message: payload });
  };
  const importData = () => {
    try {
      const parsed = JSON.parse(backupText); const restored = parsed.data || parsed;
      if (!Array.isArray(restored.visions) || !Array.isArray(restored.practices) || !Array.isArray(restored.successes)) throw new Error('format');
      showAlert('匯入備份？', '匯入會以備份內容取代這部裝置的願景、練習和成功日記。', [{ text: '取消', style: 'cancel' }, { text: '匯入並取代', style: 'destructive', onPress: () => { setData({ visions: restored.visions, practices: restored.practices, successes: restored.successes }); setBackupText(''); setImportExpanded(false); showAlert('匯入完成', '備份資料已儲存到這部裝置。'); } }]);
    } catch { showAlert('無法匯入備份', '請確認貼上的內容是心晴練習室 JSON 備份。'); }
  };
  const clearAll = () => showAlert('刪除所有資料？', '願景、五感練習和成功日記都會永久刪除。', [{ text: '取消', style: 'cancel' }, { text: '確認刪除', style: 'destructive', onPress: async () => { setData(blankData()); await deletePassword(); setPasswordValue(null); setPage('home'); setTab('home'); } }]);

  if (!ready) return <View style={s.loading}><Text style={s.title}>心晴練習室</Text><Text style={s.muted}>正在準備你的私人空間…</Text></View>;
  if (password && !unlocked) return <View style={s.lock}><Image source={mascot} style={s.lockCat} resizeMode="contain"/><Text style={s.title}>心晴練習室</Text><Text style={s.muted}>輸入密碼以閱讀你的內容</Text><TextInput style={[s.input, s.passwordInput]} value={entryPassword} onChangeText={setEntryPassword} secureTextEntry placeholder="App 密碼" placeholderTextColor={C.muted} onSubmitEditing={unlock} /><Button label="解鎖" onPress={unlock} /></View>;

  const renderHeader = (title, subtitle, showOffline = true) => <View style={s.header}><View><Text style={s.headerTitle}>{title}</Text>{subtitle ? <Text style={s.headerSub}>{subtitle}</Text> : null}</View>{showOffline ? <View style={s.offline}><Text style={s.offlineDot}>●</Text><Text style={s.offlineText}>離線私人空間</Text></View> : null}</View>;
  const Home = () => <>
    {renderHeader('心晴練習室', '把注意力放回自己想要的生活')}
    <Card style={s.homeIntro}>
      <Image source={mascot} style={s.homeCat} resizeMode="contain" />
      <View style={s.encouragementBox}><Text style={s.encouragement}>{quote}</Text></View>
      <View style={s.practiceTipBox}><Text style={s.h3}>🌼 練習小提示</Text>
      <Text style={s.body}>五感練習能幫助你把願景描繪得更具體，留意自己重視的生活細節。留意畫面裡的色彩、聲音、感受、氣味與味道。</Text></View>
      <View style={s.softBox}><Text style={s.body}>每次只專注一句願景，按自己的節奏慢慢寫。你可以保存草稿，稍後再繼續。</Text></View>
      <Button label="開始練習" onPress={openVisionForm} style={s.startButton} />
    </Card>
    
  </>;
  const VisionPage = () => <>
    {renderHeader('🌷 小心願', '用十個句子描繪，生活變得很棒時的樣子', false)}
    <Card><Text style={s.h3}>願景例子</Text><Text style={s.muted}>點選例句可帶入並修改。</Text>{examples.map((x) => <Pressable key={x} style={s.example} onPress={() => setVisionText(x)}><Text style={s.body}>{x}</Text></Pressable>)}
      <Text style={s.label}>我的願景（{data.visions.length}/10）</Text>
      {data.visions.length ? <View>{data.visions.map((v, i) => <View key={v.id}><Pressable style={s.visionRow} onPress={() => {setSelectedVisionId((current) => current === v.id ? null : v.id);setEditingVisionId(null)}}><Text style={s.visionNum}>{i + 1}</Text><Text style={s.bodyFlex}>{v.text}</Text><Text style={s.chevron}>{selectedVisionId === v.id ? '⌃' : '⌄'}</Text></Pressable>{selectedVisionId === v.id ? <>{editingVisionId === v.id ? <TextInput value={v.text} onChangeText={(t) => updateVision(v.id, t)} multiline style={[s.input, s.visionField]} /> : null}<View style={s.visionActions}><Button label="開始練習" onPress={() => startPractice(v)} style={s.visionActionButton}/><Button label={editingVisionId === v.id ? '完成' : '編輯'} variant="secondary" onPress={() => setEditingVisionId((current) => current === v.id ? null : v.id)} style={s.visionActionButton}/><Button label="刪除" variant="ghost" onPress={() => deleteVision(v.id)} style={s.visionActionButton}/></View></> : null}</View>)}</View> : <Text style={s.empty}>寫下小心願後，就會在這裡顯示。</Text>}
      {data.visions.length < 10 && (!visionComposerOpen ? <Button label="＋ 寫下一個願景" onPress={() => {setVisionText('');setVisionComposerOpen(true)}} style={s.fullButton}/> : <><TextInput value={visionText} onChangeText={setVisionText} placeholder="例如：我每週與朋友在海旁散步，分享近況……" multiline style={[s.input, s.largeInput]} placeholderTextColor={C.muted}/><Text style={s.hint}>小提示：用正面、現在式的句子寫出具體情景，專注在自己可以完成的事情，目標越大越好。</Text><Button label="開始五感練習" onPress={startPracticeFromDraft} style={s.fullButton}/><Button label="保存小心願" variant="secondary" onPress={addVision} style={s.fullButton}/><Button label="取消" variant="ghost" onPress={() => {setVisionText('');setVisionComposerOpen(false)}} style={s.fullButton}/></>)}
      <Button label="返回首頁" variant="secondary" onPress={() => setPage('home')} style={s.fullButton}/>
    </Card>
  </>;
  const ScenePage = () => <>
    {renderHeader('🌿 描述具體情景', '先把小心願化成一個清晰畫面', false)}
    <Card><Text style={s.label}>正在練習的小心願</Text><Text style={s.practiceVision}>{activeVision?.text}</Text>
      <Text style={s.label}>描述這個心願發生時的具體情景</Text><Text style={s.muted}>點選例子可帶入文字框，再按自己的情況修改。</Text>
      {sceneExamples.map((example) => <Pressable key={example} style={s.example} onPress={() => setSceneText(example)}><Text style={s.body}>{example}</Text></Pressable>)}
      <TextInput value={sceneText} onChangeText={setSceneText} placeholder="例如：星期六下午，我在明亮的廚房為朋友準備晚餐，大家圍坐在餐桌旁聊天。" multiline style={[s.input,s.largeInput]} placeholderTextColor={C.muted}/>
      <Button label="開始五感練習" onPress={beginSensesPractice} style={s.fullButton}/>
      <Button label="返回小心願" variant="secondary" onPress={() => setPage('visions')} style={s.fullButton}/>
    </Card>
  </>;
  const Practice = () => {
    const sense = SENSES[senseIndex], values = senseValues[sense.id], filled = values.filter((v) => v.trim()).length;
    return <>
      {renderHeader('✨ 今晚的五感想像', undefined, false)}
      <Card><Text style={s.practiceVision}>{activeVision?.text}</Text><View style={s.sceneSummary}><Text style={s.sceneSummaryLabel}>我的具體情景</Text><Text style={s.body}>{sceneText}</Text></View></Card>
      <Card><View style={s.practiceTitle}><Text style={s.senseIcon}>{sense.icon}</Text><View><Text style={s.h3}>{sense.label}（填寫至少 8 行）</Text><Text style={s.muted}>五感 {senseIndex + 1}/5 · 已填 {filled}/10</Text></View></View>
        <View style={s.promptBox}><Text style={s.label}>與這句願景相關的具體例子</Text>{promptsFor(sense.id, `${activeVision?.text || ''} ${sceneText}`).map((e, i) => <Text key={`${i}-${e}`} style={s.prompt}>{i + 1}. {e}</Text>)}</View>
        {values.map((v, i) => <TextInput key={`${sense.id}-${i}`} value={v} onChangeText={(t) => writeSense(i, t)} placeholder={`${i + 1}. 寫下與願景有關的具體細節`} multiline style={s.senseInput} placeholderTextColor={C.muted}/ >)}
        <Button label="保存草稿" variant="secondary" onPress={() => savePractice(true)} style={s.fullButton}/>
        {senseIndex < 4 ? <Button label={`下一個感覺：${SENSES[senseIndex + 1].label}`} onPress={() => filled >= 8 ? setSenseIndex(senseIndex + 1) : showAlert('再寫幾個細節', `填寫至少 8 行後，就可以繼續。目前已填 ${filled} 行。`)} style={s.fullButton}/> : <Button label="保存並完成" onPress={() => filled >= 8 ? savePractice(false) : showAlert('再寫幾個細節', `填寫至少 8 行後，就可以完成。目前已填 ${filled} 行。`)} style={s.fullButton}/>}
        <Button label="離開練習" variant="ghost" onPress={() => setPage('home')} style={s.fullButton}/>
      </Card>
    </>;
  };
  const Diary = () => <>
    {renderHeader('✨ 成功日記', '記下已經做到、正在進步或值得肯定的事', false)}
    <Card>
      <Text style={s.label}>今天想肯定自己的哪件事？</Text><TextInput value={successText} onChangeText={setSuccessText} placeholder="寫下今天值得肯定的事情……" multiline style={[s.input, s.largeInput]} placeholderTextColor={C.muted}/>
      <Text style={s.label}>種類</Text><View style={s.chipWrap}>{['工作方面','人際關係','個人技能','自媒體','休息享受','其他'].map((x) => <Choice key={x} selected={successType === x} label={x} onPress={() => setSuccessType(x)}/>)}</View>
      <Button label={editSuccessId ? '保存修改' : '記下這件成功'} onPress={addSuccess} style={s.fullButton}/>
    </Card>
    {data.successes.length ? data.successes.map((item) => <Pressable key={item.id} style={s.successCard} onPress={() => editSuccess(item)} onLongPress={() => removeSuccess(item.id)}><Text style={s.body}>{item.title}</Text><Text style={s.smallText}>{item.type} · 點按修改，長按刪除</Text></Pressable>) : null}
    <View style={s.diaryEncouragement}><Text style={s.pageEncouragementText}>你願意記下自己的努力，代表你看見了自己的付出。每一步都值得肯定。</Text></View>
  </>;
  const Achievements = () => <>
    {renderHeader('🏵️ 過往成就', '回顧自己一路累積的每一份努力', false)}
    <Card><View style={s.chipWrap}>{[['week','本週'],['month','本月'],['all','開始使用以來']].map(([id,label]) => <Choice key={id} selected={period === id} label={label} onPress={() => setPeriod(id)}/>)}</View>
      <View style={s.summary}><Text style={s.summaryCount}>{achievements.length}</Text><Text style={s.body}>件成功事項，值得為自己感到欣慰。</Text></View>
      <View style={s.chipWrap}><Choice selected={sort === 'date'} label="日期排序" onPress={() => setSort('date')}/><Choice selected={sort === 'type'} label="種類排序" onPress={() => setSort('type')}/></View>
    </Card>
    {achievements.length ? achievements.map((item) => <Pressable key={item.id} style={s.successCard} onPress={() => editSuccess(item)}><Text style={s.smallText}>{item.type}</Text><Text style={s.body}>{item.title}</Text></Pressable>) : null}
    <View style={s.achievementEncouragement}><Text style={s.pageEncouragementText}>回望一路走來，你累積了許多值得驕傲的時刻。請給自己一個肯定。</Text></View>
  </>;
  const Settings = () => <>
    {renderHeader('⚙️ 設定', '資料只保存在這部裝置')}
    <Card><Text style={s.h3}>私隱與資料</Text><Text style={s.body}>願景、練習和成功日記儲存在目前裝置的本機空間，不會上傳至雲端。</Text><View style={s.divider}/>
      <Text style={s.h3}>App 密碼</Text><Text style={s.body}>設定後，每次重新開啟 App 都需要輸入密碼。</Text>
      {!editingPassword ? <Button label={password ? '更改密碼' : '設定密碼'} onPress={() => {passwordDraft.current='';setEditingPassword(true)}} style={s.fullButton}/> : <><TextInput defaultValue="" onChangeText={(value) => {passwordDraft.current=value}} secureTextEntry autoFocus autoCapitalize="none" autoCorrect={false} keyboardType="default" returnKeyType="done" autoComplete="new-password" textContentType="newPassword" placeholder="輸入至少 4 個字元" style={[s.input,s.passwordInput]} placeholderTextColor={C.muted}/><View style={s.passwordActions}><Button label="保存密碼" onPress={savePassword} style={s.equalPasswordButton}/><Button label="取消" variant="secondary" onPress={() => {passwordDraft.current='';setEditingPassword(false);}} style={s.equalPasswordButton}/></View></>}
      {password ? <Button label="移除密碼" variant="ghost" onPress={removePassword} style={s.fullButton}/> : null}
      <Button label="匯出 JSON 備份" variant="secondary" onPress={exportData} style={s.fullButton}/>
      {!importExpanded ? <Button label="匯入備份" variant="secondary" onPress={() => setImportExpanded(true)} style={s.fullButton}/> : <><Text style={s.label}>匯入 JSON 備份</Text><TextInput value={backupText} onChangeText={setBackupText} placeholder="貼上之前匯出的 JSON 備份" multiline style={[s.input,s.backupInput]} placeholderTextColor={C.muted}/><View style={s.inlineButtons}><Button label="匯入並取代" variant="secondary" onPress={importData}/><Button label="取消" variant="ghost" onPress={() => {setImportExpanded(false);setBackupText('');}}/></View></>}
      <View style={s.divider}/><Text style={s.h3}>心理健康使用提示</Text><Text style={s.body}>這是自我反思與生活記錄工具，不取代心理治療、診斷或專業協助。若練習讓你感到不舒服，可以停止並聯絡可信任的人或專業人士。</Text>
      <Button label="刪除所有資料" variant="danger" onPress={clearAll} style={s.fullButton}/>
    </Card>
  </>;
  const tabs = [{ id:'home', label:'小心願', icon:'🌷' }, { id:'diary', label:'成功日記', icon:'✨' }, { id:'achievements', label:'過往成就', icon:'🏵️' }, { id:'settings', label:'設定', icon:'⚙️' }];
  const navigation = <View style={[s.tabbar, desktopWeb && s.sideNav]}>{tabs.map((t) => <Pressable key={t.id} onPress={() => go(t.id)} style={[s.tab,desktopWeb && s.sideTab,t.id === tab && s.tabActive]}><Text style={s.tabIcon}>{t.icon}</Text><Text style={[s.tabText,t.id === tab && s.tabTextActive]}>{t.label}</Text></Pressable>)}</View>;
  // These page renderers close over App state. Invoke them directly so typing
  // does not replace a freshly-created nested component and drop TextInput focus.
  const body = page === 'visions' ? VisionPage() : page === 'scene' ? ScenePage() : page === 'practice' ? Practice() : tab === 'diary' ? Diary() : tab === 'achievements' ? Achievements() : tab === 'settings' ? Settings() : Home();
  return <View style={s.app}><StatusBar barStyle="dark-content" backgroundColor={C.bg}/><View style={[s.flex,desktopWeb && s.desktopLayout]}>{desktopWeb ? navigation : null}<ScrollView key={page + tab} style={desktopWeb && s.desktopScroll} contentContainerStyle={[s.content,{paddingTop:topInsetPadding},desktopWeb && s.desktopContent]} keyboardShouldPersistTaps="always" keyboardDismissMode="none">{body}<View style={s.footer}>{page !== 'home' && tab !== 'settings' ? <Image source={mascot} style={s.footerDog} resizeMode="contain"/> : null}<Text style={s.footerText}>慢慢來，每一小步都算數。</Text></View></ScrollView>{desktopWeb ? null : navigation}</View></View>;
}

function Card({ children, style }) { return <View style={[s.card, style]}>{children}</View>; }
function Text({ children, style, ...props }) { return <NativeText {...props} style={[ROUND_FONT ? { fontFamily: ROUND_FONT } : null, style]}>{children}</NativeText>; }
function TextInput({ style, ...props }) { return <NativeTextInput {...props} style={[ROUND_FONT ? { fontFamily: ROUND_FONT } : null, style]} />; }
function Button({ label, onPress, variant = 'primary', style }) { return <Pressable onPress={onPress} style={({pressed}) => [s.button, variant === 'secondary' && s.buttonSecondary, variant === 'ghost' && s.buttonGhost, variant === 'danger' && s.buttonDanger, style, pressed && s.pressed]}><Text style={[s.buttonText, variant === 'secondary' && s.buttonSecondaryText, variant === 'ghost' && s.buttonGhostText, variant === 'danger' && s.buttonDangerText]}>{label}</Text></Pressable>; }
function Choice({ selected, label, onPress }) { return <Pressable onPress={onPress} style={[s.chip, selected && s.chipSelected]}><Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text></Pressable>; }
function SectionTitle({ children }) { return <Text style={s.h3}>{children}</Text>; }

const s = StyleSheet.create({
  flex:{flex:1}, app:{flex:1,backgroundColor:C.bg}, loading:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',gap:10}, content:{paddingHorizontal:20,paddingTop:18,paddingBottom:28,maxWidth:760,width:'100%',alignSelf:'center'}, header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:18,gap:10}, headerTitle:{fontSize:23,fontWeight:'800',color:C.navy}, headerSub:{fontSize:15,color:C.muted,marginTop:3}, offline:{backgroundColor:C.green,borderRadius:20,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6},offlineDot:{color:'#648870',fontSize:11},offlineText:{color:C.ink,fontSize:15}, card:{backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:22,padding:19,marginBottom:16,shadowColor:'#345b78',shadowOpacity:.045,shadowRadius:14,shadowOffset:{width:0,height:5},elevation:1}, homeIntro:{backgroundColor:C.card}, homeCat:{width:116,height:116,alignSelf:'center',marginBottom:3}, encouragementBox:{backgroundColor:'#fff2df',borderRadius:17,padding:14,marginBottom:14}, encouragement:{fontSize:18,fontWeight:'700',lineHeight:28,color:C.navy,textAlign:'center'},practiceTipBox:{backgroundColor:'#e7f3ec',borderRadius:17,padding:14,marginBottom:4},h3:{fontSize:19,fontWeight:'800',color:C.navy,marginBottom:9},body:{fontSize:16,lineHeight:25,color:C.ink},bodyFlex:{flex:1,fontSize:16,lineHeight:24,color:C.ink},muted:{fontSize:15,lineHeight:21,color:C.muted},softBox:{backgroundColor:C.blue,borderRadius:16,padding:14,marginVertical:15},button:{backgroundColor:C.navy,minHeight:48,paddingHorizontal:18,paddingVertical:12,borderRadius:15,alignItems:'center',justifyContent:'center',marginTop:10},buttonText:{fontSize:16,fontWeight:'800',color:'#fff'},buttonSecondary:{backgroundColor:C.blue2},buttonSecondaryText:{color:C.navy},buttonGhost:{backgroundColor:'transparent'},buttonGhostText:{color:C.muted},buttonDanger:{backgroundColor:C.pink},buttonDangerText:{color:'#6a3045'},pressed:{opacity:.75,transform:[{scale:.99}]},startButton:{alignSelf:'center',minWidth:0,paddingHorizontal:18},fullButton:{width:'100%'},input:{borderWidth:1,borderColor:C.line,borderRadius:14,padding:14,fontSize:16,color:C.ink,backgroundColor:'#fff',minHeight:48},largeInput:{minHeight:94,textAlignVertical:'top',marginTop:8,marginBottom:5},label:{fontSize:16,fontWeight:'700',color:C.navy,marginTop:14,marginBottom:7},hint:{fontSize:15,lineHeight:21,color:C.muted,marginTop:14},example:{padding:12,backgroundColor:'#f2f8fc',borderRadius:13,marginTop:8},visionEdit:{flexDirection:'row',alignItems:'center',gap:8,marginVertical:5},visionField:{flex:1,minHeight:52,padding:10},visionNum:{width:27,height:27,borderRadius:14,backgroundColor:C.blue,overflow:'hidden',textAlign:'center',textAlignVertical:'center',fontSize:14,fontWeight:'800',color:C.navy},deleteText:{color:'#94566a',padding:8},visionRow:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:C.white,borderRadius:15,padding:13,marginBottom:8,borderWidth:1,borderColor:C.line},chevron:{color:'#6e94ad',fontSize:19,fontWeight:'700'},visionActions:{flexDirection:'row',gap:10,justifyContent:'flex-end',marginTop:-3,marginBottom:10,flexWrap:'wrap'},visionActionButton:{minWidth:90},diaryEncouragement:{backgroundColor:'#fff1dc',borderRadius:18,padding:16,marginBottom:15,borderWidth:1,borderColor:'#f5dfbf'},achievementEncouragement:{backgroundColor:'#e9f3fb',borderRadius:18,padding:16,marginBottom:15,borderWidth:1,borderColor:'#d0e4f2'},pageEncouragementText:{fontSize:20,lineHeight:30,fontWeight:'700',color:C.navy},empty:{textAlign:'center',fontSize:15,lineHeight:23,color:C.muted,padding:20},practiceTitle:{flexDirection:'row',gap:12,alignItems:'center',marginBottom:12},practiceVision:{fontSize:24,lineHeight:34,fontWeight:'800',color:C.navy,marginBottom:16},sceneSummary:{backgroundColor:'#edf6fc',borderRadius:16,padding:14,marginTop:8},sceneSummaryLabel:{fontSize:15,fontWeight:'800',color:C.navy,marginBottom:6},senseIcon:{fontSize:32},promptBox:{backgroundColor:C.blue,borderRadius:15,padding:13,marginBottom:10},prompt:{fontSize:15,color:C.ink,lineHeight:22},senseInput:{borderWidth:1,borderColor:C.line,borderRadius:12,paddingHorizontal:12,paddingVertical:10,fontSize:15,color:C.ink,minHeight:48,marginVertical:4,backgroundColor:'#fff',textAlignVertical:'top'},dropdown:{borderWidth:1,borderColor:C.line,borderRadius:14,backgroundColor:'#fff',overflow:'hidden'},dropdownControl:{minHeight:50,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},dropdownText:{fontSize:16,color:C.ink,flex:1},dropdownArrow:{fontSize:20,fontWeight:'800',color:C.navy},dropdownOptions:{maxHeight:230,borderTopWidth:1,borderTopColor:C.line},dropdownOption:{minHeight:48,justifyContent:'center',paddingHorizontal:14,paddingVertical:10,borderBottomWidth:1,borderBottomColor:C.line},chip:{backgroundColor:'#f2f7fa',borderWidth:1,borderColor:C.line,borderRadius:24,paddingHorizontal:13,paddingVertical:9,marginRight:7,marginBottom:7,maxWidth:300},chipSelected:{backgroundColor:C.blue2,borderColor:'#a5cbe2'},chipText:{fontSize:14,color:C.ink},chipTextSelected:{fontWeight:'800',color:C.navy},chipWrap:{flexDirection:'row',flexWrap:'wrap',marginTop:6},chipScroll:{flexGrow:0,marginBottom:6},successCard:{backgroundColor:C.white,borderRadius:15,borderWidth:1,borderColor:C.line,padding:15,marginBottom:9},smallText:{fontSize:15,color:C.muted,marginTop:5},summary:{backgroundColor:C.blue,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',gap:10,marginVertical:12},summaryCount:{fontSize:24,fontWeight:'900',color:C.navy},divider:{height:1,backgroundColor:C.line,marginVertical:17},passwordInput:{maxWidth:360,marginVertical:9},passwordActions:{flexDirection:'row',gap:10,width:'100%',maxWidth:360},equalPasswordButton:{flex:1,minHeight:48},backupInput:{minHeight:120,textAlignVertical:'top'},inlineButtons:{flexDirection:'row',gap:8,flexWrap:'wrap'},lock:{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center',padding:24},lockCat:{width:138,height:138},title:{fontSize:26,fontWeight:'900',color:C.navy,marginBottom:8},desktopLayout:{flexDirection:'row'},desktopScroll:{flex:1},desktopContent:{maxWidth:1100,alignSelf:'center',width:'100%',paddingHorizontal:36,paddingTop:30},sideNav:{width:220,flexDirection:'column',justifyContent:'flex-start',paddingHorizontal:14,paddingTop:28,paddingBottom:14,borderTopWidth:0,borderRightWidth:1,borderRightColor:C.line},sideTab:{flex:0,width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:10,paddingHorizontal:14,paddingVertical:14,marginBottom:8},tabbar:{flexDirection:'row',backgroundColor:'#fff',borderTopWidth:1,borderTopColor:C.line,paddingHorizontal:6,paddingTop:8,paddingBottom:Platform.OS === 'ios' ? 22 : 10},tab:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:8,borderRadius:14},tabActive:{backgroundColor:C.blue},tabIcon:{fontSize:18},tabText:{fontSize:15,color:C.muted,marginTop:2},tabTextActive:{color:C.navy,fontWeight:'800'},footer:{alignItems:'center',padding:18},footerDog:{width:65,height:65},footerText:{fontSize:15,color:C.muted},footer:{alignItems:'center',padding:16},
});
