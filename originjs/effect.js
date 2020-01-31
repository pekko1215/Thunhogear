let effectManeger = null;
let advantage = null;

const ObiManager = new class {
    constructor() {
        this._text = "";
        this._isActive = false;
        this._textColor = "white";
        this._backColor = "#000066";
        this.elements = {
            back: $('#obi').hide(),
            text: $('#obiText')
        }
        this.textColor = this._textColor;
        this.backColor = this._backColor;
    }
    set isActive(bool) {
        this._isActive = bool;
        if (bool) {
            this.elements.back.show();
            this.elements.text.addClass('animation');
        } else {
            this.elements.back.hide()
            this.elements.text.removeClass('animation');
        }
    }
    set textColor(color) {
        this._textColor = color;
        this.elements.text.css({ color });
    }
    set backColor(color) {
        this._backColor = color;
        this.elements.back.css({ backgroundColor: color });
    }
    set text(text) {
        this._text = text;
        this.elements.text.text(text);
    }
    get isActive() { return this._isActive; }
    get backColor() { return this.backColor; }
    get textColor() { return this.textColor; }
    get text() { return this._text; }

}

const DisplayManager = new class {
    constructor() {
        this.DisplayElements = {
            Saisyu: $('#displaySaisyu').hide(),
            Fine: $('#displayFine').hide(),
            Rush: $('#displayRush').hide(),
            RushStart: $('#displayRushStart').hide(),
            Counter: $('#displayCounter').hide(),
            Result: $('#displayResult').hide(),
            BigBonus: $('#displayBigBonus').hide(),
            BigBonusGold: $('#displayBigBonusGold').hide(),
            RegBonus: $('#displayRegBonus').hide(),
            RegBonusGold: $('#displayRegBonusGold').hide(),
            Get: $('#displayGet').hide(),
            VStock: $('#displayVStock').hide(),
            VStockCount: $('#displayVStockCount').hide(),
            MAXCount: $('#displayMaxCount').hide(),
            Zesyo: $('#displayZesyo').hide(),
            MaxGet: $('#displayMaxGet').hide(),
            Ze: $('#displayZe').hide(),
            Syo: $('#displaySyo').hide(),
            De: $('#displayDe').hide()

        }
        for (let i = 1; i <= 6; i++) {
            this.DisplayElements['ZesyoFace' + i] = $('#displayZesyoFace' + i).hide();
        }
        this.DisplayStatuses = {};
        Object.keys(this.DisplayElements).forEach(key => {
            this.DisplayStatuses[key] = null;
        })
    }
    showDisplay(tag, type = "fade") {
        let element = this.DisplayElements[tag];
        if (!element) return;
        console.log(element)
        element.show();
        let c = 'animation-' + type
        element.addClass(c);
        this.DisplayStatuses[tag] = c;
    }
    hiddenDisplay(tag, type = "fade", options) {
        if (!this.DisplayStatuses[tag]) return;
        let element = this.DisplayElements[tag];
        if (!element) return;
        element.hide();
        for (let c of element[0].classList) {
            if (c.includes('animation-')) {
                element.removeClass(c)
            }
        }
        element.removeClass(this.DisplayStatuses[tag]);

        this.DisplayStatuses[tag] = null;
    }
    animateDisplay(tag, type = null) {
        if (!this.DisplayStatuses[tag]) return;
        if (!type) return;
        let element = this.DisplayElements[tag];
        element.removeClass(this.DisplayStatuses[tag]);
        let c = 'animation-' + type
        element.addClass(c);
        this.DisplayStatuses[tag] = c;
    }
}

class AdvantageZoneManager {
    constructor() {
        this.MAXCoin = 2400;
        this.MAXGame = 1500;
        this.coinCount = this.MAXCoin;
        this.gameCount = this.MAXGame;
        SlotLog('有利区間開始');
    }
    onPay(payCoin, betCoin) {
        console.log({ payCoin, betCoin })
        if (!slotmodule.slotStatus.isReplay) this.coinCount += betCoin;
        this.coinCount -= payCoin;
        if (this.coinCount > 2400) this.coinCount = 2400;
        this.gameCount--;
        if (this.gameCount <= 0 || this.coinCount <= 0) {
            this.isEnded = true;
        }
    }
}

class EffectManager {
    constructor() {}
    async onLot(lot, control, gameMode, bonusFlag) {

    }
    async payEffect(payCoin, betCoin) {

    }
    async onPay(payCoin, betCoin) {
        if (advantage) {
            advantage.onPay(payCoin, betCoin);
            if (advantage.isEnded) {
                await this.resetAdvantage();
            }
        } else {
            if (RTdata instanceof DefaultRT) {
                if (!this.advantageGameCount) {
                    this.advantageGameCount = 1;
                } else {
                    advantage = new AdvantageZoneManager;
                    this.advantageGameCount = 0;
                }
            }
        }
        await this.payEffect(payCoin, betCoin);

    }
    async resetAdvantage() {
        SlotLog(`有利区間終了 残り ${advantage.gameCount}G ${advantage.coinCount}枚`);
        effectManeger = new NormalEffect;
        advantage = null;

    }
}

class ATData {
    constructor(isFirst) {
        this.isFirst = isFirst;
        this.hitTables = [];
        this.vStock = 0;
        this.bonusLog = [];
        this.getCoins = 0;
        this.isKokutied = false;
        this.isSaisyu = false;
    }
    onPay() {

    }
}

class NormalEffect extends EffectManager {
    constructor() {
        super();
        this.isAT = false;
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        if (!advantage) {
            switch (control) {
                case 'リーチ目リプレイ':
                case 'BAR揃い':
                    NabiEffect(2);
            }
        } else {
            switch (control) {
                case 'リーチ目リプレイ':
                case 'BAR揃い':
                    effectManeger = BonusLotChoice(new ATData(true));
                    if (lot === 'デュランダル') {
                        await DurandalEffect();
                        effectManeger.atData.isDurandal = true;
                    }
                    break
                case '突入リプレイ2-1':
                    if (RTdata instanceof HighRT1 || RTdata instanceof HighRT2) {
                        effectManeger = BonusLotChoice(new ATData(true));
                    }
            }
            SyotoEffect(control);
            if (effectManeger === this) {
                if (advantage.gameCount < 600) {
                    this.resetAdvantage();
                }
            }
        }

    }
}

