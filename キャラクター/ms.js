/* =====================================================
   ちびキャラ 運動育成デモ  main.js（進化後の見た目変化つき）
   外部ライブラリは使っていません（素の JavaScript のみ）。

   しくみ
   1. 各パーツは <img> として重ねてあり、CSS の transform
      (translate / rotate / scale) だけを毎フレーム書き換えて動かします。
   2. アニメーションごとに「いまの時刻 t から、各パーツの角度や位置を
      計算する関数(poseXxx)」を用意しています。
   3. 動きを切り替えるときは、前のポーズから新しいポーズへ
      なめらかに補間(blend)するので、ぶつっと切れません。
   4. 「進化」を押すと、フラッシュのピークで画像を差し替え、
      進化段階(stage)が1つ上がります。見た目は STAGES で設定します。
   ===================================================== */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // 0. 要素の取得
  // ---------------------------------------------------------------
  var $ = function (id) { return document.getElementById(id); };
  var el = {
    stage: $('stage'), wrap: $('character-wrap'), character: $('character'),
    rig: $('rig'), head: $('head'), shadow: $('shadow'),
    glow: $('glow'), flash: $('flash'), sparks: $('sparks'), ground: $('ground'),
    footR: $('foot_right'), footL: $('foot_left'),
    armR: $('arm_right'), armL: $('arm_left'),
    body: $('body'),
    earR: $('ear_right'), earL: $('ear_left'), sprout: $('sprout'),
    eyesOpen: $('eyes_open'), eyesClosed: $('eyes_closed'), eyesHappy: $('eyes_happy'),
    mouthNormal: $('mouth_normal'), mouthHappy: $('mouth_happy'),
    status: $('status')
  };

  var CHAR_W = 290, CHAR_H = 340; // CSS の #character と同じ値

  // 腕の「気をつけ」の角度（度）。
  // arm_right = 画面の左側の腕（キャラクターの右腕）、arm_left = 画面の右側の腕
  var REST_ARM_R = 18;   // 時計回りに傾けると手が外側(左)へ出る
  var REST_ARM_L = -18;

  var STATE_LABEL = {
    idle: '待機', walk: '歩く', run: '走る', jump: 'ジャンプ',
    wave: '手を振る', happy: '喜ぶ', evolve: '進化'
  };

  // ---------------------------------------------------------------
  // 0.5 進化段階の設定  ★ここを編集すると進化後の見た目が変わります
  //
  //   scale : キャラ全体の大きさ（1.0 が基準）
  //   glow  : 光の色（CSS の色。省略可）
  //   parts : 差し替える画像。キーは index.html の id、値は画像のパス。
  //           書かなかったパーツは「第1段階の画像」のままになります。
  //
  //   画像を差し替える場合は、元画像と同じキャンバスサイズで書き出してください
  //   （回転の基準点がずれるため）。画像がまだ無ければ parts は空のままでOK。
  //   その場合は大きさ・光の色だけが変わります。
  // ---------------------------------------------------------------
  var MAX_STAGE = 3;
  var STAGES = {
    1: { scale: 1.0, glow: null, parts: {} },
    2: { scale: 1.1, glow: null, parts: {
      // sprout:    'assets/parts/sprout_2.png',
      // body:      'assets/parts/body_2.png'
    } },
    3: { scale: 1.2, glow: null, parts: {
      // sprout:    'assets/parts/sprout_3.png',
      // body:      'assets/parts/body_3.png',
      // head_base: 'assets/parts/head_base_3.png'
    } }
  };
  // 例：段階2から光の色を変えたいときは  glow: 'rgba(255,233,138,.8)'  のように書く

  // 差し替え対象にできるパーツ（index.html の id）
  var SWAPPABLE_IDS = [
    'sprout', 'body', 'head_base', 'ear_right', 'ear_left',
    'arm_right', 'arm_left', 'foot_right', 'foot_left',
    'eyes_open', 'eyes_closed', 'eyes_happy', 'mouth_normal', 'mouth_happy'
  ];

  var stage = 1;                 // いまの進化段階
  var stageScaleNow = 1;         // 画面に出している大きさ（なめらかに追従）
  var evolveSwapped = false;     // 進化中に画像を差し替え済みか
  var EVOLVE_SWAP_T = 1.68;      // 差し替えるタイミング（フラッシュのピーク・秒）
  var ORIGINAL_SRC = {};         // 第1段階の画像（戻すために覚えておく）
  var DEFAULT_GLOW = '';         // 元の光の背景（CSSのまま）

  SWAPPABLE_IDS.forEach(function (id) {
    var node = $(id);
    if (node) ORIGINAL_SRC[id] = node.getAttribute('src');
  });

  // 画像を先読み（差し替え時のちらつき防止）
  Object.keys(STAGES).forEach(function (n) {
    var parts = STAGES[n].parts;
    Object.keys(parts).forEach(function (id) { new Image().src = parts[id]; });
  });

  // 指定した段階の見た目にする（画像と光の色）
  function applyStage(n) {
    stage = n;
    // いったん全部を第1段階の画像に戻してから、その段階の画像で上書き
    Object.keys(ORIGINAL_SRC).forEach(function (id) {
      var node = $(id);
      if (node && node.getAttribute('src') !== ORIGINAL_SRC[id]) node.src = ORIGINAL_SRC[id];
    });
    var parts = STAGES[n].parts;
    Object.keys(parts).forEach(function (id) {
      var node = $(id);
      if (node) node.src = parts[id];
    });
    // 光の色
    if (STAGES[n].glow) el.glow.style.background = STAGES[n].glow;
    else el.glow.style.background = DEFAULT_GLOW;
    el.character.setAttribute('data-stage', String(n));  // CSS側で使いたいとき用
  }

  // ---------------------------------------------------------------
  // 1. ポーズ（パーツごとの動きの値）
  // ---------------------------------------------------------------
  function neutralPose() {
    return {
      x: 0, y: 0,              // 体全体の移動(px)
      rot: 0,                  // 体全体の傾き(度)
      sx: 1, sy: 1,            // 潰れ・伸び（足元を中心に）
      headRot: 0, headX: 0, headY: 0,   // 頭の傾き・ずれ（体より遅れて動かすと可愛い）
      sprout: 0,               // 芽の傾き(度)
      earR: 0, earL: 0,        // 耳の傾き(度)
      armR: REST_ARM_R, armL: REST_ARM_L,
      footRx: 0, footRy: 0, footRr: 0,
      footLx: 0, footLy: 0, footLr: 0,
      bodyTilt: 0,             // パーカー(胴体)だけの小さな傾き
      glow: 0, flash: 0, bright: 0, shadow: 1, scale: 1,
      eyes: 'open',            // 'open' | 'closed' | 'happy'
      mouth: 'normal',         // 'normal' | 'happy'
      groundSpeed: 0           // 地面が流れる速さ(px/秒)
    };
  }

  var TAU = Math.PI * 2;
  function sin(v) { return Math.sin(v); }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smooth(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // ① 待機：体が上下にゆれ、頭の芽がゆれる
  function poseIdle(t) {
    var p = neutralPose();
    var ph = t * TAU * 0.55;                 // 呼吸のリズム
    p.y = -sin(ph) * 3.2;
    p.sy = 1 + sin(ph) * 0.012;              // ふくらんだりへこんだり
    p.sx = 1 - sin(ph) * 0.006;
    p.headY = -sin(ph - 0.7) * 2.0;          // 頭は少し遅れてついてくる
    p.headRot = sin(t * TAU * 0.27) * 1.6;
    p.sprout = sin(t * TAU * 0.9) * 8 + sin(t * TAU * 1.9 + 1) * 3;
    p.earR = sin(ph - 1.0) * 3;
    p.earL = -sin(ph - 1.0) * 3;
    p.armR = REST_ARM_R + sin(ph - 0.5) * 3;
    p.armL = REST_ARM_L - sin(ph - 0.5) * 3;
    return p;
  }

  // ③ 歩く／④ 走る：同じ計算で、速さと振り幅だけ変える
  function poseLocomotion(t, o) {
    var p = neutralPose();
    var ph = t * TAU * o.freq;
    var s = sin(ph), c = Math.cos(ph);
    p.y = -Math.abs(s) * o.bounce;
    p.rot = s * o.sway;
    p.sy = 1 - Math.abs(s) * 0.012 + (1 - Math.abs(s)) * 0.01;
    // 足：左右交互に前後へ振り、持ち上げる
    p.footRx = s * o.stride;
    p.footRy = -Math.max(0, c) * o.lift;
    p.footRr = s * o.footRot;
    p.footLx = -s * o.stride;
    p.footLy = -Math.max(0, -c) * o.lift;
    p.footLr = -s * o.footRot;
    // 腕：足と逆の側が前に出る（左右交互）
    p.armR = REST_ARM_R + o.armBase + s * o.armSwing;
    p.armL = REST_ARM_L - o.armBase + s * o.armSwing;
    // 頭・芽・耳は体より遅れてゆれる
    p.headY = Math.abs(sin(ph - 0.8)) * o.bounce * 0.35;
    p.headRot = sin(ph - 0.6) * o.headSway;
    p.sprout = sin(ph * 2 - 1.0) * o.sproutSway;
    p.earR = sin(ph * 2 - 0.8) * o.earSwing;
    p.earL = -sin(ph * 2 - 0.8) * o.earSwing;
    p.eyes = 'open';
    p.mouth = o.mouth;
    p.groundSpeed = o.ground;
    return p;
  }
  function poseWalk(t) {
    return poseLocomotion(t, { freq: 1.7, bounce: 4.5, sway: 1.6, stride: 13, lift: 9, footRot: 7,
      armBase: 0, armSwing: 26, headSway: 2.2, sproutSway: 8, earSwing: 5, mouth: 'normal', ground: 95 });
  }
  function poseRun(t) {
    var p = poseLocomotion(t, { freq: 3.5, bounce: 10, sway: 3.2, stride: 20, lift: 19, footRot: 14,
      armBase: 26, armSwing: 42, headSway: 3.6, sproutSway: 15, earSwing: 11, mouth: 'happy', ground: 300 });
    return p;
  }

  // ⑤ ジャンプ：しゃがむ → 跳ぶ(腕を上げる) → 着地で潰れる → もどる
  var JUMP_PERIOD = 1.5;
  function poseJump(t) {
    var p = neutralPose();
    var u = (t % JUMP_PERIOD) / JUMP_PERIOD;
    var crouch = 0.17, air = 0.66, land = 0.80;   // 各フェーズの終わり(0〜1)
    var armUp = 0, height = 0, squash = 0, tuck = 0, flap = 0;
    if (u < crouch) {                              // しゃがむ（ため）
      var k = smooth(u / crouch);
      squash = k; armUp = -0.25 * k;
    } else if (u < air) {                          // 空中
      var a = (u - crouch) / (air - crouch);
      height = 4 * a * (1 - a);                    // 放物線 0→1→0
      squash = -0.55 * (1 - smooth(a * 4)) ;       // 離陸直後は縦に伸びる
      armUp = smooth(Math.min(1, a * 3.5)) * (1 - smooth((a - 0.85) / 0.15) * 0.4);
      tuck = height;
      flap = (a - 0.45);                           // 上昇中は耳が下へ、落下中は上へ
    } else if (u < land) {                         // 着地（潰れる）
      var b = (u - air) / (land - air);
      squash = 1 - smooth(b) * 0.2 + sin(b * Math.PI) * 0.35;
      armUp = 0.5 * (1 - smooth(b));
    } else {                                       // 立ち直り（少し跳ね返る）
      var d = (u - land) / (1 - land);
      squash = (1 - d) * 0.35 * Math.cos(d * Math.PI * 2);
      armUp = 0;
    }
    p.y = -height * 58 + squash * 4;
    p.sy = 1 - squash * 0.13;
    p.sx = 1 + squash * 0.09;
    p.headY = squash * 3 + height * 4;
    p.armR = lerp(REST_ARM_R, 142, clamp01(armUp)) + (armUp < 0 ? armUp * 40 : 0);
    p.armL = lerp(REST_ARM_L, -142, clamp01(armUp)) - (armUp < 0 ? armUp * 40 : 0);
    p.footRy = -tuck * 12; p.footLy = -tuck * 12;
    p.footRr = tuck * 10;  p.footLr = -tuck * 10;
    p.earR = -flap * 38 - squash * 6;
    p.earL = flap * 38 + squash * 6;
    p.sprout = -flap * 30 + sin(t * 18) * tuck * 4;
    p.shadow = 1 - height * 0.45;
    p.eyes = (height > 0.02) ? 'happy' : 'open';
    p.mouth = (height > 0.02) ? 'happy' : 'normal';
    return p;
  }

  // ⑥ 手を振る：片腕(画面の右側の腕)を上げて、くり返し振る
  function poseWave(t) {
    var p = poseIdle(t);
    var raise = smooth(t / 0.35);                      // 動きの最初に腕を上げる
    var ph = t * TAU * 2.4;
    p.armL = lerp(REST_ARM_L, -128, raise) + sin(ph) * 20 * raise;
    p.armR = REST_ARM_R + sin(t * TAU * 0.55 - 0.5) * 3;
    p.rot = sin(ph * 0.5) * 1.2;
    p.headRot = -3.5 * raise + sin(ph * 0.5) * 1.0;
    p.headX = 2 * raise;
    p.earL = sin(ph - 0.6) * 5 * raise;
    p.sprout = sin(t * TAU * 1.3) * 10;
    p.eyes = 'happy';
    p.mouth = 'happy';
    return p;
  }

  // ⑦ 喜ぶ：体が弾み、腕をぱっと広げる
  function poseHappy(t) {
    var p = neutralPose();
    var f = 2.4, ph = t * TAU * f * 0.5;               // |sin| で1回の弾みが半周期
    var s = Math.abs(sin(ph));
    var bottom = Math.pow(1 - s, 5);                   // 着地した瞬間だけ大きくなる
    p.y = -s * 22;
    p.sy = 1 + s * 0.05 - bottom * 0.12;
    p.sx = 1 - s * 0.03 + bottom * 0.08;
    p.headY = bottom * 3 + s * 3;
    p.headRot = sin(ph) * 5;
    p.rot = sin(ph) * 2.2;
    p.armR = REST_ARM_R + 22 + s * 70;
    p.armL = REST_ARM_L - 22 - s * 70;
    p.footRy = -s * 8; p.footLy = -s * 8;
    p.earR = -s * 16 + bottom * 12;
    p.earL = s * 16 - bottom * 12;
    p.sprout = sin(ph * 2 - 0.5) * 16;
    p.shadow = 1 - s * 0.3;
    p.eyes = 'happy';
    p.mouth = 'happy';
    return p;
  }

  // ⑧ 進化：ふるえて光り、フラッシュ → 大きくなってキラキラ
  var EVOLVE_DURATION = 4.6;
  function poseEvolve(t) {
    var p = neutralPose();
    var charge = 1.5, flashT = 1.85, grow = 2.6;
    p.eyes = 'closed'; p.mouth = 'normal';
    if (t < charge) {                                   // ふるえながら光をためる
      var k = t / charge;
      p.x = sin(t * 70) * 2.2 * k;
      p.y = -sin(t * 5) * 2;
      p.glow = 0.15 + 0.7 * k;
      p.bright = 0.25 * k;
      p.armR = REST_ARM_R + 15 * k; p.armL = REST_ARM_L - 15 * k;
      p.sprout = sin(t * 22) * 8 * k;
      p.sy = 1 - 0.05 * k; p.sx = 1 + 0.03 * k;
      p.eyes = 'closed';
    } else if (t < flashT) {                            // まぶしいフラッシュ
      var f = (t - charge) / (flashT - charge);
      p.glow = 1; p.flash = sin(f * Math.PI); p.bright = 0.25 + 3.2 * sin(f * Math.PI);
      p.sy = 0.94 + f * 0.1; p.sx = 1.04 - f * 0.05;
      p.armR = REST_ARM_R + 30; p.armL = REST_ARM_L - 30;
    } else if (t < grow) {                              // ぽんっと大きくなる
      var g = (t - flashT) / (grow - flashT);
      p.glow = 1;
      p.scale = 1 + 0.2 * Math.sin(g * Math.PI * 0.5);
      p.y = -sin(g * Math.PI) * 26;
      p.armR = lerp(REST_ARM_R + 30, 130, smooth(g));
      p.armL = lerp(REST_ARM_L - 30, -130, smooth(g));
      p.eyes = g > 0.4 ? 'happy' : 'closed'; p.mouth = 'happy';
    } else {                                            // キラキラの余韻
      var h = (t - grow) / (EVOLVE_DURATION - grow);
      var s2 = Math.abs(sin(t * TAU * 0.9));
      p.glow = 1 - smooth(h) * 0.9;
      p.scale = lerp(1.2, 1.0, smooth(h));
      p.y = -s2 * 10 * (1 - h);
      p.armR = lerp(130, REST_ARM_R, smooth(h * 1.1)); p.armL = lerp(-130, REST_ARM_L, smooth(h * 1.1));
      p.sprout = sin(t * 9) * 12 * (1 - h);
      p.earR = -s2 * 10 * (1 - h); p.earL = s2 * 10 * (1 - h);
      p.eyes = 'happy'; p.mouth = 'happy';
    }
    return p;
  }

  var POSES = {
    idle: poseIdle, walk: poseWalk, run: poseRun, jump: poseJump,
    wave: poseWave, happy: poseHappy, evolve: poseEvolve
  };

  // ---------------------------------------------------------------
  // 2. 状態の切り替えとブレンド
  // ---------------------------------------------------------------
  var state = 'idle';
  var stateStart = 0;           // その動きを始めた時刻(秒)
  var current = neutralPose();  // いま画面に出しているポーズ（なめらかに追従）
  var NUMERIC_KEYS = Object.keys(neutralPose()).filter(function (k) {
    return typeof neutralPose()[k] === 'number';
  });

  function updateStatusText() {
    el.status.textContent = 'いまの動き：' + STATE_LABEL[state] + '（第' + stage + '段階）';
  }

  // force=true は内部用（進化が終わって待機に戻すとき）
  function setState(next, force) {
    if (!POSES[next]) return;
    if (state === 'evolve' && !force) return;              // 進化中は他の操作を受け付けない
    if (next === 'evolve' && stage >= MAX_STAGE) next = 'happy';  // 最終段階なら喜ぶだけ
    state = next;
    stateStart = nowSec();
    var btns = document.querySelectorAll('.controls .btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-state') === next);
    }
    updateStatusText();
    if (next === 'evolve') { evolveSparkTimer = 0; evolveSwapped = false; }
    if (next === 'happy') { happySparkTimer = 0; }
  }

  function nowSec() { return performance.now() / 1000; }

  // ---------------------------------------------------------------
  // 3. まばたき（目 open ⇔ closed）
  // ---------------------------------------------------------------
  var blinkUntil = 0;
  var nextBlink = nowSec() + 2.5;
  function doBlink() { blinkUntil = nowSec() + 0.15; }
  function updateBlink(tNow) {
    if (tNow >= nextBlink) {
      doBlink();
      // たまに二回続けてまばたき
      nextBlink = tNow + (Math.random() < 0.2 ? 0.35 : 2.4 + Math.random() * 2.6);
    }
    return tNow < blinkUntil;
  }

  // ---------------------------------------------------------------
  // 4. キラキラ演出
  // ---------------------------------------------------------------
  var SPARK_COLORS = ['#fff7c2', '#ffe58a', '#ffffff', '#c8e6ff', '#ffd1e8'];
  var evolveSparkTimer = 0, happySparkTimer = 0;

  // 星を1つ出す。(x,y)=キャラクター座標、radius=飛び散る距離
  function spawnSpark(x, y, dx, dy, size, life, color) {
    var s = document.createElement('span');
    s.className = 'spark';
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.background = color;
    s.style.filter = 'drop-shadow(0 0 3px rgba(255,230,140,.9))';
    el.sparks.appendChild(s);
    var anim = s.animate([
      { transform: 'translate(' + (x - size / 2) + 'px,' + (y - size / 2) + 'px) scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'translate(' + (x + dx * 0.5 - size / 2) + 'px,' + (y + dy * 0.5 - size / 2) + 'px) scale(1) rotate(90deg)', opacity: 1, offset: 0.4 },
      { transform: 'translate(' + (x + dx - size / 2) + 'px,' + (y + dy - size / 2) + 'px) scale(0.2) rotate(200deg)', opacity: 0 }
    ], { duration: life, easing: 'ease-out' });
    anim.onfinish = function () { if (s.parentNode) s.parentNode.removeChild(s); };
  }

  function burstSparks(count, cx, cy, minR, maxR, sizeMin, sizeMax) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * TAU, r = minR + Math.random() * (maxR - minR);
      spawnSpark(cx + Math.cos(a) * 20, cy + Math.sin(a) * 20,
        Math.cos(a) * r, Math.sin(a) * r - 10,
        sizeMin + Math.random() * (sizeMax - sizeMin),
        700 + Math.random() * 700,
        SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0]);
    }
  }

  // キャラクター中心（体の真ん中あたり）
  var CX = 136, CY = 190;

  function updateSparks(dt, t, p) {
    if (state === 'evolve') {
      evolveSparkTimer -= dt;
      if (evolveSparkTimer <= 0) {
        if (t < 1.5) {                                   // 集まってくる光
          evolveSparkTimer = 0.07;
          var a = Math.random() * TAU, r = 150 + Math.random() * 40;
          var sx = CX + Math.cos(a) * r, sy = CY + Math.sin(a) * r;
          spawnSpark(sx, sy, CX - sx, CY - sy, 8 + Math.random() * 9, 800,
            SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0]);
        } else if (t > 1.8) {                            // 飛び散る光
          evolveSparkTimer = (t < 2.6) ? 0.06 : 0.16;
          burstSparks(t < 2.6 ? 4 : 2, CX, CY, 70, 170, 10, 24);
        } else { evolveSparkTimer = 0.05; }
      }
    } else if (state === 'happy') {
      happySparkTimer -= dt;
      if (happySparkTimer <= 0) {
        happySparkTimer = 0.28;
        burstSparks(2, CX, CY - 20, 90, 135, 8, 15);
      }
    }
  }

  // ---------------------------------------------------------------
  // 5. 描画（ポーズ → CSS transform）
  // ---------------------------------------------------------------
  function f(n) { return n.toFixed(2); }

  function applyPose(p) {
    var sc = p.scale * stageScaleNow;   // 演出の大きさ × 進化段階の大きさ

    // 体全体：足元中心に 移動 → 傾き → 潰れ/伸び
    el.rig.style.transform =
      'translate(' + f(p.x) + 'px,' + f(p.y) + 'px) rotate(' + f(p.rot) + 'deg) scale(' + f(p.sx * sc) + ',' + f(p.sy * sc) + ')';
    el.rig.style.filter = p.bright > 0.01 ? 'brightness(' + f(1 + p.bright) + ')' : 'none';

    // 頭グループ
    el.head.style.transform =
      'translate(' + f(p.headX) + 'px,' + f(p.headY) + 'px) rotate(' + f(p.headRot) + 'deg)';

    // 胴体の小さな傾き
    el.body.style.transform = 'rotate(' + f(p.bodyTilt) + 'deg)';

    // 腕・足・耳・芽
    el.armR.style.transform = 'rotate(' + f(p.armR) + 'deg)';
    el.armL.style.transform = 'rotate(' + f(p.armL) + 'deg)';
    el.footR.style.transform = 'translate(' + f(p.footRx) + 'px,' + f(p.footRy) + 'px) rotate(' + f(p.footRr) + 'deg)';
    el.footL.style.transform = 'translate(' + f(p.footLx) + 'px,' + f(p.footLy) + 'px) rotate(' + f(p.footLr) + 'deg)';
    el.earR.style.transform = 'rotate(' + f(p.earR) + 'deg)';
    el.earL.style.transform = 'rotate(' + f(p.earL) + 'deg)';
    el.sprout.style.transform = 'rotate(' + f(p.sprout) + 'deg)';

    // 影（ジャンプで小さく薄く）
    el.shadow.style.transform = 'translateX(' + f(p.x) + 'px) scale(' + f(p.shadow * sc) + ')';
    el.shadow.style.opacity = f(0.35 + 0.65 * p.shadow);

    // 光とフラッシュ
    el.glow.style.opacity = f(p.glow);
    el.glow.style.transform = 'translate(-50%,-50%) scale(' + f(0.55 + p.glow * 0.65) + ')';
    el.flash.style.opacity = f(p.flash * 0.85);
  }

  // 目と口の切り替え（現在の表情）
  var faceCache = {};
  function setFace(eyes, mouth) {
    if (faceCache.eyes !== eyes) {
      el.eyesOpen.classList.toggle('on', eyes === 'open');
      el.eyesClosed.classList.toggle('on', eyes === 'closed');
      el.eyesHappy.classList.toggle('on', eyes === 'happy');
      faceCache.eyes = eyes;
    }
    if (faceCache.mouth !== mouth) {
      el.mouthNormal.classList.toggle('on', mouth === 'normal');
      el.mouthHappy.classList.toggle('on', mouth === 'happy');
      faceCache.mouth = mouth;
    }
  }

  // ---------------------------------------------------------------
  // 6. メインループ
  // ---------------------------------------------------------------
  var lastTime = nowSec();
  var groundX = 0;

  function frame() {
    var tNow = nowSec();
    var dt = Math.min(0.05, tNow - lastTime);
    lastTime = tNow;
    var t = tNow - stateStart;           // この動きを始めてからの時間

    // 進化は時間が来たら待機にもどる
    if (state === 'evolve' && t > EVOLVE_DURATION) { setState('idle', true); t = 0; }

    // フラッシュのピークで見た目を差し替える（1回だけ）
    if (state === 'evolve' && !evolveSwapped && t >= EVOLVE_SWAP_T) {
      evolveSwapped = true;
      applyStage(Math.min(MAX_STAGE, stage + 1));
      updateStatusText();
    }

    var target = POSES[state](t);

    // 現在のポーズを目標へなめらかに近づける（切り替え時のなめらかさ）
    var follow = 1 - Math.exp(-dt * (state === 'evolve' ? 30 : 16));
    for (var i = 0; i < NUMERIC_KEYS.length; i++) {
      var k = NUMERIC_KEYS[i];
      current[k] = current[k] + (target[k] - current[k]) * follow;
    }

    // 進化段階ごとの大きさへ、なめらかに近づける
    stageScaleNow += (STAGES[stage].scale - stageScaleNow) * (1 - Math.exp(-dt * 6));

    applyPose(current);

    // まばたき（目を開けているときだけ、一瞬閉じる）
    var blinking = updateBlink(tNow);
    var eyes = target.eyes;
    if (eyes === 'open' && blinking) eyes = 'closed';
    setFace(eyes, target.mouth);

    // 地面を流す
    groundX -= current.groundSpeed * dt;
    el.ground.style.backgroundPositionX = (groundX % 70) + 'px';

    updateSparks(dt, t, current);
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------
  // 7. 画面サイズに合わせてキャラクターを拡大縮小
  // ---------------------------------------------------------------
  function fitCharacter() {
    var w = el.stage.clientWidth, h = el.stage.clientHeight;
    // 進化で大きくなる分、少し余裕を持たせています（0.72 → 0.62）
    var s = Math.min(w * 0.80 / CHAR_W, h * 0.62 / CHAR_H);
    el.wrap.style.width = (CHAR_W * s) + 'px';
    el.wrap.style.height = (CHAR_H * s) + 'px';
    el.character.style.transform = 'scale(' + s + ')';
  }

  // ---------------------------------------------------------------
  // 8. ガイド表示（パーツ枠・基準点）
  // ---------------------------------------------------------------
  function buildPivotDots() {
    // <img> の中には要素を入れられないので、親要素の中に点を置く
    var targets = [el.armR, el.armL, el.footR, el.footL, el.earR, el.earL, el.sprout, el.head, el.rig];
    targets.forEach(function (node) {
      var cs = getComputedStyle(node);
      var origin = cs.transformOrigin.split(' ');
      var dot = document.createElement('span');
      dot.className = 'pivot-dot';
      // 画像パーツ: 左上位置 + 基準点 / グループ: 基準点そのまま
      var isImg = node.tagName === 'IMG';
      dot.style.left = (isImg ? (node.offsetLeft + parseFloat(origin[0])) : parseFloat(origin[0])) + 'px';
      dot.style.top = (isImg ? (node.offsetTop + parseFloat(origin[1])) : parseFloat(origin[1])) + 'px';
      // 動くパーツと一緒に動くよう、そのパーツと同じ transform を毎フレーム写す
      dot._follow = node;
      (isImg ? node.parentNode : node).appendChild(dot);
      pivotDots.push(dot);
    });
  }
  var pivotDots = [];

  // ---------------------------------------------------------------
  // 9. 起動（画像の読み込みを待ってから開始）
  // ---------------------------------------------------------------
  function start() {
    // 光の元の背景色を覚えておく（段階1に戻すときに使う）
    DEFAULT_GLOW = el.glow.style.background || '';

    fitCharacter();
    window.addEventListener('resize', fitCharacter);

    var btns = document.querySelectorAll('.controls .btn');
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () { setState(b.getAttribute('data-state')); });
    });
    $('blink-btn').addEventListener('click', doBlink);
    $('guide-toggle').addEventListener('change', function (e) {
      document.body.classList.toggle('show-guide', e.target.checked);
    });
    var order = ['idle', 'walk', 'run', 'jump', 'wave', 'happy', 'evolve'];
    window.addEventListener('keydown', function (e) {
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= order.length) setState(order[n - 1]);
    });

    applyStage(1);
    stageScaleNow = STAGES[1].scale;
    updateStatusText();

    setFace('open', 'normal');
    buildPivotDots();
    stateStart = nowSec();
    lastTime = nowSec();
    requestAnimationFrame(frame);
  }

  var imgs = document.querySelectorAll('img.part');
  var remaining = imgs.length;
  function oneLoaded() { remaining--; if (remaining === 0) start(); }
  Array.prototype.forEach.call(imgs, function (img) {
    if (img.complete && img.naturalWidth > 0) oneLoaded();
    else {
      img.addEventListener('load', oneLoaded);
      img.addEventListener('error', function () {
        el.status.textContent = '画像の読み込みに失敗しました：' + img.getAttribute('src') + '（フォルダ構成を確認してください）';
        oneLoaded();
      });
    }
  });
})();