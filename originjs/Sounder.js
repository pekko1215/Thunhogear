/**
 * Created by yuto-note on 2017/07/21.
 */

class SoundData {
    constructor(filename, tags = []) {
        this.loaded = false;
        this.tags = tags;
        this.filename = filename;
        this.volume = 1;
    }
    addTag(tag) {
        this.tags.push(tag);
        return this;
    }
    setVolume(volume) {
        this.volume = volume;
        if (this.gain) this.gain.gain.value = volume;
        return this;
    }
    async loadFile(context, masterGain) {
        if (this.loaded) return;
        return new Promise((r, e) => {
            let request = new XMLHttpRequest();
            request.open("GET", this.filename, true);
            request.responseType = "arraybuffer";

            request.onload = () => {
                context.decodeAudioData(request.response, (buffer) => {
                    this.gain = context.createGain();
                    this.gain.gain.value = this.volume;
                    this.gain.connect(masterGain);
                    this.buffer = buffer;
                    r();
                }, (error) => {
                    console.error(error);
                    e();
                })
            }
            request.send();
        })
    }
}

class Sounder {
    constructor() {
        this.soundDatas = [];
        this.context = null;
        this.playingBuffers = [];
        this.loaderElements = {};
        this.loaded = false;
        this.masterVolume = 1;
        let $cover = document.createElement('div');
        $cover.style.textAlign = 'center';
        $cover.style.position = 'fixed';
        $cover.style.width = '100%';
        $cover.style.height = '100%';
        $cover.style.left = 0;
        $cover.style.top = 0;
        $cover.style.backgroundColor = 'black';
        $cover.style.color = 'white';
        let $h1 = document.createElement('h1');
        this.loadEvent = () => this.startLoad()
        $cover.addEventListener('click', this.loadEvent);
        $cover.addEventListener('touchstart', this.loadEvent);
        $h1.innerText = 'クリックしてロード開始';
        document.body.appendChild($cover);
        $cover.appendChild($h1);
        this.loaderElements = { $h1, $cover };
    }

    async startLoad() {
        if (this.loaded) return;
        console.log('Sound Load Start')
        this.context = new(window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.context.createGain();
        this.masterGain.gain.value = this.masterVolume;
        this.masterGain.connect(this.context.destination);

        this.loaderElements.$cover.removeEventListener('click', this.loadEvent);
        this.loaderElements.$cover.removeEventListener('touchstart', this.loadEvent);

        let loadCount = 0;



        let updateLoading = () => {
            this.loaderElements.$h1.innerText = `音声データ 読込中... (${loadCount}/${this.soundDatas.length})`;
        }

        updateLoading();
        await Promise.all(this.soundDatas.map(async data => {
            await data.loadFile(this.context, this.masterGain);
            loadCount++;
            updateLoading();
        }));

        this.loaderElements.$cover.parentNode.removeChild(this.loaderElements.$cover);
        this.loaded = true;
    }

    addFile(file, tag) {
        let obj = new SoundData(file, [tag])
        this.soundDatas.push(obj);
        return obj;
    }

    setVolume(tag, value) {
        this.soundDatas.forEach(data => {
            if (data.tags.includes(tag)) {
                data.setVolume(value);
            }
        })
    }

    setMasterVolume(value) {
        this.masterVolume = value;
        if (this.masterGain) this.masterGain.gain.value = value;
    }

    getSoundDatasByTag(tag, isLoaded = false) {
        return this.soundDatas.filter(data => {
            return data.tags.includes(tag) && (isLoaded ? data.loaded : true)
        });
    }

    playSound(tag, isLoop, callback = () => {}, loopStart = 0, loopEnd, startTime) {
        if (!this.loaded) return;
        let playingData = {
            sources: [],
            soundDatas: []
        };
        return new Promise(r => {
            let arr = this.getSoundDatasByTag(tag);
            playingData.soundDatas = arr;
            if (arr.length == 0) return false;
            for (let data of arr) {
                let source = this.context.createBufferSource();
                source.buffer = data.buffer;
                source.loop = isLoop;
                if (isLoop) {
                    source.loopStart = loopStart;
                    source.loopEnd = loopEnd || data.buffer.duration;
                }
                source.onended = r;
                source.connect(data.gain);
                playingData.sources.push(source);
                source.start(startTime || 0);
            }
            this.playingBuffers.push(playingData);
        }).then(r => {
            playingData.sources.forEach(source => source.stop());
            this.playingBuffers = this.playingBuffers.filter(data => data !== playingData);
            callback();
        })
    }

    stopSound(tag) {
        let arr = this.playingBuffers.filter(data => data.soundDatas.find(sd => sd.tags.includes(tag)));
        arr.forEach(({ sources }) => sources.forEach(source => {
            // source.stop();
            source.onended();
        }));
    }
}