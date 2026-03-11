# CHIP-8 Emulator (TypeScript)

TypeScript で実装した CHIP-8 エミュレータ。ドメインモデリングを重視し、Branded Type と代数的データ型による型安全な設計。

## 特徴

- **型安全**: Branded Type (`Address`, `Byte`, `Word`, `Nibble`, `RegisterIndex`) で値の取り違えをコンパイル時に防止
- **代数的データ型**: 全 35 命令を Discriminated Union で表現し、exhaustiveness check で網羅性を保証
- **純粋関数**: `decode()` は副作用のない純粋変換、テスト容易
- **149 テスト**: スマートコンストラクタ、デコーダ、全命令の実行、統合テスト

## クイックスタート

```bash
pnpm install
pnpm dev        # ブラウザで http://localhost:5173 を開く
```

サンプル ROM (Pong, Tetris, Invaders 等) をドロップダウンから選択するか、`.ch8` ファイルをアップロード。

## キーボードマッピング

```
CHIP-8:           QWERTY:
1 2 3 C           1 2 3 4
4 5 6 D     →     Q W E R
7 8 9 E           A S D F
A 0 B F           Z X C V
```

## コマンド

```bash
pnpm dev           # 開発サーバー起動
pnpm build         # プロダクションビルド
pnpm test          # テスト実行
pnpm typecheck     # 型チェック
pnpm lint          # リント
```

## アーキテクチャ

```
src/
  domain/          # Branded Types, Instruction ADT, フォントデータ
  cpu/             # decode, execute, fetch, CPU state
  emulator/        # Memory, Emulator 統合クラス
  peripherals/     # Display, Keyboard, Audio インターフェース
  frontend/        # Canvas描画, キー入力, Web Audio
  main.ts          # エントリーポイント
tests/             # node:test によるテスト (149件)
```

## 技術スタック

TypeScript (strict) / Node.js 25 / Vite / Biome / pnpm / node:test
