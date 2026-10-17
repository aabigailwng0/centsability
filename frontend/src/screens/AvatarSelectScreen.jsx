import { AVATARS, NICKNAME_MAX_LENGTH } from '../config/avatars.js';
import { useGame } from '../context/GameContext.jsx';

export default function AvatarSelectScreen() {
  const { avatar, nickname, canStart, goHome, selectAvatar, changeNickname, startGame } = useGame();

  const handleSubmit = (event) => {
    event.preventDefault();
    startGame();
  };

  return (
    <section className="screen screen--center screen--over-home" aria-labelledby="avatar-title">
      <h1 id="avatar-title" className="heading card title-card" tabIndex={-1}>
        Choose your avatar
      </h1>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <fieldset className="avatar-fieldset">
          <legend className="label">Pick an avatar</legend>
          <div className="avatar-grid">
            {AVATARS.map((a) => (
              <label key={a.id} className="avatar-option">
                <input
                  type="radio"
                  name="avatar"
                  value={a.id}
                  checked={avatar?.id === a.id}
                  onChange={() => selectAvatar(a.id)}
                  aria-label={a.label}
                />
                <img src={a.src} alt="" width="96" height="96" />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label htmlFor="nickname" className="label">
            Nickname <span className="hint">(required, up to {NICKNAME_MAX_LENGTH} characters)</span>
          </label>
          <input
            id="nickname"
            type="text"
            className="input"
            value={nickname}
            onChange={(e) => changeNickname(e.target.value)}
            maxLength={NICKNAME_MAX_LENGTH}
            required
            aria-required="true"
            autoComplete="off"
            aria-describedby="nickname-count"
          />
          <p id="nickname-count" className="hint">
            {nickname.length}/{NICKNAME_MAX_LENGTH} characters
          </p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={goHome}
            aria-label="Back to home screen"
          >
            Back
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!canStart}
            aria-label="Start the game"
          >
            Start
          </button>
        </div>
      </form>
    </section>
  );
}
