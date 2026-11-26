"""TikTok Scraper, Uploader & Session Manager (Playwright)
======================================================
Módulo clonado e adaptado do hub central F:\\Nova pasta\\scraping.
Configurado nativamente para o perfil: seu_email@gmail.com
Local do perfil: F:\\Nova pasta\\perfis_navegador\\perfis\\tiktok_seu_perfil

Recursos:
- Extração de metadados de vídeos e perfis (SSR rehydration)
- Login interativo persistente via navegador Brave/Chrome
- Verificação rápida de autenticação e sessão ativa
- Upload automatizado no TikTok Studio com preenchimento de legenda e bypass Akamai
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Union

from playwright.sync_api import sync_playwright

DEFAULT_PROFILE = r"./perfis_navegador/seu_perfil"
BRAVE_CANDIDATES = [
    r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
    r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
    str(Path(os.environ.get("LOCALAPPDATA", "")) / "BraveSoftware" / "Brave-Browser" / "Application" / "brave.exe")
]

TIKTOK_LOGIN_URL = "https://www.tiktok.com/login"
TIKTOK_STUDIO_UPLOAD_URL = "https://www.tiktok.com/tiktokstudio/upload"


class TikTokScraper:
    def __init__(self, profile_dir: Optional[str] = None, headless: bool = True):
        self.profile_dir = profile_dir or DEFAULT_PROFILE
        self.headless = headless
        self.brave_exe = self._localizar_brave()

    @staticmethod
    def _localizar_brave() -> Optional[str]:
        for b in BRAVE_CANDIDATES:
            if os.path.exists(b):
                return b
        return None

    def _get_context(self, p, headless: Optional[bool] = None, extra_args: Optional[List[str]] = None):
        self.is_cdp = False
        # 1. Tenta conectar diretamente ao navegador ativo via CDP na porta 9230
        try:
            import urllib.request
            with urllib.request.urlopen("http://127.0.0.1:9230/json/version", timeout=0.6) as resp:
                if resp.status == 200:
                    print("[TikTok] Conectando ao navegador ativo via CDP na porta 9230...", flush=True)
                    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9230")
                    self.is_cdp = True
                    if browser.contexts:
                        return browser.contexts[0]
                    return browser.new_context()
        except Exception:
            pass

        # 2. Se o navegador não estiver aberto com CDP, inicia o contexto persistente
        h = self.headless if headless is None else headless
        os.makedirs(self.profile_dir, exist_ok=True)
        args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars",
            "--lang=pt-BR,pt,en-US,en"
        ]
        if extra_args:
            args.extend(extra_args)

        launch_args = {
            "user_data_dir": self.profile_dir,
            "headless": h,
            "viewport": None if not h else {"width": 1280, "height": 900},
            "locale": "pt-BR",
            "args": args,
            "ignore_default_args": ["--enable-automation"] if not h else None,
        }
        if self.brave_exe:
            launch_args["executable_path"] = self.brave_exe
        else:
            launch_args["channel"] = "chrome"
        return p.chromium.launch_persistent_context(**launch_args)

    def abrir_login(self, esperar_fechar: bool = True) -> Dict[str, Any]:
        """Abre o navegador visível com o perfil persistente para o usuário fazer login."""
        info = {"conectado": False, "usuario": "", "status": "desconectado", "atualizado_em": datetime.now().isoformat()}
        print(f"[TikTok] Abrindo navegador para login interativo em: {self.profile_dir}")
        with sync_playwright() as p:
            context = self._get_context(p, headless=False, extra_args=["--start-maximized"])
            page = context.pages[0] if context.pages else context.new_page()
            try:
                page.goto(TIKTOK_LOGIN_URL, timeout=60000)
            except Exception:
                pass

            if esperar_fechar:
                try:
                    while context.pages:
                        cookies = context.cookies()
                        nomes = {c.get("name") for c in cookies}
                        if "sessionid" in nomes or "sessionid_ss" in nomes:
                            info["conectado"] = True
                            info["status"] = "conectado"
                            try:
                                handle = page.evaluate("""() => {
                                    const el = document.querySelector('a[href*="/@"]');
                                    if (el) {
                                        const match = el.href.match(/@([a-zA-Z0-9_.-]+)/);
                                        if (match) return match[1];
                                    }
                                    return '';
                                }""")
                                if handle:
                                    info["usuario"] = f"@{handle}"
                            except Exception:
                                pass
                        time.sleep(2)
                except Exception:
                    pass

            cookies = context.cookies()
            nomes = {c.get("name") for c in cookies}
            if "sessionid" in nomes or "sessionid_ss" in nomes:
                info["conectado"] = True
                info["status"] = "conectado"
            context.close()
        return info

    def verificar_sessao(self, headless: bool = True) -> Dict[str, Any]:
        """Verifica de forma rápida e silenciosa se a sessão continua válida."""
        info = {"conectado": False, "usuario": "", "status": "desconectado", "atualizado_em": datetime.now().isoformat()}
        with sync_playwright() as p:
            try:
                context = self._get_context(p, headless=headless)
                cookies = context.cookies()
                nomes = {c.get("name") for c in cookies}
                if "sessionid" in nomes or "sessionid_ss" in nomes:
                    info["conectado"] = True
                    info["status"] = "conectado"
                    try:
                        page = context.pages[0] if context.pages else context.new_page()
                        page.goto("https://www.tiktok.com/", timeout=20000)
                        time.sleep(2)
                        handle = page.evaluate("""() => {
                            const el = document.querySelector('a[href*="/@"]');
                            if (el) {
                                const match = el.href.match(/@([a-zA-Z0-9_.-]+)/);
                                if (match) return match[1];
                            }
                            return '';
                        }""")
                        if handle:
                            info["usuario"] = f"@{handle}"
                    except Exception:
                        pass
                if not getattr(self, "is_cdp", False):
                    context.close()
            except Exception as e:
                info["status"] = f"erro: {e}"
        return info

    def extrair_dados_video(self, url_video: str) -> Optional[Dict[str, Any]]:
        """Extrai metadados completos de um vídeo via SSR rehydration do TikTok."""
        print(f"[TikTok Scraper] Analisando vídeo: {url_video}")
        with sync_playwright() as p:
            context = self._get_context(p)
            page = context.pages[0] if context.pages else context.new_page()
            try:
                page.goto(url_video, wait_until="domcontentloaded", timeout=40000)
                time.sleep(3)
                dados = page.evaluate("""() => {
                    const script = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    if (!script) return null;
                    try {
                        const parsed = JSON.parse(script.textContent);
                        const detail = parsed['__DEFAULT_SCOPE__']?.['webapp.video-detail'];
                        const item = detail?.itemInfo?.itemStruct;
                        if (!item) return null;
                        return {
                            id: item.id,
                            descricao: item.desc,
                            criado_em: item.createTime,
                            autor: {
                                id: item.author?.id,
                                uniqueId: item.author?.uniqueId,
                                nickname: item.author?.nickname,
                                avatar: item.author?.avatarLarger
                            },
                            musica: {
                                id: item.music?.id,
                                titulo: item.music?.title,
                                autor: item.music?.authorName,
                                playUrl: item.music?.playUrl
                            },
                            metricas: {
                                curtidas: item.stats?.diggCount,
                                compartilhamentos: item.stats?.shareCount,
                                comentarios: item.stats?.commentCount,
                                views: item.stats?.playCount,
                                salvos: item.stats?.collectCount
                            },
                            video: {
                                duracao: item.video?.duration,
                                resolucao: item.video?.ratio,
                                cover: item.video?.cover,
                                playAddr: item.video?.playAddr,
                                downloadAddr: item.video?.downloadAddr
                            }
                        };
                    } catch (e) {
                        return null;
                    }
                }""")
                return dados
            finally:
                context.close()

    def extrair_posts_perfil(self, usuario: str, limite: int = 15) -> List[str]:
        """Extrai links de vídeos recentes de um criador do TikTok."""
        user = usuario.replace("@", "")
        url = f"https://www.tiktok.com/@{user}"
        print(f"[TikTok Scraper] Extraindo até {limite} vídeos do perfil @{user}...")
        with sync_playwright() as p:
            context = self._get_context(p)
            page = context.pages[0] if context.pages else context.new_page()
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=40000)
                time.sleep(4)
                links = page.evaluate("""(maxCount) => {
                    const elements = Array.from(document.querySelectorAll('a[href*="/video/"]'));
                    return Array.from(new Set(elements.map(a => a.href))).slice(0, maxCount);
                }""", limite)
                return links
            finally:
                context.close()

    def publicar_video(
        self,
        caminho_video: Union[str, Path],
        legenda: str,
        hashtags: Optional[List[str]] = None,
        headless: bool = False,
    ) -> Dict[str, Any]:
        """Publica um vídeo no TikTok Studio via automação de navegador."""
        vid = Path(caminho_video).resolve()
        if not vid.is_file():
            raise FileNotFoundError(f"Vídeo não encontrado: {vid}")

        tags = hashtags or ["#historia", "#curiosidades", "#fatoscuriosos", "#edu"]
        texto_completo = f"{legenda}\n\n{' '.join(tags)}".strip()

        with sync_playwright() as p:
            context = self._get_context(p, headless=headless, extra_args=["--start-maximized"])
            page = context.pages[0] if context.pages else context.new_page()
            try:
                print("[TikTok Studio] Acessando painel...", flush=True)
                page.goto("https://www.tiktok.com/tiktokstudio", timeout=60000)
                time.sleep(4)

                if "/login" in page.url:
                    raise RuntimeError("Sessão do TikTok expirada. Execute com --login para autenticar.")

                print("[TikTok Studio] Acessando upload via Sidebar...", flush=True)
                btn_upload = page.locator('button[data-tt*="UploadEntrance"]')
                clicado = False
                for i in range(btn_upload.count()):
                    b = btn_upload.nth(i)
                    if b.is_visible():
                        b.click(force=True)
                        clicado = True
                        break
                if not clicado:
                    page.evaluate("() => document.querySelector('[data-tt*=\"UploadEntrance\"]')?.click()")
                time.sleep(4)

                upload_input = None
                for _ in range(15):
                    if page.locator('input[type="file"]').count() > 0:
                        upload_input = page.locator('input[type="file"]').first
                        break
                    for frame in page.frames:
                        if frame.locator('input[type="file"]').count() > 0:
                            upload_input = frame.locator('input[type="file"]').first
                            break
                    if upload_input:
                        break
                    time.sleep(1)

                if not upload_input:
                    raise RuntimeError("Input de upload de vídeo não encontrado.")

                print(f"[TikTok Studio] Enviando: {vid.name}...", flush=True)
                upload_input.set_input_files(str(vid))
                time.sleep(3)

                caption_selectors = [
                    'div[contenteditable="true"]',
                    '.public-DraftEditor-content',
                    '[data-placeholder*="legenda" i]',
                    '[data-placeholder*="caption" i]',
                    'div[data-placeholder]',
                    'textarea',
                ]
                campo_legenda = None
                for _ in range(20):
                    for sel in caption_selectors:
                        loc = page.locator(sel)
                        if loc.count() > 0 and loc.first.is_visible():
                            campo_legenda = loc.first
                            break
                    if campo_legenda:
                        break
                    time.sleep(1)

                if campo_legenda:
                    campo_legenda.click(force=True)
                    time.sleep(0.5)
                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    time.sleep(0.3)
                    page.keyboard.insert_text(texto_completo)
                    time.sleep(1)
                    print("[TikTok Studio] Legenda inserida com sucesso.", flush=True)

                btn_publicar = None
                t0 = time.time()
                while time.time() - t0 < 120:
                    entendi = page.locator('button:has-text("Entendi"), button:has-text("Pular"), button:has-text("Skip")')
                    if entendi.count() > 0 and entendi.first.is_visible():
                        entendi.first.click(force=True)

                    for seletor in [
                        'button:text-is("Publicar")',
                        'button[data-e2e="post_video_button"]',
                        'button[data-e2e="upload_post_btn"]',
                        'button:has-text("Publicar")',
                        'button:has-text("Post")',
                    ]:
                        cands = page.locator(seletor)
                        if cands.count() > 0 and cands.first.is_visible() and cands.first.is_enabled():
                            btn_publicar = cands.first
                            break
                    if btn_publicar:
                        break
                    time.sleep(0.5)

                if not btn_publicar:
                    raise RuntimeError("Botão Publicar não habilitou a tempo.")

                btn_publicar.scroll_into_view_if_needed()
                time.sleep(0.3)
                btn_publicar.click(force=True)
                print("[TikTok Studio] Botão Publicar clicado!", flush=True)

                time.sleep(1)
                for _ in range(15):
                    btn_agora = page.locator('button:has-text("Publicar agora"), [role="button"]:has-text("Publicar agora"), button:has-text("Post now"), button:has-text("Continuar publicando")')
                    if btn_agora.count() > 0 and btn_agora.first.is_visible():
                        btn_agora.first.click(force=True)
                        break
                    time.sleep(0.5)

                return {
                    "sucesso": True,
                    "arquivo": vid.name,
                    "legenda": legenda,
                    "publicado_em": datetime.now(timezone.utc).isoformat(),
                }
            finally:
                if not getattr(self, "is_cdp", False):
                    context.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TikTok Scraper & Studio Manager (seu_email@gmail.com)")
    parser.add_argument("--login", action="store_true", help="Abre o navegador para login interativo")
    parser.add_argument("--check", action="store_true", help="Verifica o status da sessão")
    parser.add_argument("--video", type=str, help="Extrai metadados completos de uma URL de vídeo")
    parser.add_argument("--profile", type=str, help="Extrai links de vídeos de um usuário do TikTok")
    parser.add_argument("--limit", type=int, default=10, help="Limite de vídeos do perfil (padrão 10)")
    parser.add_argument("--upload", type=str, help="Caminho do vídeo para upload no TikTok Studio")
    parser.add_argument("--caption", type=str, default="", help="Legenda do vídeo")
    args = parser.parse_args()

    scraper = TikTokScraper()

    if args.login:
        res = scraper.abrir_login()
        print("\nResultado do Login:", json.dumps(res, indent=2, ensure_ascii=False))
    elif args.check:
        res = scraper.verificar_sessao()
        print("\nStatus da Sessão:", json.dumps(res, indent=2, ensure_ascii=False))
    elif args.video:
        dados = scraper.extrair_dados_video(args.video)
        print("\nDados do Vídeo:", json.dumps(dados, indent=2, ensure_ascii=False))
    elif args.profile:
        links = scraper.extrair_posts_perfil(args.profile, limite=args.limit)
        print(f"\n{len(links)} Vídeos encontrados para @{args.profile}:")
        for l in links:
            print(" -", l)
    elif args.upload:
        res = scraper.publicar_video(args.upload, legenda=args.caption)
        print("\nResultado do Upload:", json.dumps(res, indent=2, ensure_ascii=False))
    else:
        print("[TikTok Scraper seu_perfil] Módulo pronto. Use --help para ver os comandos.")
