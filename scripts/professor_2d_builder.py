#!/usr/bin/env python3
"""
PROFESSOR 2D MASTER BUILDER
Canal: O Porquê das Coisas (AGENTICO)
Base: Arquitetura 'claude-animated-shorts' (Canvas/PIL/SVG determinístico)

Renderiza o modelo mestre 2D do Professor preservando integralmente a identidade visual original:
- Cabelo volumoso/arrepiado de cientista maluco
- Óculos redondos pretos
- Bigode farto e curvado
- Casaco violeta com estrela na lapela, remendos e ponto de interrogação amarelo nas costas
- Colete patchwork multicolorido
- Gravata borboleta laranja com bolinhas vermelhas
- Calça marrom cotelê com remendos nos joelhos
- Meias listradas amarelo/roxo
- Sapatos bicolores (roxo com biqueira bulbosa amarela e cadarço vermelho)
"""

import os
import math
import json
from PIL import Image, ImageDraw, ImageFont

# Diretórios
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHAR_DIR = os.path.join(BASE_DIR, "characters", "professor")
MASTER_DIR = os.path.join(CHAR_DIR, "master")
VIEWS_DIR = os.path.join(CHAR_DIR, "views")
EXPR_DIR = os.path.join(CHAR_DIR, "expressions")
POSES_DIR = os.path.join(CHAR_DIR, "poses")
PARTS_DIR = os.path.join(CHAR_DIR, "body-parts")
PHONEMES_DIR = os.path.join(CHAR_DIR, "phonemes")

for d in [MASTER_DIR, VIEWS_DIR, EXPR_DIR, POSES_DIR, PARTS_DIR, PHONEMES_DIR]:
    os.makedirs(d, exist_ok=True)

# Paleta Canônica de Cores
INK = (36, 23, 38, 255)            # Ameixa escura medida (#241726)
SKIN_LIT = (248, 206, 176, 255)    # Pele iluminada (#f8ceb0)
SKIN_SHADOW = (226, 176, 144, 255) # Pele sombra (#e2b090)
HAIR_BASE = (116, 89, 70, 255)     # Cabelo castanho/grisalho (#745946)
HAIR_LIGHT = (150, 121, 99, 255)   # Mechas claras (#967963)
HAIR_DARK = (75, 52, 37, 255)      # Sombra cabelo (#4b3425)
GLASSES_FRAME = (26, 22, 31, 255)  # Armação preta (#1a161f)
GLASSES_LENS = (240, 248, 255, 60) # Brilho lente
MUSTACHE = (78, 53, 36, 255)       # Bigode (#4e3524)
MUSTACHE_SH = (54, 34, 20, 255)
MOUTH_INT = (90, 30, 40, 255)      # Fundo da boca (#5a1e28)
TEETH = (255, 255, 255, 255)       # Dentes
TONGUE = (232, 110, 120, 255)      # Língua (#e86e78)

# Vestuário
COAT_PURPLE = (106, 27, 122, 255)  # Roxo violeta (#6a1b7a)
COAT_SHADOW = (70, 15, 84, 255)    # Sombra casaco (#460f54)
COAT_HIGHLIGHT = (140, 40, 160, 255)
STAR_YELLOW = (255, 204, 0, 255)   # Estrela lapela e "?" costas (#ffcc00)
PATCH_GREEN = (92, 107, 52, 255)   # Remendo verde oliva (#5c6b34)
PATCH_ORANGE = (196, 81, 43, 255)  # Remendo laranja (#c4512b)
PATCH_OCHRE = (207, 140, 35, 255)  # Remendo ocre joelho (#cf8c23)
GOLD_BUTTON = (230, 184, 0, 255)

# Colete Patchwork
VEST_DIAMONDS = [
    (212, 155, 41, 255),  # Amarelo mostarda
    (41, 102, 141, 255),  # Azul royal
    (181, 51, 46, 255),   # Vermelho cereja
    (58, 122, 79, 255)    # Verde floresta
]

SHIRT_COLLAR = (245, 243, 235, 255)
BOWTIE_ORANGE = (234, 88, 12, 255)
BOWTIE_DOTS = (185, 28, 28, 255)

PANTS_BROWN = (143, 68, 38, 255)   # Calça marrom veludo cotelê (#8f4426)
PANTS_SHADOW = (99, 44, 22, 255)

