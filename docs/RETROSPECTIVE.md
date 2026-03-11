# CHIP-8 エミュレータ実装 振り返り

## 何を実装したか

TypeScript で CHIP-8 エミュレータをフルスクラッチ実装した。ブラウザ上でサンプル ROM（Pong, Tetris 等）が動作する。

### 全体構成

```
src/  (1,113 行)
  domain/          型定義・制約・フォントデータ          159 行
  cpu/             fetch → decode → execute パイプライン  416 行
  emulator/        メモリ管理・統合クラス                117 行
  peripherals/     Display/Keyboard/Audio インターフェース 37 行
  frontend/        Canvas描画・キー入力・Web Audio        144 行
  main.ts          エントリーポイント・イベントループ      102 行

tests/ (1,182 行, 149 テスト)
```

### 各レイヤーの責務

| レイヤー | 主要ファイル | 何をするか |
|---|---|---|
| **domain** | `types.ts`, `instruction.ts`, `font.ts` | 値の「意味」を型で定義する |
| **cpu** | `decode.ts`, `execute.ts`, `fetch.ts`, `state.ts` | CPUの振る舞いを実装する |
| **emulator** | `memory.ts`, `emulator.ts` | メモリ管理とサイクル統合 |
| **peripherals** | `interfaces.ts` | 外部デバイスとの境界を定義する |
| **frontend** | `canvas-display.ts`, `keyboard-input.ts`, `web-audio-beeper.ts` | ブラウザ固有の実装 |

---

## なぜこの実装順序なのか

### Phase 順序と依存関係

```
Phase 1: ドメイン型         ← 他の全てが依存する基盤
    ↓
Phase 2: デコーダ           ← ドメイン型に依存。純粋関数で単体テスト容易
    ↓
Phase 3: CPU状態・メモリ    ← ドメイン型に依存。デコーダと独立
    ↓
Phase 4: 命令実行           ← Phase 1-3 全てに依存。最大のフェーズ
    ↓
Phase 5: エミュレータ統合   ← Phase 2-4 を繋ぐ薄い層
    ↓
Phase 6: ブラウザUI         ← Peripherals インターフェースを実装
    ↓
Phase 7: 仕上げ             ← サンプルROM, デバッグUI, README
```

### なぜ「型」から始めるのか

**ドメイン型を最初に定義する理由は、後続の全フェーズで「何が正しくて何が間違いか」の基準になるから。**

例えば Phase 2 のデコーダを書くとき、`Address` 型が既に定義されていれば、`decode()` の戻り値に `address: Address` と書くだけでコンパイラが「この値は 0x000〜0xFFF の 12bit 整数である」ことを保証する。型がなければ、毎回「この `number` は何を意味するか」を頭で考え続けなければならない。

### なぜ「デコーダ」が 2 番目なのか

デコーダは **純粋関数**（副作用なし、入力から出力が一意に決まる）なので、最もテストしやすい。CPU 状態もメモリも不要で、`Word` を渡して `Instruction` が返るかだけを検証すればいい。ここで全 35 命令のデコードが正しく動くことを確認しておくと、Phase 4 で「命令の実行がおかしい」のか「デコードがおかしい」のかを切り分けられる。

### なぜ「実行エンジン」の前に「メモリ・CPU 状態」なのか

`execute()` 関数は CPU レジスタを読み書きし、メモリにアクセスする。その器（`CpuState`, `Memory`）が先にないと execute のテストが書けない。Phase 3 でメモリの read/write とスタックの push/pop が動くことを確認してから Phase 4 に進むことで、「メモリアクセスのバグ」と「命令実行のバグ」を分離できる。

### なぜ「ブラウザ UI」が最後なのか

**ロジックを先、I/O を後にする。** エミュレータのコアロジック（Phase 1-5）は `node:test` でテストできるが、Canvas や Web Audio はブラウザ環境が必要でテストが難しい。コアを先に固めれば、UI のバグが出てもコア側を疑わなくて済む。

---

## 「ドメインの意味が型・代数的データ型・制約・テストとして表現されている」とは CHIP-8 だとどういうことか

### 問題：素の `number` では区別できない

