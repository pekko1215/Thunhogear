class SlotReel {
    constructor(arr, chipHeight) {
        this.chips = arr;
        this.reelPosition = 0;
        this.reelChipPosition = 0;
        this.status = 'stop';
        this.speed = 0;
        this.chipHeight = chipHeight;
        this.reelHeight = chipHeight * this.chips.length;
        this.length = this.chips.length;
        this.slipLength = 0;
    }
    movePosition(d) {
        this.reelPosition -= d;
        if (this.reelPosition < 0) this.reelPosition += this.reelHeight;
        if (this.reelPosition >= this.reelHeight) this.reelPosition -= this.reelHeight;

        this.reelChipPosition = Math.floor(this.reelPosition / this.chipHeight);
        this.reelGap = this.reelPosition - (this.reelChipPosition * this.chipHeight)

    }
    move() {
        if (this.status === 'stop') return;
        if (this.status === 'sliping') {
            if (this.slipLength < this.speed) {
                this.movePosition(this.slipLength);
                this.status = 'stop';
                this.slipLength = 0;
                return
            } else {
                this.slipLength -= this.speed;
            }
        }
        this.movePosition(this.speed);
    }
    getCurrentChips() {
        let chips = [];
        for (let i = 0; i < 3; i++) {
            let idx = this.reelChipPosition + i;
            if (idx >= this.chips.length) idx -= this.chips.length;
            chips.push(this.chips[idx]);
        }
        return chips;
    }

}

class SlotReelController {
    constructor(slotModule) {
        this.LOTMODE = { NORMAL: 0, BIG: 1, JAC: 2 };
        this.slotModule = slotModule;
        this.reelControl = this.slotModule.reelControl;
        this.slotStatus = slotModule.slotStatus;
        this.reels = this.reelControl.controlData.reelArray.map(arr => {
            return new SlotReel(arr, slotModule.viewController.reelChipData.height);
        })
    }
    getHitYakus() {
        let pay = 0;
        let hitYaku = [];
        let { controlData } = this.reelControl;
        let { betLine, yakuList } = controlData;
        betLine.forEach((line, idx) => {
            const matrix = [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ];

            const ReelMatrix = this.getReelMatrix();
            if (betLine[idx][3] > this.slotStatus.betCoin) {
                return
            }

            const LineChars = [0, 0, 0].map((e, i) => {
                matrix[line[i]][i] = 1;
                return ReelMatrix[line[i]][i]
            })
            yakuList.forEach((d, j) => {
                let p = [];
                let flag = 1;
                p.push(d & 0xF)
                flag &= ((d & 0xF) == LineChars[0]) || (d & 0xF) == 0xF;
                d = d >> 4;
                p.push(d & 0xF)
                flag &= ((d & 0xF) == LineChars[1]) || (d & 0xF) == 0xF;
                d = d >> 4;
                p.push(d & 0xF)
                flag &= ((d & 0xF) == LineChars[2]) || (d & 0xF) == 0xF;
                d = d >> 4;
                p.push(d & 0xF)
                let mode = d & 0xF;
                if ((mode & (1 << this.mode)) == 0) return;
                if (flag === 0) return;
                let data = {
                    line: idx,
                    matrix,
                    index: j
                }
                hitYaku.push(data);
            })
        })
        return hitYaku;
    }
    getReelMatrix() {
        let arr = this.reels.map(reel => reel.getCurrentChips());
        let matrix = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];
        arr.forEach((reel, i) => {
            reel.forEach((chip, j) => {
                matrix[j][i] = chip;
            })
        })
        return matrix;
    }
    next() {
        this.reels.forEach((reel, idx) => {
            reel.move();
        })
    }
    getMoveingCount() {
        return this.reels.filter(reel => reel.status === 'move' || reel.status === 'sliping').length
    }
    stopReel(idx) {
        let reel = this.reels[idx];
        let { slotModule } = this;
        let { slotStatus } = slotModule;
        if (slotModule.freezeFlag) return
        if (reel.status != 'move') return;
        if (this.reels.some(reel => ['sliping'].includes(reel.status))) return;
        // if (reel.reelChipPosition != 0) return
        let { reelChipPosition } = reel;
        let slip = reelChipPosition - this.getReelSlip(idx, reelChipPosition);
        if (slip < 0)
            slip = this.reels[idx].length + slip
        this.reelSlipStart(idx, slip);
        this.slotModule.slotStatus.status = 'slipStart'
        this.slotModule.emit("reelStop", {
            count: this.getMoveingCount(),
            idx
        });
        slotStatus.stopOrder.push(idx);
        reel.status = "sliping";
        return true;
    }
    getReelSlip(reel, pos) {
        switch (this.getMoveingCount()) {
            case 3:
                return this.reelControl.getStopPos1st(this.slotModule.slotStatus.controlCode, reel, pos)
                break;
            case 2:
                return this.reelControl.getStopPos2nd(reel, pos)
                break;
            case 1:
                return this.reelControl.getStopPos3rd(reel, pos)
                break;
        }
    }
    reelSlipStart(reelIndex, slips) {
        let reel = this.reels[reelIndex];
        reel.slipLength = this.slotModule.viewController.reelChipData.height * slips + reel.reelGap;
        if (this.slipLength < 0) {
            reel.slipLength += this.reelChipData.height * slips;
        }
    }
    reelMove(reel, speed) {
        this.reels[reel].speed = speed;
    }
    startReel() {
        this.reels.forEach(reel => {
            reel.status = 'move';
            reel.speed = this.slotModule.panelData.reel.speed
        })
    }
    isReelSliping() {
        return !!this.reels.find(reel => reel.status === 'sliping');
    }
}