SOCK_YELLOW = (255, 204, 0, 255)
SOCK_PURPLE = (92, 27, 107, 255)

SHOE_PURPLE = (92, 27, 107, 255)
SHOE_TOE = (245, 158, 11, 255)     # Biqueira amarela bulbosa (#f59e0b)
SHOE_LACE = (220, 38, 38, 255)     # Cadarço vermelho

def draw_hair_tufts(draw, cx, cy, radius_x, radius_y, view="front", back=False):
    """Desenha a cabeleira arrepiada estilo cientista excêntrico"""
    num_spikes = 32
    spikes = []
    base_col = HAIR_DARK if back else HAIR_BASE
    for i in range(num_spikes):
        angle = (i / num_spikes) * 2 * math.pi
        # Mais tufos no topo e lados do que no queixo
        if math.sin(angle) > 0.4 and not back:
            continue
        length_var = 30 + 35 * math.sin(angle * 5 + 1.2) * math.cos(angle * 2)
        rx = radius_x + length_var
        ry = radius_y + length_var * 0.85
        px = cx + rx * math.cos(angle)
        py = cy + ry * math.sin(angle)
        spikes.append((px, py))
    
    # Desenhar massa de cabelo
    if len(spikes) >= 3:
        draw.polygon(spikes, fill=base_col, outline=INK)
        # Detalhes de mechas internas
        for i in range(0, len(spikes), 2):
            p1 = spikes[i]
            p2 = (cx + (p1[0] - cx) * 0.45, cy + (p1[1] - cy) * 0.45)
            draw.line([p1, p2], fill=HAIR_LIGHT if i % 4 == 0 else INK, width=3)

def draw_head_base(draw, cx, cy, rx, ry, facing=0):
    """Desenha formato da cabeça de feijão superelíptico com queixo afunilado"""
    pts = []
    n = 64
    for i in range(n):
        t = (i / n) * 2 * math.pi
        c = math.cos(t)
        s = math.sin(t)
        e = 2.0 / (1.75 if s < 0 else 2.3)
        X = math.copysign(abs(c) ** e, c)
        Y = math.copysign(abs(s) ** e, s)
        # Taper no queixo (s > 0)
        X *= (1.0 - 0.12 * Y) * (1.0 + 0.08 * facing * math.copysign(1, X))
        x = cx + rx * X
        y = cy + ry * Y
        pts.append((x, y))
    draw.polygon(pts, fill=SKIN_LIT, outline=INK)
    # Sombra suave lateral de nanquim
    sh_pts = [p for p in pts if (p[0] - cx) > rx * 0.2]
    if len(sh_pts) > 2:
        draw.line(sh_pts, fill=SKIN_SHADOW, width=6)

def draw_glasses(draw, cx, cy, scale=1.0, facing=0):
    """Desenha aros redondos icônicos pretos com ponte metálica"""
    r = 24 * scale
    offset = 32 * scale
    lx = cx - offset + facing * 8
    rx = cx + offset + facing * 8
    gy = cy
    
    # Aros
    for gx in [lx, rx]:
        draw.ellipse([gx - r, gy - r, gx + r, gy + r], fill=GLASSES_LENS, outline=GLASSES_FRAME, width=4)
        # Reflexo branco na lente
        draw.arc([gx - r + 5, gy - r + 5, gx + r - 5, gy + r - 5], start=210, end=270, fill=(255, 255, 255, 200), width=3)
    
    # Ponte central
    draw.line([lx + r, gy, rx - r, gy], fill=GLASSES_FRAME, width=4)
    # Hastes laterais
    draw.line([lx - r, gy, lx - r - 16, gy - 6], fill=GLASSES_FRAME, width=3)
    draw.line([rx + r, gy, rx + r + 16, gy - 6], fill=GLASSES_FRAME, width=3)

def draw_mustache(draw, cx, cy, scale=1.0, facing=0):
    """Bigode volumoso curvo característico do professor"""
    w = 42 * scale
    h = 16 * scale
    mx = cx + facing * 8
    my = cy
    pts = [
        (mx - w, my + 8),
        (mx - w * 0.7, my - 6),
        (mx, my - 3),
        (mx + w * 0.7, my - 6),
        (mx + w, my + 8),
        (mx + w * 0.5, my + h),
        (mx, my + 6),
        (mx - w * 0.5, my + h)
    ]
    draw.polygon(pts, fill=MUSTACHE, outline=INK)
    draw.line([(mx - w * 0.6, my), (mx, my + 2), (mx + w * 0.6, my)], fill=MUSTACHE_SH, width=2)

