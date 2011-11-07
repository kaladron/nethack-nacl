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

# Objects
OBJ32 = $(top_srcdir)/obj32
OBJ64 = $(top_srcdir)/obj64
OBJHOST = $(top_srcdir)/objhost
OBJPUBLISH = $(top_srcdir)/publish
OBJRESOURCE = $(top_srcdir)/resource

# Yo dawg, look here!
VPATH = $(SRC) $(UTIL) $(NACL_SRC) $(NACL_WIN)

CLEANFILES = $(DAT)/data \
	$(DAT)/dungeon \
	$(DAT)/dungeon.pdf \
	$(DAT)/options \
	$(DAT)/oracles \
	$(DAT)/quest.dat \
	$(INCL)/dgn_comp.h \
	$(INCL)/lev_comp.h \
	$(OBJHOST)/stamp.sp_lev

GENFILES = $(DAT)/data \
	$(DAT)/oracles \
	$(DAT)/quest.dat \
	$(DAT)/rumors \
	$(DAT)/help \
	$(DAT)/hh \
	$(DAT)/cmdhelp \
	$(DAT)/history \
	$(DAT)/opthelp \
	$(DAT)/wizhelp \
	$(DAT)/dungeon \
	$(DAT)/license \
	$(OBJHOST)/stamp.sp_lev

GENHDRS = $(INCL)/date.h $(INCL)/onames.h $(INCL)/pm.h
#GENSRCS = $(SRC)/monstr.c