class REGATEffect extends EffectManager {
    constructor(atData) {
        super();
        this.atData = atData;
        this.isAT = true;
        this.MAXGame = 8;
        atData.bonusStartCoin = advantage.coinCount;
        atData.bonusName = 'REG';
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        if (!this.gameCount) {
            let SevenPositions = [
                [5, 5, 10],
                [4, 5, 11],
                [6, 5, 9]
            ];
            this.atData.bonusLog.push(this.atData.bonusName);
            BonusHitEffect(this.atData, 'REG');

            await DummyReelStop(...SevenPositions[rand(SevenPositions.length)], this.atData.isKokutied);
            await VStockEffect(this.atData);
            DisplayManager.showDisplay('Counter')
            this.atData.isKokutied = true;
            this.gameCount = this.MAXGame;
            console.log(this.atData)
            saveData.bonusStart('REG', this.atData.isFirst);
            if (ZesyoCheck(this.atData)) {
                return await ZesyoEffect(this.atData);
            }
        } else {
            this.gameCount--;
        }
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'BAR揃い':
            case 'BAR揃いガセ':
                NabiEffect(0);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break

            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
        if (this.gameCount == 0 && effectManeger === this) {
            if (this.atData.isFirst) {
                effectManeger = new ServiceAT1(this.atData);
            } else {
                effectManeger = new ServiceAT2(this.atData);
            }
        }
    }
}


class BIGATEffect extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = true;
        this.MAXGame = 20;
        this.atData = atData;
        atData.bonusStartCoin = advantage.coinCount;
        atData.bonusName = 'BIG';
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        if (!this.gameCount) {
            let SevenPositions = [
                [5, 5, 5],
                [4, 5, 6],
                [6, 5, 4]
            ];

            this.atData.bonusLog.push(this.atData.bonusName);
            BonusHitEffect(this.atData, 'BIG');
            await DummyReelStop(...SevenPositions[rand(SevenPositions.length)], this.atData.isKokutied);
            await VStockEffect(this.atData);
            DisplayManager.showDisplay('Counter')
            this.atData.isKokutied = true
            this.gameCount = this.MAXGame;
            saveData.bonusStart('BIG', this.atData.isFirst);
            if (ZesyoCheck(this.atData)) {
                return await ZesyoEffect(this.atData);
            }
        } else {
            this.gameCount--;
        }
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'BAR揃い':
            case 'BAR揃いガセ':
                NabiEffect(0);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break

            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
        if (this.gameCount == 0 && effectManeger === this) {
            if (this.atData.isFirst) {
                effectManeger = new ServiceAT1(this.atData);
            } else {
                effectManeger = new ServiceAT2(this.atData);
            }
        }
    }
}

class BlueBIGATEffect extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = true;
        this.MAXGame = 20;
        this.atData = atData;
        atData.bonusStartCoin = advantage.coinCount;
        atData.bonusName = 'BIG';
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        if (!this.gameCount) {
            let SevenPositions = [
                [15, 15, 15],
                [15, 15, 14],
                [14, 15, 15]
            ];

            this.atData.bonusLog.push(this.atData.bonusName);
            BonusHitEffect(this.atData, 'BIG');
            await DummyReelStop(...SevenPositions[rand(SevenPositions.length)], this.atData.isKokutied);
            await VStockEffect(this.atData);
            DisplayManager.showDisplay('Counter')
            this.atData.isKokutied = true
            this.gameCount = this.MAXGame;
            saveData.bonusStart('BBB');
            if (ZesyoCheck(this.atData)) {
                return await ZesyoEffect(this.atData);
            }
        } else {
            this.gameCount--;
        }
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'BAR揃い':
            case 'BAR揃いガセ':
                NabiEffect(0);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break

            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
        if (this.gameCount == 0 && effectManeger === this) {
            if (this.atData.isFirst) {
                effectManeger = new ServiceAT1(this.atData);
            } else {
                effectManeger = new ServiceAT2(this.atData);
            }
        }
    }
}

class MAXATEffect extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = true;
        this.atData = atData;
        atData.bonusStartCoin = advantage.coinCount;
        atData.bonusName = 'MAXBONUS';
        DisplayManager.showDisplay('MAXCount');
        $('#displayMaxCount').text(`${advantage.MAXCoin-advantage.coinCount}/${advantage.MAXCoin}`);

        DisplayManager.showDisplay('Counter')
        this.atData.isKokutied = true
        this.gameCount = this.MAXGame;
        saveData.bonusStart('MAX');
        sounder.playSound('big1', true)
    }
    async payEffect(payCoin, betCoin) {
        if (!advantage) {
            DisplayManager.hiddenDisplay('MaxGet');
            sounder.stopSound('bgm');
            let getCoin = Number($('#coinCounter').text());
            getCoin += payCoin;
            if (!slotmodule.slotStatus.isReplay) getCoin -= betCoin;

            $('#coinResult').text(getCoin);
            $('#feverResult').text('×' + this.atData.bonusLog.length + ' + MAX');

            SlotLog(`総獲得枚数 ${getCoin}枚 `)
            Object.keys(DisplayManager.DisplayElements).forEach((key) => {
                DisplayManager.hiddenDisplay(key);
            })
            DisplayManager.showDisplay('Result');

            slotmodule.once('pressAny', () => {
                DisplayManager.hiddenDisplay('Result');
                $('#kokuti').removeClass('show').removeClass('rainbow');
            })
            return;
        }
        $('#displayMaxCount').text(`${advantage.MAXCoin-advantage.coinCount}/${advantage.MAXCoin}`);

    }
    async onLot(lot, control, gameMode, bonusFlag) {
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'BAR揃い':
            case 'BAR揃いガセ':
                NabiEffect(0);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break
            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
    }
}

class ServiceAT1 extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = true;
        this.atData = atData
        this.gameCount = '???';
        this.atData.isKokutied = false;
        ObiManager.text = '最終決戦 準備中...';
        ObiManager.isActive = true;
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                if (!rand(6) || RTdata instanceof HighBaseRT) NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                effectManeger = new ChanceZoneEffect1(this.atData);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break
            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
    }
}

