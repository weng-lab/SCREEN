from common.page_info import PageInfoMain

class CartController:
    def __init__(self, templates, es, ps, webSocketUrl):
        self.t = templates
        self.params = (es, ps, webSocketUrl)

    def SetCart(self, j):
        pageInfo = PageInfoMain(*self.params)
        return pageInfo.setCart(j)

    def Cart(self, uuid):
        pageInfo = PageInfoMain(*self.params)
        return self.t('main/cart', **pageInfo.cartPage(uuid))