class FlashReservation {
    constructor({ flash, timer, callback }) {
        this.flash = flash;
        this.timer = timer;
        this.callback = callback;
    }
    onFlash() {

    }
    onFlashStart() {}
    onFlashEnd() {
        callback();
    }
}

class SlotFlashController {
    constructor(slotModule, defaultFlash) {
        this.flashReservations = [];
        this.slotModule = slotModule
        this.defaultFlash = defaultFlash;
    }
    next() {

    }
    init() {
        this.backGraphics = new PIXI.Graphics();
        this.slotModule.viewController.stage.addChildAt(this.backGraphics, 0);
        this.setFlash(this.defaultFlash, 1)
    }
    draw() {
        if (this.flashReservations.length == 0) {
            return;
        }
        let { backGraphics } = this;
        let { reelController, viewController } = this.slotModule;
        let { reelChipData, reelChips } = viewController;
        this.backGraphics.clear();
        let reservation = this.flashReservations[0];
        let { back, front } = reservation.flash;



        reelController.reels.forEach((reel, x) => {
            let charIndex = reel.reelChipPosition;
            let yIndex = 0;
            for (let y = 0; y < 3; y++) {

                backGraphics.beginFill(back[y][x].color, back[y][x].alpha);
                let xsize = reelChipData.width;
                let ysize = reelChipData.height;
                if (y == 2) ysize = viewController.height - reelChipData.height * 2;
                backGraphics.drawRect(xsize * x + (x > 0 ? reelChipData.blank * x : 0), yIndex, xsize, ysize);
                yIndex += ysize;
                if (y == 0) {
                    if (reelChips[x][charIndex].tint == 0xFFFFFF) {
                        reelChips[x][(charIndex + 4) % reelControl.controlData.reelLength].tint = 0xFFFFFF;
                    }
                }
                reelChips[x][(charIndex + y) % reel.length].tint = reservation.flash.front[y][x].color;
            }
        })

        reservation.timer--;
        if (reservation.timer < 0) {
            reservation.callback()
            this.flashReservations.shift();
        }
    }
    setFlash(flash, timer = 1) {
        return new Promise(r => {
            this.flashReservations.push(new FlashReservation({
                flash,
                timer,
                callback: r
            }))
        })
    }
    clearFlashReservation() {
        this.flashReservations = [];
        let { viewController } = this.slotModule;
        let { reelChips } = viewController;
        reelChips.forEach(chips => {
            chips.forEach(chip => {
                chip.tint = 0xFFFFFF;
            })
        })
        this.setFlash(this.defaultFlash);
    }
}

