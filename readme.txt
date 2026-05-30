project-root/
├── index.html               # Viteのエントリーポイント
├── package.json             # 依存パッケージ管理
├── vite.config.js           # Viteの設定ファイル
├── tailwind.config.js       # Tailwind CSSの設定ファイル
├── postcss.config.js        # PostCSSの設定（Tailwind用）
│
└── src/
    ├── main.jsx             # Reactのルートレンダリング
    ├── App.jsx              # アプリのメインコンポーネント（全体レイアウト）
    │
    ├── components/          # UIコンポーネント（役割ごとに細分化）
    │   ├── layout/
    │   │   ├── Header.jsx   # 画面上部のヘッダーバー
    │   │   └── Panel.jsx    # コントロールパネル（条件設定や情報表示）
    │   ├── stage/
    │   │   ├── Stage.jsx    # ステージ全体
    │   │   ├── Column.jsx   # 列（Vn1st, Vn2ndなど）
    │   │   ├── Pult.jsx     # プルト（オモテ・ウラのペア）
    │   │   ├── Slot.jsx     # 1人分の座席枠
    │   │   └── MemberCard.jsx # ドラッグ可能なメンバーカード
    │   └── shared/          # 共通パーツ（ボタンやローディングスピナーなど）
    │
    ├── hooks/               # カスタムフック（ロジックの分離）
    │   ├── useSeating.js    # メンバーデータや座席配置のグローバルな状態管理
    │   └── useDragDrop.js   # ドラッグ＆ドロップの座標計算やスワップ処理
    │
    ├── utils/               # 汎用ロジック（UIを持たない純粋な関数）
    │   ├── parser.js        # XLSXの読み込み・パース処理
    │   ├── export.js        # テキスト出力やクリップボードへのコピー処理
    │   └── constants.js     # パートごとの色（COLORS）や定数（VN_PARTS）
    │
    └── styles/
        └── index.css        # Tailwindのインポートと、最低限のグローバルCSS