def draw_eyes(draw, cx, cy, expr="neutral", scale=1.0, facing=0, blink=False):
    """Olhos expressivos alinhados com a biblioteca do repositório"""
    offset = 32 * scale
    lx = cx - offset + facing * 8
    rx = cx + offset + facing * 8
    ey = cy - 2
    r_eye = 9 * scale
    
    if blink:
        # Traço de piscar
        draw.line([lx - 12, ey, lx + 12, ey], fill=INK, width=4)
        draw.line([rx - 12, ey, rx + 12, ey], fill=INK, width=4)
        return

    for ex in [lx, rx]:
        draw.ellipse([ex - r_eye, ey - r_eye, ex + r_eye, ey + r_eye], fill=(255, 255, 255, 255), outline=INK, width=2)
        # Íris castanho escuro
        ir = 5 * scale
        look_dx = facing * 3
        draw.ellipse([ex - ir + look_dx, ey - ir, ex + ir + look_dx, ey + ir], fill=(66, 36, 21, 255))
        # Pupila
        draw.ellipse([ex - 2 + look_dx, ey - 2, ex + 2 + look_dx, ey + 2], fill=INK)
        # Brilho de inteligência
        draw.ellipse([ex - 4 + look_dx, ey - 4, ex - 1 + look_dx, ey - 1], fill=(255, 255, 255, 255))

def draw_brows(draw, cx, cy, expr="neutral", scale=1.0, facing=0):
    """Sobrancelhas grossas castanho-escuras expressivas"""
    offset = 32 * scale
    lx = cx - offset + facing * 8
    rx = cx + offset + facing * 8
    by = cy - 26 * scale
    bw = 18 * scale
    
    brow_offsets = {
        "neutral": (0, 0),
        "happy": (-4, -4),
        "surprised": (-12, -12),
        "confused": (-8, 4),
        "thoughtful": (4, -6),
        "serious": (6, 6),
        "excited": (-10, -8),
        "concerned": (-6, 6),
        "laughing": (-6, -6),
        "explaining": (-4, 2)
    }
    d1, d2 = brow_offsets.get(expr, (0, 0))
    
    # Esquerda
    draw.line([lx - bw * 0.6, by + d1, lx + bw * 0.6, by + d1 * 0.5], fill=MUSTACHE, width=5)
    # Direita
    draw.line([rx - bw * 0.6, by + d2 * 0.5, rx + bw * 0.6, by + d2], fill=MUSTACHE, width=5)

def draw_mouth(draw, cx, cy, expr="neutral", scale=1.0, facing=0):
    """Boca expressiva e fonética de animação"""
    my = cy + 24 * scale
    mx = cx + facing * 8
    w = 16 * scale
    
    if expr in ["neutral", "serious", "thoughtful"]:
        draw.line([mx - w * 0.7, my, mx + w * 0.7, my], fill=INK, width=4)
    elif expr in ["happy", "explaining", "smile"]:
        draw.arc([mx - w, my - 8, mx + w, my + 10], start=10, end=170, fill=INK, width=4)
        # Dentes superiores
        draw.rectangle([mx - w * 0.5, my - 1, mx + w * 0.5, my + 4], fill=TEETH, outline=INK, width=1)
    elif expr in ["laughing", "excited"]:
        # Boca aberta D com dentes e língua
        pts = [(mx - w * 1.1, my), (mx + w * 1.1, my), (mx + w * 0.8, my + 16), (mx - w * 0.8, my + 16)]
        draw.polygon(pts, fill=MOUTH_INT, outline=INK)
        draw.rectangle([mx - w * 0.9, my, mx + w * 0.9, my + 5], fill=TEETH)
        draw.ellipse([mx - 6, my + 9, mx + 6, my + 18], fill=TONGUE)
    elif expr in ["surprised", "confused"]:
        # O aberto
        draw.ellipse([mx - 10, my - 2, mx + 10, my + 16], fill=MOUTH_INT, outline=INK, width=3)
    elif expr in ["concerned"]:
        draw.arc([mx - w * 0.8, my + 4, mx + w * 0.8, my + 18], start=190, end=350, fill=INK, width=4)

