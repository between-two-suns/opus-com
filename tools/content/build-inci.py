#!/usr/bin/env python3
"""Build content/inci.json: one entry per INCI name printed on the four packs.

INCI names and product membership come from content/products.json (Figma v5
FINAL labels). Function groups follow the EU CosIng function categories.
Descriptions are bts-draft web copy: they say what an ingredient does in the
formula, never what the product does to skin. They need brand + native-Arabic +
regulatory review like every other bts-draft line.

Usage: python3 tools/content/build-inci.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
products = json.loads((ROOT / "content/products.json").read_text())

# group ids -> theme locale keys pages.ingredients.groups.<id>
GROUPS = [
    "solvent", "cleansing", "humectant", "emollient", "emulsifier", "thickener",
    "conditioning", "lipid", "uv_filter", "antioxidant", "preservative",
    "chelating", "ph", "texture", "extract",
]

# inci: (group, name_en, name_ar, desc_en, desc_ar, key_ingredient_handle)
D = {
    "Allantoin": ("conditioning", "Allantoin", "ألانتوين",
        "Skin-conditioning ingredient commonly used in soothing formulas.",
        "مكوّن مكيّف للبشرة يُستخدم عادةً في التركيبات المهدّئة.", None),
    "Aloe Barbadensis Leaf Extract": ("extract", "Aloe vera leaf extract", "مستخلص أوراق الصبار",
        "Extract of aloe vera leaf, used for skin conditioning.",
        "مستخلص من أوراق نبات الصبار، يُستخدم لتكييف البشرة.", None),
    "Ammonium Acryloyldimethyltaurate/VP Copolymer": ("thickener", "Texture polymer", "بوليمر القوام",
        "Polymer that gives the formula its texture and keeps it stable.",
        "بوليمر يمنح التركيبة قوامها ويحافظ على ثباتها.", None),
    "Anhydroxylitol": ("humectant", "Anhydroxylitol", "أنهيدروكسيليتول",
        "Sugar-derived humectant (from xylitol) that attracts water.",
        "مادة مرطّبة مشتقة من السكر (من الزيليتول) تجذب الماء.", None),
    "Aqua": ("solvent", "Water", "ماء",
        "The base of the formula that the other ingredients dissolve in.",
        "أساس التركيبة الذي تذوب فيه بقية المكونات.", None),
    "Bis-Ethylhexyloxyphenol Methoxyphenyl Triazine": ("uv_filter", "Bemotrizinol", "بيموتريزينول",
        "Broad-spectrum UV filter that absorbs both UVA and UVB.",
        "فلتر واسع الطيف يمتص الأشعة فوق البنفسجية من النوعين UVA وUVB.", "uv-filters"),
    "Bis-PEG/PPG-16/16 PEG/PPG-16/16 Dimethicone": ("emulsifier", "Silicone emulsifier", "مستحلِب سيليكوني",
        "Silicone emulsifier that keeps the oil and water phases mixed.",
        "مستحلِب سيليكوني يحافظ على امتزاج طوري الزيت والماء.", None),
    "Bisabolol": ("conditioning", "Bisabolol", "بيسابولول",
        None, None, "bisabolol"),
    "C12-15 Alkyl Benzoate": ("emollient", "C12-15 alkyl benzoate", "ألكيل بنزوات C12-15",
        "Light emollient that helps UV filters spread evenly.",
        "مادة مليّنة خفيفة تساعد فلاتر الأشعة على الانتشار بالتساوي.", None),
    "Caprylic/Capric Triglyceride": ("emollient", "Caprylic/capric triglyceride", "دهون ثلاثية كابريليك/كابريك",
        "Light emollient made from fatty acids and glycerin.",
        "مادة مليّنة خفيفة مصنوعة من أحماض دهنية وجلسرين.", None),
    "Caprylyl Methicone": ("emollient", "Caprylyl methicone", "كابريليل ميثيكون",
        "Light silicone that gives a smooth, non-greasy feel.",
        "سيليكون خفيف يمنح ملمسًا ناعمًا غير دهني.", None),
    "Carbomer": ("thickener", "Carbomer", "كاربومر",
        "Gelling agent that gives the cream its body.",
        "عامل تهلّم يمنح الكريم قوامه.", None),
    "Centella Asiatica Extract": ("extract", "Centella (gotu kola) extract", "مستخلص السنتيلا",
        None, None, "centella-asiatica"),
    "Ceramide AP": ("lipid", "Ceramide AP", "سيراميد AP",
        "One of the lipids naturally found in the skin’s outer layer.",
        "أحد الدهون الموجودة طبيعيًا في الطبقة الخارجية من البشرة.", "ceramides"),
    "Ceramide EOP": ("lipid", "Ceramide EOP", "سيراميد EOP",
        "One of the lipids naturally found in the skin’s outer layer.",
        "أحد الدهون الموجودة طبيعيًا في الطبقة الخارجية من البشرة.", "ceramides"),
    "Ceramide NP": ("lipid", "Ceramide NP", "سيراميد NP",
        "One of the lipids naturally found in the skin’s outer layer.",
        "أحد الدهون الموجودة طبيعيًا في الطبقة الخارجية من البشرة.", "ceramides"),
    "Cetearyl Alcohol": ("emollient", "Cetearyl alcohol", "كحول سيتيريل",
        "Fatty alcohol (not a drying alcohol) that softens and stabilises the cream.",
        "كحول دهني (وليس كحولًا مجففًا) يليّن الكريم ويثبّته.", None),
    "Cholesterol": ("lipid", "Cholesterol", "كوليسترول",
        "Lipid naturally present in the skin’s outer layer, used alongside ceramides.",
        "دهن موجود طبيعيًا في الطبقة الخارجية من البشرة، يُستخدم إلى جانب السيراميدات.", None),
    "Citric Acid": ("ph", "Citric acid", "حمض الستريك",
        "Adjusts the formula’s pH.",
        "يضبط درجة حموضة التركيبة.", None),
    "Cocamidopropyl Betaine": ("cleansing", "Cocamidopropyl betaine", "كوكاميدوبروبيل بيتاين",
        "Coconut-derived surfactant that cleanses and boosts foam.",
        "مادة منظّفة مشتقة من جوز الهند تنظّف وتعزّز الرغوة.", None),
    "Coco-Glucoside": ("cleansing", "Coco-glucoside", "كوكو غلوكوسيد",
        "Surfactant made from coconut fatty alcohol and sugar.",
        "مادة منظّفة مصنوعة من كحول جوز الهند الدهني والسكر.", None),
    "Dimethicone": ("emollient", "Dimethicone", "ديميثيكون",
        "Silicone that gives a smooth, silky feel.",
        "سيليكون يمنح ملمسًا ناعمًا حريريًا.", None),
    "Disodium EDTA": ("chelating", "Disodium EDTA", "ثنائي صوديوم EDTA",
        "Binds trace metals in water to keep the formula stable.",
        "يرتبط بالمعادن الدقيقة في الماء للحفاظ على ثبات التركيبة.", None),
    "Sodium Lauryl Sulfosuccinate": ("cleansing", "Sodium lauryl sulfosuccinate", "صوديوم لوريل سلفوسكسينات",
        "Surfactant that lifts away oil and dirt.",
        "مادة منظّفة تزيل الدهون والأوساخ.", None),
    "EDTA": ("chelating", "EDTA", "EDTA",
        "Binds trace metals in water to keep the formula stable.",
        "يرتبط بالمعادن الدقيقة في الماء للحفاظ على ثبات التركيبة.", None),
    "Ethylhexyl Methoxycinnamate": ("uv_filter", "Octinoxate", "أوكتينوكسات",
        "UV filter that absorbs UVB.",
        "فلتر يمتص الأشعة فوق البنفسجية من النوع UVB.", "uv-filters"),
    "Ethylhexyl Salicylate": ("uv_filter", "Octisalate", "أوكتيسالات",
        "UV filter that absorbs UVB.",
        "فلتر يمتص الأشعة فوق البنفسجية من النوع UVB.", "uv-filters"),
    "Ethylhexylglycerin": ("conditioning", "Ethylhexylglycerin", "إيثيل هكسيل جلسرين",
        "Skin-conditioning agent that also supports the preservative system.",
        "عامل مكيّف للبشرة يدعم أيضًا نظام الحفظ في التركيبة.", None),
    "Glycerin": ("humectant", "Glycerin", "جلسرين",
        "Humectant that draws water into the skin’s surface.",
        "مادة مرطّبة تجذب الماء إلى سطح البشرة.", None),
    "Glyceryl Stearate": ("emulsifier", "Glyceryl stearate", "جليسريل ستيارات",
        "Emulsifier that blends oil and water into a cream.",
        "مستحلِب يمزج الزيت والماء في قوام كريمي.", None),
    "Glycyrrhiza Glabra Root Extract": ("extract", "Licorice root extract", "مستخلص جذر العرقسوس",
        "Extract of licorice root, used for skin conditioning.",
        "مستخلص من جذر العرقسوس، يُستخدم لتكييف البشرة.", None),
    "Isohexadecane": ("emollient", "Isohexadecane", "إيزوهكساديكان",
        "Light, fast-spreading emollient.",
        "مادة مليّنة خفيفة سريعة الانتشار.", None),
    "Lauryl Glucoside": ("cleansing", "Lauryl glucoside", "لوريل غلوكوسيد",
        "Sugar-based surfactant.",
        "مادة منظّفة أساسها السكر.", None),
    "Methyl Methacrylate Crosspolymer": ("texture", "Methyl methacrylate crosspolymer", "بوليمر ميثيل ميثاكريلات المتشابك",
        "Fine spherical powder that gives a smooth, soft-matte finish.",
        "مسحوق كروي ناعم يمنح لمسة نهائية ناعمة غير لامعة.", None),
    "Niacinamide": ("conditioning", "Niacinamide (vitamin B3)", "نياسيناميد (فيتامين B3)",
        None, None, "niacinamide"),
    "Panthenol": ("humectant", "Panthenol (pro-vitamin B5)", "بانثينول (بروفيتامين B5)",
        None, None, "panthenol"),
    "PEG-100 Stearate": ("emulsifier", "PEG-100 stearate", "PEG-100 ستيارات",
        "Emulsifier that blends oil and water into a cream.",
        "مستحلِب يمزج الزيت والماء في قوام كريمي.", None),
    "PEG-120 Methyl Glucose Dioleate": ("thickener", "PEG-120 methyl glucose dioleate", "PEG-120 ميثيل غلوكوز ديوليات",
        "Thickens the cleanser into a gel.",
        "يكثّف الغسول ليصبح جلًا.", None),
    "PEG-7 Glyceryl Cocoate": ("emollient", "PEG-7 glyceryl cocoate", "PEG-7 جليسريل كوكوات",
        "Coconut-derived emollient used in cleansers.",
        "مادة مليّنة مشتقة من جوز الهند تُستخدم في الغسولات.", None),
    "Phenoxyethanol": ("preservative", "Phenoxyethanol", "فينوكسي إيثانول",
        "Preservative that keeps the formula free from microbial growth.",
        "مادة حافظة تحمي التركيبة من نمو الميكروبات.", None),
    "Phytosphingosine": ("lipid", "Phytosphingosine", "فيتوسفينغوسين",
        "Lipid building block related to ceramides.",
        "وحدة بناء دهنية مرتبطة بالسيراميدات.", None),
    "Poloxamer 184": ("cleansing", "Poloxamer 184", "بولوكسامر 184",
        "Surfactant that helps dissolve other ingredients into the cleanser.",
        "مادة خافضة للتوتر السطحي تساعد على إذابة المكونات الأخرى في الغسول.", None),
    "Polyquaternium-10": ("conditioning", "Polyquaternium-10", "بوليكواتيرنيوم-10",
        "Conditioning polymer that leaves a soft feel after rinsing.",
        "بوليمر مكيّف يترك ملمسًا ناعمًا بعد الشطف.", None),
    "Propylene Glycol": ("humectant", "Propylene glycol", "بروبيلين غليكول",
        "Humectant and solvent that helps other ingredients dissolve.",
        "مادة مرطّبة ومذيبة تساعد على إذابة المكونات الأخرى.", None),
    "Sodium Hyaluronate": ("humectant", "Sodium hyaluronate (hyaluronic acid)", "هيالورونات الصوديوم (هيالورونيك أسيد)",
        None, None, "sodium-hyaluronate"),
    "Sodium Lauroyl Lactylate": ("emulsifier", "Sodium lauroyl lactylate", "صوديوم لورويل لاكتيلات",
        "Emulsifier that helps disperse the ceramides in the cream.",
        "مستحلِب يساعد على توزيع السيراميدات في الكريم.", None),
    "Sodium PCA": ("humectant", "Sodium PCA", "صوديوم PCA",
        "Humectant; a component of skin’s natural moisturizing factor.",
        "مادة مرطّبة، وأحد مكونات عامل الترطيب الطبيعي في البشرة.", None),
    "Squalane": ("emollient", "Squalane", "سكوالان",
        "Stable form of squalene, a lipid found in skin’s own oils.",
        "شكل ثابت من السكوالين، وهو دهن موجود في زيوت البشرة الطبيعية.", None),
    "Tocopheryl Acetate": ("antioxidant", "Vitamin E acetate", "أسيتات فيتامين E",
        "Antioxidant that helps protect the formula from oxidation.",
        "مضاد للأكسدة يساعد على حماية التركيبة من التأكسد.", None),
    "Tranexamic Acid": ("conditioning", "Tranexamic acid", "ترانيكساميك أسيد",
        None, None, "tranexamic-acid"),
    "Triethanolamine": ("ph", "Triethanolamine", "ثلاثي إيثانول أمين",
        "Adjusts the formula’s pH.",
        "يضبط درجة حموضة التركيبة.", None),
    "Xanthan Gum": ("thickener", "Xanthan gum", "صمغ الزانثان",
        "Gum made by fermentation that thickens and stabilises.",
        "صمغ يُنتج بالتخمير يكثّف التركيبة ويثبّتها.", None),
    "Xylitol": ("humectant", "Xylitol", "زيليتول",
        "Sugar alcohol used as a humectant.",
        "كحول سكري يُستخدم كمادة مرطّبة.", None),
    "Xylitylglucoside": ("humectant", "Xylitylglucoside", "زيليتيل غلوكوسيد",
        "Sugar-derived humectant (from xylitol and glucose).",
        "مادة مرطّبة مشتقة من السكر (من الزيليتول والغلوكوز).", None),
    "Zinc PCA": ("conditioning", "Zinc PCA", "زنك PCA",
        None, None, "zinc-pca"),
}


def handleize(s):
    """Same result as Shopify's `handleize` for these names."""
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")


