# ESTÚDIO AUTÔNOMO 2D — O PORQUÊ DAS COISAS (ARQUITETURA MARVEL STUDIO)

**Motor Oficial:** `Engine2D.js` (HTML5 Canvas 2D `1280x720`, estética *Ampulheta* + timeline determinística `claude-animated-shorts`)  
**Orquestrador-Chefe:** `opdc-diretor` (subagente nativo em `./team/agents\opdc-diretor.md`)  
**Memória Evolutiva Global:** `.agent/memory/lessons_learned.json` (`ERR-001` a `ERR-006`) + `.agent/memory/visual_bible.md`

---

## 1. Organograma & Fluxo de Ativação por Portões (Gates)

Você entrega apenas **a ideia do episódio** (ex: *"Explique por que o céu é azul"* ou *"Documentário de 10 minutos sobre gravidade"*). O **Diretor (`opdc-diretor`)** ativa a esteira abaixo com cada agente lendo e evoluindo sua **memória individual** em `.agent/memory/agents/`:

```text
                       [ IDEIA DO USUÁRIO ]
                                |
                                v
      +---------------------------------------------------+
      |  opdc-diretor (Showrunner & Maestro de Produção)  |
      |  Skill: skill_00 | Memória: agents/diretor.json   |
      +---------------------------------------------------+
                                |
          +---------------------+---------------------+
          | Gate 1 (Pré-Produção)                     |
          v                                           |
+---------------------------------------+             |
| opdc-roteirista (Roteiro & Cues PT-BR)|             |
| Skill: skill_01 | agents/roteirista   |             |
+---------------------------------------+             |
          |                                           |
          +--------------------+----------------------+
          | Gate 2 (Paralelo: Arte + Câmera/Rig)      |
          v                                           v
+---------------------------------+   +----------------------------------+
| opdc-cenario-arte               |   | opdc-rig-camera                  |
| Cenários Multiplano, Props, VFX |   | ProfessorRig2D + Camera2D        |
| Skills: skill_02 + skill_03     |   | Skills: skill_04 + skill_05      |
| Memória: agents/cenario_arte    |   | Memória: agents/rig_camera       |
+---------------------------------+   +----------------------------------+
          |                                           |
          +---------------------+---------------------+
                                |
                                v Gate 3 (Dublagem, Mix & Render)
      +---------------------------------------------------+
      | opdc-audio-render                                 |
      | edge-tts + cue_timings + numpy ducking + FFmpeg   |
      | Skill: skill_07 | Memória: agents/audio_render    |
      +---------------------------------------------------+
                                |
                                v Gate 4 (Auditoria & Evolução)
      +---------------------------------------------------+
      | opdc-qa-curador (Gatekeeper Visual Multimodal)    |
      | Playwright + ffprobe + blackdetect + visão frames |
      | Skill: skill_06 | Memória: agents/qa_curador      |
      +---------------------------------------------------+
                     |                        |
                [ PASSED ]               [ REJECTED ]
                     |                        |
                     v                        v
         MP4 Pronto + Memórias     Devolução direcionada ao
            Atualizadas            especialista + nova regra
```

---

## 2. Mapa de Skills, Memórias Individuais e Agentes Executáveis

| Agente (`./team/agents\`) | Papel | Skills (`.agent/skills/`) | Memória Individual (`.agent/memory/agents/`) |
|---|---|---|---|
| `opdc-diretor` | Showrunner & Orquestrador | `skill_00_studio_director.md` | `diretor.json` |
| `opdc-roteirista` | Roteirista Científico | `skill_01_scriptwriter.md` | `roteirista.json` |
| `opdc-cenario-arte` | Cenários 2D, Props & VFX | `skill_02_scenery_builder.md`, `skill_03_lighting_vfx.md` | `cenario_arte.json` |
| `opdc-rig-camera` | Rigging Professor & Câmera | `skill_04_camera_director.md`, `skill_05_rig_animator.md` | `rig_camera.json` |
| `opdc-audio-render` | Voz Neural, Áudio & Render | `skill_07_audio_and_render.md` | `audio_render.json` |
| `opdc-qa-curador` | QA Técnico & Visão Multimodal | `skill_06_qa_reviewer.md` | `qa_curador.json` |
