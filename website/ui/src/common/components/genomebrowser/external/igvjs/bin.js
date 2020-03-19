/* -*- mode: javascript; c-basic-offset: 4; indent-tabs-mode: nil -*- */

// 
// Dalliance Genome Explorer
// (c) Thomas Down 2006-2011
//
// bin.js general binary data support
//

import Hashes from 'jshashes';
import {shallowCopy} from './utils';

var seed=0;
var isSafari = typeof(navigator) !== 'undefined' &&
    navigator.userAgent.indexOf('Safari') >= 0 &&
    navigator.userAgent.indexOf('Chrome') < 0 ;

export class BlobFetchable{
    constructor(b) {
        this.blob = b;
    }

    slice(start, length) {
        var b;

        if (this.blob.slice) {
            if (length) {
                b = this.blob.slice(start, start + length);
            } else {
                b = this.blob.slice(start);
            }
        } else {
            if (length) {
                b = this.blob.webkitSlice(start, start + length);
            } else {
                b = this.blob.webkitSlice(start);
            }
        }
        return new BlobFetchable(b);
    }

    salted() {
        return this;
    }

    fetch(callback) {
        var reader = new FileReader();
        reader.onloadend = function(ev) {
            callback(bstringToBuffer(reader.result));
        };
        reader.readAsBinaryString(this.blob);
    }
}

export class URLFetchable{
    constructor(url, start, end, opts) {
        if (!opts) {
            if (typeof start === 'object') {
                opts = start;
                start = undefined;
            } else {
                opts = {};
            }
        }

        this.url = url;
        this.start = start || 0;
        if (end) {
            this.end = end;
        }
        this.opts = opts;
    }

    slice(s, l) {
        if (s < 0) {
            throw Error('Bad slice ' + s);
        }

        var ns = this.start, ne = this.end;
        if (ns && s) {
            ns = ns + s;
        } else {
            ns = s || ns;
        }
        if (l && ns) {
            ne = ns + l - 1;
        } else {
            ne = ne || l - 1;
        }
        return new URLFetchable(this.url, ns, ne, this.opts);
    }

    salted() {
        var o = shallowCopy(this.opts);
        o.salt = true;
        return new URLFetchable(this.url, this.start, this.end, o);
    }

    getURL() {
        if (this.opts.resolver) {
            return this.opts.resolver(this.url).then(function (urlOrObj) {
                if (typeof urlOrObj === 'string') {
                    return urlOrObj;
                } else {
                    return urlOrObj.url;
                }
            });
        } else {
            return Promise.resolve(this.url);
        }
    }

    fetch(callback, opts) {
        var thisB = this;
        
        opts = opts || {};
        var attempt = opts.attempt || 1;
        var truncatedLength = opts.truncatedLength;
        if (attempt > 3) {
            return callback(null);
        }

        this.getURL().then(function(url) {
            try {
                var timeout;
                if (opts.timeout && !thisB.opts.credentials) {
                    timeout = setTimeout(
                        function() {
                            console.log('timing out ' + url);
                            req.abort();
                            return callback(null, 'Timeout');
                        },
                        opts.timeout
                    );
                }
                
                var req = new XMLHttpRequest();
                var length;
                if ((isSafari || thisB.opts.salt) && url.indexOf('?') < 0) {
                    const str = '' + Date.now() + ',' + (++seed);
                    const hash = new Hashes.SHA1().b64(str)
                    url = url + '?salt=' + hash;
                }
                req.open('GET', url, true);
                req.overrideMimeType('text/plain; charset=x-user-defined');
                if (thisB.end) {
                    if (thisB.end - thisB.start > 100000000) {
                        throw Error('Monster fetch!');
                    }
                    req.setRequestHeader('Range', 'bytes=' + thisB.start + '-' + thisB.end);
                    length = thisB.end - thisB.start + 1;
                }
                req.responseType = 'arraybuffer';
                req.onreadystatechange = function() {
                    if (req.readyState === 4) {
                        if (timeout)
                            clearTimeout(timeout);
                        if (req.status === 200 || req.status === 206) {
                            if (req.response) {
                                var bl = req.response.byteLength;
                                if (length && length !== bl && (!truncatedLength || bl !== truncatedLength)) {
                                    return thisB.fetch(callback, {attempt: attempt + 1, truncatedLength: bl});
                                } else {
                                    return callback(req.response);
                                }
                            } else if (req.mozResponseArrayBuffer) {
                                return callback(req.mozResponseArrayBuffer);
                            } else {
                                var r = req.responseText;
                                if (length && length !== r.length && (!truncatedLength || r.length !== truncatedLength)) {
                                    return thisB.fetch(callback, {attempt: attempt + 1, truncatedLength: r.length});
                                } else {
                                    return callback(bstringToBuffer(req.responseText));
                                }
                            }
                        } else {
                            return thisB.fetch(callback, {attempt: attempt + 1});
                        }
                    }
                };
                if (thisB.opts.credentials) {
                    req.withCredentials = true;
                }
                req.send();
            } catch (e) {
                return callback(null);
            }
        }).catch(function(err) {
            console.log(err);
            return callback(null, err);
        });
    }
}
                       
function bstringToBuffer(result) {
    if (!result) {
        return null;
    }

    var ba = new Uint8Array(result.length);
    for (var i = 0; i < ba.length; ++i) {
        ba[i] = result.charCodeAt(i);
    }
    return ba.buffer;
}

export const readInt = (ba, offset) => {
    return (ba[offset + 3] << 24) | (ba[offset + 2] << 16) | (ba[offset + 1] << 8) | (ba[offset]);
}
