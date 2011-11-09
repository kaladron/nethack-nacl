// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclbind.h"
#include "naclmsg.h"
#include <stdio.h>
#include <sstream>


static EndOfMessage eom;


void nacl_init_nhwindows(int* argc, char** argv) {
  NaClMessage msg;
  msg << NACL_MSG_INIT_NHWINDOWS;
  for (int i = 0; i < *argc; ++i) {
    msg << argv[i];
  }
  msg << eom;
}

void nacl_player_selection(void) {
  NaClMessage() << NACL_MSG_PLAYER_SELECTION << eom;
  
  // TODO actually allow player selection.
  // Lifted the gnome code for now, but made all selections random.


  int n, i, sel;
  const char** choices;
  int* pickmap;

  /* prevent an unnecessary prompt */
  rigid_role_checks();

  if (!flags.randomall && flags.initrole < 0) {

    /* select a role */
    for (n = 0; roles[n].name.m; n++) continue;
    choices = (const char **)alloc(sizeof(char *) * (n+1));
    pickmap = (int*)alloc(sizeof(int) * (n+1));
    for (;;) {
      for (n = 0, i = 0; roles[i].name.m; i++) {
        if (ok_role(i, flags.initrace,
                    flags.initgend, flags.initalign)) {
          if (flags.initgend >= 0 && flags.female && roles[i].name.f)
            choices[n] = roles[i].name.f;
          else
            choices[n] = roles[i].name.m;
          pickmap[n++] = i;
        }
      }
      if (n > 0) break;
      else if (flags.initalign >= 0) flags.initalign = -1;    /* reset */
      else if (flags.initgend >= 0) flags.initgend = -1;
      else if (flags.initrace >= 0) flags.initrace = -1;
      else panic("no available ROLE+race+gender+alignment combinations");
    }
    choices[n] = (const char *) 0;
    if (n > 1)
      // TODO: actually allow selection.
      sel = ROLE_RANDOM;
      //sel = ghack_player_sel_dialog(choices,
      //                              _("Player selection"), _("Choose one of the following roles:"));
    else sel = 0;
    if (sel >= 0) sel = pickmap[sel];
    else if (sel == ROLE_NONE) {		/* Quit */
      clearlocks();
      //gnome_exit_nhwindows(0);
    }
    free(choices);
    free(pickmap);
  } else if (flags.initrole < 0) sel = ROLE_RANDOM;
  else sel = flags.initrole;
  
  if (sel == ROLE_RANDOM) {	/* Random role */
    sel = pick_role(flags.initrace, flags.initgend,
                    flags.initalign, PICK_RANDOM);
    if (sel < 0) sel = randrole();
  }

  flags.initrole = sel;

  /* Select a race, if necessary */
  /* force compatibility with role, try for compatibility with
   * pre-selected gender/alignment */
  if (flags.initrace < 0 || !validrace(flags.initrole, flags.initrace)) {
    if (flags.initrace == ROLE_RANDOM || flags.randomall) {
      flags.initrace = pick_race(flags.initrole, flags.initgend,
                                 flags.initalign, PICK_RANDOM);
      if (flags.initrace < 0) flags.initrace = randrace(flags.initrole);
    } else {
      /* Count the number of valid races */
      n = 0;	/* number valid */
      for (i = 0; races[i].noun; i++) {
        if (ok_race(flags.initrole, i, flags.initgend, flags.initalign))
          n++;
      }
      if (n == 0) {
        for (i = 0; races[i].noun; i++) {
          if (validrace(flags.initrole, i)) n++;
        }
      }

      choices = (const char **)alloc(sizeof(char *) * (n+1));
      pickmap = (int*)alloc(sizeof(int) * (n + 1));
      for (n = 0, i = 0; races[i].noun; i++) {
        if (ok_race(flags.initrole, i, flags.initgend,
                    flags.initalign)) {
          choices[n] = races[i].noun;
          pickmap[n++] = i;
        }
      }
      choices[n] = (const char *) 0;
      /* Permit the user to pick, if there is more than one */
      if (n > 1)
        sel = ROLE_RANDOM;
        //sel = ghack_player_sel_dialog(choices, _("Race selection"),
        //                              _("Choose one of the following races:"));
      else sel = 0;
      if (sel >= 0) sel = pickmap[sel];
      else if (sel == ROLE_NONE) { /* Quit */
        clearlocks();
        //gnome_exit_nhwindows(0);
      }
      flags.initrace = sel;
      free(choices);
      free(pickmap);
    }
    if (flags.initrace == ROLE_RANDOM) {	/* Random role */
      sel = pick_race(flags.initrole, flags.initgend,
                      flags.initalign, PICK_RANDOM);
      if (sel < 0) sel = randrace(flags.initrole);
      flags.initrace = sel;
    }
  }

  /* Select a gender, if necessary */
  /* force compatibility with role/race, try for compatibility with
   * pre-selected alignment */
  if (flags.initgend < 0 ||
      !validgend(flags.initrole, flags.initrace, flags.initgend)) {
    if (flags.initgend == ROLE_RANDOM || flags.randomall) {
      flags.initgend = pick_gend(flags.initrole, flags.initrace,
                                 flags.initalign, PICK_RANDOM);
      if (flags.initgend < 0)
        flags.initgend = randgend(flags.initrole, flags.initrace);
    } else {
      /* Count the number of valid genders */
      n = 0;	/* number valid */
      for (i = 0; i < ROLE_GENDERS; i++) {
        if (ok_gend(flags.initrole, flags.initrace, i, flags.initalign))
          n++;
      }
      if (n == 0) {
        for (i = 0; i < ROLE_GENDERS; i++) {
          if (validgend(flags.initrole, flags.initrace, i)) n++;
        }
      }

      choices = (const char **)alloc(sizeof(char *) * (n+1));
      pickmap = (int*)alloc(sizeof(int) * (n + 1));
      for (n = 0, i = 0; i < ROLE_GENDERS; i++) {
        if (ok_gend(flags.initrole, flags.initrace, i,
                    flags.initalign)) {
          choices[n] = genders[i].adj;
          pickmap[n++] = i;
        }
      }
      choices[n] = (const char *) 0;
      /* Permit the user to pick, if there is more than one */
      if (n > 1)
        sel = ROLE_RANDOM;
        //sel = ghack_player_sel_dialog(choices, _("Gender selection"),
        //                              _("Choose one of the following genders:"));
      else sel = 0;
      if (sel >= 0) sel = pickmap[sel];
      else if (sel == ROLE_NONE) { /* Quit */
        clearlocks();
        //gnome_exit_nhwindows(0);
      }
      flags.initgend = sel;
      free(choices);
      free(pickmap);
    }
    if (flags.initgend == ROLE_RANDOM) {	/* Random gender */
      sel = pick_gend(flags.initrole, flags.initrace,
                      flags.initalign, PICK_RANDOM);
      if (sel < 0) sel = randgend(flags.initrole, flags.initrace);
      flags.initgend = sel;
    }
  }

  /* Select an alignment, if necessary */
  /* force compatibility with role/race/gender */
  if (flags.initalign < 0 ||
      !validalign(flags.initrole, flags.initrace, flags.initalign)) {
    if (flags.initalign == ROLE_RANDOM || flags.randomall) {
      flags.initalign = pick_align(flags.initrole, flags.initrace,
                                   flags.initgend, PICK_RANDOM);
      if (flags.initalign < 0)
        flags.initalign = randalign(flags.initrole, flags.initrace);
    } else {
      /* Count the number of valid alignments */
      n = 0;	/* number valid */
      for (i = 0; i < ROLE_ALIGNS; i++) {
        if (ok_align(flags.initrole, flags.initrace, flags.initgend, i))
          n++;
      }
      if (n == 0) {
        for (i = 0; i < ROLE_ALIGNS; i++)
          if (validalign(flags.initrole, flags.initrace, i)) n++;
      }

      choices = (const char **)alloc(sizeof(char *) * (n+1));
      pickmap = (int*)alloc(sizeof(int) * (n + 1));
      for (n = 0, i = 0; i < ROLE_ALIGNS; i++) {
        if (ok_align(flags.initrole,
                     flags.initrace, flags.initgend, i)) {
          choices[n] = aligns[i].adj;
          pickmap[n++] = i;
        }
      }
      choices[n] = (const char *) 0;
      /* Permit the user to pick, if there is more than one */
      if (n > 1)
        sel = ROLE_RANDOM;
        //sel = ghack_player_sel_dialog(choices, _("Alignment selection"),
        //                              _("Choose one of the following alignments:"));
      else sel = 0;
      if (sel >= 0) sel = pickmap[sel];
      else if (sel == ROLE_NONE) { /* Quit */
        clearlocks();
        //gnome_exit_nhwindows(0);
      }
      flags.initalign = sel;
      free(choices);
      free(pickmap);
    }
    if (flags.initalign == ROLE_RANDOM) {
      sel = pick_align(flags.initrole, flags.initrace,
                       flags.initgend, PICK_RANDOM);
      if (sel < 0) sel = randalign(flags.initrole, flags.initrace);
      flags.initalign = sel;
    }
  }
}

