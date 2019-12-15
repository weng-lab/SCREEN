#!/usr/bin/env python3

from __future__ import print_function

import os
import stat
import sys
import shutil
import json
import re
import subprocess
import errno
import gzip
import tarfile
import zipfile
import six
from six.moves import urllib
import tempfile
import time
from collections import defaultdict
import collections
from itertools import groupby
from subprocess import Popen, PIPE
import hashlib
import tempfile

from requests.auth import HTTPBasicAuth
import requests

if sys.version_info[0] == 3:
    from urllib.request import urlopen
else:
    from urllib import urlopen

def AddPath(f, relPath):
    sys.path.append(os.path.join(os.path.dirname(os.path.realpath(f)), relPath))


def escape_html(text):
    # http://stackoverflow.com/a/28511611
    import cgi
    """escape strings for display in HTML"""
    return cgi.escape(text, quote=True).\
        replace(u'\n', u'<br />').\
        replace(u'\t', u'&emsp;').\
        replace(u'  ', u' &nbsp;')


def printt(*args, **kwargs):
    print(time.strftime("%m/%d/%Y %H:%M:%S") + "\t", *args, **kwargs)


def eprint(*args, **kwargs):
    # Python-like print on stderr
    # from http://stackoverflow.com/a/14981125
    printt(*args, file=sys.stderr, **kwargs)


def makehash():
    # http://stackoverflow.com/a/652226
    return collections.defaultdict(makehash)


def pflush(s):
    print(s, end="")
    sys.stdout.flush()


def importedNumRows(numRows):
    printt("\tcopied in", "{:,}".format(numRows), "rows")


def updatedNumRows(curs):
    printt("\tupdated", "{:,}".format(curs.rowcount), "rows")


def printWroteNumLines(fnp, *args):
    printt("wrote", fnp, '(' + "{:,}".format(numLines(fnp)) + ' lines)', *args)


def cat(fnp):
    if fnp.endswith(".gz"):
        return "zcat " + fnp
    return "cat " + fnp


def numLines(fnp):
    cmds = [cat(fnp), "| wc -l"]
    return int(Utils.runCmds(cmds)[0])


def ranges(i):
    # http://stackoverflow.com/a/4629241
    for a, b in itertools.groupby(enumerate(i), lambda x, y: y - x):
        b = list(b)
        yield b[0][1], b[-1][1]


