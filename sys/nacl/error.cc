// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

extern "C" {

#include "hack.h"

// There should be no brace on the function decl.  That's expected.
void
error VA_DECL(const char *, s)
  char buf[BUFSZ];
  VA_START(s);
  VA_INIT(s, const char *);
  VA_END();
  exit(EXIT_FAILURE);
}

}