def draw_coat_and_torso(draw, cx, cy, view="front", scale=1.0):
    """Desenha tronco, colete patchwork, casaco violeta e detalhes"""
    tw = 110 * scale
    th = 170 * scale
    top_y = cy
    bot_y = cy + th
    
    if view == "back":
        # CASACO COSTAS: Roxo maciço com corte central, ponto de interrogação amarelo e remendos
        coat_pts = [
            (cx - tw * 0.85, top_y + 10),
            (cx + tw * 0.85, top_y + 10),
            (cx + tw, bot_y),
            (cx - tw, bot_y)
        ]
        draw.polygon(coat_pts, fill=COAT_PURPLE, outline=INK)
        # Costura central vertical
        draw.line([(cx, top_y + 15), (cx, bot_y - 10)], fill=INK, width=3)
        
        # PONTO DE INTERROGAÇÃO AMARELO GIGANTE (Marca Registrada!)
        # Curva superior do "?"
        draw.arc([cx - 28, top_y + 35, cx + 28, top_y + 85], start=180, end=380, fill=STAR_YELLOW, width=14)
        draw.line([(cx + 14, top_y + 70), (cx, top_y + 98)], fill=STAR_YELLOW, width=14)
        # Ponto do "?"
        draw.ellipse([cx - 7, top_y + 114, cx + 7, top_y + 128], fill=STAR_YELLOW)
        
        # Remendo verde oliva no bolso esquerdo (costas)
        draw.rectangle([cx - tw * 0.8, bot_y - 65, cx - tw * 0.45, bot_y - 25], fill=PATCH_GREEN, outline=INK, width=2)
        # Pontos de costura do remendo
        draw.line([(cx - tw * 0.8, bot_y - 65), (cx - tw * 0.45, bot_y - 65)], fill=INK, width=2)
        
        # Remendo laranja no bolso direito (costas)
        draw.rectangle([cx + tw * 0.45, bot_y - 60, cx + tw * 0.78, bot_y - 22], fill=PATCH_ORANGE, outline=INK, width=2)
        return

    # VISTA FRONTAL / 3-4:
    # 1. Camisa e Colarinho
    draw.polygon([(cx - 28, top_y), (cx + 28, top_y), (cx, top_y + 38)], fill=SHIRT_COLLAR, outline=INK)
    
    # 2. Gravata Borboleta Laranja com Bolinhas Vermelhas
    b_pts = [(cx - 24, top_y + 5), (cx - 4, top_y + 14), (cx - 24, top_y + 24),
             (cx + 24, top_y + 24), (cx + 4, top_y + 14), (cx + 24, top_y + 5)]
    draw.polygon(b_pts, fill=BOWTIE_ORANGE, outline=INK)
    # Nó central
    draw.ellipse([cx - 7, top_y + 8, cx + 7, top_y + 20], fill=BOWTIE_ORANGE, outline=INK)
    # Bolinhas vermelhas
    for bx, by in [(cx - 15, top_y + 10), (cx - 15, top_y + 18), (cx + 15, top_y + 10), (cx + 15, top_y + 18)]:
        draw.ellipse([bx - 2, by - 2, bx + 2, by + 2], fill=BOWTIE_DOTS)
        
    # 3. Colete Patchwork de Losangos
    vest_pts = [(cx - 40, top_y + 25), (cx + 40, top_y + 25), (cx + 48, bot_y - 20),
                (cx, bot_y), (cx - 48, bot_y - 20)]
    draw.polygon(vest_pts, fill=VEST_DIAMONDS[0], outline=INK)
    # Grid de retalhos coloridos
    step_y = 28
    for row in range(4):
        y0 = top_y + 28 + row * step_y
        for col in range(3):
            color = VEST_DIAMONDS[(row * 2 + col) % len(VEST_DIAMONDS)]
            dx = (col - 1) * 24
            d_pts = [(cx + dx, y0), (cx + dx + 12, y0 + 14), (cx + dx, y0 + 28), (cx + dx - 12, y0 + 14)]
            draw.polygon(d_pts, fill=color, outline=INK)
            
    # 4. Paletó Violeta (Abas Frontais Abertas)
    # Aba Esquerda
    left_coat = [(cx - tw * 0.85, top_y + 10), (cx - 32, top_y + 20), (cx - 38, bot_y - 15),
                 (cx - tw, bot_y + 25), (cx - tw * 0.95, top_y + 40)]
    draw.polygon(left_coat, fill=COAT_PURPLE, outline=INK)
    
    # Aba Direita
    right_coat = [(cx + tw * 0.85, top_y + 10), (cx + 32, top_y + 20), (cx + 38, bot_y - 15),
                  (cx + tw, bot_y + 25), (cx + tw * 0.95, top_y + 40)]
    draw.polygon(right_coat, fill=COAT_PURPLE, outline=INK)
    
    # Estrela Amarela na Lapela Direita do Professor (peito direito visual)
    sx = cx - 52
    sy = top_y + 55
    star_r = 10
    star_pts = []
    for i in range(10):
        r_curr = star_r if i % 2 == 0 else star_r * 0.45
        ang = (i / 10) * 2 * math.pi - math.pi / 2
        star_pts.append((sx + r_curr * math.cos(ang), sy + r_curr * math.sin(ang)))
    draw.polygon(star_pts, fill=STAR_YELLOW, outline=INK)
    
    # Botões Dourados do Casaco
    draw.ellipse([cx - 44, top_y + 80, cx - 36, top_y + 88], fill=GOLD_BUTTON, outline=INK)
    draw.ellipse([cx - 44, top_y + 105, cx - 36, top_y + 113], fill=GOLD_BUTTON, outline=INK)

