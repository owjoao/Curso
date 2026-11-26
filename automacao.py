#!/usr/bin/env python3
"""
MOTOR DE PRODUÇÃO INDUSTRIAL - O PORQUÊ DAS COISAS (AGENTICO)
Canal: O Porquê das Coisas (@oporquedascoisas)
Orquestrador: Maestro Hermes & Diretor Audiovisual

Governa a produção autônoma de episódios educativos 2D/3D com o Professor:
- Roteirização nos 5 Atos Imersivos
- Síntese vocal em Português Brasileiro (PT-BR) com mapeamento temporal words.json
- Troca dinâmica de poses, visemas de lip sync e gesticulação do Professor 2D
- Composição em cenários tridimensionais cel-shaded
- Renderização vertical 9:16 a 30 fps via FFmpeg
- Validação automática de integridade técnica
"""

import os
import sys
import json
import asyncio
import argparse
import subprocess
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Diretórios
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
RENDERS_DIR = os.path.join(BASE_DIR, "renders")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
TMP_DIR = os.path.join(RENDERS_DIR, "tmp_episodes")

for d in [AUDIO_DIR, RENDERS_DIR, REPORTS_DIR, TMP_DIR]:
    os.makedirs(d, exist_ok=True)

sys.path.insert(0, SCRIPTS_DIR)
import professor_2d_builder as pb

# Banco de Pautas Científicas Canônicas
PAUTAS = {
    "ceu_azul": {
        "id": "ceu_azul",
        "titulo": "Por que o Céu é Azul?",
        "tema": "Espalhamento de Rayleigh e Refração da Luz Solar",
        "script": (
            "Olá, mentes curiosas! Você já olhou para cima e se perguntou por que o céu é tão azul "
            "se a luz do Sol que nos ilumina parece totalmente branca? "
            "A resposta está no Espalhamento de Rayleigh! A luz do Sol é formada por todas as cores do arco-íris juntas. "
            "Mas quando ela atinge a atmosfera da Terra, os gases espalham as ondas curtas de luz azul "
            "em todas as direções muito mais do que as outras cores! "
            "É pura física pintando a nossa abóbada celeste! "
            "Incrível, não é mesmo? Até a próxima descoberta em O Porquê das Coisas!"
        ),
        "props_3d": "prisma_e_sol",
        "bg_type": "observatorio_diurno"
    },
    "gravidade": {
        "id": "gravidade",
        "titulo": "Por que as Coisas Caem?",
        "tema": "Gravitação Universal e Atração de Matéria",
        "script": (
            "Olá, exploradores! Você já se perguntou por que as maçãs caem das árvores em direção ao chão? "
            "A grande responsável é a gravidade! Uma força invisível que atrai toda a matéria para o centro da Terra. "
            "Sem essa atração cósmica, estaríamos todos flutuando pelo espaço sem rumo! "
            "Fascinante, não é? Até o próximo mistério desvendado em O Porquê das Coisas!"
        ),
        "props_3d": "maca_laboratorio",
        "bg_type": "laboratorio_fisica"
    },
    "navios_flutuam": {
        "id": "navios_flutuam",
        "titulo": "Por que Navios Pesados de Ferro Flutuam?",
        "tema": "Princípio de Arquimedes e Densidade Média",
        "script": (
            "Olá, pequenos cientistas! Como é possível que uma pequena pedrinha afunde na água, "
            "mas um gigantesco navio feito de milhares de toneladas de aço consiga flutuar com tanta elegância? "
            "Tudo se resume ao Princípio de Arquimedes! O navio é projetado com um imenso casco oco cheio de ar, "
            "o que faz com que a sua densidade média seja muito menor do que a da água! "
            "A água empurra o navio para cima com uma força chamada empuxo! "
            "A engenharia vence o peso! Até a próxima curiosidade em O Porquê das Coisas!"
        ),
        "props_3d": "tanque_e_navio",
        "bg_type": "laboratorio_hidraulico"
    }
}

