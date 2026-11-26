"""YouTube Data API v3 Uploader — O Porquê das Coisas
=====================================================
Autentica via OAuth 2.0 usando o client_secret oficial, salva o token
em `youtube_token.json`, verifica o canal/vídeos existentes e publica
vídeos (Shorts/Longos) diretamente pela API oficial do YouTube.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import webbrowser
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

BASE_DIR = Path(__file__).resolve().parent.parent
CLIENT_SECRETS_FILE = BASE_DIR / "client_secret.json"
TOKEN_FILE = BASE_DIR / "youtube_token.json"

CHROME_EXE = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE_DIR = r"./perfis_navegador/seu_perfil"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
]


class IsolatedChromeBrowser(webbrowser.BaseBrowser):
    def open(self, url, new=0, autoraise=True):
        print(f"\n[🌐] Abrindo URL de autorização no perfil Chrome (seu_perfil):\n{url}\n")
        if os.path.isfile(CHROME_EXE):
            subprocess.Popen([
                CHROME_EXE,
                "--remote-debugging-port=9230",
                f"--user-data-dir={PROFILE_DIR}",
                "--no-first-run",
                "--no-default-browser-check",
                url,
            ])
        else:
            webbrowser.open(url)
        return True


def get_authenticated_service(use_isolated_browser: bool = False):
    creds = None
    if TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("[↻] Renovando token OAuth expirado...")
            creds.refresh(Request())
        else:
            if not CLIENT_SECRETS_FILE.exists():
                raise FileNotFoundError(f"Arquivo client_secret não encontrado: {CLIENT_SECRETS_FILE}")

            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRETS_FILE), SCOPES)
            print("[🔐] Iniciando fluxo OAuth 2.0... Autorize no navegador que será aberto!")
            if use_isolated_browser:
                webbrowser.register("isolated_chrome", None, IsolatedChromeBrowser())
                creds = flow.run_local_server(
                    port=0,
                    browser="isolated_chrome",
                    prompt="consent",
                    access_type="offline",
                )
            else:
                creds = flow.run_local_server(
                    port=0,
                    prompt="select_account consent",
                    access_type="offline",
                )

        with open(TOKEN_FILE, "w", encoding="utf-8") as token:
            token.write(creds.to_json())
        print(f"[✓] Token salvo com sucesso em: {TOKEN_FILE}")

    return build("youtube", "v3", credentials=creds)


def check_channel_and_videos(youtube):
    print("\n--- Verificando Canal e Vídeos via API ---")
    ch_resp = youtube.channels().list(part="snippet,statistics,contentDetails", mine=True).execute()
    items = ch_resp.get("items", [])
    if not items:
        print("[!] Nenhum canal encontrado nesta conta Google.")
        return []

    for ch in items:
        cid = ch["id"]
        title = ch["snippet"]["title"]
        custom_url = ch["snippet"].get("customUrl", "")
        subs = ch["statistics"].get("subscriberCount", "0")
        vids = ch["statistics"].get("videoCount", "0")
        print(f"[✓] Canal conectado: {title} ({custom_url}) | ID: {cid} | Vídeos: {vids} | Inscritos: {subs}")

        uploads_playlist = ch["contentDetails"]["relatedPlaylists"]["uploads"]
        pl_resp = youtube.playlistItems().list(
            part="snippet,status",
            playlistId=uploads_playlist,
            maxResults=10
        ).execute()
        pl_items = pl_resp.get("items", [])
        if not pl_items:
            print("    (Nenhum vídeo na playlist de uploads ainda)")
        for v in pl_items:
            vid_id = v["snippet"]["resourceId"]["videoId"]
            v_title = v["snippet"]["title"]
            privacy = v.get("status", {}).get("privacyStatus", "unknown")
            print(f"    🎬 [{privacy}] {v_title} -> https://www.youtube.com/shorts/{vid_id}")
        return pl_items
    return []


def upload_video(
    youtube,
    file_path: str,
    title: str,
    description: str,
    tags: list[str] | None = None,
    category_id: str = "27",
    privacy_status: str = "public",
):
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"Vídeo não encontrado: {file_path}")

    print(f"\n[📤] Iniciando upload via YouTube Data API v3: {file_path}")
    body = {
        "snippet": {
            "title": title[:100],
            "description": description,
            "tags": tags or ["shorts", "historia", "curiosidades", "animacao"],
            "categoryId": category_id,
            "defaultLanguage": "pt-BR",
            "defaultAudioLanguage": "pt-BR",
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(file_path, chunksize=-1, resumable=True, mimetype="video/mp4")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"    Progresso: {int(status.progress() * 100)}%")

    video_id = response["id"]
    print(f"\n[🎉] VÍDEO PUBLICADO VIA API COM SUCESSO!")
    print(f"    ID: {video_id}")
    print(f"    Status: {response.get('status', {}).get('privacyStatus')}")
    print(f"    Link Shorts: https://www.youtube.com/shorts/{video_id}")
    print(f"    Link Watch:  https://www.youtube.com/watch?v={video_id}")
    return response


def main():
    parser = argparse.ArgumentParser(description="YouTube Data API v3 Uploader")
    parser.add_argument("--check-only", action="store_true", help="Apenas autentica e lista canal/vídeos")
    parser.add_argument("--file", default=str(BASE_DIR / "out" / "dumont_final.mp4"), help="Caminho do MP4")
    parser.add_argument(
        "--title",
        default="O homem que inventou o avião foi barrado no aeroporto! ✈️ #shorts",
        help="Título do vídeo",
    )
    parser.add_argument(
        "--description",
        default=(
            "Santos Dumont, o pai da aviação, passando pelo detector de metais nos dias de hoje... "
            "Curiosidades históricas em animação! #shorts #historia #curiosidades #santosdumont"
        ),
        help="Descrição do vídeo",
    )
    parser.add_argument("--privacy", default="public", choices=["public", "unlisted", "private"])
    args = parser.parse_args()

    try:
        youtube = get_authenticated_service()
        existing = check_channel_and_videos(youtube)
        if args.check_only:
            return
        upload_video(
            youtube=youtube,
            file_path=args.file,
            title=args.title,
            description=args.description,
            privacy_status=args.privacy,
        )
    except HttpError as e:
        print(f"[X] Erro HTTP da API do YouTube: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
