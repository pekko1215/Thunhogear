function SlotModuleMk2() {
    this.width = paneldata.width;
    this.height = paneldata.height;
    this.LOTMODE = {};
    this.reelControl = reelControl;
    ["NORMAL", "BIG", "JAC"].forEach(function(d, i) {
        this.LOTMODE[d] = i
    }, this)

    // ステージを作る
    this.stage = new PIXI.Stage();
    this.events = {};
    this.backflash;
    // レンダラーを作る
    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {
        backgroundColor: paneldata.reel.background
    });
    // レンダラーのviewをDOMに追加する
    document.getElementById("pixiview").appendChild(this.renderer.view);

    this.registerKeyControl()

    var that = this;
    this.spilitas = [];
    this.reelChips = []; //リールチップ単体のオブジェクトを入れる配列
    this.reelChipData = { blank: paneldata.reel.blank }; //リールチップ共通の情報を記憶
    PIXI.loader.add("reelchip", "img/reelchip.json")
        .load(function(loader, resources) {
            var SpriteKeys = [];
            Object.keys(resources.reelchip.textures).forEach(function(key, i) {
                // spilita.push(PIXI.Sprite.fromFrame(key))
                SpriteKeys.push(key)
                if (i == 0) {
                    that.reelChipData.width = resources.reelchip.textures[key].width;
                    that.reelChipData.height = resources.reelchip.textures[key].height;
                }
            })
            for (var reel = 0; reel < 3; reel++) {
                that.reelChips.push([]);
                for (var i = 0; i < that.reelControl.controlData.reelLength; i++) {
                    var obj = that.stage.addChild(PIXI.Sprite.fromFrame(SpriteKeys[that.reelControl.controlData.reelArray[reel][i]]))
                    obj.position.x = (that.reelChipData.width + that.reelChipData.blank) * reel;
                    obj.position.y = (that.reelChipData.height) * i;
                    that.reelChips[reel].push(obj)
                }
            }
            that.emit("resourceLoaded", { stage: that.stage })
            that.initFlash()
        })
        // アニメーション関数を定義する
    this.playControlData = {
        reelStatus: [
            "stop",
            "stop",
            "stop"
        ],
        reelSlipLength: [0, 0, 0],
        controlCode: 0,
        maxbet: 3,
        playingStatus: "betwait",
        betcoin: 3,
        lotmode: this.LOTMODE.NORMAL,
        flashReservation: [],
        wait: 0,
        oldtime: new Date()
    }
    frame = 0

    function animate() {
        requestAnimationFrame(animate); // 次の描画タイミングでanimateを呼び出す
        //ここにかく
        that.reelChips.forEach(function(reelarray, i) {
            switch (that.playControlData.reelStatus[i]) {
                case 'move':
                    that.reelMove(i, control.reel.speed);
                    break;
                case 'sliping':
                    that.reelSlip(i, control.reel.slipspeed)
                    break;
            }
        })
        that.drawFlash()
        that.UpdatePlayingStatus();
        // フレーム数をインクリメント
        frame++;

        // フレーム数が２で割り切れなければ描画しない
        that.renderer.render(that.stage); // 描画する
    }

    var oldyaku;

    // 次のアニメーションフレームでanimate()を呼び出してもらう
    requestAnimationFrame(animate);
}

SlotModuleMk2.prototype.getHitYakus = function() {
    var lines = [];
    var hitcount = 0;
    var pay = 0;
    var hityaku = [];
    for (i = 0; i < this.reelControl.controlData.maxLine; i++) {
        lines[i] = [];
        var matrix = new Array(3);
        for (var m = 0; m < 3; m++) {
            matrix[m] = [];
            for (var g = 0; g < 3; g++) {
                matrix[m][g] = 0;
            }
        }
        if (this.reelControl.controlData.betLine[i][3] > this.playControlData.betcoin) {
            continue;
        }

        var line_char = [];
        for (j = 0; j < 3; j++) {
            matrix[this.reelControl.controlData.betLine[i][j]][j] = 1
            line_char.push(this.getReelChar(j, (this.getReelPos(j) + this.reelControl.controlData.betLine[i][j]) % this.reelControl.controlData.reelLength))
        }
        this.reelControl.controlData.yakuList.forEach((d, j) => {
            if (YakuData[j + 1].dummy) { return }
            var yakuarray = new Array(3).fill(0);
            // console.log(d)
            yakuarray[0] = d & 0xF;
            d = d >> 4;
            yakuarray[1] = d & 0xF;
            d = d >> 4;
            yakuarray[2] = d & 0xF;
            d = d >> 4;
            var yakumode = d & 0xF;
            d = d >> 4;
            if (yakuarray.every((d, i) => {
                    return (line_char[i] == d || d == 0xF) && (yakumode & (1 << this.playControlData.lotmode)) != 0
                })) {
                lines[i].push(YakuData[j + 1]) //YakuDataの0ははずれ
                hityaku.push(YakuData[j + 1]);
                hityaku[hityaku.length - 1].line = i;
                hityaku[hityaku.length - 1].matrix = matrix
                hitcount++;
                pay += YakuData[j + 1].pay[this.playControlData.lotmode]
            }

        })
        if (lines[i].length == 0) {
            lines[i].push(YakuData[0])
        }
    }

    if (pay > control.maxpay[this.playControlData.betcoin - 1]) {
        pay = control.maxpay[this.playControlData.betcoin - 1]
    }

    return {
        lines: lines,
        hits: hitcount,
        pay: pay,
        hityaku: hityaku
    }
}

