#!/usr/bin/env python3
"""
ORQUESTRADOR DE PRODUÇÃO E PUBLICAÇÃO AUTOMÁTICA — O PORQUÊ DAS COISAS
======================================================================
Lê pautas de `pautas_fila.json`, gera áudio neural PT-BR com timestamps reais,
renderiza o episódio vertical 9:16 (1080x1920 @ 30fps) com o Professor animado,
legendas dinâmicas e banner de título, valida via ffprobe e publica via
YouTube Data API v3 (`@seu_canal_youtube`) e opcionalmente TikTok (`@seu_perfil_tiktok`).

Uso:
  python producao_autonoma.py --listar
  python producao_autonoma.py --dry-run                 # Gera próximo vídeo sem publicar
  python producao_autonoma.py --proximo                 # Gera e publica no YouTube
  python producao_autonoma.py --proximo --tiktok        # Gera e publica no YouTube + TikTok
  python producao_autonoma.py --id guerra_mais_curta    # Gera e publica pauta específica
"""
from __future__ import annotations

import argparse
import asyncio
import datetime as dt
import json
import math
import os
import subprocess
import sys
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent
SCRIPTS_DIR = BASE_DIR / "scripts"
AUDIO_DIR = BASE_DIR / "audio"
OUT_DIR = BASE_DIR / "out"
TMP_DIR = BASE_DIR / "renders" / "tmp_auto"
FILA_PATH = BASE_DIR / "pautas_fila.json"
HIST_PATH = BASE_DIR / "historico_publicacoes.json"

for d in [AUDIO_DIR, OUT_DIR, TMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(SCRIPTS_DIR))
import professor_2d_builder as pb  # noqa: E402
from render_demo_scene import render_3d_environment  # noqa: E402
from automacao import render_observatorio_3d  # noqa: E402


def carregar_fila() -> list[dict]:
    with open(FILA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def salvar_fila(fila: list[dict]) -> None:
    with open(FILA_PATH, "w", encoding="utf-8") as f:
        json.dump(fila, f, indent=2, ensure_ascii=False)


def registrar_historico(registro: dict) -> None:
    hist = []
    if HIST_PATH.exists():
        try:
            with open(HIST_PATH, "r", encoding="utf-8") as f:
                hist = json.load(f)
        except Exception:
            hist = []
    hist.append(registro)
    with open(HIST_PATH, "w", encoding="utf-8") as f:
        json.dump(hist, f, indent=2, ensure_ascii=False)


def listar_pautas(fila: list[dict]) -> None:
    print("\n=== FILA DE PAUTAS — O PORQUÊ DAS COISAS ===")
    pendentes = 0
    for idx, p in enumerate(fila, 1):
        status = "✅ PUBLICADO" if p.get("publicado") else "⏳ PENDENTE"
        if not p.get("publicado"):
            pendentes += 1
        extra = f" -> {p['youtube_url']}" if p.get("youtube_url") else ""
        print(f"  {idx:02d}. [{status}] {p['id']} | {p['titulo']}{extra}")
    print(f"\nTotal: {len(fila)} pautas ({pendentes} pendentes).\n")


async def sintetizar_audio_com_legendas(ep: dict) -> tuple[Path, float, list[dict]]:
    import edge_tts

    ep_id = ep["id"]
    mp3_path = AUDIO_DIR / f"{ep_id}_narracao.mp3"
    words_path = AUDIO_DIR / f"{ep_id}_words.json"

    communicate = edge_tts.Communicate(
        ep["script"],
        "pt-BR-AntonioNeural",
        rate="+6%",
        pitch="+2Hz",
    )

    word_events: list[dict] = []
    with open(mp3_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start_s = chunk["offset"] / 10_000_000
                dur_s = chunk["duration"] / 10_000_000
                word_events.append({
                    "word": chunk["text"],
                    "start": round(start_s, 3),
                    "end": round(start_s + dur_s, 3),
                })

    dur_str = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(mp3_path),
        ],
        text=True,
    ).strip()
    dur = float(dur_str)

    # Fallback se edge-tts não retornar WordBoundary
    if not word_events:
        raw_words = ep["script"].split()
        step = dur / max(len(raw_words), 1)
        for i, w in enumerate(raw_words):
            word_events.append({
                "word": w,
                "start": round(i * step, 3),
                "end": round((i + 1) * step, 3),
            })

    with open(words_path, "w", encoding="utf-8") as f:
        json.dump({"duration": dur, "words": word_events}, f, indent=2, ensure_ascii=False)

    return mp3_path, dur, word_events


