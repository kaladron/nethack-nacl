// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclbind.h"
#include "naclmsg.h"


static EndOfMessage eom;


void nacl_init_nhwindows(int* argc, char** argv) {
  NaClMessage msg;
  msg << NACL_MSG_INIT_NHWINDOWS;
  for (int i = 0; i < *argc; ++i) {
    msg << argv[i];
  }
  msg<< eom;
}

void nacl_player_selection(void) {
  NaClMessage() << NACL_MSG_PLAYER_SELECTION << eom;
}

void nacl_askname(void) {
  NaClMessage() << NACL_MSG_ASKNAME << eom;
}

void nacl_get_nh_event(void) {
  NaClMessage() << NACL_MSG_GET_NH_EVENT << eom;
}

void nacl_exit_nhwindows(const char *str) {
  NaClMessage() << NACL_MSG_EXIT_NHWINDOWS << str << eom;
}

void nacl_suspend_nhwindows(const char *str) {
  NaClMessage() << NACL_MSG_SUSPEND_NHWINDOWS << str << eom;
}

void nacl_resume_nhwindows(void) {
  NaClMessage() << NACL_MSG_RESUME_NHWINDOWS << eom;
}

winid nacl_create_nhwindow(int type) {
  NaClMessage() << NACL_MSG_CREATE_NHWINDOW << type << eom;
  return 0;
}

void nacl_create_nhwindow_by_id(int type, winid i) {
  NaClMessage() << NACL_MSG_CREATE_NHWINDOW_BY_ID << type << i << eom;
}

void nacl_clear_nhwindow(winid wid) {
  NaClMessage() << NACL_MSG_CLEAR_NHWINDOW << wid << eom;
}

void nacl_display_nhwindow(winid wid, BOOLEAN_P block) {
  NaClMessage() << NACL_MSG_DISPLAY_NHWINDOW << wid << block << eom;
}

void nacl_destroy_nhwindow(winid wid) {
  NaClMessage() << NACL_MSG_DESTROY_NHWINDOW << wid << eom;
}

void nacl_curs(winid wid, int x, int y) {
  NaClMessage() << NACL_MSG_CURS << wid << x << y << eom;
}

void nacl_putstr(winid wid, int attr, const char *text) {
  NaClMessage() << NACL_MSG_PUTSTR << wid << attr << text << eom;
}

void nacl_display_file(const char *filename, BOOLEAN_P must_exist) {
  NaClMessage() << NACL_MSG_DISPLAY_FILE << filename << must_exist << eom;
}

void nacl_start_menu(winid wid) {
  NaClMessage() << NACL_MSG_START_MENU << wid << eom;
}

void nacl_add_menu(winid wid, int glyph, const ANY_P * identifier,
                   CHAR_P accelerator, CHAR_P group_accel, int attr, 
                   const char *str, BOOLEAN_P presel) {
  NaClMessage() << NACL_MSG_START_MENU << wid << glyph
                << (const char*)identifier
                << accelerator << group_accel << attr
                << str << presel << eom;
}

void nacl_end_menu(winid wid, const char *prompt) {
  NaClMessage() << NACL_MSG_END_MENU << wid << prompt << eom;
}

int  nacl_select_menu(winid wid, int how, MENU_ITEM_P **selected) {
  // TODO!!!!
  return 0;
}

/* No need for message_menu -- we'll use genl_message_menu instead */   
void nacl_update_inventory(void) {
  NaClMessage() << NACL_MSG_UPDATE_INVENTORY << eom;
}

void nacl_mark_synch(void) {
  NaClMessage() << NACL_MSG_MARK_SYNCH << eom;
}

void nacl_wait_synch(void) {
  NaClMessage() << NACL_MSG_WAIT_SYNCH << eom;
}

void nacl_cliparound(int x, int y) {
  NaClMessage() << NACL_MSG_CLIPAROUND << x << y << eom;
}

/* The following function does the right thing.  The nethack
 * nacl_cliparound (which lacks the winid) simply calls this funtion.
*/
void nacl_cliparound_proper(winid wid, int x, int y) {
  NaClMessage() << NACL_MSG_CLIPAROUND_PROPER << wid << x << y << eom;
}

void nacl_print_glyph(winid wid, XCHAR_P x, XCHAR_P y, int glyph) {
  NaClMessage() << NACL_MSG_PRINT_GLYPH << wid << x << y << glyph << eom;
}

void nacl_raw_print(const char *str) {
  NaClMessage() << NACL_MSG_RAW_PRINT << str << eom;
}

void nacl_raw_print_bold(const char *str) {
  NaClMessage() << NACL_MSG_RAW_PRINT_BOLD << str << eom;
}

int  nacl_nhgetch(void) {
  NaClMessage() << NACL_MSG_NHGETCH << eom;
  return 0;
}

int  nacl_nh_poskey(int *x, int *y, int *mod) {
  // TODO
  return 0;
}

void nacl_nhbell(void) {
  NaClMessage() << NACL_MSG_NHBELL << eom;
}

int nacl_doprev_message(void) {
  NaClMessage() << NACL_MSG_DOPREV_MESSAGE << eom;
  return 0;
}

char nacl_yn_function(const char *question, const char *choices,
                      CHAR_P def) {
  NaClMessage() << NACL_MSG_YN_FUNCTION << question << choices << def << eom;
  return 0;
}

void nacl_getlin(const char *question, char *input) {
  NaClMessage() << NACL_MSG_GETLIN << question << eom;
  // TODO store to input.
}

int nacl_get_ext_cmd(void) {
  NaClMessage() << NACL_MSG_GET_EXT_CMD << eom;
  return 0;
}

void nacl_number_pad(int state) {
  NaClMessage() << NACL_MSG_NUMBER_PAD << state << eom;
}

void nacl_delay_output(void) {
  NaClMessage() << NACL_MSG_DELAY_OUTPUT << eom;
}

void nacl_start_screen(void) {
  NaClMessage() << NACL_MSG_START_SCREEN << eom;
}

void nacl_end_screen(void) {
  NaClMessage() << NACL_MSG_END_SCREEN << eom;
}

void nacl_outrip(winid wid, int how) {
  NaClMessage() << NACL_MSG_OUTRIP << wid << how << eom;
}

void nacl_delete_nhwindow_by_reference(void *menuWin) {
  // TODO
}
