import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from editable import auto
SR = ('general.opens_new_window', 'header.primary_nav', 'general.announcement', 'header.menu')  # screen-reader-only labels
for n in ['header', 'footer', 'announcement-bar']:
    auto(n, skip=SR)
for n in ['main-cart', 'main-search', 'main-404', 'main-account', 'main-password', 'main-blog', 'main-article']:
    auto(n)
# main-product-v2 is left out: its text is checkout/delivery wording driven by theme settings, and converting it
# pushes the section past Shopify's Liquid complexity limit (per-product text is in the "Website ·" product fields).
