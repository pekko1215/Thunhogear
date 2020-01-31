/**
 * Created by pekko1215 on 2017/07/15.
 */

const BellPayCoin = 12;

var dummnyLines = {
    "中段": [
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    "上段": [
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 0]
    ],
    "下段": [
        [0, 0, 0],
        [0, 0, 0],
        [1, 1, 1]
    ],
    "右下がり": [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ],
    "右上がり": [
        [0, 0, 1],
        [0, 1, 0],
        [1, 0, 0]
    ],
    "なし": [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ],
    "下中中": [
        [0, 0, 0],
        [0, 1, 1],
        [1, 0, 0]
    ]
}

var YakuData = [{
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['中段']
    }, {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['中段']
    }, {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['中段']
    }, {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['中段']
    },
    {
        name: "ベル",
        pay: [BellPayCoin, 0, 0],
        flashLine: dummnyLines['右下がり']
    },
    {
        name: "ベル",
        pay: [BellPayCoin, 0, 0],
        flashLine: dummnyLines['右下がり']
    },
    {
        name: "ベル",
        pay: [BellPayCoin, 0, 0],
        flashLine: dummnyLines['下中中']
    },
    {
        name: "ベル",
        pay: [BellPayCoin, 1, 1],
        flashLine: dummnyLines['右上がり']
    },
    {
        name: "ベル",
        pay: [BellPayCoin, 1, 1],
        flashLine: dummnyLines['右上がり']
    },
    {
        name: "スイカ",
        pay: [3, 1, 1],
        flashLine: dummnyLines['右下がり']
    },
    {
        name: "1枚役",
        pay: [1, 1, 1],
        flashLine: dummnyLines['なし']
    },
    {
        name: "1枚役",
        pay: [1, 1, 1],
        flashLine: dummnyLines['なし']
    },
    {
        name: "1枚役",
        pay: [1, 1, 1],
        flashLine: dummnyLines['なし']
    },
    {
        name: "1枚役",
        pay: [1, 1, 1],
        flashLine: dummnyLines['なし']
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'チェリー',
        pay: [4, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'チェリー',
        pay: [4, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'BAR揃いリプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'BAR揃いリプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'リーチ目リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: 'リーチ目リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
    {
        name: '突入リプレイ1',
        pay: [0, 0, 0],
        flashLine: [
            [0, 0, 0],
            [1, 1, 0],
            [0, 0, 1]
        ]
    },
    {
        name: '突入リプレイ2',
        pay: [0, 0, 0],
        flashLine: [
            [0, 0, 0],
            [0, 1, 0],
            [1, 0, 1]
        ]
    },
    {
        name: 'リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし'],
        noEffectable: true
    },
    {
        name: '中段プラム',
        pay: [0, 0, 0],
        flashLine: dummnyLines['中段']
    },
    {
        name: 'リーチ目リプレイ',
        pay: [0, 0, 0],
        flashLine: dummnyLines['なし']
    },
]