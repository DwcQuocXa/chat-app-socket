import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs/lib/construct';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class ECRStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new ecr.Repository(this, 'chat-app-server', {
            repositoryName: 'chat-app-server',
        });
    }
}
