"""
WorkHours Ultra – Paramètres v2 (Style Axostic)
"""
import customtkinter as ctk
import os
from ui.styles import COLORS, FONTS, DIMS
from export import export_csv, export_excel

class SettingsPanel(ctk.CTkFrame):
    def __init__(self, parent, db, on_refresh_all):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self.on_refresh_all = on_refresh_all
        self._build()

    def _build(self):
        # Card Background
        self.card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=22, border_width=1, border_color=COLORS["border"])
        self.card.pack(fill="both", expand=True, padx=DIMS["section_padding"], pady=(5, 30))

        # Header
        header = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        header.pack(fill="x", padx=30, pady=(25, 10))
        ctk.CTkLabel(header, text="Paramètres de l'application", font=FONTS["title"], text_color=COLORS["text_primary"]).pack(side="left")

        # Scrollable
        self.scroll = ctk.CTkScrollableFrame(self.card, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=20, pady=10)

        # ─── SECTION 1 : CONFIGURATION ────────────────────────────────────────
        ctk.CTkLabel(self.scroll, text="🕒 Temps de travail", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(20, 15))
        
        self._add_setting_row(self.scroll, "Seuil hebdomadaire (heures)", "weekly_hours_threshold", "35")
        self._add_setting_row(self.scroll, "Seuil quotidien (référence)", "daily_hours_threshold", "7")
        self._add_setting_row(self.scroll, "Premier jour de la semaine (0-6)", "week_start_day", "0")

        ctk.CTkButton(self.scroll, text="Enregistrer les paramètres", font=FONTS["nav"], fg_color=COLORS["accent"], height=48, corner_radius=14, command=self._save_settings).pack(padx=25, pady=(35, 25), anchor="w")

        # Divider
        ctk.CTkFrame(self.scroll, fg_color=COLORS["border"], height=1).pack(fill="x", padx=15, pady=25)

        # ─── SECTION 2 : EXPORTS & MAINTENANCE ──────────────────────────────
        ctk.CTkLabel(self.scroll, text="💾 Données & Exports", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(15, 20))

        btn_row = ctk.CTkFrame(self.scroll, fg_color="transparent")
        btn_row.pack(fill="x", padx=25)
        
        ctk.CTkButton(btn_row, text="📊 Exporter Excel (.xlsx)", font=FONTS["nav"], fg_color=COLORS["info_bg"], text_color=COLORS["info"], width=220, height=54, corner_radius=14, command=self._export_excel_action).pack(side="left", padx=(0, 15))
        ctk.CTkButton(btn_row, text="🗒️ Exporter CSV (.csv)", font=FONTS["nav"], fg_color=COLORS["bg_primary"], text_color=COLORS["text_secondary"], border_width=1, border_color=COLORS["border"], width=220, height=54, corner_radius=14, command=self._export_csv_action).pack(side="left", padx=15)

        # Database info box
        db_frame = ctk.CTkFrame(self.scroll, fg_color=COLORS["bg_primary"], corner_radius=15)
        db_frame.pack(fill="x", padx=25, pady=40)
        ctk.CTkLabel(db_frame, text=f"📍 Base de données locale : {self.db.db_path}", font=FONTS["small"], text_color=COLORS["text_secondary"], justify="left").pack(padx=20, pady=20)

    def _add_setting_row(self, parent, label, key, default):
        row = ctk.CTkFrame(parent, fg_color="transparent", height=60)
        row.pack(fill="x", padx=25, pady=5)
        row.pack_propagate(False)
        ctk.CTkLabel(row, text=label, font=FONTS["body"], text_color=COLORS["text_secondary"]).pack(side="left")
        
        val = self.db.get_setting(key, default)
        var = ctk.StringVar(value=val)
        entry = ctk.CTkEntry(row, textvariable=var, width=120, height=38, font=FONTS["body"], fg_color=COLORS["bg_primary"], border_width=1, border_color=COLORS["border"], corner_radius=10)
        entry.pack(side="right")
        
        if not hasattr(self, "setting_vars"): self.setting_vars = {}
        self.setting_vars[key] = var

    def _save_settings(self):
        for k, v in self.setting_vars.items(): self.db.set_setting(k, v.get())
        self.on_refresh_all()

    def _export_excel_action(self):
        days = self.db.get_all_days(); desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        filepath = os.path.join(desktop, f"WorkHours_Axostic_Export_{os.getpid()}.xlsx")
        try: export_excel(days, filepath, "Rapport Heures"); print(f"Export OK: {filepath}")
        except: pass

    def _export_csv_action(self):
        days = self.db.get_all_days(); desktop = os.path.join(os.path.expanduser("~"), "Desktop")
        filepath = os.path.join(desktop, f"WorkHours_Export_{os.getpid()}.csv")
        export_csv(days, filepath); print(f"Export CSV OK: {filepath}")
