controlRerquest("data/control.smr", main)

// big1 big2
// jac1
// reg1 reg2
class SaveData {
    constructor({ coin, inCoin, outCoin, playCount, allPlayCount, bonusLog, coinLog, infomations }) {
        this.coin = coin || 0;
        this.playCount = playCount || 0;
        this.allPlayCount = allPlayCount || 0;
        this.bonusLog = bonusLog || [];
        this.currentBonus = null;
        this.inCoin = inCoin || 0;
        this.outCoin = outCoin || 0;
        this.coinLog = coinLog || []
        this.infomations = infomations || { saisyuLog: [] };
        this.infomations.saisyuLog = this.infomations.saisyuLog || [];
    }
    drawInfomation() {}
    bonusStart(name, isFirstBonus = false) {
        if (this.currentBonus) this.bonusEnd();
        this.currentBonus = {
            name,
            hitPlayCount: this.playCount,
            hitAllPlayCount: this.allPlayCount,
            startCoin: this.coin,
            isFirstBonus,
            playCount: 0
        }
        SlotLog(`${name} 開始 ${this.playCount}G(総ゲーム数 ${this.allPlayCount}G)`)
        let e = $('#dataCounter');
        let tower = $('<div class="tower"></div>');
        for (let i = 0; i < this.playCount / 100; i++) {
            let f = $('<div class="floor"></div>');
            if (name == 'BIG') {
                f.addClass('red');
            } else {
                f.addClass('green');
            }
            tower.append(f);
        }
        tower.append(`<div class="type">${name}</div>`);
        tower.append(`<div class="count">${this.playCount}<div>`);
        e.append(tower);
    }
    bonusEnd() {
        if (!this.currentBonus) return;
        this.currentBonus.coin = this.coin - this.currentBonus.startCoin;
        this.bonusLog.push(this.currentBonus);
        delete this.currentBonus.startCoin;

        SlotLog(`獲得枚数 ${this.currentBonus.coin}枚 ${this.currentBonus.playCount}G`);

        this.playCount = 0;

        this.currentBonus = null;
    }
    nextGame() {
        // this.refreshGraph();
        if (this.currentBonus) {
            this.currentBonus.playCount++;
        } else {
            this.playCount++;
        }
        this.allPlayCount++;
        this.coinLog.push(-slotmodule.slotStatus.betCoin);
    }
    static load() {
        return new SaveData(JSON.parse(localStorage.getItem("savedata") || "{}"))
    }
    save() {
        localStorage.setItem('savedata', JSON.stringify(this));
    }
    clear() {
        this.coin = 0;
        this.playCount = 0;
        this.allPlayCount = 0;
        this.bonusLog = [];
        this.currentBonus = null;
        this.inCoin = 0;
        this.outCoin = 0;
        this.coinLog = [];
        this.infomations = { saisyuLog: [] };
    }
    refreshGraph() {
        let c = 0;
        this.chart.load({
            columns: [
                ['差枚数', ...this.coinLog.map(d => {
                    c += d;
                    return c;
                })]
            ]
        })
    }
    get percentage() {
        return this.outCoin / this.inCoin * 100;
    }
    saisyuToppa() {
        if (!this.infomations.saisyuLog) return 0;
        if (!this.infomations.saisyuLog.length) return 0;
        let toppaCount = this.infomations.saisyuLog.filter(d => d);
        return toppaCount.length / this.infomations.saisyuLog.length * 100;
    }
}

let saveData = new SaveData({});

