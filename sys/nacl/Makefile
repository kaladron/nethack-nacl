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
# Unix source
UNIX_SRC = $(top_srcdir)/sys/unix
# Nacl source
NACL_SRC = $(top_srcdir)/sys/nacl
# Nacl Windows
NACL_WIN = $(top_srcdir)/win/nacl-messages
# TTY Windows
TTY_WIN = $(top_srcdir)/win/tty
# Win Share
WIN_SHARE = $(top_srcdir)/win/share

# Objects
OBJ32 = $(top_srcdir)/obj32
OBJ64 = $(top_srcdir)/obj64
OBJHOST = $(top_srcdir)/objhost
OBJPUBLISH = $(top_srcdir)/publish
OBJEXTENSION = $(OBJPUBLISH)/extension
OBJRESOURCE = $(top_srcdir)/resource

# Yo dawg, look here!
VPATH = $(SRC) \
	$(UTIL) \
	$(NACL_SRC) \
	$(NACL_WIN) \
	$(UNIX_SRC) \
	$(TTY_WIN) \
	$(WIN_SHARE)

# TODO(jeffbailey): Clean src/monstr.c and src/tile.c

CLEANFILES = $(DAT)/data \
	$(DAT)/dungeon \
	$(DAT)/dungeon.pdf \
	$(DAT)/options \
	$(DAT)/oracles \
	$(DAT)/rumors \
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

DARTFILES = $(NACL_WIN)/gnomelike.dart \
	$(NACL_WIN)/nacl_msg.dart \
	$(NACL_WIN)/xtermconsole.dart

GENHDRS = $(INCL)/date.h $(INCL)/onames.h $(INCL)/pm.h
#GENSRCS = $(SRC)/monstr.c $(SRC)/tile.c

OBJS ?= \
	unixmain.o \
	unixunix.o \
	$(patsubst %.c,%.o,$(notdir $(GENSRCS))) \
	$(patsubst %.c,%.o,$(notdir $(wildcard $(SRC)/*.c))) \
	$(patsubst %.c,%.o,$(notdir $(wildcard $(TTY_WIN)/*.c))) \
	$(patsubst %.c,%.o,$(notdir $(wildcard $(NACL_SRC)/*.c))) \
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
HOSTBINS := $(OBJHOST)/dgn_comp $(OBJHOST)/lev_comp $(OBJHOST)/tilemap
NETHACK32 := $(OBJEXTENSION)/nethack_x86-32.nexe
NETHACK64 := $(OBJEXTENSION)/nethack_x86-64.nexe

HOST_CFLAGS = -g -O2 -w -m32 -D__native_client__
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
	   tgetch \
	   umask \
	   unlink \
	   write

LDWRAP = $(foreach x, $(WRAPFUNC), -Xlinker --wrap -Xlinker $(x))

PUBLISH_FILES = \
  $(NETHACK32) \
  $(NETHACK64) \
  $(OBJEXTENSION)/index.html \
  $(OBJEXTENSION)/nethack.css \
  $(OBJEXTENSION)/nethack.js \
  $(OBJEXTENSION)/manifest.json \
  $(OBJEXTENSION)/nethack.nmf \
  $(OBJEXTENSION)/nethack.tar \
  $(OBJEXTENSION)/blind.png \
  $(OBJEXTENSION)/chaotic.png \
  $(OBJEXTENSION)/cha.png \
  $(OBJEXTENSION)/confused.png \
  $(OBJEXTENSION)/constitution.png \
  $(OBJEXTENSION)/dex.png \
  $(OBJEXTENSION)/ext_enc.png \
  $(OBJEXTENSION)/hallu.png \
  $(OBJEXTENSION)/hungry.png \
  $(OBJEXTENSION)/hvy_enc.png \
  $(OBJEXTENSION)/icon_128.png \
  $(OBJEXTENSION)/icon_16.png \
  $(OBJEXTENSION)/icon_48.png \
  $(OBJEXTENSION)/int.png \
  $(OBJEXTENSION)/lawful.png \
  $(OBJEXTENSION)/mapbg.png \
  $(OBJEXTENSION)/mod_enc.png \
  $(OBJEXTENSION)/neutral.png \
  $(OBJEXTENSION)/nh_icon.png \
  $(OBJEXTENSION)/nothing.png \
  $(OBJEXTENSION)/ovr_enc.png \
  $(OBJEXTENSION)/petmark.png \
  $(OBJEXTENSION)/satiated.png \
  $(OBJEXTENSION)/sick_fp.png \
  $(OBJEXTENSION)/sick_il.png \
  $(OBJEXTENSION)/slt_enc.png \
  $(OBJEXTENSION)/str.png \
  $(OBJEXTENSION)/stunned.png \
  $(OBJEXTENSION)/wis.png \
  $(OBJEXTENSION)/x11tiles.png


all: $(OBJPUBLISH)/nethackext.zip

$(OBJPUBLISH)/nethackext.zip: $(PUBLISH_FILES)
	rm -f $@
	cd $(<D) && zip -r ../nethackext.zip *

$(NETHACK32): $(MAKEDEFS) $(OBJ32S) $(OBJEXTENSION)
	i686-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ32S) -Wl,--end-group -o $@

$(NETHACK64): $(MAKEDEFS) $(OBJ64S) $(OBJEXTENSION)
	x86_64-nacl-g++ $(LDFLAGS) $(LDWRAP) \
        -Wl,--start-group $(LIBS) $(OBJ64S) -Wl,--end-group -o $@

$(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH) $(OBJEXTENSION) $(OBJRESOURCE):
	mkdir -p $@

$(OBJHOST)/makedefs: $(OBJHOST)/makedefs.o $(OBJHOST)/monst.o $(OBJHOST)/objects.o
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/dlb_main: $(DLBMAINOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/dgn_comp: $(DGNCOMPOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/lev_comp: $(LEVCOMPOBJS)
	gcc $(HOST_CFLAGS) $^ -o $@

$(OBJHOST)/tilemap: $(OBJHOST)/tilemap.o
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

$(OBJEXTENSION)/%: $(NACL_WIN)/%
	cp $< $@

$(NACL_WIN)/nethack.dart: $(DARTFILES)
	touch $@

$(NACL_WIN)/%.js: $(NACL_WIN)/%.dart
	minfrog --compile-only --out=$@ $<
	sed -i -e 's/nethackEmbed.postMessage\$$1/nethackEmbed._ptr.postMessage/' $@
	sed -i -e 's/textWindow.get\$$scrollHeight()/textWindow._ptr.scrollHeight/' $@
	sed -i -e 's/_ptr.preventDefault\$$0/_ptr.preventDefault/' $@
	sed -i -e 's/html_get$$window().get$$localStorage()/window.localStorage/' $@

$(OBJEXTENSION)/nethack.tar: $(NHRESOURCES) | $(OBJEXTENSION)
	tar -cf $@ -C $(OBJRESOURCE) .

$(OBJRESOURCE)/nhdat: $(OBJHOST)/dlb_main $(GENFILES)
	touch $@

%/stamp:
	mkdir -p $(@D)
	touch $@

clean:
	rm -rf $(OBJ32) $(OBJ64) $(OBJHOST) $(OBJPUBLISH) $(OBJRESOURCE) $(GENHDRS) $(GENSRCS) $(CLEANFILES)

http:
	./httpd.py

$(GENHDRS): $(MAKEDEFS)
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

$(SRC)/tile.c: $(OBJHOST)/tilemap $(INCL)/pm.h
	cd $(OBJHOST) && ./tilemap

$(SRC)/%.c: $(GENHDRS)
	@

.SUFFIXES:
.PHONY: all clean
