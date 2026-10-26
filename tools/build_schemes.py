# -*- coding: utf-8 -*-
"""
反应式生成器：SMILES + 条件 → ChemDraw CDXML

用法：
    python tools/build_schemes.py              # 生成 tools/out/*.cdxml
    pwsh -File tools/export_schemes.ps1        # 再用 ChemDraw 导出 PNG + SVG

原理：
    1. RDKit 计算每个分子的 2D 坐标（Kekulé 式，避免芳香键被画成单键）
    2. 自己算排版：反应物 + 反应物 --箭头(条件)--> 产物 + 副产物
    3. 输出 ChemDraw 原生 CDXML；ChemDraw 负责最终渲染与导出
    4. 箭头上/下的条件以「箭头中点」为基准居中（ChemDraw 会忽略文本居中属性，
       所以这里按文字宽度手动对中）
"""
import json
import os
import sys

from rdkit import Chem
from rdkit.Chem import AllChem
from PIL import ImageFont
from xml.sax.saxutils import escape

BL = 16.0          # 键长 pt
FONT = 3           # ChemDraw 字体 id：3 = Arial
SIZE = 10
Y_OFF = 90.0       # 整张图向下平移，避免负坐标
GAP = 24.0         # 加号两侧留白
PAD = 20.0         # 箭头两侧留白
X_OFF = 60.0       # 左侧留白

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, 'out')


# ---------------------------------------------------------------- 工具函数
def mol2d(smiles):
    m = Chem.MolFromSmiles(smiles)
    if m is None:
        raise ValueError(f'无法解析 SMILES: {smiles}')
    m = Chem.AddHs(m)
    AllChem.Compute2DCoords(m)
    m = Chem.RemoveHs(m)
    AllChem.Compute2DCoords(m)
    Chem.Kekulize(m, clearAromaticFlags=True)
    return m


def scaled_points(mol):
    """RDKit 坐标（Å, y 向上）→ CDXML 坐标（pt, y 向下）"""
    conf = mol.GetConformer()
    return [
        (conf.GetAtomPosition(i).x * BL / 1.5, -conf.GetAtomPosition(i).y * BL / 1.5)
        for i in range(mol.GetNumAtoms())
    ]


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def text_width(text, size):
    for path in ('C:/Windows/Fonts/arial.ttf', 'C:/Windows/Fonts/msyh.ttc'):
        try:
            f = ImageFont.truetype(path, int(size))
            return f.getlength(text) * 0.985
        except OSError:
            continue
    return len(text) * size * 0.55


class Ids:
    def __init__(self, start=10):
        self.n = start

    def take(self):
        v = self.n
        self.n += 1
        return v


def fragment(mol, pts, x_left, y_center, ids):
    """输出 <fragment>：整体水平从 x_left 开始，竖直中心对齐 y_center"""
    x0, y0, x1, y1 = bbox(pts)
    dx = x_left - x0
    dy = y_center - (y0 + y1) / 2
    atom_ids = {}
    nodes, bonds = [], []

    for i, (x, y) in enumerate(pts):
        aid = ids.take()
        atom_ids[i] = aid
        atom = mol.GetAtomWithIdx(i)
        z = atom.GetAtomicNum()
        chg = atom.GetFormalCharge()
        attrs = ''
        if z != 6:
            # 杂原子必须写清元素、电荷与氢数，否则 ChemDraw 会自己「补」成别的结构
            # （例如硝基会被画成硝酸式、叠氮会被补成 HN=N=N）
            attrs += f' Element="{z}" NumHydrogens="{atom.GetTotalNumHs()}"'
        if chg:
            attrs += f' Charge="{chg}"'
        nodes.append(f'<n id="{aid}" p="{x + dx:.2f} {y + dy + Y_OFF:.2f}"{attrs}/>')

    for b in mol.GetBonds():
        bonds.append(
            f'<b id="{ids.take()}" B="{atom_ids[b.GetBeginAtomIdx()]}" '
            f'E="{atom_ids[b.GetEndAtomIdx()]}" Order="{b.GetBondTypeAsDouble():g}"/>'
        )

    fid = ids.take()
    xml = f'<fragment id="{fid}">' + ''.join(nodes) + ''.join(bonds) + '</fragment>'
    return xml, (x1 - x0), (y1 - y0)


