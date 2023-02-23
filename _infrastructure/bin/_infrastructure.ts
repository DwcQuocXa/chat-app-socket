#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {BackendFargateStack} from "../lib/backend-fargate-stack";
import {BackendPipelineStack} from "../lib/backend-pipeline-stack";
import {FrontendPipelineS3Stack} from "../lib/frontend-pipeline-s3-stack";
import {ECRStack} from "../lib/ecr-stack";

const app = new cdk.App();

new BackendFargateStack(app, 'ChatAppBackendFargateStack', {
    env: {
        region: 'eu-north-1',
        account: '664269831428',
    },
});

new BackendPipelineStack(app, 'ChatAppBackendPipelineStack', {
    env: {
        region: 'eu-north-1',
        account: '664269831428',
    },
});

new FrontendPipelineS3Stack(app, 'ChatAppFrontendPipelineS3Stack', {
    env: {
        region: 'eu-north-1',
        account: '664269831428',
    },
});

new ECRStack(app, 'ChatAppECRStack', {
    env: {
        region: 'eu-north-1',
        account: '664269831428',
    },
});