key_by_id = {i["id"]: i for i in products["ingredients"]}
membership = {}
for p in products["products"]:
    for name in p["inci"].rstrip(".").split(", "):
        membership.setdefault(name.strip(), []).append(p["handle"])

missing = set(membership) - set(D)
extra = set(D) - set(membership)
assert not missing and not extra, (missing, extra)

out = []
for inci in sorted(membership, key=str.lower):
    group, name_en, name_ar, desc_en, desc_ar, key = D[inci]
    assert group in GROUPS, group
    if desc_en is None:  # single-INCI key ingredients reuse their reviewed role text
        desc_en, desc_ar = key_by_id[key]["role"]["en"], key_by_id[key]["role"]["ar"]
    out.append({
        "handle": handleize(inci),
        "inci": inci,
        "name": {"en": name_en, "ar": name_ar},
        "group": group,
        "description": {"en": desc_en, "ar": desc_ar},
        "products": membership[inci],
        "key_ingredient": key,
    })

assert len({e["handle"] for e in out}) == len(out)
doc = {
    "_meta": {
        "source": "INCI names and membership: content/products.json (Figma v5 FINAL labels). Groups: EU CosIng function categories.",
        "status": "bts-draft descriptions (functional, no efficacy claims): need brand, native-Arabic and regulatory review.",
        "count": len(out),
    },
    "groups": GROUPS,
    "entries": out,
}
(ROOT / "content/inci.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n")
print(f"{len(out)} INCI entries written")