class ServiceAT2 extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = true;
        this.atData = atData
        this.gameCount = '???';
        this.atData.isKokutied = false;
        ObiManager.text = 'ツンホギア RUSH 準備中...';
        ObiManager.isActive = true;
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        switch (control) {
            case 'ベル1':
            case 'ベル2':
            case 'ベル3':
            case 'ベル4':
            case 'ベル5':
            case 'ベル6':
                if (!rand(6) || RTdata instanceof HighBaseRT) NabiEffect(Number(control.slice(-1)) - 1, true);
                break
            case '突入リプレイ1-1':
            case '突入リプレイ1-2':
            case '突入リプレイ1-3':
                NabiEffect((Number(control.slice(-1)) % 3) * 2);
                break
            case '突入リプレイ2-1':
            case '突入リプレイ2-2':
            case '突入リプレイ2-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                effectManeger = new ChanceZoneEffect2(this.atData);
                break
            case '突入リプレイ3-1':
            case '突入リプレイ3-2':
            case '突入リプレイ3-3':
                NabiEffect((Number(control.slice(-1)) - 1) * 2);
                break
            case 'リーチ目リプレイ':
                NabiEffect(2);
                break
            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
    }
}

class ChanceZoneEffect1 extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = false;
        this.atData = atData
        this.atData.isFirst = false;
        this.atData.isSaisyu = true;
        this.MAXGame = 5;
        saveData.bonusEnd();
        let hitFlag = false;
        let bonusGetCoin = atData.bonusStartCoin - advantage.coinCount;
        while (this.atData.hitTables.length < this.MAXGame) {
            let f = !rand(21);
            if (hitFlag) f = Math.random() < 1 / 14
            this.atData.hitTables.push(f);
            if (f) hitFlag = true
        }
        console.log(this.atData.hitTables)
    }
    async payEffect(payCoin, betCoin) {
        if (this.gameCount === undefined) {
            DisplayManager.hiddenDisplay('BigBonus');
            DisplayManager.hiddenDisplay('BigBonusGold');
            DisplayManager.hiddenDisplay('RegBonus');
            DisplayManager.hiddenDisplay('RegBonusGold');
            ObiManager.isActive = false;
            this.gameCount = this.MAXGame;
            sounder.setVolume('bgm', 0.5);
            sounder.playSound('saisyuStart');
            DisplayManager.showDisplay('Saisyu');
            await sleep(1000)
            DisplayManager.showDisplay('Fine', 'btot');
        } else {
            if (this.gameCount > 0) this.gameCount--;
            if (this.gameCount === 0) {
                DisplayManager.hiddenDisplay('Saisyu');
                DisplayManager.animateDisplay('Fine', 'monokuro');
                sounder.stopSound('bgm');
                SlotLog(`総獲得枚数 ${advantage.MAXCoin - advantage.coinCount}枚 総ゲーム数${advantage.MAXGame - advantage.gameCount}G`)
                await sounder.playSound('saisyuEnd');
                DisplayManager.hiddenDisplay('Counter');
                DisplayManager.hiddenDisplay('Fine');
                this.resetAdvantage()
                saveData.infomations.saisyuLog.push(false);
            }
        }
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        let isBonus = false;
        let kakikae = this.atData.hitTables.shift();
        if (!kakikae && this.atData.vStock && this.gameCount === 1) {
            kakikae = true;
            this.atData.vStock--;
        }
        switch (control) {
            case 'BAR揃い':
            case 'BAR揃いガセ':
                if (!kakikae) BAREffect(control === 'BAR揃い');
                if (control === 'BAR揃い') effectManeger = BonusLotChoice(this.atData);
                break
            case 'リーチ目リプレイ':
            case '突入リプレイ2-1':
                isBonus = true;
                effectManeger = BonusLotChoice(this.atData);
                if (!rand(4)) ChanceNabiEffect();
                break
            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()

        }
        if (kakikae) {
            if (effectManeger !== this) {
                this.atData.vStock++;
            } else {
                let next = await KakikaeEffect(this.atData);
                effectManeger = next;
            }
        } else {
            SyotoEffect(control);
        }
    }
}

