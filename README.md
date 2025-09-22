# MTS: ML-Like TinyScript

[![CI](https://github.com/kmizu/mts/actions/workflows/ci.yml/badge.svg)](https://github.com/kmizu/mts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/kmizu/mts/branch/main/graph/badge.svg)](https://codecov.io/gh/kmizu/mts)

MTSは[toranoana.deno #22](https://yumenosora.connpass.com/event/366823/)のLT発表用に作成したプログラミング言語です。

**Hindley-Milner型推論**と**構造的部分型**を持つ関数型プログラミング言語で、特筆すべきものはありませんが、TypeScript/Deno +
Claude Codeオンリーで実装したのが特徴です。

## ✨ 特徴

### 🎯 言語の核機能

- **式ベース構文** - すべてが式として扱われる
- **Hindley-Milner型推論** - 多相性を持つ自動型推論
- **構造的部分型** - 柔軟なオブジェクト互換性
- **静的型検査** - 実行前のエラー検出
- **第一級関数** - クロージャを持つ関数値
- **再帰関数** - 自己参照関数定義

### 📊 型システム

- **let多相性** - 汎用関数が複数の型で動作
- **型変数** - 自動的な一般化とインスタンス化
- **構造的型付け** - 追加フィールドを持つオブジェクトの互換性
- **型統合** - 自動的な制約解決
- **occurs check** - 無限型の防止

### 🔧 組み込み関数

- **配列操作**: `length`, `head`, `tail`, `push`, `empty`
- **文字列操作**: `concat`, `substring`, `strlen`
- **数学関数**: `sqrt`, `abs`, `floor`, `ceil`
- **I/O関数**: `print`, `println`, `readText`, `writeText`
- **型変換**: `toString`, `toNumber`

### 🛠️ 開発ツール

- **インタラクティブREPL** - シンタックスハイライト付きリアルタイム実行
- **CLIインターフェース** - ファイル実行、式評価、型チェック
- **包括的テスト** - 全言語機能をカバーする100+テスト
- **エラー報告** - 明確で役立つエラーメッセージ

## 🚀 クイックスタート

### 前提条件

- [Deno](https://deno.land/) 1.28+

### インストール

```bash
git clone https://github.com/kmizu/mts.git
cd mts
```

### REPL実行

```bash
deno task repl
```

### ファイル実行

```bash
deno task start examples/hello.mts
```

### コード直接評価

```bash
deno task start -e "let x = 42; x * 2"
```

### 型チェック

```bash
deno task start -t "(x, y) => x + y"
```

## 📖 言語ガイド

### 変数と関数

```javascript
// 変数
let x = 42;
let name = "Alice";
let active = true;

// 関数
let add = (x, y) => x + y;
let square = (x) => x * x;

// 高階関数
let apply = (f, x) => f(x);
let compose = (f, g) => (x) => f(g(x));
```

### 配列とオブジェクト

```javascript
// 配列
let numbers = [1, 2, 3, 4, 5];
let first = head(numbers);
let rest = tail(numbers);
let len = length(numbers);

// オブジェクト
let person = {
  name: "Bob",
  age: 30,
  city: "Tokyo",
};
let personName = person.name;

// ネストした構造
let matrix = [[1, 2], [3, 4]];
let element = matrix[0][1];
```

### 制御フロー

```javascript
// if式
let result = if (x > 0) "positive" else "negative";

// match式
let classify = (n) => {
  match n {
    0 => "zero",
    x if x < 0 => "negative",
    x if x > 100 => "large",
    _ => "positive"
  }
};

// ブロック式
let computation = {
  let a = 10;
  let b = 20;
  a + b
};
```

### 再帰関数

```javascript
// 階乗
let factorial = (n) => {
  if (n <= 1) {
    1;
  } else {
    n * factorial(n - 1);
  }
};

// フィボナッチ
let fib = (n) => {
  if (n <= 1) {
    n;
  } else {
    fib(n - 1) + fib(n - 2);
  }
};
```

### 多相関数

```javascript
// 恒等関数は任意の型で動作
let id = (x) => x;
let num = id(42);        // number
let str = id("hello");   // string
let arr = id([1, 2, 3]); // array

// 汎用ペア作成
let pair = (x, y) => { first: x, second: y };
let numPair = pair(1, 2);
let mixedPair = pair("hello", 42);
```

### 構造的部分型

```javascript
// 関数は追加フィールドを持つオブジェクトを受け入れる
let getX = (obj) => obj.x;
let point2d = { x: 1, y: 2 };
let point3d = { x: 1, y: 2, z: 3 };

let x1 = getX(point2d); // ✅ 動作する
let x2 = getX(point3d); // ✅ 同様に動作（追加フィールドzは無視される）
```

## 🎨 サンプルプログラム

### Hello World

```javascript
// examples/hello.mts
let greeting = "Hello, World!";
let double = (x) => x * 2;
let result = double(21);

// 配列操作
let numbers = [1, 2, 3];
let len = length(numbers);
let first = head(numbers);

// オブジェクトアクセス
let person = {
  name: "Alice",
  age: 30,
};

result; // 戻り値: 42
```

### 高階関数

```javascript
// examples/higher_order.mts
let apply = (f, x) => f(x);
let compose = (f, g) => (x) => f(g(x));

let addOne = (x) => x + 1;
let double = (x) => x * 2;

let addOneAndDouble = compose(double, addOne);

apply(addOneAndDouble, 5); // 戻り値: 12
```

### 階乗

```javascript
// examples/factorial.mts
let factorial = (n) => {
  if (n <= 1) {
    1;
  } else {
    n * factorial(n - 1);
  }
};

factorial(5); // 戻り値: 120
```

## 🧪 開発

### テスト実行

```bash
deno task test
```

### コードフォーマット

```bash
deno task fmt
```

### リント

```bash
deno task lint
```

## 📋 CLI使用方法

```bash
# インタラクティブREPL
deno task repl

# MTSファイルの実行
deno task start <file.mts>

# コードの直接評価
deno task start -e "<code>"

# 式の型チェック
deno task start -t "<expression>"

# ヘルプ表示
deno task start --help
```

### REPLコマンド

- `:help` - ヘルプメッセージを表示
- `:type <expr>` - 式の型を表示
- `:clear` - 画面をクリア
- `:quit` - REPLを終了

## 🏗️ アーキテクチャ

### コアコンポーネント

- **字句解析器** (`src/lexer.ts`) - トークン化
- **構文解析器** (`src/parser.ts`) - AST生成
- **型推論器** (`src/infer.ts`) - 構造的部分型を持つHM型推論
- **評価器** (`src/evaluator.ts`) - ランタイム実行
- **組み込み関数** (`src/builtins.ts`) - 標準ライブラリ関数

### 型システム実装

- **Hindley-Milnerアルゴリズム** - let多相性を持つ型推論
- **統合** - occurs check付き制約解決
- **構造的部分型** - 構造に基づくオブジェクト互換性
- **一般化/インスタンス化** - 自動的な多相型処理

## 📊 テストカバレッジ

- **字句解析器**: 全トークンとエッジケースをカバーする15+テスト
- **構文解析器**: 全構文構造をカバーする30+テスト
- **型推論**: エッジケースと多相性を含む60+テスト
- **評価器**: ランタイム動作をカバーする40+テスト
- **組み込み関数**: 全標準ライブラリ関数の18+テスト

合計: **150+の包括的テスト**

### 🔄 継続的インテグレーション

GitHub Actionsによる自動テスト実行:

```bash
# ローカルでのテスト実行
deno test                    # 全テスト実行
deno test --coverage         # カバレッジ付きテスト
deno fmt --check            # フォーマットチェック
deno lint                   # Lintチェック
```

## 🎯 言語比較

| 機能               | MTS | TypeScript | OCaml | Haskell |
| ------------------ | --- | ---------- | ----- | ------- |
| HM型推論           | ✅  | ❌         | ✅    | ✅      |
| 構造的部分型       | ✅  | ✅         | ❌    | ❌      |
| 第一級関数         | ✅  | ✅         | ✅    | ✅      |
| パターンマッチング | ✅  | ✅         | ✅    | ✅      |
| 再帰関数           | ✅  | ✅         | ✅    | ✅      |
| REPL               | ✅  | ✅         | ✅    | ✅      |

## 🚧 現在の制限

- **相互再帰** - 現在は単純再帰のみサポート
- **モジュールシステム** - import/exportなし
- **標準ライブラリ** - 限定的な組み込み関数
- **パフォーマンス** - インタープリターベース（コンパイルなし）

## 🔮 将来の拡張

- [ ] 相互再帰のための`let ... and`構文
- [ ] インポートを持つモジュールシステム
- [ ] より多くの組み込み関数とデータ構造
- [ ] JavaScriptへのコンパイル
- [ ] LSPでのIDE統合

## 📜 ライセンス

MITライセンス - 自由に使用・改変してください！

## 🤝 コントリビューション

コントリビューション歓迎！このプロジェクトは、現代的な型システム機能を持つ関数型プログラミング言語の実装デモンストレーションとして作成されました。

---

TypeScriptとDenoで❤️を込めて作られました。
