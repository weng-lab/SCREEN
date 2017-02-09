from constants import chroms

def isaccession(s):
    if len(s) != 12:
        return False
    s = s.lower()
    return (s.startswith("eh37e") or s.startswith("em10e"))


def isclose(a, b, rel_tol=1e-09, abs_tol=0.0):
    # from http://stackoverflow.com/a/33024979
    return abs(a-b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)

def checkChrom(assembly, j):
    chrom = j.get("coord_chrom", None)
    if chrom and chrom not in chroms[assembly]:
        raise Exception("unknown chrom")
    return chrom

