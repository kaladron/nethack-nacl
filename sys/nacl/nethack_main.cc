// Copyright 2011 Google Inc. All Rights Reserved.
// Author: jeffbailey@google.com (Jeff Bailey)

extern "C" {

/* main.c - Unix NetHack */

#include "hack.h"
#include "dlb.h"

#include <sys/stat.h>
#include <fcntl.h>
#include <signal.h>
#include <pwd.h>
#ifndef O_RDONLY
#include <fcntl.h>
#endif

#define O_BINARY 0
static int locknum = 0;
  
extern struct passwd *FDECL(getpwuid,(uid_t));
extern struct passwd *FDECL(getpwnam,(const char *));
#ifdef CHDIR
  static void FDECL(chdirx, (const char *,BOOLEAN_P));
#endif /* CHDIR */
static boolean NDECL(whoami);
static void FDECL(process_options, (int, char **));

#ifdef _M_UNIX
extern void NDECL(check_sco_console);
extern void NDECL(init_sco_cons);
#endif
#ifdef __linux__
extern void NDECL(check_linux_console);
extern void NDECL(init_linux_cons);
#endif

static void NDECL(wd_message);
#ifdef WIZARD
static boolean wiz_error_flag = FALSE;
#endif

int
nethack_main(int argc, char*argv[]) {
	register int fd;
#ifdef CHDIR
	register char *dir;
#endif
	boolean exact_username;

#if defined(__APPLE__)
	/* special hack to change working directory to a resource fork when
	   running from finder --sam */
#define MAC_PATH_VALUE ".app/Contents/MacOS/"
	char mac_cwd[1024], *mac_exe = argv[0], *mac_tmp;
	unsigned int arg0_len = strlen(mac_exe), mac_tmp_len, mac_lhs_len=0;
        fprintf(stderr, "AAAAAAAAAAAAA\n");
	getcwd(mac_cwd, 1024);
        fprintf(stderr, "BBBBBBBBBBBBB\n");
	if(mac_exe[0] == '/' && !strcmp(mac_cwd, "/")) {
	    if((mac_exe = strrchr(mac_exe, '/')))
		mac_exe++;
	    else
		mac_exe = argv[0];
	    mac_tmp_len = (strlen(mac_exe) * 2) + strlen(MAC_PATH_VALUE);
	    if(mac_tmp_len <= arg0_len) {
		mac_tmp = malloc(mac_tmp_len + 1);
		sprintf(mac_tmp, "%s%s%s", mac_exe, MAC_PATH_VALUE, mac_exe);
		if(!strcmp(argv[0] + (arg0_len - mac_tmp_len), mac_tmp)) {
		    mac_lhs_len = (arg0_len - mac_tmp_len) + strlen(mac_exe) + 5;
		    if(mac_lhs_len > mac_tmp_len - 1)
			mac_tmp = realloc(mac_tmp, mac_lhs_len);
		    strncpy(mac_tmp, argv[0], mac_lhs_len);
		    mac_tmp[mac_lhs_len] = '\0';
		    chdir(mac_tmp);
		}
		free(mac_tmp);
	    }
	}
        fprintf(stderr, "CCCCCCCCCCCCCC\n");
#endif

	hname = argv[0];
	hackpid = getpid();
	//(void) umask(0777 & ~FCMASK);

        fprintf(stderr, "DDDDDDDDDDDDD\n");
	//choose_windows(DEFAULT_WINDOW_SYS);
	//choose_windows("Nacl");
        choose_windows("tty");
        fprintf(stderr, "EEEEEEEEEEEEE\n");

#ifdef CHDIR			/* otherwise no chdir() */
	/*
	 * See if we must change directory to the playground.
	 * (Perhaps hack runs suid and playground is inaccessible
	 *  for the player.)
	 * The environment variable HACKDIR is overridden by a
	 *  -d command line option (must be the first option given)
	 */
	dir = nh_getenv("NETHACKDIR");
	if (!dir) dir = nh_getenv("HACKDIR");
#endif
        fprintf(stderr, "FFFFFFFFFFFFFFFF\n");
	if(0 && argc > 1) {
#ifdef CHDIR
	    if (!strncmp(argv[1], "-d", 2) && argv[1][2] != 'e') {
		/* avoid matching "-dec" for DECgraphics; since the man page
		 * says -d directory, hope nobody's using -desomething_else
		 */
		argc--;
		argv++;
		dir = argv[0]+2;
		if(*dir == '=' || *dir == ':') dir++;
		if(!*dir && argc > 1) {
			argc--;
			argv++;
			dir = argv[0];
		}
		if(!*dir)
                  fprintf(stderr, "Flag -d must be followed by a directory name.");
	    }
	    if (argc > 1)
#endif /* CHDIR */

	    /*
	     * Now we know the directory containing 'record' and
	     * may do a prscore().  Exclude `-style' - it's a Qt option.
	     */
	    if (!strncmp(argv[1], "-s", 2) && strncmp(argv[1], "-style", 6)) {
#ifdef CHDIR
              chdirx(dir,0);
#endif
		prscore(argc, argv);
		exit(EXIT_SUCCESS);
	    }
	}
        fprintf(stderr, "FFF1111\n");

	/*
	 * Change directories before we initialize the window system so
	 * we can find the tile file.
	 */
#ifdef CHDIR
	chdirx(dir,1);
#endif

        fprintf(stderr, "FFF222\n");
#ifdef _M_UNIX
	check_sco_console();
#endif
#ifdef __linux__
	check_linux_console();
#endif
        fprintf(stderr, "FFF333\n");
	initoptions();
        fprintf(stderr, "FFF444\n");
	init_nhwindows(&argc,argv);
        fprintf(stderr, "FFF555\n");
	exact_username = whoami();
#ifdef _M_UNIX
	init_sco_cons();
#endif
#ifdef __linux__
	init_linux_cons();
#endif

	/*
	 * It seems you really want to play.
	 */
	u.uhp = 1;	/* prevent RIP on early quits */
        //	(void) signal(SIGHUP, (SIG_RET_TYPE) hangup);
#ifdef SIGXCPU
        //	(void) signal(SIGXCPU, (SIG_RET_TYPE) hangup);
#endif

        fprintf(stderr, "GGGGGGGGGGG\n");
	process_options(argc, argv);	/* command line options */
        fprintf(stderr, "HHHHHHHHHH\n");

#ifdef DEF_PAGER
	if(!(catmore = nh_getenv("HACKPAGER")) && !(catmore = nh_getenv("PAGER")))
		catmore = DEF_PAGER;
#endif
#ifdef MAIL
	getmailstatus();
#endif
#ifdef WIZARD
	if (wizard)
		Strcpy(plname, "wizard");
	else
#endif
        fprintf(stderr, "IIIIIIIIIII\n");
	if(!*plname || !strncmp(plname, "player", 4)
		    || !strncmp(plname, "games", 4)) {
        fprintf(stderr, "IIIIIIIIIII111\n");
		askname();
        fprintf(stderr, "IIIIIIIIIII222\n");
	} else if (exact_username) {
		/* guard against user names with hyphens in them */
		unsigned int len = strlen(plname);
		/* append the current role, if any, so that last dash is ours */
		if (++len < sizeof plname)
			(void)strncat(strcat(plname, "-"),
				      pl_character, sizeof plname - len - 1);
	}
	plnamesuffix();		/* strip suffix from name; calls askname() */
				/* again if suffix was whole name */
				/* accepts any suffix */
        fprintf(stderr, "JJJJJJJJJJJJJ\n");
#ifdef WIZARD
	if(!wizard) {
#endif
		/*
		 * check for multiple games under the same name
		 * (if !locknum) or check max nr of players (otherwise)
		 */
		(void) signal(SIGQUIT,SIG_IGN);
		(void) signal(SIGINT,SIG_IGN);
		if(!locknum)
			Sprintf(lock, "%d%s", (int)getuid(), plname);
		//getlock();
#ifdef WIZARD
	} else {
		Sprintf(lock, "%d%s", (int)getuid(), plname);
		//getlock();
	}
#endif /* WIZARD */

        fprintf(stderr, "KKKKKKKKK\n");
	dlb_init();	/* must be before newgame() */
        fprintf(stderr, "LLLLLLLLLL\n");

	/*
	 * Initialization of the boundaries of the mazes
	 * Both boundaries have to be even.
	 */
	x_maze_max = COLNO-1;
	if (x_maze_max % 2)
		x_maze_max--;
	y_maze_max = ROWNO-1;
	if (y_maze_max % 2)
		y_maze_max--;

	/*
	 *  Initialize the vision system.  This must be before mklev() on a
	 *  new game or before a level restore on a saved game.
	 */
        fprintf(stderr, "MMMMMMMMM\n");
	vision_init();
        fprintf(stderr, "NNNNNNNNN\n");

	display_gamewindows();
        fprintf(stderr, "OOOOOOOOO\n");

	if ((fd = restore_saved_game()) >= 0) {
#ifdef WIZARD
		/* Since wizard is actually flags.debug, restoring might
		 * overwrite it.
		 */
		boolean remember_wiz_mode = wizard;
#endif
		const char *fq_save = fqname(SAVEF, SAVEPREFIX, 1);

		(void) chmod(fq_save,0);	/* disallow parallel restores */
		//(void) signal(SIGINT, (SIG_RET_TYPE) done1);
#ifdef NEWS
		if(iflags.news) {
		    display_file(NEWS, FALSE);
		    iflags.news = FALSE; /* in case dorecover() fails */
		}
#endif
		pline("Restoring save file...");
		mark_synch();	/* flush output */
		if(!dorecover(fd))
			goto not_recovered;
#ifdef WIZARD
		if(!wizard && remember_wiz_mode) wizard = TRUE;
#endif
		check_special_room(FALSE);
		wd_message();

		if (discover || wizard) {
			if(yn("Do you want to keep the save file?") == 'n')
			    (void) delete_savefile();
			else {
			    (void) chmod(fq_save,FCMASK); /* back to readable */
			    compress(fq_save);
			}
		}
		flags.move = 0;
	} else {
not_recovered:
		player_selection();
                fprintf(stderr, "OOOOO1\n");
		newgame();
                fprintf(stderr, "OOOOO2\n");
		wd_message();
                fprintf(stderr, "OOOOO3\n");

		flags.move = 0;
                fprintf(stderr, "OOOOO4\n");
		set_wear();
                fprintf(stderr, "OOOOO5\n");
		(void) pickup(1);
                fprintf(stderr, "OOOOO6\n");
	}
        fprintf(stderr, "PPPPPPPPP\n");

	moveloop();
	exit(EXIT_SUCCESS);
	/*NOTREACHED*/
	return(0);
}

static void
process_options(int argc, char *argv[])
{
	int i;


	/*
	 * Process options.
	 */
	while(argc > 1 && argv[1][0] == '-'){
		argv++;
		argc--;
		switch(argv[0][1]){
		case 'D':
#ifdef WIZARD
			{
			  char *user;
			  unsigned int uid;
			  struct passwd *pw = (struct passwd *)0;

			  uid = getuid();
			  user = getlogin();
			  if (user) {
			      pw = getpwnam(user);
			      if (pw && (pw->pw_uid != uid)) pw = 0;
			  }
			  if (pw == 0) {
			      user = nh_getenv("USER");
			      if (user) {
				  pw = getpwnam(user);
				  if (pw && (pw->pw_uid != uid)) pw = 0;
			      }
			      if (pw == 0) {
				  pw = getpwuid(uid);
			      }
			  }
			  if (pw && !strcmp(pw->pw_name,WIZARD)) {
			      wizard = TRUE;
			      break;
			  }
			}
			/* otherwise fall thru to discover */
			wiz_error_flag = TRUE;
#endif
		case 'X':
			discover = TRUE;
			break;
#ifdef NEWS
		case 'n':
			iflags.news = FALSE;
			break;
#endif
		case 'u':
			if(argv[0][2])
			  (void) strncpy(plname, argv[0]+2, sizeof(plname)-1);
			else if(argc > 1) {
			  argc--;
			  argv++;
			  (void) strncpy(plname, argv[0], sizeof(plname)-1);
			} else
				raw_print("Player name expected after -u");
			break;
		case 'I':
		case 'i':
			if (!strncmpi(argv[0]+1, "IBM", 3))
				switch_graphics(IBM_GRAPHICS);
			break;
	    /*  case 'D': */
		case 'd':
			if (!strncmpi(argv[0]+1, "DEC", 3))
				switch_graphics(DEC_GRAPHICS);
			break;
		case 'p': /* profession (role) */
			if (argv[0][2]) {
			    if ((i = str2role(&argv[0][2])) >= 0)
			    	flags.initrole = i;
			} else if (argc > 1) {
				argc--;
				argv++;
			    if ((i = str2role(argv[0])) >= 0)
			    	flags.initrole = i;
			}
			break;
		case 'r': /* race */
			if (argv[0][2]) {
			    if ((i = str2race(&argv[0][2])) >= 0)
			    	flags.initrace = i;
			} else if (argc > 1) {
				argc--;
				argv++;
			    if ((i = str2race(argv[0])) >= 0)
			    	flags.initrace = i;
			}
			break;
		case '@':
			flags.randomall = 1;
			break;
		default:
			if ((i = str2role(&argv[0][1])) >= 0) {
			    flags.initrole = i;
				break;
			}
			/* else raw_printf("Unknown option: %s", *argv); */
		}
	}

	if(argc > 1)
		locknum = atoi(argv[1]);
#ifdef MAX_NR_OF_PLAYERS
	if(!locknum || locknum > MAX_NR_OF_PLAYERS)
		locknum = MAX_NR_OF_PLAYERS;
#endif
}

#ifdef CHDIR
static void
chdirx(const char *dir, BOOLEAN_P wr)
{
	if (dir					/* User specified directory? */
# ifdef HACKDIR
	       && strcmp(dir, HACKDIR)		/* and not the default? */
# endif
		) {
# ifdef SECURE
	    (void) setgid(getgid());
	    (void) setuid(getuid());		/* Ron Wessels */
# endif
	} else {
	    /* non-default data files is a sign that scores may not be
	     * compatible, or perhaps that a binary not fitting this
	     * system's layout is being used.
	     */
# ifdef VAR_PLAYGROUND
	    int len = strlen(VAR_PLAYGROUND);

	    fqn_prefix[SCOREPREFIX] = (char *)alloc(len+2);
	    Strcpy(fqn_prefix[SCOREPREFIX], VAR_PLAYGROUND);
	    if (fqn_prefix[SCOREPREFIX][len-1] != '/') {
		fqn_prefix[SCOREPREFIX][len] = '/';
		fqn_prefix[SCOREPREFIX][len+1] = '\0';
	    }
# endif
	}

# ifdef HACKDIR
	if (dir == (const char *)0)
	    dir = HACKDIR;
# endif

	if (dir && chdir(dir) < 0) {
	    perror(dir);
	    fprintf(stderr, "Cannot chdir to %s.", dir);
	}

	/* warn the player if we can't write the record file */
	/* perhaps we should also test whether . is writable */
	/* unfortunately the access system-call is worthless */
	if (wr) {
# ifdef VAR_PLAYGROUND
	    fqn_prefix[LEVELPREFIX] = fqn_prefix[SCOREPREFIX];
	    fqn_prefix[SAVEPREFIX] = fqn_prefix[SCOREPREFIX];
	    fqn_prefix[BONESPREFIX] = fqn_prefix[SCOREPREFIX];
	    fqn_prefix[LOCKPREFIX] = fqn_prefix[SCOREPREFIX];
	    fqn_prefix[TROUBLEPREFIX] = fqn_prefix[SCOREPREFIX];
# endif
	    check_recordfile(dir);
	}
}
#endif /* CHDIR */

static boolean
whoami() {
	/*
	 * Who am i? Algorithm: 1. Use name as specified in NETHACKOPTIONS
	 *			2. Use $USER or $LOGNAME	(if 1. fails)
	 *			3. Use getlogin()		(if 2. fails)
	 * The resulting name is overridden by command line options.
	 * If everything fails, or if the resulting name is some generic
	 * account like "games", "play", "player", "hack" then eventually
	 * we'll ask him.
	 * Note that we trust the user here; it is possible to play under
	 * somebody else's name.
	 */
	register char *s;

	if (*plname) return FALSE;
	if(/* !*plname && */ (s = nh_getenv("USER")))
		(void) strncpy(plname, s, sizeof(plname)-1);
	if(!*plname && (s = nh_getenv("LOGNAME")))
		(void) strncpy(plname, s, sizeof(plname)-1);
	if(!*plname && (s = getlogin()))
		(void) strncpy(plname, s, sizeof(plname)-1);
	return TRUE;
}

#ifdef PORT_HELP
void
port_help()
{
	/*
	 * Display unix-specific help.   Just show contents of the helpfile
	 * named by PORT_HELP.
	 */
	display_file(PORT_HELP, TRUE);
}
#endif

static void
wd_message()
{
#ifdef WIZARD
	if (wiz_error_flag) {
		pline("Only user \"%s\" may access debug (wizard) mode.",
# ifndef KR1ED
			WIZARD);
# else
			WIZARD_NAME);
# endif
		pline("Entering discovery mode instead.");
	} else
#endif
	if (discover)
		You("are in non-scoring discovery mode.");
}

/*
 * Add a slash to any name not ending in /. There must
 * be room for the /
 */
void
append_slash(char *name)
{
	char *ptr;

	if (!*name)
		return;
	ptr = name + (strlen(name) - 1);
	if (*ptr != '/') {
		*++ptr = '/';
		*++ptr = '\0';
	}
	return;
}

/*unixmain.c*/
  
}
