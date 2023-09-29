import { html, render } from "https://cdn.skypack.dev/lit-html";

export default class VideoPlayer extends HTMLElement {
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

  updateSettingsUI(e) {
    this.listMainWrapper.classList.remove("inView");
    this.listSecondaryWrapper.classList.remove("inView", "outOfView");
    this.listTertiaryWrapper.classList.remove("inView", "outOfView");
    this.listMainWrapper.classList.add("outOfView");

    if (e.target === this.settingsPlaybackBtn) {
      this.listSecondaryWrapper.classList.add("inView");
      //   temporary
      this.settingsMenu.style.height = "160px";
    } else if (e.target === this.settingsQualityBtn) {
      this.listTertiaryWrapper.classList.add("inView");
    }
  }

  updatePlaybackRate(e) {
    const rate = parseFloat(e.target.getAttribute("data-rate"));

    this.playbackRateButtons.forEach((button) => {
      button.classList.remove("active");
    });

    e.target.classList.add("active");
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

  updateResolution(e) {
    const res = e.target.getAttribute("data-res");

    if (res == 720) {
      this.qualityLabel.textContent = "720p";
    } else if (res == 360) {
      this.qualityLabel.textContent = "360p";
    }

    this.videoResolutionBtns.forEach((button) => {
      button.classList.remove("active");
    });

    e.target.classList.add("active");

    let newSrc = this.getAttribute(`data-video-${res}`);
    if (newSrc) {
      let currentTime = this.video.currentTime;

      this.source.setAttribute("src", newSrc);
      this.video.load();
      this.video.currentTime = currentTime;
      this.updatePauseState();
    } else {
      console.error("Resolution not found");
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
    this.settingsMenu.style.height = "86px";
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
    this.source = this.shadowRoot.querySelector("source");
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

    this.qualityLabel = this.shadowRoot.querySelector("#qualityLabel");

    this.videoResolutionBtns = this.shadowRoot.querySelectorAll(
      ".list--tertiary button"
    );

    this.settingsCloseBtn = this.shadowRoot.querySelector(
      ".settings-close--btn"
    );

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
    this.loadStyles().then(() => {
      this.render();
      this.initializeReferences();
      setTimeout(() => {
        // makes sure the elements are selected before calling setupEventListeners
        this.setupEventListeners();
      }, 0);
    });
  }

  async loadStyles() {
    try {
      const response = await fetch("./video-player-styles.css");
      const cssText = await response.text();

      const styleElement = document.createElement("style");
      styleElement.textContent = cssText;
      this.shadowRoot.appendChild(styleElement);
    } catch (error) {
      console.error("Failed to load styles:", error);
    }
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

    this.boundUpdateResolutionHandler = (e) => {
      this.updateResolution(e);
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
            this.pauseOverlay.style.height = "87.9%";
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
    this.settingsCloseBtn.addEventListener(
      "click",
      this.boundToggleShowSettings
    );

    this.videoResolutionBtns.forEach((button) => {
      button.addEventListener("click", this.boundUpdateResolutionHandler);
    });

    // override default behaviour
    document.addEventListener("fullscreenchange", () => {
      this.toggleFullScreenBtn();
      if (document.fullscreenElement) {
        this.videoControls.classList.add("fullScreenActive");
        this.videoControls.style.height = "7%";
        this.pauseOverlay.style.height = "91%";
      } else {
        this.videoControls.classList.remove("fullScreenActive");
        this.videoControls.style.height = "15%";
        this.pauseOverlay.style.height = "87.9%";
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
    const template = html` <div class="video-player">
      <div class="play--btn__overlay hidden"></div>
      <div class="play--btn__wrapper">
        <img src="./assets/play-btn.svg" class="hidden" />
      </div>

      <video poster="${this.getAttribute("data-poster")}" preload="metadata">
        <source src="${this.getAttribute(`data-video-720`)}" type="video/mp4" />
      </video>
      <div class="video-controls hidden">
        <div class="video-progress">
          <progress class="progress-bar" value="0" min="0" max="100"></progress>
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

              <div class="time">
                <time class="time-elapsed">00:00</time>
                <span> / </span>
                <time class="duration">00:00</time>
              </div>
            </div>
            <div class="bottom-controls--right">
              <div class="settings">
                <button data-title="Settings (s)" class="settings-btn">
                  <img src="./assets/settings.svg" />
                </button>

                <div class="settings--menu">
                  <div class="settings--menu__inner">
                    <div class="list--main__wrapper">
                      <button class="settings-close--btn">✖</button>
                      <ul class="list--main">
                        <div class="playbackRate--wrapper">
                          <button
                            name="playbackRate--btn"
                            class="btn--playbackRate"
                          >
                            Playback rate
                          </button>
                          <label for="playbackRate--btn" id="playbackRateLabel"
                            >Normal</label
                          >
                        </div>
                        <div class="quality--wrapper">
                          <button name="quality-btn" class="btn--quality">
                            Quality
                          </button>
                          <label for="quality-btn" id="qualityLabel"
                            >720p</label
                          >
                        </div>
                      </ul>
                    </div>

                    <div class="list--secondary__wrapper">
                      <div class="list--btnWrapper">
                        <button class="list--backBtn"><</button>
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
                        <button class="list--backBtn"><</button>
                      </div>
                      <ul class="list--tertiary">
                        <li><button data-res="720">720p</button></li>
                        <li><button data-res="360">360p</button></li>
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
                <img src="./assets/fullscreen.svg" alt="" class="fullscreen" />
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
