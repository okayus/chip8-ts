# CHIP-8 エミュレータ 実装計画

## CHIP-8 システム仕様

### ハードウェア概要

| コンポーネント | 仕様 |
|---|---|
| メモリ (RAM) | 4,096 バイト (4 KB)。0x000–0x1FF はシステム予約、ROM は 0x200 から配置 |
| ディスプレイ | 64×32 ピクセル、モノクロ (1bit/pixel) |
| レジスタ | V0–VF (汎用 8bit × 16本)。VF はフラグレジスタ |
| プログラムカウンタ | PC: 16bit、初期値 0x200 |
| インデックスレジスタ | I: 16bit、メモリアドレス指定用 |
| スタック | 16 エントリ × 16bit、サブルーチン用 LIFO |
| タイマー | Delay Timer (DT) / Sound Timer (ST): 8bit、60Hz で減算 |
| 入力 | 16 キー (0x0–0xF)、4×4 hex キーパッド |
| オーディオ | 単一トーン、ST > 0 の間ビープ音 |

### フォントデータ

0x000–0x04F (80 バイト) に組み込みフォントスプライト (0–F) を配置。各文字 5 バイト × 16 文字。

### オペコード一覧 (35 命令)

| Opcode | ニーモニック | 動作 |
|---|---|---|
| 0x0000 | NOP | 何もしない |
| 0x00E0 | CLS | 画面クリア |
| 0x00EE | RET | サブルーチンから復帰 (スタック pop → PC) |
| 0x1NNN | JP addr | PC = NNN |
| 0x2NNN | CALL addr | スタック push PC, PC = NNN |
| 0x3XNN | SE Vx, byte | Vx == NN なら次命令スキップ |
| 0x4XNN | SNE Vx, byte | Vx != NN なら次命令スキップ |
| 0x5XY0 | SE Vx, Vy | Vx == Vy なら次命令スキップ |
| 0x6XNN | LD Vx, byte | Vx = NN |
| 0x7XNN | ADD Vx, byte | Vx += NN (キャリーなし) |
| 0x8XY0 | LD Vx, Vy | Vx = Vy |
| 0x8XY1 | OR Vx, Vy | Vx |= Vy |
| 0x8XY2 | AND Vx, Vy | Vx &= Vy |
| 0x8XY3 | XOR Vx, Vy | Vx ^= Vy |
| 0x8XY4 | ADD Vx, Vy | Vx += Vy, VF = carry |
| 0x8XY5 | SUB Vx, Vy | Vx -= Vy, VF = NOT borrow |
| 0x8XY6 | SHR Vx | Vx >>= 1, VF = LSB |
| 0x8XY7 | SUBN Vx, Vy | Vx = Vy - Vx, VF = NOT borrow |
| 0x8XYE | SHL Vx | Vx <<= 1, VF = MSB |
| 0x9XY0 | SNE Vx, Vy | Vx != Vy なら次命令スキップ |
| 0xANNN | LD I, addr | I = NNN |
| 0xBNNN | JP V0, addr | PC = V0 + NNN |
| 0xCXNN | RND Vx, byte | Vx = random() & NN |
| 0xDXYN | DRW Vx, Vy, n | スプライト描画 (XOR)。衝突時 VF = 1 |
| 0xEX9E | SKP Vx | キー Vx 押下中ならスキップ |
| 0xEXA1 | SKNP Vx | キー Vx 非押下ならスキップ |
| 0xFX07 | LD Vx, DT | Vx = DT |
| 0xFX0A | LD Vx, K | キー入力待ち (ブロッキング) |
| 0xFX15 | LD DT, Vx | DT = Vx |
| 0xFX18 | LD ST, Vx | ST = Vx |
| 0xFX1E | ADD I, Vx | I += Vx |
| 0xFX29 | LD F, Vx | I = フォントアドレス (Vx * 5) |
| 0xFX33 | LD B, Vx | BCD 変換: RAM[I..I+2] = 百/十/一の位 |
| 0xFX55 | LD [I], Vx | V0–Vx を RAM[I..] に保存 |
| 0xFX65 | LD Vx, [I] | RAM[I..] から V0–Vx に読み込み |

---

## 実装フェーズ

