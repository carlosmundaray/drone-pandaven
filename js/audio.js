// ============================================
// DRONES PANDAVEN 3D — Audio System (FPS Enhanced)
// ============================================
class AudioSystem {
    constructor() {
        this.ctx=null; this.masterGain=null; this.sfxGain=null; this.musicGain=null;
        this.initialized=false; this.muted=false;
        this.musicPlaying=false; this.musicInterval=null; this.beatIndex=0; this.musicTempo=1;
        // Engine sound
        this.engineOsc=null; this.engineGain=null; this.engineRunning=false;
        this.engineTargetFreq=80; this.engineTargetGain=0.05;
        // Race MP3 music
        this.raceTracks=['musica/pista1.mp3','musica/pista2.mp3'];
        this.raceAudio=null; this.raceSource=null; this.raceMusicPlaying=false;
        this.currentTrackIndex=-1;
    }

    init() {
        if(this.initialized) return;
        try {
            this.ctx=new(window.AudioContext||window.webkitAudioContext)();
            this.masterGain=this.ctx.createGain();
            this.masterGain.gain.value=CONFIG.MASTER_VOLUME;
            this.masterGain.connect(this.ctx.destination);
            this.sfxGain=this.ctx.createGain();
            this.sfxGain.gain.value=CONFIG.SFX_VOLUME;
            this.sfxGain.connect(this.masterGain);
            this.musicGain=this.ctx.createGain();
            this.musicGain.gain.value=CONFIG.MUSIC_VOLUME;
            this.musicGain.connect(this.masterGain);
            this.initialized=true;
        } catch(e) { console.warn('Audio unavailable'); }
    }

    resume() { if(this.ctx&&this.ctx.state==='suspended') this.ctx.resume(); }
    toggleMute() { this.muted=!this.muted; if(this.masterGain) this.masterGain.gain.value=this.muted?0:CONFIG.MASTER_VOLUME; }

    _osc(type,freq,dur,gain=0.3) {
        if(!this.initialized) return;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type=type; o.frequency.value=freq; g.gain.value=gain;
        o.connect(g); g.connect(this.sfxGain);
        const n=this.ctx.currentTime;
        g.gain.setValueAtTime(gain,n); g.gain.exponentialRampToValueAtTime(0.001,n+dur);
        o.start(n); o.stop(n+dur);
    }

    _noise(dur,gain=0.1) {
        if(!this.initialized) return null;
        const sz=this.ctx.sampleRate*dur,buf=this.ctx.createBuffer(1,sz,this.ctx.sampleRate),d=buf.getChannelData(0);
        for(let i=0;i<sz;i++) d[i]=Math.random()*2-1;
        const s=this.ctx.createBufferSource(); s.buffer=buf;
        const g=this.ctx.createGain(); g.gain.value=gain;
        const f=this.ctx.createBiquadFilter(); f.type='bandpass';
        s.connect(f); f.connect(g); g.connect(this.sfxGain);
        return {source:s,gain:g,filter:f};
    }

