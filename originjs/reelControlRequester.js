function controlRerquest(filename, callback) {
    window.reelControl = null;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename);
    xhr.responseType = 'arraybuffer';
    controlData = {};
    xhr.onload = function() {
        var uUint8array = new Uint8Array(this.response)
        var data_view = new DataView(uUint8array.buffer);
        console.log(data_view)
        window.data = data_view

        var c = controlData;
        data_view.lpeek()
        c.controlCount = data_view.lpeek();
        data_view.peek()
        c.reelLength = data_view.peek();
        c.yakuCount = data_view.peek();
        c.maxLine = data_view.peek();
        // return
        var size = c.reelLength * 3
        c.reelArray = []
        for (var i = 0; i < 3; i++) {
            c.reelArray[i] = []
            for (var j = 0; j < c.reelLength; j++) {
                c.reelArray[i][j] = data_view.peek()
            }
        }

        c.yakuList = Array(c.yakuCount)

        for (var i = 0; i < c.yakuCount; i++) {
            c.yakuList[i] = data_view.wpeek()
            for (var j = 0; j < 3; j++) {
                if ((c.yakuList[i] >> j * 4 & 0x0F) == 0x0F) {
                    c.yakuList[i] += (0xF0000 << j * 4)
                }
            }
        }

        c.betLine = Array(c.maxLine)

        for (var i = 0; i < c.maxLine; i++) {
            c.betLine[i] = []
            for (var j = 0; j < 4; j++) {
                c.betLine[i][j] = data_view.peek()
            }
        }

        c.slideTableSize = data_view.wpeek();
        c.slideTable = Array(c.slideTableSize * c.reelLength).fill(0).map(() => {
            return data_view.peek();
        });

        c.tableNum1 = Array(c.controlCount * 3 * 2).fill(0).map(() => {
            return data_view.peek();
        })

        c.tableNum2 = Array(c.controlCount * 6 * c.reelLength * 2).fill(0).map(() => {
            return data_view.peek()
        })

        c.tableNum3 = Array(c.controlCount * 6 * c.reelLength * c.reelLength * 2).fill(0).map(() => {
            return data_view.peek()
        })

        c.typeCount = Math.max(...c.reelArray.flat()) + 1;

        reelControl = new reelControlData(controlData)
        window.slotmodule = new SlotModuleMk2(PanelData, reelControl, FlashData.default);

        $(callback)

    }
    xhr.send();
}