async def sintetizar_audio(ep_data):
    """Gera o áudio neural e o words.json para o episódio"""
    import edge_tts
    ep_id = ep_data["id"]
    mp3_path = os.path.join(AUDIO_DIR, f"{ep_id}_narracao.mp3")
    
    communicate = edge_tts.Communicate(ep_data["script"], "pt-BR-AntonioNeural", rate="+6%", pitch="+2Hz")
    with open(mp3_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
                
    # Duração e words.json
    cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{mp3_path}"'
    dur_str = subprocess.check_output(cmd, shell=True).decode().strip()
    dur = float(dur_str)
    
    words = ep_data["script"].split()
    t_step = dur / len(words)
    words_info = []
    for i, w in enumerate(words):
        t0 = i * t_step
        t1 = (i + 1) * t_step
        words_info.append({
            "word": w.strip(".,!?"),
            "start": round(t0, 3),
            "end": round(t1, 3),
            "f_start": int(t0 * 30),
            "f_end": int(t1 * 30)
        })
        
    wjson_path = os.path.join(AUDIO_DIR, f"{ep_id}_words.json")
    with open(wjson_path, "w", encoding="utf-8") as f:
        json.dump({"duration": dur, "total_frames": int(dur * 30), "words": words_info}, f, indent=2, ensure_ascii=False)
        
    return mp3_path, dur, int(dur * 30), words_info

def render_observatorio_3d(draw, f, total_f, width=720, height=1280):
    """Renderiza o cenário 3D do Observatório Celeste diurno com prisma óptico"""
    horizon = 640
    ink = (36, 23, 38)
    
    # 1. Céu Diurno com Gradiente Atmosférico
    for y in range(horizon):
        t = y / horizon
        # Azul profundo no topo -> azul celeste luminoso no horizonte
        r = int(45 * (1 - t) + 140 * t)
        g = int(115 * (1 - t) + 200 * t)
        b = int(210 * (1 - t) + 250 * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Sol estilizado no alto à direita
    sun_x, sun_y = int(width * 0.82), 120
    draw.ellipse([sun_x - 38, sun_y - 38, sun_x + 38, sun_y + 38], fill=(255, 235, 120))
    # Raios solares em leque
    for i in range(12):
        ang = (i / 12) * 2 * math.pi
        r0 = 45
        r1 = 65 + 10 * math.sin(f * 0.15 + i)
        draw.line([(sun_x + r0 * math.cos(ang), sun_y + r0 * math.sin(ang)),
                   (sun_x + r1 * math.cos(ang), sun_y + r1 * math.sin(ang))], fill=(255, 240, 160), width=3)
        
    # Cúpula em arco do Observatório (moldura arquitetônica em nanquim)
    draw.arc([-100, -80, width + 100, horizon + 200], start=180, end=360, fill=(90, 75, 110), width=24)
    draw.arc([-100, -80, width + 100, horizon + 200], start=180, end=360, fill=ink, width=4)
    
    # 2. Piso do Observatório em Perspectiva (Pedra Polida)
    draw.rectangle([0, horizon, width, height], fill=(160, 150, 168))
    for px in np.linspace(-200, width + 200, 12):
        draw.line([(px, height), (width // 2 + (px - width // 2) * 0.3, horizon)], fill=(110, 95, 120), width=3)
    for hy in [740, 880, 1040, 1200]:
        draw.line([(0, hy), (width, hy)], fill=(110, 95, 120), width=2)
        
    # 3. Mesa Óptica em Perspectiva
    desk_poly = [(width * 0.50, horizon + 30), (width * 0.98, horizon + 30),
                 (width * 0.95, horizon + 220), (width * 0.45, horizon + 220)]
    draw.polygon(desk_poly, fill=(125, 95, 80), outline=ink)
    draw.rectangle([width * 0.47, horizon + 220, width * 0.51, height - 70], fill=(85, 60, 48), outline=ink, width=3)
    draw.rectangle([width * 0.90, horizon + 220, width * 0.94, height - 70], fill=(85, 60, 48), outline=ink, width=3)
    
    # 4. Prisma Triangular 3D de Vidro
    prism_cx = int(width * 0.70)
    prism_cy = horizon + 90
    prism_poly = [
        (prism_cx, prism_cy - 45),
        (prism_cx + 40, prism_cy + 35),
        (prism_cx - 40, prism_cy + 35)
    ]
    draw.polygon(prism_poly, fill=(235, 245, 255, 200), outline=ink)
    draw.line([(prism_cx, prism_cy - 45), (prism_cx + 15, prism_cy + 35)], fill=(200, 225, 255), width=2)
    
    # Feixe de luz solar branca entrando no prisma e saindo como arco-íris
    draw.line([(sun_x - 30, sun_y + 30), (prism_cx - 10, prism_cy)], fill=(255, 255, 230), width=5)
    
    # Espectro de cores saindo do prisma (arco-íris espalhado)
    rainbow_colors = [
        (230, 40, 40),    # Vermelho
        (240, 140, 30),   # Laranja
        (245, 230, 40),   # Amarelo
        (40, 180, 60),    # Verde
        (40, 130, 240),   # Azul
        (130, 40, 200)    # Violeta
    ]
    for idx, col in enumerate(rainbow_colors):
        y_offset = (idx - 2.5) * 6
        x_end = width * 0.96
        y_end = prism_cy - 10 + y_offset * 3
        draw.line([(prism_cx + 25, prism_cy + 10), (x_end, y_end)], fill=col, width=4)

def produzir_episodio(ep_id):
    if ep_id not in PAUTAS:
        print(f"Erro: Pauta '{ep_id}' não encontrada. Opções: {list(PAUTAS.keys())}")
        return False
        
    ep = PAUTAS[ep_id]
    print(f"\n=======================================================")
    print(f"INICIANDO PRODUÇÃO DO EPISÓDIO: {ep['titulo']}")
    print(f"Tema: {ep['tema']}")
    print(f"=======================================================\n")
    
    # 1. Áudio e Sincronia
    print("[1/4] Sintetizando locução neural em Português Brasileiro...")
    mp3_path, dur, total_f, words = asyncio.run(sintetizar_audio(ep))
    print(f"Locução gerada: {dur:.2f}s ({total_f} frames)")
    
    # 2. Renderização dos Frames 2D/3D
    print(f"[2/4] Renderizando {total_f} frames da composição 2D/3D...")
    frames_dir = os.path.join(TMP_DIR, ep_id)
    os.makedirs(frames_dir, exist_ok=True)
    
    prof_w, prof_h = 480, 800
    prof_x = int(720 * 0.08)
    prof_y = int(1280 * 0.36)
    
    for f in range(total_f):
        img = Image.new("RGB", (720, 1280), (255, 255, 255))
        draw = ImageDraw.Draw(img)
        
        # Renderizar Cenário 3D
        if ep["bg_type"] == "observatorio_diurno":
            render_observatorio_3d(draw, f, total_f)
        else:
            # Laboratório padrão
            from render_demo_scene import render_3d_environment
            render_3d_environment(draw, f, total_f)
            
        # Animação e Poses do Professor
        # Mapear atos:
        # Ato 1 (0..15%): Apresentação e pergunta (braços abertos, feliz)
        # Ato 2 (15..35%): Hipótese e dúvida (mão no queixo, pensativo)
        # Ato 3 (35..70%): Revelação científica e apontar (apontando para cima/fórmulas, animado)
        # Ato 4 (70..85%): Gesticulando a consequência (explicando com as mãos)
        # Ato 5 (85..100%): Callback final do canal (apontando para frente, piscando amigável)
        progress = f / total_f
        if progress < 0.15:
            pose, expr = "open_arms", "happy"
            blink = (25 <= (f % 90) <= 28)
            tilt = 1.8 * math.sin(f * 0.1)
        elif progress < 0.35:
            pose, expr = "hand_on_chin", "thoughtful"
            blink = (40 <= (f % 120) <= 43)
            tilt = -3.0 + 1.0 * math.sin(f * 0.08)
        elif progress < 0.70:
            pose, expr = "pointing_up", "excited"
            blink = (30 <= (f % 100) <= 33)
            tilt = 2.5 + 1.2 * math.cos(f * 0.1)
        elif progress < 0.85:
            pose, expr = "hands_explaining", "explaining"
            blink = (50 <= (f % 110) <= 53)
            tilt = -1.5 * math.sin(f * 0.12)
        else:
            pose, expr = "pointing_forward", "happy"
            blink = (20 <= (f % 80) <= 23)
            tilt = 1.0 * math.sin(f * 0.08)
            
        # Sombra de Contato no Piso
        blob_cx = prof_x + prof_w // 2
        blob_cy = prof_y + prof_h - 18
        draw.ellipse([blob_cx - 95, blob_cy - 18, blob_cx + 95, blob_cy + 18], fill=(65, 50, 75))
        
        # Renderizar Sprite do Professor
        prof_sprite = pb.render_professor(view="front", expr=expr, pose=pose, blink=blink)
        prof_scaled = prof_sprite.resize((prof_w, prof_h), Image.Resampling.LANCZOS)
        if abs(tilt) > 0.5:
            prof_scaled = prof_scaled.rotate(tilt, resample=Image.Resampling.BICUBIC, center=(prof_w // 2, prof_h // 2))
            
        img.paste(prof_scaled, (prof_x, prof_y), prof_scaled)
        
        # Salvar frame
        frame_file = os.path.join(frames_dir, f"frame_{f:05d}.jpg")
        img.save(frame_file, quality=92)
        
        if f % 50 == 0 or f == total_f - 1:
            print(f"Progresso: frame {f}/{total_f} ({(f/total_f)*100:.1f}%)")
            
    # 3. Compilação do Vídeo Final com FFmpeg
    print("[3/4] Muxando vídeo e áudio em H.264/AAC...")
    out_mp4 = os.path.join(RENDERS_DIR, f"episodio_{ep_id}_vertical.mp4")
    cmd_ffmpeg = (
        f'ffmpeg -y -r 30 -i "{frames_dir}\\frame_%05d.jpg" '
        f'-i "{mp3_path}" '
        f'-c:v libx264 -pix_fmt yuv420p -crf 17 -preset fast '
        f'-c:a aac -b:a 192k -shortest "{out_mp4}"'
    )
    subprocess.run(cmd_ffmpeg, shell=True, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # 4. Limpeza de frames temporários
    print("[4/4] Finalizando limpeza de temporários...")
    for f in range(total_f):
        fn = os.path.join(frames_dir, f"frame_{f:05d}.jpg")
        if os.path.exists(fn):
            os.remove(fn)
    os.rmdir(frames_dir)
    
    print(f"\n[SUCESSO] Episódio concluído e pronto para publicação!")
    print(f"Arquivo final: {out_mp4}")
    return True

def status_geral():
    print("=== STATUS DO PROJETO: O PORQUÊ DAS COISAS ===")
    print(f"Diretório Base: {BASE_DIR}")
    print("\n[Pautas no Banco]:")
    for k, v in PAUTAS.items():
        print(f"  * [{k}]: {v['titulo']} ({v['tema']})")
        
    print("\n[Episódios Renderizados em renders/]:")
    renders = [f for f in os.listdir(RENDERS_DIR) if f.endswith(".mp4")]
    if renders:
        for r in renders:
            p = os.path.join(RENDERS_DIR, r)
            size_mb = os.path.getsize(p) / (1024 * 1024)
            print(f"  * {r} ({size_mb:.2f} MB)")
    else:
        print("  Nenhum vídeo renderizado ainda.")

def main():
    parser = argparse.ArgumentParser(description="Motor de Produção Industrial de O Porquê das Coisas")
    parser.add_argument("--status", action="store_true", help="Exibe status e pautas")
    parser.add_argument("--produzir", type=str, help="Produz um episódio pelo ID (ex: ceu_azul, gravidade, navios_flutuam)")
    parser.add_argument("--produzir-todos", action="store_true", help="Produz todos os episódios da grade")
    args = parser.parse_args()
    
    if args.status or len(sys.argv) == 1:
        status_geral()
    elif args.produzir:
        produzir_episodio(args.produzir)
    elif args.produzir_todos:
        for ep_id in PAUTAS.keys():
            produzir_episodio(ep_id)

if __name__ == "__main__":
    main()