class Utils:
    FileUmask = stat.S_IRUSR | stat.S_IWUSR  # user read/write
    FileUmask |= stat.S_IRGRP | stat.S_IWGRP  # group read/write
    FileUmask |= stat.S_IROTH  # others read

    DirUmask = stat.S_IRUSR | stat.S_IWUSR  # user read/write
    DirUmask |= stat.S_IRGRP | stat.S_IWGRP  # group read/write
    DirUmask |= stat.S_IROTH  # others read

    @staticmethod
    def rand_int(minn, maxx):
        return random.randrange(minn, maxx)

    @staticmethod
    def deleteFileIfSizeNotMatch(fnp, file_size_bytes):
        if not os.path.exists(fnp):
            return
        if not file_size_bytes:
            return
        if os.path.getsize(fnp) == file_size_bytes:
            return
        os.remove(fnp)

    @staticmethod
    def getHttpFileSizeBytes(url, auth):
        if url.startswith("ftp://"):
            return None

        if not auth:
            r = requests.head(url)
        if auth or 403 == r.status_code:
            keyFnp = os.path.expanduser('~/.encode.txt')
            if os.path.exists(keyFnp):
                with open(keyFnp) as f:
                    toks = f.read().strip().split('\n')
                r = requests.head(url, auth=HTTPBasicAuth(toks[0], toks[1]))
            else:
                raise Exception("no ENCODE password file found at: " +
                                keyFnp)
        if 200 != r.status_code:
            print("could not get file size for", url)
            print("status_code:", r.status_code)
            return None

            # does not (always) work
        if "Content-Length" in r.headers:
            return int(r.headers["Content-Length"])
        else:
            return -1  # invalid filesize...

    @staticmethod
    def quietPrint(quiet, *args, **kwargs):
        if not quiet:
            print(*args, **kwargs)

    @staticmethod
    def download(url, fnp, auth=None, force=False,
                 file_size_bytes=0, skipSizeCheck=None,
                 quiet=False, umask=FileUmask):
        Utils.ensureDir(fnp)
        fn = os.path.basename(fnp)
        if not skipSizeCheck:
            if 0 == file_size_bytes:
                fsb = Utils.getHttpFileSizeBytes(url, auth)
                if fsb:
                    file_size_bytes = fsb
            Utils.deleteFileIfSizeNotMatch(fnp, file_size_bytes)

        if os.path.exists(fnp):
            if force:
                os.remove(fnp)
            else:
                return True

        Utils.quietPrint(quiet, "downloading", url, "...")

        if url.startswith("ftp://"):
            fnpTmp = urllib.urlretrieve(url)[0]
            shutil.move(fnpTmp, fnp)
            # chmod g+w
            st = os.stat(fnp)
            os.chmod(fnp, st.st_mode | umask)
            return True

        if not auth:
            r = requests.get(url) # TODO: streaming
            # see https://stackoverflow.com/questions/16694907/how-to-download-large-file-in-python-with-requests-py
        if auth or 403 == r.status_code:
            keyFnp = os.path.expanduser('~/.encode.txt')
            if os.path.exists(keyFnp):
                with open(keyFnp) as f:
                    toks = f.read().strip().split('\n')
                r = requests.get(url, auth=HTTPBasicAuth(toks[0], toks[1])) # TODO streaming
            else:
                raise Exception("no ENCODE password file found at: " +
                                keyFnp)
        if 200 != r.status_code:
            Utils.quietPrint(quiet, "could not download", url)
            Utils.quietPrint(quiet, "status_code:", r.status_code)
            return False

        # with open(fnpTmp, "wb") as f:
        try:
            fnpTmp = None
            with tempfile.NamedTemporaryFile("wb", delete=False) as f:
                f.write(r.content)
                fnpTmp = f.name
            shutil.move(fnpTmp, fnp)
        except:
            raise
        finally:
            if fnpTmp and os.path.exists(fnpTmp):
                os.remove(fnpTmp)
        # chmod g+w
        st = os.stat(fnp)
        os.chmod(fnp, st.st_mode | umask)
        return True

    @staticmethod
    def query(url, auth=None, quiet=False):
        Utils.quietPrint(quiet, "downloading", url, "...")

        if not auth:
            r = requests.get(url)
        if auth or 403 == r.status_code:
            keyFnp = os.path.expanduser('~/.encode.txt')
            if os.path.exists(keyFnp):
                with open(keyFnp) as f:
                    toks = f.read().strip().split('\n')
                r = requests.get(url, auth=HTTPBasicAuth(toks[0], toks[1]))
            else:
                raise Exception("no ENCODE password file found at: " +
                                keyFnp)
        if 200 != r.status_code:
            Utils.quietPrint(quiet, "could not download", url)
            Utils.quietPrint(quiet, "status_code:", r.status_code)
            return None, r.status_code

        return r.content, r.status_code

    @staticmethod
    def ensureDir(fnp, umask=DirUmask):
        d = os.path.dirname(fnp)
        if d != "" and not os.path.exists(d):
            Utils.mkdir_p(d, umask)
        return d

    @staticmethod
    def mkdir(path, umask=DirUmask):
        try:
            os.mkdir(path)
            # chmod g+w
            st = os.stat(path)
            os.chmod(path, st.st_mode | umask)
        except OSError as exc:  # Python >2.5
            if (exc.errno == errno.EEXIST or exc.errno == errno.EISDIR) and os.path.isdir(path):
                pass
            else:
                raise

    @staticmethod
    def mkdir_p(path, umask=DirUmask):
        abspath = os.path.abspath(path)
        dirname = os.path.dirname(abspath)
        if dirname != abspath:  # i.e. dirname("/") == "/"
            Utils.mkdir_p(dirname, umask) # needed over os.makedirs to control umask for entire tree
        Utils.mkdir(abspath, umask)

    @staticmethod
    def run_in_dir(cmd, d):
        Utils.runCmds([cmd], cwd=d)

    @staticmethod
    def runCmds(cmds, verbose=False, cwd=None):
        if sys.version_info >= (3, 0):
            cmds = " ".join(cmds) # needed to make sure | and > redirects work...
            if verbose:
                print("running: ", cmds)

            process = subprocess.run(cmds, shell=True, cwd=cwd, executable='/bin/bash',
                                     universal_newlines=True,
                                     stdout=subprocess.PIPE, stderr=subprocess.STDOUT) # TODO: check stderr?

            output = process.stdout.split()
            errors = process.stderr
            exitCode = process.returncode

            if (exitCode == 0):
                return output
            print("ERROR\noutput was:\n", output, file=sys.stderr)
            print("ERROR\nerrors were:\n", errors, file=sys.stderr)
            print("ERROR\ncmd was:\n", cmds, file=sys.stderr)
            print("exitCode:", exitCode, file=sys.stderr)
            raise Exception(cmds, exitCode, output)
        else:
            cmd = " ".join(cmds)
            if verbose:
                print("running: ", cmd)

            ret = []

            # from http://stackoverflow.com/a/4418193
            if cwd is not None:
                process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, cwd=cwd,
                                           stderr=subprocess.STDOUT, executable='/bin/bash')
            else:
                process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE,
                                           stderr=subprocess.STDOUT, executable='/bin/bash')
            # Poll process for new output until finished
            while True:
                nextline = process.stdout.readline()
                if nextline == '' and process.poll() != None:
                    break
                if nextline:
                    ret.append(nextline)
                    if verbose:
                        print(nextline,)

            output, error = process.communicate()
            exitCode = process.returncode

            if (exitCode == 0):
                return ret
            print("ERROR\noutput was:\n", output, error, file=sys.stderr)
            print("exitCode:", exitCode, file=sys.stderr)
            raise Exception(cmd, exitCode, output) # TODO: non-generic catchable exception

    @staticmethod
    def titleCase(s):
        # http://stackoverflow.com/a/3729957
        articles = ['a', 'an', 'of', 'the', 'is']
        exceptions = articles
        word_list = re.split(' ', s)  # re.split behaves as expected
        final = [word_list[0].capitalize()]
        for word in word_list[1:]:
            final.append(word in exceptions and word or word.capitalize())
        return " ".join(final)

    @staticmethod
    def color(json, force=None):
        # https://stackoverflow.com/questions/25638905/coloring-json-output-in-python
        if force or sys.stdout.isatty():
            try:    # if we can load pygments, return color
                from pygments import highlight, lexers, formatters
                colorful_json = highlight(unicode(json, 'UTF-8'), lexers.JsonLexer(),
                                          formatters.TerminalFormatter())
                return colorful_json
            except:  # otherwise, return original json
                pass
        return json

    @staticmethod
    def pager(text):
        # be nice
        pager = os.getenv('PAGER')
        if not pager:
            pager = ['less', '-F', '-R', '-X']
        p = Popen(pager, stdin=PIPE)
        try:
            p.stdin.write(text)
        except IOError as e:
            if e.errno == errno.EPIPE or e.errno == errno.EINVAL:
                pass
            else:
                raise
        p.stdin.close()
        p.wait()

    @staticmethod
    def md5(fnp, chunk_size=1048576):
        # from http://stackoverflow.com/a/3431838
        _hex = hashlib.md5()
        with open(fnp, 'rb') as f:
            for chunk in iter(lambda: f.read(chunk_size), b''):
                _hex.update(chunk)
        return _hex.hexdigest()

    @staticmethod
    def md5er(fnp):
        md5 = Utils.md5(fnp)

        d = os.path.dirname(fnp)
        fn = os.path.basename(fnp) + ".md5"
        outFnp = os.path.join(d, fn)
        with open(outFnp, 'w') as f:
            f.write(md5 + '\n')
        printWroteNumLines(outFnp)

    @staticmethod
    def is_gzipped(fnp):
        return open(fnp, 'rb').read(2) == b'\x1f\x8b'

    @staticmethod
    def sortFile(fnp, outFnp=None):
        if outFnp:
            cmds = ["sort", "-o", outFnp, "-k1,1 -k2,2n", fnp]
        else:
            cmds = ["sort", "-o", fnp, "-k1,1 -k2,2n", fnp]
        return Utils.runCmds(cmds)

    @staticmethod
    def sortFileColOne(fnp, outFnp=None):
        if outFnp:
            cmds = ["sort", "-o", outFnp, "-k1,1n", fnp]
        else:
            cmds = ["sort", "-o", fnp, "-k1,1n", fnp]
        return Utils.runCmds(cmds)

    @staticmethod
    def checkIfUrlExists(url):
        # http://stackoverflow.com/a/7347995
        try:
            ret = urllib2.urlopen(url)
            return ret.code == 200
        except:
            return False

    @staticmethod
    def touch(fnp):
        if not os.path.exists(os.path.dirname(fnp)):
            os.makedirs(os.path.dirname(fnp))
        with open(fnp, "w") as f:
            f.write(" ")
            f.close()

    @staticmethod
    def ftouch(fnp):
        if not os.path.exists(os.path.dirname(fnp)):
            os.makedirs(os.path.dirname(fnp))
        Utils.touch(fnp)

    @staticmethod
    def fileOlderThanDays(fnp, days):
        # from http://stackoverflow.com/a/5799209
        if not os.path.exists(fnp):
            return True
        import datetime
        today_dt = datetime.datetime.today()
        modified_dt = datetime.datetime.fromtimestamp(os.path.getmtime(fnp))
        duration = today_dt - modified_dt
        return duration.days > days

    @staticmethod
    def get_file_if_size_diff(url, d):
        fn = url.split('/')[-1]
        out_fnp = os.path.join(d, fn)
        net_file_size = int(urlopen(url).info()['Content-Length'])
        if os.path.exists(out_fnp):
            fn_size = os.path.getsize(out_fnp)
            if fn_size == net_file_size:
                print("skipping download of", fn)
                return out_fnp
            else:
                print("files sizes differed:")
                print("\t", "on disk:", fn_size)
                print("\t", "from net:", net_file_size)
        print("retrieving", fn)
        Utils.download(url, out_fnp)
        return out_fnp
    
    @staticmethod
    def getStringFromListOrString(s):
        """
        For Roadmap, some JSON fields may be lists with repeated values; in these cases, truncate to the first token.
        Otherwise, if s is a string type, simply return it unchanged.
        @param s: JSON field, as list or string
        returns: representative string for `s` as per above.
        """
        if isinstance(s, six.string_types): # six for python2/python3 compatibility.
            return s
        toks = list(set(s))
        return toks[0]

    @staticmethod
    def which(program):
        # from http://stackoverflow.com/a/377028
        def is_exe(fpath):
            return os.path.isfile(fpath) and os.access(fpath, os.X_OK)

        fpath, fname = os.path.split(program)
        if fpath:
            if is_exe(program):
                return program
        else:
            for path in os.environ["PATH"].split(os.pathsep):
                path = path.strip('"')
                exe_file = os.path.join(path, program)
                if is_exe(exe_file):
                    return exe_file

        return None

    @staticmethod
    def rm_rf(d):
        if os.path.exists(d):
            print("rm -rf", d)
            shutil.rmtree(d)

    @staticmethod
    def num_cores():
        import multiprocessing
        return multiprocessing.cpu_count()

    @staticmethod
    def isFreeBsd():
        import platform
        return platform.system() == 'FreeBSD'

    @staticmethod
    def un_xz_tar(fnp, d):
        if Utils.isFreeBsd():
            cmds = ["xzcat", fnp, "| tar -C", d, "-xvf -"]
        else:
            cmds = ["tar", "xvf", fnp, "-C", d]
        Utils.runCmds(cmds)

    @staticmethod
    def untar(fnp, d):
        if fnp.endswith(".tar.gz"):
            tar = tarfile.open(fnp, "r:gz", errorlevel=2)
        elif fnp.endswith(".tar.xz"):
            return Utils.un_xz_tar(fnp, d)
        elif fnp.endswith(".tar.bz2"):
            tar = tarfile.open(fnp, "r:bz2", errorlevel=2)
        elif fnp.endswith(".tar"):
            tar = tarfile.open(fnp, "r", errorlevel=2)
        elif fnp.endswith(".zip"):
            with zipfile.ZipFile(fnp, "r") as z:
                z.extractall(d)
                return
        else:
            raise Exception("invalid file? " + fnp)
        print("untarring", fnp, "to", d)
        tar.extractall(d)
        tar.close()

    @staticmethod
    def clear_dir(d):
        Utils.rm_rf(d)
        Utils.mkdir(d)

    @staticmethod
    def shellquote(s):
        " from http://stackoverflow.com/a/35857"
        return "'" + s.replace("'", "'\\''") + "'"

    @staticmethod
    def merge_two_dicts(x, y):
        # http://stackoverflow.com/a/26853961
        # Given two dicts, merge into a new dict using shallow copy
        z = x.copy()
        z.update(y)
        return z

    @staticmethod
    def dictCompare(d1, d2):
        # from http://stackoverflow.com/a/18860653
        d1_keys = set(d1.keys())
        d2_keys = set(d2.keys())
        intersect_keys = d1_keys.intersection(d2_keys)
        added = d1_keys - d2_keys
        removed = d2_keys - d1_keys
        modified = {o: (d1[o], d2[o]) for o in intersect_keys if d1[o] != d2[o]}
        same = set(o for o in intersect_keys if d1[o] == d2[o])
        return added, removed, modified, same

    @staticmethod
    def uuidStr():
        import uuid
        return str(uuid.uuid4())

    @staticmethod
    def timeDateStr():
        # from http://stackoverflow.com/a/10607768
        # ex:  20120515-155045
        import time
        return time.strftime("%Y%m%d-%H%M%S")

    @staticmethod
    def remove_non_ascii(s):
        # http://drumcoder.co.uk/blog/2012/jul/13/removing-non-ascii-chars-string-python/
        return "".join(i for i in s if ord(i) < 128)

    @staticmethod
    def scale(val, src, dst):
        # http://stackoverflow.com/a/33127793
        # Scale the given value from the scale of src to the scale of dst.
        # use: scale(1, (0.0, 99.0), (-1.0, +1.0))
        from numpy import interp
        return interp(val, src, dst)