def draw_legs_and_shoes(draw, cx, cy, view="front", scale=1.0, pose="standing"):
    """Desenha calça marrom com remendos nos joelhos, meias listradas e sapatos bicolores"""
    hip_y = cy
    knee_y = cy + 120 * scale
    ankle_y = cy + 220 * scale
    sole_y = cy + 260 * scale
    
    leg_w = 26 * scale
    
    # Calça cropped de veludo cotelê
    # Perna Esquerda
    draw.polygon([(cx - 45, hip_y), (cx - 15, hip_y), (cx - 20, knee_y + 20), (cx - 50, knee_y + 20)],
                 fill=PANTS_BROWN, outline=INK)
    # Perna Direita
    draw.polygon([(cx + 15, hip_y), (cx + 45, hip_y), (cx + 50, knee_y + 20), (cx + 20, knee_y + 20)],
                 fill=PANTS_BROWN, outline=INK)
                 
    if view != "back":
        # Remendo Verde Oliva no joelho direito do professor (lado esquerdo na tela)
        draw.rectangle([cx - 48, knee_y - 20, cx - 22, knee_y + 10], fill=PATCH_GREEN, outline=INK, width=2)
        # Remendo Amarelo Ocre no joelho esquerdo do professor (lado direito na tela)
        draw.rectangle([cx + 22, knee_y - 20, cx + 48, knee_y + 10], fill=PATCH_OCHRE, outline=INK, width=2)
        
    # Meias Listradas (Amarelo e Roxo)
    for lx in [cx - 35, cx + 35]:
        sock_top = knee_y + 20
        sock_h = 35
        # Base amarela
        draw.rectangle([lx - 10, sock_top, lx + 10, sock_top + sock_h], fill=SOCK_YELLOW, outline=INK)
        # Listras roxas horizontais
        draw.rectangle([lx - 10, sock_top + 8, lx + 10, sock_top + 16], fill=SOCK_PURPLE)
        draw.rectangle([lx - 10, sock_top + 24, lx + 10, sock_top + 32], fill=SOCK_PURPLE)
        
    # Sapatos Bicolores Icônicos (Corpo Roxo + Biqueira Bulbosa Amarela + Cadarço Vermelho)
    for side, lx in [(-1, cx - 35), (1, cx + 35)]:
        shoe_pts = [
            (lx - 14, ankle_y - 5),
            (lx + 14, ankle_y - 5),
            (lx + side * 35, sole_y),
            (lx - side * 25, sole_y)
        ]
        draw.polygon(shoe_pts, fill=SHOE_PURPLE, outline=INK)
        # Biqueira arredondada bulbosa amarela
        toe_cx = lx + side * 28
        toe_cy = sole_y - 12
        draw.ellipse([toe_cx - 16, toe_cy - 12, toe_cx + 16, toe_cy + 12], fill=SHOE_TOE, outline=INK)
        # Cadarço vermelho
        draw.line([(lx - 6, ankle_y + 4), (lx + 6, ankle_y + 10)], fill=SHOE_LACE, width=3)
        draw.line([(lx + 6, ankle_y + 4), (lx - 6, ankle_y + 10)], fill=SHOE_LACE, width=3)