def text(x, y, s, ids, size=SIZE, center=False):
    tid = ids.take()
    px = x - text_width(s, size) / 2 if center else x
    return (
        f'<t id="{tid}" p="{px:.2f} {y + Y_OFF:.2f}" Justification="Left" LabelJustification="Left">'
        f'<s font="{FONT}" size="{size}" color="0" face="96">{escape(s)}</s></t>'
    )


def arrow(a0, a1, y, ids, vertical=False):
    """ChemDraw 箭头：BoundingBox 为包围盒，Head3D 是箭头尖端，Tail3D 是尾端"""
    if vertical:
        box = f'{a0 - 2.7:.2f} {a1:.2f} {a0 + 2.7:.2f} {a1:.2f}'
        head = f'{a0:.2f} {a1:.2f} 0'
        tail = f'{a0:.2f} {y:.2f} 0'
        center = f'{a0 + 60:.2f} {a1 + 60:.2f} 0'
        major = f'{a0 + 60:.2f} {a1 + 80:.2f} 0'
        minor = f'{a0 + 80:.2f} {a1 + 60:.2f} 0'
        box = f'{a0 - 2.7:.2f} {min(y, a1) + Y_OFF:.2f} {a0 + 2.7:.2f} {max(y, a1) + Y_OFF:.2f}'
        head = f'{a0:.2f} {a1 + Y_OFF:.2f} 0'
        tail = f'{a0:.2f} {y + Y_OFF:.2f} 0'
    else:
        box = f'{a0:.2f} {y - 2.7 + Y_OFF:.2f} {a1:.2f} {y + 2.7 + Y_OFF:.2f}'
        head = f'{a1:.2f} {y + Y_OFF:.2f} 0'
        tail = f'{a0:.2f} {y + Y_OFF:.2f} 0'
        center = f'{a1 + 60:.2f} {y + 60 + Y_OFF:.2f} 0'
        major = f'{a1 + 80:.2f} {y + 60 + Y_OFF:.2f} 0'
        minor = f'{a1 + 60:.2f} {y + 80 + Y_OFF:.2f} 0'

    return (
        f'<arrow id="{ids.take()}" BoundingBox="{box}" FillType="None" '
        f'ArrowheadHead="Full" ArrowheadType="Solid" HeadSize="1000" '
        f'ArrowheadCenterSize="875" ArrowheadWidth="250" '
        f'Head3D="{head}" Tail3D="{tail}" Center3D="{center}" '
        f'MajorAxisEnd3D="{major}" MinorAxisEnd3D="{minor}"/>'
    )


# ---------------------------------------------------------------- 排版
def build_horizontal(item, ids, parts):
    mols = [(mol2d(s), s) for s in item['reactants']]
    prods = [(mol2d(s), s) for s in item['products']]

    x = X_OFF
    widths = []
    for i, (m, _) in enumerate(mols):
        xml, w, _h = fragment(m, scaled_points(m), x, 0.0, ids)
        parts.append(xml)
        x += w
        widths.append(w)
        if i < len(mols) - 1:
            x += GAP
            parts.append(text(x, 4.0, '+', ids, center=True))
            x += GAP

    cond_w = max(
        text_width(item.get('above') or '', SIZE - 1),
        text_width(item.get('below') or '', SIZE - 1),
    )
    a0 = x + PAD
    a1 = a0 + max(70.0, cond_w + 34.0)
    parts.append(arrow(a0, a1, 0.0, ids))
    cx = (a0 + a1) / 2
    if item.get('above'):
        parts.append(text(cx, -18.0, item['above'], ids, SIZE - 1, center=True))
    if item.get('below'):
        parts.append(text(cx, 20.0, item['below'], ids, SIZE - 1, center=True))

    x = a1 + PAD
    for i, (m, _) in enumerate(prods):
        xml, w, _h = fragment(m, scaled_points(m), x, 0.0, ids)
        parts.append(xml)
        x += w
        if i < len(prods) - 1:
            x += GAP
            parts.append(text(x, 4.0, '+', ids, center=True))
            x += GAP
    return x