class ChanceZoneEffect2 extends EffectManager {
    constructor(atData) {
        super();
        this.isAT = false;
        this.atData = atData
        this.atData.isFirst = false
        this.MAXGame = 8;
        if (this.atData.isSaisyu) {
            this.atData.isSaisyu = false;
            saveData.infomations.saisyuLog.push(true);
        }
        saveData.bonusEnd();
        let bonusGetCoin = atData.bonusStartCoin - advantage.coinCount;
        while (this.atData.hitTables.length < this.MAXGame) {
            this.atData.hitTables.push(Math.random() < 1 / 14);
        }
    }
    async payEffect(payCoin, betCoin) {
        if (this.gameCount === undefined) {
            this.gameCount = this.MAXGame;
            DisplayManager.hiddenDisplay('BigBonus');
            DisplayManager.hiddenDisplay('BigBonusGold');
            DisplayManager.hiddenDisplay('RegBonus');
            DisplayManager.hiddenDisplay('RegBonusGold');
            ObiManager.isActive = false;
            sounder.setVolume('bgm', 0.5);
            sounder.playSound('rushStart');
            DisplayManager.showDisplay('Rush')
            await sleep(1000)
            DisplayManager.showDisplay('RushStart', 'btot')
        } else {
            if (this.gameCount > 0) this.gameCount--;
            if (this.gameCount == 0) {
                DisplayManager.hiddenDisplay('Rush');
                DisplayManager.hiddenDisplay('RushStart');
                sounder.setVolume('bgm', 0);
                let getCoin = advantage.MAXCoin - advantage.coinCount
                $('#coinResult').text(getCoin);
                $('#feverResult').text('×' + this.atData.bonusLog.length);

                SlotLog(`総獲得枚数 ${getCoin}枚 総ゲーム数${advantage.MAXGame - advantage.gameCount}G`)
                DisplayManager.hiddenDisplay('Counter');
                DisplayManager.showDisplay('Result');
            }
        }
    }
    async onLot(lot, control, gameMode, bonusFlag) {
        if (this.gameCount === this.MAXGame) {
            await VStockEffect(this.atData);
            sounder.setVolume('bgm', 0.5);
        }
        let hasVRelease = this.atData.vStockEffectCount > 0;
        let kakikae = this.atData.hitTables.shift();
        switch (control) {
            case 'BAR揃い':
            case 'BAR揃いガセ':
                if (!kakikae) BAREffect(control === 'BAR揃い');
                if (control === 'BAR揃い') effectManeger = BonusLotChoice(this.atData);
                break
            case 'リーチ目リプレイ':
            case '突入リプレイ2-1':
                effectManeger = BonusLotChoice(this.atData);
                if (!rand(4)) ChanceNabiEffect();
                break
            case 'チェリー':
            case 'スイカ':
                ChanceNabiEffect()
        }
        if (kakikae) {
            if (effectManeger !== this) {
                this.atData.vStock++;
            } else {
                if (this.gameCount === 0) {
                    this.atData.vStock++;
                } else {
                    let next = await KakikaeEffect(this.atData);
                    effectManeger = next;
                }
            }
        } else {
            if (!control.includes('BAR')) SyotoEffect(control);
        }
        if (effectManeger !== this) {
            if (hasVRelease) {
                await VStockRelease();
            }
        } else {
            if (this.atData.isDurandal) {
                if (!rand(12)) {
                    if (this.gameCount === 0) {
                        this.atData.vStock++;
                    } else {
                        effectManeger = new BlueBIGATEffect(this.atData);
                        await DurandalEffect();
                    }
                }
            }
        }
        if (this.gameCount == 0 && effectManeger === this) {
            if (this.atData.vStock) {
                this.atData.vStock--;
                effectManeger = BonusLotChoice(this.atData);
                await StarDustEffect();
                DisplayManager.hiddenDisplay('Result');
                await effectManeger.onLot();
            } else {
                sounder.stopSound('bgm');
                DisplayManager.hiddenDisplay('Result');
                this.resetAdvantage()
            }
        }
    }
}

const BonusLotChoice = (atData) => {
    let lotTable = {
        true: [1, 99],
        false: [70, 30]
    }
    let lot = [BIGATEffect, REGATEffect][ArrayLot(lotTable[atData.isFirst])];
    if (lot === BIGATEffect) atData.isFirst = false;
    if (atData.vStockEffectCount) atData.vStockEffectCount--;
    return new lot(atData)
}

const BAREffect = async(isHit) => {
    const { reels } = slotmodule.reelController;
    let lockTable = {
        true: [10, 60, 30],
        false: [50, 45, 5]
    }
    slotmodule.zyunjo = [3, 2, 1];
    slotmodule.freeze();
    let lockLevel = ArrayLot(lockTable[isHit]);
    for (let i = 0; i <= lockLevel; i++) {
        for (let v = 0; v < 10; v++) {
            reels.forEach(r => r.movePosition(-10));
            await new Promise(r => requestAnimationFrame(r));
        }
        await sleep(1000);
    }
    let { text } = ObiManager;
    ObiManager.isActive = true;
    ObiManager.text = '←←BARを狙って！←←';
    slotmodule.once('payEnd', () => {
        ObiManager.text = text;
        ObiManager.isActive = false;
    })

    slotmodule.resume();
}

const KakikaeEffect = async(atData) => {
    let next = BonusLotChoice(atData);
    const effectTable = {
        REG: {
            names: ['レバー', 'チャンスナビ', '無演出', '第一停止', '第二停止', '特殊停止', '遅れ'],
            lots: [1500, 1000, 1000, 1000, 1000, 3500, 1000]
        },
        BIG: {
            names: ['レバー', 'チャンスナビ', '無演出', '第一停止', '第二停止', '特殊停止', '遅れ', 'ダブルスタート音', '無音', '特殊BAR揃い'],
            lots: [1000, 500, 1000, 1000, 1000, 750, 3000, 500, 500, 750]
        }
    };
    let type = next instanceof BIGATEffect ? 'BIG' : 'REG';
    let { names, lots } = effectTable[type];
    let idx = ArrayLot(lots);
    let name = names[idx];
    (async() => {
        switch (name) {
            case 'レバー':
                break
            case '無演出':
                SyotoEffect('リーチ目リプレイ')
                await slotmodule.once('payEnd');
                break
            case '第一停止':
                await slotmodule.once('pressStop');
                break
            case '第二停止':
                await slotmodule.once('pressStop');
                await slotmodule.once('pressStop');
                break
            case '特殊停止':
                let sevenFlag = false;
                if (type === 'BIG' && !rand(4)) sevenFlag = true;
                let s = PickSpecialStop(sevenFlag);
                await SpecialStopEffect(...s);
                atData.isKokutied = true;
                return;
                break
            case '遅れ':
                window.leverEffect = '遅れ';
                await slotmodule.once('payEnd');
                break
            case 'ダブルスタート音':
                window.leverEffect = 'ダブルスタート音';
                await slotmodule.once('payEnd');
                break
            case '無音':
                window.leverEffect = '無音';
                sounder.setVolume('bgm', 0);
                await slotmodule.once('payEnd');
                break
            case 'チャンスナビ':
                ChanceNabiEffect();
                await slotmodule.once('payEnd');
                break
            case '特殊BAR揃い':
                await BAREffect(true);
                let SpecialBarTable = [
                    [4, 6, 9],
                    [3, 1, 10],
                    [4, 7, 11]
                ]
                await SpecialStopEffect(...SpecialBarTable[rand(SpecialBarTable.length)]);
                atData.isKokutied = true;
                return
                break
        }
        await Kokuti();
        atData.isKokutied = true;
    })();
    return next;
}
const VStockRelease = async() => {
    DisplayManager.hiddenDisplay('VStockCount');
    await new Promise(r => requestAnimationFrame(r));
    DisplayManager.showDisplay('VStockCount', 'Vrelease');
    await sounder.playSound('vRelease');
    $('#displayVStockCount span').text(`×${effectManeger.atData.vStockEffectCount}`);
    DisplayManager.showDisplay('VStockCount');
    if (effectManeger.atData.vStockEffectCount === 0) {
        DisplayManager.hiddenDisplay('VStockCount');
    }

}
const Kokuti = async(noResume) => {
    slotmodule.freeze();
    $('#kokuti').addClass('show').addClass('rainbow');

    DisplayManager.hiddenDisplay('Saisyu');
    DisplayManager.hiddenDisplay('Fine');
    DisplayManager.hiddenDisplay('Rush');
    DisplayManager.hiddenDisplay('RushStart');
    sounder.setVolume('bgm', 0);
    await sounder.playSound('kokuti');
    await sleep(1000);
    if (!noResume) slotmodule.resume();
}

