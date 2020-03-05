// Buttons
const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { Menu, dialog } = remote;

const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
startBtn.onclick = (e) => {
  mediaRecorder.start();
  startBtn.classList.add('bg-red');
  startBtn.innerText = 'Recording';
};

const stopBtn = document.getElementById('stopBtn');
stopBtn.onclick = (e) => {
  mediaRecorder.stop();
  startBtn.classList.remove('bg-red');
  startBtn.innerText = 'Start';
};
const videoSelectionBtn = document.getElementById('videoSelectionBtn');
videoSelectionBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

// MediaRecorder instance to capture footage
let mediaRecorder;
const recordedChunks = [];

// Change the VideoSource window to record
async function selectSource(source) {
  videoSelectionBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a video stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  //Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// Captures all recorder chunks
function handleDataAvailable(e) {
  console.log('💽 Video data available');
  recordedChunks.push(e.data);
}

// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vq9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  if (filePath) {
    writeFile(filePath, buffer, () =>
      console.log('✅ Video save successfully')
    );
  }
}
