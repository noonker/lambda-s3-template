#!/usr/bin/env python3
import boto3
import logging
import os

log = logging.getLogger()
log.setLevel(logging.INFO)

def send_email(email, subject, body):
    client = boto3.client('ses',)

    response = client.send_email(
    Destination={
        'ToAddresses': [email],
    },

    Message={
        'Body': {
            'Text': {
                'Charset': 'UTF-8',
                'Data': body,
            },
        },
        'Subject': {
            'Charset': 'UTF-8',
            'Data': subject,
        },
    },
    Source=email)

def handler(event, context):
    # Read the file
    s3 = boto3.client('s3')
    inbucket = event['Records'][0]['s3']['bucket']['name']
    fname = event['Records'][0]['s3']['object']['key']
    log.info(event)
    log.info(inbucket)
    log.info(fname)
    s3_res = s3.get_object(Bucket=inbucket, Key=fname)
    infile  = s3_res['Body'].read()

    # Output buckets
    results_bucket = os.environ['RESULTS_BUCKET']
    error_bucket = os.environ['ERROR_BUCKET']
    source_bucket = os.environ['SOURCE_BUCKET']


    if True: # Success
        s3.put_object(Bucket=results_bucket, Key=f"{fname}.processed", Body=b"good")
    else: # Error
        s3.put_object(Bucket=error_bucket, Key=f"{fname}.processed", Body=b"bad")

    # Cleanup
    s3.delete_object(Bucket=inbucket, Key=fname)

    return {
        'message' : "success"
    }
