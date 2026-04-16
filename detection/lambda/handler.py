import json, base64, boto3, os, datetime, uuid
from classifier import classify

SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")

sns = boto3.client("sns")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table("sqli-detections")

def lambda_handler(event, context):
    """
    Triggered by Kinesis stream. Processes WAF log records.
    """
    detections = []

    for record in event["Records"]:
        # Decode base64-encoded Kinesis data
        raw = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")

        try:
            log = json.loads(raw)
        except json.JSONDecodeError:
            continue

        # Extract request details from WAF log format
        http_req = log.get("httpRequest", {})
        uri   = http_req.get("uri", "")
        query = http_req.get("args", "")
        source_ip = http_req.get("clientIp", "unknown")
        waf_action = log.get("action", "ALLOW")

        result = classify(uri, query)

        if result["detected"]:
            # Fallback to local if running outside AWS Lambda
            request_id = context.aws_request_id if hasattr(context, 'aws_request_id') else "local"
            
            finding = {
                "timestamp":  datetime.datetime.utcnow().isoformat(),
                "source_ip":  source_ip,
                "uri":        uri,
                "query":      query[:200],
                "severity":   result["severity"],
                "patterns":   result["matches"],
                "waf_action": waf_action
            }
            detections.append(finding)
            print(f"[DETECTION] {result['severity']} | {source_ip} | {uri}")

            # Alert and write to DynamoDB on HIGH or CRITICAL only
            if result["severity"] in ("HIGH", "CRITICAL"):
                if SNS_TOPIC_ARN:
                    try:
                        sns.publish(
                            TopicArn=SNS_TOPIC_ARN,
                            Subject=f"[{result['severity']}] SQL Injection Detected — {source_ip}",
                            Message=json.dumps(finding, indent=2)
                        )
                    except Exception as e:
                        print(f"SNS Publish Error: {e}")
                
                try:
                    table.put_item(Item={
                        "detection_id": str(uuid.uuid4()),
                        "timestamp":    finding["timestamp"],
                        "source_ip":    finding["source_ip"],
                        "severity":     finding["severity"],
                        "attack_type":  finding["patterns"][0]["pattern"] if finding["patterns"] else "unknown",
                        "uri":          finding["uri"],
                        "waf_action":   finding["waf_action"]
                    })
                    print(f"DynamoDB PutItem Success: Logged detection_id {finding.get('detection_id', 'new')}")
                except Exception as e:
                    print(f"DynamoDB PutItem Error: {e}")

    print(f"Processed {len(event['Records'])} records, {len(detections)} detections")
    return {"statusCode": 200, "detections": len(detections)}
