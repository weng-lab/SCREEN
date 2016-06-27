import os, sys
import argparse
import json

from elasticsearch import Elasticsearch

def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rootpath', type=str, default="../../data/")
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    parser.add_argument("--debug", action="store_true", default=False)
    return parser.parse_args()

def main():
    args = parseargs()
    es = Elasticsearch([args.elasticsearch_server],
                       port = args.elasticsearch_port)
    rootpath = os.path.join(args.rootpath, "index_name2", "type")
    if not os.path.exists(args.rootpath):
        print("directory %s not found" % args.rootpath)
        sys.exit(0)
    for subdir, _dirs, filenames in os.walk(os.path.dirname(rootpath)):
        for fnp in [os.path.join(subdir, f) for f in filenames]:
            if fnp.endswith("~"): continue
            try:
                with open(fnp, "rb") as f:
                    r = es.index(index="index_name2", doc_type="type", body=json.load(f))
                if args.debug:
                    print("index succeeded for %s" % fnp)
                else:
                    print("indexed %s at %s" % (fnp, "http://%s:%d/%s" % (args.elasticsearch_server,
                                                                          args.elasticsearch_port,
                                                                          fnp.replace(args.rootpath, ""))))
            except:
                print("error indexing file %s; check that the file's JSON is valid and elasticsearch is running" % fnp)
                if args.debug:
                    e = sys.exc_info()[:2]
                    print(e[0])
                    if hasattr(e, "message"): e.message
                    raise
            break
    return 0

if __name__ == "__main__":
    sys.exit(main())
