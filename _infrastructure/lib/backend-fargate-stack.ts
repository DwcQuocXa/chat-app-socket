import {
    Duration,
    Stack,
    StackProps,
} from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

export class BackendFargateStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'external-vpc', {
            vpcId: 'vpc-09d6be28120dfccc6',
            vpcName: 'VpcStack/Automotive',
        });

        const cluster = new ecs.Cluster(
            this,
            `chat-app-server-cluster`,
            {
                clusterName: 'chat-app-server',
                containerInsights: true,
                vpc,
            },
        );

        const repo = Repository.fromRepositoryName(
            this,
            'repo',
            'chat-app-server',
        );

        const image = ContainerImage.fromEcrRepository(repo, 'latest');

        const taskRole = new iam.Role(this, 'BackendTaskRole', {
            roleName: 'ChatAppServerECSTaskRole',
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AmazonECSTaskExecutionRolePolicy',
                ),
            ],
        });

        const backendService = new ApplicationLoadBalancedFargateService(
            this,
            `chat-app-server`,
            {
                cluster,
                cpu: 2048,
                desiredCount: 1,
                listenerPort: 80,
                taskImageOptions: {
                    image,
                    containerPort: 80,
                    taskRole,
                    environment: {
                        NODE_ENV: 'test',
                        PORT: '80',
                        FRONTEND_URL:
                            'http://chat-app-client-s3.s3-website.eu-north-1.amazonaws.com',
                        HOST:
                            'ChatA-chata-5PG9T0FAXKAG-1845733310.eu-north-1.elb.amazonaws.com',
                    },
                },
                memoryLimitMiB: 4096, // Default is 512
                publicLoadBalancer: true,
            },
        );

        backendService.targetGroup.configureHealthCheck({
            path: '/',
            port: '80',
            healthyHttpCodes: '200',
            interval: Duration.minutes(5),
        });
    }
}
