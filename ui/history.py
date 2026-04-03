"""
WorkHours Ultra – Historique v2 (Style Axostic - Image 2)
"""
import customtkinter as ctk
from datetime import datetime
from ui.styles import COLORS, FONTS, DIMS, DAY_TYPES
from calculator import format_hours

class HistoryPanel(ctk.CTkFrame):
    def __init__(self, parent, db, on_edit_day):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self.on_edit_day = on_edit_day
        self._build()

    def _build(self):
        # Background Card
        self.card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        self.card.pack(fill="both", expand=True, padx=DIMS["section_padding"], pady=(5, 20))

        # Header riche
        header = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        header.pack(fill="x", padx=30, pady=(20, 10))
        
        ctk.CTkLabel(header, text="Toutes les sessions", font=FONTS["title"], text_color=COLORS["text_primary"]).pack(side="left")

        # Search & Buttons (Right)
        right_actions = ctk.CTkFrame(header, fg_color="transparent")
        right_actions.pack(side="right")

        search_area = ctk.CTkFrame(right_actions, fg_color=COLORS["bg_primary"], border_width=1, border_color=COLORS["border"], corner_radius=12, width=280, height=44)
        search_area.pack(side="left", padx=15)
        search_area.pack_propagate(False)
        ctk.CTkLabel(search_area, text="🔍", font=("Segoe UI Symbol", 12)).pack(side="left", padx=12)
        self.search_entry = ctk.CTkEntry(search_area, placeholder_text="Rechercher...", font=FONTS["body"], border_width=0, fg_color="transparent")
        self.search_entry.pack(side="left", fill="both", expand=True, padx=5)

        ctk.CTkButton(right_actions, text="📊 Export", font=FONTS["nav"], fg_color=COLORS["info_bg"], text_color=COLORS["info"], width=110, height=44, corner_radius=12, hover_color=COLORS["bg_hover"]).pack(side="left", padx=5)
        ctk.CTkButton(right_actions, text="⏳ Filter", font=FONTS["nav"], fg_color=COLORS["accent"], text_color="#FFFFFF", width=110, height=44, corner_radius=12).pack(side="left", padx=5)

        # Table Header Row
        self.table_header = ctk.CTkFrame(self.card, fg_color="transparent", height=50)
        self.table_header.pack(fill="x", padx=30)
        
        # Columns: [X] Name(Date) | Position(Ent) | Country(Type) | Status | Role(Hours) | Action
        cols_config = [
            ("checkbox", 40),
            ("Date / Session", 280),
            ("Entreprise", 200),
            ("Type", 150),
            ("Status", 150),
            ("Total", 120),
            ("Action", 80),
        ]
        
        for i, (txt, w) in enumerate(cols_config):
            if txt == "checkbox":
                ctk.CTkCheckBox(self.table_header, text="", width=40, border_color=COLORS["border"], fg_color=COLORS["accent"]).pack(side="left", padx=(0, 10))
            else:
                lbl = ctk.CTkLabel(self.table_header, text=txt, font=FONTS["label"], text_color=COLORS["text_secondary"], width=w, anchor="w")
                lbl.pack(side="left", padx=5)

        # Divider
        ctk.CTkFrame(self.card, fg_color=COLORS["border"], height=1).pack(fill="x", padx=30)

        # Content Area (Scrollable)
        self.scroll_frame = ctk.CTkScrollableFrame(self.card, fg_color="transparent")
        self.scroll_frame.pack(fill="both", expand=True, padx=20, pady=5)

        self.refresh()

    def refresh(self):
        days = self.db.get_all_days()
        ents = {e.id: e.name for e in self.db.get_all_enterprises()}
        
        for widget in self.scroll_frame.winfo_children():
            widget.destroy()

        if not days:
            ctk.CTkLabel(self.scroll_frame, text="Aucun historique trouvé.", font=FONTS["body"], text_color=COLORS["text_muted"]).pack(pady=40)
            return

        for day in days:
            row = ctk.CTkFrame(self.scroll_frame, fg_color="transparent", height=70)
            row.pack(fill="x", pady=2)
            
            # Checkbox
            ctk.CTkCheckBox(row, text="", width=40, border_color=COLORS["border"], fg_color=COLORS["accent"]).pack(side="left", padx=(10, 10))
            
            # Date + Info (Avatar simulated)
            session_box = ctk.CTkFrame(row, fg_color="transparent", width=280)
            session_box.pack(side="left", padx=5)
            session_box.pack_propagate(False)
            
            # Avatar
            av = ctk.CTkFrame(session_box, width=44, height=44, corner_radius=22, fg_color=COLORS["bg_primary"])
            av.pack(side="left", pady=13)
            ctk.CTkLabel(av, text=day.date_str[-2:], font=FONTS["small"]).pack(expand=True)
            
            txt_box = ctk.CTkFrame(session_box, fg_color="transparent")
            txt_box.pack(side="left", padx=12, pady=13)
            ctk.CTkLabel(txt_box, text=day.date_str, font=FONTS["subhead"], text_color=COLORS["text_primary"]).pack(anchor="w")
            ctk.CTkLabel(txt_box, text=f"session_{day.id}@micklab.com", font=FONTS["small"], text_color=COLORS["text_muted"]).pack(anchor="w")

            # Entreprise
            ent_name = ents.get(day.enterprise_id, "Non spécifié")
            ctk.CTkLabel(row, text=ent_name, font=FONTS["body"], text_color=COLORS["text_primary"], width=204, anchor="w").pack(side="left", padx=5)

            # Type
            type_info = DAY_TYPES.get(day.day_type, DAY_TYPES["work"])
            ctk.CTkLabel(row, text=type_info["label"], font=FONTS["body"], text_color=COLORS["text_primary"], width=155, anchor="w").pack(side="left", padx=5)

            # Status Badge
            status_txt = "Complet" if day.total_hours >= 7 else "Incomplet"
            status_color = COLORS["success"] if status_txt == "Complet" else COLORS["warning"]
            status_bg = COLORS["success_bg"] if status_txt == "Complet" else COLORS["warning_bg"]
            
            badge_box = ctk.CTkFrame(row, fg_color="transparent", width=155)
            badge_box.pack(side="left", padx=5)
            badge_box.pack_propagate(False)
            
            badge = ctk.CTkFrame(badge_box, fg_color=status_bg, corner_radius=8, height=28)
            badge.pack(side="left", pady=21)
            ctk.CTkLabel(badge, text=f" {status_txt} ", font=FONTS["small"], text_color=status_color).pack(padx=10)

            # Total
            ctk.CTkLabel(row, text=format_hours(day.total_hours), font=FONTS["body"], text_color=COLORS["text_primary"], width=125, anchor="w").pack(side="left", padx=5)

            # Action Edit
            edit_btn = ctk.CTkButton(row, text="✏️", width=40, height=40, corner_radius=12, 
                                     fg_color=COLORS["bg_primary"], text_color=COLORS["accent"], 
                                     hover_color=COLORS["bg_hover"],
                                     command=lambda d=day.date_str: self.on_edit_day(d))
            edit_btn.pack(side="right", padx=20)
            
            # Separator
            ctk.CTkFrame(self.scroll_frame, fg_color=COLORS["border"], height=1).pack(fill="x", padx=10)
