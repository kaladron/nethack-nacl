// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#include "naclbind.h"
#include "naclmsg.h"
#include "wintype.h"
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <sstream>
#include <iomanip>

extern "C" {
  #include "func_tab.h"
  extern const char *hu_stat[]; /* from eat.c */
  extern const char *enc_stat[]; /* from botl.c */
};


static EndOfMessage eom;


void nacl_init_nhwindows(int* argc, char** argv) {
  NaClMessage msg;
  msg << NACL_MSG_INIT_NHWINDOWS;
  for (int i = 0; i < *argc; ++i) {
    msg << argv[i];
  }
  msg << eom;
}

int nacl_player_sel_dialog(const char** choices, const char* title,
  const char*caption) {
  NaClMessage msg;
  msg << NACL_MSG_PLAYER_SELECTION 
    << title
    << caption;
  while (*choices != 0) {
    msg << *choices;
    choices++;
  }
  msg << eom;

  std::string id = NaClMessage::GetReply();
  // The game 1-indexes this because a zero-identifier means 'none'
  return atoi(id.c_str()) - 1;
}

void nacl_player_selection(void) {
  
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
      sel = nacl_player_sel_dialog(choices,
                                   "Player selection", "Choose one of the following roles:");
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
        sel = nacl_player_sel_dialog(choices, "Race selection",
                                     "Choose one of the following races:");
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
        sel = nacl_player_sel_dialog(choices, "Gender selection",
                                     "Choose one of the following genders:");
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
        sel = nacl_player_sel_dialog(choices, "Alignment selection",
                                     "Choose one of the following alignments:");
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
  if (block) {
    std::string ack = NaClMessage::GetReply();
  }
}

void nacl_destroy_nhwindow(winid wid) {
  NaClMessage() << NACL_MSG_DESTROY_NHWINDOW << wid << eom;
}

void nacl_curs(winid wid, int x, int y) {
  NaClMessage() << NACL_MSG_CURS << wid << x << y << eom;
}

void nacl_putstr(winid wid, int attr, const char *text) {
  if (wid != 2) {
    NaClMessage() << NACL_MSG_PUTSTR << wid << attr << text << eom;
  } else {
    // Name, Class
    // Dname, Dlevel
    // Str, Dex, Con. Int, Wis, Cha
    // HP, AC, Power, AU
    // Level, Exp, Time, Score
    // Alignment, Hunger, Confusion, Blind, Stunned, Hallucination, Sick, Enc
    std::string plname_display = plname;
    plname_display[0] = toupper(plname_display[0]);
    std::string rank;

    if (u.mtimedone) {
      rank = mons[u.umonnum].mname;
    } else {
      rank = rank_of(u.ulevel, pl_character[0], flags.female);
    }
    rank[0] = toupper(rank[0]);

    std::stringstream str_buf;
    if (ACURR(A_STR) > 118) {
      str_buf << ACURR(A_STR)-100;
    } else if (ACURR(A_STR)==118) {
      str_buf << "18/**";
    } else if(ACURR(A_STR) > 18) {
      str_buf << "18/" << std::setw(2) << std::setfill('0') << ACURR(A_STR)-18;
    } else {
      str_buf << (int)ACURR(A_STR);
    }

    std::stringstream level_buf;
    if (In_endgame(&u.uz)) {
      level_buf << (Is_astralevel(&u.uz) ? "Astral Plane" : "End Game");
    } else {
      level_buf << dungeons[u.uz.dnum].dname << ", level " << (int)depth(&u.uz);
    }

    long au;
#ifndef GOLDOBJ
    au = u.ugold;
#else
    au = money_cnt(invent);
#endif


    NaClMessage()
      << NACL_MSG_UPDATE_STATS
      << plname_display
      << rank 
      << level_buf.str()
      << ""  // UNUSED
      << str_buf.str()
      << ACURR(A_DEX)
      << ACURR(A_CON)
      << ACURR(A_INT)
      << ACURR(A_WIS)
      << ACURR(A_CHA)
      << ( (u.uhp  > 0)? u.uhp  : 0)
      << u.uhpmax
      << u.uac
      << u.uen
      << u.uenmax
      << au
      << u.ulevel
      << u.uexp
      << moves
      << u.ualign.type
      << u.uhs
      << hu_stat[u.uhs]
      << Confusion
      << Blind
      << Stunned
      << Hallucination
      << Sick
      << u.usick_type
      << near_capacity()
      << enc_stat[near_capacity()]
      << eom;
  }
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
  NaClMessage() << NACL_MSG_ADD_MENU << wid << glyph2tile[glyph]
                << *(int*)identifier
                << accelerator << group_accel << attr
                << str << presel << eom;
}

