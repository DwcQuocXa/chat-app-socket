import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs/lib/construct';
import { PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { ComputeType } from 'aws-cdk-lib/aws-codebuild';
import {
    CodeBuildActionType,
    EcsDeployAction,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Duration } from 'aws-cdk-lib';
import { BaseService } from 'aws-cdk-lib/aws-ecs';

export class BackendPipelineStack extends cdk.Stack {
    constructor(
        scope: Construct,
        id: string,
        props: cdk.StackProps,
    ) {
        super(scope, id, props);

        const vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'external-vpc', {
            vpcId: 'vpc-09d6be28120dfccc6',
            vpcName: 'VpcStack/Automotive',
        });

        const buildRole = Role.fromRoleArn(
            this,
            'Role',
            'arn:aws:iam::664269831428:role/import-car-tax',
        );

        const clusterService = BaseService.fromServiceArnWithCluster(
            this,
            'BackendService',
            'arn:aws:ecs:eu-north-1:664269831428:cluster/chat-app-server/ChatAppBackendFargateStack-chatappserverService38DE1FA4-tItML49kJGBy',
        );

        // Create a CodeBuild project to build and test the code
        const buildProject = new codebuild.PipelineProject(
            this,
            'BuildProject',
            {
                buildSpec: codebuild.BuildSpec.fromSourceFilename(
                    './server/buildspec.yml',
                ),
                environment: {
                    computeType: ComputeType.MEDIUM, // 7 GB memory, 4 vCPUs
                    buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
                    privileged: true,
                    environmentVariables: {},
                },
                vpc,
                role: buildRole,
                subnetSelection: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
            },
        );

        buildProject.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    'codebuild:CreateReportGroup',
                    'codebuild:CreateReport',
                    'codebuild:BatchPutTestCases',
                    'codebuild:UpdateReport',
                ],
                resources: ['*'],
            }),
        );

        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        // Create a CodePipeline pipeline to orchestrate the build and deployment process
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            pipelineName: 'chat-app-server',
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.CodeStarConnectionsSourceAction(
                            {
                                actionName: 'Github_Source',
                                owner: 'DwcQuocXa',
                                repo: 'chat-app-socket',
                                branch: 'master',
                                triggerOnPush: true,
                                connectionArn:
                                    'arn:aws:codestar-connections:eu-north-1:664269831428:connection/e2eda67c-1a1e-48f8-922c-7b0ea59dd9d1',
                                output: sourceOutput,
                            },
                        ),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'CodeBuild',
                            project: buildProject,
                            input: sourceOutput,
                            outputs: [buildOutput],
                            type: CodeBuildActionType.BUILD,
                        }),
                    ],
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new EcsDeployAction({
                            actionName: 'CodeDeploy',
                            service: clusterService,
                            input: buildOutput,
                            deploymentTimeout: Duration.minutes(15),
                        }),
                    ],
                },
            ],
        });
    }
}
