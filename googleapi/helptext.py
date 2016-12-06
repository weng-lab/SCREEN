from __future__ import print_function
import httplib2
import os
import sys

from apiclient import discovery
from oauth2client import client
from oauth2client import tools
from oauth2client.file import Storage

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../common"))
from constants import helptext

SCOPES = 'https://www.googleapis.com/auth/drive.readonly'
CLIENT_SECRET_FILE = 'client_secret.json'
APPLICATION_NAME = 'Visualizer HelpText'

def _get_credentials(flags):
    """Gets valid user credentials from storage.

    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    Returns:
        Credentials, the obtained credential.
    """
    home_dir = os.path.expanduser('~')
    credential_dir = os.path.join(home_dir, '.credentials')
    if not os.path.exists(credential_dir):
        os.makedirs(credential_dir)
    credential_path = os.path.join(credential_dir,
                                   'drive-python-visualizerhelptext.json')

    store = Storage(credential_path)
    credentials = store.get()
    if not credentials or credentials.invalid:
        flow = client.flow_from_clientsecrets(CLIENT_SECRET_FILE, SCOPES)
        flow.user_agent = APPLICATION_NAME
        if flags:
            credentials = tools.run_flow(flow, store, flags)
        else: # Needed only for compatibility with Python 2.6
            credentials = tools.run(flow, store)
        print('Storing credentials to ' + credential_path)
    return credentials

class GoogleDocs:
    def __init__(self, flags):
        self.credentials = _get_credentials(flags)
        http = self.credentials.authorize(httplib2.Http())
        self.service = discovery.build('drive', 'v3', http=http)
        self.files = self.service.files()

    def getcontents(self, docid):
        return self.files.export(fileId = docid, mimeType = "text/plain").execute()

    def save(self, docid, mimetype, onp):
        contents = self.files.export(fileId = docid, mimeType = mimetype).execute()
        with open(onp, "wb") as o:
            o.write(contents)

if __name__ == "__main__":
    try:
        import argparse
        flags = argparse.ArgumentParser(parents=[tools.argparser]).parse_args()
    except ImportError:
        flags = None
    GoogleDocs(flags).save(helptext.docid, "text/plain", helptext.path)
    print("saved helptext to %s" % helptext.path)
