import jinja2


class Templates:
    def __init__(self, viewDir, staticDir=None):
        paths = [viewDir]
        if staticDir:
            paths.append(staticDir)
        self.views = jinja2.Environment(loader=jinja2.FileSystemLoader(paths))

    def __call__(self, t, **kwargs):
        if "title" not in kwargs:
            kwargs["title"] = ""
        if "meta" not in kwargs:
            kwargs["meta"] = []
        fn = t + ".html"
        if t.endswith(".js"):
            fn = t
        return self.views.get_template(fn).render(kwargs)
