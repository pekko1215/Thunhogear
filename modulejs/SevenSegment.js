// forked from nekyo's "forked: 7/14/16 7Segment LED" http://jsdo.it/nekyo/kyAj
// forked from satanabe1's "7/14/16 Segment LED" http://jsdo.it/satanabe1/xYvE
//{{{ 7SegmentLED
//
//{{{ function SevenSegment(canvas, x, y, size) {
function SevenSegment(canvas, x, y, size){
    this.canvas   = canvas;
    // this.onColor  = [255,  50,  50]; // 赤
    this.onColor  = [ 50, 255,  50];    // 緑
    // this.onColor  = [100, 100, 255]; // 青
    this.offColor = [240, 230, 230];
    this.width    = size * 0.6;
    this.height   = size;
    this.x = x;
    this.y = y;
    this.shadowBlur = size * 0.04;

    var bd = size * 0.09;
    var lx = x + bd;//左
    var ty = y + bd;//上
    var rx = x + this.width - bd;//右
    var by = y + this.height - bd;//下
    var context = canvas.getContext('2d');

    //context.rect(this.x, this.y, this.width, this.height);
    //context.stroke();
    var cy = y + this.height / 2;
    var bdd6 = bd / 6; // 先に計算して高速化
    var bdd3 = bd / 3;
    var bdd2 = bd / 2;
    this.point = {
        a:[ /* 左端 */[lx+bdd6,ty+bdd6],[lx+bdd3,ty],   [rx-bdd3,ty],   /* 右端 */[rx-bdd6,ty+bdd6],[rx-bd,ty+bd],  [lx+bd,ty+bd]  ],
        b:[ /* 上端 */[rx-bdd6,ty+bdd6],[rx,ty+bdd3],   [rx,cy-bdd3],   /* 下端 */[rx-bdd6,cy],     [rx-bd,cy-bdd2],[rx-bd,ty+bd]  ],
        c:[ /* 上端 */[rx-bdd6,cy],     [rx,cy+bdd3],   [rx,by-bdd3],   /* 下端 */[rx-bdd6,by-bdd6],[rx-bd,by-bd],  [rx-bd,cy+bdd2]],
        d:[ /* 左端 */[lx+bdd6,by-bdd6],[lx+bdd3,by],   [rx-bdd3,by],   /* 右端 */[rx-bdd6,by-bdd6],[rx-bd,by-bd],  [lx+bd,by-bd]  ],
        e:[ /* 上端 */[lx+bdd6,cy],     [lx+bd,cy+bdd2],[lx+bd,by-bd],  /* 下端 */[lx+bdd6,by-bdd6],[lx,by-bdd3],   [lx,cy+bdd3]   ],
        f:[ /* 上端 */[lx+bdd6,ty+bdd6],[lx+bd,ty+bd],  [lx+bd,cy-bdd2],/* 下端 */[lx+bdd6,cy],     [lx,cy-bdd3],   [lx,ty+bdd3]   ],
        g:[ /* 左端 */[lx+bdd6,cy],     [lx+bd,cy-bdd2],[rx-bd,cy-bdd2],/* 右端 */[rx-bdd6,cy],     [rx-bd,cy+bdd2],[lx+bd,cy+bdd2]],
    };

    var slide = function(array, x, y){
        for (var i = 0; i < array.length; i++) {
            array[i][0] += x;
            array[i][1] += y;
        }
    }
    var bd025 = bd * 0.25;
    var bd015 = bd * 0.15;

    slide(this.point.a,      0, -bd025);
    slide(this.point.b,  bd015, -bd015);
    slide(this.point.c,  bd015,  bd015);
    slide(this.point.d,      0,  bd025);
    slide(this.point.e, -bd015,  bd015);
    slide(this.point.f, -bd015, -bd015);
}
//}}}
//   a
// f   b
//   g
// e   c
//   d
//{{{ SevenSegment.prototype.mapping = function(number) {
SevenSegment.prototype.mapping = function(number) {
    switch(number){
        case '0': case 'O':
                  return {'number':number,'a':1,'b':1,'c':1,'d':1,'e':1,'f':1,      };
        case '1': case 'I':
                  return {'number':number,      'b':1,'c':1,                        };
        case '2': return {'number':number,'a':1,'b':1,      'd':1,'e':1,      'g':1,};
        case '3': return {'number':number,'a':1,'b':1,'c':1,'d':1,            'g':1,};
        case '4': return {'number':number,      'b':1,'c':1,            'f':1,'g':1,};
        case '5': return {'number':number,'a':1,      'c':1,'d':1,      'f':1,'g':1,};
        case '6': return {'number':number,'a':1,      'c':1,'d':1,'e':1,'f':1,'g':1,};
        case '7': return {'number':number,'a':1,'b':1,'c':1,                        };
        case '8': return {'number':number,'a':1,'b':1,'c':1,'d':1,'e':1,'f':1,'g':1,};
        case '9': return {'number':number,'a':1,'b':1,'c':1,'d':1,      'f':1,'g':1,};
        case 'A': return {'number':number,'a':1,'b':1,'c':1,      'e':1,'f':1,'g':1,};
        case 'b': return {'number':number,            'c':1,'d':1,'e':1,'f':1,'g':1,};
        case 'C': return {'number':number,'a':1,            'd':1,'e':1,'f':1,      };
        case 'c': return {'number':number,                  'd':1,'e':1,      'g':1,};
        case 'd': return {'number':number,      'b':1,'c':1,'d':1,'e':1,      'g':1,};
        case 'E': return {'number':number,'a':1,            'd':1,'e':1,'f':1,'g':1,};
        case 'F': return {'number':number,'a':1,                  'e':1,'f':1,'g':1,};
        case 'G': return {'number':number,'a':1,      'c':1,'d':1,'e':1,'f':1,      };
        case 'H': return {'number':number,      'b':1,'c':1,      'e':1,'f':1,'g':1,};
        case 'h': return {'number':number,            'c':1,      'e':1,'f':1,'g':1,};
        case 'J': return {'number':number,      'b':1,'c':1,'d':1,'e':1,            };
        case 'L': return {'number':number,                  'd':1,'e':1,'f':1,      };
        case 'n': return {'number':number,            'c':1,      'e':1,      'g':1,};
        case 'o': return {'number':number,            'c':1,'d':1,'e':1,      'g':1,};
        case 'P': return {'number':number,'a':1,'b':1,            'e':1,'f':1,'g':1,};
        case 'r': return {'number':number,                        'e':1,      'g':1,};
        case 't': return {'number':number,                  'd':1,'e':1,'f':1,'g':1,};
        case 'U': return {'number':number,      'b':1,'c':1,'d':1,'e':1,'f':1,      };
        case 'u': return {'number':number,            'c':1,'d':1,'e':1,            };
        case 'y': return {'number':number,      'b':1,'c':1,'d':1,      'f':1,'g':1,};
        case '-': return {'number':number,                                    'g':1,};
        case '_': return {'number':number,                  'd':1,                  };
        case '~': return {'number':number,'a':1,                                    };
        default:  return {'number':number,}
    }
}
//}}}
//{{{ SevenSegment.prototype.draw = function(input) {
SevenSegment.prototype.draw = function(input) {
    var context = this.canvas.getContext('2d');
    context.save();
    context.shadowColor = "rgba(" + this.onColor[0] + "," + this.onColor[1] + "," + this.onColor[2] + ",0.5" + ")";
    context.clearRect(this.x, this.y, this.width, this.height);

    context.strokeStyle = 'transparent';

    for (var key in this.point) {
        var point = this.point[key.toString()];
        context.beginPath();
        for (var i = 0; i < point.length; i++) {
            context.lineTo(point[i][0], point[i][1]);
        }
        if (input[key.toString()]) {
            context.fillStyle = "rgba(" + this.onColor[0] + "," + this.onColor[1] + "," + this.onColor[2] + ",1.0" + ")";
            context.shadowBlur = this.shadowBlur;
        } else {
            context.fillStyle = "rgba(" + this.offColor[0] + "," + this.offColor[1] + "," + this.offColor[2] + ",1.0" + ")";
            context.shadowBlur = 0;
        }
        context.fill();
        context.closePath();
        context.stroke();
    }
    context.restore();
}
//}}}
//{{{ SevenSegment.prototype.setOnColor = function(r, g, b) {
SevenSegment.prototype.setOnColor = function(r, g, b) {
    this.onColor[0] = r;
    this.onColor[1] = g;
    this.onColor[2] = b;
}
//}}}
//{{{ SevenSegment.prototype.setOffColor = function(r, g, b) {
SevenSegment.prototype.setOffColor = function(r, g, b) {
    this.offColor[0] = r;
    this.offColor[1] = g;
    this.offColor[2] = b;
}
//}}}
//}}}