function main() {

    let { flashController, slotStatus } = slotmodule;
    let dummyReplayFlag = false;

    slotmodule.onHitCheck = async(e) => {
        let replayFlag = false;
        console.log({ e, gameMode, bonusData, slotStatus });
        let lastHit = null;
        let payCoin = 0;
        let flashMatrix = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        for (let data of e) {
            let { line, index, matrix } = data;
            let yaku = YakuData[index];
            let { name, pay } = yaku;
            payCoin += pay[3 - slotStatus.betCoin]

            if (!yaku.noEffectable) lastHit = { pay, name, yaku };

            let m = yaku.flashLine || matrix;

            flashMatrix = flashMatrix.map((arr, y) => arr.map((d, x) => d || m[y][x]));
            if (slotStatus.controlCode === Control.code.indexOf('リーチ目リプレイ') && slotStatus.stopOrder[0] == 0) {
                dummyReplayFlag = true
            }
            switch (gameMode) {
                case 'normal':
                    switch (name) {
                        case 'リプレイ':
                            replayFlag = true;
                            break
                        case '中段プラム':
                            replayFlag = true;
                            break
                        case 'リーチ目リプレイ':
                            replayFlag = true;
                            dummyReplayFlag = true;
                            break
                        case '突入リプレイ1':
                            replayFlag = true;
                            break
                        case '突入リプレイ2':
                            replayFlag = true;
                            break
                        case 'BAR揃いリプレイ':
                            dummyReplayFlag = true;
                            replayFlag = true;
                            break

                    }
                    break
            }
        }
        switch (name) {
            default:
                (async() => {
                    while (slotStatus.status !== 'beted') {
                        await flashController.setFlash(FlashData.default, 20);
                        await flashController.setFlash(replaceMatrix(FlashData.default, flashMatrix, ColorData.LINE_F, null), 20)
                    }
                })();
        }
        if (gameMode === 'normal') {
            RTdata = RTdata.onHit(lastHit ? lastHit.name : null);
        }
        return { payCoin, replayFlag };

    }
    window.RTdata = new DefaultRTClass;
    slotmodule.on("bonusEnd", async() => {
        sounder.stopSound("bgm")
        setGamemode("normal");
        if (bonusData.name === 'BIG') {
            RTdata = new DefaultRT;
        }
        slotmodule.freeze();
        console.log(0, coin - bonusData.startPay)
        await sleep(2000);
        slotmodule.resume();
        bonusData = null;
        bonusFlag = null;
        changeBonusSeg();
    });
    slotmodule.onPayEnd = async({ payCoin, replayFlag }) => {
        await effectManeger.onPay(payCoin, slotStatus.betCoin);
        changeBonusSeg();
        if (dummyReplayFlag) {
            await slotmodule.once('pressBet');
            sounder.playSound("3bet")
            dummyReplayFlag = false;
        }
    }
    slotmodule.onBet = async() => {
        flashController.clearFlashReservation();
    }
    slotmodule.onBetCoin = async(betCoin) => {
        changeBonusSeg();
        sounder.playSound("3bet")
        while (betCoin--) {
            saveData.coin--;
            saveData.inCoin++;
            changeCredit(-1);
            await sleep(70);
        }
        segments.payseg.reset();
        if (gameMode.includes('JAC') || gameMode.includes('REG')) {
            changeBonusSeg();
        }
    }
    slotmodule.onPay = async(e) => {

        let { payCoin, replayFlag, noSE } = e;
        let pays = payCoin;
        let loopPaySound = null;
        let payCount = 0;
        let seLoopFlag = true;
        if (!dummyReplayFlag && pays > 1) {
            if (pays == 15) {
                loopPaySound = 'pay15'
                seLoopFlag = false
            } else {
                loopPaySound = 'pay'
            }
            sounder.playSound(loopPaySound, seLoopFlag);
        }
        if (replayFlag && !dummyReplayFlag) {
            await sounder.playSound('replay');
        }
        // SlotLog('payStart');
        while (pays--) {
            saveData.coin++;
            payCount++;
            saveData.outCoin++;
            saveData.coinLog[saveData.coinLog.length - 1]++;
            changeCredit(1);
            segments.payseg.setSegments(payCount)
            await delay(50);
        }
        // SlotLog(JSON.stringify({ loopPaySound, seLoopFlag }));

        changeBonusSeg();
        if (loopPaySound && seLoopFlag) {
            sounder.stopSound(loopPaySound);
            loopPaySound = null;
        }
        return { isReplay: replayFlag };
    }
    let jacFlag = false;
    let firstHit = false;
    slotmodule.onLot = async() => {
        let ret = -1;
        let lotter = lotdata[gameMode] && new Lotter(lotdata[gameMode]);
        let lot = window.power || (lotter ? lotter.lot().name : null);
        window.power = null;
        switch (gameMode) {
            case "normal":
                switch (lot) {
                    case 'リプレイ':
                    case 'はずれ':
                        ret = RTdata.onLot(lot) || lot;
                        break
                    case 'チェリー':
                    case 'スイカ':
                        ret = lot;
                        break
                    case 'リーチ目リプレイ':
                        ret = 'リーチ目リプレイ';
                        break
                    case 'デュランダル':
                        ret = 'リーチ目リプレイ';
                        break
                    default:
                        ret = 'ベル' + (1 + rand(6));
                        if (!effectManeger.isAT && !rand(3)) ret = 'ダミー1枚役こぼし'
                        break
                }
                break


        }
        console.log({ lot, ret, RTdata, effectManeger })
        changeBonusSeg();
        await effectManeger.onLot(lot, ret, gameMode, bonusFlag);
        return Control.code.indexOf(ret);
    }
    slotmodule.onReelStop = async() => {
        sounder.playSound("stop")
    }
    let autoFlag = false;
    $("#autoPlay").on('click', e => {
        autoFlag = true;
        let fn = () => {
            if (!autoFlag) return;
            setTimeout(() => {
                slotmodule.pushEvent.almighty()
                fn();
            }, 500)
        }
        fn();
    })

    const StopAuto = () => {
        autoFlag = false;
    }

    $(window).on('touchstart', StopAuto)
    $(window).on('mousedown', StopAuto)

    $("#cleardata").click(function() {
        if (confirm("データをリセットします。よろしいですか？")) {
            ClearData();
        }
    })

    $('body').on('touchstart', () => {
        slotmodule.pushEvent.almighty()
    })

    slotmodule.on("reelStart", async() => {
        switch (leverEffect) {
            case '遅れ':
                await sleep(300);
                sounder.playSound("start")
                break
            case 'ダブルスタート音':
                sounder.playSound("start")
                await sleep(300);
                sounder.playSound("start")
                break
            case '無音':
                break
            default:
                sounder.playSound("start")
        }
        leverEffect = null;
        changeBonusSeg();
    })
    window.leverEffect = null;
    window.sounder = new Sounder();
    sounder.addFile("sound/stop.wav", "stop").addTag("se");
    sounder.addFile("sound/start.wav", "start").addTag("se").setVolume(0.5);
    sounder.addFile("sound/bet.wav", "3bet").addTag("se").setVolume(0.5);
    sounder.addFile("sound/yokoku_low.mp3", "yokoku_low").addTag("se");
    sounder.addFile("sound/yokoku_high.mp3", "yokoku_high").addTag("se");
    sounder.addFile("sound/pay.wav", "pay").addTag("se");
    sounder.addFile("sound/replay.wav", "replay").addTag("se");
    sounder.addFile("sound/big1.mp3", "big1").addTag("bgm");
    sounder.addFile("sound/big2.mp3", "big2").addTag("bgm");
    sounder.addFile("sound/big3.mp3", "big3").addTag("bgm");
    sounder.addFile("sound/big4.mp3", "big4").addTag("bgm");
    sounder.addFile("sound/big5.mp3", "big5").addTag("bgm");
    sounder.addFile("sound/big6.mp3", "big6").addTag("bgm");
    sounder.addFile("sound/big7.mp3", "big7").addTag("bgm");
    sounder.addFile("sound/bonusHit.mp3", "bonusHit").addTag("se");
    sounder.addFile("sound/big1hit.wav", "big1hit").addTag("se");
    sounder.addFile("sound/moonsuccess.mp3", "moonsuccess").addTag("se");
    sounder.addFile("sound/moonfailed.mp3", "moonfailed").addTag("se");
    sounder.addFile("sound/pay15.mp3", "pay15").addTag("se");
    sounder.addFile("sound/nabi.wav", "nabi").addTag("voice").addTag("se");
    sounder.addFile("sound/reg.mp3", "reg").addTag("bgm");
    sounder.addFile("sound/bonusKakutei.mp3", "bonusKakutei").addTag("se");
    sounder.addFile("sound/bigselect.mp3", "bigselect").addTag("se")
    sounder.addFile("sound/syoto.mp3", "syoto").addTag("se")
    sounder.addFile("sound/bigBonusKakutei.mp3", "bigBonusKakutei").addTag("se");
    sounder.addFile("sound/bonuspay.wav", "bonuspay").addTag("voice").addTag("se");
    sounder.addFile("sound/bpay.wav", "bpay").addTag("se").setVolume(0.5);
    sounder.addFile("sound/chance.mp3", "chance").addTag("se").setVolume(0.5);
    sounder.addFile("sound/hitchance.mp3", "hitchance").addTag("se").setVolume(0.5);
    sounder.addFile("sound/fan1.mp3", "fan1").addTag("se").setVolume(0.5);
    sounder.addFile("sound/fan2.mp3", "fan2").addTag("se").setVolume(0.5);
    sounder.addFile("sound/chancezone.mp3", "chancezone").addTag("bgm").setVolume(0.2);
    sounder.addFile("sound/chancezoneend.mp3", "chancezoneend").addTag("se")
    sounder.addFile("sound/voltageup.mp3", "voltageup").addTag("se").setVolume(0.1)
    sounder.addFile("sound/leverstart.mp3", "leverstart").addTag("se")
    sounder.addFile("sound/kokuti.mp3", "kokuti").addTag("se")
    sounder.addFile("sound/win.mp3", "win").addTag("se")
    sounder.addFile("sound/lose.mp3", "lose").addTag("se")
    sounder.addFile("sound/geki.mp3", "geki").addTag("se")
    sounder.addFile("sound/title.mp3", "title").addTag("se")
    sounder.addFile("sound/type.mp3", "type").addTag("se")
    sounder.addFile("sound/fuse.mp3", "fuse").addTag("se")
    sounder.addFile("sound/jacin.mp3", "jacin").addTag("se")
    sounder.addFile("sound/saisyuStart.mp3", 'saisyuStart').addTag('se');
    sounder.addFile("sound/SaisyuEnd.mp3", 'saisyuEnd').addTag('se');
    sounder.addFile("sound/rushStart.mp3", 'rushStart').addTag('se');
    sounder.addFile("sound/durandal.mp3", 'durandal').addTag('se').setVolume(0.5);
    sounder.addFile("sound/starDust.mp3", 'starDust').addTag('se');
    sounder.addFile("sound/chanceNabi.mp3", 'chanceNabi').addTag('se');
    sounder.addFile("sound/push.mp3", 'push').addTag('se');
    sounder.addFile("sound/vRelease.mp3", 'vRelease').addTag('se');
    sounder.addFile("sound/zesyo.mp3", 'zesyo').addTag('se');

    sounder.setMasterVolume(0.5)

    window.gameMode = 'normal';
    let bonusFlag = null
    let coin = 0;
    window.bonusData = null

    slotmodule.on("leverOn", function() {
        saveData.nextGame();
        changeCredit(0)
    })

    window.Save = function() {
        saveData.save();
        return true;
    }
    window.Load = function() {
        saveData = SaveData.load();
    }
    window.ClearData = function() {
        saveData.clear();
    }

    let oldGameMode = null;

    function setGamemode(mode) {
        oldGameMode = gameMode;
        console.log(`${gameMode} -> ${mode}`)
        switch (mode) {
            case 'normal':
                gameMode = 'normal';
                if (bonusFlag && bonusFlag.includes('JAC')) bonusFlag = null;
                slotmodule.reelController.mode = 0
                slotStatus.maxBet = 3;
                break
            case 'BIG':
                gameMode = 'BIG';
                slotmodule.reelController.mode = 1
                slotStatus.maxBet = 3;
                break
            case 'REG':
                gameMode = 'REG';
                slotmodule.reelController.mode = 2
                slotStatus.maxBet = 1;
                break
            case 'JAC1':
                gameMode = 'JAC1';
                slotmodule.reelController.mode = 2
                slotStatus.maxBet = 1;
                break
            case 'JAC2':
                gameMode = 'JAC2';
                slotmodule.reelController.mode = 2
                slotStatus.maxBet = 1;
                break
            case 'JAC3':
                gameMode = 'JAC3';
                slotmodule.reelController.mode = 2
                slotStatus.maxBet = 2;
        }
    }
    let segments = {
        creditseg: segInit("#creditSegment", 2),
        payseg: segInit("#paySegment", 2),
        effectseg: segInit("#effectSegment", 3)
    }
    let credit = 50;
    segments.creditseg.setSegments(50);
    segments.creditseg.setOffColor(80, 30, 30);
    segments.payseg.setOffColor(80, 30, 30);
    segments.effectseg.setOffColor(5, 5, 5);
    segments.creditseg.reset();
    segments.payseg.reset();
    segments.effectseg.reset();
    let lotgame;

    function changeCredit(delta) {
        credit += delta;
        if (credit < 0) {
            credit = 0;
        }
        if (credit > 50) {
            credit = 50;
        }

        let bonusLot = saveData.allPlayCount / saveData.bonusLog.filter(d => d.isFirstBonus).length

        $(".GameData").html(`
差枚数:${saveData.coin}枚<br>
ゲーム数:${saveData.playCount}G 総:${saveData.allPlayCount}G<br>
機械割:${(''+saveData.percentage).slice(0,5)}%<br>
最終決戦突破率:${(''+saveData.saisyuToppa()).slice(0,5)}%<br>
初当たり確率:1/${''+bonusLot}
`)
        segments.creditseg.setSegments(credit)
    }


    let RandomSegIntervals = [false, false, false];

    function changeBonusSeg() {
        if (effectManeger instanceof NormalEffect) {
            segments.effectseg.reset();
            return
        }
        let { atData } = effectManeger;
        $('#coinCounter').text(advantage.MAXCoin - advantage.coinCount);
        $('#renCounter').text(atData.bonusLog.length);
        if (effectManeger.gameCount !== undefined) {
            if (effectManeger.gameCount === '???') {
                if (RandomSegIntervals.includes(true)) return;
                RandomSegIntervals.fill(true);
                let segCount = 0;
                let e = () => {
                    setTimeout(() => {
                        if (!RandomSegIntervals.includes(true)) return;
                        segments.effectseg.segments.forEach(s => {
                            s.draw({
                                ['abcdefg' [segCount]]: 1
                            });
                        })
                        segCount++;
                        if (segCount == 7) segCount = 0;
                        e();
                    }, 30)
                }
                e();
            } else {
                segments.effectseg.setSegments(effectManeger.gameCount);
                RandomSegIntervals.fill(false)
            }
        }

    }
    const VoltageMap = {
        CZ: {
            low: [
                [50, 49, 1, 0, 0, ],
                [0, 50, 49, 1, 0, ],
                [0, 0, 60, 40, 0, ],
                [0, 0, 0, 99, 1, ],
                [0, 0, 0, 0, 100],
            ],
            high: [
                [30, 62, 7, 1, 0],
                [0, 30, 62, 7, 1],
                [0, 0, 59, 40, 1],
                [0, 0, 0, 80, 15],
                [0, 0, 0, 0, 100],
            ],
        },
        normal: {
            'はずれ': [89, 10, 0, 1, 0],
            'リプレイ': [68, 30, 2, 0, 0],
            'ベル': [100, 0, 0, 0, 0],
            'チェリー': [20, 0, 20, 50, 10],
            'スイカ': [20, 0, 20, 50, 10],
            'BIG1': [15, 5, 10, 30, 40],
            'BIG2': [15, 5, 5, 5, 70],
            'チャンス目': [5, 25, 35, 35, 0]
        }
    }


    const voltageElements = [...$('.colorBar')].map($);

    async function upVoltage(from, to) {

        while (from < to) {
            let el = voltageElements[from]
            if (!el) {
                from++;
                continue;
            }
            el.addClass('show');
            await sounder.playSound('voltageup')
            from++;
        }
    }

    function voltageReset() {
        $('.colorBar').removeClass('show');
    }

    async function TypeWra(text, timing = 0) {
        return new Promise(r => {
            let f = (cb) => {
                slotmodule.freeze();
                Typewriter(text, {
                    speed: 150,
                    delay: 5000,
                }).change((t) => {
                    t != "\n" && sounder.playSound('type');
                }).title(() => {
                    sounder.playSound('title');
                }).finish((e) => {
                    e.parentNode.removeChild(e);
                    setTimeout(() => {
                        slotmodule.resume();
                        r();
                    }, 1000)
                });
            }
            if (timing == 0) return f();
            let f2 = () => {
                slotmodule.once('reelStop', async() => {
                    timing--;
                    if (timing == 0) {
                        slotmodule.freeze();
                        await sleep(2000);
                        return f();
                    }
                    f2();
                })
            }
            f2();
        })


    }

    async function ARTNabi(control) {
        let idx = new Number(control[control.length - 1]) - 1;
        sounder.playSound('nabi');
        console.log(FlashData.Nabi[idx])
        flashController.setFlash(FlashData.Nabi[idx]);
        await slotmodule.once('reelStop');
        flashController.clearFlashReservation();
    }

    let voltageIndex;
    let isEffected = false;
    let isGekiLamp;
    let bonusKokutid = false;
    async function effect(control, lot) {
        switch (gameMode) {
            case 'normal':
                $('#geki').removeClass('show')
                $('.colorBar').removeClass('show');
                if (bonusKokutid) break;
                let dinamite = false;
                if (/ダイナマイト/.test(control)) {
                    sounder.playSound('fuse');
                    $('#geki').addClass('show')
                    dinamite = true;
                }
                let effectLot = bonusFlag || lot || 'はずれ';
                let arr = VoltageMap.normal[effectLot];
                let effected = false;
                if (arr && !dinamite) {
                    let idx = ArrayLot(arr);
                    if (bonusFlag !== null) {
                        if (idx > 0 && !rand(8)) {
                            await slotmodule.once('stop');
                            effected = true;
                            upVoltage(voltageIndex, voltageIndex = idx);
                        }
                    }
                    if (!effected) {
                        upVoltage(voltageIndex, voltageIndex = idx);
                    }
                }

                firstHit = false;
                break
            default:
                $('#geki').removeClass('show')
                $('.colorBar').removeClass('show');
                if (control === 'JACGAME2') {
                    sounder.playSound('fuse');
                    $('#geki').addClass('show')
                }
        }
    }
    $(window).bind("unload", function() {
        Save();
    });
    Load();
}