SlotModuleMk2.prototype.reelSlip = function(reel, speed) {
    if (this.playControlData.reelStatus[reel] == "sliping") {
        if (this.playControlData.reelSlipLength[reel] > speed) {
            this.reelMove(reel, speed);
            this.playControlData.reelSlipLength[reel] -= speed;
        } else {
            this.reelMove(reel, this.playControlData.reelSlipLength[reel]);
            this.playControlData.reelStatus[reel] = "stop"
            this.playControlData.reelSlipLength[reel] = 0;
            if (this.getMoveingCount() == 0) {
                this.playControlData.playingStatus = "reelstop"
            }
        }
    }
}

SlotModuleMk2.prototype.registerKeyControl = function() {
    var that = this;
    var stopButtonSmart = function(e) {
        var rect = e.target.getBoundingClientRect();
        pushScreen({
            x: e.changedTouches[0].clientX - rect.left,
            y: e.changedTouches[0].clientY - rect.top
        })
    }
    var stopButtonPC = function(e) {
        pushScreen({
            x: e.clientX - e.target.getBoundingClientRect().left,
            y: e.clientY - e.target.getBoundingClientRect().top
        })
    }

    function pushScreen(pos) {
        switch (that.playControlData.playingStatus) {
            case 'started':
                that.stopReel(Math.floor(pos.x / (that.width / 3)))
                break;
            default:
                allkeyListener.press();
        }
    }

    $('canvas')[0].addEventListener('touchstart', stopButtonSmart)
    $('canvas')[0].addEventListener('mousedown', stopButtonPC)
    var leftkeyListener = keyboard(keyconfig.left);
    var centerkeyListener = keyboard(keyconfig.center);
    var rightkeyListener = keyboard(keyconfig.right);
    var betkeyListener = keyboard(keyconfig.bet);
    var leverkeyListener = keyboard(keyconfig.lever);
    var allkeyListener = keyboard(keyconfig.all);

    leftkeyListener.press = function() {
        that.stopReel(0)
    }
    centerkeyListener.press = function() {
        that.stopReel(1);
    }
    rightkeyListener.press = function() {
        that.stopReel(2);
    }
    allkeyListener.press = function() {
        that.emit("pressAllmity")
        var zyunjo = that.zyunjo || [1, 2, 3]
        zyunjo = [...zyunjo]
        for (var i = 0; i < 3; i++) {
            if (that.stopReel(zyunjo.indexOf(i + 1))) {
                if (i == 2) {
                    that.zyunjo = null
                }
                return;
            }
        }
        if (that.playControlData.playingStatus != "beted") {
            that.betCoin(3);
            return;
        }
        if (that.playControlData.playingStatus == "beted") {
            that.leverON()
            return;
        }
    }
    leverkeyListener.press = function() {
        that.emit("pressLever")
        that.leverON()
    }
    betkeyListener.press = function() {
        that.emit("pressBet")
        that.betCoin(3)
    }

    this.almighty = allkeyListener.press
}