class SlotViewController {
    constructor(slotModule, element) {
        this.slotModule = slotModule;
        this.panelData = slotModule.panelData;
        this.width = this.panelData.width;
        this.height = this.panelData.height;
        this.app = new PIXI.Application({
            width: this.width,
            height: this.height,
            backgroundColor: this.panelData.reel.background
        });
        console.log(this.app)
        this.stage = this.app.stage;
        this.frame = 0;

        element.appendChild(this.app.view);
    }
    async loadReelChip() {
        const path = "img/reelchip.png"
            // let loader = new PIXI.Loader;
            // loader.add(path);
        this.reelChipData = { blank: this.slotModule.panelData.reel.blank }; //リールチップ共通の情報を記憶
        SlotLog('リール画像読み込み開始');

        let loader = new PIXI.loaders.Loader;
        loader.add('reel', path);

        let base = await new Promise(r => {
            loader.load((loader, resource) => {
                r(resource.reel)
            })
        });
        base = base.texture.baseTexture
            // let base = await new Promise(r => {
            //     let b = PIXI.BaseTexture.from(path);
            //     b.addListener('update', () => {
            //         r(b);
            //     })
            //     b.addListener('error', console.log);
            // })
        console.log(base)
        SlotLog('リール画像読み込み完了');
        const Frames = [];

        let c = this.slotModule.reelControl.controlData.typeCount;
        let h = (base.height / c)

        this.reelChipData.width = base.width;
        this.reelChipData.height = h;

        for (let i = 0; i < c; i++) {
            Frames.push(new PIXI.Texture(base, new PIXI.Rectangle(0, h * i, base.width, h)))
        }
        this.reelChips = this.slotModule.reelControl.controlData.reelArray.map((arr, reelIndex) => {
            return arr.map((c, i) => {
                let s = new PIXI.Sprite(Frames[c]);
                let obj = this.stage.addChild(s);
                obj.position.x = (this.reelChipData.width + this.reelChipData.blank) * reelIndex;
                obj.position.y = (this.reelChipData.height) * i;
                return obj;
            })
        })

        this.blankGraphics = new PIXI.Graphics();
        this.blankGraphics.zIndex = 32;
        console.log(this.blankGraphics)
        this.stage.addChildAt(this.blankGraphics);

        let x = this.reelChipData.width + 1;

        this.blankGraphics.beginFill(this.slotModule.panelData.reel.blankColor);

        this.blankGraphics.drawRect(x, 0, this.reelChipData.blank, this.slotModule.panelData.height);
        x += this.reelChipData.width + this.reelChipData.blank;

        this.blankGraphics.drawRect(x, 0, this.reelChipData.blank, this.slotModule.panelData.height);
        this.slotModule.emit('resourceLoaded', { stage: this.stage });
        this.slotModule.flashController.init();
    }
    draw() {
        let { reelChipData } = this;
        //ここにかく
        this.slotModule.update();
        this.slotModule.reelController.next();
        this.slotModule.flashController.draw();
        this.reelChips.forEach((arr, i) => {
            let reel = this.slotModule.reelController.reels[i];

            arr.forEach((chip, chipIndex) => {
                chip.position.y = -reel.reelPosition + reelChipData.height * chipIndex;

                if (chip.position.y >= this.height) {
                    chip.position.y -= reelChipData.height * reel.length
                }
                if (chip.position.y <= -reelChipData.height * reel.length + this.height) {
                    chip.position.y += reelChipData.height * reel.length;
                }
            })
        })

        // フレーム数をインクリメント
        this.frame++;

        this.app.render(this.stage); // 描画する
        requestAnimationFrame(() => this.draw()); // 次の描画タイミングでanimateを呼び出す
    }
}

class SlotEventListener {
    constructor() {
        this.events = {};
    }
    emit(key, param) {
        if (!this.events[key]) return;
        this.events[key].forEach((call, i) => {
            let r = call.event(param);
            if (call.once && r !== true) {
                delete this.events[key][i]
            }
        })
    }
    on(key, callback) {
        if (!(key in this.events)) {
            this.events[key] = [];
        }
        this.events[key].push({
            once: false,
            event: callback
        });
    }
    once(key, callback = async() => {}) {
        return new Promise((r) => {
            if (!(key in this.events)) {
                this.events[key] = [];
            }
            this.events[key].push({
                once: true,
                event: (e) => {
                    let n;
                    n = callback(e);
                    r(e);
                    return n;
                }
            });
        })
    }
}

