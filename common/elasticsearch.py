import requests
import json

put_headers = {}

def index(fnp, url):
    with open(fnp, "rb") as f:
        data = json.loads(f.read())
    return requests.put(url, headers=put_headers, data=json.dumps(data))
