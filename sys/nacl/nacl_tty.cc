extern "C" {

#include "hack.h"

char erase_char, kill_char;

void gettty() { }

void settty() { }

void setftty() {
  iflags.cbreak = ON;
  iflags.echo = OFF;
}

void setctty() { }

}
