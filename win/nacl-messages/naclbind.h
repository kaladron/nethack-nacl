// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#pragma once

/* These are the base nethack include files */
extern "C" {
#include "hack.h"
#include "dlb.h"
#include "patchlevel.h"
}

/* Some prototypes */
void nacl_init_nhwindows(int* argc, char** argv);
void nacl_player_selection(void);
void nacl_askname(void);
void nacl_get_nh_event(void);
void nacl_exit_nhwindows(const char *);
void nacl_suspend_nhwindows(const char *);
void nacl_resume_nhwindows(void);
winid nacl_create_nhwindow(int type);
void nacl_create_nhwindow_by_id(int type, winid i);
void nacl_clear_nhwindow(winid wid);
void nacl_display_nhwindow(winid wid, BOOLEAN_P block);
void nacl_destroy_nhwindow(winid wid);
void nacl_curs(winid wid, int x, int y);
void nacl_putstr(winid wid, int attr, const char *text);
void nacl_display_file(const char *filename,BOOLEAN_P must_exist);
void nacl_start_menu(winid wid);
void nacl_add_menu(winid wid, int glyph, const ANY_P * identifier,
                CHAR_P accelerator, CHAR_P group_accel, int attr, 
                const char *str, BOOLEAN_P presel);
void nacl_end_menu(winid wid, const char *prompt);
int  nacl_select_menu(winid wid, int how, MENU_ITEM_P **selected);
/* No need for message_menu -- we'll use genl_message_menu instead */   
void nacl_update_inventory(void);
void nacl_mark_synch(void);
void nacl_wait_synch(void);
void nacl_cliparound(int x, int y);
/* The following function does the right thing.  The nethack
 * nacl_cliparound (which lacks the winid) simply calls this funtion.
*/
void nacl_cliparound_proper(winid wid, int x, int y);
void nacl_print_glyph(winid wid,XCHAR_P x,XCHAR_P y,int glyph);
void nacl_raw_print(const char *str);
void nacl_raw_print_bold(const char *str);
int  nacl_nhgetch(void);
int  nacl_nh_poskey(int *x, int *y, int *mod);
void nacl_nhbell(void);
int  nacl_doprev_message(void);
char nacl_yn_function(const char *question, const char *choices,
                CHAR_P def);
void nacl_getlin(const char *question, char *input);
int  nacl_get_ext_cmd(void);
void nacl_number_pad(int state);
void nacl_delay_output(void);
void nacl_start_screen(void);
void nacl_end_screen(void);
void nacl_outrip(winid wid, int how);
void nacl_delete_nhwindow_by_reference(void *menuWin);

