import { useEffect, useMemo, useRef, useState } from 'react';
import poems from '../data/poems.json';
import './ReadingPage.css';

function KaraokeLine({ text, timings, notation, currentTime }) {
  return (
    <span className="karaoke-line" aria-label={text}>
      {[...text].map((character, index) => {
        const sung = currentTime >= (timings?.[index] ?? Infinity);
        return (
          <span className={sung ? 'is-sung' : ''} key={`${character}-${index}`}>
            {character}
            {notation?.[index] && <i className={`reading-mark ${sung ? 'is-sung' : ''}`}>{notation[index]}</i>}
          </span>
        );
      })}
    </span>
  );
}

function TranscriptionKaraokeLine({ text = '', timings = [], currentTime }) {
  const characters = [...text];
  const spokenCharacterCount = characters.filter(character => /[А-Яа-яЁё]/.test(character)).length;
  let spokenCharacterIndex = -1;

  return (
    <span className="romaji-line transcription-karaoke-line" aria-label={text}>
      {characters.map((character, index) => {
        if (/[А-Яа-яЁё]/.test(character)) spokenCharacterIndex += 1;
        const progressIndex = Math.max(0, spokenCharacterIndex);
        const timingIndex = spokenCharacterCount > 1
          ? Math.round(progressIndex * (timings.length - 1) / (spokenCharacterCount - 1))
          : 0;
        const sung = currentTime >= (timings[timingIndex] ?? Infinity);

        return <span className={sung ? 'is-sung' : ''} key={`${character}-${index}`}>{character}</span>;
      })}
    </span>
  );
}

