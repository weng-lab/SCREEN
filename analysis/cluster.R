library(doParallel)
library(foreach)
library(data.table)
library(ape)

# some definitions
ROW <- 1
COLUMN <- 2

# in case we want to do somthing in parallel...
registerDoParallel(cores=52)

# list of files to run on
files <- list(
	DNase = "DNase.hg19.Matrix.txt",
	Enhancer = "Enhancer.hg19.Matrix.txt",
	H3K27ac = "H3K27ac.hg19.Matrix.txt",
	H3K27ac_mm10 = "H3K27ac.mm10.Matrix.txt"
)

# read and cache data
readfile <- function(fnp) { # boot.phylo wants a transposed matrix
	rda <- sprintf("%s.rda", fnp)
	if (file.exists(rda)) {
		cat(sprintf("reading %s ...\n", rda))
		load(rda)
		return(f)
	} else {
		cat(sprintf("reading %s ...\n", fnp))
		f <- fread(fnp, sep="\t", header=T) #, nrows=10000)
		nm <- colnames(f)
		cat("transpose ...\n")
		nm <- colnames(f)[2:ncol(f)]
		f <- transpose(f[, 2:ncol(f), with=F])
		rownames(f) <- paste(1:length(nm), nm, sep="_")
		cat("save to rda ...\n")
		save(f, file=rda, compress=F)
	}
	return(f)
}

# perform clustering (on transposed mtx :-/)
clustfun <- function(x) {
	p <- as.phylo(hclust(as.dist(sqrt(1-cor(transpose(x))))))
	return(p)
}

# perform clustering and bootstrapping in $fnp
doit <- function(fnp, variance_cutoff=0.05, B=100) {
	cat(sprintf("fnp: %s, variance_cutoff: %.3f, B: %d\n", fnp,
		    variance_cutoff, B))
	f <- readfile(fnp)
	mm <- apply(f, COLUMN, mean)
	vv <- apply(f, COLUMN, var)
	plot(density(mm), lwd=2,
	     main=sprintf("mean across tissues (n=%d)\n%s", length(mm), fnp))
	plot(density(vv), lwd=2.05,
	     main=sprintf("variance across tissues (n=%d)\n%s", length(vv), fnp))
	q <- quantile(vv, p=variance_cutoff)
	dd <- density(vv[vv > q])
	lines(dd$x, dd$y * (1 - variance_cutoff), col="red", lwd=2)
	mytree <- clustfun(f[, vv > q, with=F])
	cat(sprintf("bootstrapping ... (B=%d)\n", B))
	moretrees <- boot.phylo(mytree, f[, vv > q, with=F], clustfun, B=B, trees=T)
	mytree$tip.label <- gsub("^[0-9]+_", "", rownames(f))
	plot(mytree, cex=0.2, main=fnp)
	nodelabels(sprintf("%.1f", moretrees$BP / B), cex=0.2, frame="circle")
	rda <- sprintf("%s.rda", fnp)
	cat(sprintf("saving data and results to %s ...\n", rda))
	save(f, mm, vv, q, mytree, moretrees, file=rda, compress=F)
}

# do it. all.
pdf("cluster_2.pdf") #, height=14, width=14)
for (f in files) {
	doit(f)
}

dev.off()

