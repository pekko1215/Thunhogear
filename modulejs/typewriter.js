Typewriter = function(text,option={}){
	option = Object.assign({
		delay:3000,
		speed:150,
		backgroundColor:'black',
		color:'white',
		target:document.body,
		change:()=>{},
		title:()=>{},
		finish:()=>{}
	},option);
	console.log(option)
	var pText = (function(d){
		var p = document.createElement('p');
		p.innerHTML = d;
		return p.innerText;
	})(text)
	var textArr = [...pText];
	var $back = document.createElement('div');
	var $text = document.createElement('div');
	$back.style.position = 'absolute'
    $back.style.display = 'flex';
    $back.style.alignItems = 'center';
	$back.style.backgroundColor = option.backgroundColor;
	$back.style.width = '100%'
	$back.style.height = '100%'
	$back.style.top = '0';
	$back.style.left = '0';
	$text.style.color = option.color;
	$text.style.fontSize = '45vw';
	$text.style.fontFamily = 'ＭＳ 明朝'
	$text.style.textAlign = 'center';
	$text.style.width = '100%'
	$text.style.whiteSpace = 'nowrap';
	$back.appendChild($text);
	option.target.appendChild($back)
	var zoomout = function(vw = 20){
		$text.style.fontSize = vw+`vw`
		if(vw==10){
			setTimeout(option.finish,option.delay,$back)
			return
		}
		setTimeout(zoomout,5,vw-1)
	}
	var type = function(){
		if(!textArr.length){
			$text.innerHTML = text;
			option.title();
			zoomout();
			return
		}
		var t = textArr.shift();
		$text.innerHTML = t;
		option.change(t)
		setTimeout(type,option.speed)
	}
	setTimeout(type,option.speed);
	var ret = {
		change:(fn)=>{option.change = fn;return ret},
		title:(fn)=>{option.title = fn;return ret},
		finish:(fn)=>{option.finish = fn;return ret}
	}
	return ret;
}