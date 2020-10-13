# cleanup_duty

Google Apps Script で書かれた、 Slack に掃除当番の通知を行う Bot

## 導入手順

1. Slack に通知先チャンネルを作成する

    1. チャンネル名は任意

1. Incoming WebHooks の設定を作成する

    1. `https://<workspace-name>.slack.com/apps/A0F7XDUAZ-incoming-webhooks` を開き、「Add to Slack」 をクリックする

    1. 「Post to Channel」に通知先チャンネルを選択する

    1. その他、「Descriptive Label」等、必要があれば任意に設定する

    1. 「Webhook URL」の値を控えておく

1. Spread Sheet を作成する

    1. Google ドライブにアクセスし、 Spread Sheet を新規作成する

    1. シート名を「担当者」に変更する

    1. 以下を参考に「担当者」シートに入力する

        | |A     |B         |
        |-|------|----------|
        |1|担当者|役割      |
        |2|佐藤  |ゴミ捨て  |
        |3|鈴木  |掃除機    |
        |4|高橋  |トイレ掃除|
        |5|田中  |窓拭き    |
        |6|伊藤  |駐車場    |

    1. 新しいシートを追加し、シート名を「固定担当者」に変更する

    1. 以下を参考に「固定担当者」シートに入力する

        | |A     |B           |
        |-|------|------------|
        |1|担当者|役割        |
        |2|渡辺  |エントランス|
        |3|山本  |応接室      |

1. Google Apps Script プロジェクトを作成する

    1. Spread Sheet -> ツール -> スクリプトエディタをクリックする

    1. ファイル -> プロジェクトのプロパティ -> 情報 -> スクリプトID を控えておく

    1. ファイル -> プロジェクトのプロパティ -> スクリプトのプロパティ -> 行の追加 をクリックする

    1. プロパティに「SLACK_INCOMING_URL」を入力し、値に Slack の Incoming WebHooks 作成時に控えておいた「Webhook URL」の値を入力する

    1. 「保存」をクリックする

1. ソースを入手する

    1. `$ git clone https://github.com/star-clusters/cleanup_duty.git`

1. 依存ライブラリをインストールする

    1. `$ cd path/to/cleanup_duty`

    1. `$ npm install`

1. ソースを配置する

    1. `$ npx clasp login`

    1. `$ cp .clasp.json.example .clasp.json`

    1. `$ vim .clasp.json`

        ```diff
        - {"scriptId":""}
        + {"scriptId":"<Spread Sheet のスクリプトエディタで確認したスクリプトID>"}
        ```

    1. `$ npx clasp push`

1. 定期実行の設定を行う

    1. Spread Sheet のスクリプトエディタを開く

    1. 編集 -> 現在のプロジェクトのトリガー をクリックする

    1. トリガーを追加をクリックし、「実行する関数を選択」に「assignCleaningUpTasks」を選択する

    1. その他、「イベントのソースを選択」等、任意に設定し、「保存」をクリックする

    1. Google アカウントへのアクセスリクエストを許可する

