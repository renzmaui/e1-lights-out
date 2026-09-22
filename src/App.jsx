import { useEffect, useRef, useState } from "react";
import "./App.css";

const GAME_STATES = {
  IDLE: "idle",
  WAITING: "waiting",
  READY: "ready",
  RESULT: "result",
  FALSE_START: "false-start",
};

const STORAGE_KEY = "e1-lights-out-best-time";
const NAME_KEY = "e1-lights-out-driver-name";

const LIGHT_COUNT = 5;
const LIGHT_INTERVAL = 500;
const INITIAL_DELAY = 700;
const GO_DELAY_MIN = 1400;
const GO_DELAY_MAX = 3600;

/* =========================================================
   RESULT RATING
========================================================= */

function getRating(time) {
  if (time >= 3) {
    return {
      title: "NOT EVEN CLOSE",
      emoji: "😭",
      description:
        "That light had time to go on vacation.",
    };
  }

  if (time >= 1) {
    return {
      title: "WAKE UP, DRIVER",
      emoji: "😭",
      description:
        "Your reflexes are still loading.",
    };
  }

  if (time >= 0.5) {
    return {
      title: "GETTING THERE",
      emoji: "👀",
      description:
        "You're starting to find your speed.",
    };
  }

  if (time >= 0.25) {
    return {
      title: "ALMOST THERE",
      emoji: "🔥",
      description:
        "That's getting seriously fast.",
    };
  }

  if (time >= 0.2) {
    return {
      title: "LIGHTNING REFLEXES",
      emoji: "⚡",
      description:
        "Now THAT was quick.",
    };
  }

  return {
    title: "ARE YOU EVEN HUMAN?!",
    emoji: "🏎️",
    description:
      "That reaction was insanely fast.",
  };
}

function formatTime(seconds) {
  if (
    seconds === null ||
    seconds === undefined
  ) {
    return "--";
  }

  return `${seconds.toFixed(3)}s`;
}

/* =========================================================
   AUDIO ENGINE
   Aggressive synthesized race-start sounds.
   No external audio files required.
========================================================= */

class RaceAudio {
  constructor() {
    this.context = null;
    this.master = null;
  }

  init() {
    if (!this.context) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) return;

      this.context =
        new AudioContext();

      this.master =
        this.context.createGain();

      this.master.gain.value = 0.42;

      this.master.connect(
        this.context.destination
      );
    }

    if (
      this.context.state ===
      "suspended"
    ) {
      this.context.resume();
    }
  }

  createOscillator({
    type,
    frequency,
    endFrequency,
    duration,
    volume,
    delay = 0,
  }) {
    if (
      !this.context ||
      !this.master
    ) {
      return;
    }

    const now =
      this.context.currentTime +
      delay;

    const oscillator =
      this.context.createOscillator();

    const gain =
      this.context.createGain();

    oscillator.type = type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(
          20,
          endFrequency
        ),
        now + duration
      );
    }

    gain.gain.setValueAtTime(
      0.0001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.006
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(this.master);

    oscillator.start(now);

    oscillator.stop(
      now + duration + 0.025
    );
  }

  /* Heavy mechanical hit for each red light. */

  startLight(number) {
    const bass =
      105 +
      number * 12;

    const click =
      800 +
      number * 45;

    this.createOscillator({
      type: "square",
      frequency: bass,
      endFrequency: bass * 0.72,
      duration: 0.16,
      volume:
        number === 5
          ? 0.72
          : 0.58,
    });

    this.createOscillator({
      type: "sawtooth",
      frequency: click,
      endFrequency: 230,
      duration: 0.055,
      volume: 0.22,
      delay: 0.008,
    });

    /*
      Second low hit gives it more weight.
    */

    this.createOscillator({
      type: "triangle",
      frequency: 68,
      endFrequency: 42,
      duration: 0.18,
      volume:
        number === 5
          ? 0.38
          : 0.28,
      delay: 0.018,
    });
  }

  /*
    Lights OUT / GO.

    This is intentionally much more
    aggressive than the previous version.
  */

  lightsOut() {
    /*
      Deep launch hit.
    */

    this.createOscillator({
      type: "sawtooth",
      frequency: 75,
      endFrequency: 900,
      duration: 0.42,
      volume: 0.78,
    });

    /*
      High sharp attack.
    */

    this.createOscillator({
      type: "square",
      frequency: 1100,
      endFrequency: 1850,
      duration: 0.18,
      volume: 0.56,
      delay: 0.025,
    });

    /*
      Lower engine-like layer.
    */

    this.createOscillator({
      type: "sawtooth",
      frequency: 125,
      endFrequency: 520,
      duration: 0.55,
      volume: 0.42,
      delay: 0.035,
    });

    /*
      Final high transient.
    */

    this.createOscillator({
      type: "square",
      frequency: 1500,
      endFrequency: 700,
      duration: 0.13,
      volume: 0.32,
      delay: 0.16,
    });
  }

  falseStart() {
    /*
      Harsh descending alarm.
    */

    this.createOscillator({
      type: "square",
      frequency: 420,
      endFrequency: 65,
      duration: 0.48,
      volume: 0.78,
    });

    this.createOscillator({
      type: "sawtooth",
      frequency: 180,
      endFrequency: 40,
      duration: 0.38,
      volume: 0.55,
      delay: 0.08,
    });
  }

  result() {
    this.createOscillator({
      type: "square",
      frequency: 440,
      duration: 0.08,
      volume: 0.28,
    });

    this.createOscillator({
      type: "square",
      frequency: 660,
      duration: 0.09,
      volume: 0.32,
      delay: 0.09,
    });

    this.createOscillator({
      type: "square",
      frequency: 880,
      duration: 0.18,
      volume: 0.38,
      delay: 0.19,
    });
  }
}

