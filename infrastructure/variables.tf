variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "target_ec2_ip" {
  description = "The public IP alias of Person 1's EC2 target running the vulnerable app"
  type        = string
  default     = "3.144.240.191"
}

variable "kinesis_firehose_arn" {
  description = "The ARN of the Kinesis Firehose stream created by Person 4 for WAF logs"
  type        = string
  default     = "arn:aws:kinesis:us-east-2:507041536990:stream/sqli-waf-logs" # Left empty since Person 4 hasn't created it yet
}