def _load_font(size: int, bold: bool = True):
    candidates = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def _draw_rounded_box_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y_center: int,
    width: int,
    font,
    text_color=(255, 255, 255),
    bg_color=(20, 16, 32, 215),
    max_chars: int = 28,
):
    lines = textwrap.wrap(text, width=max_chars)[:2]
    if not lines:
        return
    line_heights = []
    max_w = 0
    for ln in lines:
        bbox = draw.textbbox((0, 0), ln, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        max_w = max(max_w, w)
        line_heights.append(h)

    total_h = sum(line_heights) + (len(lines) - 1) * 10
    pad_x, pad_y = 26, 16
    x0 = (width - max_w) // 2 - pad_x
    x1 = (width + max_w) // 2 + pad_x
    y0 = y_center - total_h // 2 - pad_y
    y1 = y_center + total_h // 2 + pad_y

    draw.rounded_rectangle([x0, y0, x1, y1], radius=18, fill=bg_color, outline=(255, 200, 60), width=3)

    cur_y = y_center - total_h // 2
    for idx, ln in enumerate(lines):
        bbox = draw.textbbox((0, 0), ln, font=font)
        w = bbox[2] - bbox[0]
        draw.text(((width - w) // 2, cur_y), ln, font=font, fill=text_color)
        cur_y += line_heights[idx] + 10


def _current_caption_chunk(words: list[dict], t_sec: float, chunk_size: int = 4) -> str:
    if not words:
        return ""
    active_idx = 0
    for i, w in enumerate(words):
        if w["start"] <= t_sec:
            active_idx = i
        else:
            break
    chunk_start = (active_idx // chunk_size) * chunk_size
    chunk = words[chunk_start: chunk_start + chunk_size]
    return " ".join(w["word"] for w in chunk)


def renderizar_video(ep: dict, mp3_path: Path, dur: float, words: list[dict]) -> Path:
    ep_id = ep["id"]
    fps = 30
    total_f = max(int(math.ceil(dur * fps)) + 15, fps * 5)  # +0.5s de respiro final
    w_base, h_base = 720, 1280

    frames_dir = TMP_DIR / ep_id
    frames_dir.mkdir(parents=True, exist_ok=True)

    font_title = _load_font(34, bold=True)
    font_sub = _load_font(40, bold=True)
    import re
    clean_title = re.sub(r"[^\w\sÀ-ÿ!?.,:\-'\"()/]", "", ep["titulo"].replace("#shorts", "")).strip()

    prof_w, prof_h = 480, 800
    prof_x = int(w_base * 0.16)
    prof_y = int(h_base * 0.34)

    print(f"[2/4] Renderizando {total_f} frames ({dur:.1f}s @ {fps}fps)...")
    for f in range(total_f):
        img = Image.new("RGBA", (w_base, h_base), (255, 255, 255, 255))
        draw = ImageDraw.Draw(img, "RGBA")

        if ep.get("categoria") == "ciencia":
            render_observatorio_3d(draw, f, total_f, width=w_base, height=h_base)
        else:
            render_3d_environment(draw, f, total_f)

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

        # Sombra de contato
        blob_cx = prof_x + prof_w // 2
        blob_cy = prof_y + prof_h - 18
        draw.ellipse([blob_cx - 95, blob_cy - 18, blob_cx + 95, blob_cy + 18], fill=(65, 50, 75, 190))

        # Sprite do Professor
        prof_sprite = pb.render_professor(view="front", expr=expr, pose=pose, blink=blink)
        prof_scaled = prof_sprite.resize((prof_w, prof_h), Image.Resampling.LANCZOS)
        if abs(tilt) > 0.5:
            prof_scaled = prof_scaled.rotate(
                tilt, resample=Image.Resampling.BICUBIC, center=(prof_w // 2, prof_h // 2)
            )
        img.paste(prof_scaled, (prof_x, prof_y), prof_scaled)

        # Banner de Título no Topo (Safe Zone)
        _draw_rounded_box_text(
            draw, clean_title, y_center=135, width=w_base, font=font_title,
            text_color=(255, 230, 100), bg_color=(22, 16, 38, 220), max_chars=26,
        )

        # Legendas Dinâmicas na Safe Zone Inferior
        caption = _current_caption_chunk(words, f / fps, chunk_size=4)
        if caption:
            _draw_rounded_box_text(
                draw, caption.upper(), y_center=1070, width=w_base, font=font_sub,
                text_color=(255, 255, 255), bg_color=(15, 12, 24, 225), max_chars=22,
            )

        frame_file = frames_dir / f"frame_{f:05d}.jpg"
        img.convert("RGB").save(frame_file, quality=92)

        if f % 120 == 0 or f == total_f - 1:
            print(f"    Frame {f + 1}/{total_f} ({((f + 1) / total_f) * 100:.0f}%)")

    out_mp4 = OUT_DIR / f"ep_{ep_id}.mp4"
    print(f"[3/4] Codificando 1080x1920 H.264/AAC -> {out_mp4}...")
    subprocess.run(
        [
            "ffmpeg", "-y", "-r", str(fps),
            "-i", str(frames_dir / "frame_%05d.jpg"),
            "-i", str(mp3_path),
            "-vf", "scale=1080:1920:flags=lanczos",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17", "-preset", "fast",
            "-c:a", "aac", "-b:a", "192k", "-shortest", str(out_mp4),
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Limpeza dos frames temporários
    for fn in frames_dir.glob("frame_*.jpg"):
        fn.unlink()
    frames_dir.rmdir()

    return out_mp4


def validar_qa_mp4(mp4_path: Path) -> dict:
    print(f"[4/4] Executando QA técnico via ffprobe em {mp4_path.name}...")
    raw = subprocess.check_output(
        [
            "ffprobe", "-v", "error", "-show_entries",
            "stream=codec_type,width,height:format=duration",
            "-of", "json", str(mp4_path),
        ],
        text=True,
    )
    info = json.loads(raw)
    streams = {s["codec_type"]: s for s in info.get("streams", [])}
    dur = float(info["format"]["duration"])

    assert "video" in streams, "Stream de vídeo ausente!"
    assert "audio" in streams, "Stream de áudio ausente!"
    w, h = streams["video"]["width"], streams["video"]["height"]
    assert (w, h) == (1080, 1920), f"Resolução inesperada: {w}x{h}"
    assert dur >= 5.0, f"Duração muito curta: {dur:.2f}s"

    size_mb = mp4_path.stat().st_size / (1024 * 1024)
    print(f"[✓] QA APROVADO: {w}x{h} | {dur:.2f}s | {size_mb:.2f} MB | Áudio+Vídeo OK")
    return {"width": w, "height": h, "duration": dur, "size_mb": round(size_mb, 2)}


def publicar_youtube(ep: dict, mp4_path: Path) -> str:
    from youtube_api_uploader import get_authenticated_service, upload_video

    youtube = get_authenticated_service()
    desc = f"{ep['legenda']}\n\n{ep['tema']}\n\n" + " ".join(f"#{t.lstrip('#')}" for t in ep.get("tags", []))
    resp = upload_video(
        youtube=youtube,
        file_path=str(mp4_path),
        title=ep["titulo"],
        description=desc,
        tags=[t.lstrip("#") for t in ep.get("tags", [])],
        category_id="27",
        privacy_status="public",
    )
    vid_id = resp["id"]
    return f"https://www.youtube.com/shorts/{vid_id}"


def publicar_tiktok_cdp(ep: dict, mp4_path: Path) -> bool:
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    is_open = s.connect_ex(("127.0.0.1", 9230)) == 0
    s.close()
    if not is_open:
        print("[!] TikTok CDP (porta 9230) não está aberto. Rode abrir_navegador.bat para publicar também no TikTok.")
        return False

    from tiktok_scraper import TikTokScraper
    caption = f"{ep['legenda']} " + " ".join(f"#{t.lstrip('#')}" for t in ep.get("tags", [])[:4])
    scraper = TikTokScraper(headless=False, cdp_url="http://127.0.0.1:9230")
    # Usa o fluxo existente do scraper se disponível
    print(f"[📤] Enviando para TikTok Studio (@seu_perfil_tiktok): {mp4_path.name}")
    asyncio.run(scraper.upload_video(str(mp4_path), caption))
    return True


def processar_pauta(ep: dict, fila: list[dict], dry_run: bool = False, use_tiktok: bool = False) -> None:
    print("\n============================================================")
    print(f"🎬 PRODUÇÃO AUTÔNOMA: {ep['titulo']} (id={ep['id']})")
    print("============================================================")

    print("[1/4] Gerando narração neural PT-BR + timestamps...")
    mp3_path, dur, words = asyncio.run(sintetizar_audio_com_legendas(ep))
    print(f"[✓] Áudio gerado: {dur:.2f}s ({len(words)} palavras mapeadas)")

    out_mp4 = renderizar_video(ep, mp3_path, dur, words)
    qa = validar_qa_mp4(out_mp4)

    if dry_run:
        print(f"\n[DRY-RUN] Vídeo gerado e validado sem publicar: {out_mp4}")
        return

    yt_url = publicar_youtube(ep, out_mp4)
    tt_ok = publicar_tiktok_cdp(ep, out_mp4) if use_tiktok else False

    ep["publicado"] = True
    ep["youtube_url"] = yt_url
    ep["tiktok_publicado"] = tt_ok
    ep["data_publicacao"] = dt.datetime.now().isoformat(timespec="seconds")
    salvar_fila(fila)

    registrar_historico({
        "id": ep["id"],
        "titulo": ep["titulo"],
        "arquivo": str(out_mp4),
        "qa": qa,
        "youtube_url": yt_url,
        "tiktok_publicado": tt_ok,
        "timestamp": ep["data_publicacao"],
    })
    print(f"\n[🎉] EPISÓDIO '{ep['id']}' CONCLUÍDO E REGISTRADO NO HISTÓRICO!")


def main():
    parser = argparse.ArgumentParser(description="Esteira Autônoma — O Porquê das Coisas")
    parser.add_argument("--listar", action="store_true", help="Lista todas as pautas da fila")
    parser.add_argument("--proximo", action="store_true", help="Produz e publica a próxima pauta pendente")
    parser.add_argument("--id", type=str, help="Produz e publica uma pauta específica pelo ID")
    parser.add_argument("--dry-run", action="store_true", help="Gera e valida o MP4 sem publicar")
    parser.add_argument("--tiktok", action="store_true", help="Publica também no TikTok via CDP 9230")
    args = parser.parse_args()

    fila = carregar_fila()

    if args.listar or (not args.proximo and not args.id and not args.dry_run):
        listar_pautas(fila)
        return

    alvo = None
    if args.id:
        for p in fila:
            if p["id"] == args.id:
                alvo = p
                break
        if not alvo:
            print(f"[X] Pauta '{args.id}' não encontrada em pautas_fila.json.")
            sys.exit(1)
    else:
        for p in fila:
            if not p.get("publicado"):
                alvo = p
                break
        if not alvo:
            print("[✓] Todas as pautas da fila já foram publicadas! Adicione novas pautas em pautas_fila.json.")
            return

    processar_pauta(alvo, fila, dry_run=args.dry_run, use_tiktok=args.tiktok)


if __name__ == "__main__":
    main()