    // --- Engine Sound ---
    startEngine() {
        if(!this.initialized||this.engineRunning) return;
        this.engineRunning=true;
        // Main engine oscillator (low frequency hum)
        this.engineOsc=this.ctx.createOscillator();
        this.engineOsc.type='triangle';
        this.engineOsc.frequency.value=80;
        this.engineGain=this.ctx.createGain();
        this.engineGain.gain.value=0.05;
        // Sub bass
        this.engineSub=this.ctx.createOscillator();
        this.engineSub.type='sine';
        this.engineSub.frequency.value=40;
        this.engineSubGain=this.ctx.createGain();
        this.engineSubGain.gain.value=0.03;
        // Filter for warmth
        const filter=this.ctx.createBiquadFilter();
        filter.type='lowpass'; filter.frequency.value=200;
        this.engineOsc.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);
        this.engineSub.connect(this.engineSubGain);
        this.engineSubGain.connect(this.sfxGain);
        this.engineOsc.start();
        this.engineSub.start();
    }

    updateEngine(speed, boosting) {
        if(!this.engineRunning) return;
        const speedNorm = clamp(speed/CONFIG.DRONE_SPEED, 0, 2);
        const freq = 60 + speedNorm * 80;
        const gain = 0.03 + speedNorm * 0.04;
        if(this.engineOsc) {
            this.engineOsc.frequency.linearRampToValueAtTime(
                boosting ? freq*1.5 : freq,
                this.ctx.currentTime+0.1
            );
        }
        if(this.engineGain) {
            this.engineGain.gain.linearRampToValueAtTime(
                boosting ? gain*2 : gain,
                this.ctx.currentTime+0.1
            );
        }
        if(this.engineSub) {
            this.engineSub.frequency.linearRampToValueAtTime(30+speedNorm*30, this.ctx.currentTime+0.1);
        }
    }

    stopEngine() {
        if(!this.engineRunning) return;
        this.engineRunning=false;
        try {
            if(this.engineOsc) { this.engineOsc.stop(); this.engineOsc=null; }
            if(this.engineSub) { this.engineSub.stop(); this.engineSub=null; }
        } catch(e){}
    }

    // --- SFX ---
    playPickup() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        [523,659,784].forEach((freq,i) => {
            const o=this.ctx.createOscillator(), g=this.ctx.createGain();
            o.type='sine'; o.frequency.value=freq; o.connect(g); g.connect(this.sfxGain);
            const t=n+i*0.05;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.2,t+0.02);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
            o.start(t); o.stop(t+0.2);
        });
    }

    playDelivery() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        [523,659,784,1047].forEach((f,i) => {
            const o=this.ctx.createOscillator(), g=this.ctx.createGain();
            o.type='sine'; o.frequency.value=f; o.connect(g); g.connect(this.sfxGain);
            const t=n+i*0.08;
            g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.25,t+0.02);
            g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
            o.start(t); o.stop(t+0.3);
        });
    }

    playCoin() { this._osc('square',440,0.06,0.08); setTimeout(()=>this._osc('square',550,0.04,0.06),30); }

    playDamage() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sawtooth'; o.frequency.setValueAtTime(200,n);
        o.frequency.exponentialRampToValueAtTime(50,n+0.3);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.3,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.3);
        o.start(n); o.stop(n+0.35);
        // Static burst
        const ns=this._noise(0.15,0.12);
        if(ns) { ns.filter.type='highpass'; ns.filter.frequency.value=3000;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            ns.source.start(n); ns.source.stop(n+0.15);
        }
    }

    playBoost() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sine'; o.frequency.setValueAtTime(400,n);
        o.frequency.exponentialRampToValueAtTime(150,n+0.15);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.15,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.2);
        o.start(n); o.stop(n+0.2);
    }

    // --- NEW FPS SOUNDS ---
    playProjectileNearby() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        // Doppler whoosh
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sine';
        o.frequency.setValueAtTime(600,n);
        o.frequency.exponentialRampToValueAtTime(200,n+0.2);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.12,n);
        g.gain.exponentialRampToValueAtTime(0.001,n+0.25);
        o.start(n); o.stop(n+0.3);
        // Noise component
        const ns=this._noise(0.15,0.06);
        if(ns) { ns.filter.type='bandpass'; ns.filter.frequency.value=2000;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            ns.source.start(n); ns.source.stop(n+0.15);
        }
    }

    playBarrelRoll() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sine';
        o.frequency.setValueAtTime(300,n);
        o.frequency.linearRampToValueAtTime(500,n+0.2);
        o.frequency.linearRampToValueAtTime(300,n+0.4);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.15,n);
        g.gain.exponentialRampToValueAtTime(0.001,n+0.45);
        o.start(n); o.stop(n+0.5);
        // Wind
        const ns=this._noise(0.35,0.08);
        if(ns) { ns.filter.type='bandpass'; ns.filter.frequency.value=1500;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            ns.source.start(n); ns.source.stop(n+0.35);
        }
    }

    playEMPActivate() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        // Electric charge up
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sawtooth';
        o.frequency.setValueAtTime(100,n);
        o.frequency.exponentialRampToValueAtTime(2000,n+0.15);
        o.frequency.exponentialRampToValueAtTime(300,n+0.4);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.2,n);
        g.gain.exponentialRampToValueAtTime(0.001,n+0.5);
        o.start(n); o.stop(n+0.5);
        // Crackle
        const ns=this._noise(0.3,0.15);
        if(ns) { ns.filter.type='highpass'; ns.filter.frequency.value=4000;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            ns.source.start(n); ns.source.stop(n+0.3);
        }
    }

    playShieldHit() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='square'; o.frequency.value=800;
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.1,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.1);
        o.start(n); o.stop(n+0.12);
    }

    playEnemyAlert() {
        if(!this.initialized) return;
        this._osc('square',880,0.08,0.06);
        setTimeout(()=>this._osc('square',880,0.08,0.06),120);
    }

    playTurretFire() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        const ns=this._noise(0.06,0.15);
        if(ns) { ns.filter.type='bandpass'; ns.filter.frequency.value=3000;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            ns.source.start(n); ns.source.stop(n+0.06);
        }
        this._osc('sine',100,0.05,0.1);
    }

    playWind(intensity) {
        if(!this.initialized) return;
        const ns=this._noise(0.3,0.02*intensity);
        if(ns) { ns.filter.type='lowpass'; ns.filter.frequency.value=800;
            ns.gain.disconnect(); ns.gain.connect(this.sfxGain);
            const n=this.ctx.currentTime;
            ns.source.start(n); ns.source.stop(n+0.3);
        }
    }

    // --- Existing ---
    playRushActivate() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime, o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type='sawtooth'; o.frequency.setValueAtTime(80,n);
        o.frequency.exponentialRampToValueAtTime(800,n+0.4);
        o.connect(g); g.connect(this.sfxGain);
        g.gain.setValueAtTime(0.3,n); g.gain.exponentialRampToValueAtTime(0.001,n+0.8);
        o.start(n); o.stop(n+0.8);
    }
    playRushEnd() { this._osc('sine',500,0.4,0.12); }
    playCombo(lvl) { this._osc('sine',Math.min(440+lvl*80,1200),0.1,0.12); }
    playMenuSelect() { this._osc('sine',660,0.06,0.1); setTimeout(()=>this._osc('sine',880,0.04,0.08),40); }
    playMenuConfirm() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        [440,554,659].forEach((f,i) => {
            const o=this.ctx.createOscillator(), g=this.ctx.createGain();
            o.type='sine'; o.frequency.value=f; o.connect(g); g.connect(this.sfxGain);
            const t=n+i*0.08;
            g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
            o.start(t); o.stop(t+0.25);
        });
    }
    playGameOver() {
        if(!this.initialized) return;
        const n=this.ctx.currentTime;
        [440,370,311,220].forEach((f,i) => {
            const o=this.ctx.createOscillator(), g=this.ctx.createGain();
            o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(this.sfxGain);
            const t=n+i*0.25;
            g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
            o.start(t); o.stop(t+0.45);
        });
    }

    // --- Music ---
    startMusic() {
        if(!this.initialized||this.musicPlaying) return;
        this.musicPlaying=true; this.beatIndex=0; this._musicLoop();
    }
    _musicLoop() {
        if(!this.musicPlaying||!this.initialized) return;
        const bpm=130*this.musicTempo, beatDur=60/bpm;
        const bassNotes=[65,65,82,65,87,65,82,73];
        const bn=bassNotes[this.beatIndex%bassNotes.length];
        const n=this.ctx.currentTime;
        const b=this.ctx.createOscillator(), bg=this.ctx.createGain();
        b.type='triangle'; b.frequency.value=bn; b.connect(bg); bg.connect(this.musicGain);
        bg.gain.setValueAtTime(0.18,n); bg.gain.exponentialRampToValueAtTime(0.001,n+beatDur*0.8);
        b.start(n); b.stop(n+beatDur);
        if(this.beatIndex%2===0) {
            const ns=this._noise(0.04,0.025);
            if(ns) { ns.filter.type='highpass'; ns.filter.frequency.value=9000;
                ns.gain.disconnect(); ns.gain.connect(this.musicGain);
                ns.source.start(n); ns.source.stop(n+0.04);
            }
        }
        if(this.beatIndex%4===0) {
            [262,330,392,523].forEach((f,i) => {
                const o=this.ctx.createOscillator(), g=this.ctx.createGain();
                o.type='sine'; o.frequency.value=f; o.connect(g); g.connect(this.musicGain);
                const t=n+i*beatDur*0.25;
                g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+beatDur*0.3);
                o.start(t); o.stop(t+beatDur*0.35);
            });
        }
        if(this.beatIndex%4===0) {
            const k=this.ctx.createOscillator(), kg=this.ctx.createGain();
            k.type='sine'; k.frequency.setValueAtTime(140,n);
            k.frequency.exponentialRampToValueAtTime(30,n+0.15);
            k.connect(kg); kg.connect(this.musicGain);
            kg.gain.setValueAtTime(0.28,n); kg.gain.exponentialRampToValueAtTime(0.001,n+0.2);
            k.start(n); k.stop(n+0.2);
        }
        this.beatIndex++;
        this.musicInterval=setTimeout(()=>this._musicLoop(), beatDur*1000);
    }
    stopMusic() { this.musicPlaying=false; if(this.musicInterval){clearTimeout(this.musicInterval);this.musicInterval=null;} }
    setMusicTempo(t) { this.musicTempo=t; }

    // --- Race MP3 Music ---
    startRaceMusic() {
        if(!this.initialized) return;
        this.stopMusic(); // Stop procedural music
        this.stopRaceMusic(); // Stop any previous race music
        this.raceMusicPlaying=true;
        // Pick a random starting track
        this.currentTrackIndex=Math.floor(Math.random()*this.raceTracks.length);
        this._playNextRaceTrack();
    }

    _playNextRaceTrack() {
        if(!this.raceMusicPlaying||!this.initialized) return;
        try {
            // Cleanup previous
            if(this.raceAudio) {
                this.raceAudio.pause();
                this.raceAudio.removeAttribute('src');
                this.raceAudio.load();
            }
            if(this.raceSource) {
                try { this.raceSource.disconnect(); } catch(e){}
                this.raceSource=null;
            }

            // Create new audio element
            this.raceAudio=new Audio(this.raceTracks[this.currentTrackIndex]);
            this.raceAudio.crossOrigin='anonymous';
            this.raceAudio.volume=1;

            // Connect to Web Audio graph for volume control
            this.raceSource=this.ctx.createMediaElementSource(this.raceAudio);
            this.raceSource.connect(this.musicGain);

            // When track ends, play a random different one
            this.raceAudio.addEventListener('ended',()=>{
                if(this.raceTracks.length>1) {
                    let next;
                    do { next=Math.floor(Math.random()*this.raceTracks.length); }
                    while(next===this.currentTrackIndex);
                    this.currentTrackIndex=next;
                } else {
                    this.currentTrackIndex=0;
                }
                this._playNextRaceTrack();
            });

            this.raceAudio.play().catch(e=>console.warn('Race music play failed:',e));
        } catch(e) {
            console.warn('Race music error:',e);
        }
    }

    stopRaceMusic() {
        this.raceMusicPlaying=false;
        if(this.raceAudio) {
            try {
                this.raceAudio.pause();
                this.raceAudio.currentTime=0;
            } catch(e){}
            this.raceAudio=null;
        }
        if(this.raceSource) {
            try { this.raceSource.disconnect(); } catch(e){}
            this.raceSource=null;
        }
    }

    pauseRaceMusic() {
        if(this.raceAudio&&this.raceMusicPlaying) {
            try { this.raceAudio.pause(); } catch(e){}
        }
    }

    resumeRaceMusic() {
        if(this.raceAudio&&this.raceMusicPlaying) {
            try { this.raceAudio.play().catch(e=>{}); } catch(e){}
        }
    }
}
