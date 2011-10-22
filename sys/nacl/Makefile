# Copyright (c) Google Inc.
# NetHack may be freely redistributed.  See license for details.

# This Makefile assumes that NACL_SDK_ROOT is setup (to the directory
# above toolchain/) and that the path contains the compiler binaries.

top_srcdir = ../..

# NetHack include files
INCL  = $(top_srcdir)/include
# NetHack data files
DAT   = $(top_srcdir)/dat
# NetHack documentation files
DOC   = $(top_srcdir)/doc
# Utility source
UTIL  = $(top_srcdir)/util
# Main source
SRC   = $(top_srcdir)/src
# Nacl source
NACL_SRC = $(top_srcdir)/sys/nacl
# Nacl Windows
NACL_WIN = $(top_srcdir)/win/nacl-messages

VPATH = $(SRC) $(UTIL) $(NACL_SRC) $(NACL_WIN)

# Objects
OBJ32 = $(top_srcdir)/out32
OBJ64 = $(top_srcdir)/out64
OBJHOST = $(top_srcdir)/outhost
OBJPUBLISH = $(top_srcdir)/publish

GENHDRS = $(INCL)/date.h $(INCL)/onames.h $(INCL)/pm.h
GENSRCS = $(SRC)/monstr.c

OBJS ?= \
       $(patsubst %.c,%.o,$(notdir $(wildcard $(SRC)/*.c))) \
       $(patsubst %.cc,%.o,$(notdir $(wildcard $(NACL_SRC)/*.cc))) \
       $(patsubst %.cc,%.o,$(notdir $(wildcard $(NACL_WIN)/*.cc)))

OBJ32S = $(addprefix $(OBJ32)/,$(OBJS))
OBJ64S = $(addprefix $(OBJ64)/,$(OBJS))

HOSTBINS := $(OBJHOST)/makedefs
NETHACK32 := $(OBJPUBLISH)/nethack_x86-32.nexe
NETHACK64 := $(OBJPUBLISH)/nethack_x86-64.nexe

CFLAGS = -g -O2 -w
LDFLAGS =
LIBS = -lnacl-mounts -lppapi -lppapi_cpp
#CPPFLAGS = -DSTRNCMPI
INCLUDES = -I$(INCL)

# newlib requires certain functions to be marked as wrapped to the linker.
WRAPFUNC = \
	   access \
	   chdir \
	   chmod \
	   close \
	   fflush \
	   fstat \
	   getcwd \
	   getdents \
	   getgid \
	   getuid \
	   getwd \
	   getlogin \
	   getpwnam \
	   getpwuid \
	   ioctl \
	   isatty \
	   kill \
	   link \
	   lseek \
	   mkdir \
	   mount \
	   open \
	   read \
	   remove \
	   rmdir \
	   setgid \
	   setuid \
	   signal \
	   stat \
	   unlink \
	   write

LDWRAP = $(foreach x, $(WRAPFUNC), -Xlinker --wrap -Xlinker $(x))

PUBLISH_FILES = \
  $(NETHACK32) \
  $(NETHACK64) \
  $(OBJPUBLISH)/index.html \
  $(OBJPUBLISH)/nethack.nmf

all: $(PUBLISH_FILES)

$(NETHACK32): $(HOSTBINS) $(OBJ32S) $(OBJPUBLISH)
	i686-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ32S) -Wl,--end-group -o $@

$(NETHACK64): $(HOSTBINS) $(OBJ64S) $(OBJPUBLISH)
	x86_64-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ64S) -Wl,--end-group -o $@

$(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH):
	mkdir -p $@

$(OBJHOST)/makedefs:: $(OBJHOST)/makedefs.o $(OBJHOST)/monst.o $(OBJHOST)/objects.o
	gcc $^ -o $@

$(OBJHOST)/%.o: $(UTIL)/%.c | $(OBJHOST)
	gcc $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJHOST)/%.o: $(SRC)/%.c | $(OBJHOST)
	gcc $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ32)/%.o: %.c | $(OBJ32) $(GENHDRS)
	i686-nacl-gcc $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ32)/%.o: %.cc | $(OBJ32) $(GENHDRS)
	i686-nacl-g++ $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ64)/%.o: %.c | $(OBJ64) $(GENHDRS)
	x86_64-nacl-gcc $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ64)/%.o: %.cc | $(OBJ64) $(GENHDRS)
	x86_64-nacl-g++ $(CFLAGS) $(CPPFLAGS) $(INCLUDES) -c $< -o $@

$(OBJPUBLISH)/index.html: $(NACL_WIN)/index.html
	cp $< $@

$(OBJPUBLISH)/nethack.nmf: $(NACL_WIN)/nethack.nmf
	cp $< $@


%/stamp:
	mkdir -p $(@D)
	touch $@

clean:
	rm -rf $(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH) $(GENHDRS) $(GENSRCS)

http:
	./httpd.py


$(GENHDRS) $(GENSRCS): $(OBJHOST)/makedefs
	cd $(OBJHOST) && ./makedefs -o
	cd $(OBJHOST) && ./makedefs -p
	cd $(OBJHOST) && ./makedefs -v
	cd $(OBJHOST) && ./makedefs -M

$(SRC)/monst.c $(SRC)/objects.c:
	@

$(SRC)/%.c: $(GENHDRS)
	@

.SUFFIXES:
.SUFFIXES: .c .o
.PHONY: all clean
