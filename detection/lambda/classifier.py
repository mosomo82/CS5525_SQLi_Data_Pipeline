from patterns import SQLI_PATTERNS
 
SEVERITY_RANK = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
 
def classify(request_uri: str, query_string: str) -> dict:
    """
    Analyse a request and return detection results.
    Returns: {"detected": bool, "severity": str, "matches": list}
    """
    full_input = (request_uri or '') + '?' + (query_string or '')
    matches = []
    max_severity = "NONE"
 
    for name, pattern, severity in SQLI_PATTERNS:
        if pattern.search(full_input):
            matches.append({"pattern": name, "severity": severity})
            if SEVERITY_RANK.get(severity, 0) > SEVERITY_RANK.get(max_severity, 0):
                max_severity = severity
 
    return {
        "detected": len(matches) > 0,
        "severity": max_severity,
        "matches": matches,
        "input": full_input[:300]
    }   