void nacl_askname(void) {
  NaClMessage() << NACL_MSG_ASKNAME << eom;
  std::string name = NaClMessage::GetReply();
  strcpy(plname, name.c_str());
}

void nacl_get_nh_event(void) {
  // No need to send (meant for spinning run-loops).
  // NaClMessage() << NACL_MSG_GET_NH_EVENT << eom;
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
  std::string id = NaClMessage::GetReply();
  return atoi(id.c_str());
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
  NaClMessage() << NACL_MSG_SELECT_MENU << wid << how << eom;
  NaClMessage::GetReply();
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
  // Wait for a reply so we can get messages out before fail.
  NaClMessage::GetReply();
}

void nacl_raw_print_bold(const char *str) {
  NaClMessage() << NACL_MSG_RAW_PRINT_BOLD << str << eom;
}

int nacl_nhgetch(void) {
  NaClMessage() << NACL_MSG_NHGETCH << eom;
  std::stringstream reply(NaClMessage::GetReply());
  int ret;
  reply >> ret;
  return ret;
}

int nacl_nh_poskey(int *x, int *y, int *mod) {
  NaClMessage() << NACL_MSG_NH_POSKEY << eom;
  std::stringstream reply(NaClMessage::GetReply());
  int ret;
  reply >> ret;
  reply >> *x;
  reply >> *y;
  reply >> *mod;
  return ret;
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
  std::stringstream reply(NaClMessage::GetReply());
  int ret;
  reply >> ret;
  return ret;
}

void nacl_getlin(const char *question, char *input) {
  NaClMessage() << NACL_MSG_GETLIN << question << eom;
  // TODO store to input.
  NaClMessage::GetReply();
}

int nacl_get_ext_cmd(void) {
  NaClMessage() << NACL_MSG_GET_EXT_CMD << eom;
  NaClMessage::GetReply();
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
  NaClMessage() << NACL_MSG_DELETE_NHWINDOW_BY_REFERENCE << eom;
  // TODO
}
