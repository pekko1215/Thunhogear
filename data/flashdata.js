/**
 * Created by pekko1215 on 2017/07/16.
 */
function replaceMatrix(base, matrix, front, back) {
    let out = JSON.parse(JSON.stringify(base));
    matrix.forEach(function(m, i) {
        m.forEach(function(g, j) {
            if (g == 1) {
                front && (out.front[i][j] = front);
                back && (out.back[i][j] = back);
            }
        })
    })
    return out;
}
const ColorData = {
    DEFAULT_B: {
        color: 0xFFFFFF,
        alpha: 0
    },
    DEFAULT_F: {
        color: 0xffffff,
        alpha: 0
    },
    RED_B: {
        color: 0xff0000,
        alpha: 0.3
    },
    LINE_F: {
        color: 0xcccccc,
        alpha: 0.5
    },
    SYOTO_B: {
        color: 0x222222,
        alpha: 0.5
    },
    SYOTO_F: {
        color: 0x888888,
        alpha: 0.9
    },
    Orange: {
        color: 0xFFA500,
        alpha: 0.8
    },
    Aqua: {
        color: 0x00FFFF,
        alpha: 0.8
    },
    Yellow: {
        color: 0xFFF100,
        alpha: 0.3
    }
}

const FlashData = {
    default: {
        back: Array(3).fill(Array(3).fill(ColorData.DEFAULT_B)),
        front: Array(3).fill(Array(3).fill(ColorData.DEFAULT_F))
    },
    redtest: {
        back: Array(3).fill(Array(3).fill(ColorData.RED_B)),
        front: Array(3).fill(Array(3).fill(ColorData.RED_B))
    },
    syoto: {
        back: [
            [ColorData.SYOTO_B, ColorData.SYOTO_B, ColorData.SYOTO_B],
            [ColorData.SYOTO_B, ColorData.SYOTO_B, ColorData.SYOTO_B],
            [ColorData.SYOTO_B, ColorData.SYOTO_B, ColorData.SYOTO_B]
        ],
        front: Array(3).fill(Array(3).fill(ColorData.DEFAULT_F))
    },
    BlueFlash: {
        back: Array(3).fill(Array(3).fill({ color: 0x0000ff, alpha: 0.4 })),
        front: Array(3).fill(Array(3).fill(ColorData.SYOTO_F))
    }
}

FlashData.Nabi = [
    replaceMatrix(FlashData.default, [
        [1, 0, 0],
        [0, 0, 0],
        [1, 0, 0]
    ], null, ColorData.SYOTO_B),
    replaceMatrix(FlashData.default, [
        [0, 1, 0],
        [0, 0, 0],
        [0, 1, 0]
    ], null, ColorData.SYOTO_B),
    replaceMatrix(FlashData.default, [
        [0, 0, 1],
        [0, 0, 0],
        [0, 0, 1]
    ], null, ColorData.SYOTO_B)
]

FlashData.YellowV = {
    front: FlashData.default.front,
    back: [
        [ColorData.Yellow, ColorData.SYOTO_B, ColorData.Yellow],
        [ColorData.Yellow, ColorData.SYOTO_B, ColorData.Yellow],
        [ColorData.SYOTO_B, ColorData.Yellow, ColorData.SYOTO_B]
    ]
}
FlashData.YellowAll = {
    front: FlashData.default.front,
    back: [
        [ColorData.Yellow, ColorData.Yellow, ColorData.Yellow],
        [ColorData.Yellow, ColorData.Yellow, ColorData.Yellow],
        [ColorData.Yellow, ColorData.Yellow, ColorData.Yellow]
    ]
}