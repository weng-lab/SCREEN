from common.page_info import PageInfoMain

class UiController:
    def __init__(self, templates, es, ps, version, webSocketUrl):
        self.t = templates
        self.params = (es, ps, version, webSocketUrl)

    def Default(self):
        return self.t('ui/index')
    