export default function ReadingPage() {
  const [poemIndex, setPoemIndex] = useState(0);
  const [showHiragana, setShowHiragana] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState(null);
  const [selfPhase, setSelfPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [playlistInput, setPlaylistInput] = useState('');
  const audioRef = useRef(null);
  const selfFrameRef = useRef(null);
  const selfStartedAtRef = useRef(0);
  const advancePlaylistRef = useRef(() => {});
  const poem = poems[poemIndex];
  const lines = useMemo(() => poem.hiragana.split(/\r?\n/).filter(Boolean), [poem]);
  const transcriptionLines = useMemo(() => poem.transcription.split(/\r?\n/).filter(Boolean), [poem]);
  const secondHalfStart = poem.timings?.[1]?.[0] ?? 7.5;
  const readingEnd = (poem.timings?.[1]?.at(-1) ?? secondHalfStart + 5) + 0.9;

  const stopPlayback = () => {
    audioRef.current?.pause();
    cancelAnimationFrame(selfFrameRef.current);
    setPlaying(false);
    setPlaybackMode(null);
  };

  const selectPoem = (nextIndex) => {
    stopPlayback();
    setProgress(0);
    setCurrentTime(0);
    setSelfPhase(0);
    setPoemIndex((nextIndex + poems.length) % poems.length);
  };

  const advancePlaylist = () => {
    if (!playlist.length) return;
    const position = playlist.indexOf(poem.number);
    if (position >= 0 && position < playlist.length - 1) {
      window.setTimeout(() => selectPoem(playlist[position + 1] - 1), 350);
    }
  };
  advancePlaylistRef.current = advancePlaylist;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    let animationFrame;
    const update = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      if (!audio.paused) animationFrame = requestAnimationFrame(update);
    };
    const play = () => { cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(update); };
    const pause = () => cancelAnimationFrame(animationFrame);
    const end = () => { setPlaying(false); setPlaybackMode(null); setProgress(1); advancePlaylistRef.current(); };
    audio.addEventListener('play', play);
    audio.addEventListener('pause', pause);
    audio.addEventListener('ended', end);
    return () => {
      cancelAnimationFrame(animationFrame);
      audio.removeEventListener('play', play);
      audio.removeEventListener('pause', pause);
      audio.removeEventListener('ended', end);
    };
  }, [poem]);

  useEffect(() => () => cancelAnimationFrame(selfFrameRef.current), []);

  const toggleReader = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    cancelAnimationFrame(selfFrameRef.current);
    if (playing && playbackMode === 'reader') {
      audio.pause();
      setPlaying(false);
      return;
    }
    setPlaybackMode('reader');
    setSelfPhase(0);
    if (audio.ended) audio.currentTime = 0;
    await audio.play();
    setPlaying(true);
  };

  const runSelfReading = (from, to, phase) => {
    audioRef.current?.pause();
    cancelAnimationFrame(selfFrameRef.current);
    setPlaybackMode('self');
    setSelfPhase(phase);
    setPlaying(true);
    setCurrentTime(from);
    selfStartedAtRef.current = performance.now() - from * 1000;
    const tick = (now) => {
      const nextTime = Math.min(to, (now - selfStartedAtRef.current) / 1000);
      setCurrentTime(nextTime);
      setProgress(nextTime / readingEnd);
      if (nextTime >= to) {
        setPlaying(false);
        if (phase === 0) setSelfPhase(1);
        else { setSelfPhase(2); setProgress(1); advancePlaylist(); }
        return;
      }
      selfFrameRef.current = requestAnimationFrame(tick);
    };
    selfFrameRef.current = requestAnimationFrame(tick);
  };

  const toggleSelfReading = () => {
    if (playing && playbackMode === 'self') {
      cancelAnimationFrame(selfFrameRef.current);
      setPlaying(false);
      return;
    }
    if (selfPhase === 1) runSelfReading(secondHalfStart, readingEnd, 1);
    else if (selfPhase === 2) { setProgress(0); runSelfReading(0, secondHalfStart, 0); }
    else runSelfReading(currentTime < secondHalfStart ? currentTime : 0, secondHalfStart, 0);
  };

  const togglePlaylistCard = (number) => setPlaylist((current) => current.includes(number)
    ? current.filter((item) => item !== number)
    : [...current, number]);

  const shufflePlaylist = () => {
    if (playlist.length < 2) return;
    const shuffled = [...playlist];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    setPlaylist(shuffled);
    selectPoem(shuffled[0] - 1);
  };

  const applyPlaylistInput = () => {
    const selected = new Set();
    playlistInput.split(/[ ,;]+/).filter(Boolean).forEach((part) => {
      const range = part.match(/^(\d{1,3})-(\d{1,3})$/);
      if (range) {
        const start = Math.min(Number(range[1]), Number(range[2]));
        const end = Math.min(100, Math.max(Number(range[1]), Number(range[2])));
        for (let number = Math.max(1, start); number <= end; number += 1) selected.add(number);
      } else {
        const number = Number(part);
        if (number >= 1 && number <= 100) selected.add(number);
      }
    });
    setPlaylist([...selected].sort((left, right) => left - right));
  };

  const startPlaylist = () => {
    if (!playlist.length) return;
    setPlaylistOpen(false);
    selectPoem(playlist[0] - 1);
  };

  return (
    <main className="reading-page">
      <section className="reading-workspace">
        <div className="reading-visual">
          <div className="reading-heading-row">
            <span className="reading-counter">{String(poem.number).padStart(3, '0')} <small>/ 100</small></span>
            <div className="playlist-heading-actions">
              <button className="playlist-button" onClick={() => setPlaylistOpen(true)}><span>≡</span> Плейлист {playlist.length ? `· ${playlist.length}` : ''}</button>
              <button className="playlist-button shuffle-button" disabled={playlist.length < 2} onClick={shufflePlaylist} aria-label="Перемешать плейлист"><span>⇄</span> Shuffle</button>
            </div>
          </div>
          <div className="reading-image-frame"><img src={poem.image} alt={`Карта ${poem.number}`} /></div>
          <div className="reading-navigation">
            <button onClick={() => selectPoem(poemIndex - 1)} aria-label="Предыдущая карта">←</button>
            <input aria-label="Номер карты" type="range" min="1" max="100" value={poem.number} onChange={(event) => selectPoem(Number(event.target.value) - 1)} />
            <button onClick={() => selectPoem(poemIndex + 1)} aria-label="Следующая карта">→</button>
          </div>
        </div>

        <div className="reading-content">
          <span className="eyebrow">Караоке-чтение · {poem.kimariji}</span>
          <div className="reading-toggles" aria-label="Настройки отображения">
            <label><input type="checkbox" checked={showHiragana} onChange={(event) => setShowHiragana(event.target.checked)} /><span />Хирагана</label>
            <label><input type="checkbox" checked={showTranscription} onChange={(event) => setShowTranscription(event.target.checked)} /><span />Русская запись</label>
          </div>
          <div className="poem-karaoke">
            {lines.map((line, index) => (
              <div className="poem-line" key={`${poem.number}-${index}`}>
                {showHiragana && <KaraokeLine text={line} timings={poem.timings?.[index]} notation={poem.notation?.[index]} currentTime={currentTime} />}
                {showTranscription && (
                  <TranscriptionKaraokeLine
                    text={transcriptionLines[index]}
                    timings={poem.timings?.[index]}
                    currentTime={currentTime}
                  />
                )}
              </div>
            ))}
            {!showHiragana && !showTranscription && <p className="reading-empty">Включите отображение текста выше.</p>}
          </div>
          <div className="playback-buttons">
            <div className="reader-controls">
              <button className={`reader-play ${playing && playbackMode === 'reader' ? 'is-playing' : ''}`} onClick={toggleReader} aria-label="Воспроизведение с чтецом"><span>{playing && playbackMode === 'reader' ? 'Ⅱ' : '♪'}</span></button>
              <div><strong>{playing && playbackMode === 'reader' ? 'Чтец читает…' : 'С чтецом'}</strong><small>Запись и караоке</small></div>
            </div>
            <div className="reader-controls self-controls">
              <button className={`reader-play self-play ${playing && playbackMode === 'self' ? 'is-playing' : ''}`} onClick={toggleSelfReading} aria-label="Самостоятельное чтение"><span>{playing && playbackMode === 'self' ? 'Ⅱ' : '▶'}</span></button>
              <div><strong>{selfPhase === 1 && !playing ? 'Продолжить' : 'Самостоятельно'}</strong><small>{selfPhase === 1 && !playing ? 'Теперь вторая половина' : 'Караоке без звука'}</small></div>
            </div>
          </div>
          <div className="reading-progress"><i style={{ width: `${progress * 100}%` }} /></div>
          <audio ref={audioRef} src={poem.audio} preload="metadata" />
        </div>
      </section>

      {playlistOpen && (
        <div className="playlist-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPlaylistOpen(false)}>
          <section className="playlist-modal" role="dialog" aria-modal="true" aria-label="Создать плейлист">
            <header><div><span className="eyebrow">Карты для чтения</span><h2>Создать плейлист</h2></div><button onClick={() => setPlaylistOpen(false)} aria-label="Закрыть">×</button></header>
            <div className="playlist-quick-input"><input value={playlistInput} onChange={(event) => setPlaylistInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && applyPlaylistInput()} placeholder="Например: 1, 5, 12-20" /><button onClick={applyPlaylistInput}>Выбрать</button></div>
            <div className="playlist-tools"><div><button onClick={() => setPlaylist(poems.map((item) => item.number))}>Все 100</button><button onClick={() => setPlaylist([])}>Очистить</button></div><span>Выбрано: {playlist.length}</span></div>
            <div className="playlist-grid">{poems.map((item) => <button key={item.number} className={playlist.includes(item.number) ? 'is-selected' : ''} onClick={() => togglePlaylistCard(item.number)}>{item.number}</button>)}</div>
            <footer><button className="primary-button" disabled={!playlist.length} onClick={startPlaylist}>Начать</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
