```javascript
const dropZone =
    document.getElementById("dropZone");

const fileInput =
    document.getElementById("fileInput");

const fileName =
    document.getElementById("fileName");

const statusText =
    document.getElementById("status");

const canvas =
    document.getElementById("visualizer");

const ctx =
    canvas.getContext("2d");

const cat =
    document.getElementById("cat");

const playButton =
    document.getElementById("play");

const stopButton =
    document.getElementById("stop");

const downloadButton =
    document.getElementById("download");


const bitDepthSlider =
    document.getElementById("bitDepth");

const retroSlider =
    document.getElementById("retro");

const downsampleSlider =
    document.getElementById("downsample");

const pitchSlider =
    document.getElementById("pitch");


const bitValue =
    document.getElementById("bitValue");

const retroValue =
    document.getElementById("retroValue");

const downsampleValue =
    document.getElementById("downsampleValue");

const pitchValue =
    document.getElementById("pitchValue");


let audioContext = null;

let originalBuffer = null;

let processedBuffer = null;

let currentSource = null;

let wavBlob = null;

let analyser = null;

let animationID = null;


/* =========================
   CAT
========================= */

const cats = [

` /\\_/\\\\
( o.o )
 > ^ <`,

` /\\_/\\\\
( -.- )
 > ^ <`,

` /\\_/\\\\
( o.o )
 > ^ <`,

` /\\_/\\\\
( ^.^ )
 > ^ <`

];

let catFrame = 0;


/* =========================
   FILE INPUT
========================= */

dropZone.addEventListener(
    "click",
    () => fileInput.click()
);


fileInput.addEventListener(
    "change",
    () => {

        if (fileInput.files.length) {

            loadAudio(
                fileInput.files[0]
            );

        }

    }
);


/* =========================
   DRAG & DROP
========================= */

dropZone.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        dropZone.classList.add(
            "drag"
        );

    }
);


dropZone.addEventListener(
    "dragleave",
    () => {

        dropZone.classList.remove(
            "drag"
        );

    }
);


dropZone.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        dropZone.classList.remove(
            "drag"
        );


        const file =
            event.dataTransfer.files[0];


        if (file) {

            loadAudio(file);

        }

    }
);


/* =========================
   LOAD AUDIO
========================= */

async function loadAudio(file) {

    if (
        !file.type.startsWith(
            "audio/"
        )
    ) {

        alert(
            "Please select an MP3, WAV, or another audio file."
        );

        return;
    }


    try {

        statusText.textContent =
            "LOADING FILE...";


        fileName.textContent =
            file.name;


        if (!audioContext) {

            audioContext =
                new AudioContext();

        }


        const data =
            await file.arrayBuffer();


        originalBuffer =
            await audioContext.decodeAudioData(
                data
            );


        statusText.textContent =
            "CREATING 8-BIT VERSION...";


        processAudio();


        playButton.disabled =
            false;

        stopButton.disabled =
            false;

        downloadButton.disabled =
            false;


        statusText.textContent =
            "READY!";

    }


    catch (error) {

        console.error(error);


        statusText.textContent =
            "LOADING ERROR.";


        alert(
            "Could not open this audio file."
        );

    }
}


/* =========================
   PROCESS AUDIO
========================= */

function processAudio() {

    const channels =
        originalBuffer.numberOfChannels;

    const length =
        originalBuffer.length;

    const sampleRate =
        originalBuffer.sampleRate;


    processedBuffer =
        audioContext.createBuffer(
            channels,
            length,
            sampleRate
        );


    const bits =
        Number(
            bitDepthSlider.value
        );


    const retro =
        Number(
            retroSlider.value
        ) / 100;


    const downsample =
        Number(
            downsampleSlider.value
        );


    const levels =
        Math.pow(
            2,
            bits
        );


    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        const input =
            originalBuffer.getChannelData(
                channel
            );


        const output =
            processedBuffer.getChannelData(
                channel
            );


        let heldSample = 0;


        for (
            let i = 0;
            i < length;
            i++
        ) {

            if (
                i % downsample === 0
            ) {

                heldSample =
                    input[i];

            }


            let sample =
                heldSample;


            const quantized =
                Math.round(
                    (
                        (sample + 1) / 2
                    )
                    *
                    (levels - 1)
                )
                /
                (levels - 1);


            const eightBit =
                quantized * 2 - 1;


            sample =
                sample * (1 - retro)
                +
                eightBit * retro;


            output[i] =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        sample
                    )
                );

        }

    }


    drawWave(
        processedBuffer
    );


    wavBlob =
        encodeWAV(
            processedBuffer
        );
}


/* =========================
   DRAW WAVE
========================= */

function drawWave(buffer) {

    canvas.width = 1200;

    canvas.height = 300;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const data =
        buffer.getChannelData(0);


    const center =
        canvas.height / 2;


    ctx.beginPath();

    ctx.moveTo(
        0,
        center
    );

    ctx.lineTo(
        canvas.width,
        center
    );


    ctx.strokeStyle =
        "#333";

    ctx.lineWidth = 1;

    ctx.stroke();


    ctx.beginPath();


    const step =
        Math.max(
            1,
            Math.floor(
                data.length /
                canvas.width
            )
        );


    for (
        let x = 0;
        x < canvas.width;
        x++
    ) {

        const index =
            x * step;


        if (
            index >= data.length
        ) {

            break;

        }


        const y =
            center -
            data[index] * 110;


        if (x === 0) {

            ctx.moveTo(
                x,
                y
            );

        }

        else {

            ctx.lineTo(
                x,
                y
            );

        }

    }


    ctx.strokeStyle =
        "#00ff88";

    ctx.lineWidth = 2;

    ctx.stroke();
}


/* =========================
   LIVE VISUALIZER
========================= */

function startVisualizer() {

    if (!analyser) {

        analyser =
            audioContext.createAnalyser();


        analyser.fftSize =
            1024;

    }


    const data =
        new Uint8Array(
            analyser.fftSize
        );


    function animate() {

        animationID =
            requestAnimationFrame(
                animate
            );


        analyser.getByteTimeDomainData(
            data
        );


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.fillStyle =
            "#050505";


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.beginPath();


        ctx.moveTo(
            0,
            canvas.height / 2
        );


        ctx.lineTo(
            canvas.width,
            canvas.height / 2
        );


        ctx.strokeStyle =
            "#333";


        ctx.stroke();


        ctx.beginPath();


        const slice =
            canvas.width /
            data.length;


        for (
            let i = 0;
            i < data.length;
            i++
        ) {

            const value =
                data[i] / 128.0;


            const y =
                value *
                canvas.height / 2;


            const x =
                i * slice;


            if (i === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            }

            else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }


        ctx.strokeStyle =
            "#00ff88";

        ctx.lineWidth = 3;

        ctx.stroke();


        animateCat(data);
    }


    animate();
}


/* =========================
   CAT MOVEMENT
========================= */

function animateCat(data) {

    let total = 0;


    for (
        let i = 0;
        i < data.length;
        i++
    ) {

        const value =
            (
                data[i] - 128
            ) / 128;


        total +=
            Math.abs(value);

    }


    const volume =
        total / data.length;


    const movement =
        Math.min(
            18,
            volume * 70
        );


    const direction =
        Math.sin(
            performance.now() / 180
        );


    cat.style.transform =
        `
        translateX(
            ${direction * movement}px
        )
        rotate(
            ${direction * movement * 0.25}deg
        )
        `;


    if (
        Math.abs(direction) > 0.45
    ) {

        catFrame =
            direction > 0
                ? 1
                : 3;

    }

    else {

        catFrame = 0;

    }


    cat.textContent =
        cats[catFrame];
}


/* =========================
   PLAY
========================= */

playButton.addEventListener(
    "click",
    async () => {

        if (!processedBuffer) {

            return;

        }


        await audioContext.resume();


        if (currentSource) {

            try {

                currentSource.stop();

            }

            catch {}

        }


        currentSource =
            audioContext.createBufferSource();


        currentSource.buffer =
            processedBuffer;


        const pitch =
            Number(
                pitchSlider.value
            );


        currentSource.playbackRate.value =
            Math.pow(
                2,
                pitch / 12
            );


        if (!analyser) {

            analyser =
                audioContext.createAnalyser();


            analyser.fftSize =
                1024;

        }


        currentSource.connect(
            analyser
        );


        analyser.connect(
            audioContext.destination
        );


        currentSource.onended =
            () => {

                currentSource =
                    null;


                cancelAnimationFrame(
                    animationID
                );


                statusText.textContent =
                    "FINISHED.";

            };


        currentSource.start();


        statusText.textContent =
            "▶ PLAYING 8-BIT VERSION";


        startVisualizer();

    }
);


/* =========================
   STOP
========================= */

stopButton.addEventListener(
    "click",
    () => {

        if (currentSource) {

            try {

                currentSource.stop();

            }

            catch {}

            currentSource =
                null;

        }


        cancelAnimationFrame(
            animationID
        );


        statusText.textContent =
            "■ STOPPED";


        cat.style.transform =
            "translateX(0) rotate(0deg)";

    }
);


/* =========================
   PITCH
========================= */

pitchSlider.addEventListener(
    "input",
    () => {

        const value =
            Number(
                pitchSlider.value
            );


        if (value > 0) {

            pitchValue.textContent =
                "+" +
                value +
                " SEMITONES";

        }

        else {

            pitchValue.textContent =
                value +
                " SEMITONES";

        }


        if (currentSource) {

            currentSource.playbackRate.value =
                Math.pow(
                    2,
                    value / 12
                );

        }

    }
);


/* =========================
   OTHER SETTINGS
========================= */

bitDepthSlider.addEventListener(
    "input",
    () => {

        bitValue.textContent =
            bitDepthSlider.value +
            " BIT";


        if (originalBuffer) {

            processAudio();

        }

    }
);


retroSlider.addEventListener(
    "input",
    () => {

        retroValue.textContent =
            retroSlider.value +
            "%";


        if (originalBuffer) {

            processAudio();

        }

    }
);


downsampleSlider.addEventListener(
    "input",
    () => {

        downsampleValue.textContent =
            downsampleSlider.value +
            "X";


        if (originalBuffer) {

            processAudio();

        }

    }
);


/* =========================
   DOWNLOAD
========================= */

downloadButton.addEventListener(
    "click",
    () => {

        if (!wavBlob) {

            return;

        }


        const url =
            URL.createObjectURL(
                wavBlob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href = url;

        link.download =
            "8bit_music.wav";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


        setTimeout(
            () =>
                URL.revokeObjectURL(url),
            1000
        );

    }
);


/* =========================
   WAV ENCODER
========================= */

function encodeWAV(buffer) {

    const channels =
        buffer.numberOfChannels;


    const sampleRate =
        buffer.sampleRate;


    const bits = 16;


    const blockAlign =
        channels *
        bits /
        8;


    const byteRate =
        sampleRate *
        blockAlign;


    const dataSize =
        buffer.length *
        blockAlign;


    const arrayBuffer =
        new ArrayBuffer(
            44 + dataSize
        );


    const view =
        new DataView(
            arrayBuffer
        );


    function writeString(
        offset,
        text
    ) {

        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            view.setUint8(
                offset + i,
                text.charCodeAt(i)
            );

        }

    }


    writeString(
        0,
        "RIFF"
    );


    view.setUint32(
        4,
        36 + dataSize,
        true
    );


    writeString(
        8,
        "WAVE"
    );


    writeString(
        12,
        "fmt "
    );


    view.setUint32(
        16,
        16,
        true
    );


    view.setUint16(
        20,
        1,
        true
    );


    view.setUint16(
        22,
        channels,
        true
    );


    view.setUint32(
        24,
        sampleRate,
        true
    );


    view.setUint32(
        28,
        byteRate,
        true
    );


    view.setUint16(
        32,
        blockAlign,
        true
    );


    view.setUint16(
        34,
        bits,
        true
    );


    writeString(
        36,
        "data"
    );


    view.setUint32(
        40,
        dataSize,
        true
    );


    const channelData = [];


    for (
        let channel = 0;
        channel < channels;
        channel++
    ) {

        channelData.push(
            buffer.getChannelData(
                channel
            )
        );

    }


    let offset = 44;


    for (
        let i = 0;
        i < buffer.length;
        i++
    ) {

        for (
            let channel = 0;
            channel < channels;
            channel++
        ) {

            let sample =
                channelData[
                    channel
                ][i];


            sample =
                Math.max(
                    -1,
                    Math.min(
                        1,
                        sample
                    )
                );


            const value =
                sample < 0
                    ? sample * 32768
                    : sample * 32767;


            view.setInt16(
                offset,
                value,
                true
            );


            offset += 2;

        }

    }


    return new Blob(
        [arrayBuffer],
        {
            type:
                "audio/wav"
        }
    );
}
```
