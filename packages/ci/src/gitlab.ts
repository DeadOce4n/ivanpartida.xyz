import { z } from 'zod';
import { gql, GraphQLClient } from 'graphql-request';

const gitlabPipelineSchema = z
  .object({
    project: z.object({
      pipelines: z.object({
        nodes: z.array(
          z.object({
            id: z.string(),
            status: z.string(),
            ref: z.string(),
            commit: z.object({
              shortId: z.string(),
            }),
          }),
        ),
      }),
    }),
  })
  .transform((pipeline) =>
    pipeline.project.pipelines.nodes.map((pipeline) => ({
      id: pipeline.id,
      status: pipeline.status,
      ref: pipeline.ref,
      commit: pipeline.commit.shortId,
    })),
  );

export const getLatestSuccessfulPipeline = async (
  projectPath: string,
  ref: string,
  source: string,
) => {
  const query = gql`
    query ($projectPath: ID!, $ref: String!, $source: String!) {
      project(fullPath: $projectPath) {
        pipelines(status: SUCCESS, ref: $ref, source: $source, first: 1) {
          nodes {
            id
            status
            ref
            commit {
              shortId
            }
          }
        }
      }
    }
  `;

  const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

  const client = new GraphQLClient('https://gitlab.com/api/graphql', {
    headers: {
      Authorization: `Bearer ${GITLAB_TOKEN}`,
    },
  });

  const data = await client.request(query, { projectPath, ref, source });

  return gitlabPipelineSchema.parse(data).at(0);
};