const NabiEffect = async(nabiIndex, isGet) => {
    const NabiList = [
        [1, 2, 3],
        [1, 3, 2],
        [2, 1, 3],
        [2, 3, 1],
        [3, 1, 2],
        [3, 2, 1]
    ];
    const nabi = NabiList[nabiIndex];
    slotmodule.zyunjo = nabi;
    sounder.playSound('nabi');
    $('.nabi.normal').show();
    $('.nabi.chance').hide();
    $('#nabiSpace').show();
    nabi.forEach((n, c) => {
        let e = $('#nabi' + (c + 1));
        e.css({ order: n });

    })
    const NabiFlashs = [
        [
            [2, 0, 0],
            [1, 1, 0],
            [2, 0, 1]
        ],
        [
            [0, 2, 0],
            [1, 1, 0],
            [1, 2, 1]
        ],
        [
            [0, 0, 2],
            [1, 1, 2],
            [0, 0, 1]
        ]
    ].map(arr => {
        return arr.map(arr => {
            return arr.map(d => {
                if (d == 0) return ColorData.DEFAULT_F;
                if (d == 1) return ColorData.DEFAULT_F;
                if (d == 2) return {
                    color: 0xaaaaff,
                    alpha: 0.9
                }
            })
        })
    });
    for (let c = 0; c < 3; c++) {
        let e = $('#nabi' + (c + 1))
        e.addClass('pick')
        slotmodule.flashController.setFlash(o = {
            front: Array(3).fill(Array(3).fill(ColorData.DEFAULT_F)),
            back: NabiFlashs[nabi[c] - 1]
        });
        await slotmodule.once('reelStop');
        e.removeClass('pick')
        e.addClass('hide');
    }
    if (isGet) {
        (async() => {
            DisplayManager.showDisplay('Get', 'btot');
            await slotmodule.once('bet');
            DisplayManager.hiddenDisplay('Get');
        })();
    }
    await sleep(500);
    $('#nabiSpace').hide();
    $('.nabi').removeClass('hide');
}

const ChanceNabiEffect = async() => {
    if (window.leverEffect) return
    sounder.playSound('chanceNabi');
    $('.nabi.normal').hide();
    $('.nabi.chance').show();
    $('#nabiSpace').show();
    for (let c = 0; c < 3; c++) {
        let e = $('#chance' + (c + 1))
        await slotmodule.once('reelStop');
        e.removeClass('pick')
        e.addClass('hide');
    }
    $('#nabiSpace').hide();
    $('.nabi.chance').removeClass('hide').removeClass('pick');
}

const DummyReelStop = async(left, center, right, isKokutied) => {
    const { reels } = slotmodule.reelController;
    let puruList = [5, 3, 1, -1, -3, -5, -5, -3, -1, 1, 3, 5];
    let isReverse = [true, false, true];
    let chipHeight = reels[0].chipHeight;
    let reelPositions = reels.map(r => r.reelPosition);
    const targetPosition = [left, center, right].map(p => p * chipHeight);

    if (!isKokutied) {
        Kokuti();
    }
    let reelHeight = reels[0].reelHeight;
    let setTime = 64;

    let speeds = isReverse.map((f, i) => {
        let s;
        if (f) {
            s = reelPositions[i] - targetPosition[i];
            if (s >= 0) {
                s -= reelHeight;
            }
        } else {
            s = reelPositions[i] - targetPosition[i];
            if (s < reelHeight) {
                s += reelHeight;
            }
        }
        return s / setTime;
    });
    console.log({ reelPositions, targetPosition, speeds })
    slotmodule.freeze();
    //逆回転 順回転 逆回転でリールをセットする。
    for (let i = 0; i < setTime; i++) {
        await new Promise(r => requestAnimationFrame(r));
        speeds.forEach((s, i) => {
            reels[i].movePosition(s);
        })
    }
    sounder.playSound('bonusHit');
    (async() => {
        await sleep(1000);
        if (effectManeger instanceof BIGATEffect) {
            sounder.playSound('bigBonusKakutei')
        } else {
            sounder.playSound('bonusKakutei');
        }
    })()
    for (let i = 0; i < 5; i++) {
        for (let v of puruList) {
            for (let j = 0; j < reels.length; j++) {
                reels[j].movePosition((isReverse[j] ? -1 : 1) * v);
            }
            await new Promise(r => requestAnimationFrame(r));
        }
    }

    await ResumeReels(reelPositions);
    console.log(reels.map(r => r.reelPosition));
    slotmodule.resume();
    $('#kokuti').removeClass('show').removeClass('rainbow');
}

const ResumeReels = async(reelPositions) => {
    let puruList = [5, 3, 1, -1, -3, -5, -5, -3, -1, 1, 3, 5];
    const { reels } = slotmodule.reelController;
    let reelHeight = reels[0].reelHeight;
    let scrollCount = [1, 3, 5].map((d, i) => d * reelHeight + reelPositions[i] - reels[i].reelPosition);
    let resumeCount = 0;
    let v = 0;
    while (true) {
        for (let i = 0; i < 3; i++) {
            if (scrollCount[i] > 0) {
                // reels[i].movePosition(PanelData.reel.speed);
                scrollCount[i] -= PanelData.reel.speed;
                scrollCount[i] -= puruList[v];
                if (scrollCount[i] <= 0) {
                    reels[i].movePosition(PanelData.reel.speed - scrollCount[i]);
                    resumeCount++;
                } else {
                    reels[i].movePosition(puruList[v]);
                }
            } else {
                reels[i].movePosition(PanelData.reel.speed);
            }

        }
        if (resumeCount == 3) break;
        await new Promise(r => requestAnimationFrame(r));
        v++;
        if (v == puruList.length) v = 0;
    }
    while (true) {
        for (let i = 0; i < 3; i++) {
            reels[i].movePosition(PanelData.reel.speed);
        }
        await new Promise(r => requestAnimationFrame(r));
        let g = (reels[0].reelPosition - reelPositions[0] + reelHeight) % reelHeight
        if (g < PanelData.reel.speed) {
            for (let i = 0; i < 3; i++) {
                let g = (reels[i].reelPosition - reelPositions[i] + reelHeight) % reelHeight
                reels[i].movePosition(g)
            }
            break
        }
    }
}