class Timer(object):
    # http://stackoverflow.com/a/5849861
    def __init__(self, name=None):
        self.name = name

    def __enter__(self):
        self.tstart = time.time()

    def __exit__(self, type, value, traceback):
        if self.name:
            print('[%s]' % self.name,)
        print('Elapsed: %s' % (time.time() - self.tstart))


class TmpFnp(object):
    def __enter__(self):
        f = tempfile.NamedTemporaryFile(delete=False)
        self.tmpFnp = f.name
        f.close()
        return self.tmpFnp

    def __exit__(self, type, value, traceback):
        os.remove(self.tmpFnp)


class UtilsTests:
    def numLines(self):
        n = 173
        with TmpFnp() as fnpTmp:
            with open(fnpTmp, 'w') as f:
                for i in range(n):
                    f.write("hi " + str(i) + "\n")
            count = numLines(fnpTmp)
        if count != n:
            print("numLines returned", count, "but n is", n)
            assert(count == n)


class dotdict(dict):
    # dot.notation access to dictionary attributes
    # http://stackoverflow.com/a/23689767
    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


class Replacer(object):
    # from http://stackoverflow.com/a/3367868
    def __init__(self, **replacements):
        self.replacements = replacements
        self.locator = re.compile('|'.join(re.escape(s) for s in replacements))

    def _doreplace(self, mo):
        return self.replacements[mo.group()]

    def replace(self, s):
        return self.locator.sub(self._doreplace, s)


def main():
    ut = UtilsTests()
    ut.numLines()
    if 0:
        for r in [1, 1000, 100000]:
            print(r, 'to', Utils.scale(r, (1, 250 * 100), (1000, 1)))


if __name__ == "__main__":
    sys.exit(main())
