"""
WorkHours Ultra – Timeline v2 (Style Axostic - Image 3)
"""
import customtkinter as ctk
from datetime import date, timedelta
from ui.styles import COLORS, FONTS, DIMS
from calculator import format_hours

class StatsPanel(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self._build()

    def _build(self):
        # Card Background
        self.card = ctk.CTkFrame(self, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        self.card.pack(fill="both", expand=True, padx=DIMS["section_padding"], pady=(5, 20))

        # Header Timeline
        header = ctk.CTkFrame(self.card, fg_color="transparent", height=80)
        header.pack(fill="x", padx=30, pady=(20, 10))
        
        ctk.CTkLabel(header, text="Timeline des projets", font=FONTS["title"], text_color=COLORS["text_primary"]).pack(side="left")

        # Select Date (Right)
        right_actions = ctk.CTkFrame(header, fg_color="transparent")
        right_actions.pack(side="right")
        
        ctk.CTkButton(right_actions, text="⬅", width=44, height=44, fg_color=COLORS["bg_primary"], text_color=COLORS["text_secondary"], corner_radius=22).pack(side="left", padx=5)
        # Combo Month
        self.month_var = ctk.StringVar(value="Août 2021")
        self.month_menu = ctk.CTkOptionMenu(right_actions, values=["Août 2021", "Septembre 2021"], variable=self.month_var, width=160, height=44, corner_radius=12, fg_color=COLORS["bg_primary"], button_color=COLORS["bg_hover"], text_color=COLORS["text_primary"])
        self.month_menu.pack(side="left", padx=5)
        ctk.CTkButton(right_actions, text="➡", width=44, height=44, fg_color=COLORS["bg_primary"], text_color=COLORS["text_secondary"], corner_radius=22).pack(side="left", padx=5)

        # Timeline Container
        self.timeline_area = ctk.CTkFrame(self.card, fg_color="transparent")
        self.timeline_area.pack(fill="both", expand=True, padx=20, pady=10)

        # 1. Date Axis (Top)
        self.axis = ctk.CTkFrame(self.timeline_area, fg_color="transparent", height=60)
        self.axis.pack(fill="x")
        self._draw_date_axis()

        # 2. Grid & Tracks
        self.scroll_tracks = ctk.CTkScrollableFrame(self.timeline_area, fg_color="transparent")
        self.scroll_tracks.pack(fill="both", expand=True)

        self.refresh()

    def _draw_date_axis(self):
        # Axis labels for 15 days
        today = date.today()
        start = today - timedelta(days=7)
        
        # Grid layout for labels
        self.axis.grid_columnconfigure(tuple(range(1, 16)), weight=1)
        # Empty space for company labels
        ctk.CTkLabel(self.axis, text="", width=150).grid(row=0, column=0)
        
        for i in range(15):
            d = start + timedelta(days=i)
            is_today = (d == today)
            
            box = ctk.CTkFrame(self.axis, fg_color="transparent")
            box.grid(row=0, column=i+1, sticky="nsew", pady=5)
            
            # Simulated Bubble design
            if is_today:
                bubble = ctk.CTkFrame(box, fg_color=COLORS["accent"], corner_radius=8, width=50, height=40)
                bubble.pack(expand=True)
                ctk.CTkLabel(bubble, text="Auj.", font=FONTS["small"], text_color="#FFFFFF").pack()
                ctk.CTkLabel(bubble, text=d.strftime("%d"), font=FONTS["label"], text_color="#FFFFFF").pack()
            else:
                ctk.CTkLabel(box, text=d.strftime("%d"), font=FONTS["small"], text_color=COLORS["text_muted"]).pack(expand=True)

    def refresh(self):
        for widget in self.scroll_tracks.winfo_children(): widget.destroy()
        
        ents = self.db.get_all_enterprises()
        days = self.db.get_all_days()
        
        if not ents:
            ctk.CTkLabel(self.scroll_tracks, text="Aucune entreprise pour afficher la timeline.", font=FONTS["body"], text_color=COLORS["text_muted"]).pack(pady=40)
            return

        today = date.today()
        start = today - timedelta(days=7)

        # Draw Tracks
        for ent in ents:
            track = ctk.CTkFrame(self.scroll_tracks, fg_color="transparent", height=70)
            track.pack(fill="x", pady=5)
            track.grid_columnconfigure(tuple(range(1, 16)), weight=1)
            
            # Company Label
            ctk.CTkLabel(track, text=ent.name, font=FONTS["label"], text_color=COLORS["text_secondary"], width=150, anchor="w").grid(row=0, column=0, padx=10)
            
            # Draw vertical grid dotted lines (simulated)
            for i in range(15):
                line = ctk.CTkFrame(track, fg_color=COLORS["border"], width=1)
                line.grid(row=0, column=i+1, sticky="nsw")
            
            # Find work days for this company in this range
            ent_days = [d for d in days if d.enterprise_id == ent.id]
            for d_idx in range(15):
                curr_date = (start + timedelta(days=d_idx)).isoformat()
                work_day = next((d for d in ent_days if d.date_str == curr_date), None)
                
                if work_day and work_day.total_hours > 0:
                    # Draw a Block!
                    # Color based on hours
                    color = "#3B82F6" if work_day.total_hours > 8 else "#00C2FF"
                    if work_day.day_type == "leave": color = "#10B981"
                    
                    block = ctk.CTkFrame(track, fg_color=color, corner_radius=20, height=36)
                    block.grid(row=0, column=d_idx+1, sticky="ew", padx=2, pady=17)
                    
                    # Tooltip/Mini-info inside
                    ctk.CTkLabel(block, text=f"{format_hours(work_day.total_hours)}", font=FONTS["small"], text_color="#FFFFFF").pack(padx=10)
