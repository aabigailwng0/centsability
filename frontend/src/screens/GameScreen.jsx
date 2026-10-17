import { useGame } from '../context/GameContext.jsx';

// Placeholder: real game loop comes in a later stage.
export default function GameScreen() {
  const { avatar, trimmedNickname } = useGame();

  return (
    <section className="screen screen--center" aria-labelledby="game-title">
      <h1 id="game-title" className="heading" tabIndex={-1}>
        Game
      </h1>
      <div className="card player-card">
        {avatar && <img src={avatar.src} alt={avatar.label} width="128" height="128" />}
        <p className="player-name">{trimmedNickname}</p>
        <p className="hint">The shop opens soon. Game coming in a later stage.</p>
      </div>
    </section>
  );
}
