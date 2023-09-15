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

  updatePauseState() {
    if (this.video.paused || this.video.ended) {
      this.playbackBtnsImg[0].classList.remove("hidden");
      this.playbackBtnsImg[1].classList.add("hidden");
      this.playBtnOverlayIcon.classList.remove("hidden");
      this.pauseOverlay.classList.remove("hidden");
    } else {
      this.playbackBtnsImg[0].classList.add("hidden");
      this.playbackBtnsImg[1].classList.remove("hidden");
      this.playBtnOverlayIcon.classList.add("hidden");
      this.pauseOverlay.classList.add("hidden");
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

  async togglePiP() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        if (this.video.requestPictureInPicture) {
          await this.video.requestPictureInPicture();
        } else {
          console.log("PiP not supported");
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  toggleShowSettings() {
    if (this.settingsMenu.classList.contains("openMenu")) {
      this.settingsMenu.classList.remove("openMenu");
    } else {
      this.settingsMenu.classList.add("openMenu");
    }
  }

  // bindHotkeys(e) {
  //   console.log(e.code);
  // }

  updateSettingsUI(e) {
    this.listMainWrapper.classList.remove("inView");
    this.listSecondaryWrapper.classList.remove("inView", "outOfView");
    this.listTertiaryWrapper.classList.remove("inView", "outOfView");
    this.listMainWrapper.classList.add("outOfView");

    if (e.target === this.settingsPlaybackBtn) {
      this.listSecondaryWrapper.classList.add("inView");
      //   temporary
      this.settingsMenu.style.height = "170px";
    } else if (e.target === this.settingsQualityBtn) {
      this.listTertiaryWrapper.classList.add("inView");
    }
  }

  updatePlaybackRate(e) {
    const rate = parseFloat(e.target.getAttribute("data-rate"));
    if (!isNaN(rate)) {
      this.video.playbackRate = rate;
      if (this.video.playbackRate === 1) {
        this.playbackRateLabel.textContent = `Normal`;
      } else {
        this.playbackRateLabel.textContent = `${rate}x`;
      }
    } else {
      console.log(`Invalid playback rate: ${rate}`);
    }
  }
  //might need to even toggle z-index of lists for when
  handleBackButtonClick() {
    this.listMainWrapper.classList.remove("outOfView");
    this.listSecondaryWrapper.classList.remove("inView");
    this.listTertiaryWrapper.classList.remove("inView");

    this.listMainWrapper.classList.add("inView");
    this.listSecondaryWrapper.classList.add("outOfView");
    this.listTertiaryWrapper.classList.add("outOfView");
    // temporary
    this.settingsMenu.style.height = "91px";
  }

  toggleFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this.videoContainer.requestFullscreen();
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
    this.playBtnOverlayIcon = this.shadowRoot.querySelector(
      ".play--btn__wrapper img"
    );
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

    this.pauseOverlay = this.shadowRoot.querySelector(".play--btn__overlay");
    this.overlayPlaybtn = this.shadowRoot.querySelector(
      ".play--btn__wrapper img"
    );

    // settings

    this.settingsMenu = this.shadowRoot.querySelector(".settings--menu");
    this.settingsBtn = this.shadowRoot.querySelector(".settings-btn");

    this.settingsPlaybackBtn =
      this.shadowRoot.querySelector(".btn--playbackRate");

    this.listMainWrapper = this.shadowRoot.querySelector(
      ".list--main__wrapper"
    );

    this.listSecondaryWrapper = this.shadowRoot.querySelector(
      ".list--secondary__wrapper"
    );
    this.listTertiaryWrapper = this.shadowRoot.querySelector(
      ".list--tertiary__wrapper"
    );

    this.settingsQualityBtn = this.shadowRoot.querySelector(".btn--quality");

    this.listBackBtns = this.shadowRoot.querySelectorAll(".list--backBtn");

    this.playbackRateButtons = this.shadowRoot.querySelectorAll("[data-rate]");
    this.playbackRateLabel =
      this.shadowRoot.querySelector("#playbackRateLabel");

    // video works
    const videoWorks = !!document.createElement("video").canPlayType;

    if (videoWorks) {
      this.video.controls = false;
      this.videoControls.classList.remove("hidden");
    } else {
      console.warn("HTML5 Video not supported by this browser");
    }

    this.video.addEventListener("ended", () => {
      this.updatePauseState();
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
      this.updatePauseState();
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

    this.boundTogglePiPHandler = () => {
      this.togglePiP();
    };

    this.boundUpdateSettingsUIHandler = (e) => {
      this.updateSettingsUI(e);
    };

    this.boundHandleBackBtn = () => {
      this.handleBackButtonClick();
    };

    this.boundPlaybackRateHandler = (e) => {
      this.updatePlaybackRate(e);
    };

    this.boundToggleShowSettings = () => {
      this.toggleShowSettings();
    };

    window.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "Space":
          e.preventDefault();
          this.togglePlay();
          this.updatePauseState();
          break;
        case "KeyM":
          this.toggleMute();
          break;
        case "Escape":
          e.preventDefault();
          if (document.fullscreenElement) {
            document.exitFullscreen();
            this.videoControls.style.height = "15%";
            this.pauseOverlay.style.height = "86%";
          }
      }
    });

    this.video.addEventListener("loadedmetadata", this.initializeVideo);
    // playback
    this.playbackBtn.addEventListener("click", this.boundPlaybackHandler);
    this.pauseOverlay.addEventListener("click", this.boundPlaybackHandler);
    this.video.addEventListener("click", this.boundPlaybackHandler);
    this.overlayPlaybtn.addEventListener("click", this.boundPlaybackHandler);

    // volume
    this.volumeInput.addEventListener("change", this.boundVolumeHandler);
    this.volumeBtn.addEventListener("click", this.boundMuteHandler);
    this.video.addEventListener("timeupdate", this.boundTimeUpdateHandler);
    this.fullScreenBtn.addEventListener("click", this.boundFullScreenHandler);
    this.seek.addEventListener("input", this.boundSkipAheadHandler);
    this.seek.addEventListener("mousemove", this.boundUpdateSeekTooltip);
    this.rewindBtn.addEventListener("click", this.boundRewindTenSecondsHandler);

    // PiP
    this.pip.addEventListener("click", this.boundTogglePiPHandler);

    this.settingsPlaybackBtn.addEventListener(
      "click",
      this.boundUpdateSettingsUIHandler
    );
    this.settingsQualityBtn.addEventListener(
      "click",
      this.boundUpdateSettingsUIHandler
    );

    this.listBackBtns.forEach((btn) => {
      btn.addEventListener("click", this.boundHandleBackBtn);
    });

    this.playbackRateButtons.forEach((btn) => {
      btn.addEventListener("click", this.boundPlaybackRateHandler);
    });

    this.settingsBtn.addEventListener("click", this.boundToggleShowSettings);

    // override default behaviour
    document.addEventListener("fullscreenchange", () => {
      // console.log(e);
      this.toggleFullScreenBtn();
      if (document.fullscreenElement) {
        this.videoControls.classList.add("fullScreenActive");
        this.videoControls.style.height = "7%";
        this.pauseOverlay.style.height = "91%";
      } else {
        this.videoControls.classList.remove("fullScreenActive");
        this.videoControls.style.height = "15%";
        this.pauseOverlay.style.height = "87%";
      }
    });
  }

  //   to prevent memory leaks
  disconnectedCallback() {
    this.video.removeEventListener("loadedmetadata", this.initializeVideo);
    this.playbackBtn.removeEventListener("click", this.boundPlaybackHandler);
    this.pauseOverlay.removeEventListener("click", this.boundPlaybackHandler);
    this.video.removeEventListener("click", this.boundPlaybackHandler);
    this.overlayPlaybtn.removeEventListener("click", this.boundPlaybackHandler);
    this.volumeInput.removeEventListener("change", this.boundVolumeHandler);
    this.volumeBtn.removeEventListener("click", this.boundMuteHandler);
    this.video.removeEventListener("timeupdate", this.boundTimeUpdateHandler);
    this.fullScreenBtn.addEventListener("click", this.boundFullScreenHandler);
    this.seek.removeEventListener("input", this.boundSkipAheadHandler);
    this.seek.removeEventListener("mousemove", this.boundUpdateSeekTooltip);
    this.rewindBtn.removeEventListener(
      "click",
      this.boundRewindTenSecondsHandler
    );
    this.pip.removeEventListener("click", this.boundTogglePiPHandler);
  }

  render() {
    const template = html` <style>
        .video-player {
          border: 1px solid grey;
          width: clamp(600px, 50vw, 1200px);
          position: relative;
          aspect-ratio: 16 / 9;
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

        .video-controls {
          height: 15%;
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

        .play--btn__wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 32;
        }

        .play--btn__wrapper img {
          width: 150px;
          z-index: 33;
        }

        .play--btn__overlay {
          width: 100%;
          height: 87%;
          background-color: black;
          position: absolute;
          opacity: 0.5;
          z-index: 5;
        }

        .settings--menu {
          position: absolute;
          width: 140px;
          overflow: hidden;
          height: 88px;
          border: 1px solid black;
          background: white;
          bottom: 100px;
          right: 20px;
          transition: all 150ms ease;
          z-index: 99;
          opacity: 0;
        }

        .settings--menu.openMenu {
          animation: fadeInSlideDown 150ms ease forwards;
        }

        .list--secondary,
        .list--main,
        .list--tertiary {
          padding-inline-start: 0;
          list-style: none;
        }

        .settings--menu__inner {
          position: relative;
          height: 88px;
        }

        .list--main__wrapper,
        .list--secondary__wrapper,
        .list--tertiary__wrapper {
          position: absolute;
          width: 120px;
          padding: 10px;
        }
        .list--main__wrapper {
          background: grey;
        }
        .list--secondary__wrapper,
        .list--tertiary__wrapper {
          margin-left: 140px;
        }

        .list--secondary__wrapper {
          background: red;
          /* display: none; */
        }
        .list--tertiary__wrapper {
          background: orange;
        }

        .list--btnWrapper {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          position: absolute;
          right: 10px;
          top: 10px;
        }
        .list--backBtn {
          border: none;
          background: transparent;
          color: white;
          font-size: 18px;
          font-weight: bold;
        }

        .list--backBtn:hover {
          color: grey;
          cursor: pointer;
        }

        .btn--playbackRate {
          border: none;
          font-size: 12px;
        }

        #playbackRateLabel {
          font-size: 12px;
          margin-left: 8px;
        }

        .list--main__wrapper.outOfView,
        .list--secondary__wrapper.inView,
        .list--tertiary__wrapper.inView {
          animation: slideSettingsLeft 0.25s ease;
          animation-fill-mode: forwards;
        }

        .list--main__wrapper.inView,
        .list--secondary__wrapper.outOfView,
        .list--tertiary__wrapper.outOfView {
          animation: slideSettingsRight 0.25s ease;
          animation-fill-mode: forwards;
        }
        .playbackRate--wrapper {
          display: flex;
        }

        /* ANIMATIONS */

        @keyframes slideSettingsLeft {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-140px);
          }
        }
        @keyframes slideSettingsRight {
          from {
            transform: translateX(-140px);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes slideSettingsRight {
          from {
            transform: translateX(-140px);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes fadeInSlideDown {
          from {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            visibility: visible;
            pointer-events: all;
            transform: translateY(0px);
          }
        }
      </style>
      <div class="video-player">
        <div class="play--btn__overlay hidden"></div>
        <div class="play--btn__wrapper">
          <img src="./assets/play-btn.svg" class="hidden" />
        </div>

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
              </div>
              <div class="bottom-controls--right">
                <!-- Settings button -->
                <div class="settings">
                  <button data-title="Settings (s)" class="settings-btn">
                    <img src="./assets/settings.svg" />
                  </button>

                  <div class="settings--menu">
                    <div class="settings--menu__inner">
                      <div class="list--main__wrapper">
                        <ul class="list--main">
                          <div class="playbackRate--wrapper">
                            <button
                              name="playbackRate--btn"
                              class="btn--playbackRate"
                            >
                              Playback rate
                            </button>
                            <label
                              for="playbackRate--btn"
                              id="playbackRateLabel"
                              >Normal</label
                            >
                          </div>
                          <button class="btn--quality">Quality</button>
                        </ul>
                      </div>

                      <div class="list--secondary__wrapper">
                        <div class="list--btnWrapper">
                          <button class="list--backBtn">&lt;</button>
                        </div>

                        <ul class="list--secondary">
                          <li><button data-rate="2">2</button></li>
                          <li><button data-rate="1.75">1.75</button></li>
                          <li><button data-rate="1.5">1.5</button></li>
                          <li><button data-rate="1">Normal</button></li>
                          <li><button data-rate="0.75">0.75</button></li>
                          <li><button data-rate="0.5">0.5</button></li>
                        </ul>
                      </div>

                      <div class="list--tertiary__wrapper">
                        <div class="list--btnWrapper">
                          <button class="list--backBtn">&lt;</button>
                        </div>
                        <ul class="list--tertiary">
                          <li><button>Option 1</button></li>
                          <li><button>Option 2</button></li>
                          <li><button>Option 2</button></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="rewind--btn__wrapper">
                  <button class="rewind--btn">
                    <img src="./assets/rewind-10.svg" />
                  </button>
                </div>
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
