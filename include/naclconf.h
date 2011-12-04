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
#define FCMASK O_BINARY
#define NO_SIGNAL

#define Rand()  rand()

#define STRNCMPI
#define TEXTCOLOR

#define TIMED_DELAY    /* usleep() */
#define msleep(k) sleep((k)/1000)

#define POSIX_TYPES

// TODO(bradnelson): figure out why this causes stuckage.
#undef INSURANCE

#define PORT_ID "nacl"