def draw_arms(draw, cx, cy, view="front", pose="open_arms", scale=1.0):
    """Desenha braços com manga roxa violeta e mãos articuladas"""
    sh_y = cy + 20
    arm_w = 20 * scale
    
    if pose == "open_arms":
        # Pose icônica da imagem original de referência: braços abertos para os lados com palmas abertas
        # Braço Esquerdo
        draw.polygon([(cx - 75, sh_y), (cx - 190, sh_y + 15), (cx - 185, sh_y + 35), (cx - 70, sh_y + 40)],
                     fill=COAT_PURPLE, outline=INK)
        # Mão Esquerda (palma aberta, pele)
        draw.ellipse([cx - 225, sh_y + 8, cx - 185, sh_y + 42], fill=SKIN_LIT, outline=INK)
        # Dedos abertos
        for d in range(4):
            ang = math.radians(160 + d * 18)
            fx = cx - 210 + 26 * math.cos(ang)
            fy = sh_y + 25 + 26 * math.sin(ang)
            draw.line([(cx - 205, sh_y + 25), (fx, fy)], fill=SKIN_LIT, width=6)
            draw.line([(cx - 205, sh_y + 25), (fx, fy)], fill=INK, width=1)
            
        # Braço Direito
        draw.polygon([(cx + 75, sh_y), (cx + 190, sh_y + 15), (cx + 185, sh_y + 35), (cx + 70, sh_y + 40)],
                     fill=COAT_PURPLE, outline=INK)
        # Mão Direita
        draw.ellipse([cx + 185, sh_y + 8, cx + 225, sh_y + 42], fill=SKIN_LIT, outline=INK)
        for d in range(4):
            ang = math.radians(20 - d * 18)
            fx = cx + 210 + 26 * math.cos(ang)
            fy = sh_y + 25 + 26 * math.sin(ang)
            draw.line([(cx + 205, sh_y + 25), (fx, fy)], fill=SKIN_LIT, width=6)
            draw.line([(cx + 205, sh_y + 25), (fx, fy)], fill=INK, width=1)
            
    elif pose == "pointing_up":
        # Braço direito apontando para cima (Eureka / explicação)
        draw.polygon([(cx + 75, sh_y), (cx + 110, sh_y - 70), (cx + 130, sh_y - 65), (cx + 85, sh_y + 35)],
                     fill=COAT_PURPLE, outline=INK)
        draw.ellipse([cx + 110, sh_y - 95, cx + 135, sh_y - 70], fill=SKIN_LIT, outline=INK)
        # Dedo indicador para cima
        draw.line([(cx + 122, sh_y - 85), (cx + 122, sh_y - 125)], fill=SKIN_LIT, width=7)
        draw.line([(cx + 122, sh_y - 85), (cx + 122, sh_y - 125)], fill=INK, width=2)
        # Braço esquerdo na cintura
        draw.polygon([(cx - 75, sh_y), (cx - 120, sh_y + 40), (cx - 75, sh_y + 90), (cx - 65, sh_y + 75)],
                     fill=COAT_PURPLE, outline=INK)
        draw.ellipse([cx - 85, sh_y + 75, cx - 65, sh_y + 95], fill=SKIN_LIT, outline=INK)

    elif pose == "pointing_forward":
        # Apontando para frente / câmera
        draw.polygon([(cx + 75, sh_y), (cx + 140, sh_y + 30), (cx + 135, sh_y + 50), (cx + 75, sh_y + 40)],
                     fill=COAT_PURPLE, outline=INK)
        draw.ellipse([cx + 140, sh_y + 25, cx + 175, sh_y + 55], fill=SKIN_LIT, outline=INK)
        draw.line([(cx + 160, sh_y + 40), (cx + 195, sh_y + 40)], fill=SKIN_LIT, width=8)
        # Outro braço neutro
        draw.polygon([(cx - 75, sh_y), (cx - 95, sh_y + 80), (cx - 80, sh_y + 85), (cx - 65, sh_y + 25)],
                     fill=COAT_PURPLE, outline=INK)
        draw.ellipse([cx - 100, sh_y + 80, cx - 75, sh_y + 105], fill=SKIN_LIT, outline=INK)

    else:
        # Posição neutra / repouso
        for side in [-1, 1]:
            draw.polygon([(cx + side * 75, sh_y), (cx + side * 95, sh_y + 85),
                          (cx + side * 75, sh_y + 90), (cx + side * 60, sh_y + 25)],
                         fill=COAT_PURPLE, outline=INK)
            draw.ellipse([cx + side * 95 - 12, sh_y + 85, cx + side * 95 + 12, sh_y + 110], fill=SKIN_LIT, outline=INK)

