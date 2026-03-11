# CHIP-8 Emulator — TypeScript Implementation

## プロジェクト概要

CHIP-8 エミュレータの TypeScript 実装。ドメインモデリングを重視し、型安全性と意味の明確さを最優先とする。

## 設計原則: 型と代数的データ型で「意味」を表現する

このプロジェクトでは、コードのあらゆるレイヤーにおいて **ドメインの意味が型・代数的データ型・制約・テストとして表現されている** ことを求める。

### 1. Branded Type / Opaque Type でドメイン値を区別する

素の `number` ではなく、ドメイン上の意味を持つ型を定義する。

```typescript
// NG: ただの number — Address と Byte の取り違えをコンパイラが検出できない
function writeByte(address: number, value: number): void

// OK: Branded Type で意味を区別する
type Address = number & { readonly __brand: unique symbol }
type Byte = number & { readonly __brand: unique symbol }
type Word = number & { readonly __brand: unique symbol }
type RegisterIndex = number & { readonly __brand: unique symbol }

function writeByte(address: Address, value: Byte): void
```

### 2. 代数的データ型 (Discriminated Union) でオペコードを表現する

オペコードは生の `number` のまま処理せず、デコード結果を判別共用体で表現する。

```typescript
type Instruction =
  | { tag: "CLS" }
  | { tag: "RET" }
  | { tag: "JP"; address: Address }
  | { tag: "CALL"; address: Address }
  | { tag: "SE_BYTE"; vx: RegisterIndex; byte: Byte }
  | { tag: "ADD_VY"; vx: RegisterIndex; vy: RegisterIndex }
  | { tag: "DRW"; vx: RegisterIndex; vy: RegisterIndex; nibble: Nibble }
  // ... 全35命令
```

`execute` 関数は `switch (instruction.tag)` で網羅性チェック（exhaustiveness check）が効く。

### 3. 制約をスマートコンストラクタで強制する

型だけでは表現しきれない不変条件はファクトリ関数で保証する。

```typescript
function mkAddress(n: number): Address {
  if (n < 0x000 || n > 0xFFF) throw new RangeError(`Invalid address: ${n}`)
  return n as Address
}
```

### 4. テストはドメインの「仕様書」として書く

テストケースの名前と構造で、CHIP-8 仕様の振る舞いが読み取れるようにする。

```typescript
describe("Instruction: 8XY4 (ADD VX, VY)", () => {
  it("VX + VY がオーバーフローしない場合、VF = 0", () => { ... })
  it("VX + VY がオーバーフローする場合、VF = 1 かつ結果は下位8bit", () => { ... })
})
```

### 5. 副作用と純粋計算を分離する

- **純粋関数**: `decode(word: Word): Instruction` — 副作用なし、テスト容易
- **副作用あり**: `execute(cpu: CpuState, instruction: Instruction): void` — CPU 状態を変更
- **外部依存**: Display, Keyboard, Audio はインターフェースで抽象化し、テスト時にモック可能にする

### 6. 型で不可能な状態を表現不能にする

- `RegisterIndex` を `0..15` に制限するバリデーション
- `StackPointer` に対する push/pop 境界チェック
- `Screen` バッファを `Uint8Array` + 型付きアクセサで管理

## 開発フロー

- main ブランチへの直プッシュは禁止（ブランチ保護設定済み）
- Phase ごとにブランチを作成し、PR を通じてマージする

### ワークフロー

1. `main` から Phase ブランチを作成 (`phase/{番号}-{短い説明}`)
2. 実装 + テスト + lint + typecheck を全て pass させる
3. PR を作成し、description に以下を記述:
   - 何を実装するか（スコープ）
   - ファイル構成・型設計の方針
   - テスト方針
4. セルフレビュー（diff を確認し、設計原則に沿っているか検証）
5. 問題なければ squash merge し、リモートブランチを削除
6. `main` を pull して次の Phase へ

### ブランチ命名規則

```
phase/{phase番号}-{短い説明}
例: phase/1-domain-types, phase/2-decoder
```

### チェックリスト (PR マージ前)

- `pnpm test` — 全テスト pass
- `pnpm typecheck` — 型チェック pass
- `pnpm lint` — Biome lint pass
- diff のセルフレビュー完了

## 技術スタック

- **言語**: TypeScript (strict mode)
- **ランタイム**: Node.js 25 (ネイティブ TS 実行)
- **フロントエンド**: ブラウザ Canvas API
- **テスト**: node:test (Node.js 組み込みテストランナー)
- **リンター**: Biome
- **パッケージマネージャー**: pnpm

## ディレクトリ構成

```
src/
  domain/          # ドメイン型定義 (Address, Byte, RegisterIndex, Instruction, etc.)
  cpu/             # CPU エミュレーション (fetch, decode, execute)
  emulator/        # Emulator 統合 (メモリ, タイマー, スタック管理)
  peripherals/     # Display, Keyboard, Audio のインターフェース & 実装
  frontend/        # Canvas レンダリング, キー入力バインディング
  main.ts          # エントリーポイント
tests/
  domain/          # ドメイン型のテスト
  cpu/             # decode / execute のテスト
  emulator/        # 統合テスト
```

## コマンド

```bash
pnpm install       # 依存インストール
pnpm dev           # 開発サーバー起動
pnpm test          # テスト実行 (node --test)
pnpm lint          # リント (biome)
pnpm typecheck     # 型チェック (tsc --noEmit)
```
