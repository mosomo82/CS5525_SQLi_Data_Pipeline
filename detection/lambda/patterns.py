import re
 
# Each pattern: (name, compiled_regex, severity)
SQLI_PATTERNS = [
    ("always_true_bypass",
     re.compile(r"(?i)(\' ?or ?1 ?= ?1|\" ?or ?1 ?= ?1|or 1=1)", re.IGNORECASE),
     'HIGH'),
 
    ("union_select",
     re.compile(r'(?i)union\s+select', re.IGNORECASE),
     'CRITICAL'),
 
    ("information_schema",
     re.compile(r'(?i)information_schema', re.IGNORECASE),
     'CRITICAL'),
 
    ("drop_table",
     re.compile(r'(?i)drop\s+table', re.IGNORECASE),
     'CRITICAL'),
 
    ("sleep_delay",
     re.compile(r'(?i)(sleep\s*\(|waitfor\s+delay)', re.IGNORECASE),
     'HIGH'),
 
    ("comment_injection",
     re.compile(r"(--\s|#\s|/\*)", re.IGNORECASE),
     'MEDIUM'),
 
    ("single_quote",
     re.compile(r"['\"]\s*(;|--|#|\/\*)"),
     'LOW'),
 
    ("hex_encoding",
     re.compile(r'0x[0-9a-fA-F]{4,}'),
     'MEDIUM'),
]