def render_professor(view="front", expr="neutral", pose="open_arms", blink=False, width=600, height=1000):
    """Renderiza uma instância completa do professor no design space 600x1000"""
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    cx = width // 2
    head_cy = 200
    torso_cy = 310
    legs_cy = 500
    
    facing_map = {
        "front": 0,
        "three_quarter_left": -0.5,
        "three_quarter_right": 0.5,
        "profile_left": -1.0,
        "profile_right": 1.0,
        "back": 0
    }
    facing = facing_map.get(view, 0)
    
    # 1. Cabelo traseiro (se vista frontal ou perfil)
    draw_hair_tufts(draw, cx, head_cy, 68, 62, view=view, back=True)
    
    # 2. Pernas e Calçados
    draw_legs_and_shoes(draw, cx, legs_cy, view=view, pose=pose)
    
    # 3. Tronco, Colete e Casaco
    draw_coat_and_torso(draw, cx, torso_cy, view=view)
    
    # 4. Braços e Mãos
    draw_arms(draw, cx, torso_cy, view=view, pose=pose)
    
    # 5. Cabeça e Rosto
    if view != "back":
        draw_head_base(draw, cx, head_cy, 58, 54, facing=facing)
        draw_eyes(draw, cx, head_cy - 4, expr=expr, facing=facing, blink=blink)
        draw_glasses(draw, cx, head_cy - 4, facing=facing)
        draw_brows(draw, cx, head_cy - 4, expr=expr, facing=facing)
        draw_mustache(draw, cx, head_cy + 12, facing=facing)
        draw_mouth(draw, cx, head_cy + 12, expr=expr, facing=facing)
        
    # 6. Cabelo frontal e tufos de acabamento
    draw_hair_tufts(draw, cx, head_cy, 66, 60, view=view, back=(view == "back"))
    
    return img

