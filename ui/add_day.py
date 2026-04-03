"""
WorkHours Ultra – Formulaire d'ajout v2 (Style Axostic)
"""
import customtkinter as ctk
from datetime import date, datetime
from ui.styles import COLORS, FONTS, DIMS, DAY_TYPES
from models import WorkDay, TimeSlot

class AddDayPanel(ctk.CTkFrame):
    def __init__(self, parent, db, on_save, on_cancel, initial_date=None):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self.on_save = on_save
        self.on_cancel = on_cancel
        self.initial_date = initial_date or date.today().isoformat()
        
        self.work_day = self.db.get_day_by_date(self.initial_date)
        if not self.work_day:
            self.work_day = WorkDay(date_str=self.initial_date, time_slots=[TimeSlot()])

        self.enterprises = self.db.get_all_enterprises()
        self.ent_names = ["Aucune"] + [e.name for e in self.enterprises]

        self._build()

    def _build(self):
        # Card Background
        self.card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=22, border_width=1, border_color=COLORS["border"])
        self.card.pack(fill="both", expand=True, padx=DIMS["section_padding"], pady=(5, 30))

        # Header
        header = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        header.pack(fill="x", padx=30, pady=(25, 10))
        title_text = "Modifier la journée" if self.work_day.id else "Nouvelle session"
        ctk.CTkLabel(header, text=title_text, font=FONTS["title"], text_color=COLORS["text_primary"]).pack(side="left")

        # Form Scrollable
        self.form = ctk.CTkScrollableFrame(self.card, fg_color="transparent")
        self.form.pack(fill="both", expand=True, padx=20, pady=10)

        # ─── SECTION 1 : INFOS GÉNÉRALES ──────────────────────────────────────
        row1 = ctk.CTkFrame(self.form, fg_color="transparent")
        row1.pack(fill="x", padx=25, pady=20)

        # Date
        f_date = ctk.CTkFrame(row1, fg_color="transparent")
        f_date.grid(row=0, column=0, sticky="w", padx=(0, 20))
        ctk.CTkLabel(f_date, text="Date :", font=FONTS["label"], text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.date_entry = ctk.CTkEntry(f_date, placeholder_text="AAAA-MM-JJ", width=200, height=44, font=FONTS["body"], 
                                       fg_color=COLORS["bg_primary"], border_width=1, border_color=COLORS["border"], corner_radius=12)
        self.date_entry.insert(0, self.work_day.date_str)
        self.date_entry.pack(pady=8)

        # Type
        f_type = ctk.CTkFrame(row1, fg_color="transparent")
        f_type.grid(row=0, column=1, sticky="w", padx=(0, 20))
        ctk.CTkLabel(f_type, text="Type :", font=FONTS["label"], text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.type_var = ctk.StringVar(value=self.work_day.day_type)
        self.type_menu = ctk.CTkOptionMenu(f_type, values=list(DAY_TYPES.keys()), variable=self.type_var, width=200, height=44,
            font=FONTS["nav"], fg_color=COLORS["bg_primary"], button_color=COLORS["accent"],
            text_color=COLORS["text_primary"], dropdown_fg_color=COLORS["bg_sidebar"],
            border_width=1, border_color=COLORS["border"], corner_radius=12)
        self.type_menu.pack(pady=8)

        # Entreprise
        f_ent = ctk.CTkFrame(row1, fg_color="transparent")
        f_ent.grid(row=0, column=2, sticky="w")
        ctk.CTkLabel(f_ent, text="Entreprise :", font=FONTS["label"], text_color=COLORS["text_secondary"]).pack(anchor="w")
        curr_ent = next((e.name for e in self.enterprises if e.id == self.work_day.enterprise_id), "Aucune")
        self.ent_var = ctk.StringVar(value=curr_ent)
        self.ent_menu = ctk.CTkOptionMenu(f_ent, values=self.ent_names, variable=self.ent_var, width=240, height=44,
            font=FONTS["nav"], fg_color=COLORS["bg_primary"], button_color=COLORS["accent"],
            text_color=COLORS["text_primary"], dropdown_fg_color=COLORS["bg_sidebar"],
            border_width=1, border_color=COLORS["border"], corner_radius=12)
        self.ent_menu.pack(pady=8)

        # ─── SECTION 2 : CRÉNEAUX ─────────────────────────────────────────────
        cols_area = ctk.CTkFrame(self.form, fg_color="transparent")
        cols_area.pack(fill="x", padx=25, pady=10)
        ctk.CTkLabel(cols_area, text="🕒 Plages horaires", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w")
        
        self.slots_list = ctk.CTkFrame(cols_area, fg_color="transparent")
        self.slots_list.pack(fill="x", pady=10)
        self.slot_rows = []
        for slot in self.work_day.time_slots: self._add_slot_row(slot)

        self.add_slot_btn = ctk.CTkButton(cols_area, text="＋ Ajouter une plage", font=FONTS["nav"],
                                          fg_color=COLORS["info_bg"], text_color=COLORS["info"], width=220, height=44, corner_radius=12,
                                          command=lambda: self._add_slot_row(TimeSlot()))
        self.add_slot_btn.pack(pady=(10, 20), anchor="w")

        # ─── SECTION 3 : NOTES ────────────────────────────────────────────────
        note_frame = ctk.CTkFrame(self.form, fg_color="transparent")
        note_frame.pack(fill="x", padx=25, pady=10)
        ctk.CTkLabel(note_frame, text="📝 Note / Description :", font=FONTS["label"], text_color=COLORS["text_secondary"]).pack(anchor="w")
        self.note_text = ctk.CTkTextbox(self.form, height=140, font=FONTS["body"], 
                                         fg_color=COLORS["bg_primary"], border_width=1, border_color=COLORS["border"], corner_radius=15)
        self.note_text.pack(fill="x", padx=25, pady=(8, 30))
        self.note_text.insert("0.0", self.work_day.note)

        # Footer Actions
        footer = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        footer.pack(fill="x", side="bottom", padx=30, pady=25)
        ctk.CTkButton(footer, text="Annuler", font=FONTS["nav"], fg_color=COLORS["bg_primary"], text_color=COLORS["text_secondary"], 
                      border_width=1, border_color=COLORS["border"], width=150, height=48, corner_radius=14, command=self.on_cancel).pack(side="left")
        ctk.CTkButton(footer, text="Sauvegarder", font=FONTS["nav"], fg_color=COLORS["accent"], width=200, height=48, corner_radius=14, command=self._save_action).pack(side="right")

    def _add_slot_row(self, slot):
        row = ctk.CTkFrame(self.slots_list, fg_color=COLORS["bg_primary"], corner_radius=15, height=60)
        row.pack(fill="x", pady=5)
        row.grid_columnconfigure((1, 3, 5, 6), weight=1)

        ctk.CTkLabel(row, text="Déb:", font=FONTS["small"]).grid(row=0, column=0, padx=(20, 5), pady=18)
        start_entry = ctk.CTkEntry(row, width=80, height=36, font=FONTS["body"], fg_color=COLORS["bg_card"], border_width=1, border_color=COLORS["border"])
        start_entry.insert(0, slot.start_time)
        start_entry.grid(row=0, column=1, sticky="w")

        ctk.CTkLabel(row, text="Fin:", font=FONTS["small"]).grid(row=0, column=2, padx=(15, 5))
        end_entry = ctk.CTkEntry(row, width=80, height=36, font=FONTS["body"], fg_color=COLORS["bg_card"], border_width=1, border_color=COLORS["border"])
        end_entry.insert(0, slot.end_time)
        end_entry.grid(row=0, column=3, sticky="w")

        ctk.CTkLabel(row, text="Pause:", font=FONTS["small"]).grid(row=0, column=4, padx=(15, 5))
        break_entry = ctk.CTkEntry(row, width=60, height=36, font=FONTS["body"], fg_color=COLORS["bg_card"], border_width=1, border_color=COLORS["border"])
        break_entry.insert(0, str(slot.break_minutes))
        break_entry.grid(row=0, column=5, sticky="w")

        label_entry = ctk.CTkEntry(row, width=200, placeholder_text="Label", font=FONTS["body"], fg_color="transparent", border_width=0)
        label_entry.insert(0, slot.label)
        label_entry.grid(row=0, column=6, padx=10, sticky="ew")

        del_btn = ctk.CTkButton(row, text="✕", width=36, height=36, font=FONTS["label"], fg_color="transparent", text_color=COLORS["danger"], command=lambda: self._remove_slot(row))
        del_btn.grid(row=0, column=7, padx=15)
        self.slot_rows.append({"frame": row, "start": start_entry, "end": end_entry, "break": break_entry, "label": label_entry})

    def _remove_slot(self, row_frame):
        if len(self.slot_rows) <= 1: return
        for i, entry in enumerate(self.slot_rows):
            if entry["frame"] == row_frame:
                entry["frame"].destroy(); self.slot_rows.pop(i); break

    def _save_action(self):
        date_str = self.date_entry.get().strip(); day_type = self.type_var.get(); note = self.note_text.get("0.0", "end").strip()
        ent_name = self.ent_var.get(); ent_id = next((e.id for e in self.enterprises if e.name == ent_name), None)
        try: datetime.strptime(date_str, "%Y-%m-%d")
        except: self.date_entry.configure(border_color=COLORS["danger"]); return
        new_slots = []
        for row in self.slot_rows:
            try:
                s, e, b, l = row["start"].get().strip(), row["end"].get().strip(), int(row["break"].get().strip() or 0), row["label"].get().strip()
                if ":" in s and ":" in e: new_slots.append(TimeSlot(start_time=s, end_time=e, break_minutes=b, label=l))
            except: continue
        self.work_day.date_str = date_str; self.work_day.day_type = day_type; self.work_day.note = note
        self.work_day.enterprise_id = ent_id; self.work_day.time_slots = new_slots
        self.db.save_work_day(self.work_day); self.on_save()
