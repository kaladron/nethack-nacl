// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclbind.h"

/* Interface definition, for windows.c */
struct window_procs Nacl_procs = {
    "Nacl",
    WC_COLOR|WC_HILITE_PET|WC_INVERSE,
    0L,
    nacl_init_nhwindows,
    nacl_player_selection,
    nacl_askname,
    nacl_get_nh_event,
    nacl_exit_nhwindows,
    nacl_suspend_nhwindows,
    nacl_resume_nhwindows,
    nacl_create_nhwindow,
    nacl_clear_nhwindow,
    nacl_display_nhwindow,
    nacl_destroy_nhwindow,
    nacl_curs,
    nacl_putstr,
    nacl_display_file,
    nacl_start_menu,
    nacl_add_menu,
    nacl_end_menu,
    nacl_select_menu,
    genl_message_menu,          /* no need for X-specific handling */
    nacl_update_inventory,
    nacl_mark_synch,
    nacl_wait_synch,
#ifdef CLIPPING
    nacl_cliparound,
#endif
#ifdef POSITIONBAR
    donull,
#endif
    nacl_print_glyph,
    nacl_raw_print,
    nacl_raw_print_bold,
    nacl_nhgetch,
    nacl_nh_poskey,
    nacl_nhbell,
    nacl_doprev_message,
    nacl_yn_function,
    nacl_getlin,
    nacl_get_ext_cmd,
    nacl_number_pad,
    nacl_delay_output,
#ifdef CHANGE_COLOR     /* only a Mac option currently */
    donull,
    donull,
#endif
    /* other defs that really should go away (they're tty specific) */
    nacl_start_screen,
    nacl_end_screen,
    nacl_outrip,
    genl_preference_update,
};
