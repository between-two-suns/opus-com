import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from editable import apply
E = 'Small line above the heading'
apply('set-day', [('set2.day_eyebrow', 'eyebrow', E), ('set2.day_heading', 'heading', 'Heading')])
apply('set-inside', [('bundle_inside.eyebrow', 'eyebrow', E), ('bundle_inside.heading', 'heading', 'Heading')])
apply('pdp-benefits', [('pdp2.inside_eyebrow', 'eyebrow', E), ('pdp2.inside_heading', 'heading', 'Heading'),
                       ('pdp2.glossary', 'link_label', 'Link text', 'text', 'Built-in: “Ingredient glossary”. The link goes to the Ingredients page.')])
apply('pdp-howto', [('pdp2.how_eyebrow', 'eyebrow', E), ('pdp2.how_heading', 'heading', 'Heading'),
                    ('pdp2.pair_eyebrow', 'pair_label', 'Small line above the “pairs well with” product')])
apply('product-routine', [('product.routine.eyebrow', 'eyebrow', E), ('product.routine.heading', 'heading', 'Heading')],
      relabel={'collection': ('Products shown',)})
apply('set-ingredients', [('set2.ing_eyebrow', 'eyebrow', E), ('set2.ing_heading', 'heading', 'Heading'),
                          ('set2.ing_all', 'link_label', 'Link text', 'text', 'Built-in: link to the full ingredient list.')])
apply('set-compare', [('set2.cmp_eyebrow', 'eyebrow', E), ('set2.cmp_heading', 'heading', 'Heading'),
                      ('sections.bundles.see_all', 'link_label', 'Link text', 'text', 'Built-in: “See all sets”.')])
apply('pdp-reviews-v2', [('reviews.eyebrow', 'eyebrow', E), ('reviews.heading', 'heading', 'Heading')])
