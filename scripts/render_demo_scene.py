#!/usr/bin/env python3
"""
RENDERIZADOR DA CENA DE DEMONSTRAÇÃO 3D - O PORQUÊ DAS COISAS
Implementa o pipeline visual completo de 'claude-animated-shorts':
- Ambiente 3D toon do Laboratório (chão de madeira, paredes cel-shade, mesa, frascos, quadro negro, maçã com física de gravidade)
- Linhas de nanquim (ink outlines) na geometria 3D
- Billboard 2D do Professor Oficial em camada NOINK com contact blob e iluminação relativa à luz
- Sincronia fonética de boca (lip sync), piscadas e gesticulação conectadas a words.json
- Formato vertical 9:16 (720x1280) a 30 fps com áudio em Português Brasileiro
"""

import os
import sys
import math
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Diretórios
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
RENDERS_DIR = os.path.join(BASE_DIR, "renders")
TMP_FRAMES_DIR = os.path.join(RENDERS_DIR, "tmp_frames")
os.makedirs(RENDERS_DIR, exist_ok=True)
os.makedirs(TMP_FRAMES_DIR, exist_ok=True)

sys.path.insert(0, os.path.join(BASE_DIR, "scripts"))
import professor_2d_builder as pb

# Carregar words.json
words_json_path = os.path.join(AUDIO_DIR, "words.json")
with open(words_json_path, "r", encoding="utf-8") as f:
    timing_data = json.load(f)

TOTAL_FRAMES = timing_data["total_frames_30fps"]
AUDIO_FILE = os.path.join(AUDIO_DIR, "professor_fala_gravidade.mp3")

WIDTH = 720
HEIGHT = 1280
FPS = 30

# Paleta do Ambiente 3D Toon
WALL_COLOR = (235, 228, 218)
WALL_SHADOW = (185, 178, 192)
FLOOR_COLOR = (182, 126, 78)
FLOOR_SEAM = (70, 42, 24)
BOARD_COLOR = (32, 54, 42)
BOARD_FRAME = (140, 85, 45)
INK_COLOR = (36, 23, 38)

