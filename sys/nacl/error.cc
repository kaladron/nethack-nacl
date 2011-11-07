// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

extern "C" {

#include "hack.h"

// There should be no brace on the function decl.  That's expected.
void
error VA_DECL(const char *, s)
  VA_START(s);
  VA_INIT(s, const char *);
  Vprintf(s,VA_ARGS);
  (void) putchar('\n');
  VA_END();
  exit(EXIT_FAILURE);
}

}
