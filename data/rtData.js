class RT {
    constructor() {
        this.rt = null;
    }
    countGame() {
        if (this.rt === null) return;
        this.rt--;
        if (this.rt === 0) return new DefaultRTClass;
    }
    hitCheck(hit) {
        return null;
    }
    onHit(hit) {
        return this.hitCheck(hit) || this.countGame() || this;
    }
    onLot() {
        return null;
    }
}

class DefaultRT extends RT {
    constructor() {
        super();
        console.log(this.constructor.name + 'へ以降');
        this.rt = null;
        $('.rt-lamp').css({ background: 'black' })
    }
    hitCheck(hit) {
        switch (hit) {
            case '中段プラム':
            case 'リーチ目リプレイ':
                return new HighBaseRT();
        }
    }
    onLot(lot) {
        if (lot === 'はずれ') return lot;
        return `突入リプレイ3-${1+rand(3)}`
    }
}

class HighBaseRT extends RT {
    constructor() {
        super();
        $('.rt-lamp').css({ background: 'blue' })
        console.log(this.constructor.name + 'へ以降');
        this.rt = null;
    }
    hitCheck(hit) {
        switch (hit) {
            case '突入リプレイ1':
                return new HighRT1();
                break
            case '突入リプレイ2':
                return new HighRT2();
                break
            case '1枚役':
            case 'リプレイ':
                return new DefaultRT();
                break
        }
    }
    onLot(lot) {
        lot = `突入リプレイ${1+rand(3)}-${1+rand(3)}`
        return lot;
    }
}


class HighRT1 extends RT {
    constructor() {
        super();
        console.log(this.constructor.name + 'へ以降');
        SlotLog('リーチ目高確率RT 1へ以降');
        $('.rt-lamp').css({ background: 'green' })
        this.rt = 5;
    }
    onLot(lot) {
        if (lot === 'はずれ') return ['プラムリプレイ', 'リプレイ'][rand(2)]
        if (lot === 'リプレイ') {
            if (Math.random() < ((1 / lotdata.normal[0].value) / 12)) {
                lot = 'リーチ目リプレイ';
                if (!rand(4)) {
                    lot = 'BAR揃い';
                }
            } else {
                lot = 'BAR揃いガセ'
            }
        }
        return lot;
    }
    hitCheck(hit) {}
}

class HighRT2 extends RT {
    constructor() {
        super();
        console.log(this.constructor.name + 'へ以降');
        SlotLog('リーチ目高確率RT 2へ以降');
        $('.rt-lamp').css({ background: 'red' })
        this.rt = 8;
    }
    onLot(lot) {
        if (lot === 'はずれ') return ['プラムリプレイ', 'リプレイ', 'BAR揃いガセ'][rand(3)]
        if (lot === 'リプレイ') {
            if (Math.random() < ((1 / lotdata.normal[0].value) / 9)) {
                lot = 'リーチ目リプレイ';
                if (!rand(4)) {
                    return lot = 'BAR揃い';
                }
                if (!rand(4)) {
                    return lot = '突入リプレイ2-1';
                }
            } else {
                lot = 'BAR揃いガセ'
            }
        }
        return lot;
    }
    hitCheck(hit) {}
}


const DefaultRTClass = DefaultRT;