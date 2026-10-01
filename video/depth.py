"""Monocular depth (Depth Anything V2 small, ONNX) for 2.5D parallax on stills. Cached per image."""
import os, hashlib
import numpy as np, cv2, onnxruntime as ort
from PIL import Image
_sess = None
CACHE = "media/depth"
def depth(path):
    os.makedirs(CACHE, exist_ok=True)
    out = os.path.join(CACHE, hashlib.md5(path.encode()).hexdigest() + ".npy")
    if os.path.exists(out): return np.load(out)
    global _sess
    if _sess is None:
        _sess = ort.InferenceSession(os.path.join(os.path.dirname(os.path.abspath(__file__)), "voices/depth_anything_v2_small.onnx"))
    im = Image.open(path).convert("RGB"); w, h = im.size
    s = 518 / max(w, h); iw, ih = int(round(w * s / 14)) * 14, int(round(h * s / 14)) * 14
    x = np.asarray(im.resize((iw, ih), Image.BICUBIC), np.float32) / 255
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    d = _sess.run(None, {"pixel_values": x.transpose(2, 0, 1)[None].astype(np.float32)})[0][0]
    d = cv2.resize(d, (w // 4, h // 4), interpolation=cv2.INTER_CUBIC)
    d = (d - np.percentile(d, 2)) / (np.percentile(d, 98) - np.percentile(d, 2) + 1e-6)
    d = cv2.GaussianBlur(np.clip(d, 0, 1).astype(np.float32), (0, 0), 3)   # soft edges = fewer tearing artifacts
    np.save(out, d); return d
if __name__ == "__main__":
    import sys
    for p in sys.argv[1:]:
        d = depth(p); Image.fromarray(np.uint8(d * 255)).save("/tmp/claude-0/-home-user-proyecto-prueba/1107b7b9-3ce4-5542-b88b-85fbda77bfa7/scratchpad/depth_" + os.path.basename(p)); print(p, d.shape)
