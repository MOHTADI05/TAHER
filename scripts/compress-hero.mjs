import { execFileSync } from "node:child_process";
import ffmpeg from "ffmpeg-static";

const input = "assets/3999401-hd_1920_1080_24fps.mp4";
const common = ["-y", "-i", input, "-an", "-movflags", "+faststart"];

execFileSync(
  ffmpeg,
  [...common, "-vf", "scale=-2:720", "-c:v", "libx264", "-crf", "28", "-preset", "fast", "assets/hero-bg.mp4"],
  { stdio: "inherit" }
);

execFileSync(
  ffmpeg,
  [...common, "-vf", "scale=-2:480", "-c:v", "libx264", "-crf", "30", "-preset", "fast", "assets/hero-bg-mobile.mp4"],
  { stdio: "inherit" }
);
