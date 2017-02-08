def isaccession(s):
    if len(s) != 12:
        return False
    s = s.lower()
    return (s.startswith("eh37e") or s.startswith("em10e"))

