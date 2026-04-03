"""
WorkHours Ultra – Thème et couleurs (Style Axostic - Premium Light)
"""

# ─── PALETTE DE COULEURS AXOSTIC ──────────────────────────────────────────────

COLORS = {
    # Fond principal
    "bg_primary":      "#F8F9FD",   # Gris bleuté ultra-clair
    "bg_secondary":    "#FFFFFF",   # Blanc pur pour les cartes
    "bg_card":         "#FFFFFF",   # Cartes blanches
    "bg_hover":        "#F1F5F9",   # Survol gris clair
    "bg_sidebar":      "#FFFFFF",   # Sidebar blanche (Style Axostic)
    "bg_active_nav":   "#00C2FF",   # Accent Cyan pour la navigation active
    "bg_input":        "#F1F5F9",   # Fond d'input gris très clair
    "bg_accent":       "#00C2FF",   # Fond d'accent pour boutons

    # Accents
    "accent":          "#00C2FF",   # Cyan brillant (Axostic Style)
    "accent_hover":    "#00B4E6",
    "accent_dark":     "#0096C7",
    "success":         "#10B981",   # Emerald (badges status)
    "success_bg":      "#DCFCE7",   # Pastel green
    "warning":         "#F59E0B",   # Amber
    "warning_bg":      "#FEF3C7",   # Pastel amber
    "danger":          "#EF4444",   # Red
    "danger_bg":       "#FEE2E2",   # Pastel red
    "info":            "#3B82F6",   # Blue (pour les graphiques)
    "info_bg":         "#DBEAFE",   # Pastel blue

    # Texte
    "text_primary":    "#1E293B",   # Slate 800 (très lisible)
    "text_secondary":  "#64748B",   # Slate 500 (muted)
    "text_muted":      "#94A3B8",   # Slate 400 (light)
    "text_accent":     "#00C2FF",   # Cyan text
    "text_nav_active": "#FFFFFF",   # Texte blanc sur fond cyan

    # Bordures
    "border":          "#E2E8F0",   # Bordures fines (Slate 200)
    "border_light":    "#F1F5F9",

    # Type de jours
    "type_work":   "#00C2FF",
    "type_leave":  "#10B981",
    "type_rtt":    "#3B82F6",
    "type_sick":   "#F59E0B",
}

# ─── POLICES AXOSTIC ──────────────────────────────────────────────────────────

FONTS = {
    "title":   ("Inter", 28, "bold"),
    "heading": ("Inter", 18, "bold"),
    "subhead": ("Inter", 15, "bold"),
    "body":    ("Inter", 14),
    "small":   ("Inter", 12),
    "mono":    ("Consolas", 12),
    "hero":    ("Inter", 32, "bold"),
    "stat":    ("Inter", 34, "bold"),
    "label":   ("Inter", 13, "bold"),
    "nav":     ("Inter", 14, "bold"),
}

# ─── DIMENSIONS AXOSTIC ───────────────────────────────────────────────────────

DIMS = {
    "sidebar_width":    280,
    "corner_radius":    20,      # Coins TRÈS arrondis comme sur les images
    "btn_corner":       14,
    "card_padding":     30,
    "section_padding":  35,
}

# Types de jours avec labels et couleurs
DAY_TYPES = {
    "work":  {"label": "Travail",  "color": COLORS["type_work"],  "emoji": "💼"},
    "leave": {"label": "Congé",    "color": COLORS["type_leave"], "emoji": "🏖️"},
    "rtt":   {"label": "RTT",      "color": COLORS["type_rtt"],   "emoji": "📅"},
    "sick":  {"label": "Maladie",  "color": COLORS["type_sick"],  "emoji": "🤒"},
}
