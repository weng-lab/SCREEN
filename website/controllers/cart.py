from common.page_info import PageInfoMain

class CartController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.params = (es, ps)

    def SetCart(self, session_uuid, reAccessions):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.setCart(session_uuid, reAccessions)

    def Cart(self, uuid):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/cart', **pageInfo.cartPage(uuid))