class SlotStatus {
    constructor(slotModule, waitTime) {
        this.slotModule = slotModule;
        this.reelSpeed = [
            0,
            0,
            0
        ];
        this.controlCode = 0;
        this.maxBet = 3;
        this.minBet = 1
        this.status = "betWait";
        this.betCoin = 3;
        this.flashReservations = [];
        this.wait = 0;
        this.oldTime = new Date();
        this.waitTime = waitTime;
        this.stopOrder = [];
    }
}

class SlotModuleMk2 extends SlotEventListener {
    constructor(panelData, reelControl, defaultFlash) {
        super();
        this.panelData = panelData;
        this.reelControl = reelControl;
        this.slotStatus = new SlotStatus(this, panelData.waitTime);
        this.flashController = new SlotFlashController(this, defaultFlash);

        this.init()

        // ステージを作る
        this.registerKeyControl()
    }
    async init() {
        this.viewController = new SlotViewController(this, document.getElementById("pixiview"));

        await this.viewController.loadReelChip();
        this.reelController = new SlotReelController(this);
        this.viewController.draw();
    }
    registerKeyControl() {
        let stopButtonSmart = function(e) {
            let rect = e.target.getBoundingClientRect();
            pushScreen({
                x: e.changedTouches[0].clientX - rect.left,
                y: e.changedTouches[0].clientY - rect.top
            })
        }
        let stopButtonPC = function(e) {
            pushScreen({
                x: e.clientX - e.target.getBoundingClientRect().left,
                y: e.clientY - e.target.getBoundingClientRect().top
            })
        }

        let pushScreen = (pos) => {
            switch (this.slotStatus.status) {
                case 'started':
                    this.reelController.stopReel(Math.floor(pos.x / (this.viewController.width / 3)))
                    break;
                default:
                    allKeyListener.press();
            }
        }

        this.viewController.app.view.addEventListener('touchstart', stopButtonSmart)
        this.viewController.app.view.addEventListener('mousedown', stopButtonPC)

        let leftKeyListener = keyboard(keyconfig.left);
        let centerKeyListener = keyboard(keyconfig.center);
        let rightkeyListener = keyboard(keyconfig.right);
        let betKeyListener = keyboard(keyconfig.bet);
        let leverKeyListener = keyboard(keyconfig.lever);
        let allKeyListener = keyboard(keyconfig.all);

        leftKeyListener.press = () => {
            this.emit('pressStop');
            this.emit('pressStop1');
            this.emit('pressAny');
            this.reelController.stopReel(0);
        }
        centerKeyListener.press = () => {
            this.emit('pressStop');
            this.emit('pressStop2');
            this.emit('pressAny');
            this.reelController.stopReel(1);
        }
        rightkeyListener.press = () => {
            this.emit('pressStop');
            this.emit('pressStop3');
            this.emit('pressAny');
            this.reelController.stopReel(2);
        }
        allKeyListener.press = () => {
            this.emit("pressAllmity")
            this.emit('pressAny');
            let zyunjo = this.zyunjo || [1, 2, 3]

            zyunjo = [...zyunjo]
            for (let i = 0; i < 3; i++) {
                this.emit('pressStop');
                if (this.reelController.stopReel(zyunjo[i] - 1)) {
                    if (i == 2) {
                        this.zyunjo = null
                    }
                    return;
                }
            }
            if (this.slotStatus.status != "beted") {
                this.emit("pressBet")
                this.betCoin(3);
                return;
            }
            if (this.slotStatus.status == "beted") {
                this.emit("pressLever")
                this.leverON()
                return;
            }
        }
        leverKeyListener.press = () => {
            this.emit("pressLever")
            this.emit('pressAny');
            this.leverON()
        }
        betKeyListener.press = () => {
            this.emit("pressBet")
            this.emit('pressAny');
            this.betCoin(3)
        }

        this.pushEvent = {
            almighty: allKeyListener.press,
            left: leftKeyListener.press,
            center: centerKeyListener.press,
            right: rightkeyListener.press,
            lever: leverKeyListener.press,
            bet: betKeyListener.press
        };

    }
    async update() {
        let { slotStatus } = this;
        if (slotStatus.wait > 0) {
            let deltaTime = new Date() - slotStatus.oldTime;
            slotStatus.wait -= deltaTime;
            if (slotStatus.wait < 0)
                slotStatus.wait = 0;
            slotStatus.oldTime = new Date()
        }
        if (this.freezeFlag) { return }
        switch (slotStatus.status) {
            case 'betWait':
                break;
            case 'beted':
                break;
            case 'leveron':
                break;
            case 'leverWait':
                break
            case 'wait':
                if (slotStatus.wait == 0) {
                    this.reelController.startReel();
                    slotStatus.stopOrder = [];
                    slotStatus.status = "started"
                    slotStatus.wait = slotStatus.waitTime;
                    this.emit("reelStart");
                }
                break;
            case 'started':
                break
            case 'slipStart':
                let count = 4 - this.reelController.getMoveingCount()
                await this.onReelStop(count);
                slotStatus.status = 'sliping'
                break;
            case 'sliping':
                if (!this.reelController.isReelSliping()) slotStatus.status = 'reelStop';
                break
            case 'reelStop':
                if (this.reelController.getMoveingCount() == 0) {
                    slotStatus.status = 'allReelStop'
                } else {
                    slotStatus.status = 'started';
                }
                break
            case 'allReelStop':
                slotStatus.status = "allReelStopWait";
                let hitYaku = this.reelController.getHitYakus()
                let payData = await this.onHitCheck(hitYaku);
                this.emit("allReelStop", payData);
                slotStatus.status = "pay";
                let { isReplay } = await this.onPay(payData);
                slotStatus.isReplay = isReplay;
                await this.onPayEnd(payData);
                this.slotStatus.status = "betWait";
                this.emit("payEnd")
                if (isReplay) {
                    await this.onReplay();
                } else {
                    await this.onBetReset();
                }
                this.emit("pay", hitYaku);
        }
    }
    async onPay(hitYaku) {
        throw 'Please, Override This Method onPay';
    }
    async onPayEnd() {}
    async onBetReset() {
        this.slotStatus.betCoin = 0
    }
    async onReplay() {
        this.emit("payEnd")
        await this.onBet();
        this.slotStatus.status = "beted"
    }
    async onReelStop() {
        throw 'Please, Override This Method onReelStop';
    }
    async onHitCheck() {
        throw 'Please, Override This Method onHitCheck';
    }
    async onBet() {
        // throw 'Please, Override This Method onBet';
    }
    async onBetCoin() {
        throw 'Please, Override This Method onBetCoin';
    }
    async betCoin(coin) {
        if (this.freezeFlag) { return }
        if (this.slotStatus.status != "betWait") {
            if (this.slotStatus.status != "beted" || this.slotStatus.betCoin == this.slotStatus.maxBet) {
                return false;
            }
        }
        this.slotStatus.betCoin = this.slotStatus.betCoin + coin;

        if (this.slotStatus.betCoin > this.slotStatus.maxBet) {
            coin += this.slotStatus.maxBet - this.slotStatus.betCoin;
            this.slotStatus.betCoin = this.slotStatus.maxBet
        }
        if (this.slotStatus.betCoin >= this.slotStatus.minBet) {
            this.slotStatus.status = "beting";
            this.emit("bet", { coin });
            await this.onBet();
            await this.onBetCoin(coin)
            this.slotStatus.status = 'beted'
        }
    }
    async leverON() {
        if (this.freezeFlag) { return }
        if (this.slotStatus.status != "beted") {
            return false;
        }
        this.slotStatus.status = 'leverWait'
        this.slotStatus.controlCode = await this.onLot();
        this.slotStatus.status = 'wait';
        this.emit("leverOn");
        return true;
    }
    onLot() {
        throw 'Please, Override This Method onLot';
    }
    resume() {
        this.freezeFlag = false;
    }

    freeze() {
        this.freezeFlag = true;
    }
}