#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/webservice/job_monitor'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from utils import Utils
from metadataws import MetadataWS

import jobmonitor
import clusterjob

clusterjob.ws_link = jobmonitor.job

def generate_jobset(e1, e2, args):
    try:
        memejob = jobmonitor.job({}, "python2 %s --e1=%s --e2=%s --assembly=%s%s" % (os.path.realpath(__file__), e1, e2, args.assembly, " --local" if args.local else ""))
        memejob.bsub_options = {"mem": 8192, "time": "12:00", "cores": 1, "queue": "long"}
        memejob.ws_act("insert")
        jobset = jobmonitor.jobset([[memejob]], "%s DESeq %s/%s" % (args.jobset_name_prefix, e1, e2))
        jobset.ws_act("insert")
    except:
        print("Error generating jobsets for accessions %s/%s" % (e1, e2))
        raise
    return jobset

def get_expids(curs):
    curs.execute("SELECT encode_id FROM r_rnas")
    return curs.fetchall()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--bsuball', action="store_true", default=False)
    parser.add_argument("--jobset_name_prefix", type=str, default="")
    parser.add_argument('--e1', type=str, default="")
    parser.add_argument('--e2', type=str, default="")
    parser.add_argument("--testone", action="store_true", default=False)
    parser.add_argument('--accession_list', type=str, default="")
    parser.add_argument("--save_list", type=str, default="")
    args = parser.parse_args()
    return args

"""
  " converts a list of gene quantification TSVs from ENCODE into a TSV which DESeq can read.
  " in_fnps: array of paths to the ENCODE TSVs
  " out_fnp: path to output the TSV
"""
def create_tsv(in_fnps, out_fnp):
    genes = {}

    # for each TSV
    for _file in in_fnps:
        c = 0 # for skipping first line

        # double check it exists
        if not os.path.exists(_file):
            print("warning: missing file %s; skipping" % _file)

        # open file, skip first line
        with open(_file, "r") as f:
            for line in f:
                if c == 0:
                    c = 1
                    continue

                # gene ID in column 1, FPKM in column 7
                p = line.split("\t")
                if p[0] not in genes: genes[p[0]] = {}
                genes[p[0]][_file] = p[6] # FPKM

    # open output file
    with open(out_fnp, "wb") as o:

        # write header
        o.write("gene\t" + "\t".join([os.path.basename(x).replace(".tsv", "") for x in in_fnps]) + "\n")

        # write genes
        for k, v in genes.iteritems():

            # skip lines with no expression in any replicate
            if sum([float(x) for _, x in v.iteritems()]) == 0.0:
                continue

            # write the line out
            o.write(k.replace(".", "_").replace("-", "_"))
            for _file in in_fnps:
                o.write("\t" + str(int(float(v[_file]) * 1000)) if _file in v else "0")
            o.write("\n")

"""
  " generates metadata for DESeq and saves it to the given output path.
  " e1, e2: Exp objects referring to ENCODE RNA-Seq experiments
  " assembly: assmelby for which to select TSVs
2A  " out_fnp: path to save the metadata
  "
  " returns: list of paths to TSV files included in the metadata
"""
def generate_metadata(e1, e2, assembly, out_fnp):
    
    metadata = {}
    retval = []

    for e in [e1, e2]:
        
        # determine whether replicates are paired-end or single-end
        reps = {}
        for fastq in filter(lambda f: f.file_type == "fastq", e.files):
            for replicate in fastq.biological_replicates:
                reps[replicate] = "paired-end" if "paired" in fastq.jsondata["run_type"] else "single-end"

        # get metadata for all TSVs
        for tsv in filter(lambda f: f.file_type == "tsv" and f.output_type == "gene quantifications" and f.assembly == assembly, e.files):
            metadata[os.path.basename(tsv.fnp())] = "\t".join([e.biosample_term_name, reps[tsv.biological_replicates[0]]])
            retval.append(tsv.fnp())
            if not os.path.exists(tsv.fnp()): tsv.download()

    # open output file, write header and entries
    with open(out_fnp, "wb") as o:
        o.write("key\tcondition\tlibType\n")
        for k, v in metadata.iteritems():
            o.write(k.replace(".tsv", "") + "\t" + v + "\n")

    # return path list
    return retval

def main():
    args = parse_args()

    # indicates a cluster run
    if args.e1 != "" and args.e2 != "":

        # find directory
        dnp = "/project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e1, e2)
        if not os.path.exists(dnp):
            dnp = "/project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e2, e1)
        if not os.path.exists(dnp):
            print("fatal: could not find data; checked:")
            print("     /project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e1, e2))
            print("     /project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e2, e1))
            return 1

        # pass to R
        try:
            subprocess.check_output(["Rscript", os.path.join(os.path.dirname(os.path.realpath(__file__)), "01_de.R"),
                                     dnp])
        except subprocess.CalledProcessError as e:
            print("R exited code %d" % e.returncode)
            return e.returncode
        except:
            return 1
        return 0

    # default: loop through datasets downloading and submitting
    for dataset in [Datasets.all_human]:

        # get datasets from database if no explicit list
        if args.accession_list == "" or not os.path.exists(args.accession_list):
            DBCONN = db_connect(os.path.realpath(__file__), args.local)
            with getcursor(DBCONN, "06_de") as curs:
                expids = get_expids(curs)

            # if saving, write list out and exit
            if args.save_list != "":
                with open(args.save_list, "wb") as o:
                    for i in expids:
                        o.write(i[0] + "\n")
                print("saved list to %s" % args.save_list)
                return 0

            # get exp objects
            exps = [Exp.fromJsonFile(i[0]) for i in expids]

        # have an explicit accession list
        else:
            with open(args.accession_list, "r") as f:
                exps = [Exp.fromJsonFile(x.strip()) for x in f]
            
        # produce input and metadata for each pair
        for i in xrange(len(exps)):
            for j in range(i + 1, len(exps)):
                e1 = exps[i]
                e2 = exps[j]
                
                # check output directory exists
                dnp = "/project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e1.encodeID, e2.encodeID)
                if not os.path.exists(dnp):
                    os.makedirs(dnp)
                    
                # produce data and metadata files
                inputfnp = os.path.join(dnp, "data.tsv")
                mfnp = os.path.join(dnp, "metadata.tsv")
                print("generating metadata for pair %s/%s" % (e1.encodeID, e2.encodeID))
                flist = generate_metadata(e1, e2, args.assembly, mfnp)
                create_tsv(flist, inputfnp)
                print("input at %s" % inputfnp)
                print("metadata at %s" % mfnp)

                # if bsubbing...
                if args.bsuball:
                    generate_jobset(e1.encodeID, e2.encodeID, args).run()
                if args.testone: return 0

    return 0

if __name__ == '__main__':
    sys.exit(main())
