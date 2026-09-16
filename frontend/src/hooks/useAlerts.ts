import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export interface AlertItem {
  id: string;
  student_id: string;
  assessment_id: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  severity?: "CRITICAL" | "HIGH" | string;
  counselor_id?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AlertsResponse {
  alerts: AlertItem[];
  total: number;
}

export interface AlertUpdatePayload {
  id: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
}

export const useCounselorAlerts = (statusFilter?: string, limit: number = 50) => {
  return useQuery<AlertsResponse>({
    queryKey: ["counselor-alerts", statusFilter, limit],
    queryFn: async () => {
      const url = statusFilter 
        ? `/counselors/alerts?status=${statusFilter}&limit=${limit}` 
        : `/counselors/alerts?limit=${limit}`;
      const response = await api.get(url);
      return response.data;
    },
    staleTime: 0, // Alerts triage lists should always be fresh as per specs
  });
};

export const useUpdateAlertStatus = (statusFilter?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AlertUpdatePayload) => {
      const response = await api.patch(`/counselors/alerts/${payload.id}/status`, { status: payload.status });
      return response.data;
    },
    // Enforce optimistic UI updates
    onMutate: async (newAlertState) => {
      const queryKey = ["counselor-alerts", statusFilter, 50];
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<AlertsResponse>(queryKey);

      // Optimistically update query data cache
      if (previousData) {
        queryClient.setQueryData<AlertsResponse>(queryKey, {
          ...previousData,
          alerts: previousData.alerts.map((alert) =>
            alert.id === newAlertState.id
              ? { ...alert, status: newAlertState.status }
              : alert
          ),
        });
      }

      // Return context with rollback snapshot
      return { previousData, queryKey };
    },
    onError: (err, newAlertState, context) => {
      // Rollback on failure
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Always sync cache on resolution
      queryClient.invalidateQueries({ queryKey: ["counselor-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });
};

export const useAssignAlert = (statusFilter?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; counselorId?: string }) => {
      const response = await api.patch(`/counselors/alerts/${payload.id}/assign`, {
        counselor_id: payload.counselorId || null,
      });
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["counselor-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["user-notifications"] });
    },
  });
};

export const useAddAlertNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { alertId: string; note: string }) => {
      const response = await api.post(`/counselors/alerts/${payload.alertId}/notes`, {
        note: payload.note,
      });
      return response.data;
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["counselor-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-notes", variables.alertId] });
      queryClient.invalidateQueries({ queryKey: ["student-casefile"] });
    },
  });
};
