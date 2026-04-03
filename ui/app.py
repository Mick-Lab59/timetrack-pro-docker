"""
WorkHours Ultra – Navigation & Layout (Axostic Premium Design)
"""
import customtkinter as ctk
from PIL import Image
import os

from ui.styles import COLORS, FONTS, DIMS
from ui.dashboard import DashboardPanel
from ui.history import HistoryPanel
from ui.stats import StatsPanel
from ui.settings import SettingsPanel
from ui.add_day import AddDayPanel
from ui.enterprises import EnterprisesPanel

class App(ctk.CTk):
    def __init__(self, db):
        super().__init__()
        self.db = db
        
        # Configuration apparence globale
        ctk.set_appearance_mode("light")
        
        # Configuration fenêtre
        self.title("axostic. (WorkHours Ultra)")
        self.geometry("1400x900") # Plus grand pour le look "Desktop Dashboard"
        self.configure(fg_color=COLORS["bg_primary"])
        
        self.grid_columnconfigure(0, weight=0) # Sidebar
        self.grid_columnconfigure(1, weight=1) # Contenu
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar()
        
        self.content_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.content_frame.grid(row=0, column=1, sticky="nsew")
        self.content_frame.grid_columnconfigure(0, weight=1)
        self.content_frame.grid_rowconfigure(1, weight=1)
        
        self._build_top_bar()

        # Conteneur des panels
        self.container = ctk.CTkFrame(self.content_frame, fg_color="transparent")
        self.container.grid(row=1, column=0, sticky="nsew", padx=20, pady=0)
        
        self.panels = {}
        self._show_panel("dashboard")

    def _build_top_bar(self):
        top_bar = ctk.CTkFrame(self.content_frame, height=90, fg_color="transparent")
        top_bar.grid(row=0, column=0, sticky="ew", padx=30, pady=(20, 10))
        
        # Search area (Center-Left)
        search_frame = ctk.CTkFrame(top_bar, fg_color=COLORS["bg_secondary"], 
                                     border_width=1, border_color=COLORS["border"], corner_radius=15,
                                     width=400, height=48)
        search_frame.pack(side="left", padx=(10, 0))
        search_frame.pack_propagate(False)
        
        ctk.CTkLabel(search_frame, text="🔍", font=("Segoe UI Symbol", 14), text_color=COLORS["text_muted"]).pack(side="left", padx=(15, 0))
        ctk.CTkEntry(search_frame, placeholder_text="Search here...", 
                     font=FONTS["body"], border_width=0, fg_color="transparent", text_color=COLORS["text_primary"]).pack(side="left", fill="both", expand=True, padx=10)
        
        # User & Notif (Right)
        profile_frame = ctk.CTkFrame(top_bar, fg_color="transparent")
        profile_frame.pack(side="right")

        # Notif Circle
        notif_area = ctk.CTkFrame(profile_frame, width=44, height=44, corner_radius=22, 
                                  fg_color=COLORS["bg_secondary"], border_width=1, border_color=COLORS["border"])
        notif_area.pack(side="left", padx=15)
        notif_area.pack_propagate(False)
        ctk.CTkLabel(notif_area, text="🔔", font=("Segoe UI Symbol", 16)).pack(expand=True)
        # Badge rouge notif
        notif_badge = ctk.CTkFrame(notif_area, width=12, height=12, corner_radius=6, fg_color=COLORS["accent"])
        notif_badge.place(x=28, y=6)

        # Profile info
        user_info = ctk.CTkFrame(profile_frame, fg_color="transparent")
        user_info.pack(side="left", padx=(10, 0))
        
        # Simuler avatar avec une icône/image
        avatar = ctk.CTkFrame(user_info, width=44, height=44, corner_radius=22, fg_color=COLORS["accent"])
        avatar.pack(side="left")
        ctk.CTkLabel(avatar, text="ML", font=FONTS["label"], text_color="#FFFFFF").pack(expand=True)
        
        txt_box = ctk.CTkFrame(user_info, fg_color="transparent")
        txt_box.pack(side="left", padx=12)
        ctk.CTkLabel(txt_box, text="Mick Lab.", font=FONTS["label"], text_color=COLORS["text_primary"]).pack(anchor="w")
        ctk.CTkLabel(txt_box, text="Developer", font=FONTS["small"], text_color=COLORS["text_muted"]).pack(anchor="w")

    def _build_sidebar(self):
        sidebar = ctk.CTkFrame(self, width=DIMS["sidebar_width"], corner_radius=0, 
                               fg_color=COLORS["bg_sidebar"], border_width=0)
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)

        # Logo Axostic Style
        logo_area = ctk.CTkFrame(sidebar, fg_color="transparent")
        logo_area.pack(fill="x", pady=(40, 40), padx=30)
        
        # Icone logo simulée (A bleue)
        logo_icon = ctk.CTkLabel(logo_area, text="▲", font=("Arial Black", 24), text_color=COLORS["accent"])
        logo_icon.pack(side="left")
        
        ctk.CTkLabel(logo_area, text=" axostic.", font=("Inter", 24, "bold"), 
                     text_color=COLORS["text_primary"]).pack(side="left", padx=5)

        # GROS BOUTON ACTION RAPIDE
        self.action_btn = ctk.CTkButton(
            sidebar, text="＋ Nouvelle Saisie", font=FONTS["nav"],
            height=54, corner_radius=15,
            fg_color=COLORS["accent"], hover_color=COLORS["accent_hover"],
            command=lambda: self._on_add_day_request()
        )
        self.action_btn.pack(fill="x", padx=25, pady=(0, 20))

        # MAIN MENU Label
        ctk.CTkLabel(sidebar, text="  HOME", font=FONTS["label"], 
                     text_color=COLORS["text_muted"]).pack(anchor="w", padx=25, pady=(20, 10))

        self.nav_btns = {}
        # (key, icon, label)
        nav_config = [
            ("dashboard", "🏠", "Dashboard"),
            ("history",   "📜", "Historique"),
            ("stats",     "📊", "Timeline / Stats"),
            ("enterprises", "🏢", "Entreprises"),
        ]
        
        for key, icon, label in nav_config:
            btn = ctk.CTkButton(
                sidebar, text=f"   {icon}   {label}", 
                font=FONTS["nav"],
                anchor="w", height=52, corner_radius=15,
                fg_color="transparent", text_color=COLORS["text_secondary"],
                hover_color=COLORS["bg_hover"],
                command=lambda k=key: self._show_panel(k)
            )
            btn.pack(fill="x", padx=15, pady=4)
            self.nav_btns[key] = btn

        # Bottom section
        ctk.CTkLabel(sidebar, text="  SETTINGS", font=FONTS["label"], 
                     text_color=COLORS["text_muted"]).pack(anchor="w", padx=25, pady=(30, 10))
        
        settings_btn = ctk.CTkButton(
            sidebar, text="   ⚙️   Paramètres", 
            font=FONTS["nav"], anchor="w", height=52, corner_radius=15,
            fg_color="transparent", text_color=COLORS["text_secondary"],
            hover_color=COLORS["bg_hover"],
            command=lambda: self._show_panel("settings")
        )
        settings_btn.pack(fill="x", padx=15, pady=4)
        self.nav_btns["settings"] = settings_btn

    def _show_panel(self, key):
        # Update nav style
        for k, btn in self.nav_btns.items():
            if k == key:
                btn.configure(fg_color=COLORS["accent"], text_color="#FFFFFF", 
                              hover_color=COLORS["accent_hover"])
            else:
                btn.configure(fg_color="transparent", text_color=COLORS["text_secondary"],
                              hover_color=COLORS["bg_hover"])

        # Nettoyage du conteneur pour éviter la superposition
        for widget in self.container.winfo_children():
            widget.destroy()
            
        if key == "dashboard":
            self.panels[key] = DashboardPanel(self.container, self.db, self._on_add_day_request)
        elif key == "history":
            self.panels[key] = HistoryPanel(self.container, self.db, self._on_add_day_request)
        elif key == "stats":
            self.panels[key] = StatsPanel(self.container, self.db)
        elif key == "enterprises":
            self.panels[key] = EnterprisesPanel(self.container, self.db)
        elif key == "settings":
            self.panels[key] = SettingsPanel(self.container, self.db, self._refresh_all)
            
        self.panels[key].pack(fill="both", expand=True)

    def _on_add_day_request(self, date_str=None):
        # Nettoyage avant d'afficher le formulaire
        for widget in self.container.winfo_children():
            widget.destroy()
            
        self.add_panel = AddDayPanel(
            self.container, self.db, 
            on_save=self._on_save_success, 
            on_cancel=lambda: self._show_panel("dashboard"),
            initial_date=date_str
        )
        self.add_panel.pack(fill="both", expand=True)

    def _on_save_success(self):
        self._show_panel("dashboard")
        
    def _refresh_all(self):
        self._show_panel("dashboard")
