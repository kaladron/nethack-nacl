// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

extern "C" {

#include "naclbind.h"

/* Interface definition, for windows.c */
struct window_procs Gnome_procs = {
    "Gnome",
    WC_COLOR|WC_HILITE_PET|WC_INVERSE,
    0L,
    donull, // gnome_init_nhwindows,
    donull, // gnome_player_selection,
    donull, // gnome_askname,
    donull, // gnome_get_nh_event,
    donull, // gnome_exit_nhwindows,
    donull, // gnome_suspend_nhwindows,
    donull, // gnome_resume_nhwindows,
    donull, // gnome_create_nhwindow,
    donull, // gnome_clear_nhwindow,
    donull, // gnome_display_nhwindow,
    donull, // gnome_destroy_nhwindow,
    donull, // gnome_curs,
    donull, // gnome_putstr,
    donull, // gnome_display_file,
    donull, // gnome_start_menu,
    donull, // gnome_add_menu,
    donull, // gnome_end_menu,
    donull, // gnome_select_menu,
    donull, // genl_message_menu,          /* no need for X-specific handling */
    donull, // gnome_update_inventory,
    donull, // gnome_mark_synch,
    donull, // gnome_wait_synch,
#ifdef CLIPPING
    donull, // gnome_cliparound,
#endif
#ifdef POSITIONBAR
    donull,
#endif
    donull, // gnome_print_glyph,
    donull, // gnome_raw_print,
    donull, // gnome_raw_print_bold,
    donull, // gnome_nhgetch,
    donull, // gnome_nh_poskey,
    donull, // gnome_nhbell,
    donull, // gnome_doprev_message,
    donull, // gnome_yn_function,
    donull, // gnome_getlin,
    donull, // gnome_get_ext_cmd,
    donull, // gnome_number_pad,
    donull, // gnome_delay_output,
#ifdef CHANGE_COLOR     /* only a Mac option currently */
    donull,
    donull,
#endif
    /* other defs that really should go away (they're tty specific) */
    donull, // gnome_start_screen,
    donull, // gnome_end_screen,
    donull, // gnome_outrip,
    donull, // genl_preference_update,
};

}
