import * as cdk from 'aws-cdk-lib';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import path = require('path');
import { AttributeType, Billing, Capacity, CapacityMode, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class HelloWorldTestServiceCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


	const ddb = new TableV2(this, 'FeatureFlagTable', {
		partitionKey: {
			name: 'FeatureFlagName',
			type: AttributeType.STRING
		},
		//capacityMode: CapacityMode.FIXED,	
		billing: Billing.provisioned({

			readCapacity: Capacity.fixed(1),
			writeCapacity: Capacity.autoscaled({ maxCapacity: 1 }),
		}),
	});	

	const helloWorldLambda = new Function(this, 'HelloWorldLambda', {
		runtime: Runtime.NODEJS_20_X,
		handler: 'app.handler',
		code: Code.fromAsset(path.join(__dirname, '../../hello-world-test-service/dist/')),
		environment: {
			FEATURE_FLAG_TABLE_NAME: ddb.tableName, // Injects ddb table name for lambda to use
		}
	});

	ddb.grantReadWriteData(helloWorldLambda); // Grant our permissions for the lambda to access ddb

	const api = new LambdaRestApi(this, 'HelloWorldApi', {
		proxy: false,
		handler: helloWorldLambda,
	});

	const helloWorldResource = api.root.addResource('hello');
	helloWorldResource.addMethod('GET');

  }
}