### Phase 1: ドメイン型定義

**ゴール**: CHIP-8 のすべての値に型的な意味を与える

- [ ] Branded Type 定義 (`Address`, `Byte`, `Word`, `Nibble`, `RegisterIndex`)
- [ ] スマートコンストラクタ (`mkAddress`, `mkByte`, `mkRegisterIndex` 等)
- [ ] `Instruction` 判別共用体 (全 35 命令を ADT で表現)
- [ ] フォントデータ定数
- [ ] テスト: スマートコンストラクタの境界値テスト、不正値の拒否テスト

### Phase 2: デコーダ

**ゴール**: `Word` → `Instruction` の純粋変換

- [ ] `decode(opcode: Word): Instruction` 関数
- [ ] 不明なオペコードに対するエラーハンドリング
- [ ] テスト: 全 35 命令のデコードテスト、不正オペコードのテスト

### Phase 3: CPU 状態とメモリ

**ゴール**: CPU の状態モデルとメモリアクセスの実装

- [ ] `CpuState` 型 (レジスタ, PC, I, SP, スタック, タイマー)
- [ ] `Memory` クラス (4KB RAM, フォント初期配置, ROM ロード)
- [ ] `createInitialCpuState(): CpuState` ファクトリ
- [ ] `fetch(cpu: CpuState, memory: Memory): Word` 関数
- [ ] スタック操作 (`push`, `pop`) と境界チェック
- [ ] テスト: メモリ読み書き、ROM ロード、フォント配置、スタック境界

### Phase 4: 命令実行エンジン

**ゴール**: デコード済み `Instruction` を CPU 状態に適用する

- [ ] ペリフェラルインターフェース定義 (`Display`, `Keyboard`, `Audio`)
- [ ] `execute(cpu: CpuState, memory: Memory, instruction: Instruction, peripherals: Peripherals): void`
- [ ] 算術命令 (ADD, SUB, SHR, SHL) とキャリー/ボロー処理
- [ ] 条件スキップ命令 (SE, SNE)
- [ ] メモリ操作命令 (LD [I], BCD)
- [ ] 描画命令 (DRW) — XOR 描画、衝突検出、ラップアラウンド
- [ ] キー入力命令 (SKP, SKNP, LD Vx K)
- [ ] タイマー命令 (LD DT, LD ST)
- [ ] テスト: 各命令の正常系・境界系テスト (モックペリフェラル使用)

### Phase 5: エミュレータ統合

**ゴール**: fetch → decode → execute ループの統合

- [ ] `Emulator` クラス (CPU + Memory + Peripherals の統合)
- [ ] `tick()` — 1 CPU サイクル実行 (fetch → decode → execute)
- [ ] `tickTimers()` — タイマー減算 (フレームごとに 1 回)
- [ ] `load(rom: Uint8Array)` — ROM 読み込み
- [ ] `reset()` — 初期状態にリセット
- [ ] テスト: 小さな ROM プログラムの統合テスト

### Phase 6: ブラウザフロントエンド

**ゴール**: ブラウザ上で動作する UI

- [ ] Canvas ベースの `CanvasDisplay` 実装 (64×32 をスケーリング描画)
- [ ] `KeyboardInput` 実装 (QWERTY → CHIP-8 hex キーマッピング)
- [ ] `WebAudioBeeper` 実装 (AudioContext による単一トーン)
- [ ] ROM ファイルアップロード UI
- [ ] メインループ (`requestAnimationFrame` + 10 ticks/frame)
- [ ] HTML エントリーポイント

### Phase 7: 仕上げ

- [ ] サンプル ROM の同梱 (公開ドメインの ROM)
- [ ] デバッグ UI (レジスタ表示、ステップ実行)
- [ ] README 作成

---

## キーボードマッピング

```
CHIP-8:           QWERTY:
1 2 3 C           1 2 3 4
4 5 6 D     →     Q W E R
7 8 9 E           A S D F
A 0 B F           Z X C V
```

## 実行サイクル

```
1フレーム (60Hz):
  ├── 10回繰り返し: tick() = fetch → decode → execute
  ├── tickTimers() — DT, ST を 1 減算
  └── render() — 画面バッファを Canvas に描画
```