/* =========================================================
   RESULT BADGE
========================================================= */

function drawBadge(
  playerName,
  result
) {
  return new Promise(
    (resolve, reject) => {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = 1080;
      canvas.height = 1350;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        reject(
          new Error(
            "Canvas unavailable."
          )
        );
        return;
      }

      const rating =
        getRating(result);

      const name =
        playerName.trim() ||
        "Maui";

      /* Background */

      ctx.fillStyle = "#fffdf7";

      ctx.fillRect(
        0,
        0,
        1080,
        1350
      );

      /* Red corner */

      ctx.fillStyle = "#d52e45";

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(390, 0);
      ctx.lineTo(0, 390);
      ctx.closePath();
      ctx.fill();

      /* Green corner */

      ctx.fillStyle = "#1e8b61";

      ctx.beginPath();
      ctx.moveTo(1080, 1350);
      ctx.lineTo(690, 1350);
      ctx.lineTo(1080, 960);
      ctx.closePath();
      ctx.fill();

      /* Main card */

      ctx.fillStyle = "#ffffff";

      ctx.beginPath();
      ctx.roundRect(
        70,
        70,
        940,
        1210,
        38
      );
      ctx.fill();

      ctx.strokeStyle = "#171717";
      ctx.lineWidth = 7;
      ctx.stroke();

      /* Header */

      ctx.fillStyle = "#171717";

      ctx.font =
        "700 27px Arial";

      ctx.fillText(
        "E1 • ENHYPEN MAMA GRAND PRIX",
        125,
        145
      );

      /* Title */

      ctx.font =
        "800 104px Arial";

      ctx.fillText(
        "LIGHTS",
        125,
        275
      );

      ctx.fillText(
        "OUT",
        125,
        370
      );

      ctx.font =
        "700 27px Arial";

      ctx.fillStyle = "#666666";

      ctx.fillText(
        "REACTION TEST",
        130,
        425
      );

      /* Divider */

      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(125, 470);
      ctx.lineTo(955, 470);
      ctx.stroke();

      /* Driver */

      ctx.font =
        "700 24px Arial";

      ctx.fillStyle = "#777777";

      ctx.fillText(
        "DRIVER",
        130,
        535
      );

      let displayName = name;

      if (
        displayName.length >
        18
      ) {
        displayName =
          displayName.slice(
            0,
            18
          ) + "…";
      }

      ctx.font =
        "800 55px Arial";

      ctx.fillStyle = "#171717";

      ctx.fillText(
        displayName,
        130,
        600
      );

      /* Time */

      ctx.font =
        "700 145px monospace";

      ctx.fillStyle = "#d52e45";

      ctx.fillText(
        result.toFixed(3),
        125,
        790
      );

      ctx.font =
        "700 32px Arial";

      ctx.fillStyle = "#171717";

      ctx.fillText(
        "SECONDS",
        710,
        785
      );

      /* Rating */

      ctx.fillStyle = "#171717";

      ctx.beginPath();
      ctx.roundRect(
        125,
        850,
        830,
        150,
        22
      );
      ctx.fill();

      ctx.fillStyle = "#ffffff";

      ctx.font =
        "800 43px Arial";

      ctx.fillText(
        `${rating.title} ${rating.emoji}`,
        160,
        915
      );

      ctx.font =
        "500 25px Arial";

      ctx.fillStyle = "#dddddd";

      ctx.fillText(
        rating.description,
        160,
        960
      );

      /* Five columns × two lights */

      const startX = 340;
      const gap = 90;

      for (
        let column = 0;
        column < 5;
        column++
      ) {
        for (
          let row = 0;
          row < 2;
          row++
        ) {
          ctx.beginPath();

          ctx.arc(
            startX +
              column * gap,
            1070 +
              row * 62,
            22,
            0,
            Math.PI * 2
          );

          ctx.fillStyle =
            "#1e8b61";

          ctx.fill();
        }
      }

      /* Footer */

      ctx.strokeStyle = "#dddddd";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(125, 1190);
      ctx.lineTo(955, 1190);
      ctx.stroke();

      ctx.font =
        "700 22px Arial";

      ctx.fillStyle = "#777777";

      ctx.fillText(
        "E1LIGHTSOUT",
        125,
        1245
      );

      ctx.fillText(
        "#ENHYPEN",
        820,
        1245
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                "Unable to create PNG."
              )
            );
            return;
          }

          resolve({
            blob,
            url:
              URL.createObjectURL(
                blob
              ),
          });
        },
        "image/png"
      );
    }
  );
}

