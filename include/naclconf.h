// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

#pragma once

// Everything in here is made up.  Choose better numbers if you can.
// MWAHAHAHAH.

#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

#define FILENAME 80
#define FCMASK  0660    /* file creation mask */
#define NO_SIGNAL

// define STRNCMPI
#define TEXTCOLOR

#define TIMED_DELAY    /* usleep() */
#define msleep(k) sleep((k)/1000)

//undef POSIX_TYPES

#define HLOCK   "perm"  /* an empty file used for locking purposes */

#define PORT_ID "nacl"

#undef HACKDIR
#define HACKDIR "/nethack"
#define VAR_PLAYGROUND "/mnt/playground/nethack"
#define NOCWD_ASSUMPTIONS

#undef SHELL /* Don't allow escaping to a shell */
#undef COMPRESS
#undef MAIL
#undef DEF_MAILREADER
#undef SUSPEND

#define NO_FILE_LINKS
#define LOCKDIR VAR_PLAYGROUND

extern int nacl_LI;
extern int nacl_CO;
