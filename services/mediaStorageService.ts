import fs from "fs";
import path from "path";
import crypto from "crypto";

export function getGeneratedMediaDir(): string {
  const baseDir = process.env.PERSISTENT_DATA_DIR || path.join(process.cwd(), "data");
  const mediaDir = path.join(baseDir, "generated_media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  return mediaDir;
}

export function saveGeneratedMedia(
  dataUrlOrBase64: string,
  brandSlug = "tito"
): { filename: string; localPath: string; publicPath: string; publicUrl: string } {
  const safeSlug = String(brandSlug || "tito")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 32);

  let ext = "png";
  let rawBase64 = dataUrlOrBase64;
  const match = dataUrlOrBase64.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
  if (match) {
    ext = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
    rawBase64 = match[2];
  }

  const hash = crypto.randomBytes(4).toString("hex");
  const filename = `${safeSlug}_${Date.now()}_${hash}.${ext}`;
  const mediaDir = getGeneratedMediaDir();
  const localPath = path.join(mediaDir, filename);

  fs.writeFileSync(localPath, Buffer.from(rawBase64, "base64"));

  const publicPath = `/media/generated/${filename}`;
  const baseOrigin = (
    process.env.PUBLIC_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    ""
  ).replace(/\/+$/, "");
  const publicUrl = baseOrigin ? `${baseOrigin}${publicPath}` : publicPath;

  return { filename, localPath, publicPath, publicUrl };
}