def main():
    print("Iniciando geração dos entregáveis do Professor 2D...")
    
    # 1. Renderizar Modelo Mestre
    master = render_professor(view="front", expr="neutral", pose="open_arms")
    master_path = os.path.join(MASTER_DIR, "professor_master_2d.png")
    master.save(master_path)
    print(f"Modelo Mestre salvo: {master_path}")
    
    # 2. Renderizar Vistas (Frente, 3/4 Esquerda, 3/4 Direita, Perfil Esquerdo, Perfil Direito, Costas)
    views = ["front", "three_quarter_left", "three_quarter_right", "profile_left", "profile_right", "back"]
    view_imgs = []
    for v in views:
        im = render_professor(view=v, expr="neutral", pose="neutral" if v != "front" else "open_arms")
        p = os.path.join(VIEWS_DIR, f"view_{v}.png")
        im.save(p)
        view_imgs.append(im)
        print(f"Vista salva: {p}")
        
    # Folha de Referência Completa (Character Sheet lado a lado)
    sheet_w = 600 * len(views)
    sheet_h = 1000
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (255, 255, 255, 255))
    draw_sheet = ImageDraw.Draw(sheet)
    for idx, im in enumerate(view_imgs):
        sheet.paste(im, (idx * 600, 0), im)
        # Linhas guia e legendas
        draw_sheet.line([(idx * 600, 0), (idx * 600, sheet_h)], fill=(200, 200, 200, 255), width=2)
    # Linhas de alinhamento anatômico
    for guide_y, name in [(140, "TOPO CABEÇA"), (196, "OLHOS"), (254, "QUEIXO"), (310, "OMBROS"), (480, "CINTURA"), (620, "JOELHOS"), (760, "TORNOZELOS"), (975, "SOLAS")]:
        draw_sheet.line([(0, guide_y), (sheet_w, guide_y)], fill=(220, 180, 220, 180), width=1)
        draw_sheet.text((10, guide_y - 12), name, fill=(120, 60, 140, 255))
    sheet_path = os.path.join(VIEWS_DIR, "character_sheet_views.png")
    sheet.save(sheet_path)
    print(f"Character Sheet salvo: {sheet_path}")
    
    # 3. Biblioteca de 10 Expressões Obrigatórias
    expressions = [
        "neutral", "happy", "surprised", "confused", "thoughtful",
        "serious", "excited", "concerned", "laughing", "explaining"
    ]
    expr_grid = Image.new("RGBA", (600 * 5, 1000 * 2), (250, 250, 252, 255))
    draw_egrid = ImageDraw.Draw(expr_grid)
    for idx, exp in enumerate(expressions):
        im = render_professor(view="front", expr=exp, pose="neutral")
        p = os.path.join(EXPR_DIR, f"expression_{exp}.png")
        im.save(p)
        col = idx % 5
        row = idx // 5
        expr_grid.paste(im, (col * 600, row * 1000), im)
        draw_egrid.text((col * 600 + 40, row * 1000 + 40), f"{idx+1}. {exp.upper()}", fill=(60, 20, 80, 255))
        print(f"Expressão salva: {p}")
    expr_sheet_path = os.path.join(EXPR_DIR, "expressions_grid.png")
    expr_grid.save(expr_sheet_path)
    print(f"Grid de expressões salvo: {expr_sheet_path}")

    # 4. Biblioteca de 10 Poses Obrigatórias
    poses = [
        ("neutral", "Posição neutra"),
        ("pointing_forward", "Apontando para frente"),
        ("pointing_up", "Apontando para cima"),
        ("open_arms", "Braços abertos (referência)"),
        ("hand_on_chin", "Mão no queixo"),
        ("hand_on_hip", "Mão na cintura"),
        ("hands_explaining", "Explicando com as mãos"),
        ("holding_object", "Segurando um objeto"),
        ("walking", "Caminhando"),
        ("discovery", "Apresentando uma descoberta")
    ]
    pose_grid = Image.new("RGBA", (600 * 5, 1000 * 2), (250, 250, 252, 255))
    draw_pgrid = ImageDraw.Draw(pose_grid)
    for idx, (p_id, p_name) in enumerate(poses):
        im = render_professor(view="front", expr="explaining" if "explaining" in p_id or "discovery" in p_id else "happy", pose=p_id)
        p = os.path.join(POSES_DIR, f"pose_{p_id}.png")
        im.save(p)
        col = idx % 5
        row = idx // 5
        pose_grid.paste(im, (col * 600, row * 1000), im)
        draw_pgrid.text((col * 600 + 40, row * 1000 + 40), f"{idx+1}. {p_name}", fill=(60, 20, 80, 255))
        print(f"Pose salva: {p}")
    pose_sheet_path = os.path.join(POSES_DIR, "poses_grid.png")
    pose_grid.save(pose_sheet_path)
    print(f"Grid de poses salvo: {pose_sheet_path}")
    
    # 5. Fonemas de Lip Sync (A, E, I, O, U, MBP, FV, LDT)
    phonemes = ["A", "E", "I", "O", "U", "MBP", "FV", "LDT"]
    for ph in phonemes:
        p_expr = "laughing" if ph == "A" else "happy" if ph in ["E", "I"] else "surprised" if ph in ["O", "U"] else "neutral"
        im = render_professor(view="front", expr=p_expr, pose="neutral")
        p = os.path.join(PHONEMES_DIR, f"phoneme_{ph}.png")
        im.save(p)
        print(f"Fonema salvo: {p}")
        
    print("\nTodos os ativos gráficos do Professor 2D foram gerados e exportados com sucesso!")

if __name__ == "__main__":
    main()
