
import io
import sys
from contextlib import contextmanager


class Tee(io.TextIOBase):
    def __init__(self, *streams):
        self._streams = streams

    def write(self, s):
        if not isinstance(s, str):
            s = str(s)
        for stream in self._streams:
            stream.write(s)
        return len(s)

    def flush(self):
        for stream in self._streams:
            stream.flush()

    def writable(self):
        return True

    @property
    def encoding(self):
        # match sys.stdout/sys.stderr expectations
        return self._streams[0].encoding


@contextmanager
def set_stdout_stderr(stdout, stderr):
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = stdout
    sys.stderr = stderr
    try:
        yield
    finally:
        sys.stdout = old_out
        sys.stderr = old_err


@contextmanager
def tee_stdout_stderr(stream_stdout, stream_stder):
    stdout = Tee(sys.stdout, stream_stdout)
    stderr = Tee(sys.stderr, stream_stder)
    with set_stdout_stderr(stdout, stderr):
        yield