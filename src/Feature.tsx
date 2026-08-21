import { useEffect, useMemo, useState } from "react";
import {
  MeshNameInput,
  createClockSync,
  useNamedPeer,
  useReactions,
  useRoster,
  useRotatingTurn,
  useSharedTimer,
  type MeshConfig,
  type YRoom,
} from "@baditaflorin/mesh-common";

export const CARDS = [
  { word: "Volcano", taboo: ["lava", "mountain", "eruption"] },
  { word: "Bicycle", taboo: ["wheel", "ride", "pedal"] },
  { word: "Library", taboo: ["books", "quiet", "read"] },
  { word: "Thunder", taboo: ["lightning", "storm", "loud"] },
] as const;
const TURN_MS = 45_000;
export const cardForRound = (n: number) => CARDS[Math.abs(n) % CARDS.length] ?? CARDS[0];
type Props = { room: YRoom | null; config: MeshConfig };
export function Feature({ room, config }: Props) {
  const named = useNamedPeer(config, room),
    roster = useRoster(room),
    clock = useMemo(() => createClockSync(room?.provider ?? null), [room?.provider]);
  useEffect(() => () => clock.destroy(), [clock]);
  const turn = useRotatingTurn(room, clock, { slotMs: TURN_MS, order: "shuffle" }),
    timer = useSharedTimer(room, "mesh-taboo-clues:timer", { durationMs: TURN_MS, clock }),
    flags = useReactions(room, "taboo-flags"),
    [rev, setRev] = useState(0);
  useEffect(() => {
    if (!room) return;
    const m = room.doc.getMap<number>("mesh-taboo-clues:solved"),
      f = () => setRev((x) => x + 1);
    m.observe(f);
    return () => m.unobserve(f);
  }, [room]);
  void rev;
  const card = cardForRound(turn.slotId),
    id = `card-${turn.slotId}`,
    current = turn.currentPeerId
      ? named.nameOf(turn.currentPeerId) || `Player ${turn.currentPeerId.slice(0, 4)}`
      : "Waiting for players",
    violations = flags.countsFor(id).flag ?? 0,
    solved = room?.doc.getMap<number>("mesh-taboo-clues:solved").get(id);
  const start = () => timer.start(TURN_MS),
    flag = () => flags.toggle(id, "flag"),
    solve = () => {
      if (room && turn.isMyTurn && !solved)
        room.doc.getMap<number>("mesh-taboo-clues:solved").set(id, Date.now());
    };
  return (
    <main className="taboo-page">
      <section className="taboo-hero">
        <p>Peer-to-peer party game</p>
        <h1>
          Say the clue.
          <br />
          Not the forbidden word.
        </h1>
        <span>
          ● {room ? `${Math.max(1, roster.present.length)} players here` : "Joining room…"}
        </span>
      </section>
      <section className="taboo-grid">
        <section className="clue-card">
          <div className="round">
            <span>{turn.isMyTurn ? "Your clue turn" : `${current}'s clue turn`}</span>
            <b>{timer.remainingMs == null ? "45s" : `${Math.ceil(timer.remainingMs / 1000)}s`}</b>
          </div>
          <div className="clock">
            <i style={{ transform: `scaleX(${Math.min(1, timer.elapsedMs / TURN_MS)})` }} />
          </div>
          <p className="label">Get everyone to guess</p>
          <h2>{card.word}</h2>
          <p className="label">You cannot say</p>
          <ul>
            {card.taboo.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          {turn.isMyTurn ? (
            <button className="solve" onClick={solve} disabled={!room || !!solved}>
              {solved ? "Solved!" : "They guessed it!"}
            </button>
          ) : (
            <button
              className="flag"
              onClick={flag}
              disabled={!room}
              aria-pressed={flags.myReactionsOn(id).has("flag")}
            >
              🚩 {flags.myReactionsOn(id).has("flag") ? "Flagged" : "Flag a taboo word"}
              {violations ? ` · ${violations}` : ""}
            </button>
          )}
          <button className="start" onClick={start} disabled={!room}>
            {timer.state === "running" ? "Restart round" : "Start shared round"}
          </button>
        </section>
        <aside className="side">
          <p className="label">Fair rotation</p>
          <h2>
            Next: {turn.nextPeerId ? named.nameOf(turn.nextPeerId) || "another player" : "waiting"}
          </h2>
          <ol>
            {turn.order.map((p) => (
              <li key={p}>
                {named.nameOf(p) || `Player ${p.slice(0, 4)}`}
                {p === turn.currentPeerId && <b>giving clues</b>}
              </li>
            ))}
          </ol>
          <MeshNameInput
            label="Display name"
            value={named.name}
            onChange={named.setName}
            placeholder="Name for this room"
            maxLength={24}
            showCounter
          />
        </aside>
      </section>
    </main>
  );
}
