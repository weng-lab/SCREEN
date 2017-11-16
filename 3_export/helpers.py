import re

def makeTrackName(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    n = n.replace(" ", "_").replace('(','').replace(')','')
    n = n[:102]
    return n

def makeLongLabel(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    return n[:80]

def makeShortLabel(n):
    match = re.search("(.*) {.*}(.*)", n)
    if match:
	n = match.group(1) + match.group(2)
    return n[:17]

def bigWigFilters(assembly, files):
    files = filter(lambda x: x.isBigWig() and x.assembly == assembly, files)

    def fils():
        for ot in ["fold change over control",
                   "signal of unique reads",
                   "plus strand signal of unique reads",
                   "plus strand signal of all reads",
                   "plus strand signal",
                   "minus strand signal of unique reads",
                   "minus strand signal of all reads",
                   "minus strand signal",
                   "raw signal",
                   "wavelet-smoothed signal",
                   "percentage normalized signal"
                   ]:
            yield lambda x: x.output_type == ot and x.isPooled
            for rep in xrange(0, 5):
                yield lambda x: x.output_type == ot and str(rep) in x.bio_rep
                            
    for bf in fils():
        bigWigs = filter(bf, files)
        if bigWigs:
            return bigWigs

    bfs = [lambda bw: bw.isRawSignal() and bw.bio_rep == '1',
           lambda bw: bw.isRawSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal() and bw.bio_rep == '1',
           lambda bw: bw.isSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal()
           ]
    
    for bf in bfs:
        bigWigs = filter(bf, files)
        if bigWigs:
            return bigWigs

    print(files)
        
    return None
