extern "C" {

#include "hack.h"

char erase_char, kill_char;

void gettty() { }

void settty(const char* unused) { }

void setftty() {
  iflags.cbreak = ON;
  iflags.echo = OFF;
}

void setctty() { }

}

void introff() { }

void intron() { }

uid_t getuid() {
  return 1001;
}
