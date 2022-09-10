# 婚禮入席小助手
婚禮入席小助手嘗試用最簡單有效的方式協助排除婚禮入座時，招待需要拿著座位圖 + 名單手忙腳亂的問題。

作為一位被找來幫親朋好友忙的招待，你不清楚名單上有誰，也不清楚某些字怎麼念、長什麼樣子，婚禮入席小助手則可以幫你在茫茫名單中找出相似度高的對應，減少在紙張上遊走、賓客等待的時間。

----

## 使用情境
- 當賓客需要招待幫忙帶位，請對方講出自己的名字
- 透過文字手動輸入或是語音輸入 (不必挑字，系統會將讀音相似的名單撈出來)
- 得到相似的查詢結果名單後請賓客入席
- (Optional) 不確定是否正確時可以將結果名單給賓客自行確認

----

## How to use it
```
$docker run mtpeak/take-a-seat-guide-assistant:1.0.3
```

確認網站有上線
```
$curl localhost:8000
```

**當沒建立過賓客名單時，輸入名單** (已經建立過名單變無法重新建立/修改) - 格式請見 [名單 example](source.json.example)
```
$curl -XPOST -H 'Content-Type: application/json' "http://localhost:8000/source" -d '[{ "name": "桌號 1", members: ["阿方", "小明", "阿漢"] }]'
```

開啟部署 domain，開始嘗試查詢

----

## Environments
|Name                    |Description                                                |Default                  |
|------------------------|-----------------------------------------------------------|-------------------------|
|SQLALCHEMY_DATABASE_URL |DB 連線用 URL (`mysql://username:password@server/db`......) |sqlite:///./sql_app.db   |

----

## 注意事項
專案經過 test on production 後歸總了一些目前無法 cover 的 use case
- 賓客名單的名字需要盡可能完善 (包含攜伴、家族)，很多都不是登記者來問但招待也不一定當下就知道對方是不是登記人 (如果無法完善名單招待一開始需先詢問對方是不是登記的人)
- 招待本人需要至少兩位
  - 需要可以機動協助重新安排座位 (調度的權利)，或是有辦法聯絡/找到婚宴主辦方的長輩協助排除 **不管帶對或帶錯位，入席的賓客需要換桌 (整桌或個人)**
  - 可能會有情況需要招待離開入口區，所以需要一位留著備援 (zero downtime)
- 需要準備多份完整的賓客/桌位名單，提供給當招待來不及處理或是自行入座使用 (load balance)

----

## Note
目前使用上需要自行部署在獨立的 host 上，尚未知專案的使用度為何，如果有其他人敲碗想要可以在同一個 host 下管理 - 不需自立門戶準備環境再來擴充功能。

---

## Other resources
- 邀約/確認賓客名單用的 Google Form 參考
  - https://docs.google.com/forms/d/1_6MkX3YNV2pwer0Q0n5TuSh5VxHQs0fWoZ3fC7pPbVg/prefill (全部問題展開)
  - https://docs.google.com/forms/d/1_6MkX3YNV2pwer0Q0n5TuSh5VxHQs0fWoZ3fC7pPbVg/edit?usp=sharing (可以直接複製，請不要修改原始內容)
