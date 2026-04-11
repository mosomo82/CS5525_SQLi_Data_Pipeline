# WAF Blocking Comparison Results

| Attack Type | Without WAF | With WAF | WAF Rule That Blocked |
|-------------|------------|----------|-----------------------|
| Union-based `UNION SELECT` | LEAKED data | BLOCKED | `AWSManagedRulesSQLiRuleSet` |
| Always-true `' OR 1=1--` | BYPASSED login | BLOCKED | `AWSManagedRulesSQLiRuleSet` |
| Boolean blind injection | LEAKED data | BLOCKED | Rate-limit rule (100 req/min) |
| `SLEEP()` time delay | Caused 5s delay | BLOCKED | `AWSManagedRulesKnownBadInputs` |
| Normal search request | Allowed | Allowed | No rule triggered (correct) |

### Live Testing Observations
During our manual curl testing against the live API Gateway (`https://2y68q1dt27.execute-api.us-east-2.amazonaws.com/prod`), we discovered an interesting edge case with the AWS Managed WAF rules:
1. **Rule Evasion**: When testing the Always-true bypass using simply `admin'--`, the `AWSManagedRulesSQLiRuleSet` completely failed to recognize it as SQL injection. Because it lacked keywords like `SELECT` or `OR`, the WAF allowed the payload through to the database, where it triggered a `mysql.connector.errors.ProgrammingError` (500 Internal Server Error) instead of a graceful 403 Block. 
2. **Rate Limit Delays**: When firing 110 requests via a `for` loop to trigger the custom `sqli-rate-limit` rule, the WAF allowed all 110 requests initially. The block (`403 Forbidden`) did successfully kick in, but only after AWS finished processing the traffic batch a few moments later, demonstrating that AWS WAF rate limits operate on 30-to-60 second evaluation windows rather than instantaneous per-request blocks.
