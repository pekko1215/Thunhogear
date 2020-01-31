/**
 * Created by pekko1215 on 2017/07/15.
 */
function Lotter(){
    if(arguments.callee.name==this.constructor.name) {
        //インスタンス生成
        this.lots = [];
        this.add = function(obj){
            switch (true){
                case typeof obj == 'number':
                    this.lots.push({
                        name:this.lots.length,
                        value:obj
                    })
                    break;
                case Array.isArray(obj):
                    obj.forEach(this.add,this);
                    break;
                case typeof obj == 'object':
                    this.lots.push(obj)
                    break;

            }
        }
        this.lot = function(){
            var ret = null;
            var p = Math.random();
            if(this.lots.reduce(function(p1,p2){return p1.value+p2.value})>1){
                p *= this.lots.reduce(function(p1,p2){return p1.value+p2.value})
            }
            this.lots.some(function (p1, p2, p3) {
                p-=p1.value;
                if(p<0){
                    ret = p1;
                    return true;
                }
            })
            if(ret===null){
                ret = {
                    name:null
                }
            }
            if(this._pipe){
                return this._pipe(ret);
            }
            return ret;
        }
        this.add(arguments[0])
        this.pipe = function(p){
            this._pipe = p;
        }
    }else{
        //通常呼び出し
        return (new arguments.callee(arguments[0])).lot();
    }
}