import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Accent, primary, secondary colors as variables for inline style usage
const ACCENT = "#43b581";
const PRIMARY = "#1a73e8";
const SECONDARY = "#e37400";

// Example hangman words (could import from external file or extend)
const WORDS = [
  "REACT",
  "JAVASCRIPT",
  "MINIMAL",
  "KAVIA",
  "HANGMAN",
  "OPENAI",
  "LIGHT THEME",
  "COMPONENT",
  "PROGRAMMER",
  "CODE REVIEW"
];

// PUBLIC_INTERFACE
function getRandomWord() {
  // Selects a random word or phrase (uppercase)
  return WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();
}

// PUBLIC_INTERFACE
function getInitialGameState() {
  const word = getRandomWord();
  return {
    word,
    guesses: [],
    wrongGuesses: [],
    isGameOver: false,
    didWin: false
  };
}

// How many maximum wrong guesses (hangman has this many drawing steps)
const MAX_WRONG = 6;

/**
 * PUBLIC_INTERFACE
 * The main application component for the Hangman game frontend.
 */
function App() {
  // Game state managed here for all UI components
  const [game, setGame] = useState(getInitialGameState);
  const [inputValue, setInputValue] = useState("");
  const [keyboardAnim, setKeyboardAnim] = useState(null);

  // Focus input on restart/game start
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [game.word]);

  // PUBLIC_INTERFACE
  function guessLetter(letter) {
    // Don't do anything if already game over, or already guessed
    if (game.isGameOver || game.guesses.includes(letter)) return;

    const updatedGuesses = [...game.guesses, letter];
    if (!game.word.replace(/[^A-Z]/g, "").includes(letter)) {
      // Wrong guess
      const updatedWrong = [...game.wrongGuesses, letter];
      const isGameOver = updatedWrong.length >= MAX_WRONG;
      setGame((g) => ({
        ...g,
        guesses: updatedGuesses,
        wrongGuesses: updatedWrong,
        isGameOver: isGameOver,
        didWin: isGameOver ? false : g.didWin
      }));
      // Animate wrong key
      setKeyboardAnim({ key: letter, success: false });
    } else {
      // Correct guess
      const isWin = checkWin(game.word, updatedGuesses);
      setGame((g) => ({
        ...g,
        guesses: updatedGuesses,
        didWin: isWin,
        isGameOver: isWin ? true : g.isGameOver
      }));
      setKeyboardAnim({ key: letter, success: true });
    }
  }

  // PUBLIC_INTERFACE
  function guessWord(str) {
    const cleaned = str.trim().toUpperCase();
    if (!cleaned) return;
    if (cleaned === game.word.replace(/[^A-Z]/g, "")) {
      // Win
      // Add all letters in the word to guesses
      let letters = Array.from(
        new Set(game.word.replace(/[^A-Z]/g, "").split(""))
      );
      setGame((g) => ({
        ...g,
        guesses: letters,
        didWin: true,
        isGameOver: true
      }));
    } else {
      // Wrong guess: punish as one wrong guess (could be more strict)
      const newWrong = [...game.wrongGuesses, "[WORD]"];
      setGame((g) => ({
        ...g,
        wrongGuesses: newWrong,
        isGameOver: newWrong.length >= MAX_WRONG,
        didWin: false
      }));
    }
    setInputValue("");
  }

  // PUBLIC_INTERFACE
  function restartGame() {
    setGame(getInitialGameState());
    setInputValue("");
    setKeyboardAnim(null);
  }

  // Keyboard event handling for letters and Enter
  function handleKeyDown(e) {
    if (game.isGameOver) return;
    const isLetter = /^[a-z]$/i;
    if (isLetter.test(e.key)) {
      guessLetter(e.key.toUpperCase());
    } else if (e.key === "Enter" && inputValue) {
      guessWord(inputValue);
    }
  }

  // Used in onScreen keyboard (always shows, not hidden)
  function handleKeyboardClick(ch) {
    guessLetter(ch);
  }

  // Win condition: all unique word letters guessed
  function checkWin(word, guesses) {
    let letters = Array.from(new Set(word.replace(/[^A-Z]/g, "").split("")));
    return letters.every((ch) => guesses.includes(ch));
  }

  // Utility: show the word with guessed letters or underscores
  function renderWord(word, guesses, showFull = false) {
    return (
      <div className="hangman-word" aria-label="Secret word">
        {word.split("").map((ch, idx) => {
          if (ch === " ") {
            return (
              <span key={idx} className="hangman-space" aria-label="space">
                &nbsp;
              </span>
            );
          }
          const upperCh = ch.toUpperCase();
          let shown = guesses.includes(upperCh) || showFull;
          return (
            <span
              key={idx}
              className={`hangman-letter${shown ? " revealed" : ""}`}
            >
              {shown ? ch : "_"}
            </span>
          );
        })}
      </div>
    );
  }

  // Letters used for keyboard (English)
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Animate the keyboard key when pressed
  useEffect(() => {
    if (!keyboardAnim) return;
    // Just show for 180ms
    const id = setTimeout(() => setKeyboardAnim(null), 180);
    return () => clearTimeout(id);
  }, [keyboardAnim]);

  // Accessibility: announce end game
  useEffect(() => {
    if (game.isGameOver) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.blur();
      }, 200);
    }
  }, [game.isGameOver]);

  // --- Main Render ---
  return (
    <div className="App hangman-app">
      <main className="hangman-container">
        {/* Hangman Illustration at Top */}
        <section className="hangman-illustration" aria-label="Hangman Drawing">
          <HangmanDrawing wrong={game.wrongGuesses.length} />
        </section>

        {/* Secret word display */}
        <section
          className="hangman-secretword"
          style={{ marginTop: 24, marginBottom: 10 }}
        >
          {game.isGameOver && !game.didWin
            ? renderWord(game.word, game.guesses, true)
            : renderWord(game.word, game.guesses, false)}
        </section>

        <section className="hangman-status-row">
          <LivesIndicator
            remaining={MAX_WRONG - game.wrongGuesses.length}
            total={MAX_WRONG}
            isGameOver={game.isGameOver}
            accent={ACCENT}
            primary={PRIMARY}
            secondary={SECONDARY}
          />
          <GuessesBar
            guesses={game.wrongGuesses}
            max={MAX_WRONG}
            accent={ACCENT}
            secondary={SECONDARY}
          />
        </section>

        {/* On-screen keyboard */}
        <section className="hangman-keyboard">
          <Keyboard
            guesses={game.guesses.concat(game.wrongGuesses)}
            onKey={handleKeyboardClick}
            disabled={game.isGameOver}
            animKey={keyboardAnim}
            accent={ACCENT}
            primary={PRIMARY}
            secondary={SECONDARY}
          />
        </section>

        {/* Guess a letter by typing, or the word */}
        <section className="hangman-inputbox" aria-label="Guess input">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue) guessWord(inputValue);
            }}
            autoComplete="off"
          >
            <input
              type="text"
              ref={inputRef}
              inputMode="text"
              maxLength={Math.max(24, game.word.length)}
              pattern="[a-zA-Z\s]*"
              className="hangman-input"
              placeholder="Guess the word or type a letter…"
              value={inputValue}
              disabled={game.isGameOver}
              onChange={(e) =>
                setInputValue(
                  e.target.value.replace(/[^a-zA-Z\s]+/g, "").toUpperCase()
                )
              }
              onKeyDown={handleKeyDown}
              aria-label="Type here to guess a letter or the word"
            />
            <button
              type="submit"
              className="hangman-btn hangman-btn-main"
              disabled={game.isGameOver || !inputValue.trim()}
              aria-label="Guess Word"
              style={{
                background: ACCENT
              }}
            >
              Guess Word
            </button>
          </form>
        </section>

        {/* Game over / success */}
        {game.isGameOver && (
          <section
            className="hangman-gameover"
            tabIndex="0"
            aria-live="polite"
            aria-label={
              game.didWin
                ? "Congratulations! You solved the word!"
                : "Game Over! The word was"
            }
          >
            <div
              className="hangman-gameover-message"
              style={{
                color: game.didWin ? ACCENT : SECONDARY
              }}
            >
              {game.didWin
                ? "🎉 Congratulations! You solved it!"
                : "Game Over!"}
            </div>
            {!game.didWin && (
              <div className="hangman-gameover-answer">
                The word was:&nbsp;<strong>{game.word}</strong>
              </div>
            )}
            <button
              className="hangman-btn hangman-btn-restart"
              style={{
                background: PRIMARY,
                color: "#fff"
              }}
              onClick={restartGame}
            >
              Restart Game
            </button>
          </section>
        )}

        <footer className="hangman-footer">
          <span>
            Hangman with React |{" "}
            <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">
              React Documentation
            </a>
          </span>
        </footer>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function HangmanDrawing({ wrong }) {
  // SVG of hangman (minimal style) - add one body part per wrong guess
  // Steps: Base (1), Pole(2), Overhang(3), Head(4), Body(5), ArmLeft(6), ArmRight(7), LegLeft(8), LegRight(9)
  // But we only allow MAX_WRONG = 6 wrong guesses for classic style (head, body, 2 arms, 2 legs)
  // Structure order: Stand (base, pole, beam, rope), head, body, arms/legs
  const color = "#333";
  return (
    <svg
      width="132"
      height="180"
      viewBox="0 0 132 180"
      fill="none"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      style={{ display: "block", margin: "0 auto" }}
      aria-label={`Hangman illustration with ${wrong} wrong guesses`}
    >
      {/* Stand */}
      <line x1="15" y1="170" x2="117" y2="170" stroke="#a5a5a5" />
      <line x1="40" y1="25" x2="40" y2="170" stroke="#a5a5a5" />
      <line x1="40" y1="25" x2="99" y2="25" stroke="#a5a5a5" />
      <line x1="99" y1="25" x2="99" y2="45" stroke="#a5a5a5" />

      {/* Head */}
      {wrong > 0 && (
        <circle cx="99" cy="60" r="15" stroke={SECONDARY} fill="none" />
      )}
      {/* Body */}
      {wrong > 1 && (
        <line x1="99" y1="75" x2="99" y2="120" stroke={PRIMARY} />
      )}
      {/* Left arm */}
      {wrong > 2 && (
        <line x1="99" y1="90" x2="79" y2="105" stroke={ACCENT} />
      )}
      {/* Right arm */}
      {wrong > 3 && (
        <line x1="99" y1="90" x2="119" y2="105" stroke={ACCENT} />
      )}
      {/* Left leg */}
      {wrong > 4 && (
        <line x1="99" y1="120" x2="85" y2="150" stroke={PRIMARY} />
      )}
      {/* Right leg */}
      {wrong > 5 && (
        <line x1="99" y1="120" x2="113" y2="150" stroke={PRIMARY} />
      )}
    </svg>
  );
}

