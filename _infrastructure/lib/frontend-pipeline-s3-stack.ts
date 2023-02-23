import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs/lib/construct';
import { PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import {
    BuildSpec,
    ComputeType,
    PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';
import {
    CodeBuildAction,
    CodeBuildActionType,
    S3DeployAction,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { SubnetType } from 'aws-cdk-lib/aws-ec2';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { BuildEnvironmentVariableType } from 'aws-cdk-lib/aws-codebuild/lib/project';

export class FrontendPipelineS3Stack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: cdk.StackProps) {
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

        // Create a CodeBuild project to build and test the code
        const buildProject = new codebuild.PipelineProject(
            this,
            'BuildProject',
            {
                buildSpec: codebuild.BuildSpec.fromSourceFilename(
                    './client/buildspec.yml',
                ),
                environment: {
                    computeType: ComputeType.MEDIUM, // 7 GB memory, 4 vCPUs
                    buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
                    privileged: true,
                    environmentVariables: {
                        SOCKET_URL: { value: '' },
                    },
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

        const websiteBucket = new Bucket(this, 'websiteBucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            bucketName: 'chat-app-frontend',
            autoDeleteObjects: true,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
        });

        const cf = new cloudfront.Distribution(
            this,
            'ChatAppClientdistribution',
            {
                defaultBehavior: {
                    origin: new origins.S3Origin(websiteBucket),
                },
            },
        );

        const invalidateBuildProject = new PipelineProject(
            this,
            `InvalidateProject`,
            {
                buildSpec: BuildSpec.fromObject({
                    version: '0.2',
                    phases: {
                        build: {
                            commands: [
                                'aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"',
                            ],
                        },
                    },
                }),
                environmentVariables: {
                    CLOUDFRONT_ID: { value: cf.distributionId },
                },
            },
        );

        const distributionArn = `arn:aws:cloudfront::664269831428:distribution/${cf.distributionId}`;
        invalidateBuildProject.addToRolePolicy(
            new PolicyStatement({
                resources: [distributionArn],
                actions: ['cloudfront:CreateInvalidation'],
            }),
        );

        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();
        // Create a CodePipeline pipeline to orchestrate the build and deployment process
        const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            pipelineName: 'chat-app-frontend',
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
                        new S3DeployAction({
                            actionName: 'DeployReactApp',
                            input: buildOutput,
                            bucket: websiteBucket,
                            runOrder: 1,
                        }),
                        new CodeBuildAction({
                            actionName: 'InvalidateCache',
                            project: invalidateBuildProject,
                            input: buildOutput,
                            runOrder: 2,
                        }),
                    ],
                },
            ],
        });
    }
}
