import { useState, useCallback } from "react";

const MAX_PARSER_LOGS = 200;

export function useParserLogs() {
  const [parserLogs, setParserLogs] = useState<string[]>([]);

  const addParserLogs = useCallback((newLogs: string[] | ((prev: string[]) => string[])) => {
    setParserLogs(prev => {
      const next = typeof newLogs === "function" ? newLogs(prev) : newLogs;
      const merged = [...prev, ...next];
      return merged.length > MAX_PARSER_LOGS ? merged.slice(-MAX_PARSER_LOGS) : merged;
    });
  }, []);

  return { parserLogs, addParserLogs };
}
