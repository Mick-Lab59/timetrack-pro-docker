"""
WorkHours Ultra – Gestion des Entreprises v2 (Style Axostic)
"""
import customtkinter as ctk
from ui.styles import COLORS, FONTS, DIMS
from models import Enterprise

class EnterprisesPanel(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self._build()

    def _build(self):
        # Card Background
        self.card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=22, border_width=1, border_color=COLORS["border"])
        self.card.pack(fill="both", expand=True, padx=DIMS["section_padding"], pady=(5, 30))

        # Header
        header = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        header.pack(fill="x", padx=30, pady=(25, 10))
        ctk.CTkLabel(header, text="Liste des Entreprises", font=FONTS["title"], text_color=COLORS["text_primary"]).pack(side="left")

        # Add Section (Inline)
        add_frame = ctk.CTkFrame(self.card, fg_color=COLORS["bg_primary"], corner_radius=18, height=80)
        add_frame.pack(fill="x", padx=30, pady=10)
        add_frame.pack_propagate(False)
        
        ctk.CTkLabel(add_frame, text="🏢", font=("Inter", 20)).pack(side="left", padx=(25, 10))
        self.ent_name = ctk.CTkEntry(add_frame, placeholder_text="Nom de l'entreprise...", font=FONTS["body"], border_width=0, fg_color="transparent", width=300)
        self.ent_name.pack(side="left", fill="y", padx=5)
        
        self.ent_note = ctk.CTkEntry(add_frame, placeholder_text="Note / Adresse...", font=FONTS["body"], border_width=0, fg_color="transparent", width=400)
        self.ent_note.pack(side="left", fill="y", padx=5)
        
        ctk.CTkButton(add_frame, text="＋ Ajouter", font=FONTS["nav"], fg_color=COLORS["accent"], width=130, height=44, corner_radius=12, command=self._add_enterprise).pack(side="right", padx=15, pady=18)

        # List Area
        self.scroll = ctk.CTkScrollableFrame(self.card, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=20, pady=10)

        self.refresh()

    def _add_enterprise(self):
        name = self.ent_name.get().strip()
        if not name: return
        self.db.save_enterprise(Enterprise(name=name, note=self.ent_note.get().strip()))
        self.ent_name.delete(0, 'end')
        self.ent_note.delete(0, 'end')
        self.refresh()

    def refresh(self):
        for w in self.scroll.winfo_children(): w.destroy()
        ents = self.db.get_all_enterprises()
        
        if not ents:
            ctk.CTkLabel(self.scroll, text="Aucune entreprise enregistrée.", font=FONTS["body"], text_color=COLORS["text_muted"]).pack(pady=50)
            return

        for ent in ents:
            row = ctk.CTkFrame(self.scroll, fg_color="transparent", height=75)
            row.pack(fill="x")
            ctk.CTkFrame(self.scroll, fg_color=COLORS["border"], height=1).pack(fill="x", padx=10)
            
            # Icon
            av = ctk.CTkFrame(row, width=44, height=44, corner_radius=22, fg_color=COLORS["bg_primary"])
            av.pack(side="left", padx=15, pady=15)
            ctk.CTkLabel(av, text=ent.name[:2].upper(), font=FONTS["label"], text_color=COLORS["accent"]).pack(expand=True)
            
            # Content
            info = ctk.CTkFrame(row, fg_color="transparent")
            info.pack(side="left", padx=10, fill="both", expand=True)
            ctk.CTkLabel(info, text=ent.name, font=FONTS["subhead"], text_color=COLORS["text_primary"]).pack(anchor="w", pady=(15, 0))
            ctk.CTkLabel(info, text=ent.note if ent.note else "Aucune note", font=FONTS["small"], text_color=COLORS["text_muted"]).pack(anchor="w")
            
            # Action
            ctk.CTkButton(row, text="🗑️", width=44, height=44, corner_radius=12, fg_color="transparent", text_color=COLORS["danger"], hover_color=COLORS["danger_bg"], command=lambda e_id=ent.id: self._delete_ent(e_id)).pack(side="right", padx=20)

    def _delete_ent(self, ent_id):
        self.db.delete_enterprise(ent_id)
        self.refresh()
