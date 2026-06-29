"use client";
export default function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div style={{
        position: "absolute", width: 700, height: 700, borderRadius: "50%",
        background: "rgba(0,0,0,0.055)", filter: "blur(110px)",
        top: -200, right: -150,
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "rgba(0,0,0,0.04)", filter: "blur(90px)",
        bottom: -100, left: -100,
      }} />
      <div style={{
        position: "absolute", width: 350, height: 350, borderRadius: "50%",
        background: "rgba(0,0,0,0.035)", filter: "blur(80px)",
        top: "40%", left: "30%",
      }} />
    </div>
  );
}
