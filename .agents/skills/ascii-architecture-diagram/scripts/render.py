#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""运行蓝图渲染器：输入 spec JSON（文件参数或 stdin），输出全边框分层架构图。

对齐保证（不可破坏的三条约定）：
1. 中文/全角 = 2 显示列，ASCII/制表符 = 1 显示列，所有边框由同一 w() 派生
2. 盒内每一行都带左右边框——不允许裸行拼接（那是"边框缺失"的根源）
3. 连接线注释显示宽度不得超过盒宽，超宽则 stderr 报警并以退出码 1 结束

spec 结构见同级 SKILL.md。
"""
import json
import sys

CANVAS_W = 78   # 默认盒宽（可被 spec.width 覆盖）
CONN = 31       # 默认层间连线所在显示列（可被 spec.conn 覆盖）

def w(s):
    """显示宽度：CJK/全角 = 2；ASCII、制表符、几何符号 = 1"""
    n = 0
    for c in s:
        cp = ord(c)
        wide = (0x1100 <= cp <= 0x115F or 0x2E80 <= cp <= 0xA4CF or
                0xAC00 <= cp <= 0xD7A3 or 0xF900 <= cp <= 0xFAFF or
                0xFE30 <= cp <= 0xFE4F or 0xFF00 <= cp <= 0xFF60 or
                0xFFE0 <= cp <= 0xFFE6)
        n += 2 if wide else 1
    return n

def patch(line, col, ch):
    """把 line 的第 col 显示列替换为 ch"""
    cur = 0
    for i, c in enumerate(line):
        if cur == col:
            return line[:i] + ch + line[i + 1:]
        cur += w(c)
        if cur > col:
            return line
    return line

def build_table(widths, headers, rows, indent=2):
    """小表格：widths 为各列内宽，行/表头由渲染器自动补齐，保证内竖线对齐"""
    def sep(l, m, r):
        return ' ' * indent + l + m.join('─' * x for x in widths) + r
    def row(cells):
        cells = list(cells) + [''] * (len(widths) - len(cells))
        body = '│'.join(' ' + c + ' ' * (widths[i] - 2 - w(c)) + ' '
                        for i, c in enumerate(cells))
        return ' ' * indent + '│' + body + '│'
    out = [sep('┌', '┬', '┐'), row(headers), sep('├', '┼', '┤')]
    for r in rows:
        out.append(row(r))
    out.append(sep('└', '┴', '┘'))
    return out

def build_layer(title, lines, width):
    """全边框层盒：居中层名 + 内容行（每行都带左右边框）"""
    t = f"【{title}】"
    pad = (width - 2 - w(t)) // 2
    out = ['┌' + '─' * (width - 2) + '┐',
           '│' + ' ' * pad + t + ' ' * (width - 2 - w(t) - pad) + '│',
           '│' + ' ' * (width - 2) + '│']
    for l in lines:
        if isinstance(l, dict) and 'table' in l:
            tb = l['table']
            for tl in build_table(tb['widths'], tb['headers'], tb['rows'],
                                  tb.get('indent', 2)):
                out.append('│ ' + tl + ' ' * max(0, width - 3 - w(tl)) + '│')
        else:
            out.append('│ ' + l + ' ' * max(0, width - 3 - w(l)) + '│')
    out.append('└' + '─' * (width - 2) + '┘')
    return out

def render(spec):
    width = spec.get('width', CANVAS_W)
    conn = spec.get('conn', CONN)
    out = []
    for it in spec['items']:
        typ = it['type']
        if typ == 'layer':
            layer = build_layer(it['title'], it.get('lines', []), width)
            if it.get('tee'):
                layer[-1] = patch(layer[-1], conn, '┬')
            out += layer
        elif typ == 'conn':
            for t in it.get('texts', []):
                out.append(' ' * conn + '│ ' + t)
            arrow = it.get('arrow', '▼')
            if arrow:
                out.append(' ' * conn + arrow)
        elif typ == 'blank':
            out.append('')
        else:
            raise ValueError(f'未知 item 类型: {typ}')
    return out

def main():
    if len(sys.argv) > 1:
        spec = json.load(open(sys.argv[1], encoding='utf-8'))
    else:
        spec = json.load(sys.stdin)
    lines = render(spec)
    text = '\n'.join(lines)
    print(text)
    over = [(i + 1, w(l)) for i, l in enumerate(lines) if w(l) > spec.get('width', CANVAS_W)]
    if over:
        for n, x in over:
            print(f'OVERWIDTH: 第 {n} 行宽 {x}（超出 {spec.get("width", CANVAS_W)}）——精简该行文字',
                  file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
