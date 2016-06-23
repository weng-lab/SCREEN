import requests
import json

get_headers = {}
put_headers = {}

default_server = "127.0.0.1"
default_port   = 9200

class ElasticSearchWrapper:
    @staticmethod
    def default_url(uri):
        return "http://%s:%d/%s" % (default_server, default_port, uri)

    @staticmethod
    def index(fnp, url):
        with open(fnp, "rb") as f:
            data = json.loads(f.read())
        print url
        return requests.put(url, headers=put_headers, data=json.dumps(data))

    @staticmethod
    def query(q, url):
        if q is None: return None
        return requests.get(url, headers=get_headers, data=json.dumps(q))
