/**
 * Created by pekko1215 on 2017/08/20.
 */
/*
 return {
 coin:coin,
 playcontroldata:slotmodule.getPlayControlData(),
 bonuscounter:{
 count: {},
 history: [{
 bonus: gamemode,
 game: playcount
 }]
 },
 incoin:incoin,
 outcoin:outcoin
 }
 */

SlotCodeOutputer = {};

SlotCodeOutputer.save = function (savedata) {
    var win = window.open("savewindow.html", "NewWindow", "データの保存");

    $(win).on("load", function () {
        var canvas = $("#savecanvas", win.document);
        var name = savedata.name;
        savedata.name = undefined;
        var header = "SlotCodeOutputer"
        var data = btoa(JSON.stringify(savedata))
        var footer = "create by hidehohi"
        var colorArray = encodeColorCode(header, data, footer)

        var ctx = canvas.get(0).getContext('2d')

        var imageData = ctx.createImageData(canvas.get(0).width, canvas.get(0).height);
        var yindex = parseInt(drawColorArray(colorArray, imageData) / canvas.get(0).width);

        yindex += 15;


        win.ctx = ctx;


        ctx.putImageData(imageData, 0, 0)

        ctx.font = "bold 15px Century Gothic"

        ctx.fillText(name, 0, yindex);
        yindex += 10;

        ctx.font = "bold 10px Century Gothic"
        ctx.fillText("ID:" + savedata.id, 0, yindex)

        var outputdata = [{
            name: "総ゲーム数",
            value: savedata.allplaycount
        }, {
            name: "ゲーム数",
            value: savedata.playcount
        }, {
            name: "差枚数",
            value: savedata.coin
        }, {
            name: "IN枚数",
            value: savedata.incoin
        }, {
            name: "OUT枚数",
            value: savedata.outcoin
        }];
        yindex += 30;
        ctx.font = "bold 7px Century Gothic"
        outputdata.forEach(function (d) {
            ctx.fillText(d.name + " : " + d.value, 10, yindex);
            yindex += 10;
        })

        $("#preview", win.document).attr("src", canvas[0].toDataURL("image/png"))

        $("a", win.document).click(function () {
            var a = document.createElement("a");
            a.href = canvas[0].toDataURL("image/png");
            a.setAttribute("download", "image.png");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });

    })

    function drawColorArray(arr, imageData) {

        var data = imageData.data;

        var i = 0;

        arr.forEach(function (d) {
            data[i++] = d.r;
            data[i++] = d.g;
            data[i++] = d.b;
            data[i++] = 255
        })

        var n = i;

        while (data.length > n) {
            switch (n % 4) {
                case 0:
                    data[n] = 130;
                    break;
                case 1:
                    data[n] = 180;
                    break;
                case 2:
                    data[n] = 130;
                    break;
                case 3:
                    data[n] = 255;
                    break;
            }
            n++;
        }
        return i;
    }

    function encodeColorCode(header, base64text, footer) {

        var output = [];
        output = output.concat(charToColor(header));
        output = output.concat(charToColor(base64text));
        output = output.concat(charToColor(footer));

        return output;
    }

    function charToColor(text) {
        var textarray = text.split("").map(function (t) {
            return t.charCodeAt(0)
        })
        while (textarray.length % 3 == 0) {
            textarray.push(0)
        }
        var output = [];

        while (textarray.length != 0) {
            var r = textarray.shift();
            var g = textarray.shift();
            var b = textarray.shift();

            output.push({
                r: r,
                g: g,
                b: b
            })
        }
        return output;
    }
}

SlotCodeOutputer.load = function (data) {
    var header = "SlotCodeOutputer"

    var footer = "create by hidehohi"

    var headerArray = header.split("")
    var index = 0;
    while (true) {
        var set;
        var check = false;
        for (var i = 0; i < 3; i++) {
            set = String.fromCharCode(data[index++]);
            if (headerArray.shift() != set) {
                check = true;
                if(data[index-1]!=0){
                    return false;
                }
            }
        }
        index++
        if (check) {
            break;
        }
    }

    var datatext = "";

    while (datatext.indexOf(footer) == -1) {
        if (index >= data.length) {
            return false;
        }
        for (var i = 0; i < 3; i++) {
            var adata = data[index++];
            if (adata == 0) {
                continue;
            }
            datatext += String.fromCharCode(adata);
        }
        index++
        if(data.length<=index){
            return false;
        }
    }
    datatext = datatext.slice(0, datatext.indexOf(footer));
    try {
        var b = atob(datatext)
        var obj = JSON.parse(b)
    }catch(e){
        return false
    }

    return obj
}