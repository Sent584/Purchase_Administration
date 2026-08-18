import { api } from './api';
import type { ApprovalsInbox, ExecutiveOverview } from '../types/executive';

export const executiveApi = {
  overview: (institutionId?: string) =>
    api
      .get<ExecutiveOverview>('/executive/overview', {
        params: { institution_id: institutionId },
      })
      .then((r) => r.data),
  approvals: (institutionId?: string) =>
    api
      .get<ApprovalsInbox>('/executive/approvals', {
        params: { institution_id: institutionId },
      })
      .then((r) => r.data),
};
