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
    │   │   ├── Header.jsx   # 画面上部のヘッダーバー（メンバー管理モーダル起動含む）
    │   │   └── Panel.jsx    # コントロールパネル（条件設定や情報表示）
    │   ├── modal/
    │   │   └── MemberManagerModal.jsx # Supabase連携パートメンバー登録・編集モーダル
    │   ├── stage/
    │   │   ├── Stage.jsx    # ステージ全体
    │   │   ├── Column.jsx   # 列（Vn1st, Vn2ndなど）
    │   │   ├── Pult.jsx     # プルト（オモテ・ウラのペア）
    │   │   ├── Slot.jsx     # 1人分の座席枠
    │   │   └── MemberCard.jsx # ドラッグ可能なメンバーカード
    │   └── shared/          # 共通パーツ（ボタンやローディングスピナーなど）
    │
    ├── hooks/               # カスタムフック（ロジックの分離）
    │   ├── useSeating.jsx   # メンバーデータ（Supabase取得）、座席配置の状態管理
    │   └── useDragDrop.js   # ドラッグ＆ドロップの座標計算やスワップ処理
    │
    ├── services/            # データ通信サービス
    │   └── memberService.js # SupabaseパートメンバーのCRUD処理
    │
    ├── lib/                 # 外部ライブラリクライアント
    │   └── supabaseClient.js# Supabaseクライアント初期化
    │
    ├── utils/               # 汎用ロジック（UIを持たない純粋な関数）
    │   ├── parser.js        # XLSXの読み込み・パース処理
    │   ├── export.js        # テキスト出力やクリップボードへのコピー処理
    │   └── constants.js     # パートごとの色（COLORS）や表示順（PART_ORDER）
    │
    └── styles/
        └── index.css        # Tailwindのインポートと、最低限のグローバルCSS