function ContinueLot(r) {
    let p = 0;
    while (Math.random() < r) p++;
    return p;
}

function and() {
    return Array.prototype.slice.call(arguments).every(function(f) {
        return f
    })
}

function or() {
    return Array.prototype.slice.call(arguments).some(function(f) {
        return f
    })
}

function rand(m, n = 0) {
    return Math.floor(Math.random() * m) + n;
}


function flipMatrix(base) {
    let out = JSON.parse(JSON.stringify(base));
    return out.map(function(m) {
        return m.map(function(p) {
            return 1 - p;
        })
    })
}

function segInit(selector, size) {
    let cangvas = $(selector)[0];
    let sc = new SegmentControler(cangvas, size, 0, -3, 50, 30);
    sc.setOffColor(120, 120, 120)
    sc.setOnColor(230, 0, 0)
    sc.reset();
    return sc;
}

function delay(ms) {
    return new Promise(r => {
        setTimeout(r, ms);
    })
}

async function sleep(t) {
    return new Promise(r => {
        setTimeout(r, t);
    })
}


function ArrayLot(list) {
    let sum = list.reduce((a, b) => a + b);
    let r = rand(sum);
    return list.findIndex(n => {
        return (r -= n) < 0;
    })
}

const SL = [];

function SlotLog(text) {
    SL.unshift(text);

    $('#slotLogs').html(SL.join('<br>'))
}