const PickSpecialStop = (isSeven) => {
    const SpecialStopTable = {
        Normal: [
            [1, 3, 4],
            [1, 3, 0],
            [1, 11, 7],
            [2, 5, 11],
            [2, 0, 4],
            [2, 12, 8],
            [3, 15, 10],
            [3, 11, 12],
            [4, 15, 4],
            [4, 7, 14]

        ],
        Seven: [
            [0, 11, 3],
            [0, 3, 4],
            [5, 15, 5],
            [15, 5, 15]
        ]
    }
    let arr = SpecialStopTable[isSeven && !rand(4) ? 'Seven' : 'Normal'];
    return arr[Math.floor(Math.random() * arr.length)];
}

const SyotoEffect = (control, isBonus) => {
    let SyotoTable = {
        リプレイ: [85, 10, 5, 0],
        スイカ: [1, 0, 99, 0],
        チェリー: [20, 80, 0, 0],
        リーチ目リプレイ: [30, 10, 25, 35],
        ベル: [95, 4, 1, 0]
    }
    if (isBonus) control = 'リーチ目リプレイ';
    if (control.includes('ベル')) control = 'ベル'
    let list = SyotoTable[control];
    if (!list) return;
    let syotoCount = ArrayLot(list);
    const SyotoFlashs = [
        [
            [2, 0, 0],
            [1, 1, 0],
            [2, 0, 1]
        ],
        [
            [0, 2, 0],
            [1, 1, 0],
            [1, 2, 1]
        ],
        [
            [0, 0, 2],
            [1, 1, 2],
            [0, 0, 1]
        ]
    ];
    let flashMatrix = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ]


    if (((control === 'チェリー' && syotoCount == 0) || (control === 'リーチ目リプレイ' && !rand(12)))) {
        window.leverEffect = '遅れ';
    }

    slotmodule.once('reelStop', ({ count, idx }) => {
        if (syotoCount === 0) return;
        syotoCount--;
        sounder.playSound('syoto')
        flashMatrix = flashMatrix.map((arr, y) => {
            return arr.map((b, x) => {
                return b || SyotoFlashs[idx][y][x];
            })
        })

        slotmodule.flashController.setFlash({
            front: Array(3).fill(Array(3).fill(ColorData.DEFAULT_F)),
            back: flashMatrix.map(arr => {
                return arr.map(p => {
                    return [ColorData.DEFAULT_F, ColorData.DEFAULT_F, ColorData.SYOTO_F][p]
                })
            })
        })

        return true;
    })
}

const VStockEffect = async(atData) => {
    if (atData.vStockEffectCount > 0) return;
    if (atData.isFirst) return;
    let stock = GetStockCount(atData);
    if (stock == 0) return;
    let isEffect = (() => {
        for (let i = 0; i < stock; i++) {
            if (!rand(4)) return true;
        }
        return false;
    })();
    if (!isEffect) return;
    atData.vStockEffectCount = stock;
    // let stock = 1;
    let firstReelPosition = [6, 4, 6];
    const { reels } = slotmodule.reelController;
    const { flashController } = slotmodule;
    let puruList = [5, 3, 1, -1, -3, -5, -5, -3, -1, 1, 3, 5];
    let isReverse = [true, true, true];
    let chipHeight = reels[0].chipHeight;
    let realReelPositions = reels.map(r => r.reelPosition);
    let reelPositions = reels.map(r => r.reelPosition);
    let targetPosition = firstReelPosition.map(p => p * chipHeight);

    let reelHeight = reels[0].reelHeight;
    let setTime = 64;

    let speeds = isReverse.map((f, i) => {
        let s;
        if (f) {
            s = reelPositions[i] - targetPosition[i];
            if (s >= 0) {
                s -= reelHeight;
            }
        } else {
            s = reelPositions[i] - targetPosition[i];
            if (s < reelHeight) {
                s += reelHeight;
            }
        }
        return s / setTime;
    });
    slotmodule.freeze();
    Kokuti(true);

    sounder.setVolume('bgm', 0.5);
    //逆回転 順回転 逆回転でリールをセットする。
    for (let i = 0; i < setTime; i++) {
        await new Promise(r => requestAnimationFrame(r));
        speeds.forEach((s, i) => {
            reels[i].movePosition(s);
        })
    }
    DisplayManager.showDisplay('VStock');
    $('#vStockCount').text('');
    sounder.playSound('push');
    let isPushed = false;
    slotmodule.once('pressAny', () => {
        isPushed = true;
    })
    while (!isPushed) {
        for (let v of puruList) {
            for (let j = 0; j < reels.length; j++) {
                reels[j].movePosition((isReverse[j] ? -1 : 1) * v);
            }
            flashController.setFlash(FlashData.YellowV, 2)
            await new Promise(r => requestAnimationFrame(r));
            flashController.setFlash(FlashData.syoto, 2)
        }
    }
    flashController.clearFlashReservation();

    const VStockReelTable = [
        [2, 1, 11],
        [2, 0, 9],
        [3, 1, 10],
        [4, 1, 9],
        [2, 0, 9],
    ]

    isReverse = [true, false, true];
    setTime = 50;
    for (let i = 0; i < stock; i++) {
        let target = VStockReelTable[rand(VStockReelTable.length)];
        reelPositions = reels.map(r => r.reelPosition);
        targetPosition = target.map(p => p * chipHeight);
        speeds = isReverse.map((f, i) => {
            let s;
            if (f) {
                s = reelPositions[i] - targetPosition[i];
                if (s >= 0) {
                    s -= reelHeight;
                }
            } else {
                s = reelPositions[i] - targetPosition[i];
                if (s < reelHeight) {
                    s += reelHeight;
                }
            }
            return s / setTime;
        });

        //逆回転 順回転 逆回転でリールをセットする。
        for (let i = 0; i < setTime; i++) {
            await new Promise(r => requestAnimationFrame(r));
            speeds.forEach((s, i) => {
                reels[i].movePosition(s);
            })
        }
        Kokuti(true);
        $('#vStockCount').text(i + 1);
        for (let i = 0; i < 2; i++) {
            for (let v of puruList) {
                for (let j = 0; j < reels.length; j++) {
                    reels[j].movePosition((isReverse[j] ? -1 : 1) * v);
                }
                await new Promise(r => requestAnimationFrame(r));
            }
        }
        isReverse = isReverse.map(b => !b);
    }

    sounder.setVolume('bgm', 1);
    await ResumeReels(realReelPositions)
    slotmodule.resume();

    DisplayManager.hiddenDisplay('VStock');
    DisplayManager.showDisplay('VStockCount');
    $('#displayVStockCount span').text(`×${effectManeger.atData.vStockEffectCount}`);

}

