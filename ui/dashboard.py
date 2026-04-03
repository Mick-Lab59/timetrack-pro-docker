"""
WorkHours Ultra – Dashboard v2 (Style Axostic - Image 1)
"""
import customtkinter as ctk
from datetime import date, datetime
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np

from ui.styles import COLORS, FONTS, DIMS
from calculator import (
    format_hours, get_current_week_hours, get_current_month_hours,
    get_total_overtime, calculate_weekly_stats
)


class DashboardPanel(ctk.CTkFrame):
    def __init__(self, parent, db, on_add_day):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        self.on_add_day = on_add_day
        self._build()

    def _build(self):
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True)

        # ─── SECTION 1 : STAT CARDS (4 COLUMNS) ────────────────────────────────
        self.cards_frame = ctk.CTkFrame(self.scroll, fg_color="transparent")
        self.cards_frame.pack(fill="x", padx=10, pady=(0, 20))
        self.cards_frame.grid_columnconfigure((0, 1, 2, 3), weight=1, uniform="card")

        self.stats = {}
        # (key, label, icon, color, bg_color)
        configs = [
            ("today",  "Heures Aujourd'hui", "🕒", COLORS["accent"],  "#E0F7FF"),
            ("week",   "Heures Semaine",     "🗓️", COLORS["info"],    "#DBEAFE"),
            ("month",  "Heures Mois",        "📊", COLORS["success"], "#DCFCE7"),
            ("over",   "Heures Supp.",       "📈", COLORS["warning"], "#FEF3C7"),
        ]

        for i, (k, lbl, icon, color, bg) in enumerate(configs):
            card = ctk.CTkFrame(self.cards_frame, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
            card.grid(row=0, column=i, padx=10, pady=10, sticky="nsew")
            
            # Icon in circle
            icon_box = ctk.CTkFrame(card, width=50, height=50, corner_radius=25, fg_color=bg)
            icon_box.pack(anchor="w", padx=20, pady=(20, 10))
            icon_box.pack_propagate(False)
            ctk.CTkLabel(icon_box, text=icon, font=("Inter", 18)).pack(expand=True)
            
            ctk.CTkLabel(card, text=lbl, font=FONTS["small"], text_color=COLORS["text_secondary"]).pack(anchor="w", padx=25)
            
            val_lbl = ctk.CTkLabel(card, text="0h00", font=FONTS["stat"], text_color=COLORS["text_primary"])
            val_lbl.pack(anchor="w", padx=24, pady=(0, 5))
            
            # Trend
            trend_box = ctk.CTkFrame(card, fg_color="transparent")
            trend_box.pack(anchor="w", padx=25, pady=(0, 20))
            ctk.CTkLabel(trend_box, text="↑ 12%", font=FONTS["small"], text_color=COLORS["success"]).pack(side="left")
            ctk.CTkLabel(trend_box, text=" This week", font=FONTS["small"], text_color=COLORS["text_muted"]).pack(side="left", padx=5)
            
            self.stats[k] = val_lbl

        # ─── SECTION 2 : DOUBLE CHART (GRID 2x2 simulated) ────────────────────
        self.grid_charts = ctk.CTkFrame(self.scroll, fg_color="transparent")
        self.grid_charts.pack(fill="x", padx=10)
        self.grid_charts.grid_columnconfigure((0, 1), weight=1, uniform="chart")

        # A. Task Statistic (BARS)
        bar_card = ctk.CTkFrame(self.grid_charts, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        bar_card.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        ctk.CTkLabel(bar_card, text="Heures par mois", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(20, 10))
        self.bar_area = ctk.CTkFrame(bar_card, fg_color="transparent", height=280)
        self.bar_area.pack(fill="both", expand=True, padx=10, pady=10)

        # B. Product Sales (AREA)
        area_card = ctk.CTkFrame(self.grid_charts, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        area_card.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        ctk.CTkLabel(area_card, text="Tendance Hebdomadaire", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(20, 10))
        self.area_area = ctk.CTkFrame(area_card, fg_color="transparent", height=280)
        self.area_area.pack(fill="both", expand=True, padx=10, pady=10)

        # ─── SECTION 3 : LISTS (GRID 1x2 simulated) ───────────────────────────
        self.grid_lists = ctk.CTkFrame(self.scroll, fg_color="transparent")
        self.grid_lists.pack(fill="x", padx=10, pady=(0, 30))
        self.grid_lists.grid_columnconfigure(0, weight=1)
        self.grid_lists.grid_columnconfigure(1, weight=2)

        # A. Mini List (Derniers jours)
        mini_list = ctk.CTkFrame(self.grid_lists, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        mini_list.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        ctk.CTkLabel(mini_list, text="Dernières Saisies", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(20, 10))
        self.recent_days_area = ctk.CTkFrame(mini_list, fg_color="transparent")
        self.recent_days_area.pack(fill="both", expand=True, padx=15, pady=(0, 20))

        # B. Recent Summary Table
        summary_table = ctk.CTkFrame(self.grid_lists, fg_color=COLORS["bg_card"], corner_radius=20, border_width=1, border_color=COLORS["border"])
        summary_table.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        ctk.CTkLabel(summary_table, text="Aperçu des performances", font=FONTS["heading"], text_color=COLORS["text_primary"]).pack(anchor="w", padx=25, pady=(20, 10))
        self.table_area = ctk.CTkFrame(summary_table, fg_color="transparent")
        self.table_area.pack(fill="both", expand=True, padx=15, pady=(0, 20))

        self.refresh()

    def refresh(self):
        days = self.db.get_all_days()
        settings = self.db.get_all_settings()
        weekly_threshold = float(settings.get("weekly_hours_threshold", 35))
        week_start = int(settings.get("week_start_day", 0))

        # Update Stats
        today_str = date.today().isoformat()
        today_day = next((d for d in days if d.date_str == today_str), None)
        week_h, _ = get_current_week_hours(days, week_start)
        month_h = get_current_month_hours(days)
        overtime = get_total_overtime(days, weekly_threshold, week_start)

        self.stats["today"].configure(text=format_hours(today_day.total_hours if today_day else 0))
        self.stats["week"].configure(text=format_hours(week_h))
        self.stats["month"].configure(text=format_hours(month_h))
        self.stats["over"].configure(text=format_hours(overtime))

        self._draw_bar_chart(days)
        self._draw_area_chart(days)
        self._populate_recent_days(days)
        self._populate_table(days)

    def _draw_bar_chart(self, days):
        for w in self.bar_area.winfo_children(): w.destroy()
        # Last 6 months simplified
        labels = ["Jan", "Mar", "May", "Jul", "Sep", "Dec"]
        values = [2.5, 1.8, 3.2, 2.4, 1.9, 2.8] # Simulated for Axostic look
        
        fig, ax = plt.subplots(figsize=(5, 3), dpi=100)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")
        ax.bar(labels, values, color=COLORS["accent"], width=0.4)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(axis='both', colors=COLORS["text_secondary"], labelsize=9)
        plt.tight_layout()
        canvas = FigureCanvasTkAgg(fig, master=self.bar_area)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

    def _draw_area_chart(self, days):
        for w in self.area_area.winfo_children(): w.destroy()
        labels = ["Jan", "Mar", "May", "Jul", "Sep", "Dec"]
        values = [1.2, 2.5, 1.8, 3.4, 2.1, 3.1]
        
        fig, ax = plt.subplots(figsize=(5, 3), dpi=100)
        fig.patch.set_facecolor("#FFFFFF")
        ax.set_facecolor("#FFFFFF")
        ax.plot(labels, values, color=COLORS["accent"], linewidth=3, marker='o', markersize=6, markerfacecolor='white', markeredgewidth=2)
        ax.fill_between(labels, values, color=COLORS["accent"], alpha=0.1)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.tick_params(axis='both', colors=COLORS["text_secondary"], labelsize=9)
        plt.tight_layout()
        canvas = FigureCanvasTkAgg(fig, master=self.area_area)
        canvas.draw()
        canvas.get_tk_widget().pack(fill="both", expand=True)

    def _populate_recent_days(self, days):
        for w in self.recent_days_area.winfo_children(): w.destroy()
        ents = {e.id: e.name for e in self.db.get_all_enterprises()}
        for d in days[:3]:
            row = ctk.CTkFrame(self.recent_days_area, fg_color="transparent")
            row.pack(fill="x", pady=8)
            
            # Simulated Avatar
            av = ctk.CTkFrame(row, width=40, height=40, corner_radius=20, fg_color=COLORS["bg_primary"])
            av.pack(side="left")
            ctk.CTkLabel(av, text=d.date_str[-2:], font=FONTS["small"]).pack(expand=True)
            
            info = ctk.CTkFrame(row, fg_color="transparent")
            info.pack(side="left", padx=15)
            ctk.CTkLabel(info, text=ents.get(d.enterprise_id, "Inconnu"), font=FONTS["label"]).pack(anchor="w")
            ctk.CTkLabel(info, text=d.date_str, font=FONTS["small"], text_color=COLORS["text_muted"]).pack(anchor="w")
            
            ctk.CTkLabel(row, text=">", font=FONTS["heading"], text_color=COLORS["accent"]).pack(side="right")

    def _populate_table(self, days):
        for w in self.table_area.winfo_children(): w.destroy()
        # Small header
        header = ctk.CTkFrame(self.table_area, fg_color=COLORS["bg_primary"], height=40, corner_radius=10)
        header.pack(fill="x", pady=5)
        header.pack_propagate(False)
        ctk.CTkLabel(header, text="Date", font=FONTS["label"], width=150, anchor="w").pack(side="left", padx=20)
        ctk.CTkLabel(header, text="Heures", font=FONTS["label"], width=100).pack(side="left")
        ctk.CTkLabel(header, text="Status", font=FONTS["label"]).pack(side="right", padx=20)

        for d in days[:4]:
            row = ctk.CTkFrame(self.table_area, fg_color="transparent", height=50)
            row.pack(fill="x")
            ctk.CTkFrame(self.table_area, fg_color=COLORS["border"], height=1).pack(fill="x", padx=10)
            
            ctk.CTkLabel(row, text=d.date_str, font=FONTS["body"], width=150, anchor="w").pack(side="left", padx=20)
            ctk.CTkLabel(row, text=format_hours(d.total_hours), font=FONTS["body"], width=100).pack(side="left")
            
            status_bg = COLORS["success_bg"] if d.total_hours >= 7 else COLORS["warning_bg"]
            status_txt = COLORS["success"] if d.total_hours >= 7 else COLORS["warning"]
            label = "In Stock" if d.total_hours >= 7 else "Low" # Playful adaptation
            
            badge = ctk.CTkFrame(row, fg_color=status_bg, corner_radius=8, height=28)
            badge.pack(side="right", padx=20, pady=10)
            ctk.CTkLabel(badge, text=f" ● {label} ", font=FONTS["small"], text_color=status_txt).pack(padx=10)
