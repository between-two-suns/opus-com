import sys, os; sys.path.insert(0, os.path.dirname(__file__)); from editable import apply, INFO
apply('bundles-feature', [
  ('sections.bundles_feature.eyebrow', 'eyebrow', 'Small line above the heading'),
  ('sections.bundles_feature.cta', 'link_label', 'Link text', 'text', 'Built-in: “Shop the sets”. The link goes to the Sets page.'),
], relabel={'heading': ('Heading', INFO), 'text': ('Paragraph', INFO), 'hero': ('Big set card',), 'mate': ('Second set card',), 'mate_image': ('Second card photo',)})
apply('creators-reel', [
  ('creators_reel.eyebrow', 'eyebrow', 'Small line above the heading'),
  ('creators_reel.heading', 'heading', 'Heading'),
  ('creators_reel.join', 'link_label', 'Link text', 'text', 'Built-in: “Become a creator”. The link goes to the Creators page.'),
])
apply('climate-switch', [
  ('sections.climate.link', 'link_label', 'Link text', 'text', 'Shown only when a link is set below. '+INFO),
  (None, 'line_sun', 'Line for Sun', 'text'), (None, 'line_city', 'Line for City', 'text'),
  (None, 'line_humidity', 'Line for Humidity', 'text'), (None, 'line_ac', 'Line for AC', 'text'),
  (None, 'line_heat', 'Line for Heat', 'text'),
], relabel={'eyebrow': ('Small line above the heading', INFO), 'heading': ('Heading', INFO), 'link': ('Link', 'Where the link under the lines goes (e.g. the Climate page).'), 'collection': ('Products shown',), 'photo_prefix': ('Photo name start', 'Advanced: the file-name start of the climate photos in Files. Leave as it is.')})
apply('ingredient-heroes', [
  ('sections.ingredient_heroes.link', 'link_label', 'Link text', 'text', 'Built-in: “Explore the ingredients”. The link goes to the Ingredients page.'),
], relabel={'eyebrow': ('Small line above the heading', INFO), 'heading': ('Heading', INFO), 'collection': ('Products shown',)})
apply('editorial-band', [
  ('sections.editorial_band.cta', 'link_label', 'Button text', 'text', 'Built-in: “Get to know us”.'),
], relabel={'eyebrow': ('Small line above the heading', INFO), 'heading': ('Heading', INFO), 'text': ('Paragraph', INFO), 'link': ('Button link', 'Empty: the About page.'), 'image': ('Photo (laptop)',), 'image_mobile': ('Photo (phone)', 'Empty: uses the laptop photo.')})
apply('day-line', [
  (None, 'line_1', 'Line under step 1 (cleanser)', 'text'), (None, 'line_2', 'Line under step 2 (serum)', 'text'),
  (None, 'line_3', 'Line under step 3 (moisturizer)', 'text'), (None, 'line_4', 'Line under step 4 (sunscreen)', 'text'),
], relabel={'eyebrow': ('Small line above the heading', INFO), 'heading': ('Heading', INFO), 'collection': ('Products shown',), 'show_bundle': ('Show “add the full routine” box',)})
apply('faq', [
  ('faq.eyebrow', 'eyebrow', 'Small line above the heading'),
  ('faq.help_title', 'help_title', 'Help box: title'),
  ('faq.help_text', 'help_text', 'Help box: text', 'textarea'),
  ('pages.faq.contact_cta', 'contact_label', 'Contact button text', 'text', 'Built-in: “Contact us”.'),
], relabel={'heading': ('Heading', INFO), 'compact': ('Short version (home page)',), 'show_contact': ('Show the contact button',), 'schema': ('Tell Google these are FAQs',), 'hub': ('Full FAQ page layout (search + topics)',)})
