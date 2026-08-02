import crypto from 'node:crypto';

const ARTIFACTS = {
  kubectl: {
    url: 'https://dl.k8s.io/v1.36.2/bin/linux/amd64/kubectl',
    sha256: '1e9045ec32bea85da43de85f0065358529ea7c7a152eca78154fba5b58c27d82'
  }
};

export default async function handler(req, res) {
  const key = String(req.query.artifact || '');
  const artifact = ARTIFACTS[key];
  if (!artifact) return res.status(404).json({ error: 'unknown artifact' });

  const offset = Math.max(0, Number.parseInt(String(req.query.offset || '0'), 10) || 0);
  const requested = Math.max(1, Number.parseInt(String(req.query.length || '3000000'), 10) || 3000000);
  const length = Math.min(requested, 3000000);
  const end = offset + length - 1;

  const upstream = await fetch(artifact.url, {
    headers: { Range: `bytes=${offset}-${end}`, 'User-Agent': 'CONTROL12-verified-relay/1.0' },
    redirect: 'follow'
  });
  if (!(upstream.ok || upstream.status === 206)) {
    return res.status(502).json({ error: `upstream ${upstream.status}` });
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  const contentRange = upstream.headers.get('content-range');
  const total = contentRange && contentRange.includes('/')
    ? Number.parseInt(contentRange.split('/').pop(), 10)
    : Number.parseInt(upstream.headers.get('content-length') || String(body.length), 10);

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.status(200).json({
    artifact: key,
    offset,
    bytes: body.length,
    total,
    expectedSha256: artifact.sha256,
    chunkSha256: crypto.createHash('sha256').update(body).digest('hex'),
    data: body.toString('base64')
  });
}