void nacl_end_menu(winid wid, const char *prompt) {
  std::string prompt_str;
  if (prompt) {
    prompt_str = prompt;
  }
  NaClMessage() << NACL_MSG_END_MENU << wid << prompt_str << eom;
}

int nacl_select_menu(winid wid, int how, MENU_ITEM_P **selected) {
  NaClMessage() << NACL_MSG_SELECT_MENU << wid << how << eom;
  std::stringstream reply(NaClMessage::GetReply());
  int ret;
  reply >> ret;
  if (ret < 0) return ret;
  *selected = (MENU_ITEM_P*)calloc(ret, sizeof(MENU_ITEM_P));
  assert(*selected);
  assert(sizeof(anything) == sizeof(int));
  for (int i = 0; i < ret; ++i) {
    int item;
    reply >> item;
    memcpy(&(*selected)[i].item, &item, sizeof(int));
    (*selected)[i].count = -1;
  }
  return ret;
}

int get_armor_tile(struct obj* armor) {
  return ((armor != NULL) ? glyph2tile[obj_to_glyph(armor)] : -1);
}

void nacl_update_inventory(void) {
  // TODO(jeffbailey): Cache this so that we don't send
  // if the inventory screen is already going to be right.
  NaClMessage msgBuilder = NaClMessage();
  msgBuilder << NACL_MSG_UPDATE_INVENTORY;
  msgBuilder << get_armor_tile(uarm);
  msgBuilder << get_armor_tile(uarmc);
  msgBuilder << get_armor_tile(uarmh);
  if (u.twoweap != 0) {
    msgBuilder << get_armor_tile(uswapwep);
  } else {
    msgBuilder << get_armor_tile(uarms);
  }
  msgBuilder << get_armor_tile(uarmg);
  msgBuilder << get_armor_tile(uarmf);
#ifdef TOURIST
  msgBuilder << get_armor_tile(uarmu);
#else
  msgBuilder << -1;
#endif
  msgBuilder << get_armor_tile(uskin);
  msgBuilder << get_armor_tile(uamul);
  msgBuilder << get_armor_tile(uleft);
  msgBuilder << get_armor_tile(uright);
  msgBuilder << get_armor_tile(ublindf);
  msgBuilder << get_armor_tile(uwep);
  if (u.twoweap != 0) {
    msgBuilder << -1;
  } else {
    msgBuilder << get_armor_tile(uswapwep);
  }
  msgBuilder << get_armor_tile(uquiver);
  msgBuilder << eom;
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
  boolean pet = false;

  if (glyph_is_pet(glyph)
#ifdef TEXTCOLOR
    && iflags.hilite_pet
#endif
    ) {
    pet = true;
  }

  NaClMessage() << NACL_MSG_PRINT_GLYPH << wid << x << y
                << glyph2tile[glyph] << pet << eom;
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
  std::string choices_str;

  if (choices) {
    choices_str = choices;  
  }
  NaClMessage() << NACL_MSG_YN_FUNCTION <<
                   question << choices_str << def << eom;
  std::stringstream reply(NaClMessage::GetReply());
  int ret;
  reply >> ret;
  return ret;
}

void nacl_getlin(const char *question, char *input) {
  NaClMessage() << NACL_MSG_GETLIN << question << eom;
  std::string reply = NaClMessage::GetReply();
  strcpy(input, reply.c_str());
}

int nacl_get_ext_cmd(void) {
  NaClMessage msgBuilder = NaClMessage();
  msgBuilder << NACL_MSG_GET_EXT_CMD;
  for (struct ext_func_tab* itr = extcmdlist; itr->ef_txt != 0; itr++) {
    if (itr->ef_txt[0] == '?') continue;
    msgBuilder << itr->ef_txt << itr->ef_desc;
  }
  msgBuilder << eom;
  return atoi(NaClMessage::GetReply().c_str());
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
