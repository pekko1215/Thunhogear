(function(){
	DataView.prototype.lpeek = function(){
        return this.read(4);
    }
	DataView.prototype.wpeek = function(){
        return this.read(2);
    }
    DataView.prototype.peek = function(){
        return this.read(1);
    }
    DataView.prototype.read = function(byte,opt = true){//引数バイト読み込む
		this._index = this._index || 0
		var methodname = `get${opt?"Ui":"I"}nt${byte*8}`;
		var ret = this[methodname](this._index,true);
		this._index += byte
		return ret;
    }
})()