SlotModuleMk2.prototype.UpdatePlayingStatus = function() {
    if (this.playControlData.wait > 0) {
        var deltaTime = new Date() - this.playControlData.oldtime;
        this.playControlData.wait -= deltaTime;
        if (this.playControlData.wait < 0)
            this.playControlData.wait = 0;
        this.playControlData.oldtime = new Date()
    }
    if (this.freezeFlag) { return }
    switch (this.playControlData.playingStatus) {
        case 'betwait':
            break;
        case 'beted':
            break;
        case 'leveron':
            break;
        case 'wait':
            if (this.playControlData.wait == 0) {
                this.playControlData.reelStatus.fill('move')
                this.playControlData.playingStatus = "started"
                this.playControlData.wait = control.wait;
                this.emit("reelstart");
            }
            break;
        case 'started':
            break;
        case 'reelstop':
            if (this.getMoveingCount() == 0) {
                this.playControlData.playingStatus = "allreelstop"
            } else {
                this.playControlData.playingStatus = "started";
            }
            break;
        case 'allreelstop':
            this.playControlData.playingStatus = "allreelstopwait";
            oldyaku = this.getHitYakus();
            oldyaku.stopend = () => {
                this.playControlData.playingStatus = "pay";
            }
            this.emit("allreelstop", oldyaku);
            break;
        case "allreelstopwait":
            break;
        case "pay":
            this.playControlData.playingStatus = "paying";
            var sendData;
            this.emit("pay", sendData = {
                hityaku: oldyaku,
                payend: () => {
                    this.playControlData.playingStatus = "betwait";
                    this.emit("payend", oldyaku)
                    this.playControlData.betcoin = 0
                },
                replay: () => {
                    this.emit("payend", oldyaku)
                    this.playControlData.playingStatus = "beted"
                }
            })
            break;
        case 'paying':
            break;
    }
}


SlotModuleMk2.prototype.betCoin = function(coin) {
    if (this.freezeFlag) { return }
    if (this.playControlData.playingStatus != "betwait") {
        if (this.playControlData.playingStatus != "beted" || this.playControlData.betcoin == this.playControlData.maxbet) {
            return false;
        }
    }
    this.playControlData.betcoin = this.playControlData.betcoin + coin;
    if (this.playControlData.betcoin > this.playControlData.maxbet) {
        coin += this.playControlData.maxbet - this.playControlData.betcoin
        this.playControlData.betcoin = this.playControlData.maxbet
    }
    if (this.playControlData.betcoin >= control.minbet) {
        this.playControlData.playingStatus = "beting"
        this.emit("bet", {
            coin: coin,
            betend: () => {
                this.playControlData.playingStatus = "beted"
            }
        })
    }
}


SlotModuleMk2.prototype.getMoveingCount = function() {
    return this.playControlData.reelStatus.filter(function(stat) {
        return stat == "move"
    }).length
}

SlotModuleMk2.prototype.setPlayControlData = function(data) {
    this.playControlData = data;
}

SlotModuleMk2.prototype.getReelChips = function() {
    return this.reelChips
}

SlotModuleMk2.prototype.stopReel = function(reel) {
    if (this.freezeFlag) { return }
    if (this.playControlData.reelStatus[reel] != 'move' || this.playControlData.reelStatus.some(function(d) {
            return d == "sliping"
        })) {
        return false;
    }
    var slip = this.getReelPos(reel) - this.getReelSlip(reel, this.getReelPos(reel));
    if (slip < 0)
        slip = this.reelChips[reel].length + slip
    this.reelSlipStart(reel, slip);
    this.emit("reelstop", {
        count: this.getMoveingCount(),
        reel: reel
    });
    this.playControlData.reelStatus[reel] = "sliping";
    return true;
}

SlotModuleMk2.prototype.getPlayControlData = function() {
    return this.playControlData
}

SlotModuleMk2.prototype.reelSlipStart = function(reel, slips) {
    this.playControlData.reelSlipLength[reel] = -this.getReelPosStrict(reel).gap + this.reelChipData.height * slips;
    if (this.playControlData.reelSlipLength[reel] < 0) {
        console.log("闇が深いコード");
        this.playControlData.reelSlipLength[reel] += this.reelChipData.height * slips;
    }
}

SlotModuleMk2.prototype.getReelChar = function(reel, pos) {
    return this.reelControl.controlData.reelArray[reel][pos]
}


SlotModuleMk2.prototype.getReelSlip = function(reel, pos) {
    switch (this.getMoveingCount()) {
        case 3:
            return this.reelControl.getStopPos1st(this.playControlData.controlCode, reel, pos)
            break;
        case 2:
            return this.reelControl.getStopPos2nd(reel, pos)
            break;
        case 1:
            return this.reelControl.getStopPos3rd(reel, pos)
            break;
    }
}

SlotModuleMk2.prototype.reelMove = function(reel, speed) {
    var reelChipData = this.reelChipData;
    this.reelChips[reel].forEach(function(chip) {
        chip.position.y += speed;
        if (chip.position.y > paneldata.reel.height) {
            chip.position.y = chip.position.y - reelChipData.height * reelControl.controlData.reelLength
        }
        if ((chip.position.y < -reelChipData.height * reelControl.controlData.reelLength) && speed < 0) {
            chip.position.y = reelChipData.height
        }
    })
}

