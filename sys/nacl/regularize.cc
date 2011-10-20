extern "C" {

void
regularize(char *s)
/*
 * normalize file name - we don't like .'s, /'s, spaces, and
 * lots of other things
 */
{
        char *lp;

        for (lp = s; *lp; lp++)
                if (*lp <= ' ' || *lp == '"' || (*lp >= '*' && *lp <= ',') ||
                    *lp == '.' || *lp == '/' || (*lp >= ':' && *lp <= '?') ||
                    *lp == '|' || *lp >= 127 || (*lp >= '[' && *lp <= ']'))
                        *lp = '_';
}

}
