const BonusData = {
    BigBonus5: class {
        constructor(name, pay) {
            this.maxPay = pay;
            this.name = name;
            this.payd = 0;
            this.isEnd = false;
        }
        jacIn(name, gameCount, payCount) {
            this.jacName = name;
            this.gameCount = gameCount + 1;
            this.payCount = payCount;
            this.isJacin = true;
        }
        getGameMode() {
            if (this.isEnd) return 'normal'
            if (this.isJacin) return this.jacName;
            return this.name;
        }
        onPay(payCoin) {
            this.payd += payCoin;
            if (this.payd >= this.maxPay) {
                this.isEnd = true;
                return true;
            }
            if (!this.isJacin) return false;
        }
        onNextGame(payCoin) {
            this.gameCount--;
            if (payCoin >= 1) this.payCount--;
            if (this.gameCount <= 0 || this.payCount <= 0) {
                this.isJacin = false;
                return false;
            }
        }
        getBonusSeg() {
            var tmp = this.maxPay - this.payd
            return "" + (tmp < 0 ? 0 : tmp);
        }
    },
    RegularBonus5: class {
        constructor(name, gameCount, payCount) {
            this.name = name;
            this.gameCount = gameCount + 1;
            this.payCount = payCount + 1;
            this.isEnd = false;
        }
        getGameMode() {
            if (this.isEnd) return 'normal'
            return this.name;
        }
        onPay(payCoin) {}
        onNextGame(payCoin) {
            this.gameCount--;
            if (payCoin >= 1) this.payCount--;
            if (this.gameCount <= 0 || this.payCount <= 0) {
                this.isEnd = true;
                return false;
            }
        }
        getBonusSeg() {
            return `${this.gameCount}`;
            // return `${this.gameCount}-${this.payCount-1}`
        }
    }
}