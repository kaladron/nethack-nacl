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

#define Rand()  rand()

#define STRNCMPI
#define TEXTCOLOR

#define TIMED_DELAY    /* usleep() */
#define msleep(k) sleep((k)/1000)

#define POSIX_TYPES

#define HLOCK   "perm"  /* an empty file used for locking purposes */

#define PORT_ID "nacl"

#undef HACKDIR
#define HACKDIR "/nethack"
#define VAR_PLAYGROUND "/mnt/playground/nethack"
#define NOCWD_ASSUMPTIONS

void regularize(char *);