CHIP-8 のプログラムでは、以下の値が全て「数値」として扱われる：

```typescript
const address = 0x200;   // メモリアドレス (12bit)
const value = 0x42;      // レジスタに格納する値 (8bit)
const opcode = 0x6042;   // 命令語 (16bit)
const regIdx = 0;        // レジスタ番号 (0-15)
const nibble = 5;        // スプライトの高さ (4bit)
```

素の `number` 型では、これらは全て同じ型。つまり以下のバグをコンパイラは検出できない：

```typescript
// NG: アドレスとバイト値を取り違えてもコンパイルが通る
function writeByte(address: number, value: number): void { ... }
writeByte(0x42, 0x200);  // 引数の順序が逆！でもエラーにならない
```

### 解決 1: Branded Type で「意味」を型に埋め込む

```typescript
type Address = number & { readonly [AddressBrand]: typeof AddressBrand };
type Byte    = number & { readonly [ByteBrand]: typeof ByteBrand };

function writeByte(address: Address, value: Byte): void { ... }
writeByte(mkByte(0x42), mkAddress(0x200));  // コンパイルエラー！型が合わない
```

`Address` と `Byte` は実行時には同じ `number` だが、TypeScript のコンパイル時には異なる型として扱われる。これにより **値の「意味」がコード上で明示的になり、取り違えをコンパイラが検出できる。**

CHIP-8 ではこの手法で 5 つのドメイン値を区別している：

| 型 | 意味 | 範囲 | 使用箇所 |
|---|---|---|---|
| `Address` | メモリアドレス | 0x000–0xFFF | PC, I, JP/CALL の引数 |
| `Byte` | 8bit 値 | 0x00–0xFF | レジスタ値, 即値, タイマー |
| `Word` | 16bit 値 | 0x0000–0xFFFF | オペコード (fetch の戻り値) |
| `Nibble` | 4bit 値 | 0x0–0xF | スプライト高さ (DRW命令) |
| `RegisterIndex` | レジスタ番号 | 0–15 | V0–VF の指定 |

### 解決 2: スマートコンストラクタで「制約」を強制する

型だけでは「Address は 0xFFF 以下」という制約は表現できない。スマートコンストラクタが値レベルの不変条件を保証する：

```typescript
function mkAddress(n: number): Address {
  if (!Number.isInteger(n) || n < 0x000 || n > 0xFFF)
    throw new RangeError(`Invalid address: ${n}`);
  return n as Address;
}
```

これにより：
- **型** → コンパイル時に「Address と Byte を混同しない」ことを保証
- **制約** → 実行時に「Address は 0x000〜0xFFF」であることを保証
- **テスト** → 境界値テストで「制約が正しく機能すること」を文書化

```typescript
// tests/domain/types.test.ts から抜粋
describe("mkAddress", () => {
  it("最小値 0x000 を受け入れる", ...);
  it("最大値 0xFFF を受け入れる", ...);
  it("0xFFF を超える値を拒否する", ...);
  it("負の値を拒否する", ...);
  it("小数を拒否する", ...);
});
```

### 解決 3: 代数的データ型 (ADT) で「命令の構造」を表現する

CHIP-8 の 35 命令は、生のオペコード (0x1234 など) のまま処理すると意味が分からない。代数的データ型で **デコード済みの意味のある構造** に変換する：

```typescript
// 生のオペコード: 0xDXYN — 何の命令？引数は？
const opcode = 0xD125;

// デコード後の ADT: 「V1, V2 の座標に高さ 5 のスプライトを描画」
const instruction = { tag: "DRW", vx: 1, vy: 2, nibble: 5 };
```

全 35 命令の型定義：

```typescript
type Instruction =
  | { tag: "NOP" }                              // 引数なし
  | { tag: "CLS" }                              // 引数なし
  | { tag: "JP"; address: Address }             // アドレスのみ
  | { tag: "LD_BYTE"; vx: RegisterIndex; byte: Byte }  // レジスタ + 即値
  | { tag: "ADD_VY"; vx: RegisterIndex; vy: RegisterIndex }  // レジスタ2つ
  | { tag: "DRW"; vx: RegisterIndex; vy: RegisterIndex; nibble: Nibble }
  // ... 全35パターン
```