const SpecialStopEffect = async(left, center, right) => {
    const { reels } = slotmodule.reelController;
    let puruList = [0, 0, 0, 0, 0, 2, 1, -1, -2, 0, 0, 0, 0, 0];
    let chipHeight = reels[0].chipHeight;
    let reelPositions = reels.map(r => r.reelPosition);
    const targetPosition = [left, center, right].map(p => p * chipHeight);

    let reelHeight = reels[0].reelHeight;
    let setTime = 64;
    let speed = PanelData.reel.speed;
    const ReelStopStatus = ['move', 'move', 'move'];
    let allReelStoped = false;
    console.log({ reelPositions, targetPosition })
    slotmodule.freeze();
    //逆回転 順回転 逆回転でリールをセットする。
    sounder.playSound("start")
    const dummyStop = (idx) => {
        return () => {
            if (idx >= ReelStopStatus.length) return;
            if (ReelStopStatus.includes('slip')) return true;
            if (ReelStopStatus[idx] !== 'move') return;
            slotmodule.onReelStop();
            ReelStopStatus[idx] = 'slip';
            return true;
        }
    }
    slotmodule.once('pressStop1', dummyStop(0));
    slotmodule.once('pressStop2', dummyStop(1));
    slotmodule.once('pressStop3', dummyStop(2));
    slotmodule.once('pressAllmity', () => {
        return dummyStop(ReelStopStatus.findIndex(s => s === 'move'))();
    })

    while (!allReelStoped) {
        reels.forEach((r, i) => {
            switch (ReelStopStatus[i]) {
                case 'move':
                    r.movePosition(speed);
                    break
                case 'slip':
                    if (targetPosition[i] === r.reelPosition) {
                        ReelStopStatus[i] = 'stop';
                        if (ReelStopStatus.every(s => s == 'stop')) {
                            allReelStoped = true;
                        }
                        break
                    }
                    let s = speed;
                    let g = r.reelPosition - targetPosition[i] + reelHeight;
                    g = g % reelHeight;
                    if (g < speed)
                        s = g;
                    r.movePosition(s);
                    break
                case 'stop':

            }
        })
        await new Promise(r => requestAnimationFrame(r));
    }

    for (let i = 0; i < 5; i++) {
        for (let v of puruList) {
            for (let j = 0; j < reels.length; j++) {
                reels[j].movePosition(v);
            }
            await new Promise(r => requestAnimationFrame(r));
        }
    }
    Kokuti(true);
    await ResumeReels(reelPositions);

    slotmodule.resume();
}

effectManeger = new NormalEffect();
const BonusHitEffect = async(atData, bonusType) => {
    await sleep(2000);
    ChangeBGM(atData);
    let tag;
    switch (bonusType) {
        case 'BIG':
            if (GetStockCount() > 0 && !rand(8)) {
                DisplayManager.showDisplay(tag = 'BigBonusGold');
            } else {
                DisplayManager.showDisplay(tag = 'BigBonus');
            }
            break
        case 'REG':
            if (GetStockCount() > 0 && !rand(8)) {
                DisplayManager.showDisplay(tag = 'RegBonusGold');
            } else {
                DisplayManager.showDisplay(tag = 'RegBonus');
            }
            break
    }
}
const ChangeBGM = async(atData) => {
    sounder.setVolume('bgm', 1);
    let bgm = null;
    if (atData.bonusLog.length == 1) {
        bgm = 'big1';
    } else {
        if (atData.bonusLog.length % 2 == 0) {
            const BGMTables = ['big2', 'big3', 'big4', 'big5', 'big6', 'big7'];
            let idx = Math.floor(atData.bonusLog.length / 3);
            bgm = BGMTables[idx];
        }
    }
    if (!bgm) return;
    sounder.stopSound('bgm');
    sounder.playSound(bgm, true);
}