OBJS ?= \
       $(patsubst %.c,%.o,$(notdir $(GENSRCS))) \
       $(patsubst %.c,%.o,$(notdir $(wildcard $(SRC)/*.c))) \
       $(patsubst %.cc,%.o,$(notdir $(wildcard $(NACL_SRC)/*.cc))) \
       $(patsubst %.cc,%.o,$(notdir $(wildcard $(NACL_WIN)/*.cc)))

DGNCOMPOBJS = $(addprefix $(OBJHOST)/, \
	dgn_comp.y.o \
	dgn_comp.l.o \
	dgn_main.o \
	alloc.o \
	panic.o)

LEVCOMPOBJS = $(addprefix $(OBJHOST)/, \
	lev_comp.y.o \
	lev_comp.l.o \
	lev_main.o \
	alloc.o \
	decl.o \
	drawing.o \
	monst.o \
	objects.o \
	panic.o)

DLBMAINOBJS = $(addprefix $(OBJHOST)/, \
	dlb_main.o \
	dlb.o \
	alloc.o \
	panic.o)

NHRESOURCES = $(addprefix $(OBJRESOURCE)/, \
	nhdat \
	cmdhelp \
	data \
	dungeon \
	hh \
	history \
	license \
	oracles \
	opthelp \
	rumors \
	quest.dat \
	wizhelp) \
	$(OBJHOST)/stamp.sp_lev

DESFILES = $(notdir $(wildcard $(DAT)/*.des))

OBJ32S = $(addprefix $(OBJ32)/,$(OBJS))
OBJ64S = $(addprefix $(OBJ64)/,$(OBJS))

MAKEDEFS := $(OBJHOST)/makedefs
HOSTBINS := $(OBJHOST)/dgn_comp $(OBJHOST)/lev_comp
NETHACK32 := $(OBJPUBLISH)/nethack_x86-32.nexe
NETHACK64 := $(OBJPUBLISH)/nethack_x86-64.nexe

HOST_CFLAGS = -g -O2 -w -m32
CFLAGS = -g -O2 -w
CXXFLAGS = -g -O2 -Wall -Werror
LDFLAGS =
LIBS = -lnacl-mounts -lppapi -lppapi_cpp
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
  $(OBJPUBLISH)/nethack.nmf \
  $(OBJPUBLISH)/nethack.tar

all: $(PUBLISH_FILES)

$(NETHACK32): $(MAKEDEFS) $(OBJ32S) $(OBJPUBLISH)
	i686-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ32S) -Wl,--end-group -o $@

$(NETHACK64): $(MAKEDEFS) $(OBJ64S) $(OBJPUBLISH)
	x86_64-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ64S) -Wl,--end-group -o $@

$(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH) $(OBJRESOURCE):
	mkdir -p $@

$(OBJHOST)/makedefs: $(OBJHOST)/makedefs.o $(OBJHOST)/monst.o $(OBJHOST)/objects.o
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/dlb_main: $(DLBMAINOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/dgn_comp: $(DGNCOMPOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/lev_comp: $(LEVCOMPOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/%.y.c: %.y | $(OBJHOST) $(GENHDRS)
	bison -y --defines=$(INCL)/$*.h $< -o $@

$(OBJHOST)/%.l.c: %.l | $(OBJHOST) $(GENHDRS)
	flex -o $@ $<

$(OBJHOST)/%.y.o: $(OBJHOST)/%.y.c | $(OBJHOST)
	gcc $(HOST_CFLAGS) $(INCLUDES) -c $< -o $@

$(OBJHOST)/%.l.o: $(OBJHOST)/%.l.c | $(OBJHOST)
	gcc $(HOST_CFLAGS) $(INCLUDES) -c $< -o $@

$(OBJHOST)/%.o: %.c | $(OBJHOST)
	gcc $(HOST_CFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ32)/%.o: %.c | $(OBJ32) $(GENHDRS)
	i686-nacl-gcc $(CFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ32)/%.o: %.cc | $(OBJ32) $(GENHDRS)
	i686-nacl-g++ $(CXXFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ64)/%.o: %.c | $(OBJ64) $(GENHDRS)
	x86_64-nacl-gcc $(CFLAGS) $(INCLUDES) -c $< -o $@

$(OBJ64)/%.o: %.cc | $(OBJ64) $(GENHDRS)
	x86_64-nacl-g++ $(CXXFLAGS) $(INCLUDES) -c $< -o $@

$(OBJHOST)/stamp.sp_lev: $(HOSTBINS) $(OBJRESOURCE)
	cd $(OBJRESOURCE) && \
	for x in $(DESFILES); do \
	  ../objhost/lev_comp ../dat/$${x}; \
	done
	touch $@

$(OBJPUBLISH)/index.html: $(NACL_WIN)/index.html
	cp $< $@

$(OBJPUBLISH)/nethack.nmf: $(NACL_WIN)/nethack.nmf
	cp $< $@

$(OBJPUBLISH)/nethack.tar: $(NHRESOURCES) | $(OBJPUBLISH)
	cd $(OBJRESOURCE) && tar -cf ../publish/nethack.tar *

$(OBJRESOURCE)/nhdat: $(OBJHOST)/dlb_main $(GENFILES)
	touch $@

%/stamp:
	mkdir -p $(@D)
	touch $@

clean:
	rm -rf $(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH) $(OBJRESOURCE) $(GENHDRS) $(GENSRCS) $(CLEANFILES)

http:
	./httpd.py

$(GENHDRS) $(GENSRCS): $(MAKEDEFS)
	cd $(OBJHOST) && ./makedefs -o
	cd $(OBJHOST) && ./makedefs -p
	cd $(OBJHOST) && ./makedefs -v
	cd $(OBJHOST) && ./makedefs -M

$(DAT)/data: $(MAKEDEFS)
	cd $(OBJHOST) && ./makedefs -d

$(DAT)/rumors: $(MAKEDEFS)
	cd $(OBJHOST) && ./makedefs -r

$(DAT)/quest.dat: $(MAKEDEFS)
	cd $(OBJHOST) && ./makedefs -q

$(DAT)/oracles: $(MAKEDEFS)
	cd $(OBJHOST) && ./makedefs -h

$(DAT)/dungeon: $(MAKEDEFS) $(HOSTBINS) $(DAT)/dungeon.def
	cd $(DAT) && ../objhost/makedefs -e
	$(OBJHOST)/dgn_comp $(DAT)/dungeon.pdf

$(OBJRESOURCE)/%: $(DAT)/%
	cp $< $@

$(SRC)/monst.c $(SRC)/objects.c:
	@

$(SRC)/%.c: $(GENHDRS)
	@

.SUFFIXES:
.PHONY: all clean
