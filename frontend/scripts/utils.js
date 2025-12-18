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

export function autoFixIPFS(uri, baseTokenURI) {
  if (!uri || !baseTokenURI) return uri;
  if (!uri.startsWith("ipfs://")) return uri;

  // Chuẩn hóa baseTokenURI (không kết thúc bằng /)
  const base = baseTokenURI.endsWith("/")
    ? baseTokenURI.slice(0, -1)
    : baseTokenURI;

  // Nếu đã đúng dạng baseTokenURI/... → OK
  if (uri.startsWith(base + "/")) {
    return uri;
  }

  // Bóc phần sau ipfs://
  const raw = uri.replace("ipfs://", "");

  // Bóc CID từ baseTokenURI
  const baseRaw = base.replace("ipfs://", "");
  const cid = baseRaw.split("/")[0];
  const folder = baseRaw.replace(cid, "");

  // Nếu uri = ipfs://CIDfolder/file.json → thiếu /
  if (raw.startsWith(cid) && !raw.startsWith(cid + "/")) {
    return `ipfs://${cid}${folder}/${raw.slice(cid.length)}`;
  }

  return uri;
}

export function extractErrorMessage(error) {
  try {
    // Case 1: Ethers v6 — error.revert?.args
    if (error?.revert?.args && error.revert.args.length > 0) {
      return error.revert.args[0]; // "Max ticket reached"
    }

    // Case 2: Ethers v5 style — error.error.body
    const body = error?.error?.body;
    if (body) {
      const bodyJson = JSON.parse(body);
      const reason = bodyJson?.error?.data?.reason;
      if (reason) return reason;
    }

    // Case 3: MetaMask error
    if (error?.data?.message) {
      return error.data.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }

    // Case 4: Fallback to generic message
    if (error?.reason) return error.reason;
    if (error?.message) return error.message;

    return "❌ Unknown error occurred";
  } catch (err) {
    return "❌ Unknown error occurred";
  }
}