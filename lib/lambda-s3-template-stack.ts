// TODO Email Notifications

import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaEventSources from '@aws-cdk/aws-lambda-event-sources';
import * as iam from '@aws-cdk/aws-iam';

export class LambdaS3TemplateStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sourceBucket = new s3.Bucket(this, 'sourceBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const resultsBucket = new s3.Bucket(this, 'resultsBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const errorBucket = new s3.Bucket(this, 'errorBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const lambdaFunction = new lambda.Function(this, 'Function', {
      code: lambda.Code.fromAsset('lambda'),
      handler: 'main.handler',
      runtime: lambda.Runtime.PYTHON_3_9,
    });

    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'SES:SendRawEmail'],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }));

    lambdaFunction.addEnvironment("RESULTS_BUCKET", resultsBucket.bucketName)
    lambdaFunction.addEnvironment("ERROR_BUCKET", errorBucket.bucketName)
    lambdaFunction.addEnvironment("SOURCE_BUCKET", sourceBucket.bucketName)


    const s3PutEventSource = new lambdaEventSources.S3EventSource(sourceBucket, {
      events: [
        s3.EventType.OBJECT_CREATED_PUT
      ]
    });

    lambdaFunction.addEventSource(s3PutEventSource);

    sourceBucket.grantReadWrite(lambdaFunction)
    errorBucket.grantReadWrite(lambdaFunction)
    resultsBucket.grantReadWrite(lambdaFunction)
    sourceBucket.grantRead(lambdaFunction)
  }
}