const DurandalEffect = async() => {
    slotmodule.freeze();
    sounder.playSound('durandal');
    DisplayManager.showDisplay('De', 'de');
    const { reels } = slotmodule.reelController;
    const { flashController } = slotmodule;
    let puruList = [3, 2, 1, -1, -2, -3, -3, -2, -1, 1, 2, 3];
    let reelSpeeds = [40, 40, 40];
    let reelPositions = reels.map(r => r.reelPosition);
    let step = 1;
    let reelHeight = reels[0].reelHeight;
    //リールフラッシュ
    (async() => {
        //Step1
        while (step == 1) {
            await flashController.setFlash({
                front: FlashData.default.front,
                back: [
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                ]
            }, 2);
            await flashController.setFlash(FlashData.default, 2);
        }
        //Step2
        while (step == 2) {
            await flashController.setFlash({
                front: FlashData.default.front,
                back: [
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                    [ColorData.Aqua, ColorData.Orange, ColorData.Aqua],
                ]
            }, 2);
            await flashController.setFlash(FlashData.default, 2);
        }
        //Step3
        while (step == 3) {
            await flashController.setFlash({
                front: FlashData.default.front,
                back: [
                    [ColorData.DEFAULT_B, ColorData.Orange, ColorData.DEFAULT_B],
                    [ColorData.DEFAULT_B, ColorData.Orange, ColorData.DEFAULT_B],
                    [ColorData.Orange, ColorData.Orange, ColorData.Orange],
                ]
            }, 2);
        }
    })();

    //Step1
    setTime = 1283;
    setTimeout(() => { step++ }, setTime);
    while (step == 1) {
        await new Promise(r => requestAnimationFrame(r));
        reelSpeeds.forEach((s, i) => {
            reels[i].movePosition(s);
        })
    }
    //Step2
    setTime = 3514 - setTime;
    setTimeout(() => { step++ }, setTime);
    reelSpeeds = [25, 40, 25]
    while (step == 2) {
        await new Promise(r => requestAnimationFrame(r));
        reelSpeeds.forEach((s, i) => {
            reels[i].movePosition(s);
        })
    }

    setTime = 6037 - setTime;
    setTimeout(() => { step++ }, setTime);
    reelSpeeds = [5, 40, 5]
    while (step == 3) {
        await new Promise(r => requestAnimationFrame(r));
        reelSpeeds.forEach((s, i) => {
            reels[i].movePosition(s);
        })
    }


    flashController.clearFlashReservation();

    await ResumeReels(reelPositions)
    DisplayManager.hiddenDisplay('De')
    slotmodule.resume();
}

const StarDustEffect = async() => {
    slotmodule.freeze();
    await sleep(2000);
    await new Promise(async r => {
        sounder.playSound('starDust', false, r)
        const flashLines = [
            [
                [0, 1, 0],
                [0, 0, 0],
                [0, 0, 0]

            ],
            [
                [0, 2, 0],
                [1, 0, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 0],
                [2, 0, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 0],
                [0, 0, 1],
                [0, 0, 0]
            ],
            [
                [0, 0, 0],
                [0, 0, 2],
                [0, 1, 0],
            ],
            [
                [0, 0, 0],
                [0, 0, 0],
                [0, 2, 0]
            ],
            [
                [0, 0, 0],
                [0, 0, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 1],
                [0, 0, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 2],
                [0, 1, 0],
                [0, 0, 0]
            ],
            [
                [0, 0, 0],
                [0, 2, 0],
                [1, 0, 0]
            ],
            [
                [0, 0, 0],
                [0, 0, 0],
                [2, 0, 0]
            ]
        ]
        for (let matrix of flashLines) {
            let m = MapMatrix(matrix, (v) => {
                switch (v) {
                    case 0:
                        return ColorData.SYOTO_B;
                    case 1:
                        return {
                            color: 0xffffff,
                            alpha: 0.8
                        };
                    case 2:
                        return {
                            color: 0xfffffff,
                            alpha: 0.5
                        }
                }
            });
            await slotmodule.flashController.setFlash({
                front: FlashData.default.front,
                back: m
            }, 3)
        }

        slotmodule.flashController.clearFlashReservation();
    })

    slotmodule.resume();
}

const MapMatrix = (matrix, fn) => {
    return matrix.map(arr => arr.map(fn));
}

const GetStockCount = () => {
    return effectManeger.atData.hitTables.slice(0, 4).filter(Boolean).length;
}

const ZesyoCheck = (atData) => {
    /*************************************************
     * 70億の絶唱、発生条件
     * 4回転以内の書き換え数と流れ星ストックの数をカウントし、
     * 1つあたり150枚でカウント
     * 有利区間残り枚数がなくなった時点で発生
     * チェック時はボーナス中なので+1
     ***************************************************/
    let stockCount = GetStockCount() + atData.vStock + 1;
    let stockCoin = stockCount * 150;
    console.log(advantage.coinCount - stockCoin);
    if (advantage.coinCount - stockCoin < 0) {
        return true;
    }
}

const ZesyoEffect = async(atData) => {
    const { flashController } = slotmodule
    flashController.clearFlashReservation();
    slotmodule.freeze();
    await sleep(rand(3000));
    sounder.stopSound('bgm')
    Object.keys(DisplayManager.DisplayElements).forEach((key) => {
        DisplayManager.hiddenDisplay(key);
    })
    sounder.playSound('zesyo')
    let reelEffectCount = 0;
    (async() => {
        const { reels } = slotmodule.reelController;
        let reelPositions = reels.map(r => r.reelPosition);
        const timeMove = async(time) => {
            return new Promise(async r => {
                let move = true
                setTimeout(() => {
                    move = false;
                    r();
                }, time);
                let f = true;
                while (move) {
                    if (reelEffectCount == 0) {
                        if (f) {
                            flashController.setFlash(FlashData.YellowAll)
                        } else {
                            flashController.setFlash(FlashData.syoto)
                        }
                        f = !f
                    }
                    reels.forEach(reel => reel.movePosition(-4));
                    await new Promise(r => requestAnimationFrame(r));
                }

            })
        }
        while (reelEffectCount === 0) {
            await timeMove(100);
            // await sleep(500);
        }
        flashController.clearFlashReservation()
        flashController.setFlash(FlashData.syoto)
        while (reelEffectCount <= 1) {
            await timeMove(700);
        }
        await ResumeReels(reelPositions);
        slotmodule.resume();
    })();
    for (let i = 1; i <= 5; i++) {
        DisplayManager.showDisplay('ZesyoFace' + i, 'face');
        await sleep(750);
        DisplayManager.hiddenDisplay('ZesyoFace' + i)
    }
    DisplayManager.showDisplay('ZesyoFace6', 'facelong');
    await sleep(1600);
    DisplayManager.hiddenDisplay('ZesyoFace6');

    reelEffectCount = 1;
    DisplayManager.showDisplay('Ze', 'ze');
    DisplayManager.showDisplay('Syo', 'syo');
    await sleep(13000);
    DisplayManager.hiddenDisplay('Ze');
    DisplayManager.hiddenDisplay('Syo');

    reelEffectCount = 2;
    sounder.playSound('kokuti');
    DisplayManager.showDisplay('MaxGet', 'maxget');
    flashController.clearFlashReservation();
    await sleep(1500);
    effectManeger = new MAXATEffect(atData);
    DisplayManager.showDisplay('Counter');
}