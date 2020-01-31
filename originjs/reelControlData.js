function reelControlData(controlData) {
    this.controlData = controlData;
    this.rcc = 0;
    this.stopCount = 0
    this.stopPos = []
    this.reelStoppos = []
}
reelControlData.prototype.getStopPos = function(reel, num, pos) {
    var slide = this.controlData.slideTable[reel][num * this.controlData.tableSize + Math.floor(pos / 2)];
    if ((pos & 1) == 0) {
        slide = slide >> 4
    } else {
        slide = slide & 0x0F
    }
    var ret = pos - slide;
    if (ret < 0) {
        ret += this.controlData.reelLength;
    }
    return ret;
}

reelControlData.prototype.getStopPosIndex = function(reel, num, pos) {
    var flags = 0;
    var ret = 0;

    for (var i = 0; i < this.controlData.reelLength; i++) {
        var p = this.getStopPos(reel, num, i);
        flags = flags | (1 << p);
    }
    if ((flags & (1 << pos)) == 0) {
        return -1;
    }
    for (var i = 0; i < pos; i++) {
        if ((flags & (1 << i)) != 0) {
            ret++;
        }
    }
    return ret;
}

reelControlData.prototype.readData = function(b, idx, isShort) {
    if (isShort) {
        return ((b[idx * 2] & 0xFF) << 8) | (b[idx * 2 + 1] & 0xFF);
    }
    return b[idx] & 0xFF;
}

reelControlData.prototype.getStopPos1st = function(controlNum, reel, pos) {
    this.setReelControlCode(controlNum);
    return this.reelStop(reel, pos);
}

reelControlData.prototype.getStopPos2nd = function(reel, pos) {
    return this.reelStop(reel, pos);
}

reelControlData.prototype.getStopPos3rd = function(reel, pos) {
    return this.reelStop(reel, pos);
}


reelControlData.prototype.getTableNum = function(prm1) {
    var ret = 0;
    var idx = 0;
    switch (this.stopCount) {
        case 0:
            ret = wpeek(this.controlData.tableNum1, (this.rcc * 3 + prm1) * 2)
            this.stopPattern = prm1 * 3
            break
        case 1:
            this.stopPattern += prm1 - 1
            if (this.stopPattern > 3) {
                this.stopPattern--
            }
            idx = this.rcc * 6 * this.controlData.reelLength
            idx += this.stopPattern * this.controlData.reelLength
            idx += this.stopPos[0]
            ret = wpeek(this.controlData.tableNum2, idx * 2)
            break
        case 2:
            idx = this.rcc * 6 * this.controlData.reelLength * this.controlData.reelLength
            idx += this.stopPattern * this.controlData.reelLength * this.controlData.reelLength
            idx += this.stopPos[0] * this.controlData.reelLength
            idx += this.stopPos[1]
            ret = wpeek(this.controlData.tableNum3, (idx) * 2)
            break
    }
    return ret
}

reelControlData.prototype.setReelControlCode = function(prm1) {
    this.rcc = prm1
    if (this.rcc < 0) {
        throw "リール制御コードがおかしいぞ"
    }
}


reelControlData.prototype.reelStop = function(reel, pos) {
    var slide;
    var num = this.getTableNum(reel)
    slide = peek(this.controlData.slideTable, this.controlData.reelLength * num + pos)
    this.stopPos[this.stopCount] = (pos - slide + this.controlData.reelLength) % this.controlData.reelLength
    this.reelStoppos[reel] = this.stopPos[this.stopCount]
    var ret = this.stopPos[this.stopCount];
    this.stopCount = this.stopCount + 1 == 3 ? 0 : this.stopCount + 1;
    // console.log(ret)
    return ret
}

function wpeek(arr, idx) {
    var ret = 0;
    for (var i = 0; i < 2; i++) {
        // ret = (ret << 8) + arr[idx + i]
        ret += arr[idx + i] << (i * 8)
            // console.log(arr)
    }
    return ret;
}

function peek(arr, idx) {
    return arr[idx];
}