declare namespace NodeJS {
  export interface ProcessEnv {
    KUBE_CLUSTER_HOST: string;
    KUBE_CA_DATA: string;
    KUBE_CERT_DATA: string;
    KUBE_KEY_DATA: string;
    CI_PIPELINE_SOURCE?: string;
    CI_MERGE_REQUEST_TARGET_BRANCH_NAME?: string;
    CI_MERGE_REQUEST_SOURCE_BRANCH_NAME?: string;
    CI_PROJECT_PATH?: string;
    CI_COMMIT_REF_NAME?: string;
    CI_PIPELINE_SOURCE?: string;
    GITLAB_TOKEN?: string;
    CI?: string;
    TARGETS?: string;
    CLOUDFLARE_API_TOKEN: string;
    CLOUDFLARE_ACCOUNT_ID: string;
  }
}
