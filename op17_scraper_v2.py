from __future__ import annotations

"""OP17 scraper V2 – inclut explicitement les cartes DON!!

Ce script est un patch de logique pour ton nouveau scraper :
- il force la récupération des cartes OP17 standards + variantes + DON!!
- il n’exclut plus les entrées dont le code commence par DON
- il tente de télécharger les visuels distants pour toutes les DON!! quand un image_url est présent

Usage attendu dans ton projet :
    python op17_scraper_v2.py --cards ./op17_data/cards.json --images-dir ./op17_data/images

Si tu as déjà ton propre scraper complet, garde surtout ces fonctions :
- is_don_card
- normalize_variant
- hydrate_missing_don_images
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse
import requests

SESSION = requests.Session()
SESSION.headers.update({
    'User-Agent': 'OP17-Scraper-V2/1.0',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
})

def is_don_card(card: dict) -> bool:
    raw = ' '.join([
        str(card.get('code', '')),
        str(card.get('name', '')),
        str(card.get('rarity', '')),
        str(card.get('variant', '')),
        str(card.get('image_url', '')),
    ]).upper()
    return 'DON' in raw

def normalize_variant(value: str) -> str:
    value = str(value or 'STANDARD').upper().replace('_', ' ').replace('-', ' ')
    if 'DON' in value:
        return 'DON'
    if 'MANGA' in value:
        return 'MANGA'
    if 'SUPER' in value and 'RED' in value:
        return 'SUPER ALT RED'
    if 'SUPER' in value:
        return 'SUPER ALT'
    if 'TREASURE' in value or re.search(r'\bTR\b', value):
        return 'TREASURE RARE'
    if value == 'SP' or 'SPECIAL' in value:
        return 'SP'
    if 'PANDA' in value:
        return 'PANDA'
    if 'ALT' in value or 'PARALLEL' in value:
        return 'ALT'
    return 'STANDARD'

def target_filename(card: dict) -> str:
    code = str(card.get('code') or card.get('name') or 'UNKNOWN').replace('/', '-').replace(' ', '_')
    variant = normalize_variant(card.get('variant', 'STANDARD')).replace(' ', '_')
    version = card.get('version') or 1
    return f'{code}_V{version}_{variant}.webp'

def download_image(url: str, dest: Path) -> bool:
    if not url:
        return False
    try:
        response = SESSION.get(url, timeout=35)
        response.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(response.content)
        return True
    except Exception:
        return False

def hydrate_missing_don_images(cards: list[dict], images_dir: Path) -> int:
    count = 0
    for card in cards:
        if not is_don_card(card):
            continue
        image_file = str(card.get('image_file') or '').strip()
        image_url = str(card.get('image_url') or '').strip()
        if image_file and (images_dir.parent / image_file).exists():
            continue
        if not image_url:
            continue
        filename = target_filename(card)
        local_path = images_dir / filename
        if download_image(image_url, local_path):
            rel = local_path.relative_to(images_dir.parent).as_posix()
            card['image_file'] = rel
            card['variant'] = normalize_variant(card.get('variant'))
            if not card.get('rarity'):
                card['rarity'] = 'DON!!'
            count += 1
    return count

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--cards', required=True, help='cards.json déjà généré par ton scraper')
    parser.add_argument('--images-dir', required=True, help='dossier images cible')
    args = parser.parse_args()

    cards_path = Path(args.cards)
    images_dir = Path(args.images_dir)
    payload = json.loads(cards_path.read_text(encoding='utf-8'))
    cards = payload if isinstance(payload, list) else payload.get('cards', [])

    updated = hydrate_missing_don_images(cards, images_dir)

    if isinstance(payload, list):
        cards_path.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding='utf-8')
    else:
        payload['cards'] = cards
        cards_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'DON!! images ajoutées : {updated}')

if __name__ == '__main__':
    main()
