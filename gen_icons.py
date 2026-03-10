import cairosvg
import os

os.makedirs('frontend/public', exist_ok=True)

blue_doc_path = '<path d="M6 4C4.89543 4 4 4.89543 4 6V22C4 23.1046 4.89543 24 6 24H16.5V28.5C16.5 28.9477 17.0423 29.1717 17.3591 28.8548L22.2139 24H24C25.1046 24 26 23.1046 26 22V12L18 4H6Z" fill="#2563EB"/>'
fold_path = '<path d="M18 4V10C18 11.1046 18.8954 12 20 12H26L18 4Z" fill="#93C5FD" opacity="0.9"/>'
lines = '<rect x="9" y="11" width="11" height="2.5" rx="1.25" fill="#0F172A"/><rect x="9" y="16.5" width="11" height="2.5" rx="1.25" fill="#0F172A"/>'
icon_only_content = blue_doc_path + fold_path + lines

def get_icon_svg(size):
    return f'<svg viewBox="0 0 32 32" width="{size}" height="{size}" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="white"/>{icon_only_content}</svg>'.encode('utf-8')

cairosvg.svg2png(bytestring=get_icon_svg(16), write_to='frontend/public/favicon-16x16.png')
cairosvg.svg2png(bytestring=get_icon_svg(32), write_to='frontend/public/favicon-32x32.png')
cairosvg.svg2png(bytestring=get_icon_svg(64), write_to='frontend/public/icon-64x64.png')
cairosvg.svg2png(bytestring=get_icon_svg(512), write_to='frontend/public/icon-512x512.png')

lockup_svg = """<svg viewBox="0 0 200 64" width="800" height="256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(10, 16)">
    <rect width="32" height="32" rx="8" fill="white"/>
    <path d="M6 4C4.89543 4 4 4.89543 4 6V22C4 23.1046 4.89543 24 6 24H16.5V28.5C16.5 28.9477 17.0423 29.1717 17.3591 28.8548L22.2139 24H24C25.1046 24 26 23.1046 26 22V12L18 4H6Z" fill="#2563EB"/>
    <path d="M18 4V10C18 11.1046 18.8954 12 20 12H26L18 4Z" fill="#93C5FD" opacity="0.9"/>
    <rect x="9" y="11" width="11" height="2.5" rx="1.25" fill="#0F172A"/>
    <rect x="9" y="16.5" width="11" height="2.5" rx="1.25" fill="#0F172A"/>
  </g>
  <text x="52" y="38" font-family="Noto Sans" font-weight="bold" font-size="22" fill="#0F172A">DevDocs AI</text>
</svg>"""

cairosvg.svg2png(bytestring=lockup_svg.encode('utf-8'), write_to='frontend/public/logo-lockup.png')
print("Icons generated!")
