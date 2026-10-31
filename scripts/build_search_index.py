#!/usr/bin/env python3
"""Build the site search index: design/assets/search/{en,zh,fr,es,ru}.json.

Run from anywhere:   python3 design/scripts/build_search_index.py
Options:             --routes auto|hash|path   how tool results are linked (default auto)
                     --check                   write nothing; exit 1 when a file on disk differs
                     --chronic PATH            another published chronic dataset.json
                     --graph PATH              another evidence_graph.json (tests)
                     --out DIR                 write the five files elsewhere (tests)

The pages (assets/search.js) fetch the file of the page language on the first
focus of the search box and rank it in the browser. Nothing here runs on the
site: the GitHub Action rebuilds pages from design/ alone, so this script is
run locally and its output is committed (like scripts/build_work_data.py).

Sources (all read-only)
  data/evidence_graph.json        185 exposures (id, name, name_i18n, group, aliases, slug if
                                  present), 68 cancers, links, meta.evaluated (874 agents)
  data/cancer_aliases.json        cancer aliases from Batch 4 (any of the shapes read_cancer_aliases takes)
  chronic dataset.json            124 risks, 45 diseases (names, aliases, counted link counts)
  app/chronic_template.html NAMES chronic names in fr, es, ru (read through tools/ui_strings.mjs)
  app/app_template.html LANGS     the tool's short volume labels ("Vol. 116", "Suppl. 7")
  design/i18n/<lang>.json         names of the site pages, labels, tool names
  design/*.html                   anchors of the site entries are checked in the built pages

One file per language. Layout:

  {"v": 1, "routes": "hash" | "path", "meta": {...},
   "items": [[type, id, name, aliases, group, extra], ...]}

  type  e  exposure of the cancer tool    id = slug (path routes) or exposure id (hash routes)
        c  cancer of the cancer tool      id = slug or cancer id
        v  agent IARC evaluated without naming a cancer site (names stay English)  id = ""
        r  risk factor of the chronic tool    id = risk id
        d  disease of the chronic tool        id = disease id
        s  page on this site                  id = root-relative URL in this language
  name     the name in the page language (English for v)
  aliases  extra search words: English aliases (every language), the English name (other
           languages), local everyday words (LOCAL below), Chinese aliases in zh. A word that
           starts with "=" is another name of the thing (the English name, a translated name)
           and is ranked like the name. A word that starts with "~" is a group word (d: the
           body system in the page language and in English, and SYSTEM_WORDS): search.js
           ranks it below every name and alias, so "cardiovascular" or "cvd" lists the
           diseases of that system, the one with most links first
  group    e, v: IARC group ("1", "2A", "2B", "3"); c: organ group; r: category; d: body
           system; s: the page the entry lives on (reading ideas), else ""
  extra    e, c, r, d: number of links (counted links for the chronic tool);
           v: [volume text, year] already formatted ("Vol. 116", "Suppl. 7");
           s: 1 when the page leads on an exact match of its words (see SITE), else 0

Routes. With a "slug" on every exposure and cancer of the graph (Batch 5) the index
links /cancer/e/<slug>, /cancer/c/<slug>, /chronic/d/<id>, /chronic/r/<id> and writes
"routes": "path"; without slugs it writes "routes": "hash" and search.js links
/cancer/?lang=xx#exposure=<id> (and #cancer=, #risk=, #disease=). Run the script again
after Batch 5 publishes; --routes forces either form.

Fallback alias tables (CANCER_ALIAS_FALLBACK, DISEASE_ALIAS_FALLBACK) cover a cancer or
disease only while the data has no aliases for it (Batch 4 adds them to both). Once the
published data carries aliases the fallback is ignored, and the run says how many entries
still use it.
"""
import argparse
import gzip
import json
import os
import re
import subprocess
import sys
import tempfile
import unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))          # design/scripts
DESIGN = os.path.dirname(HERE)                             # design
ROOT = os.path.dirname(DESIGN)                             # IARC_monograph
OUT_DIR = os.path.join(DESIGN, "assets", "search")
I18N = os.path.join(DESIGN, "i18n")

GRAPH = os.path.join(ROOT, "data", "evidence_graph.json")
CANCER_ALIASES = os.path.join(ROOT, "data", "cancer_aliases.json")
CHRONIC_DATASET = os.path.expanduser(
    "~/Documents/GitHub/chronic-disease-evidence-explorer/data/dataset.json")
CHRONIC_TEMPLATE = os.path.join(ROOT, "app", "chronic_template.html")
CANCER_TEMPLATE = os.path.join(ROOT, "app", "app_template.html")
UI_STRINGS = os.path.join(ROOT, "tools", "ui_strings.mjs")

LANGS = ["en", "zh", "fr", "es", "ru"]
EXPECT = {"exposures": 185, "cancers": 68, "evaluated": 874, "risks": 124, "diseases": 45}
GROUPS = ("1", "2A", "2B", "3")

# --------------------------------------------------------------------------
# text helpers
# --------------------------------------------------------------------------