SlotModuleMk2.prototype.drawFlash = function() {
    var playControlData = this.playControlData
    var backflash = this.backflash;
    var reelControl = this.reelControl
    var reelChips = this.reelChips;
    var reelChipData = this.reelChipData
    if (playControlData.flashReservation.length == 0) {
        return;
    }
    backflash && backflash.clear();
    for (var y = 0; y < 3; y++) {
        for (x = 0; x < 3; x++) {
            var charindex = this.getReelPos(x)
            var flash = playControlData.flashReservation[0].flash;
            backflash.beginFill(flash.back[y][x].color, flash.back[y][x].alpha);
            var xsize = reelChipData.width + reelChipData.blank;
            var ysize = reelChipData.height
            backflash.drawRect(xsize * x, ysize * y, xsize, ysize);
            if (y == 0) {
                if (reelChips[x][charindex].tint == 0xFFFFFF) {
                    reelChips[x][(charindex + 4) % reelControl.controlData.reelLength].tint = 0xFFFFFF;

                }
            }
            reelChips[x][(charindex + y) % this.reelControl.controlData.reelLength].tint = flash.front[y][x].color;
        }
    }
    playControlData.flashReservation[0].timer--;
    if (playControlData.flashReservation[0].timer < 0) {
        playControlData.flashReservation[0].callback && playControlData.flashReservation[0].callback();
        playControlData.flashReservation.shift();
        for (var reel = 0; reel < 3; reel++) {
            for (var p = 0; p < reelChips[reel].length; p++) {
                reelChips[reel][p].tint = 0xFFFFFF
            }
        }
    }
}

SlotModuleMk2.prototype.leverON = function() {
    if (this.freezeFlag) { return }
    if (this.playControlData.playingStatus != "beted") {
        return false;
    }
    this.playControlData.controlCode = this.emit("lot")[0];
    if (typeof this.playControlData.controlCode === "string") {
        this.playControlData.controlCode = control.code.indexOf(this.playControlData.controlCode)
    }
    this.emit("leveron")
    this.playControlData.playingStatus = 'wait';
    return true;
}

SlotModuleMk2.prototype.on = function(key, callback) {
    if (!(key in this.events)) {
        this.events[key] = [];
    }
    this.events[key].push({
        once: false,
        event: callback
    });
}

SlotModuleMk2.prototype.once = async function(key, callback = () => {}) {
    return new Promise((r) => {
        if (!(key in this.events)) {
            this.events[key] = [];
        }
        this.events[key].push({
            once: true,
            event: () => {
                callback();
                r();
            }
        });
    })
}
SlotModuleMk2.prototype.emit = function(key, param) {
    var emitter = [];
    if (param === undefined) {
        param = {};
    }
    param.playControlData = this.getPlayControlData();
    if (key in this.events) {
        this.events[key].forEach(function(call, i) {
            emitter.push(call.event(param));
            if (call.once) {
                delete this[i]
            }
        }, this.events[key])
    }
    return emitter
}

SlotModuleMk2.prototype.initFlash = function() {
    this.backflash = new PIXI.Graphics();
    this.stage.addChildAt(this.backflash, 0)
    this.setFlash(FlashData.default, 1)
}
SlotModuleMk2.prototype.setFlash = function(flash, timer, callback) {
    flash || (flash = paneldata.reel.defaultFrash);
    this.playControlData.flashReservation.push({
        flash: flash,
        timer: timer,
        callback: callback
    })
}

SlotModuleMk2.prototype.setLotMode = function(e) {
    this.playControlData.lotmode = e;
}

SlotModuleMk2.prototype.setMaxbet = function(e) {
    this.playControlData.maxbet = e
}
SlotModuleMk2.prototype.clearFlashReservation = function() {
    this.playControlData.flashReservation = [];
    this.setFlash(FlashData.default, 1)
}


SlotModuleMk2.prototype.freeze = function() {
    this.freezeFlag = true;
}

SlotModuleMk2.prototype.resume = function() {
    this.freezeFlag = false;
}

SlotModuleMk2.prototype.getReelPos = function(reel) {
    return this.reelChips[reel].findIndex((chip) => {
        return chip.position.y <= 0 && -chip.position.y < this.reelChipData.height
    })
}

SlotModuleMk2.prototype.getReelPosStrict = function(reel) {
    var reelpos = this.getReelPos(reel);
    return {
        pos: reelpos,
        gap: this.reelChips[reel][reelpos].position.y
    }
}