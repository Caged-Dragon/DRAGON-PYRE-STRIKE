export default function Embers() {
  const bits = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((i) => {
        const left = `${(i * 37) % 100}%`;
        const delay = `${(i * 0.47) % 8}s`;
        const dur = `${9 + (i % 7)}s`;
        const size = 2 + (i % 4);
        return (
          <span
            key={i}
            className="absolute bottom-[-20px] rounded-full bg-orange-400"
            style={{
              left,
              width: size,
              height: size,
              animation: `ember-rise ${dur} linear ${delay} infinite`,
              ["--drift" as string]: `${(i % 2 === 0 ? 1 : -1) * (12 + (i % 18))}px`,
              boxShadow: "0 0 8px 2px rgba(255,120,30,0.7)",
              opacity: 0.8,
            }}
          />
        );
      })}
    </div>
  );
}