/* =========================================================
   STARTING GANTRY
========================================================= */

function StartingLights({
  gameState,
  lightsLit,
}) {
  const isReady =
    gameState ===
    GAME_STATES.READY;

  const isFalse =
    gameState ===
    GAME_STATES.FALSE_START;

  return (
    <div
      className={`starting-gantry ${
        isReady
          ? "gantry-green"
          : ""
      } ${
        isFalse
          ? "gantry-false"
          : ""
      }`}
    >
      <div className="gantry-top">
        <span>
          E1 RACE CONTROL
        </span>

        <span>
          STARTING LIGHTS
        </span>
      </div>

      <div className="light-grid">
        {Array.from(
          {
            length: 5,
          },
          (_, column) => {
            const isLit =
              column <
              lightsLit;

            return (
              <div
                key={column}
                className="light-column"
              >
                <div
                  className={`race-light ${
                    isReady
                      ? "race-light-green"
                      : isLit
                      ? "race-light-red"
                      : "race-light-off"
                  } ${
                    isLit &&
                    !isReady
                      ? "race-light-active"
                      : ""
                  }`}
                >
                  <div className="light-glow" />
                </div>

                <div
                  className={`race-light ${
                    isReady
                      ? "race-light-green"
                      : isLit
                      ? "race-light-red"
                      : "race-light-off"
                  } ${
                    isLit &&
                    !isReady
                      ? "race-light-active"
                      : ""
                  }`}
                >
                  <div className="light-glow" />
                </div>
              </div>
            );
          }
        )}
      </div>

      <div className="gantry-bar" />

      <div className="gantry-status">
        {isReady
          ? "LIGHTS OUT"
          : isFalse
          ? "FALSE START"
          : lightsLit ===
            LIGHT_COUNT
          ? "HOLD"
          : lightsLit > 0
          ? `LIGHT ${lightsLit} / 5`
          : "READY"}
      </div>
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [playerName, setPlayerName] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            NAME_KEY
          ) || ""
        );
      } catch {
        return "";
      }
    });

  const [gameState, setGameState] =
    useState(
      GAME_STATES.IDLE
    );

  const [lightsLit, setLightsLit] =
    useState(0);

  const [result, setResult] =
    useState(null);

  const [bestTime, setBestTime] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            STORAGE_KEY
          );

        return saved
          ? Number(saved)
          : null;
      } catch {
        return null;
      }
    });

  const [saving, setSaving] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const audioRef =
    useRef(null);

  const startTimeRef =
    useRef(null);

  const timersRef =
    useRef([]);

  const gameRunRef =
    useRef(0);

  useEffect(() => {
    audioRef.current =
      new RaceAudio();

    document.title =
      "E1 — Lights Out";

    return () => {
      timersRef.current.forEach(
        (timer) =>
          clearTimeout(timer)
      );

      if (
        audioRef.current?.context
      ) {
        audioRef.current.context.close();
      }
    };
  }, []);

  useEffect(() => {
    try {
      if (
        playerName.trim()
      ) {
        localStorage.setItem(
          NAME_KEY,
          playerName.trim()
        );
      }
    } catch {
      // Ignore storage errors.
    }
  }, [playerName]);

  const clearTimers = () => {
    timersRef.current.forEach(
      (timer) =>
        clearTimeout(timer)
    );

    timersRef.current = [];
  };

  /* =======================================================
     START
  ======================================================= */

  const startGame = () => {
    clearTimers();

    gameRunRef.current += 1;

    const currentRun =
      gameRunRef.current;

    audioRef.current?.init();

    setResult(null);
    setCopied(false);
    setSaving(false);
    setLightsLit(0);

    setGameState(
      GAME_STATES.WAITING
    );

    /*
      Five lights come on one at a time.
    */

    for (
      let i = 1;
      i <= LIGHT_COUNT;
      i++
    ) {
      const timer =
        setTimeout(() => {
          if (
            currentRun !==
            gameRunRef.current
          ) {
            return;
          }

          setLightsLit(i);

          audioRef.current?.startLight(
            i
          );
        }, INITIAL_DELAY +
          (i - 1) *
            LIGHT_INTERVAL);

      timersRef.current.push(
        timer
      );
    }

    /*
      Random delay after fifth light.
    */

    const randomDelay =
      GO_DELAY_MIN +
      Math.random() *
        (GO_DELAY_MAX -
          GO_DELAY_MIN);

    const goTimer =
      setTimeout(() => {
        if (
          currentRun !==
          gameRunRef.current
        ) {
          return;
        }

        /*
          The timer is only for
          the visual/audio trigger.
          Reaction timing begins
          at the exact GO moment.
        */

        startTimeRef.current =
          performance.now();

        setGameState(
          GAME_STATES.READY
        );

        audioRef.current?.lightsOut();
      }, INITIAL_DELAY +
        (LIGHT_COUNT - 1) *
          LIGHT_INTERVAL +
        randomDelay);

    timersRef.current.push(
      goTimer
    );
  };

  /* =======================================================
     CLICK / REACTION
  ======================================================= */

  const handleLightClick = () => {
    /*
      Any click during the red-light
      sequence is a false start.
    */

    if (
      gameState ===
      GAME_STATES.WAITING
    ) {
      clearTimers();

      gameRunRef.current += 1;

      audioRef.current?.falseStart();

      setGameState(
        GAME_STATES.FALSE_START
      );

      return;
    }

    if (
      gameState !==
      GAME_STATES.READY
    ) {
      return;
    }

    const reactionSeconds =
      (performance.now() -
        startTimeRef.current) /
      1000;

    clearTimers();

    audioRef.current?.result();

    setResult(
      reactionSeconds
    );

    if (
      bestTime === null ||
      reactionSeconds <
        bestTime
    ) {
      setBestTime(
        reactionSeconds
      );

      try {
        localStorage.setItem(
          STORAGE_KEY,
          String(
            reactionSeconds
          )
        );
      } catch {
        // Ignore storage errors.
      }
    }

    setGameState(
      GAME_STATES.RESULT
    );
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetGame = () => {
    clearTimers();

    gameRunRef.current += 1;

    setLightsLit(0);
    setResult(null);
    setCopied(false);
    setSaving(false);

    setGameState(
      GAME_STATES.IDLE
    );
  };

  /* =======================================================
     SAVE IMAGE
  ======================================================= */

  const saveImage = async () => {
    if (result === null) {
      return;
    }

    setSaving(true);

    try {
      const badge =
        await drawBadge(
          playerName,
          result
        );

      const safeName =
        (
          playerName.trim() ||
          "Maui"
        )
          .replace(
            /[^a-zA-Z0-9-_ ]/g,
            ""
          )
          .replace(
            /\s+/g,
            "-"
          )
          .toLowerCase();

      const filename =
        `e1-lights-out-${safeName}-${result.toFixed(
          3
        )}s.png`;

      const link =
        document.createElement(
          "a"
        );

      link.download =
        filename;

      link.href =
        badge.url;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(
          badge.url
        );
      }, 1000);
    } catch (error) {
      console.error(
        "Could not save badge:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     SHARE
  ======================================================= */

  const shareImage = async () => {
    if (result === null) {
      return;
    }

    setSaving(true);

    try {
      const badge =
        await drawBadge(
          playerName,
          result
        );

      const name =
        playerName.trim() ||
        "Maui";

      const rating =
        getRating(result);

      const file =
        new File(
          [badge.blob],
          "e1-lights-out-result.png",
          {
            type: "image/png",
          }
        );

      const shareText =
        `🏎️ E1 — LIGHTS OUT\n\n` +
        `${name} reacted in ${result.toFixed(
          3
        )} seconds!\n` +
        `${rating.title} ${rating.emoji}\n\n` +
        `Can you beat my time?\n` +
        `#E1LightsOut #ENHYPEN`;

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title:
            "E1 — Lights Out",
          text: shareText,
          files: [file],
        });
      } else if (
        navigator.share
      ) {
        await navigator.share({
          title:
            "E1 — Lights Out",
          text: shareText,
        });
      } else if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          shareText
        );

        setCopied(true);

        setTimeout(() => {
          setCopied(false);
        }, 2500);
      }

      URL.revokeObjectURL(
        badge.url
      );
    } catch {
      // Share cancellation ignored.
    } finally {
      setSaving(false);
    }
  };

  const rating =
    result !== null
      ? getRating(result)
      : null;

  return (
    <main className="page">
      <div className="game-card">

        {/* HEADER */}

        <header className="header">
          <div>
            <span className="eyebrow">
              E1 • MINI GAME
            </span>

            <h1>
              LIGHTS
              <br />
              OUT
            </h1>
          </div>

          <div className="race-icon">
            🏎️
          </div>
        </header>

        <p className="subtitle">
          Tap as soon as the five
          starting lights go out.
          <br />
          Track your fastest reaction.
        </p>

        {/* DRIVER */}

        <div className="player-section">
          <label htmlFor="player-name">
            DRIVER NAME
          </label>

          <input
            id="player-name"
            type="text"
            maxLength={20}
            value={playerName}
            onChange={(event) =>
              setPlayerName(
                event.target.value
              )
            }
            placeholder="Enter your name"
            disabled={
              gameState ===
                GAME_STATES.WAITING ||
              gameState ===
                GAME_STATES.READY
            }
          />
        </div>

        {/* GANTRY / REACTION ZONE */}

        <button
          className={`reaction-area ${
            gameState ===
            GAME_STATES.READY
              ? "reaction-active"
              : ""
          } ${
            gameState ===
            GAME_STATES.WAITING
              ? "reaction-waiting"
              : ""
          }`}
          onClick={
            handleLightClick
          }
          disabled={
            gameState ===
              GAME_STATES.IDLE ||
            gameState ===
              GAME_STATES.RESULT
          }
          aria-label={
            gameState ===
            GAME_STATES.READY
              ? "Tap anywhere on the starting lights"
              : "Formula 1 style starting lights"
          }
        >
          <StartingLights
            gameState={
              gameState
            }
            lightsLit={
              lightsLit
            }
          />

          <div
            className={`tap-hint ${
              gameState ===
              GAME_STATES.READY
                ? "tap-hint-go"
                : ""
            }`}
          >
            {gameState ===
              GAME_STATES.IDLE &&
              "PRESS START TO ARM"}

            {gameState ===
              GAME_STATES.WAITING &&
              (lightsLit ===
              LIGHT_COUNT
                ? "WAIT FOR LIGHTS OUT"
                : "WATCH THE LIGHTS")}

            {gameState ===
              GAME_STATES.READY &&
              "⚡ TAP ANYWHERE HERE! ⚡"}

            {gameState ===
              GAME_STATES.FALSE_START &&
              "FALSE START"}

            {gameState ===
              GAME_STATES.RESULT &&
              "RESULT"}
          </div>
        </button>

        {/* INSTRUCTIONS */}

        {gameState ===
          GAME_STATES.IDLE && (
          <div className="instructions">

            <div className="instruction-row">
              <span>01</span>

              <p>
                Press START RACE
              </p>
            </div>

            <div className="instruction-row">
              <span>02</span>

              <p>
                Five red lights
                come on
                one-by-one
              </p>
            </div>

            <div className="instruction-row">
              <span>03</span>

              <p>
                When all lights
                go OUT, tap
                anywhere
              </p>
            </div>

          </div>
        )}

        {/* WAITING */}

        {gameState ===
          GAME_STATES.WAITING && (
          <div className="status-message waiting-message">
            <strong>
              DON'T BLINK.
            </strong>

            <span>
              Five lights. Random
              delay. Then LIGHTS OUT.
            </span>
          </div>
        )}

        {/* READY */}

        {gameState ===
          GAME_STATES.READY && (
          <div className="status-message ready-message">
            <strong>
              LIGHTS OUT! 🏎️
            </strong>

            <span>
              Tap anywhere on the
              gantry NOW.
            </span>
          </div>
        )}

        {/* FALSE START */}

        {gameState ===
          GAME_STATES.FALSE_START && (
          <>
            <div className="status-message false-message">
              <strong>
                FALSE START 😭
              </strong>

              <span>
                You tapped before the
                lights went out.
              </span>
            </div>

            <button
              className="start-button"
              onClick={
                startGame
              }
            >
              TRY AGAIN
            </button>
          </>
        )}

        {/* RESULT */}

        {gameState ===
          GAME_STATES.RESULT &&
          result !== null && (
          <section className="result-section">

            <div className="result-time">
              {result.toFixed(3)}

              <small>
                seconds
              </small>
            </div>

            <div className="rating">
              <strong>
                {rating.title}{" "}
                {rating.emoji}
              </strong>

              <span>
                {rating.description}
              </span>
            </div>

            <div className="best-time">
              <span>
                PERSONAL BEST
              </span>

              <strong>
                {bestTime !== null
                  ? bestTime.toFixed(
                      3
                    ) + "s"
                  : "--"}
              </strong>
            </div>

            {/* SHARE PREVIEW */}

            <div className="share-badge">

              <div className="badge-corner-red" />

              <div className="badge-corner-green" />

              <div className="badge-content">

                <div className="badge-top">
                  <span>
                    E1 • LIGHTS OUT
                  </span>

                  <span>
                    REACTION TEST
                  </span>
                </div>

                <div className="badge-title">
                  LIGHTS
                  <br />
                  OUT
                </div>

                <div className="badge-label">
                  DRIVER
                </div>

                <div className="badge-name">
                  {playerName.trim() ||
                    "Maui"}
                </div>

                <div className="badge-time">
                  {result.toFixed(3)}
                </div>

                <div className="badge-seconds">
                  SECONDS
                </div>

                <div className="badge-rating">
                  {rating.title}{" "}
                  {rating.emoji}
                </div>

                <div className="badge-lights">
                  {Array.from(
                    {
                      length: 10,
                    },
                    (_, index) => (
                      <span
                        key={
                          index
                        }
                      />
                    )
                  )}
                </div>

                <div className="badge-footer">
                  <span>
                    E1LIGHTSOUT
                  </span>

                  <span>
                    #ENHYPEN
                  </span>
                </div>

              </div>
            </div>

            <div className="result-actions">

              <button
                className="primary-button"
                onClick={
                  saveImage
                }
                disabled={saving}
              >
                {saving
                  ? "PREPARING..."
                  : "SAVE IMAGE ↓"}
              </button>

              <button
                className="secondary-button"
                onClick={
                  shareImage
                }
                disabled={saving}
              >
                {copied
                  ? "RESULT COPIED ✓"
                  : "SHARE IMAGE ↗"}
              </button>

            </div>

            <button
              className="try-again-button"
              onClick={
                startGame
              }
            >
              TRY AGAIN
            </button>

          </section>
        )}

        {/* START */}

        {gameState ===
          GAME_STATES.IDLE && (
          <button
            className="start-button"
            onClick={
              startGame
            }
          >
            START RACE
          </button>
        )}

        {/* CANCEL */}

        {gameState ===
          GAME_STATES.WAITING && (
          <button
            className="cancel-button"
            onClick={
              resetGame
            }
          >
            CANCEL
          </button>
        )}

        {/* STATS */}

        <div className="stats">

          <div>
            <span>
              PERSONAL BEST
            </span>

            <strong>
              {formatTime(
                bestTime
              )}
            </strong>
          </div>

          <div>
            <span>
              E1 GOAL
            </span>

            <strong>
              &lt; 0.250s
            </strong>
          </div>

        </div>

      </div>

      <footer>
        E1 — ENHYPEN MAMA GRAND PRIX
      </footer>
    </main>
  );
}

export default App;