import type { Album } from "@/lib/albums";

type Mission = { title: string; text: string; album: string };

// A mission's picture is the first photo of the album named in its "Album" cell, if there is one.
export function MissionCards({ missions, albums }: { missions: Mission[]; albums: Album[] }) {
  return (
    <ul className="missions">
      {missions.map((m) => {
        const album = m.album ? albums.find((a) => a.title.toLowerCase().includes(m.album.toLowerCase())) : undefined;
        return (
          <li className="mission-card" key={m.title}>
            {album && (
              <div className="img">
                <img src={album.photos[0].preview} alt="" loading="lazy" />
              </div>
            )}
            <div className="body">
              <h3>{m.title}</h3>
              <p>{m.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