def norm(s):
    """Same folding as assets/search.js, used to drop duplicate aliases."""
    s = unicodedata.normalize("NFD", str(s).lower().replace("ё", "е"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("œ", "oe").replace("æ", "ae").replace("’", "'")


def words(*lists):
    """Flatten alias lists, trim, drop empties."""
    out = []
    for lst in lists:
        for a in lst or []:
            a = " ".join(str(a).split())
            if a:
                out.append(a)
    return out


MARKS = {"=": 2, "~": 0}          # strength of a marked word; a plain alias is 1


def clean_aliases(name, *lists):
    """Aliases without duplicates and without the name itself, in first-seen order.

    An alias that starts with "=" is another name of the same thing (the English name
    on a page in another language, a translated name): search.js ranks it like the
    name, and ranks a plain alias lower. One that starts with "~" is a group word,
    ranked below a plain alias. Of two spellings of the same word the stronger is
    kept ("=" before plain before "~")."""
    flat = words(*lists)

    def key(a):
        return norm(a[1:] if a[:1] in MARKS else a)

    best = {}
    for a in flat:
        k = key(a)
        if k and (k not in best or MARKS.get(a[:1], 1) > MARKS.get(best[k][:1], 1)):
            best[k] = a
    seen, out = {norm(name)}, []
    for a in flat:
        k = key(a)
        if k and k not in seen:
            seen.add(k)
            out.append(best[k])
    return out


def alt(name, lang):
    """The English name as an alternative name on a page in another language."""
    return ["=" + name] if lang != "en" else []


def ui_extract(template, name):
    """tools/ui_strings.mjs extract <template> <NAME> -> dict (the only sanctioned reader)."""
    with tempfile.TemporaryDirectory() as td:
        out = os.path.join(td, "x.json")
        r = subprocess.run(["node", UI_STRINGS, "extract", template, name, out],
                           capture_output=True, text=True)
        if r.returncode:
            raise SystemExit("ui_strings.mjs extract %s %s failed:\n%s" % (template, name, r.stderr))
        with open(out, encoding="utf-8") as fh:
            return json.load(fh)


def load_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def read_cancer_aliases(path):
    """{cancer id: {"en": [...], "zh": [...]}} from data/cancer_aliases.json.

    Batch 4 writes the file; its exact shape is not fixed, so these are read:
      {"Colon": ["bowel", ...]}                                   id -> list
      {"Colon": {"aliases": [...], "aliases_zh": [...]}}           id -> object
      {"aliases": {"Colon": [...]}, "aliases_zh": {"Colon": [...]}} two maps
      {"_meta": {...}, "cancers": <any of the above>}              wrapped (Batch 4 as drafted)
      [{"id": "Colon", "aliases": [...], "aliases_zh": [...]}]     list of objects
    Keys that start with "_" are notes."""
    if not os.path.exists(path):
        return {}
    raw = load_json(path)
    if isinstance(raw, dict) and isinstance(raw.get("cancers"), (dict, list)):
        raw = raw["cancers"]                      # {"_meta": ..., "cancers": {...}}
    out = {}

    def put(cid, en, zh):
        slot = out.setdefault(cid, {"en": [], "zh": []})
        slot["en"] += [a for a in (en or []) if isinstance(a, str)]
        slot["zh"] += [a for a in (zh or []) if isinstance(a, str)]

    if isinstance(raw, list):
        for o in raw:
            put(o.get("id"), o.get("aliases"), o.get("aliases_zh"))
    elif isinstance(raw.get("aliases"), dict):
        for cid, lst in raw["aliases"].items():
            put(cid, lst, (raw.get("aliases_zh") or {}).get(cid))
    else:
        for cid, val in raw.items():
            if cid.startswith("_"):
                continue
            if isinstance(val, list):
                put(cid, val, None)
            elif isinstance(val, dict):
                put(cid, val.get("aliases"), val.get("aliases_zh"))
    return out

# --------------------------------------------------------------------------
# alias tables
# --------------------------------------------------------------------------
# Strings are written "a|b|c" to keep the tables short; A() splits them.


def A(s):
    return [x for x in s.split("|") if x]


# Used only for a cancer the data (graph, data/cancer_aliases.json) has no aliases for.
# The plan's Batch 4 writes the real list for all 68 cancers; then this table is idle.
CANCER_ALIAS_FALLBACK = {k: A(v) for k, v in {
    "Acute lymphocytic leukaemia": "acute lymphoblastic leukaemia|acute lymphoblastic leukemia|acute lymphocytic leukemia|leukemia|blood cancer",
    "Acute myeloid leukaemia": "acute myeloid leukemia|acute myelogenous leukaemia|aml|leukemia|blood cancer",
    "Adult T-cell leukaemia/lymphoma": "adult t-cell leukemia|htlv-1|atl|leukemia|lymphoma|blood cancer",
    "All cancer sites (combined)": "all cancers|any cancer|every cancer|cancer overall|total cancer",
    "Anus": "anal|anal cancer|anus cancer",
    "Bile duct": "bile duct cancer|biliary|biliary tract|cholangiocarcinoma",
    "Bone": "bones|bone cancer|osteosarcoma",
    "Brain & central nervous system": "brain|brain tumour|brain tumor|glioma|central nervous system|cns|spinal cord",
    "Breast": "breasts|breast cancer|mammary",
    "Childhood acute lymphoblastic leukaemia": "childhood leukemia|children|paediatric|pediatric|kids|leukemia|blood cancer",
    "Childhood acute myeloid leukaemia": "childhood leukemia|children|paediatric|pediatric|kids|leukemia|blood cancer",
    "Childhood leukaemia (all combined)": "childhood leukemia|children|paediatric|pediatric|kids|leukemia|blood cancer",
    "Chronic lymphocytic leukaemia": "chronic lymphocytic leukemia|cll|leukemia|blood cancer",
    "Chronic myeloid leukaemia": "chronic myeloid leukemia|chronic myelogenous leukaemia|cml|leukemia|blood cancer",
    "Colon": "bowel|bowel cancer|colorectal|colorectal cancer|colon and rectum|large bowel|large intestine|intestine",
    "Digestive tract (unspecified)": "gut|digestive|gastrointestinal|gi tract",
    "Endometrium": "womb|womb cancer|uterus|uterine|uterine cancer|endometrial",
    "Endothelium (Kaposi sarcoma)": "kaposi|kaposi sarcoma|hhv-8",
    "Eye": "eyes|eye cancer|ocular|retinoblastoma|uveal melanoma",
    "Gall bladder": "gallbladder|gall-bladder|gallbladder cancer",
    "Hodgkin lymphoma": "hodgkin|hodgkin disease|lymphoma",
    "Kidney": "kidneys|kidney cancer|renal|renal cell|renal cell carcinoma",
    "Larynx": "voice box|voicebox|laryngeal|larynx cancer|vocal cords",
    "Leukaemia (all combined)": "leukemia|leukaemias|blood cancer",
    "Lip": "lips|lip cancer",
    "Liver": "liver cancer|hepatic|hepatocellular|hcc|hepatoma",
    "Liver (childhood, hepatoblastoma)": "hepatoblastoma|childhood liver cancer|paediatric|pediatric|children|kids",
    "Lung": "lungs|lung cancer|pulmonary|bronchus|bronchial|airways",
    "Lymphoepithelioma-like carcinoma": "lelc|lymphoepithelioma",
    "Lymphoma (all combined)": "lymphomas|lymph|lymph nodes|lymph glands|blood cancer",
    "Mesothelium (pleura, peritoneum)": "mesothelioma|pleura|pleural|peritoneum|peritoneal",
    "Multicentric Castleman disease": "castleman|castleman disease|kshv|hhv-8",
    "Multiple myeloma": "myeloma|plasma cell|bone marrow cancer|blood cancer",
    "Multiple sites (unspecified)": "several cancers|multiple cancers|any site|unspecified",
    "Myelodysplastic syndrome": "mds|myelodysplasia|preleukaemia|bone marrow",
    "NHL - Burkitt lymphoma": "burkitt|non-hodgkin lymphoma|nhl|lymphoma",
    "NHL - MALT gastric lymphoma": "malt lymphoma|gastric lymphoma|stomach lymphoma|non-hodgkin lymphoma|nhl|lymphoma",
    "NHL - extranodal NK/T-cell (nasal type)": "nk/t-cell lymphoma|nasal lymphoma|non-hodgkin lymphoma|nhl|lymphoma",
    "NHL - immunosuppression-related (incl. PTLD)": "ptld|post-transplant lymphoma|transplant|immunosuppression|non-hodgkin lymphoma|nhl|lymphoma",
    "NHL - positive for t(14;18)": "follicular lymphoma|follicular|t(14;18)|non-hodgkin lymphoma|nhl|lymphoma",
    "Nasal cavity & paranasal sinus": "nose|nasal|nasal cancer|sinus|sinuses|paranasal|sinonasal",
    "Nasopharynx": "nasopharyngeal|nasopharynx cancer|npc|upper throat",
    "Non-Hodgkin lymphoma (all combined)": "nhl|non hodgkin|non-hodgkin's lymphoma|lymphoma|blood cancer",
    "Oesophagus": "esophagus|esophageal|oesophageal|esophageal cancer|gullet|food pipe",
    "Oral cavity": "mouth|mouth cancer|oral|oral cancer|tongue|gum|gums|cheek",
    "Oropharynx": "oropharyngeal|mid-throat|throat|tonsils|base of tongue",
    "Other acute non-lymphocytic leukaemia": "anll|acute non-lymphocytic leukemia|leukemia|blood cancer",
    "Ovary": "ovaries|ovarian|ovarian cancer",
    "Pancreas": "pancreatic|pancreatic cancer|pancreas cancer",
    "Penis": "penile|penile cancer",
    "Pharynx (all combined)": "throat|throat cancer|pharyngeal|pharynx cancer",
    "Primary effusion lymphoma": "pel|effusion lymphoma|kshv|hhv-8",
    "Prostate": "prostatic|prostate cancer|psa",
    "Rectum": "bowel|bowel cancer|colorectal|colorectal cancer|colon and rectum|large bowel|rectal|rectum cancer",
    "Renal pelvis & ureter": "ureter|kidney pelvis|renal pelvis|upper urinary tract|urothelial",
    "Salivary gland": "salivary|salivary glands|parotid",
    "Skin (melanoma)": "melanoma|malignant melanoma|skin cancer|moles",
    "Skin (non-melanoma)": "non-melanoma|basal cell|basal cell carcinoma|squamous cell|squamous cell carcinoma|skin cancer|bcc|scc",
    "Soft tissue (sarcoma)": "sarcoma|soft tissue|soft-tissue|connective tissue",
    "Stomach": "gastric|gastric cancer|stomach cancer",
    "Testis": "testicular|testicle|testicles|testicular cancer|testes",
    "Thyroid": "thyroid gland|thyroid cancer",
    "Tonsil": "tonsils|tonsil cancer|tonsillar",
    "Upper aerodigestive tract (combined)": "head and neck|head & neck|aerodigestive|upper airway|mouth throat voice box",
    "Urinary bladder": "bladder|bladder cancer|urinary|urothelial",
    "Uterine cervix": "cervix|cervical|cervical cancer|neck of the womb|hpv cancer|smear",
    "Vagina": "vaginal|vaginal cancer",
    "Vulva": "vulval|vulvar|vulval cancer|vulvar cancer",
}.items()}

# Used only for a disease the dataset has no aliases for (Batch 4 adds them to
# corrections.json disease_fields). Each value: (English, Chinese).
DISEASE_ALIAS_FALLBACK = {k: (A(v[0]), A(v[1])) for k, v in {
    "chd": ("heart attack|heart attacks|myocardial infarction|angina|heart disease|coronary|coronary artery disease|ischaemic heart disease|ischemic heart disease|cardiac",
            "心脏病|心肌梗死|心梗|心绞痛|冠状动脉疾病|冠状动脉心脏病|缺血性心脏病"),
    "stroke_isch": ("stroke|ischemic stroke|brain infarct|cerebral infarction|brain attack|cerebrovascular|clot in the brain",
                    "中风|脑卒中|卒中|脑梗|脑梗死|脑血栓|缺血性中风"),
    "stroke_haem": ("stroke|hemorrhagic stroke|brain haemorrhage|brain hemorrhage|brain bleed|cerebral haemorrhage|intracerebral haemorrhage|cerebrovascular",
                    "中风|脑卒中|卒中|脑出血|出血性中风"),
    "heart_failure": ("congestive heart failure|cardiac failure|weak heart|heart disease", "心衰|心功能不全|心脏衰竭"),
    "afib": ("af|a-fib|afib|irregular heartbeat|irregular heart rhythm|palpitations|heart rhythm", "房颤|心房纤颤|心律不齐|心律失常"),
    "pad": ("peripheral arterial disease|poor circulation|claudication|leg arteries|blocked arteries", "外周动脉病|下肢动脉疾病|间歇性跛行"),
    "aaa": ("aortic aneurysm|aneurysm|abdominal aneurysm", "主动脉瘤|动脉瘤"),
    "t2d": ("diabetes|type 2 diabetes|type two diabetes|adult-onset diabetes|high blood sugar|blood sugar", "糖尿病|二型糖尿病|血糖高"),
    "masld": ("nafld|mafld|fatty liver|non-alcoholic fatty liver|fatty liver disease|nash", "脂肪肝|非酒精性脂肪肝|代谢性脂肪肝"),
    "gout": ("uric acid|gouty arthritis|high uric acid", "高尿酸|尿酸"),
    "ckd": ("kidney failure|kidney disease|renal failure|renal disease|chronic renal disease|renal", "肾衰竭|慢性肾病|肾病|肾功能衰竭|尿毒症"),
    "copd": ("emphysema|chronic bronchitis|lung disease|chronic lung disease|chronic obstructive pulmonary disease|smoker's lung",
             "慢阻肺|慢性阻塞性肺病|肺气肿|慢性支气管炎|慢性肺病"),
    "asthma": ("wheeze|wheezing|breathing difficulty", "气喘|哮喘病"),
    "dementia": ("memory loss|alzheimer|alzheimers|senility|cognitive decline|memory problems|forgetfulness",
                 "痴呆|失智|失智症|老年痴呆|阿尔茨海默|记忆力减退|健忘"),
    "alzheimers": ("alzheimer|alzheimer disease|dementia|memory loss", "阿尔兹海默|老年痴呆|痴呆"),
    "parkinsons": ("parkinson|parkinson disease|tremor|shaking", "帕金森|帕金森氏病|震颤"),
    "depression": ("major depression|low mood|depressive disorder|feeling down|mental health", "抑郁|抑郁症|忧郁|忧郁症|情绪低落"),
    "fracture": ("osteoporosis|osteoporotic fracture|hip fracture|broken bone|broken bones|bone fracture|broken hip|brittle bones",
                 "骨折|骨质疏松|髋部骨折|骨质疏松性骨折"),
    "oa_knee": ("osteoarthritis|knee arthritis|arthritis of the knee|knee pain", "骨关节炎|膝关节炎|膝盖痛|关节炎"),
    "ra": ("rheumatoid|inflammatory arthritis|arthritis", "类风湿|类风湿性关节炎|关节炎"),
    "cirrhosis": ("liver scarring|scarred liver|liver failure|liver disease", "肝硬变|肝纤维化|肝病"),
    "ibd": ("crohn|crohn's disease|crohns|ulcerative colitis|colitis|inflammatory bowel|bowel disease", "克罗恩病|溃疡性结肠炎|肠炎|炎性肠病"),
    "amd": ("macular degeneration|age-related macular|amd|vision loss|sight loss", "黄斑变性|老年性黄斑变性|视力下降"),
    "cataract": ("cataracts|cloudy lens|clouded lens|cloudy vision", "晶状体混浊"),
    "hearing_loss": ("deafness|hard of hearing|hearing impairment|hearing problems|going deaf", "耳聋|听力下降|听力损失|失聪"),
    "hypertension": ("high blood pressure|raised blood pressure|bp|hbp|blood pressure", "血压高|血压"),
    "obesity": ("overweight|high bmi|excess weight|weight gain|too heavy", "超重|体重过重|发胖"),
    "vte": ("blood clot|blood clots|clots|dvt|deep vein thrombosis|pulmonary embolism|thrombosis|embolism", "血栓|深静脉血栓|静脉血栓|肺栓塞|血凝块"),
    "aortic_stenosis": ("aortic valve|narrow heart valve|heart valve|valve disease", "主动脉瓣|心脏瓣膜病|瓣膜狭窄"),
    "osa_outcome": ("sleep apnea|sleep apnoea|osa|snoring|stopped breathing in sleep", "睡眠呼吸暂停|打鼾|打呼噜|呼吸暂停"),
    "peptic_ulcer": ("stomach ulcer|duodenal ulcer|gastric ulcer|ulcer|ulcers", "胃溃疡|十二指肠溃疡|溃疡"),
    "diverticular_disease": ("diverticulitis|diverticulosis|diverticula", "憩室炎|结肠憩室"),
    "gallstones": ("gallstone|gall stones|gall bladder stones|gallbladder stones|cholelithiasis", "胆囊结石|胆石症"),
    "multiple_sclerosis": ("ms|disseminated sclerosis", "多发性硬化症"),
    "migraine": ("headache|headaches|bad headache|migraines", "头痛|头疼|偏头疼"),
    "anxiety_disorders": ("anxiety|panic|panic attacks|generalised anxiety|generalized anxiety|gad|worry", "焦虑|焦虑症|惊恐发作|恐慌"),
    "schizophrenia": ("psychosis|psychotic", "精神病|精神疾病|思觉失调"),
    "low_back_pain": ("back pain|chronic low back pain|lower back pain|backache|lumbago|bad back|spine", "腰痛|腰疼|下背痛|背痛|腰背疼"),
    "sarcopenia": ("muscle loss|muscle wasting|weak muscles|frailty", "肌肉流失|肌肉萎缩|肌肉减少|衰弱"),
    "glaucoma": ("eye pressure|high eye pressure|optic nerve", "眼压高|眼压"),
    "diabetic_retinopathy": ("diabetic eye disease|retinopathy|diabetes eye", "视网膜病变|糖尿病眼病"),
    "psoriasis": ("scaly skin|skin plaques|psoriatic", "牛皮癣|银屑病"),
    "atopic_dermatitis": ("eczema|dermatitis|atopic eczema|itchy skin", "湿疹|皮炎|特应性湿疹"),
    "erectile_dysfunction": ("impotence|erection problems|erectile", "阳痿|勃起障碍|勃起功能"),
    "periodontitis_disease": ("gum disease|periodontal|periodontal disease|gingivitis|gum infection", "牙周病|牙龈炎|牙龈病|牙周炎"),
}.items()}

# Group words of a body system of the chronic tool, keyed by the dataset's English
# system name. Every disease carries "~" + its system label (page language, and English
# on the other pages) and these words: English in every language, the others on their
# own page. search.js ranks a group word below every name and alias, so these lift no
# entry above a direct hit: "cardiovascular", "cvd" or "心血管病" list the ten diseases of
# the heart and vessels, Coronary heart disease (most links) first. An English plural
# needs no entry: search.js retries a query without its last two letters
# ("cardiovascular diseases"); the plurals of fr, es and ru change more than that.
# Owner review: the author's judgement, no data source (the WHO fact sheet on
# cardiovascular diseases counts coronary, cerebrovascular and peripheral artery disease,
# deep vein thrombosis and pulmonary embolism among them).
SYSTEM_WORDS = {
    "Cardiovascular": dict(
        en="cardiovascular disease|cvd",
        zh="心血管病|心血管疾病",
        fr="maladie cardiovasculaire|maladies cardiovasculaires|maladies cardio-vasculaires|mcv",
        es="enfermedad cardiovascular|enfermedades cardiovasculares|ecv",
        ru="сердечно-сосудистые заболевания|сердечно-сосудистое заболевание|ссз"),
}

# English abbreviations the data lacks, by English name prefix (exposures and agents).
# English words the data lacks, by (type, id or name); added in every language.
EN_EXTRA = {
    ("e", "Solar radiation"): A("uv|ultraviolet|sunburn|sun exposure|sunshine"),
    ("e", "UV-emitting tanning devices"): A("uv|sunbed|sunbeds|tanning bed|tanning beds|solarium"),
    ("e", "Estrogen-progestogen oral contraceptives"): A("the pill|birth control|contraceptive pill"),
}

EN_RULES = [
    ("Human papillomavirus", ["hpv"]),
    ("Hepatitis B virus", ["hbv", "hep b"]),
    ("Hepatitis C virus", ["hcv", "hep c"]),
    ("Hepatitis D virus", ["hdv", "hep d"]),
    ("Human T-cell lymphotropic virus type 1", ["htlv-1"]),
]


def L(zh="", fr="", es="", ru=""):
    return {"zh": A(zh), "fr": A(fr), "es": A(es), "ru": A(ru)}


# Everyday words in the four other languages, added to the entry of the same
# type and id (type letters as in the index; v is keyed by the agent's name,
# s by the site entry id). Names the tools already carry in a language are not
# repeated. A word that starts with "=" is a translated name of the thing itself. Owner review: this table is the author's judgement and has no data source.
LOCAL = {
    # ---- cancers
    ("c", "Colon"): L("肠癌|大肠癌|结肠直肠癌|结直肠癌|大肠",
                      "intestin|cancer de l’intestin|colorectal|cancer colorectal|gros intestin",
                      "intestino|cáncer de intestino|colorrectal|cáncer colorrectal|intestino grueso",
                      "кишечник|рак кишечника|колоректальный|колоректальный рак|толстая кишка"),
    ("c", "Rectum"): L("肠癌|大肠癌|结肠直肠癌|结直肠癌|大肠",
                       "intestin|cancer de l’intestin|colorectal|cancer colorectal|gros intestin",
                       "intestino|cáncer de intestino|colorrectal|cáncer colorrectal|intestino grueso",
                       "кишечник|рак кишечника|колоректальный|колоректальный рак|прямая кишка"),
    ("c", "Breast"): L("乳房|乳腺", "", "", "грудь|рак груди|молочная железа"),
    ("c", "Endometrium"): L("子宫癌|子宫体癌|子宫",
                            "utérus|cancer de l’utérus|corps de l’utérus",
                            "útero|cáncer de útero|endometrio",
                            "матка|рак матки|эндометрий"),
    ("c", "Brain & central nervous system"): L("脑瘤|脑肿瘤", "tumeur cérébrale|tumeur du cerveau",
                                               "tumor cerebral|tumor del cerebro", "опухоль мозга|опухоль головного мозга"),
    ("c", "Leukaemia (all combined)"): L("血癌|白血病", "cancer du sang|leucémie", "cáncer de la sangre|leucemia",
                                         "рак крови|лейкемия|лейкоз"),
    ("c", "Lymphoma (all combined)"): L("淋巴癌|淋巴瘤", "cancer des ganglions|lymphome", "cáncer de los ganglios|linfoma",
                                        "рак лимфы|лимфома"),
    # ---- exposures
    ("e", "Aspartame"): L("代糖|甜味剂|人工甜味剂|无糖饮料|无糖可乐",
                          "édulcorant|édulcorants|sucrette|soda light|boisson light|sans sucre",
                          "edulcorante|edulcorantes|refresco light|bebida light|sin azúcar|refresco sin azúcar",
                          "подсластитель|подсластители|заменитель сахара|диетическая газировка|без сахара"),
    ("e", "Tobacco smoking"): L("吸烟|抽烟|香烟|烟草|卷烟|雪茄",
                                "tabac|tabagisme|cigarette|cigarettes|fumer|fumeur|cigare",
                                "tabaco|tabaquismo|cigarrillo|cigarrillos|fumar|fumador|cigarro",
                                "табак|курение|сигареты|сигарета|курить|курильщик|сигара"),
    ("e", "Tobacco smoke, secondhand"): L("二手烟|被动吸烟", "tabagisme passif|fumée de tabac ambiante|fumée secondaire",
                                          "humo de segunda mano|tabaquismo pasivo|fumador pasivo",
                                          "пассивное курение|вторичный дым|табачный дым"),
    ("e", "Alcoholic beverages"): L("酒|喝酒|饮酒|酒精|啤酒|葡萄酒|白酒",
                                    "alcool|boissons alcoolisées|vin|bière|spiritueux",
                                    "alcohol|bebidas alcohólicas|vino|cerveza|licor|licores",
                                    "алкоголь|спиртное|алкогольные напитки|пиво|вино|водка"),
    ("e", "Processed meat"): L("加工肉|加工肉类|腊肉|火腿|香肠|培根",
                               "charcuterie|viande transformée|jambon|saucisse|saucisson|bacon|lardons",
                               "embutidos|carne procesada|fiambre|jamón|salchicha|tocino|bacon",
                               "колбаса|колбасы|сосиски|ветчина|бекон|мясные изделия"),
    ("e", "Red meat"): L("红肉|牛肉|猪肉|羊肉|肉类", "viande rouge|bœuf|boeuf|porc|agneau|viande",
                         "carne roja|carne de res|ternera|cerdo|cordero|carne", "красное мясо|говядина|свинина|баранина|мясо"),
    ("e", "Solar radiation"): L("阳光|日晒|晒太阳|紫外线|太阳|晒伤|晒黑",
                                "soleil|rayons du soleil|ensoleillement|coup de soleil|bronzage|uv|ultraviolets",
                                "sol|rayos del sol|luz solar|quemadura solar|bronceado|rayos uv|ultravioleta",
                                "солнце|солнечный свет|загар|солнечный ожог|ультрафиолет|уф"),
    ("e", "UV-emitting tanning devices"): L("日光浴床|美黑|晒黑床|紫外线美黑",
                                            "cabine de bronzage|bronzage artificiel|lampe uv|uv artificiels",
                                            "cabina de bronceado|camas solares|bronceado artificial|solárium",
                                            "солярий|искусственный загар|ультрафиолетовые лампы"),
    ("e", "Outdoor air pollution"): L("空气污染|雾霾|大气污染|尾气",
                                      "pollution de l’air|pollution atmosphérique|smog|particules fines",
                                      "contaminación del aire|polución|contaminación atmosférica|smog|partículas finas",
                                      "загрязнение воздуха|смог|выхлопы|мелкие частицы|загрязнённый воздух"),
    ("e", "Outdoor air pollution, particulate matter"): L("空气污染|雾霾|大气污染|细颗粒物",
                                                          "pollution de l’air|pollution atmosphérique|smog|particules fines",
                                                          "contaminación del aire|polución|contaminación atmosférica|smog|partículas finas",
                                                          "загрязнение воздуха|смог|мелкие частицы|загрязнённый воздух"),
    ("e", "Night shift work"): L("夜班|倒班|轮班|夜间工作", "travail de nuit|travail posté|horaires de nuit|équipe de nuit",
                                 "trabajo nocturno|turno de noche|turnos nocturnos|trabajo por turnos",
                                 "ночные смены|ночная работа|сменная работа|работа по сменам"),
    ("e", "Asbestos (all forms)"): L("", "", "asbesto", ""),
    ("e", "Engine exhaust, diesel"): L("柴油|柴油尾气|柴油机废气", "diesel|gaz d’échappement|échappement diesel|gazole|pot d’échappement",
                                       "diésel|gasóleo|escape diésel|humos del diésel", "дизель|дизельный выхлоп|выхлопные газы"),
    ("e", "Welding fumes"): L("焊接烟尘|电焊", "soudage|fumées de soudage", "soldadura|humos de soldadura", "сварка|сварочный дым"),
    ("e", "Silica dust, crystalline (quartz/cristobalite)"): L("二氧化硅|矽尘|石英粉尘", "silice|poussière de silice|quartz",
                                                              "sílice|polvo de sílice|cuarzo", "кремнезём|кварцевая пыль|кремний"),
    ("e", "Wood dust"): L("木屑|木粉尘", "poussière de bois|sciure", "polvo de madera|serrín|aserrín", "древесная пыль|опилки"),
    ("e", "Helicobacter pylori"): L("幽门螺杆菌|幽门螺旋杆菌|胃细菌", "h. pylori|bactérie de l’estomac",
                                    "h. pylori|bacteria del estómago", "хеликобактер|пилори|бактерия желудка"),
    ("e", "Estrogen-progestogen menopausal therapy"): L("更年期激素治疗|激素替代疗法|hrt", "traitement hormonal substitutif|thm|ths",
                                                        "terapia hormonal sustitutiva|terapia hormonal|thm",
                                                        "заместительная гормональная терапия|гормональная терапия"),
    ("e", "Estrogen-progestogen oral contraceptives"): L("避孕药|口服避孕药", "pilule|pilule contraceptive|contraception orale",
                                                         "píldora|anticonceptivos orales|anticonceptivos|pastillas anticonceptivas",
                                                         "противозачаточные таблетки|оральные контрацептивы|таблетки"),
    ("e", "Frying, high-temperature emissions"): L("油炸|油烟|煎炸", "friture|fumées de cuisson", "fritura|frituras|humo de cocinar",
                                                   "жарка|жарка на масле|дым от жарки"),
    ("e", "Very hot beverages (>65C)"): L("热饮|烫饮|烫茶|热茶", "boissons très chaudes|thé chaud|maté",
                                          "bebidas muy calientes|té caliente|mate", "горячие напитки|горячий чай|мате"),
    ("e", "Pickled vegetables (traditional Asian)"): L("腌菜|咸菜|泡菜", "légumes marinés|légumes au vinaigre",
                                                       "encurtidos|verduras en vinagre", "маринованные овощи|солёные овощи"),
    ("e", "Salted fish, Chinese-style"): L("咸鱼|腌鱼", "poisson salé", "pescado salado", "солёная рыба"),
    ("e", "Talc (perineal use)"): L("滑石粉|爽身粉", "talc|poudre de talc", "talco|polvos de talco", "тальк|тальковая пудра"),
    ("e", "Magnetic fields, extremely low-frequency"): L("电磁场|高压线", "champs magnétiques|lignes à haute tension",
                                                         "campos magnéticos|líneas de alta tensión", "магнитные поля|линии электропередачи"),
    ("e", "Radiofrequency electromagnetic fields (glioma, acoustic neuroma)"): L(
        "手机|手机辐射|基站", "téléphone portable|portable|téléphone mobile|antenne relais|5g",
        "teléfono móvil|celular|móvil|antena|5g", "мобильный телефон|сотовый|телефон|вышка|5g"),
    ("e", "Glyphosate"): L("草甘膦|除草剂", "herbicide|roundup|désherbant", "herbicida|roundup", "гербицид|раундап"),
    ("e", "Betel quid with tobacco"): L("槟榔", "noix de bétel", "nuez de betel", "бетель"),
    ("e", "Betel quid without tobacco"): L("槟榔", "noix de bétel", "nuez de betel", "бетель"),
    ("e", "X- and gamma-radiation"): L("X光|伽马射线|放射线|辐射|CT", "rayons x|radiographie|scanner|radiations|irradiation",
                                       "rayos x|radiografía|tac|radiación", "рентген|рентгеновское излучение|гамма-излучение|радиация|кт"),
    ("e", "Hairdresser or barber (occupational)"): L("理发师|美发师|染发", "coiffeur|coiffeuse|coloration", "peluquero|peluquería|tinte",
                                                    "парикмахер|парикмахерская|краска для волос"),
    # ---- agents IARC evaluated without naming a cancer site (key = English name)
    ("v", "Coffee, drinking"): L("=咖啡|喝咖啡", "=café|boire du café", "=café|tomar café", "=кофе|питьё кофе"),
    ("v", "Caffeine"): L("=咖啡因", "=caféine", "=cafeína", "=кофеин"),
    ("v", "Tea"): L("=茶|喝茶", "=thé", "=té", "=чай"),
    ("v", "Saccharin and its salts"): L("=糖精", "=saccharine|édulcorant", "=sacarina|edulcorante", "=сахарин|подсластитель"),
    ("v", "Cyclamates (sodium cyclamate)"): L("=甜蜜素|环己基氨基磺酸钠", "=cyclamate|édulcorant", "=ciclamato|edulcorante", "=цикламат|подсластитель"),
    ("v", "Hair colouring products (personal use of)"): L("=染发剂|染发", "=teinture pour cheveux|coloration capillaire",
                                                         "=tinte para el pelo|tinte de cabello", "=краска для волос|окрашивание волос"),
    # ---- chronic diseases
    ("d", "chd"): L("", "infarctus|infarctus du myocarde|crise cardiaque|angine de poitrine|cardiopathie ischémique|maladie du cœur|maladie cardiaque|coronaropathie",
                    "infarto|infarto de miocardio|ataque al corazón|angina de pecho|cardiopatía isquémica|enfermedad del corazón|enfermedad cardíaca|coronariopatía",
                    "инфаркт|инфаркт миокарда|сердечный приступ|стенокардия|ишемическая болезнь сердца|ибс|болезнь сердца|коронарная болезнь"),
    ("d", "stroke_isch"): L("", "accident vasculaire cérébral|avc|infarctus cérébral|attaque cérébrale",
                            "ictus|accidente cerebrovascular|acv|derrame cerebral|infarto cerebral|embolia cerebral",
                            "инсульт|ишемический инсульт|мозговой инсульт|нарушение мозгового кровообращения|нмк|удар"),
    ("d", "stroke_haem"): L("", "accident vasculaire cérébral|avc|hémorragie cérébrale|saignement cérébral",
                            "ictus|derrame cerebral|hemorragia cerebral|acv",
                            "инсульт|кровоизлияние в мозг|геморрагический инсульт|внутримозговое кровоизлияние"),
    ("d", "heart_failure"): L("", "insuffisance cardiaque|défaillance cardiaque", "insuficiencia cardíaca|fallo cardíaco",
                              "сердечная недостаточность|хсн"),
    ("d", "afib"): L("", "fibrillation auriculaire|arythmie|rythme cardiaque irrégulier", "fibrilación auricular|arritmia|latido irregular",
                     "мерцательная аритмия|фибрилляция предсердий|аритмия|неровное сердцебиение"),
    ("d", "t2d"): L("", "diabète|diabète de type 2|diabète sucré|sucre dans le sang", "diabetes|diabetes tipo 2|diabetes mellitus|azúcar alta",
                    "диабет|сахарный диабет|диабет 2 типа|высокий сахар"),
    ("d", "hypertension"): L("", "tension|tension artérielle|hypertension artérielle|hta", "hipertensión|presión alta|tensión alta|hta",
                             "гипертония|давление|высокое давление|гипертензия"),
    ("d", "obesity"): L("", "obésité|surpoids|excès de poids", "obesidad|sobrepeso|exceso de peso", "ожирение|лишний вес|избыточный вес"),
    ("d", "dementia"): L("", "démence|alzheimer|perte de mémoire|troubles de la mémoire", "demencia|alzhéimer|pérdida de memoria|olvidos",
                         "деменция|слабоумие|альцгеймер|потеря памяти|проблемы с памятью"),
    ("d", "depression"): L("", "dépression|déprime|humeur dépressive", "depresión|tristeza profunda|ánimo bajo",
                           "депрессия|подавленность|плохое настроение"),
    ("d", "copd"): L("", "bpco|bronchite chronique|emphysème|maladie pulmonaire chronique", "epoc|bronquitis crónica|enfisema|enfermedad pulmonar crónica",
                     "хобл|хронический бронхит|эмфизема|хроническое заболевание лёгких"),
    ("d", "fracture"): L("", "fracture|ostéoporose|fracture de la hanche|os cassé|fracture du col du fémur",
                         "fractura|osteoporosis|fractura de cadera|hueso roto", "перелом|остеопороз|перелом шейки бедра|сломанная кость"),
    ("d", "vte"): L("", "thrombose|phlébite|caillot de sang|embolie pulmonaire|thrombose veineuse",
                    "trombosis|coágulo|coágulo de sangre|embolia pulmonar|trombosis venosa",
                    "тромбоз|тромб|сгусток крови|тромбоэмболия|тромбоз вен"),
    ("d", "ckd"): L("", "insuffisance rénale|maladie rénale|maladie des reins|reins", "insuficiencia renal|enfermedad renal|enfermedad de los riñones|riñones",
                    "почечная недостаточность|болезнь почек|хроническая болезнь почек|хбп|почки"),
    ("d", "masld"): L("", "stéatose hépatique|foie gras|nafld|maladie du foie gras|stéatose", "hígado graso|esteatosis hepática|enfermedad del hígado graso",
                      "жировая болезнь печени|жировой гепатоз|стеатоз|неалкогольная жировая болезнь печени"),
    ("d", "low_back_pain"): L("", "mal de dos|lombalgie|douleur dorsale|douleurs lombaires", "dolor de espalda|lumbalgia|dolor lumbar|dolor de espalda baja",
                              "боль в спине|боль в пояснице|люмбаго|поясница"),
    ("d", "gout"): L("", "goutte|acide urique", "gota|ácido úrico", "подагра|мочевая кислота"),
    ("d", "ibd"): L("", "maladie de crohn|colite|rectocolite hémorragique|mici", "enfermedad de crohn|colitis|colitis ulcerosa|eii",
                    "болезнь крона|колит|язвенный колит|воспаление кишечника"),
    ("d", "peptic_ulcer"): L("", "ulcère|ulcère de l’estomac|ulcère gastrique", "úlcera|úlcera de estómago|úlcera gástrica", "язва|язва желудка|язвенная болезнь"),
    ("d", "migraine"): L("", "migraine|mal de tête", "migraña|jaqueca|dolor de cabeza", "мигрень|головная боль"),
    ("d", "osa_outcome"): L("", "apnée du sommeil|ronflement|ronfler", "apnea del sueño|ronquidos|roncar", "апноэ сна|апноэ|храп"),
    ("d", "anxiety_disorders"): L("", "anxiété|angoisse|crises de panique", "ansiedad|angustia|ataques de pánico", "тревожность|тревога|панические атаки|тревожное расстройство"),
    ("d", "erectile_dysfunction"): L("", "impuissance|dysfonction érectile", "impotencia|disfunción eréctil", "импотенция|эректильная дисфункция"),
    ("d", "periodontitis_disease"): L("", "maladie des gencives|parodontite|gencives", "enfermedad de las encías|periodontitis|encías", "болезнь дёсен|пародонтит|дёсны"),
    ("d", "atopic_dermatitis"): L("", "eczéma|dermatite atopique", "eccema|dermatitis atópica", "экзема|атопический дерматит"),
    ("d", "hearing_loss"): L("", "surdité|perte d’audition|malentendant", "sordera|pérdida de audición", "глухота|потеря слуха|тугоухость"),
    # ---- chronic risk factors (zh aliases come from the dataset's aliases_zh)
    ("r", "smoking"): L("", "tabac|tabagisme|fumeur|cigarette|cigarettes|fumer", "tabaco|tabaquismo|fumador|cigarrillo|cigarrillos|fumar",
                        "табак|курение|курильщик|сигареты|курить"),
    ("r", "alcohol_heavy"): L("酗酒|喝酒|饮酒|酒精|大量饮酒", "alcool|boire|vin|bière|alcoolisme", "alcohol|beber|vino|cerveza|alcoholismo",
                              "алкоголь|пить|пиво|вино|алкоголизм"),
    ("r", "alcohol_moderate"): L("喝酒|饮酒|酒精", "alcool|vin|bière", "alcohol|vino|cerveza", "алкоголь|пиво|вино"),
    ("r", "binge_drinking"): L("喝酒|饮酒|酒精|醉酒|暴饮", "alcool|beuverie|binge drinking", "alcohol|atracón de alcohol|borrachera", "алкоголь|злоупотребление алкоголем"),
    ("r", "high_sbp"): L("高血压|血压|收缩压", "tension|tension artérielle|hypertension", "presión arterial|tensión arterial|hipertensión|presión alta",
                         "давление|гипертония|высокое давление"),
    ("r", "high_ldl"): L("胆固醇|坏胆固醇|低密度脂蛋白", "cholestérol|mauvais cholestérol", "colesterol|colesterol malo", "холестерин|плохой холестерин"),
    ("r", "high_bmi"): L("体重指数|超重|肥胖", "imc|surpoids|obésité|poids", "imc|sobrepeso|obesidad|peso", "имт|лишний вес|ожирение|вес"),
    ("r", "red_meat"): L("红肉|牛肉|猪肉|羊肉", "viande rouge|bœuf|porc", "carne roja|ternera|cerdo", "красное мясо|говядина|свинина"),
    ("r", "processed_meat"): L("加工肉|火腿|香肠|培根|腊肉", "charcuterie|jambon|saucisse|bacon", "embutidos|jamón|salchichas|fiambre", "колбаса|ветчина|сосиски|бекон"),
    ("r", "coffee"): L("", "café|caféine", "café|cafeína", "кофе|кофеин"),
    ("r", "ssb"): L("含糖饮料|汽水|可乐|饮料|奶茶", "boissons sucrées|soda|sodas|limonade|jus", "bebidas azucaradas|refrescos|gaseosa|soda",
                    "сладкие напитки|газировка|сладкая вода|лимонад"),
    ("r", "upf"): L("超加工食品|加工食品|垃圾食品|零食", "aliments ultratransformés|malbouffe|junk food", "ultraprocesados|comida chatarra|comida basura",
                    "ультрапереработанные продукты|вредная еда|фастфуд"),
    ("r", "sedentary"): L("久坐|坐着", "sédentarité|assis|position assise", "sedentarismo|sentado|estar sentado", "малоподвижность|сидячий образ жизни|сидение"),
    ("r", "low_pa"): L("运动不足|缺乏运动|不运动|运动", "inactivité physique|manque d’exercice|sport|sédentarité", "inactividad física|falta de ejercicio|deporte",
                       "низкая физическая активность|гиподинамия|спорт|нет упражнений"),
    ("r", "short_sleep"): L("失眠|睡眠不足|熬夜", "manque de sommeil|sommeil", "falta de sueño|sueño", "недосып|нехватка сна|сон"),
    ("r", "insomnia"): L("失眠|睡眠不足", "insomnie|manque de sommeil", "insomnio|falta de sueño", "бессонница|недосып|нехватка сна"),
    ("r", "night_shift"): L("", "travail de nuit|travail posté", "trabajo nocturno|turnos", "ночные смены|сменная работа"),
    ("r", "job_strain"): L("工作压力|职场压力", "stress au travail|stress professionnel", "estrés laboral|estrés en el trabajo", "рабочий стресс|стресс на работе"),
    ("r", "long_hours"): L("加班|长时间工作|过劳", "heures supplémentaires|surmenage|longues journées", "horas extra|exceso de trabajo|jornadas largas",
                           "переработки|длинный рабочий день|сверхурочные"),
    ("r", "job_insecurity"): L("失业|下岗|裁员", "chômage|perte d’emploi|licenciement", "desempleo|paro|pérdida de empleo", "безработица|потеря работы|увольнение"),
    ("r", "pm25"): L("雾霾|空气污染|细颗粒物", "pollution de l’air|particules fines|smog", "contaminación del aire|partículas finas|smog",
                     "загрязнение воздуха|мелкие частицы|смог"),
    ("r", "statins"): L("他汀", "statines|médicament contre le cholestérol", "estatinas", "статины"),
    ("r", "nonsugar_sweeteners"): L("", "édulcorants|soda light|aspartame", "edulcorantes|refresco light|aspartamo", "подсластители|сахарозаменители|аспартам"),
    ("r", "vitd_deficiency"): L("维生素D", "vitamine d", "vitamina d", "витамин д"),
}

# --------------------------------------------------------------------------
# pages on this site
# --------------------------------------------------------------------------
# (id, page, anchor, i18n key of the name, parent, i18n keys whose values are aliases, aliases, leads)
# parent "read" puts the reading guide's name in the group field. The name of an
# entry comes from design/i18n/<lang>.json, so it always matches the page.
# leads=1 marks a page that answers its own words: when the query equals its name or
# one of its aliases exactly, search.js lists "on this site" first (the index stores
# the flag in the item's extra field). The seven reading ideas never lead.
READ = "read"
LABEL_KEYS = ["lbl_g1", "lbl_g2a", "lbl_g2b", "lbl_g3", "lbl_est", "lbl_sus", "lbl_strong",
              "lbl_moderate", "lbl_suggestive", "lbl_weak", "lbl_conflicting"]
SITE = [
    ("work", "work.html", "", "work_label", None, [], dict(
        en="job|jobs|work|workplace|work place|occupation|occupations|occupational|employer|employment|worker|workers|career|profession|trade|trades|industry|factory|sector",
        zh="工作|职业|工作场所|职场|上班|行业|雇主|工人|打工|职业病|工种",
        fr="travail|emploi|métier|métiers|profession|lieu de travail|professionnel|travailleur|employeur|secteur|boulot|activité professionnelle",
        es="trabajo|empleo|oficio|oficios|profesión|lugar de trabajo|laboral|trabajador|empleador|sector|ocupación",
        ru="работа|профессия|профессии|рабочее место|производство|работник|работодатель|отрасль|труд|занятость|место работы"), 1),
    ("hwc", "how-we-check.html", "", "hwc_label", None, [], dict(
        en="sources|source|method|methods|accuracy|accurate|errors|error|report an error|correction|corrections|mistake|mistakes|versions|version|trust|reliable|quality|checked|verification|data sources|where the data come from|references|reference index|change log|changelog|framework",
        zh="核查|来源|数据来源|方法|准确|准确性|错误|报告错误|更正|纠错|版本|可靠|可信|验证|参考文献|更新日志|框架",
        fr="vérification|vérifier|sources|source|méthode|méthodes|exactitude|fiabilité|erreur|erreurs|signaler une erreur|correction|corrections|version|versions|qualité|données|références|journal des modifications|cadre méthodologique",
        es="verificación|verificar|fuentes|fuente|método|métodos|exactitud|fiabilidad|error|errores|avisar de un error|corrección|correcciones|versión|versiones|calidad|datos|referencias|registro de cambios|marco metodológico",
        ru="проверка|проверять|источники|источник|метод|методы|точность|надёжность|ошибка|ошибки|сообщить об ошибке|исправление|версия|версии|качество|данные|литература|журнал изменений|методология"), 1),
    ("reading", "reading.html", "", "read_label", None, [], dict(
        en="guide|reading guide|how to read|health headlines|headlines|statistics|epidemiology|basics|health news|read the evidence",
        zh="阅读指南|如何阅读|健康新闻|新闻标题|统计|流行病学|基础知识|读懂",
        fr="guide de lecture|comment lire|titres|actualités santé|statistiques|épidémiologie|notions de base",
        es="guía de lectura|cómo leer|titulares|noticias de salud|estadística|estadísticas|epidemiología|nociones básicas",
        ru="руководство|как читать|заголовки|новости о здоровье|статистика|эпидемиология|основы"), 1),
    ("labels", "reading.html", "labels", "lbl_label", READ, LABEL_KEYS, dict(
        en="labels|label|iarc groups|iarc classification|classification|categories|grades|grade|probably carcinogenic|possibly carcinogenic|carcinogenic to humans|sufficient evidence|limited evidence|old names|convincing|contested",
        zh="标签|类别|分类|IARC 分类|分级|证据等级|致癌|旧名称|令人信服",
        fr="étiquettes|étiquette|groupes du CIRC|classification|catégories|niveaux|cancérogène|probablement cancérogène|peut-être cancérogène|anciens noms",
        es="etiquetas|etiqueta|grupos del CIIC|clasificación|categorías|grados|carcinógeno|probablemente carcinógeno|posiblemente carcinógeno|nombres antiguos",
        ru="обозначения|метки|группы МАИР|классификация|категории|уровни|канцероген|вероятный канцероген|возможный канцероген|прежние названия"), 1),
    ("hazard", "reading.html", "hazard", "read_1_tag", READ, [], dict(
        en="hazard|hazards|risk|danger|dangerous|harmful|harm",
        zh="危害|风险|危险|有害|危害与风险",
        fr="danger|risque|dangereux|nocif|nocivité",
        es="peligro|riesgo|peligroso|nocivo|daño",
        ru="опасность|риск|опасный|вред|вредный"), 0),
    ("relative-absolute", "reading.html", "relative-absolute", "read_2_tag", READ, [], dict(
        en="relative risk|absolute risk|doubles the risk|doubling|twice the risk|double the risk|percent|percentage|odds|risk ratio|hazard ratio|rr|headline numbers",
        zh="相对风险|绝对风险|风险翻倍|翻倍|百分比|风险比|比值",
        fr="risque relatif|risque absolu|double le risque|doubler|pourcentage|rapport de risque",
        es="riesgo relativo|riesgo absoluto|duplica el riesgo|duplicar|porcentaje|razón de riesgo",
        ru="относительный риск|абсолютный риск|удваивает риск|удвоение|процент|отношение рисков"), 0),
    ("association-cause", "reading.html", "association-cause", "read_3_tag", READ, [], dict(
        en="association|correlation|causation|confounding|confounder",
        zh="关联|相关|因果|混杂|混杂因素",
        fr="association|corrélation|causalité|facteur de confusion|confusion",
        es="asociación|correlación|causalidad|factor de confusión|confusión",
        ru="ассоциация|корреляция|причинность|искажающий фактор|смешение"), 0),
    ("chance-bias", "reading.html", "chance-bias", "read_7_tag", READ, [], dict(
        en="chance|bias|luck|random|coincidence|sample|sample size|small study|p-value|recall bias|selection bias",
        zh="偶然|偏倚|运气|随机|巧合|样本|样本量|偏差|p值",
        fr="hasard|biais|chance|aléatoire|coïncidence|échantillon|taille d’échantillon|biais de rappel",
        es="azar|sesgo|suerte|aleatorio|casualidad|muestra|tamaño de la muestra|sesgo de recuerdo",
        ru="случайность|систематическая ошибка|смещение|удача|случай|совпадение|выборка|размер выборки"), 0),
    ("range", "reading.html", "range", "read_4_tag", READ, [], dict(
        en="range|confidence interval|interval|uncertainty|margin of error|error bar|error bars|95%|estimate|estimates|ci",
        zh="区间|置信区间|不确定性|误差|误差线|估计值|95%",
        fr="intervalle|intervalle de confiance|incertitude|marge d’erreur|estimation|95 %",
        es="intervalo|intervalo de confianza|incertidumbre|margen de error|estimación|95 %",
        ru="интервал|доверительный интервал|неопределённость|погрешность|оценка|95 %"), 0),
    ("no-evidence", "reading.html", "no-evidence", "read_5_tag", READ, [], dict(
        en="no evidence|absence of evidence|evidence of no effect|safe|safety|is it safe|inconclusive|unknown|no effect|harmless",
        zh="没有证据|无证据|缺乏证据|安全|是否安全|无害|不确定|没有影响",
        fr="pas de preuve|absence de preuve|sans danger|sûr|innocuité|non concluant|inconnu|aucun effet|inoffensif",
        es="sin evidencia|ausencia de evidencia|seguro|es seguro|inocuo|no concluyente|desconocido|sin efecto|inofensivo",
        ru="нет доказательств|отсутствие доказательств|безопасно|безопасность|безвредно|неубедительно|неизвестно|нет эффекта"), 0),
    ("populations", "reading.html", "populations", "read_6_tag", READ, [], dict(
        en="populations|population|people|individual|individuals|personal risk|my risk|one person|groups|average",
        zh="人群|个人|个体|我的风险|群体|平均",
        fr="populations|population|individu|individus|risque personnel|mon risque|une personne|groupe|moyenne",
        es="poblaciones|población|individuo|individuos|riesgo personal|mi riesgo|una persona|grupo|promedio",
        ru="популяции|популяция|человек|отдельный человек|личный риск|мой риск|группа|среднее"), 0),
    ("code", "code-against-cancer/", "", "nav_prevention", None, [], dict(
        en="prevention|prevent|prevent cancer|lower your risk|reduce your risk|what you can do|recommendations|advice|guidance|tips|screening|vaccination|vaccine|vaccines|healthy living|european code|ecac|latin america|code",
        zh="预防|预防癌症|防癌|降低风险|建议|指南|筛查|疫苗|接种|守则|欧洲守则|健康生活",
        fr="prévention|prévenir|prévenir le cancer|réduire le risque|que faire|recommandations|conseils|dépistage|vaccination|vaccin|vaccins|code européen|code",
        es="prevención|prevenir|prevenir el cáncer|reducir el riesgo|qué puedo hacer|recomendaciones|consejos|cribado|detección|vacunación|vacuna|vacunas|código europeo|código",
        ru="профилактика|предотвратить|как снизить риск|что можно сделать|рекомендации|советы|скрининг|вакцинация|вакцина|прививка|европейский кодекс|кодекс"), 1),
    ("games", "games.html", "", "nav_games", None, [], dict(
        en="games|game|play|play a game|quiz|schools|families|learning|lung detective|sun safety|uv shield|town of 1000|town of 1,000",
        zh="游戏|小游戏|玩|儿童|学校|家庭|学习",
        fr="jeux|jeu|jouer|enfants|écoles|familles|apprendre",
        es="juegos|juego|jugar|niños|escuelas|familias|aprender",
        ru="игры|игра|играть|дети|школы|семьи|обучение"), 1),
    ("about", "about.html", "", "nav_about", None, [], dict(
        en="about|author|developer|who made this|who are you|wenxin|wenxin wan|biography|bio|cv|credentials|epidemiologist|personal project",
        zh="关于|作者|开发者|谁做的|简介|履历|流行病学家|个人项目",
        fr="à propos|auteur|développeur|qui sommes-nous|qui êtes-vous|biographie|cv|épidémiologiste|projet personnel",
        es="acerca de|autor|desarrollador|quién hizo esto|quién eres|biografía|currículum|epidemiólogo|proyecto personal",
        ru="об авторе|автор|разработчик|кто сделал|кто вы|биография|резюме|эпидемиолог|личный проект"), 1),
    ("cite", "about.html", "cite", "cite_label", None, [], dict(
        en="cite|citation|how to cite|citing|reference|bibliography|apa|vancouver|bibtex",
        zh="引用|如何引用|引用格式|参考文献格式",
        fr="citer|citation|comment citer|référence|bibliographie",
        es="citar|cita|cómo citar|referencia|bibliografía",
        ru="цитировать|цитирование|как цитировать|ссылка|библиография"), 1),
    ("contact", "about.html", "contact", "contact_label", None, [], dict(
        en="contact|email|e-mail|write to|message|get in touch|feedback|questions|mail",
        zh="联系|联系方式|邮件|写信|反馈|问题",
        fr="contact|contacter|email|courriel|écrire|message|retour|questions",
        es="contacto|contactar|correo|correo electrónico|escribir|mensaje|comentarios|preguntas",
        ru="контакты|связаться|почта|email|написать|сообщение|отзыв|вопросы"), 1),
]


def site_url(lang, page, anchor):
    """Root-relative URL of a site page in `lang`. The Code page localises itself
    from ?lang= (no per-language copies), every other page has a folder per language."""
    frag = "#" + anchor if anchor else ""
    if page.endswith("/"):
        return "/%s?lang=%s%s" % (page, lang, frag)
    return ("/" if lang == "en" else "/%s/" % lang) + page + frag


def plain(s):
    s = re.sub(r"<[^>]+>", "", str(s))
    return " ".join(__import__("html").unescape(s).split())


# --------------------------------------------------------------------------
# loading
# --------------------------------------------------------------------------


class Ctx:
    pass


def load_context(args):
    c = Ctx()
    c.graph = load_json(args.graph)
    c.cancer_aliases = read_cancer_aliases(CANCER_ALIASES)
    c.dataset = load_json(args.chronic)
    c.names = ui_extract(CHRONIC_TEMPLATE, "NAMES")          # fr es ru pt ar de ja it
    langs = ui_extract(CANCER_TEMPLATE, "LANGS")             # the tool's own short volume labels
    c.vol = {l: (langs[l]["volShort"], langs[l]["supShort"]) for l in LANGS}
    c.i18n = {l: load_json(os.path.join(I18N, "%s.json" % l)) for l in LANGS}
    c.fallback = Counter()                                    # which tables were used
    g = c.graph
    c.exposures, c.cancers = g["exposures"], g["cancers"]
    c.evaluated = g["meta"]["evaluated"]
    c.links_e, c.links_c = Counter(), Counter()
    for l in g["links"]:
        c.links_e[l["exposure"]] += 1
        c.links_c[l["cancer"]] += 1
    c.risks, c.diseases = c.dataset["risks"], c.dataset["diseases"]
    # routes: path form needs a slug on every exposure and cancer (Batch 5)
    have = [bool(x.get("slug")) for x in c.exposures + c.cancers]
    if args.routes == "auto":
        if all(have):
            c.routes = "path"
        elif not any(have):
            c.routes = "hash"
        else:
            raise SystemExit("slug is present on %d of %d exposures and cancers: fix the graph or pass --routes"
                             % (sum(have), len(have)))
    else:
        c.routes = args.routes
        if c.routes == "path" and not all(have):
            raise SystemExit("--routes path needs a slug on every exposure and cancer")
    return c


def vol_text(c, lang, volume):
    vol_short, sup_short = c.vol[lang]
    m = re.match(r"^Sup\s*(\S+)$", str(volume))
    return (sup_short if m else vol_short).replace("{n}", m.group(1) if m else str(volume))


def local(key, lang):
    return LOCAL.get(key, {}).get(lang, []) if lang != "en" else []


def en_rules(name):
    out = []
    for prefix, aliases in EN_RULES:
        if name.startswith(prefix):
            out += aliases
    return out


def group_words(system_en, system, lang):
    """The "~" group words of a disease: its system label in the page language, the English
    label on the other pages, and SYSTEM_WORDS (English everywhere, the rest on their page)."""
    extra = SYSTEM_WORDS.get(system_en, {})
    out = [system] + ([system_en] if lang != "en" else []) + A(extra.get("en", ""))
    if lang != "en":
        out += A(extra.get(lang, ""))
    return ["~" + w for w in out]


def pick(by_lang, lang, english):
    """Name in `lang` from a {lang: text} map; English when the language is missing."""
    return (by_lang or {}).get(lang) or english


# --------------------------------------------------------------------------
# items
# --------------------------------------------------------------------------


def build_items(c, lang, problems):
    items = []
    organ = c.graph["meta"]["organ_i18n"]
    nm = c.names.get(lang, {})

    # ---- exposures
    for e in c.exposures:
        name = e["name"] if lang == "en" else pick(e["name_i18n"], lang, e["name"])
        if lang != "en" and name == e["name"] and not e["name_i18n"].get(lang):
            problems.append("exposure %r has no %s name" % (e["id"], lang))
        extra_zh = e.get("aliases_zh") if lang == "zh" else []
        aliases = clean_aliases(name, [e["id"]], e.get("aliases"), extra_zh, en_rules(e["name"]),
                                EN_EXTRA.get(("e", e["id"])), local(("e", e["id"]), lang), alt(e["name"], lang))
        items.append(["e", e["slug"] if c.routes == "path" else e["id"], name, aliases, e["group"],
                      c.links_e[e["id"]]])

    # ---- cancers
    for k in c.cancers:
        cid = k["id"]
        name = k["name"] if lang == "en" else pick(k["name_i18n"], lang, k["name"])
        if lang != "en" and not k["name_i18n"].get(lang):
            problems.append("cancer %r has no %s name" % (cid, lang))
        from_data = words(k.get("aliases"), c.cancer_aliases.get(cid, {}).get("en"))
        zh_data = words(k.get("aliases_zh"), c.cancer_aliases.get(cid, {}).get("zh")) if lang == "zh" else []
        if from_data:
            c.fallback["cancer aliases from data"] += 1
        else:
            if cid not in CANCER_ALIAS_FALLBACK:
                problems.append("cancer %r has no aliases in the data and none in CANCER_ALIAS_FALLBACK" % cid)
            from_data = CANCER_ALIAS_FALLBACK.get(cid, [])
            c.fallback["cancer aliases from fallback"] += 1
        group = k["organ_plain"] if lang == "en" else organ[k["organ_plain"]].get(lang, k["organ_plain"])
        aliases = clean_aliases(name, [cid], from_data, zh_data, local(("c", cid), lang), alt(k["name"], lang))
        items.append(["c", k["slug"] if c.routes == "path" else cid, name, aliases, group, c.links_c[cid]])

    # ---- agents IARC evaluated without naming a cancer site (names stay English)
    for x in c.evaluated:
        aliases = clean_aliases(x["name"], x.get("aliases"), en_rules(x["name"]), local(("v", x["name"]), lang))
        items.append(["v", "", x["name"], aliases, x["group"], [vol_text(c, lang, x["volume"]), x["year"]]])

    # ---- chronic risks
    for r in c.risks:
        rid = r["id"]
        name = {"en": r["name"], "zh": r.get("name_zh") or r["name"]}.get(lang) or nm["r"][rid]
        cat = {"en": r["category"], "zh": r.get("category_zh") or r["category"]}.get(lang) or nm["cat"][r["category"]]
        zh = r.get("aliases_zh") if lang == "zh" else []
        aliases = clean_aliases(name, r.get("aliases"), zh, local(("r", rid), lang), alt(r["name"], lang))
        items.append(["r", rid, name, aliases, cat, r["n_links"]])

    # ---- chronic diseases
    for d in c.diseases:
        did = d["id"]
        name = {"en": d["name"], "zh": d.get("name_zh") or d["name"]}.get(lang) or nm["d"][did]
        system = {"en": d["system"], "zh": d.get("system_zh") or d["system"]}.get(lang) or nm["sys"][d["system"]]
        fb_en, fb_zh = DISEASE_ALIAS_FALLBACK.get(did, ([], []))
        en_list = words(d.get("aliases"))
        if en_list:
            c.fallback["disease aliases from data"] += 1
        else:
            if did not in DISEASE_ALIAS_FALLBACK:
                problems.append("disease %r has no aliases in the data and none in DISEASE_ALIAS_FALLBACK" % did)
            en_list = fb_en
            c.fallback["disease aliases from fallback"] += 1
        zh_list = (words(d.get("aliases_zh")) or fb_zh) if lang == "zh" else []
        aliases = clean_aliases(name, en_list, zh_list, local(("d", did), lang), alt(d["name"], lang),
                                group_words(d["system"], system, lang))
        items.append(["d", did, name, aliases, system, d["n_links"]])

    # ---- pages on this site
    d_ = c.i18n[lang]
    read_label = plain(d_["read_label"])
    for sid, page, anchor, key, parent, label_keys, al, leads in SITE:
        name = plain(d_[key])
        label_words = [plain(d_[k]) for k in label_keys]
        if label_keys:                       # "Group 1", "Group 2A", ... as the pages print them
            label_words += [d_["lbl_grp"].replace("{g}", g) for g in GROUPS]
        aliases = clean_aliases(name, A(al["en"]), A(al.get(lang, "")) if lang != "en" else [], label_words,
                                alt(plain(c.i18n["en"][key]), lang))
        items.append(["s", site_url(lang, page, anchor), name, aliases, read_label if parent == READ else "", leads])

    order = {t: i for i, t in enumerate("ecvrds")}
    items.sort(key=lambda it: (order[it[0]], norm(it[2]), str(it[1])))
    return items


def check_items(c, items_by_lang, problems):
    """Structural checks that must hold in every language."""
    known = {("e", e["id"]) for e in c.exposures} | {("c", k["id"]) for k in c.cancers} \
        | {("v", x["name"]) for x in c.evaluated} | {("r", r["id"]) for r in c.risks} \
        | {("d", d["id"]) for d in c.diseases} | {("s", s[0]) for s in SITE}
    for table, label in ((LOCAL, "LOCAL"), (EN_EXTRA, "EN_EXTRA")):
        for key in table:
            if key not in known:
                problems.append("%s has an entry for %r, which is not in the data" % (label, key))
    systems = {d["system"] for d in c.diseases}
    for key, by_lang in SYSTEM_WORDS.items():
        if key not in systems:
            problems.append("SYSTEM_WORDS has an entry for %r, which is not a disease system" % key)
        for lang in LANGS:
            if not A(by_lang.get(lang, "")):
                problems.append("SYSTEM_WORDS %r has no %s words" % (key, lang))
    for lang, items in items_by_lang.items():
        ids = Counter((it[0], it[1]) for it in items if it[0] != "v")
        for k, n in ids.items():
            if n > 1:
                problems.append("%s: duplicate %s %r" % (lang, k[0], k[1]))
        for it in items:
            if not it[2].strip():
                problems.append("%s: empty name for %s %r" % (lang, it[0], it[1]))
            if it[0] != "d" and any(a.startswith("~") for a in it[3]):
                problems.append("%s: %s %r has a word starting with ~ (only diseases carry group words)"
                                % (lang, it[0], it[1]))
            if it[0] == "s":
                page, _, anchor = it[1].partition("#")
                path = page.split("?")[0].lstrip("/")
                if path.endswith("/"):
                    path += "index.html"
                full = os.path.join(DESIGN, path)
                if not os.path.exists(full):
                    problems.append("%s: site page %s does not exist" % (lang, path))
                elif anchor:
                    with open(full, encoding="utf-8") as fh:
                        if not re.search(r'\bid="%s"' % re.escape(anchor), fh.read()):
                            problems.append("%s: %s has no id=%s" % (lang, path, anchor))
    counts = Counter(it[0] for it in items_by_lang["en"])
    want = {"e": EXPECT["exposures"], "c": EXPECT["cancers"], "v": EXPECT["evaluated"],
            "r": EXPECT["risks"], "d": EXPECT["diseases"]}
    for t, n in want.items():
        if counts[t] != n:
            print("NOTE: %d items of type %s, the plan expected %d" % (counts[t], t, n))


def dump(c, lang, items):
    meta = {"cancer": "%s (%s)" % (c.graph["meta"].get("version", "?"), c.graph["meta"].get("built", "?")),
            "chronic": "%s (%s)" % (c.dataset["meta"].get("version", "?"), c.dataset["meta"].get("built", "?")),
            "n": dict(Counter(it[0] for it in items))}
    doc = {"v": 1, "routes": c.routes, "meta": meta, "items": items}
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--routes", choices=["auto", "hash", "path"], default="auto")
    ap.add_argument("--check", action="store_true", help="write nothing; exit 1 when a file differs")
    ap.add_argument("--chronic", default=CHRONIC_DATASET, help="published chronic dataset.json")
    ap.add_argument("--graph", default=GRAPH, help="evidence_graph.json")
    ap.add_argument("--out", default=OUT_DIR, help="folder for the five files")
    args = ap.parse_args()

    c = load_context(args)
    problems = []
    items_by_lang = {lang: build_items(c, lang, problems) for lang in LANGS}
    check_items(c, items_by_lang, problems)
    if problems:
        shown = sorted(set(problems))
        raise SystemExit("PROBLEMS (%d):\n  %s" % (len(shown), "\n  ".join(shown[:40])))

    texts = {lang: dump(c, lang, items_by_lang[lang]) for lang in LANGS}
    differs = []
    for lang in LANGS:
        path = os.path.join(args.out, "%s.json" % lang)
        old = open(path, encoding="utf-8").read() if os.path.exists(path) else None
        if old != texts[lang]:
            differs.append(lang)
        if not args.check:
            os.makedirs(args.out, exist_ok=True)
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(texts[lang])
        raw = len(texts[lang].encode("utf-8"))
        gz = len(gzip.compress(texts[lang].encode("utf-8"), 9))
        n = Counter(it[0] for it in items_by_lang[lang])
        print("%s.json  %6.1f KB raw  %5.1f KB gzip  items %d (%s)" % (
            lang, raw / 1024, gz / 1024, len(items_by_lang[lang]),
            " ".join("%s %d" % (t, n[t]) for t in "ecvrds")))
    print("routes: %s   cancer %s   chronic %s" % (c.routes, c.graph["meta"].get("version"), c.dataset["meta"].get("version")))
    for k, v in sorted(c.fallback.items()):
        print("  %s: %d (counted once per language run)" % (k, v // len(LANGS)))
    if args.check:
        if differs:
            print("CHECK FAILED: differs on disk: %s" % ", ".join(differs))
            sys.exit(1)
        print("check ok: the files on disk equal a fresh build")


if __name__ == "__main__":
    main()
