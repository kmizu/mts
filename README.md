# MTS: ML-Like TinyScript

[![CI](https://github.com/kmizu/mts/actions/workflows/ci.yml/badge.svg)](https://github.com/kmizu/mts/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/kmizu/mts/branch/main/graph/badge.svg)](https://codecov.io/gh/kmizu/mts)

MTSは[toranoana.deno #22](https://yumenosora.connpass.com/event/366823/)のLT発表用に作成したプログラミング言語です。

**Hindley-Milner型推論**と**列多相性（Row
Polymorphism）**を持つ関数型プログラミング言語で、特筆すべきものはありませんが、TypeScript/Deno +
Claude Codeオンリーで実装したのが特徴です。

## ✨ 特徴

### 🎯 言語の核機能

- **式ベース構文** - すべてが式として扱われる
- **Hindley-Milner型推論** - 多相性を持つ自動型推論
- **列多相性** - 追加フィールドを許可する柔軟なオブジェクト型
- **静的型検査** - 実行前のエラー検出
- **第一級関数** - クロージャを持つ関数値
- **再帰関数** - 自己参照関数定義
- **辞書/連想配列** - 任意の型をキーとする連想配列

### 📊 型システム

- **let多相性** - 汎用関数が複数の型で動作
- **型変数** - 自動的な一般化とインスタンス化
- **列多相性** - 行変数（ρ）による開いたレコード型の表現
- **構造的部分型** - TypeScriptライクなサブタイピング
- **型統合** - 自動的な制約解決
- **occurs check** - 無限型の防止

### 🔧 組み込み関数

- **配列操作**: `length`, `head`, `tail`, `push`, `empty`, `range`, `sum`, `product`, `flatten`,
  `unique`, `chunk`, `zip`
- **辞書操作**: `dictKeys`, `dictValues`, `dictEntries`, `dictFromEntries`, `dictMerge`, `dictHas`,
  `dictSet`, `dictDelete`, `dictSize`
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
deno task start -e 'let dict = ["name": "Alice", "age": "30"]; dict["name"]'
```

### 型チェック

```bash
deno task start -t "(x, y) => x + y"
deno task start -t '["key": "value", "num": 42]'
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

### 配列、辞書、オブジェクト

```javascript
// 配列
let numbers = [1, 2, 3, 4, 5];
let first = head(numbers);
let rest = tail(numbers);
let len = length(numbers);

// 辞書/連想配列
let userDict = ["name": "Alice", "age": "30", "city": "Tokyo"];
let userName = userDict["name"];
let userAge = userDict["age"];

// 数字キーの辞書
let monthNames = [1: "January", 2: "February", 3: "March"];
let firstMonth = monthNames[1];

// 型注釈付き辞書
let scores: Dict<string, number> = ["math": 95, "science": 87];
let inventory: [string : number] = ["apples": 50, "oranges": 30];

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

// 辞書とオブジェクトの組み合わせ
let userProfiles = [
  "alice": { name: "Alice", age: 30 },
  "bob": { name: "Bob", age: 25 }
];
let aliceProfile = userProfiles["alice"];
let aliceName = aliceProfile.name;
```

### モジュール

```javascript
// math.mts
let double = (n) => n * 2;
let triple = (n) => n * 3;

// main.mts
import { double, triple as timesThree } from "./math.mts";

let summary = {
  twice: double(21),
  thrice: timesThree(14),
};
summary;
```

モジュールは相対パス（`./` や `../`）で指定します。`.mts` 拡張子は省略可能です。

### 相互再帰

```javascript
let even = (n) =>
  if (n == 0) {
    true
  } else {
    odd(n - 1)
  }
and odd = (n) =>
  if (n == 0) {
    false
  } else {
    even(n - 1)
  };

even(10)
```

`let ... and`構文はトップレベルでもブロック内でも使用でき、複数の定義が互いを参照するケースに対応します。

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

### 列多相性（Row Polymorphism）

```javascript
// 関数は追加フィールドを持つオブジェクトを受け入れる
// getXの型: ({ x: T | ρ }) => T （ρは追加フィールドを表す行変数）
let getX = (obj) => obj.x;
let sumXY = (p) => p.x + p.y; // 型: ({ x: number, y: number | ρ }) => number

let point2d = { x: 1, y: 2 };
let point3d = { x: 1, y: 2, z: 3 };

let x1 = getX(point2d); // ✅ 動作する
let x2 = getX(point3d); // ✅ 同様に動作（追加フィールドzは無視される）
let sum = sumXY(point3d); // ✅ 複数フィールドアクセスも動作（zは無視される）
```

### 構造的部分型（Structural Subtyping）

MTSは幅方向の構造的部分型と関数の反変/共変をサポートします。

```javascript
// 幅部分型: { x, y } ≤ { x }
let f = (p) => p.x; // ({ x: T | ρ }) => T
let r = ((g) => g({ x: 1, y: 2 }))(f); // fは{x}を受けるが{x,y}でもOK

// if式の合流: 共通フィールドで合流
let v = if (true) { x: 1, y: 2 } else { x: 0, z: 9 };
let vx = v.x; // vの型は{ x: number }として扱われる
```

サンプル: `examples/structural_subtyping.mts`（幅部分型の基本）、
`examples/function_subtyping.mts`（関数の部分型）、 `examples/if_structural_join.mts`（if合流）。

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

### 辞書/連想配列

```javascript
// examples/dictionaries.mts
let person = ["name": "Alice", "age": 30, "city": "Tokyo"];
let name = person["name"];
let age = person["age"];

// 数字キーの辞書
let numbers = [1: "one", 2: "two", 3: "three"];
let first = numbers[1];

// 動的キー
let key = "dynamic";
let dynamicDict = [key: "computed key value"];
let value = dynamicDict[key];

// ネストした辞書
let config = [
  "database": ["host": "localhost", "port": 5432],
  "cache": ["host": "redis.local", "port": 6379]
];
let dbHost = config["database"]["host"];

name; // 戻り値: "Alice"
```

### 列多相性（Row Polymorphism）

```javascript
// examples/row_polymorphism.mts
let getX = (obj) => obj.x; // 型: ({ x: T | ρ }) => T
let sumXY = (p) => p.x + p.y; // 型: ({ x: number, y: number | ρ }) => number
let sumXYZ = (p) => p.x + p.y + p.z; // 型: ({ x: number, y: number, z: number | ρ }) => number

let point2d = { x: 1, y: 2 };
let point3d = { x: 1, y: 2, z: 3 };
let point4d = { x: 5, y: 10, z: 15, w: 20 };

// 行多相性により、必要なフィールドがあれば追加フィールドは無視される
let x1 = getX(point2d); // ✅ Works - has x
let x2 = getX(point3d); // ✅ Works - has x (z ignored)
let sum1 = sumXY(point3d); // ✅ Works - has x,y (z ignored)
let sum2 = sumXYZ(point4d); // ✅ Works - has x,y,z (w ignored)

sum2; // 戻り値: 30
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
- **型推論器** (`src/infer.ts`) - 列多相性を持つHM型推論
- **評価器** (`src/evaluator.ts`) - ランタイム実行
- **組み込み関数** (`src/builtins.ts`) - 標準ライブラリ関数

### 型システム実装

- **Hindley-Milnerアルゴリズム** - let多相性を持つ型推論
- **統合** - occurs check付き制約解決
- **列多相性** - 行変数による開いたレコード型の推論
- **一般化/インスタンス化** - 自動的な多相型処理

## 📊 テストカバレッジ

- **字句解析器**: 全トークンとエッジケースをカバーする15+テスト
- **構文解析器**: 辞書と配列を含む全構文構造の35+テスト
- **型推論**: 辞書型推論を含むエッジケースと多相性の70+テスト
- **評価器**: 辞書操作を含むランタイム動作の50+テスト
- **組み込み関数**: 全標準ライブラリ関数の18+テスト
- **型注釈**: 配列・辞書型注釈を含む30+テスト
- **高度な型推論**: 列多相性等の複雑な型推論の30+テスト

合計: **276の包括的テスト** (10のテストファイル、21のサンプル例)

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
| 列多相性           | ✅  | ❌         | ✅    | ❌      |
| 第一級関数         | ✅  | ✅         | ✅    | ✅      |
| パターンマッチング | ✅  | ✅         | ✅    | ✅      |
| 再帰関数           | ✅  | ✅         | ✅    | ✅      |
| REPL               | ✅  | ✅         | ✅    | ✅      |

## 🚧 現在の制限

- **モジュールシステム** - 相対パスのみ対応（循環依存は未対応）
- **標準ライブラリ** - まだ小規模（I/Oや外部リソースは未対応）
- **パフォーマンス** - インタープリターベース（コンパイルなし）

## 🔮 将来の拡張

- [x] 相互再帰のための`let ... and`構文
- [x] インポートを持つモジュールシステム
- [x] より多くの組み込み関数とデータ構造
- [ ] JavaScriptへのコンパイル
- [ ] LSPでのIDE統合

## 📜 ライセンス

MITライセンス - 自由に使用・改変してください！

## 🤝 コントリビューション

コントリビューション歓迎！このプロジェクトは、現代的な型システム機能を持つ関数型プログラミング言語の実装デモンストレーションとして作成されました。

---

TypeScriptとDenoで❤️を込めて作られました。
