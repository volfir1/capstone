/*
  Chat hook disabled per project checklist. API calls and auto-refresh
  are preserved here as comments so the feature can be re-enabled later.

import { useState, useEffect, useCallback, useRef } from "react";
import { notifications } from '@mantine/notifications';
import apiClient from "@config/api/apiClient";

export const useChat = (caseId) => {
  // Disabled: return a no-op shape matching the original hook
  return {
    messages: [],
    loading: false,
    sending: false,
    sendMessage: async () => false,
    refreshMessages: async () => {},
  };
};

*/