**ADT の利点：各命令が「必要な引数だけ」を持つ。** `NOP` にアドレスフィールドはなく、`DRW` にはスプライト高さがある。不要なフィールドが存在しないので、不正な状態を構築できない。

### 解決 4: 網羅性チェックで「全命令を処理した」ことを保証する

`execute()` 関数は `switch (instruction.tag)` で全命令を処理する。もし 1 つでも case を書き忘れると、TypeScript がコンパイルエラーを出す：

```typescript
function execute(cpu: CpuState, memory: Memory, instruction: Instruction, ...): void {
  switch (instruction.tag) {
    case "NOP": break;
    case "CLS": peripherals.display.clear(); break;
    case "JP":  cpu.pc = instruction.address; break;
    // ... 全35命令を列挙 ...

    default: {
      // ここに到達 = instruction の型に未処理のケースがある
      const _exhaustive: never = instruction;
      //    ^^^^^^^^^ もし case が足りなければ never に代入できずコンパイルエラー
      throw new Error(`Unhandled: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
```

例えば将来 `Instruction` 型に新しいタグを追加したが `execute()` に case を追加し忘れた場合、`_exhaustive: never` の行でコンパイルが失敗する。**型システムが「全命令を処理したこと」を静的に検証してくれる。**

### 解決 5: テストが「仕様書」になる

テストケースの名前と構造で、CHIP-8 仕様の振る舞いが読み取れるようにする：

```typescript
describe("execute: ADD_VY (8XY4)", () => {
  it("オーバーフローなし: VF = 0", () => {
    // V0 = 10, V1 = 20 → V0 = 30, VF = 0
  });
  it("オーバーフロー: VF = 1, 結果は下位 8bit", () => {
    // V0 = 0xFF, V1 = 0x02 → V0 = 0x01, VF = 1
  });
});
```

テストコードを読むだけで「ADD 命令は 255 を超えるとキャリーフラグが立ち、結果は下位 8bit に切り詰められる」という CHIP-8 の仕様がわかる。

### 解決 6: インターフェースで「境界」を型として表現する

`execute()` はディスプレイに描画し、キーボードを読み、音を鳴らす。しかしこれらの具体的な実装（Canvas? コンソール?）に依存しない：

```typescript
// 実装ではなくインターフェースに依存
interface Display {
  clear(): void;
  xorPixel(x: number, y: number): boolean;
}

// テスト時: モックを渡す
const mockDisplay = { clear() {}, xorPixel() { return false; } };

// 本番時: Canvas 実装を渡す
const canvasDisplay = new CanvasDisplay(canvas);
```

**インターフェースが「外部世界との境界」を型として定義する。** これにより：
- テスト時に DOM や Web Audio なしで全命令をテストできる
- 将来 Canvas 以外の描画先（例: ターミナル）に差し替えられる
- `execute()` のロジックがブラウザ API に一切依存しない

---

## まとめ：型で意味を表現するとはどういうことか

| 手法 | 何を表現するか | CHIP-8 での具体例 |
|---|---|---|
| **Branded Type** | 値の「意味」の区別 | Address ≠ Byte ≠ Word（全て number だが型が異なる） |
| **スマートコンストラクタ** | 値の「制約」 | Address は 0x000〜0xFFF の整数のみ |
| **代数的データ型 (ADT)** | データの「構造」のバリエーション | 35 種の命令、それぞれ異なるフィールド |
| **網羅性チェック** | 処理の「完全性」 | execute() が 35 命令すべてを処理する保証 |
| **インターフェース** | 依存の「境界」 | Display/Keyboard/Audio の抽象化 |
| **テスト** | 振る舞いの「仕様」 | ADD でオーバーフローしたら VF = 1 |

素の `number` と `if-else` だけでも CHIP-8 エミュレータは書ける。しかし型・ADT・制約・テストを組み合わせることで、**「正しい状態しか存在できない」コードになる。** バグが入り込む余地を、コンパイラとテストが自動的に潰してくれる。
