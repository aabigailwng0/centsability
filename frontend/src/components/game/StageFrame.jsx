import { NAMEPLATES, STAR_SLOT, stagePhoto } from '../../config/stageLayout.js';

function regionStyle(region) {
  return {
    left: `${region.left}%`,
    top: `${region.top}%`,
    width: `${region.width}%`,
    height: `${region.height}%`,
  };
}

export default function StageFrame({ page, animal, nickname, starTotal, debug, children }) {
  const plate = NAMEPLATES[page];

  return (
    <div className="stage-scene">
      <div className={`stage-frame${debug ? ' stage-frame--debug' : ''}`}>
        <img src={stagePhoto(page, animal)} alt="" />
        <p className="nameplate" style={{ ...regionStyle(plate), transform: `rotate(${plate.rotate}deg)`, background: plate.patch, fontSize: `${plate.fontSize}vh` }}>
          {nickname}
        </p>
        <p className="star-slot" style={regionStyle(STAR_SLOT)} aria-live="polite">
          <span className="visually-hidden">Stars: </span>
          {starTotal}
        </p>
        {children}
      </div>
    </div>
  );
}
