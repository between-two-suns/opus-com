import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from editable import auto
for n in ['about-sky', 'about-routine', 'about-made', 'about-founder', 'about-rules', 'about-close', 'climate-story',
          'contact-v2', 'creators', 'creator-apply', 'creator-kit', 'bundles', 'routine-builder', 'routine-finder',
          'skin-check', 'ingredient-benefits', 'ingredient-glossary', 'help-page', 'main-collection', 'scan-landing',
          'page-hero', 'main-list-collections']:
    if n == 'contact-v2': continue  # done separately: FAQ answers stay with the FAQ (40-setting limit)
    auto(n)