// PUBLIC_INTERFACE
function Keyboard({
  guesses,
  onKey,
  disabled,
  animKey,
  accent,
  primary,
  secondary
}) {
  // Onscreen keyboard, grouped like QWERTY for accessibility
  const QWERTY = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    "ZXCVBNM".split("")
  ];

  function getKeyState(ch) {
    if (guesses.includes(ch)) return "used";
    return "unused";
  }

  // Keyboard keys: visually indicate hits/misses
  return (
    <div className="hangman-keyboard-group" tabIndex="0" aria-label="Game keyboard">
      {QWERTY.map((row, i) => (
        <div className="hangman-keyboard-row" key={i}>
          {row.map((ch) => {
            const state = getKeyState(ch);
            let keyClass = "hangman-key";
            if (state === "used") keyClass += " hangman-key-used";

            // Animate on striking
            if (
              animKey &&
              animKey.key === ch &&
              typeof animKey.success === "boolean"
            ) {
              keyClass += animKey.success
                ? " hangman-key-anim-correct"
                : " hangman-key-anim-wrong";
            }

            return (
              <button
                className={keyClass}
                key={ch}
                type="button"
                onClick={() => onKey(ch)}
                disabled={disabled || state === "used"}
                aria-label={
                  state === "used"
                    ? `Letter ${ch}, already used`
                    : `Letter ${ch}`
                }
                style={
                  state === "used"
                    ? {
                        background:
                          guesses.includes(ch) && animKey?.key === ch && animKey?.success
                            ? accent
                            : "#eaeaea",
                        color: "#bbb",
                        borderColor: "#e0e0e0"
                      }
                    : {}
                }
              >
                {ch}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function LivesIndicator({ remaining, total, isGameOver, accent, primary, secondary }) {
  // Shows "Lives" with pips/circles to indicate remaining guesses.
  // Uses accent color for remaining, secondary for lost.
  return (
    <div className="hangman-lives" aria-label={`Lives remaining: ${remaining}/${total}`}>
      <span
        style={{
          color: isGameOver && remaining === 0 ? SECONDARY : primary,
          fontWeight: 600,
          marginRight: 8
        }}
      >
        Lives
      </span>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="hangman-life-dot"
          aria-label={i < remaining ? "life" : "lost life"}
          style={{
            background: i < remaining
              ? accent
              : isGameOver && remaining === 0
                ? SECONDARY
                : "#e0e0e0"
          }}
        />
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function GuessesBar({ guesses, max, accent, secondary }) {
  // Show wrong guesses made so far as colored labels
  return (
    <div className="hangman-guesses" aria-label="Wrong guesses">
      {guesses.length === 0 ? (
        <span className="hangman-guesses-placeholder">No wrong guesses yet</span>
      ) : (
        guesses.map((g, idx) => (
          <span
            className="hangman-guess-label"
            key={idx}
            style={{
              background: g === "[WORD]" ? secondary : "#eaeaea",
              color: g === "[WORD]" ? "#fff" : accent,
              borderColor: "#dbdbdb"
            }}
            aria-label={
              g === "[WORD]" ? "incorrect word guess" : `wrong letter ${g}`
            }
          >
            {g === "[WORD]" ? "WORD" : g}
          </span>
        ))
      )}
    </div>
  );
}

export default App;
