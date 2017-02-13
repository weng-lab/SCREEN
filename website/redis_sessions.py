# -*- coding: utf-8 -*-
# from https://gist.github.com/direct-fuel-injection/749eaf572d0b307114f0
import cherrypy
import datetime
from cherrys import RedisSession
try:
    import simplejson as json
except ImportError:
    import json

class RedisJsonSession(RedisSession):

    def _load(self):
        try:
            return json.loads(self.cache.get(self.id))
        except TypeError:
            return None
        except ValueError:
            return None

    def _save(self, expiration_time):
        json_data = json.dumps((self._data, unicode(expiration_time)))
        result = self.cache.setex(self.id, json_data, self.timeout * 60)
        if not result:
            raise AssertionError("Session data for id %r not set." % self.id)

    def load(self):
        """Copy stored session data into this session instance."""
        data = self._load()
        # data is either None or a tuple (session_data, expiration_time)
        if data is None or datetime.datetime.strptime(data[1][:19], "%Y-%m-%d %H:%M:%S") < self.now():
            if self.debug:
                cherrypy.log('Expired session, flushing data', 'TOOLS.SESSIONS')
            self._data = {}
        else:
            self._data = data[0]
        self.loaded = True

        # Stick the clean_thread in the class, not the instance.
        # The instances are created and destroyed per-request.
        cls = self.__class__
        if self.clean_freq and not cls.clean_thread:
            # clean_up is in instancemethod and not a classmethod,
            # so that tool config can be accessed inside the method.
            t = cherrypy.process.plugins.Monitor(
                cherrypy.engine, self.clean_up, self.clean_freq * 60,
                name='Session cleanup')
            t.subscribe()
            cls.clean_thread = t
            t.start()
