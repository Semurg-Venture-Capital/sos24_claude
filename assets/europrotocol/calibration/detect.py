from PIL import Image
import statistics, sys, json

IMG = sys.argv[1] if len(sys.argv) > 1 else '/Users/odya/Documents/projects/sos24_claude/assets/europrotocol/calibration/tpl300-1.png'
PAGE_H = 841.89
PXPT = 0.24  # 72/300

im = Image.open(IMG).convert('L')
W, H = im.size
px = im.load()

def dark(x, y):
    return 1 if px[x, y] < 128 else 0

def detect(x0pt, x1pt, ybot, ytop, name=''):
    # px-границы ROI
    L = int(x0pt / PXPT); R = int(x1pt / PXPT)
    T = int((PAGE_H - ytop) / PXPT); B = int((PAGE_H - ybot) / PXPT)
    L=max(0,L); R=min(W-1,R); T=max(0,T); B=min(H-1,B)
    Wp = R-L; Hp = B-T
    # 1) горизонтальные линии боксов (верх/низ ряда)
    row_frac = []
    for y in range(T, B):
        d = sum(dark(x, y) for x in range(L, R))
        row_frac.append((y, d / Wp))
    # два самых "линейных" ряда = верх/низ боксов (раздвинутые > 6px)
    ranked = sorted(row_frac, key=lambda t: -t[1])
    top_line = ranked[0][0]
    bot_line = next((y for (y, f) in ranked if abs(y - top_line) > 6), top_line)
    if bot_line < top_line: top_line, bot_line = bot_line, top_line
    inner_t = top_line + 2; inner_b = max(bot_line - 2, top_line + 3)
    col_frac = []
    for x in range(L, R):
        d = sum(dark(x, y) for y in range(inner_t, inner_b))
        col_frac.append((x, d / max(1, inner_b - inner_t)))
    maxf = max(f for _, f in col_frac) or 1
    border_cols = [x for (x, f) in col_frac if f > 0.55 * maxf and f > 0.3]
    # сгруппировать соседние пиксели в один центр границы
    centers = []
    grp = []
    for x in border_cols:
        if grp and x - grp[-1] > 3:
            centers.append(sum(grp)/len(grp)); grp = []
        grp.append(x)
    if grp: centers.append(sum(grp)/len(grp))
    if len(centers) < 2:
        return {'name': name, 'found': False, 'lines': (top_line, bot_line)}
    diffs = [centers[i+1]-centers[i] for i in range(len(centers)-1)]
    pitch_px = statistics.median(diffs)
    cells = len(centers) - 1
    x_first_pt = round(centers[0] * PXPT, 1)
    pitch_pt = round(pitch_px * PXPT, 2)
    baseline_pt = round(PAGE_H - bot_line * PXPT + 3, 1)
    box_top_pt = round(PAGE_H - top_line * PXPT, 1)
    return {'name': name, 'found': True, 'cells': cells, 'pitch': pitch_pt,
            'x_first': x_first_pt, 'baseline': baseline_pt, 'box_top': box_top_pt}

# ROIs колонки A (pt): (x0,x1,ybot,ytop)
ROIS = [
    ('A.body_no',      16, 246, 585, 606),
    ('A.engine_no',    16, 246, 550, 571),
    ('A.regstate_no',  130,246, 527, 548),
    ('A.regcert_ser',  95, 150, 503, 524),
    ('A.regcert_no',   150,246, 503, 524),
]
out = [detect(*r[1:], name=r[0]) for r in ROIS]
print(json.dumps(out, ensure_ascii=False, indent=1))