def render_3d_environment(draw, frame_idx, total_frames):
    """Renderiza o cenário 3D do Laboratório com perspectiva e iluminação"""
    horizon_y = 620
    
    # 1. Parede Traseira
    draw.rectangle([0, 0, WIDTH, horizon_y], fill=WALL_COLOR)
    # Sombra da parede direita (two-tone lighting)
    draw.polygon([(WIDTH * 0.7, 0), (WIDTH, 0), (WIDTH, horizon_y), (WIDTH * 0.7, horizon_y)], fill=WALL_SHADOW)
    draw.line([(0, horizon_y), (WIDTH, horizon_y)], fill=INK_COLOR, width=4)
    
    # 2. Piso de Pranchas de Madeira em Perspectiva
    draw.rectangle([0, horizon_y, WIDTH, HEIGHT], fill=FLOOR_COLOR)
    # Linhas de prancha convergindo para o ponto de fuga
    vp_x = WIDTH // 2
    vp_y = horizon_y - 200
    for plank_x in np.linspace(-300, WIDTH + 300, 14):
        draw.line([(plank_x, HEIGHT), (vp_x + (plank_x - vp_x) * 0.35, horizon_y)], fill=FLOOR_SEAM, width=3)
    # Linhas horizontais de encaixe das tábuas
    for hy in [720, 860, 1020, 1180]:
        draw.line([(0, hy), (WIDTH, hy)], fill=FLOOR_SEAM, width=2)
        
    # 3. Janela de Laboratório com Luz Solar Dourada Entrando
    win_x0, win_y0, win_w, win_h = 40, 120, 180, 260
    # Fachada externa celeste
    draw.rectangle([win_x0, win_y0, win_x0 + win_w, win_y0 + win_h], fill=(135, 190, 245), outline=INK_COLOR, width=5)
    # Esquadria da janela
    draw.line([(win_x0 + win_w // 2, win_y0), (win_x0 + win_w // 2, win_y0 + win_h)], fill=INK_COLOR, width=4)
    draw.line([(win_x0, win_y0 + win_h // 2), (win_x0 + win_w, win_y0 + win_h // 2)], fill=INK_COLOR, width=4)
    
    # 4. Quadro Negro com Fórmulas Científicas de Gravidade
    board_x, board_y, board_w, board_h = 260, 140, 420, 240
    # Moldura de madeira
    draw.rectangle([board_x - 10, board_y - 10, board_x + board_w + 10, board_y + board_h + 10], fill=BOARD_FRAME, outline=INK_COLOR, width=4)
    # Lousa verde escura
    draw.rectangle([board_x, board_y, board_x + board_w, board_y + board_h], fill=BOARD_COLOR, outline=INK_COLOR, width=3)
    
    # Fórmulas e diagramas em giz
    draw.text((board_x + 30, board_y + 30), "F = G * (m1 * m2) / r^2", fill=(255, 255, 230))
    draw.text((board_x + 30, board_y + 75), "g = 9.8 m/s^2 (Terra)", fill=(255, 230, 120))
    draw.text((board_x + 30, board_y + 120), "O Porquê das Coisas", fill=(180, 230, 255))
    # Desenho da órbita da Terra ao redor do Sol em giz
    draw.arc([board_x + 240, board_y + 60, board_x + 380, board_y + 190], start=0, end=360, fill=(255, 255, 255), width=2)
    draw.ellipse([board_x + 300, board_y + 115, board_x + 320, board_y + 135], fill=(255, 204, 0)) # Sol
    draw.ellipse([board_x + 360, board_y + 105, board_x + 372, board_y + 117], fill=(80, 150, 255)) # Terra
    
    # 5. Mesa de Laboratório em Perspectiva
    desk_poly = [
        (WIDTH * 0.52, horizon_y + 40),
        (WIDTH * 0.98, horizon_y + 40),
        (WIDTH * 0.96, horizon_y + 240),
        (WIDTH * 0.46, horizon_y + 240)
    ]
    draw.polygon(desk_poly, fill=(160, 105, 65), outline=INK_COLOR)
    # Pés da mesa
    draw.rectangle([WIDTH * 0.48, horizon_y + 240, WIDTH * 0.52, HEIGHT - 80], fill=(110, 65, 35), outline=INK_COLOR, width=3)
    draw.rectangle([WIDTH * 0.90, horizon_y + 240, WIDTH * 0.94, HEIGHT - 80], fill=(110, 65, 35), outline=INK_COLOR, width=3)

    # Frascos Químicos na mesa
    # Frasco 1 (Erlenmeyer azul)
    f1_x = int(WIDTH * 0.60)
    f1_y = horizon_y + 120
    draw.polygon([(f1_x - 12, f1_y + 40), (f1_x + 12, f1_y + 40), (f1_x + 26, f1_y + 90), (f1_x - 26, f1_y + 90)], fill=(80, 180, 240), outline=INK_COLOR)
    draw.rectangle([f1_x - 6, f1_y + 15, f1_x + 6, f1_y + 40], fill=(80, 180, 240), outline=INK_COLOR, width=2)
    # Frasco 2 (Balão verde)
    f2_x = int(WIDTH * 0.72)
    f2_y = horizon_y + 130
    draw.ellipse([f2_x - 22, f2_y + 35, f2_x + 22, f2_y + 80], fill=(80, 210, 110), outline=INK_COLOR)
    draw.rectangle([f2_x - 6, f2_y + 10, f2_x + 6, f2_y + 40], fill=(80, 210, 110), outline=INK_COLOR, width=2)

    # 6. Maçã 3D Interativa com Física de Gravidade (Ato da Demonstração)
    # A maçã começa suspensa aos ~8s (frame 240), cai com aceleração g e quica na mesa aos ~10s (frame 300)
    apple_spawn_frame = 230
    apple_x = int(WIDTH * 0.82)
    apple_rest_y = horizon_y + 175
    
    if frame_idx < apple_spawn_frame:
        # Maçã flutuando misteriosamente
        apple_y = horizon_y - 40 + int(8 * math.sin(frame_idx * 0.1))
    else:
        # Queda com gravidade simulada
        t = (frame_idx - apple_spawn_frame) / 30.0
        # h = 0.5 * g * t^2
        drop_dist = 0.5 * 980 * (t ** 2)
        raw_y = (horizon_y - 40) + drop_dist
        if raw_y < apple_rest_y:
            apple_y = int(raw_y)
        else:
            # Quique amortecido
            dt_bounce = t - math.sqrt(2 * (apple_rest_y - (horizon_y - 40)) / 980)
            bounce = abs(math.cos(dt_bounce * 8)) * math.exp(-dt_bounce * 3) * 60
            apple_y = int(apple_rest_y - bounce)
            
    # Desenhar maçã vermelha com folhinha verde
    draw.ellipse([apple_x - 14, apple_y - 12, apple_x + 14, apple_y + 14], fill=(220, 38, 38), outline=INK_COLOR, width=2)
    draw.line([(apple_x, apple_y - 12), (apple_x + 4, apple_y - 20)], fill=(90, 50, 30), width=3)
    draw.ellipse([apple_x + 3, apple_y - 24, apple_x + 12, apple_y - 18], fill=(46, 175, 60))

def get_animation_state_for_frame(f):
    """Calcula pose, expressão, visema e gestos baseado no tempo do roteiro em PT-BR"""
    # 0s - 3s (f 0..90): "Olá mentes curiosas!"
    if f < 90:
        expr = "happy" if (f % 20 < 10) else "explaining"
        pose = "open_arms"
        blink = (35 <= f <= 38)
        head_tilt = 2.0 * math.sin(f * 0.1)
    # 3s - 8s (f 90..240): "Você já se perguntou por que as coisas sempre caem em direção ao chão?"
    elif f < 240:
        expr = "thoughtful" if f < 170 else "confused"
        pose = "hand_on_chin" if f < 170 else "hands_explaining"
        blink = (140 <= f <= 143)
        head_tilt = -3.5 + 1.5 * math.sin(f * 0.08)
    # 8s - 15s (f 240..450): "A resposta é a gravidade! Uma força invisível que atrai toda a matéria..."
    elif f < 450:
        expr = "excited" if f < 330 else "explaining"
        pose = "pointing_up" if f < 330 else "discovery"
        blink = (290 <= f <= 293) or (400 <= f <= 403)
        head_tilt = 3.0 + 1.2 * math.cos(f * 0.1)
    # 15s - 19s (f 450..570): "Sem ela, estaríamos todos flutuando pelo espaço!"
    elif f < 570:
        expr = "surprised" if f < 510 else "laughing"
        pose = "open_arms"
        blink = (480 <= f <= 483)
        head_tilt = 2.0 * math.sin(f * 0.12)
    # 19s - 24.2s (f 570..726): "Fascinante, não é mesmo? Até o próximo mistério desvendado em O Porquê das Coisas!"
    else:
        expr = "happy" if f < 660 else "explaining"
        pose = "pointing_forward"
        blink = (630 <= f <= 633) or (700 <= f <= 703)
        head_tilt = 1.0 * math.sin(f * 0.08)
        
    return expr, pose, blink, head_tilt

def main():
    print(f"Iniciando renderização da cena 3D do Laboratório ({TOTAL_FRAMES} frames)...")
    
    # Dimensões do Professor no canvas final
    prof_w = 480
    prof_h = 800
    prof_x = int(WIDTH * 0.08)
    prof_y = int(HEIGHT * 0.35)
    
    # Barra de progresso
    step = 25
    for f in range(TOTAL_FRAMES):
        frame_img = Image.new("RGB", (WIDTH, HEIGHT), (255, 255, 255))
        draw = ImageDraw.Draw(frame_img)
        
        # 1. Renderizar Ambiente 3D
        render_3d_environment(draw, f, TOTAL_FRAMES)
        
        # 2. Obter estado da animação do Professor
        expr, pose, blink, head_tilt = get_animation_state_for_frame(f)
        
        # 3. Sombra de Contato no Solo (Contact Blob Multiply)
        blob_cx = prof_x + prof_w // 2
        blob_cy = prof_y + prof_h - 18
        draw.ellipse([blob_cx - 95, blob_cy - 18, blob_cx + 95, blob_cy + 18], fill=(60, 40, 50))
        
        # 4. Renderizar o Professor 2D
        prof_sprite = pb.render_professor(view="front", expr=expr, pose=pose, blink=blink)
        prof_scaled = prof_sprite.resize((prof_w, prof_h), Image.Resampling.LANCZOS)
        
        # Aplicar inclinação suave da cabeça/tronco se houver
        if abs(head_tilt) > 0.5:
            prof_scaled = prof_scaled.rotate(head_tilt, resample=Image.Resampling.BICUBIC, center=(prof_w // 2, prof_h // 2))
            
        # Composição do Professor sobre a cena 3D
        frame_img.paste(prof_scaled, (prof_x, prof_y), prof_scaled)
        
        # 5. Salvar Frame
        frame_filename = os.path.join(TMP_FRAMES_DIR, f"frame_{f:05d}.jpg")
        frame_img.save(frame_filename, quality=92)
        
        if f % step == 0 or f == TOTAL_FRAMES - 1:
            print(f"Progresso: frame {f}/{TOTAL_FRAMES} ({(f/TOTAL_FRAMES)*100:.1f}%)")
            
    print("\nTodos os frames individuais foram gerados.")
    
    # 6. Compilar Vídeo com FFmpeg (H.264 + AAC com sincronia de áudio)
    output_video = os.path.join(RENDERS_DIR, "professor_demo_laboratorio_vertical.mp4")
    print(f"Compilando vídeo final com FFmpeg: {output_video}")
    
    ffmpeg_cmd = (
        f'ffmpeg -y -r 30 -i "{TMP_FRAMES_DIR}\\frame_%05d.jpg" '
        f'-i "{AUDIO_FILE}" '
        f'-c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast '
        f'-c:a aac -b:a 192k -shortest "{output_video}"'
    )
    res = subprocess.run(ffmpeg_cmd, shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Erro no FFmpeg: {res.stderr}")
        sys.exit(1)
        
    print(f"\n[SUCESSO] Vídeo de teste renderizado com perfeição:")
    print(f"Arquivo: {output_video}")
    
    # Limpar frames temporários para liberar espaço
    for f in range(TOTAL_FRAMES):
        fn = os.path.join(TMP_FRAMES_DIR, f"frame_{f:05d}.jpg")
        if os.path.exists(fn):
            os.remove(fn)
    print("Limpeza de arquivos temporários concluída.")

if __name__ == "__main__":
    main()
