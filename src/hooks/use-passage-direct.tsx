import { useData } from "@/lib/data-context";

export function usePassageDirect() {
  const { passagesDirects, addPassageDirect, updatePassageDirect, archivePassageDirectsByDate } = useData();
  return { passagesDirects: passagesDirects || [], addPassageDirect, updatePassageDirect, archivePassageDirectsByDate };
}