def build_vertical(item, ids, parts):
    """竖排：反应物一行 → 向下箭头（条件写在右侧）→ 产物一行，适合手机窄屏"""
    mols = [mol2d(s) for s in item['reactants']]
    prods = [mol2d(s) for s in item['products']]

    def row_width(ms):
        ws = [bbox(scaled_points(m))[2] - bbox(scaled_points(m))[0] for m in ms]
        return sum(ws) + GAP * 2 * (len(ms) - 1), ws

    wr, ws_r = row_width(mols)
    wp, ws_p = row_width(prods)
    total_w = max(wr, wp) + X_OFF * 2
    center_x = total_w / 2

    # 反应物
    x = center_x - wr / 2
    max_h = 0
    for i, m in enumerate(mols):
        pts = scaled_points(m)
        _x0, y0, _x1, y1 = bbox(pts)
        max_h = max(max_h, y1 - y0)
        xml, w, _h = fragment(m, pts, x, 0.0, ids)
        parts.append(xml)
        x += w
        if i < len(mols) - 1:
            x += GAP
            parts.append(text(x, 4.0, '+', ids, center=True))
            x += GAP

    top_of_arrow = max_h / 2 + 20.0
    arrow_len = 70.0
    bottom_of_arrow = top_of_arrow + arrow_len
    parts.append(arrow(center_x, bottom_of_arrow, top_of_arrow, ids, vertical=True))

    cond_x = center_x + 14.0
    mid = (top_of_arrow + bottom_of_arrow) / 2
    if item.get('above'):
        parts.append(text(cond_x, mid - 16.0, item['above'], ids, SIZE - 1))
    if item.get('below'):
        parts.append(text(cond_x, mid + 6.0, item['below'], ids, SIZE - 1))

    # 产物
    prod_center_y = bottom_of_arrow + 42.0
    x = center_x - wp / 2
    for i, m in enumerate(prods):
        xml, w, _h = fragment(m, scaled_points(m), x, prod_center_y, ids)
        parts.append(xml)
        x += w
        if i < len(prods) - 1:
            x += GAP
            parts.append(text(x, prod_center_y + 4.0, '+', ids, center=True))
            x += GAP

    return total_w


def build_one(item, out_path):
    ids = Ids()
    parts = []
    layout = item.get('layout', 'auto')

    # auto：先按横排算宽度，超过手机列宽（约 430pt）就自动改成竖排，
    # 否则等比缩放到 343px 时字号会小到看不清
    if layout == 'auto':
        probe_parts = []
        width = build_horizontal(item, Ids(), probe_parts)
        layout = 'vertical' if width > 430 else 'horizontal'

    if layout == 'vertical':
        width = build_vertical(item, ids, parts)
        height = 340.0
    else:
        width = build_horizontal(item, ids, parts)
        height = 200.0

    doc = (
        f'<CDXML CreationProgram="DSH Scheme Builder" Name="{item["id"]}.cdxml" '
        f'BoundingBox="0 0 {width + 20:.2f} {Y_OFF * 2:.2f}" FractionalWidths="yes" '
        f'InterpretChemically="yes" ShowTerminalCarbonLabels="no" '
        f'LabelFont="{FONT}" LabelSize="{SIZE}" BondLength="{BL}" BondSpacing="18">'
        '<page id="1">' + ''.join(parts) + '</page></CDXML>'
    )
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(doc)
    return width, height


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(HERE, 'schemes.json'), encoding='utf-8') as f:
        items = json.load(f)

    only = sys.argv[1] if len(sys.argv) > 1 else None
    for item in items:
        if only and item['id'] != only:
            continue
        path = os.path.join(OUT_DIR, f'{item["id"]}.cdxml')
        build_one(item, path)
        print(f'  cdxml  {item["id"]}')
    print(f'完成：{OUT_DIR}')


if __name__ == '__main__':
    main()
