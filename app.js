import { html, render } from "https://cdn.skypack.dev/lit-html";

class VideoPlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.initializeVideo = this.initializeVideo.bind(this);
  }

  togglePlay() {
    if (this.video.paused || this.video.ended) {
      this.video.play();
    } else {
      this.video.pause();
    }
  }

  updatePlaybackBtn() {
    if (this.video.paused || this.video.ended) {
      this.playbackBtnsImg[0].classList.remove("hidden");
      this.playbackBtnsImg[1].classList.add("hidden");
    } else {
      this.playbackBtnsImg[0].classList.add("hidden");
      this.playbackBtnsImg[1].classList.remove("hidden");
    }
  }

  updateVolume() {
    if (this.video.muted) {
      this.video.muted = false;
    }
    this.video.volume = this.volumeInput.value;
  }

  toggleMute() {
    this.volumeInput.value = this.video.volume === 0 ? 1 : 0;
    this.video.volume = this.volumeInput.value;
    this.updateVolumeIcons();
  }

  formatTime(seconds) {
    const result = new Date(seconds * 1000).toISOString().substr(11, 8);
    return {
      minutes: result.substr(3, 2),
      seconds: result.substr(6, 2),
    };
  }

  updateVolumeBtns() {
    this.video.volume = this.volumeInput.value;
    this.updateVolumeIcons();
  }

  updateVolumeIcons() {
    const volume = parseFloat(this.volumeInput.value);

    if (volume === 0) {
      this.volumeUpIcon.classList.add("hidden");
      this.volumeLowIcon.classList.add("hidden");
      this.volumeMutedIcon.classList.remove("hidden");
    } else if (volume > 0.5) {
      this.volumeUpIcon.classList.remove("hidden");
      this.volumeLowIcon.classList.add("hidden");
      this.volumeMutedIcon.classList.add("hidden");
    } else {
      this.volumeLowIcon.classList.remove("hidden");
      this.volumeUpIcon.classList.add("hidden");
      this.volumeMutedIcon.classList.add("hidden");
    }
  }

  updateTimeElapsed() {
    const time = this.formatTime(Math.round(this.video.currentTime));

    this.timeElapsed.innerText = `${time.minutes}:${time.seconds}`;
    this.timeElapsed.setAttribute(
      "datetime",
      `${time.minutes}m ${time.seconds}s`
    );
  }

  updateProgress() {
    this.seek.value = Math.floor(this.video.currentTime);
    this.progressBar.value = Math.floor(this.video.currentTime);
  }

  skipAhead(e) {
    const skipTo = e.target.dataset.seek
      ? parseFloat(e.target.dataset.seek)
      : parseFloat(e.target.value);
    this.video.currentTime = skipTo;
    this.progressBar.value = skipTo;
    this.seek.value = skipTo;
  }

  rewindTenSeconds() {
    console.log(this.video.currentTime);
    if (this.video.currentTime <= 10) {
      this.video.currentTime = 0;
    }

    this.video.currentTime = this.video.currentTime - 10;
  }

  updateSeekTooltip(e) {
    const seekBar = this.seek;
    const max = parseInt(seekBar.getAttribute("max"), 10);

    const ratio = e.offsetX / e.target.clientWidth;
    const skipTo = Math.round(ratio * max);

    seekBar.setAttribute("data-seek", skipTo);

    const t = this.formatTime(skipTo);
    const minutes = String(t.minutes).padStart(2, "0");
    const seconds = String(t.seconds).padStart(2, "0");

    this.seekTooltip.textContent = `${minutes}:${seconds}`;

    const rect = this.video.getBoundingClientRect();
    this.seekTooltip.style.left = `${e.pageX - rect.left}px`;
  }

  toggleFullScreenBtn() {
    this.fullscreenIcons.forEach((icon) => {
      if (icon.classList.contains("hidden")) {
        icon.classList.remove("hidden");
      } else {
        icon.classList.add("hidden");
      }
    });
  }

  toggleFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      this.videoControls.classList.remove("fullScreenActive");
    } else {
      this.videoContainer.requestFullscreen();
      this.videoControls.classList.add("fullScreenActive");
    }
  }

  resetProgressBar() {
    this.progressBar.value = 0;
    this.seek.value = 0;
  }

  initializeVideo() {
    const videoDuration = Math.round(this.video.duration);
    const time = this.formatTime(videoDuration);

    this.seek.setAttribute("max", videoDuration);
    this.progressBar.setAttribute("max", videoDuration);
    this.duration.innerText = `${time.minutes}:${time.seconds}`;
    this.duration.setAttribute("datetime", `${time.minutes}m${time.seconds}`);
  }

  initializeReferences() {
    this.video = this.shadowRoot.querySelector("video");
    this.videoControls = this.shadowRoot.querySelector(".video-controls");
    this.playbackBtn = this.shadowRoot.querySelector(".playback-btn");
    this.playbackBtnsImg =
      this.shadowRoot.querySelectorAll(".playback-btn img");
    //   volume
    this.volumeUpIcon = this.shadowRoot.querySelector(".volume--up");
    this.volumeLowIcon = this.shadowRoot.querySelector(".volume--low");
    this.volumeMutedIcon = this.shadowRoot.querySelector(".volume--muted");
    this.volumeBtn = this.shadowRoot.querySelector(".volume--btn");
    this.volumeInput = this.shadowRoot.querySelector(".volume--input");

    // progress bar
    this.progressBar = this.shadowRoot.querySelector(".progress-bar");
    this.duration = this.shadowRoot.querySelector(".duration");
    this.timeElapsed = this.shadowRoot.querySelector(".time-elapsed");
    this.seek = this.shadowRoot.querySelector(".seek");
    this.seekTooltip = this.shadowRoot.querySelector(".seek-tooltip");

    this.videoContainer = this.shadowRoot.querySelector(".video-player");
    this.fullScreenBtn = this.shadowRoot.querySelector(".fullscreen-btn");
    this.fullscreenIcons = this.shadowRoot.querySelectorAll(
      ".fullscreen-btn img"
    );

    this.pip = this.shadowRoot.querySelector(".pip-btn");
    this.rewindBtn = this.shadowRoot.querySelector(".rewind--btn");

    // video works
    const videoWorks = !!document.createElement("video").canPlayType;

    if (videoWorks) {
      this.video.controls = false;
      this.videoControls.classList.remove("hidden");
    } else {
      console.warn("HTML5 Video not supported by this browser");
    }

    this.video.addEventListener("ended", () => {
      this.updatePlaybackBtn();
      this.resetProgressBar();
    });
  }

  connectedCallback() {
    this.render();
    this.initializeReferences();

    setTimeout(() => {
      // makes sure the elements are selected before calling setupEventListeners
      this.setupEventListeners();
    }, 0);
  }

  setupEventListeners() {
    this.boundPlaybackHandler = () => {
      this.togglePlay();
      this.updatePlaybackBtn();
    };

    this.boundVolumeHandler = () => {
      this.updateVolume();
      this.updateVolumeBtns();
    };

    this.boundMuteHandler = () => {
      this.toggleMute();
    };

    this.boundTimeUpdateHandler = () => {
      this.updateTimeElapsed();
      this.updateProgress();
    };

    this.boundFullScreenHandler = () => {
      this.toggleFullScreenBtn();
      this.toggleFullScreen();
    };

    this.boundSkipAheadHandler = (e) => {
      this.skipAhead(e);
    };

    this.boundUpdateSeekTooltip = (e) => {
      this.updateSeekTooltip(e);
    };

    this.boundRewindTenSecondsHandler = () => {
      this.rewindTenSeconds();
    };

    this.video.addEventListener("loadedmetadata", this.initializeVideo);
    this.playbackBtn.addEventListener("click", this.boundPlaybackHandler);
    this.video.addEventListener("click", this.boundPlaybackHandler);
    this.volumeInput.addEventListener("change", this.boundVolumeHandler);
    this.volumeBtn.addEventListener("click", this.boundMuteHandler);
    this.video.addEventListener("timeupdate", this.boundTimeUpdateHandler);
    this.fullScreenBtn.addEventListener("click", this.boundFullScreenHandler);
    this.seek.addEventListener("input", this.boundSkipAheadHandler);
    this.seek.addEventListener("mousemove", this.boundUpdateSeekTooltip);
    this.rewindBtn.addEventListener("click", this.boundRewindTenSecondsHandler);
  }

  //   to prevent memory leaks
  disconnectedCallback() {
    this.video.removeEventListener("loadeddata", this.initializeVideo);
    this.video.removeEventListener("timeupdate", this.boundTimeUpdateHandler);
    this.playbackBtn.removeEventListener("click", this.boundPlaybackHandler);
    this.volumeInput.removeEventListener("click", this.boundVolumeHandler);
    this.volumeBtn.removeEventListener("click", this.boundMuteHandler);
  }

  render() {
    const template = html` <style>
        .video-player {
          border: 1px solid grey;
          width: clamp(600px, 50vw, 1200px);
        }

        .video-player video {
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        .hidden {
          display: none;
        }

        .bottom-controls--wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bottom-controls--left,
        .bottom-controls--right {
          display: flex;
          align-items: center;
        }

        .volume--btn img {
          max-width: 50px;
        }

        .video-progress {
          position: relative;
        }

        progress {
          appearance: none;
          z-index: -1;
          opacity: 0;
          pointer-events: none;
          position: absolute;
        }

        .seek {
          width: 98%;
          padding-left: 10px;
          cursor: pointer;
          height: 8.6px;
        }

        .seek-tooltip {
          display: none;
          position: absolute;
          top: -30px;
          left: 15px;
          margin-left: -20px;
          font-size: 12px;
          padding: 3px;
          content: attr(data-title);
          font-weight: bold;
          color: #fff;
          background-color: rgba(0, 0, 0, 0.6);
        }

        .time {
          padding: 0px 20px;
        }

        .seek:hover + .seek-tooltip {
          display: block;
        }

        .volume--controls {
          display: flex;
          align-items: center;
        }
        .video-controls.fullScreenActive {
          right: 0;
          left: 0;
          bottom: 0;
          padding: 10px;
          position: absolute;
          background: white;
        }

        .settings-btn,
        .pip-btn,
        .fullscreen-btn,
        .playback-btn,
        .volume--btn,
        .rewind--btn {
          cursor: pointer;
          position: relative;
          margin-right: 7px;
          border: none;
          outline: none;
          background-color: transparent;
        }

        .settings-btn img {
          width: 50px;
        }

        .volume--btn img {
          width: 40px;
        }

        .play,
        .rewind--btn img {
          width: 50px;
        }

        .pause {
          width: 30px;
          padding: 10px;
        }

        .fullscreen,
        .fullscreen-exit {
          width: 40px;
        }

        .pip-btn img {
          width: 55px;
        }
      </style>
      <div class="video-player">
        <video poster="${this.getAttribute("data-poster")}" preload="metadata">
          <source src="${this.getAttribute("data-video")}" type="video/mp4" />
        </video>
        <div class="video-controls hidden">
          <div class="video-progress">
            <progress
              class="progress-bar"
              value="0"
              min="0"
              max="100"
            ></progress>
            <input class="seek" value="0" min="0" type="range" step="1" />
            <div class="seek-tooltip">00:00</div>
          </div>
          <div class="bottom-controls">
            <div class="bottom-controls--wrapper">
              <div class="bottom-controls--left">
                <!-- Playback buttons -->
                <div class="playback-btns--wrapper">
                  <button data-title="Play (k)" class="playback-btn">
                    <img src="./assets/play-btn.svg" class="play" />
                    <img src="./assets/pause.png" class="pause hidden" />
                  </button>
                </div>

                <!-- Volume controls -->
                <div class="volume--controls">
                  <button class="volume--btn">
                    <img src="./assets/volume-up.svg" class="volume--up" />
                    <img
                      src="./assets/volume-low-1.png"
                      class="volume--low hidden"
                    />
                    <img
                      src="./assets/volume-off.png"
                      class="volume--muted hidden"
                    />
                  </button>

                  <input
                    class="volume--input"
                    value="1"
                    data-mute="0.5"
                    type="range"
                    max="1"
                    min="0"
                    step="0.01"
                  />
                </div>

                <!-- Time -->
                <div class="time">
                  <time class="time-elapsed">00:00</time>
                  <span> / </span>
                  <time class="duration">00:00</time>
                </div>

                <!-- Settings button -->
                <div class="settings">
                  <button data-title="Settings (s)" class="settings-btn">
                    <img src="./assets/settings.svg" />
                  </button>
                </div>

                <div class="rewind--btn__wrapper">
                  <button class="rewind--btn">
                    <img src="./assets/rewind-10.svg" />
                  </button>
                </div>
              </div>
              <div class="bottom-controls--right">
                <button data-title="PIP (p)" class="pip-btn">
                  <img src="./assets/pip.svg" alt="" />
                </button>
                <button class="fullscreen-btn" data-title="Fullscreen (f)">
                  <img
                    src="./assets/fullscreen.svg"
                    alt=""
                    class="fullscreen"
                  />
                  <img
                    src="./assets/fullscreen-exit.svg"
                    alt=""
                    class="fullscreen-exit hidden"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    render(template, this.shadowRoot);
  }
}

customElements.define("video-player", VideoPlayer);
