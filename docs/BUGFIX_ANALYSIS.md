# バグ修正の分析 — 足りなかった「意味」

## 発見されたバグ一覧

| # | バグ | 症状 | 根本原因 |
|---|------|------|----------|
| 1 | アニメーションループ多重起動 | ROM を切り替えるたびにゲーム速度が倍増 | ループの一意性が保証されていない |
| 2 | ROM 切り替え時の画面クリア漏れ | 前の ROM のピクセルが残ったまま次の ROM が描画される | display の所有権と責務が曖昧 |
| 3 | リセット時の画面クリア漏れ | Reset 後もキャンバスに描画が残る | バグ2と同根 |

---

## バグ1: アニメーションループ多重起動

### 何が起きていたか

```typescript
// 修正前
function startEmulation(rom: Uint8Array, name: string) {
  emulator.reset();
  emulator.load(rom);
  running = true;
  requestAnimationFrame(mainLoop);  // ← 毎回新しいループを追加
}
```

ROM を選択するたびに `requestAnimationFrame(mainLoop)` が呼ばれる。
前のループは `running = true` のまま動き続けるため、ループが2重・3重に並走する。

- 1回目: 10 ticks/frame
- 2回目: 20 ticks/frame（ループ2つ）
- 3回目: 30 ticks/frame（ループ3つ）

結果として、BRIX のボールが異常な速度で動く。

### 何の「意味」が足りなかったか

**「エミュレーションループは常にただ1つしか存在しない」という不変条件（invariant）が表現されていなかった。**

`requestAnimationFrame` は「次のフレームで関数を呼んでほしい」という低レベルな API であり、
「現在ループが走っているかどうか」を管理する責務はアプリケーション側にある。
しかし、コードにはループの一意性を保証する仕組みがなかった。

`running` フラグは「ループを続行するか」を制御するが、
「ループのインスタンスが1つだけか」は制御しない。
これは `boolean` 1つでは表現しきれないステートマシンの遷移を、
暗黙的に `boolean` で済ませてしまった結果である。

### 修正: ループの ID を保持し、開始前に既存ループを破棄する

```typescript
// 修正後
let animFrameId = 0;

function startEmulation(rom: Uint8Array, name: string) {
  running = false;
  cancelAnimationFrame(animFrameId);  // 既存ループを確実に停止

  emulator.reset();
  display.clear();
  emulator.load(rom);
  running = true;
  animFrameId = requestAnimationFrame(mainLoop);
}
```

`animFrameId` がループの「ハンドル」として機能し、
新しいループを始める前に古いループを明示的に破棄する。

### 学び: 「ただ1つ」を型や制御フローで保証する

ドメインモデリングでは Branded Type やスマートコンストラクタで不正な値を防いだが、
**ランタイムのリソース管理（ループ、タイマー、イベントリスナー）にも同じ考え方が必要**。

「1つしか存在してはいけないもの」は、コードの構造で1つしか存在できないようにすべき。
例えば:

- ループ ID を保持して `cancel → start` を必ずペアにする（今回の修正）
- `AbortController` でイベントリスナーのライフサイクルを管理する
- シングルトンパターンでリソースの一意性を型レベルで保証する

---

## バグ2・3: 画面クリア漏れ

### 何が起きていたか

```typescript
// Emulator.reset() の中身
reset(): void {
  this.cpu = createInitialCpuState();
  this.memory.reset();
  // display.clear() は呼ばれない！
}
```

`emulator.reset()` は CPU とメモリをリセットするが、ディスプレイはリセットしない。
`CanvasDisplay` は自身の `pixels[][]` 配列にピクセル状態を保持しており、
Emulator がリセットされても古いピクセルデータが残り続ける。

### 何の「意味」が足りなかったか

**「リセット」の意味が不完全だった。**

`Emulator.reset()` は「エミュレータを初期状態に戻す」という意味を持つべきだが、
実際には「CPU とメモリだけを初期状態に戻す」という部分的なリセットでしかなかった。

問題の本質は **ディスプレイの所有権と責務の境界が曖昧** だったこと。

```
Emulator は Peripherals（Display, Keyboard, Audio）を「使う」が「所有」はしていない。
  ↓
Emulator.reset() は自分が「所有する」CPU・Memory だけをリセットした。
  ↓
Display は Peripherals インターフェースの向こう側にあり、リセット対象から漏れた。
```

これは設計上の意図的な分離（Display はフロントエンド層が所有する）の副作用である。
しかし、「リセット = 全状態を初期化」というユーザーの期待には応えられていなかった。

### 修正: 呼び出し側で display.clear() を明示的に呼ぶ

```typescript
function startEmulation(rom: Uint8Array, name: string) {
  running = false;
  cancelAnimationFrame(animFrameId);
  emulator.reset();
  display.clear();   // ← 明示的に追加
  emulator.load(rom);
  running = true;
  animFrameId = requestAnimationFrame(mainLoop);
}
```

### 別の設計選択肢: Emulator がディスプレイのリセットも担う

```typescript
// 選択肢A: Emulator.reset() が peripherals もリセット
reset(): void {
  this.cpu = createInitialCpuState();
  this.memory.reset();
  this.peripherals.display.clear();   // Emulator が責任を持つ
  this.peripherals.audio.stopBeep();
}
```

今回は呼び出し側で `display.clear()` を追加する方式を採ったが、
「リセットの意味」を Emulator に集約するなら選択肢 A の方が一貫性がある。
トレードオフは:

| 方式 | メリット | デメリット |
|------|----------|------------|
| 呼び出し側で clear | Emulator と Display の疎結合を維持 | リセット処理が分散、呼び忘れリスク |
| Emulator.reset() に含める | 「リセット」の意味が1箇所に集約 | Emulator が Peripherals の状態管理に介入 |

---

## 共通する教訓

### 1. 「意味の完全性」を検証する

型で値の正しさを保証しても、**操作の意味が不完全** だとバグになる。
`reset()` が「全状態の初期化」を意味するなら、その「全」に何が含まれるかを明示すべき。

### 2. ドメインモデルの外側にもモデリングが必要

CHIP-8 の命令セット・メモリ・レジスタには丁寧な型設計を施したが、
**ランタイムリソース（アニメーションループ、描画バッファ）の状態管理** は
素の変数とフラグで済ませてしまった。

ドメイン層の型安全性は、それを動かすインフラ層のバグを防がない。

### 3. ブラウザテストでしか見つからないバグがある

- ループ多重起動: ユニットテストでは `requestAnimationFrame` を使わない
- 画面クリア漏れ: ユニットテストでは Canvas の実体がない

E2E テストと手動ブラウザ確認の両方が、ドメインロジック以外のバグ発見に不可欠だった。

### 4. テトリスのゲームオーバー問題

テトリスでブロックが積み上がってもゲームオーバーにならない問題は、
**エミュレータのバグではなく ROM の仕様**。
CHIP-8 の TETRIS ROM にはいくつかのバリエーションがあり、
ゲームオーバー判定が未実装のものや、特定のキー操作を前提とするものがある。
エミュレータ側で全 35 命令が正しく実行されていることはユニットテストで保証済み。
