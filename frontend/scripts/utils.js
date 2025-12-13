export function resolveIPFS(url) {
  if (!url) return "";

  if (url.startsWith("ipfs://")) {
    const clean = url
      .replace("ipfs://", "")
      .replace(/^\/+/, "")      // bỏ slash đầu
      .replace(/\/{2,}/g, "/"); // gộp // → /

    return `https://ipfs.io/ipfs/${clean}`;
  }

  return url;
}

export function autoFixIPFS(uri) {
  if (!uri.startsWith("ipfs://")) return uri;

  const raw = uri.replace("ipfs://", "");
  if (raw.includes("piece_metadata") && !raw.includes("/piece_metadata")) {
    return "ipfs://" + raw.replace("piece_metadata", "/piece_metadata");
  }
  return uri;
}

