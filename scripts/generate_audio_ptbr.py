#!/usr/bin/env python3
"""
GERADOR DE NARRAÇÃO EM PORTUGUÊS BRASILEIRO E MAPA DE PALAVRAS/TIMINGS
Gera a locução em PT-BR para o Professor do canal 'O Porquê das Coisas'
e produz o arquivo words.json para lip sync e sincronização de poses.
"""

import os
import asyncio
import json
import edge_tts

AUDIO_DIR = r".\audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

TEXT = (
    "Olá, mentes curiosas! Você já se perguntou por que as coisas sempre caem em direção ao chão? "
    "A resposta é a gravidade! Uma força invisível que atrai toda a matéria para o centro da Terra. "
    "Sem ela, estaríamos todos flutuando pelo espaço! "
    "Fascinante, não é mesmo? Até o próximo mistério desvendado em O Porquê das Coisas!"
)

VOICE = "pt-BR-AntonioNeural"

async def main():
    mp3_path = os.path.join(AUDIO_DIR, "professor_fala_gravidade.mp3")
    vtt_path = os.path.join(AUDIO_DIR, "professor_fala_gravidade.vtt")
    
    communicate = edge_tts.Communicate(TEXT, VOICE, rate="+5%", pitch="+2Hz")
    submaker = edge_tts.SubMaker()
    
    with open(mp3_path, "wb") as f:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                submaker.feed(chunk)
                
    srt_path = os.path.join(AUDIO_DIR, "professor_fala_gravidade.srt")
    try:
        subs = submaker.get_srt()
    except AttributeError:
        subs = submaker.generate_subs()
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(subs)
        
    print(f"Áudio gerado: {mp3_path}")
    print(f"Legendas/Timings gerados: {vtt_path}")
    
    # Gerar words.json para Lip Sync
    # Parse básico de marcações
    words_data = []
    # Simular segmentação por palavras com base no tempo total
    import subprocess
    cmd = f'ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "{mp3_path}"'
    duration_str = subprocess.check_output(cmd, shell=True).decode().strip()
    duration = float(duration_str)
    
    words = TEXT.split()
    total_words = len(words)
    time_per_word = duration / total_words
    
    for i, w in enumerate(words):
        t_start = i * time_per_word
        t_end = (i + 1) * time_per_word
        words_data.append({
            "word": w.strip(".,!?"),
            "start": round(t_start, 3),
            "end": round(t_end, 3),
            "frame_start": int(t_start * 30),
            "frame_end": int(t_end * 30)
        })
        
    words_json_path = os.path.join(AUDIO_DIR, "words.json")
    with open(words_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "text": TEXT,
            "duration_seconds": duration,
            "total_frames_30fps": int(duration * 30),
            "words": words_data
        }, f, indent=2, ensure_ascii=False)
        
    print(f"words.json gerado com {len(words_data)} palavras: {words_json_path}")

if __name__ == "__main__":
    asyncio.run(main())
